import {
  DocumentFailure,
  type CreateInput,
  type UpdateInput,
  type RestoreInput,
  type ShareInput,
  type DocumentInfo,
  type DocumentView,
  type VersionInfo,
  type FailureCode,
} from './contracts'
export * from './contracts'

export function cloudOrigin(value: string): string {
  const url = new URL(value)
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
  if (
    (url.protocol !== 'https:' && !(url.protocol === 'http:' && local)) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== '/'
  )
    throw new DocumentFailure('invalid')
  return url.origin
}

export class CloudDocumentsClient {
  readonly origin: string
  workspaceId: string | null = null
  constructor(
    origin: string,
    private readonly token: () => string | null,
    private readonly fetcher: typeof fetch = fetch,
  ) {
    this.origin = cloudOrigin(origin)
  }
  private async request<T>(path: string, method = 'GET', data?: unknown): Promise<T> {
    if (data && !this.workspaceId) await this.connect()
    const token = this.token()
    if (!token) throw new DocumentFailure('unauthorized')
    let response: Response
    try {
      response = await this.fetcher.call(globalThis, `${this.origin}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          ...(this.workspaceId ? { 'X-Genoffice-Workspace': this.workspaceId } : {}),
          ...(data ? { 'Content-Type': 'application/json' } : {}),
        },
        body: data ? JSON.stringify(data) : undefined,
        redirect: 'error',
        cache: 'no-store',
        signal: AbortSignal.timeout(30_000),
      })
    } catch {
      throw new DocumentFailure('network')
    }
    let body: unknown
    try {
      body = await response.json()
    } catch {
      throw new DocumentFailure('network')
    }
    if (!response.ok) {
      const failure = body as { error?: FailureCode; currentRevision?: string }
      const codes: FailureCode[] = [
        'invalid',
        'unauthorized',
        'not-found',
        'conflict',
        'idempotency-conflict',
        'limit',
        'storage',
        'network',
      ]
      throw new DocumentFailure(
        codes.includes(failure.error!) ? failure.error! : 'network',
        failure.currentRevision,
      )
    }
    return body as T
  }
  async connect(): Promise<{ role: 'owner' | 'agent'; workspaceId: string }> {
    const result = await this.request<{ role: 'owner' | 'agent'; workspaceId: string }>(
      '/v1/connection',
    )
    if (
      !['owner', 'agent'].includes(result.role) ||
      typeof result.workspaceId !== 'string' ||
      !/^[A-Za-z0-9_-]{1,128}$/.test(result.workspaceId)
    )
      throw new DocumentFailure('invalid')
    this.workspaceId = result.workspaceId
    return result
  }
  async list(query = '') {
    return (
      await this.request<{ documents: DocumentInfo[] }>(
        `/v1/documents?query=${encodeURIComponent(query)}`,
      )
    ).documents
  }
  async read(id: string, revision?: string) {
    return (
      await this.request<{ document: DocumentView }>(
        `/v1/documents/${encodeURIComponent(id)}${revision ? `?revision=${encodeURIComponent(revision)}` : ''}`,
      )
    ).document
  }
  async create(input: CreateInput) {
    return (await this.request<{ document: DocumentView }>('/v1/documents', 'POST', input)).document
  }
  async update(id: string, input: UpdateInput) {
    return (
      await this.request<{ document: DocumentView }>(
        `/v1/documents/${encodeURIComponent(id)}`,
        'PUT',
        input,
      )
    ).document
  }
  async restore(id: string, input: RestoreInput) {
    return (
      await this.request<{ document: DocumentView }>(
        `/v1/documents/${encodeURIComponent(id)}/restore`,
        'POST',
        input,
      )
    ).document
  }
  async share(id: string, input: ShareInput) {
    return (
      await this.request<{ document: DocumentView }>(
        `/v1/documents/${encodeURIComponent(id)}/share`,
        'POST',
        input,
      )
    ).document
  }
  async versions(id: string) {
    return (
      await this.request<{ versions: VersionInfo[] }>(
        `/v1/documents/${encodeURIComponent(id)}/versions`,
      )
    ).versions
  }
}
