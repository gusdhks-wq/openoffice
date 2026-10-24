import { MAX_IMPORT_BYTES } from '../documents'
import { DriveFailure, SNAPSHOT_MARKER, type DriveRemote, type DriveSnapshot } from './types'

const API = 'https://www.googleapis.com/drive/v3'
const UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3'
const FIELDS = 'id,name,version,modifiedTime,size,appProperties'
const VALID_ID = /^[A-Za-z0-9_-]{1,128}$/

function snapshot(value: unknown): DriveSnapshot {
  const file = value as Record<string, unknown> | null
  const props = file?.appProperties as Record<string, unknown> | undefined
  if (
    !file ||
    typeof file.id !== 'string' ||
    !VALID_ID.test(file.id) ||
    typeof file.name !== 'string' ||
    typeof file.version !== 'string' ||
    !/^\d+$/.test(file.version) ||
    props?.genofficeMobile !== SNAPSHOT_MARKER ||
    typeof props.documentId !== 'string' ||
    !VALID_ID.test(props.documentId) ||
    typeof props.operationId !== 'string' ||
    typeof props.parentKey !== 'string' ||
    !Number.isSafeInteger(Number(file.size)) ||
    Number(file.size) < 0
  )
    throw new DriveFailure('invalid')
  return {
    id: file.id,
    name: file.name,
    version: file.version,
    modifiedTime: String(file.modifiedTime ?? ''),
    size: Number(file.size),
    documentId: props.documentId,
    operationId: props.operationId,
    parentKey: props.parentKey,
  }
}

export function createDriveRemote(
  token: () => string | null,
  fetcher: typeof fetch = fetch,
): DriveRemote {
  async function request(url: string, init: RequestInit = {}): Promise<Response> {
    const accessToken = token()
    if (!accessToken) throw new DriveFailure('auth')
    try {
      const response = await fetcher(url, {
        ...init,
        headers: { ...init.headers, Authorization: `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(30_000),
        redirect: 'error',
        cache: 'no-store',
      })
      if (response.status === 401) throw new DriveFailure('auth')
      return response
    } catch (error) {
      if (error instanceof DriveFailure) throw error
      throw new DriveFailure('network')
    }
  }
  async function json(response: Response): Promise<unknown> {
    if (!response.ok) throw new DriveFailure(response.status === 404 ? 'missing' : 'network')
    try {
      return await response.json()
    } catch {
      throw new DriveFailure('invalid')
    }
  }
  async function metadata(id: string): Promise<DriveSnapshot> {
    if (!VALID_ID.test(id)) throw new DriveFailure('invalid')
    return snapshot(
      await json(await request(`${API}/files/${encodeURIComponent(id)}?fields=${FIELDS}`)),
    )
  }
  async function read(file: DriveSnapshot): Promise<string> {
    if (file.size > MAX_IMPORT_BYTES) throw new DriveFailure('limit')
    const before = await metadata(file.id)
    if (before.version !== file.version) throw new DriveFailure('conflict')
    const response = await request(`${API}/files/${encodeURIComponent(file.id)}?alt=media`)
    if (!response.ok) throw new DriveFailure(response.status === 404 ? 'missing' : 'network')
    if (Number(response.headers.get('content-length')) > MAX_IMPORT_BYTES)
      throw new DriveFailure('limit')
    const reader = response.body?.getReader()
    if (!reader) throw new DriveFailure('invalid')
    const parts: Uint8Array[] = []
    let length = 0
    try {
      while (true) {
        const part = await reader.read()
        if (part.done) break
        length += part.value.byteLength
        if (length > MAX_IMPORT_BYTES) {
          await reader.cancel()
          throw new DriveFailure('limit')
        }
        parts.push(part.value)
      }
    } catch (error) {
      if (error instanceof DriveFailure) throw error
      throw new DriveFailure('network')
    } finally {
      reader.releaseLock()
    }
    const bytes = new Uint8Array(length)
    let offset = 0
    for (const part of parts) {
      bytes.set(part, offset)
      offset += part.byteLength
    }
    const after = await metadata(file.id)
    if (after.version !== before.version) throw new DriveFailure('conflict')
    try {
      return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes)
    } catch {
      throw new DriveFailure('invalid')
    }
  }
  return {
    account: async () => {
      const body = (await json(await request(`${API}/about?fields=user(permissionId)`))) as {
        user?: { permissionId?: string }
      }
      if (!body.user?.permissionId) throw new DriveFailure('invalid')
      return body.user.permissionId
    },
    list: async () => {
      const files: DriveSnapshot[] = []
      let pageToken = ''
      const seen = new Set<string>()
      do {
        const params = new URLSearchParams({
          q: `trashed = false and appProperties has { key='genofficeMobile' and value='${SNAPSHOT_MARKER}' }`,
          spaces: 'drive',
          fields: `nextPageToken,incompleteSearch,files(${FIELDS})`,
          pageSize: '100',
        })
        if (pageToken) params.set('pageToken', pageToken)
        const body = (await json(await request(`${API}/files?${params}`))) as {
          files?: unknown[]
          nextPageToken?: string
          incompleteSearch?: boolean
        }
        if (!Array.isArray(body.files) || body.incompleteSearch) throw new DriveFailure('invalid')
        files.push(...body.files.map(snapshot))
        if (files.length > 1000) throw new DriveFailure('limit')
        pageToken = body.nextPageToken ?? ''
        if (pageToken && seen.has(pageToken)) throw new DriveFailure('invalid')
        seen.add(pageToken)
      } while (pageToken)
      return files
    },
    reserveId: async () => {
      const body = (await json(
        await request(`${API}/files/generateIds?count=1&space=drive&type=files`),
      )) as { ids?: string[] }
      const id = body.ids?.[0]
      if (!id || !VALID_ID.test(id)) throw new DriveFailure('invalid')
      return id
    },
    create: async (upload) => {
      if (
        !VALID_ID.test(upload.fileId) ||
        !VALID_ID.test(upload.documentId) ||
        new TextEncoder().encode(upload.raw).byteLength > MAX_IMPORT_BYTES ||
        !/\.(md|markdown|txt)$/i.test(upload.name)
      )
        throw new DriveFailure('invalid')
      let boundary = `genoffice-${crypto.randomUUID()}`
      while (upload.raw.includes(boundary)) boundary = `genoffice-${crypto.randomUUID()}`
      const data = {
        id: upload.fileId,
        name: upload.name,
        mimeType: 'text/plain',
        appProperties: {
          genofficeMobile: SNAPSHOT_MARKER,
          documentId: upload.documentId,
          operationId: upload.operationId,
          parentKey: upload.parentKey,
        },
      }
      const body = new Blob([
        `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(data)}\r\n--${boundary}\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n`,
        upload.raw,
        `\r\n--${boundary}--\r\n`,
      ])
      const response = await request(`${UPLOAD_API}/files?uploadType=multipart&fields=${FIELDS}`, {
        method: 'POST',
        headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
        body,
      })
      const result =
        response.status === 409 ? await metadata(upload.fileId) : snapshot(await json(response))
      if (
        result.id !== upload.fileId ||
        result.documentId !== upload.documentId ||
        result.operationId !== upload.operationId ||
        result.parentKey !== upload.parentKey ||
        result.name !== upload.name
      )
        throw new DriveFailure('conflict')
      if (response.status === 409 && (await read(result)) !== upload.raw)
        throw new DriveFailure('conflict')
      return result
    },
    read,
  }
}
