import { Capacitor, registerPlugin } from '@capacitor/core'
import { DriveFailure, MOBILE_DRIVE_SCOPE } from './types'

export interface DriveSession {
  accessToken: string
  expiresAt: number
}
interface TokenResponse {
  access_token?: string
  expires_in?: number | string
  scope?: string
  error?: string
}
interface GoogleOAuth {
  accounts: {
    oauth2: {
      initTokenClient(options: {
        client_id: string
        scope: string
        include_granted_scopes: boolean
        callback: (response: TokenResponse) => void
        error_callback: () => void
      }): { requestAccessToken(options: { prompt: string }): void }
    }
  }
}
interface NativeAuthorization {
  authorize(): Promise<{ accessToken: string; scopes: string[] }>
}
const NativeDrive = registerPlugin<NativeAuthorization>('DriveAuthorization')
let sdk: Promise<GoogleOAuth> | null = null

export function validateToken(response: TokenResponse): DriveSession {
  const seconds = Number(response.expires_in)
  if (
    response.error ||
    !response.access_token ||
    !response.scope?.split(/\s+/).includes(MOBILE_DRIVE_SCOPE) ||
    !Number.isFinite(seconds) ||
    seconds <= 0
  )
    throw new DriveFailure('auth')
  return {
    accessToken: response.access_token,
    expiresAt: Date.now() + Math.min(seconds, 2700) * 1000,
  }
}

function loadGoogle(): Promise<GoogleOAuth> {
  if (sdk) return sdk
  sdk = new Promise<GoogleOAuth>((resolve, reject) => {
    const script = document.createElement('script')
    const timeout = setTimeout(() => {
      script.remove()
      reject(new DriveFailure('network'))
    }, 15_000)
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.onload = () => {
      clearTimeout(timeout)
      const google = (globalThis as typeof globalThis & { google?: GoogleOAuth }).google
      if (google?.accounts.oauth2) resolve(google)
      else reject(new DriveFailure('auth'))
    }
    script.onerror = () => {
      clearTimeout(timeout)
      script.remove()
      reject(new DriveFailure('network'))
    }
    document.head.append(script)
  }).catch((error) => {
    sdk = null
    throw error
  })
  return sdk
}

/** Access tokens stay in memory; neither refresh tokens nor client secrets are used. */
export async function authorizeDrive(): Promise<DriveSession> {
  if (Capacitor.getPlatform() === 'android') {
    const result = await NativeDrive.authorize()
    return validateToken({
      access_token: result.accessToken,
      scope: result.scopes.join(' '),
      expires_in: 2700,
    })
  }
  if (Capacitor.isNativePlatform()) throw new DriveFailure('auth')
  const clientId = import.meta.env.VITE_GOOGLE_DRIVE_CLIENT_ID as string | undefined
  if (!clientId || !/^[\w.-]+\.apps\.googleusercontent\.com$/.test(clientId))
    throw new DriveFailure('auth')
  const google = await loadGoogle()
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new DriveFailure('auth')), 120_000)
    const client = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: MOBILE_DRIVE_SCOPE,
      include_granted_scopes: false,
      callback: (response) => {
        clearTimeout(timeout)
        try {
          resolve(validateToken(response))
        } catch {
          reject(new DriveFailure('auth'))
        }
      },
      error_callback: () => {
        clearTimeout(timeout)
        reject(new DriveFailure('auth'))
      },
    })
    client.requestAccessToken({ prompt: 'select_account' })
  })
}

export async function revokeDrive(
  session: DriveSession,
  fetcher: typeof fetch = fetch,
): Promise<void> {
  try {
    const response = await fetcher('https://oauth2.googleapis.com/revoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ token: session.accessToken }),
      signal: AbortSignal.timeout(20_000),
      redirect: 'error',
      cache: 'no-store',
    })
    if (!response.ok) throw new DriveFailure('network')
  } catch {
    throw new DriveFailure('network')
  }
}
