import { describe, expect, it, vi } from 'vitest'
import { createDriveRemote } from '../src/renderer/drive/remote'
import { validateToken } from '../src/renderer/drive/auth'
import {
  MOBILE_DRIVE_SCOPE,
  type DriveSnapshot,
  type PendingUpload,
} from '../src/renderer/drive/types'
import { MAX_IMPORT_BYTES } from '../src/renderer/documents'

const pending: PendingUpload = {
  accountId: 'account-a',
  documentId: 'doc-1',
  fileId: 'file-1',
  operationId: 'op-1',
  parentKey: '',
  name: 'note.md',
  raw: '\uFEFFhello\r\n',
}
function metadata(version = '1') {
  return {
    id: pending.fileId,
    name: pending.name,
    version,
    size: String(new TextEncoder().encode(pending.raw).length),
    modifiedTime: '2026-10-23T00:00:00Z',
    appProperties: {
      genofficeMobile: '1',
      documentId: pending.documentId,
      operationId: pending.operationId,
      parentKey: pending.parentKey,
    },
  }
}
const file: DriveSnapshot = {
  id: pending.fileId,
  name: pending.name,
  version: '1',
  size: 10,
  documentId: pending.documentId,
  operationId: pending.operationId,
  parentKey: '',
  modifiedTime: '',
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

describe('Drive HTTP boundary', () => {
  it('sends credentials only to fixed Google endpoints and disallows redirects and caching', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(json({ user: { permissionId: 'account-a' } }))
    expect(await createDriveRemote(() => 'test-access-token', fetcher).account()).toBe('account-a')
    expect(fetcher).toHaveBeenCalledWith(
      'https://www.googleapis.com/drive/v3/about?fields=user(permissionId)',
      expect.objectContaining({
        headers: { Authorization: 'Bearer test-access-token' },
        redirect: 'error',
        cache: 'no-store',
      }),
    )
  })
  it('does not call Google without a token and classifies an expired token', async () => {
    const fetcher = vi.fn<typeof fetch>()
    await expect(createDriveRemote(() => null, fetcher).account()).rejects.toThrow('drive-auth')
    expect(fetcher).not.toHaveBeenCalled()
    fetcher.mockResolvedValue(new Response('', { status: 401 }))
    await expect(createDriveRemote(() => 'test', fetcher).account()).rejects.toThrow('drive-auth')
  })
  it('lists all pages of app-created snapshots with a fixed private-property query', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(json({ files: [metadata()], nextPageToken: 'next-token' }))
      .mockResolvedValueOnce(json({ files: [] }))
    expect(await createDriveRemote(() => 'test', fetcher).list()).toHaveLength(1)
    const first = new URL(String(fetcher.mock.calls[0][0]))
    expect(first.searchParams.get('q')).toContain("key='genofficeMobile'")
    expect(new URL(String(fetcher.mock.calls[1][0])).searchParams.get('pageToken')).toBe(
      'next-token',
    )
  })
  it('rejects incomplete searches and repeated page tokens rather than choosing a partial head', async () => {
    const incomplete = vi
      .fn<typeof fetch>()
      .mockResolvedValue(json({ files: [], incompleteSearch: true }))
    await expect(createDriveRemote(() => 'test', incomplete).list()).rejects.toThrow(
      'drive-invalid',
    )
    const repeated = vi
      .fn<typeof fetch>()
      .mockImplementation(async () => json({ files: [], nextPageToken: 'repeat' }))
    await expect(createDriveRemote(() => 'test', repeated).list()).rejects.toThrow('drive-invalid')
    expect(repeated).toHaveBeenCalledTimes(2)
  })
  it('reserves a stable ID and rejects an invalid generated ID', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(json({ ids: ['stable-id'] }))
      .mockResolvedValueOnce(json({ ids: ['https://evil.test'] }))
    const remote = createDriveRemote(() => 'test', fetcher)
    expect(await remote.reserveId()).toBe('stable-id')
    await expect(remote.reserveId()).rejects.toThrow('drive-invalid')
  })
  it('uploads only by creating a new file using the reserved ID and captured source bytes', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(json(metadata()))
    const saved = await createDriveRemote(() => 'test', fetcher).create(pending)
    expect(saved.id).toBe(pending.fileId)
    const [url, options] = fetcher.mock.calls[0]
    expect(url).toContain('uploadType=multipart')
    expect(options?.method).toBe('POST')
    const body = await (options?.body as Blob).text()
    expect(body).toContain('"id":"file-1"')
    expect(body).toContain('"operationId":"op-1"')
    // Blob.text strips a leading BOM only at the start of the entire multipart body.
    expect(body).toContain(pending.raw)
    expect(fetcher).toHaveBeenCalledTimes(1)
  })
  it('verifies existing metadata and bytes after an idempotent create returns 409', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response('', { status: 409 }))
      .mockResolvedValueOnce(json(metadata()))
      .mockResolvedValueOnce(json(metadata()))
      .mockResolvedValueOnce(new Response(new TextEncoder().encode(pending.raw)))
      .mockResolvedValueOnce(json(metadata()))
    expect((await createDriveRemote(() => 'test', fetcher).create(pending)).id).toBe('file-1')
    expect(fetcher).toHaveBeenCalledTimes(5)
  })
  it('does not adopt a reserved ID occupied by another operation', async () => {
    const occupied = metadata()
    occupied.appProperties.operationId = 'unrelated'
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response('', { status: 409 }))
      .mockResolvedValueOnce(json(occupied))
    await expect(createDriveRemote(() => 'test', fetcher).create(pending)).rejects.toThrow(
      'drive-conflict',
    )
    expect(fetcher).toHaveBeenCalledTimes(2)
  })
  it('rejects changing remote versions during a download', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(json(metadata()))
      .mockResolvedValueOnce(new Response('hello'))
      .mockResolvedValueOnce(json(metadata('2')))
    await expect(createDriveRemote(() => 'test', fetcher).read(file)).rejects.toThrow(
      'drive-conflict',
    )
  })
  it('stops a streamed oversized download even when the server omits content length', async () => {
    const cancel = vi.fn()
    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array(MAX_IMPORT_BYTES + 1))
      },
      cancel,
    })
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(json(metadata()))
      .mockResolvedValueOnce(new Response(body))
    await expect(createDriveRemote(() => 'test', fetcher).read(file)).rejects.toThrow('drive-limit')
    expect(cancel).toHaveBeenCalledOnce()
  })
  it('rejects invalid UTF-8 without replacing it in the downloaded document', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(json(metadata()))
      .mockResolvedValueOnce(new Response(new Uint8Array([0xff])))
      .mockResolvedValueOnce(json(metadata()))
    await expect(createDriveRemote(() => 'test', fetcher).read(file)).rejects.toThrow(
      'drive-invalid',
    )
  })
  it('does not include provider response bodies in surfaced failures', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response('sensitive provider details', { status: 500 }))
    await expect(createDriveRemote(() => 'test', fetcher).list()).rejects.toThrow(/^drive-network$/)
  })
})

describe('Google token validation', () => {
  it('requires the requested per-file scope and a positive expiry', () => {
    for (const value of [
      { access_token: 'test', scope: 'openid', expires_in: 3600 },
      { access_token: 'test', scope: MOBILE_DRIVE_SCOPE, expires_in: 0 },
      { error: 'access_denied' },
    ]) {
      expect(() => validateToken(value)).toThrow('drive-auth')
    }
    const session = validateToken({
      access_token: 'test',
      scope: MOBILE_DRIVE_SCOPE,
      expires_in: '3600',
    })
    expect(session.accessToken).toBe('test')
    expect(session.expiresAt).toBeLessThanOrEqual(Date.now() + 2700_000)
  })
})
