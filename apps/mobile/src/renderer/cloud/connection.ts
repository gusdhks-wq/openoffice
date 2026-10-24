import { cloudOrigin, DocumentFailure } from '@genoffice/cloud-documents/browser'

const addressKey = 'genoffice-mobile-document-server'

/** Accept the copied MCP endpoint too, but never accept credentials or query parameters. */
export function connectionAddress(value: string): string {
  const url = new URL(value.trim())
  if (url.pathname === '/mcp' || url.pathname === '/mcp/') url.pathname = '/'
  return cloudOrigin(url.href)
}
export function previousAddress(): string {
  try {
    const current = window.location
    if (
      current.protocol === 'https:' &&
      !['localhost', '127.0.0.1', '[::1]'].includes(current.hostname)
    )
      return connectionAddress(current.origin)
    return connectionAddress(localStorage.getItem(addressKey) || '')
  } catch {
    return ''
  }
}
export function rememberAddress(value: string): void {
  try {
    localStorage.setItem(addressKey, connectionAddress(value))
  } catch {
    /* Storage is optional. */
  }
}
export async function pairPhone(address: string, code: string): Promise<string> {
  if (!/^[0-9]{8}$/.test(code.trim())) throw new DocumentFailure('unauthorized')
  let response: Response
  try {
    response = await fetch(`${connectionAddress(address)}/pair`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: code.trim() }),
      redirect: 'error',
      cache: 'no-store',
      signal: AbortSignal.timeout(30_000),
    })
  } catch {
    throw new DocumentFailure('network')
  }
  if (!response.ok) throw new DocumentFailure('unauthorized')
  const value = (await response.json()) as { token?: unknown }
  if (typeof value.token !== 'string' || !/^phone_[a-f0-9]{64}$/.test(value.token))
    throw new DocumentFailure('invalid')
  return value.token
}
export async function disconnectPhone(address: string, token: string | null): Promise<void> {
  if (!token?.startsWith('phone_')) return
  try {
    await fetch(`${connectionAddress(address)}/pair/disconnect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: '{}',
      redirect: 'error',
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    })
  } catch {
    /* Discard the local credential even if the server is offline. */
  }
}
