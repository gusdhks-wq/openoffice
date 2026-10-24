import express from 'express'
import { approvalMessages, approvalLanguage } from './remote-strings.mjs'
import { randomBytes, randomInt, createHash, timingSafeEqual } from 'node:crypto'
import { mcpAuthRouter } from '@modelcontextprotocol/sdk/server/auth/router.js'
import {
  InvalidClientError,
  InvalidGrantError,
  InvalidTokenError,
  InvalidScopeError,
  InvalidTargetError,
} from '@modelcontextprotocol/sdk/server/auth/errors.js'

const digest = (text) => createHash('sha256').update(String(text)).digest('hex')
const secret = () => randomBytes(32).toString('hex')
function equal(a, b) {
  const x = Buffer.from(String(a)),
    y = Buffer.from(String(b))
  return x.length === y.length && timingSafeEqual(x, y)
}
export function allowedChatGPTRedirect(value) {
  try {
    const url = new URL(value)
    return (
      url.origin === 'https://chatgpt.com' &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash &&
      (['/connector_platform_oauth_redirect', '/connector_platform/oauth/callback'].includes(
        url.pathname,
      ) ||
        /^\/connector\/oauth\/[A-Za-z0-9_-]{1,128}$/.test(url.pathname))
    )
  } catch {
    return false
  }
}

/** Temporary, single-owner approval. No OpenAI credentials, password form or model calls. */
export function createRemoteOAuth({ origin, onApprovalCode, now = () => Date.now() }) {
  if (new URL(origin).origin !== origin || !origin.startsWith('https://'))
    throw new Error('HTTPS origin required.')
  const resource = `${origin}/mcp`,
    clients = new Map(),
    pending = new Map(),
    codes = new Map(),
    access = new Map(),
    refresh = new Map()
  const app = express()
  app.disable('x-powered-by')
  const expires = (item) => !item || item.expires <= now()
  function clean() {
    for (const map of [pending, codes, access, refresh])
      for (const [key, item] of map) if (expires(item)) map.delete(key)
  }
  function target(value) {
    if (value && value.href !== resource) throw new InvalidTargetError('Wrong document resource.')
  }
  function scopes(values) {
    if (values?.some((scope) => scope !== 'documents:shared' && scope !== 'offline_access'))
      throw new InvalidScopeError('Unsupported scope.')
  }
  function tokens(clientId, family = secret()) {
    clean()
    if (access.size >= 256 || refresh.size >= 256)
      throw new InvalidGrantError('Connection limit reached.')
    const token = secret(),
      renewal = secret()
    access.set(digest(token), { clientId, family, expires: now() + 3600000 })
    refresh.set(digest(renewal), { clientId, family, expires: now() + 86400000 })
    return {
      access_token: token,
      token_type: 'Bearer',
      expires_in: 3600,
      refresh_token: renewal,
      scope: 'documents:shared offline_access',
    }
  }
  const clientsStore = {
    getClient: (id) => clients.get(id),
    registerClient: (client) => {
      if (
        clients.size >= 32 ||
        !client.redirect_uris?.length ||
        !client.redirect_uris.every(allowedChatGPTRedirect)
      )
        throw new InvalidClientError('Only ChatGPT callback URLs are allowed.')
      const registered = {
        ...client,
        client_id: secret(),
        client_id_issued_at: Math.floor(now() / 1000),
      }
      clients.set(registered.client_id, registered)
      return registered
    },
  }
  const provider = {
    clientsStore,
    async authorize(client, params, res) {
      clean()
      target(params.resource)
      scopes(params.scopes)
      if (pending.size >= 16) throw new InvalidGrantError('Too many pending approvals.')
      const id = secret(),
        browser = secret(),
        approval = String(randomInt(10000000, 100000000))
      pending.set(id, {
        clientId: client.client_id,
        params,
        browser: digest(browser),
        approval: digest(approval),
        attempts: 0,
        expires: now() + 180000,
      })
      res.cookie('__Host-documents-consent', browser, {
        secure: true,
        httpOnly: true,
        sameSite: 'strict',
        path: '/',
        maxAge: 180000,
      })
      res.set({
        'Cache-Control': 'no-store',
        // Keep the consent POST Origin; no-referrer makes Chromium send Origin: null.
        // Same-origin still withholds the consent URL from the external callback.
        'Referrer-Policy': 'same-origin',
        // Chromium also applies form-action to the successful approval redirect.
        'Content-Security-Policy': `default-src 'none'; form-action 'self' ${new URL(params.redirectUri).href}; frame-ancestors 'none'; base-uri 'none'`,
      })
      const lang = approvalLanguage(res.req.headers['accept-language'])
      const [title, details, label, button, warning] = approvalMessages[lang]
      res
        .type('html')
        .send(
          `<html lang="${lang}"><meta charset="utf-8"><title>${title}</title><h1>${title}</h1><p>${details}</p><form method="post" action="/approve"><input type="hidden" name="request" value="${id}"><label>${label} <input name="code" inputmode="numeric" pattern="[0-9]{8}" autocomplete="one-time-code" required></label><button>${button}</button></form><p>${warning}</p></html>`,
        )
      onApprovalCode(approval)
    },
    async challengeForAuthorizationCode(client, code) {
      const item = codes.get(digest(code))
      if (expires(item) || item.clientId !== client.client_id)
        throw new InvalidGrantError('Invalid code.')
      return item.params.codeChallenge
    },
    async exchangeAuthorizationCode(client, code, _verifier, redirectUri, requestedResource) {
      const key = digest(code),
        item = codes.get(key)
      if (
        expires(item) ||
        item.clientId !== client.client_id ||
        (redirectUri && redirectUri !== item.params.redirectUri)
      )
        throw new InvalidGrantError('Invalid code.')
      target(requestedResource)
      codes.delete(key)
      return tokens(client.client_id)
    },
    async exchangeRefreshToken(client, token, requestedScopes, requestedResource) {
      target(requestedResource)
      scopes(requestedScopes)
      const key = digest(token),
        item = refresh.get(key)
      if (expires(item) || item.clientId !== client.client_id)
        throw new InvalidGrantError('Invalid refresh token.')
      refresh.delete(key)
      return tokens(client.client_id, item.family)
    },
    async verifyAccessToken(token) {
      const item = access.get(digest(token))
      if (expires(item)) throw new InvalidTokenError('Invalid or expired token.')
      return {
        token,
        clientId: item.clientId,
        scopes: ['documents:shared'],
        expiresAt: Math.floor(item.expires / 1000),
        resource: new URL(resource),
      }
    },
    async revokeToken(client, request) {
      const key = digest(request.token),
        item = access.get(key) || refresh.get(key)
      if (!item || item.clientId !== client.client_id) return
      for (const map of [access, refresh])
        for (const [id, value] of map) if (value.family === item.family) map.delete(id)
    },
  }
  app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('Referrer-Policy', 'no-referrer')
    next()
  })
  app.use(
    mcpAuthRouter({
      provider,
      issuerUrl: new URL(origin),
      resourceServerUrl: new URL(resource),
      scopesSupported: ['documents:shared', 'offline_access'],
    }),
  )
  app.post('/approve', express.urlencoded({ extended: false, limit: '2kb' }), (req, res) => {
    clean()
    const item = pending.get(req.body.request)
    const browser = /(?:^|;\s*)__Host-documents-consent=([a-f0-9]{64})(?:;|$)/.exec(
      req.headers.cookie || '',
    )?.[1]
    if (
      req.headers.origin !== origin ||
      expires(item) ||
      !browser ||
      !equal(digest(browser), item.browser)
    ) {
      res.status(403).end()
      return
    }
    item.attempts++
    if (item.attempts > 5 || !equal(digest(req.body.code), item.approval)) {
      if (item.attempts >= 5) pending.delete(req.body.request)
      res
        .status(403)
        .type('text')
        .send('Approval refused. Start a new connection and use the code on your PC.')
      return
    }
    pending.delete(req.body.request)
    const code = secret()
    codes.set(digest(code), {
      clientId: item.clientId,
      params: item.params,
      expires: now() + 60000,
    })
    const redirect = new URL(item.params.redirectUri)
    redirect.searchParams.set('code', code)
    if (item.params.state) redirect.searchParams.set('state', item.params.state)
    res.clearCookie('__Host-documents-consent', {
      secure: true,
      httpOnly: true,
      sameSite: 'strict',
      path: '/',
    })
    res.redirect(303, redirect.href)
  })
  app.use((_req, res) => res.status(404).end())
  app.use((_error, _req, res, _next) => res.status(400).json({ error: 'invalid_request' }))
  return { handler: app, verify: provider.verifyAccessToken, resource, provider }
}
