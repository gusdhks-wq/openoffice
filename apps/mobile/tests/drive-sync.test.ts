import 'fake-indexeddb/auto'
import { afterEach, describe, expect, it } from 'vitest'
import { exportDocument, importDocument, updateDocument } from '../src/renderer/documents'
import { openDocumentStore, type DocumentStore } from '../src/renderer/store'
import { openDriveSnapshot, synchronizeDocument } from '../src/renderer/drive/sync'
import {
  DriveFailure,
  snapshotHeads,
  type DriveRemote,
  type DriveSnapshot,
  type PendingUpload,
} from '../src/renderer/drive/types'

class MemoryRemote implements DriveRemote {
  owner = 'account-a'
  files = new Map<string, { snapshot: DriveSnapshot; raw: string }>()
  reserved = 0
  loseResponse = false
  onCreate?: (upload: PendingUpload) => Promise<void>
  onRead?: () => Promise<void>
  async account() {
    return this.owner
  }
  async list() {
    return [...this.files.values()].map((entry) => ({ ...entry.snapshot }))
  }
  async reserveId() {
    return `file-${++this.reserved}`
  }
  async create(upload: PendingUpload) {
    await this.onCreate?.(upload)
    const existing = this.files.get(upload.fileId)
    if (!existing)
      this.files.set(upload.fileId, {
        raw: upload.raw,
        snapshot: {
          id: upload.fileId,
          name: upload.name,
          version: '1',
          modifiedTime: '2026-10-23T00:00:00Z',
          documentId: upload.documentId,
          operationId: upload.operationId,
          parentKey: upload.parentKey,
          size: new TextEncoder().encode(upload.raw).length,
        },
      })
    if (this.loseResponse) {
      this.loseResponse = false
      throw new DriveFailure('network')
    }
    return { ...this.files.get(upload.fileId)!.snapshot }
  }
  async read(snapshot: DriveSnapshot) {
    await this.onRead?.()
    return this.files.get(snapshot.id)!.raw
  }
}
const stores: DocumentStore[] = []
async function setup() {
  const name = crypto.randomUUID()
  const store = await openDocumentStore(name)
  stores.push(store)
  const doc = importDocument('note.md', new TextEncoder().encode('\uFEFF# 제목\r\n본문\r\n'))
  await store.save(doc)
  return { name, store, doc, remote: new MemoryRemote() }
}
const get = async (store: DocumentStore, id: string) =>
  (await store.list()).find((doc) => doc.id === id)!
afterEach(() => stores.splice(0).forEach((store) => store.close()))

describe('durable append-only Drive synchronization', () => {
  it('persists the reserved upload ID before sending and preserves source bytes', async () => {
    const { store, doc, remote } = await setup()
    remote.onCreate = async (upload) =>
      expect((await get(store, doc.id)).pendingUpload).toEqual(upload)
    expect(await synchronizeDocument(store, doc.id, remote)).toBe('synced')
    const saved = await get(store, doc.id)
    expect(saved.pendingUpload).toBeUndefined()
    expect(saved.drive?.raw).toBe(exportDocument(doc))
    expect(remote.files.get(saved.drive!.fileId)!.raw).toBe(exportDocument(doc))
  })
  it('reopens and retries the same reserved ID after an accepted upload loses its response', async () => {
    const { name, store, doc, remote } = await setup()
    remote.loseResponse = true
    await expect(synchronizeDocument(store, doc.id, remote)).rejects.toThrow('drive-network')
    const pending = (await get(store, doc.id)).pendingUpload!
    store.close()
    const reopened = await openDocumentStore(name)
    stores.push(reopened)
    expect(await synchronizeDocument(reopened, doc.id, remote)).toBe('synced')
    expect(remote.reserved).toBe(1)
    expect(remote.files.size).toBe(1)
    expect((await get(reopened, doc.id)).drive?.fileId).toBe(pending.fileId)
  })
  it('adds a new file for an edit and never overwrites the previous snapshot', async () => {
    const { store, doc, remote } = await setup()
    await synchronizeDocument(store, doc.id, remote)
    const first = await get(store, doc.id)
    await store.save(updateDocument(first, 'changed'))
    await synchronizeDocument(store, doc.id, remote)
    const latest = await get(store, doc.id)
    expect(remote.files.size).toBe(2)
    expect(remote.files.get(first.drive!.fileId)!.raw).toBe(exportDocument(doc))
    expect(latest.drive?.fileId).not.toBe(first.drive?.fileId)
    expect(snapshotHeads(await remote.list())).toHaveLength(1)
  })
  it('retains both branches when two devices edit the same base', async () => {
    const { store, doc, remote } = await setup()
    await synchronizeDocument(store, doc.id, remote)
    const base = await get(store, doc.id)
    const second = await openDocumentStore(crypto.randomUUID())
    stores.push(second)
    await second.save(base, 0)
    await store.save(updateDocument(base, 'device one'))
    await second.save(updateDocument(base, 'device two'))
    expect(await synchronizeDocument(store, doc.id, remote)).toBe('synced')
    expect(await synchronizeDocument(second, doc.id, remote)).toBe('conflict')
    const heads = snapshotHeads(await remote.list())
    expect(heads).toHaveLength(2)
    expect(new Set(await Promise.all(heads.map((head) => remote.read(head))))).toEqual(
      new Set(['\uFEFFdevice one\r\n', '\uFEFFdevice two\r\n']),
    )
  })
  it('downloads a unique newer head when local content has not changed', async () => {
    const { store, doc, remote } = await setup()
    await synchronizeDocument(store, doc.id, remote)
    const base = await get(store, doc.id)
    await remote.create({
      accountId: 'account-a',
      documentId: doc.id,
      fileId: 'external',
      operationId: 'change',
      parentKey: `${base.drive!.fileId}:${base.drive!.fileVersion}`,
      name: 'note.md',
      raw: '\uFEFF원격 수정\r\n',
    })
    await synchronizeDocument(store, doc.id, remote)
    expect(exportDocument(await get(store, doc.id))).toBe('\uFEFF원격 수정\r\n')
  })
  it('does not overwrite a local edit made while the remote download was running', async () => {
    const { store, doc, remote } = await setup()
    await synchronizeDocument(store, doc.id, remote)
    const base = await get(store, doc.id)
    await remote.create({
      accountId: 'account-a',
      documentId: doc.id,
      fileId: 'external',
      operationId: 'change',
      parentKey: `${base.drive!.fileId}:1`,
      name: 'note.md',
      raw: 'remote',
    })
    remote.onRead = async () => {
      const current = await get(store, doc.id)
      await store.save(updateDocument(current, 'local typing'))
    }
    await expect(synchronizeDocument(store, doc.id, remote)).rejects.toThrow('drive-conflict')
    expect((await get(store, doc.id)).text).toBe('local typing')
  })
  it('keeps typing performed while an upload is in flight for the next sync', async () => {
    const { store, doc, remote } = await setup()
    remote.onCreate = async () => {
      const current = await get(store, doc.id)
      await store.save(updateDocument(current, 'typed during upload'))
    }
    await synchronizeDocument(store, doc.id, remote)
    const latest = await get(store, doc.id)
    expect(latest.text).toBe('typed during upload')
    expect(latest.drive?.raw).toBe(exportDocument(doc))
    remote.onCreate = undefined
    await synchronizeDocument(store, doc.id, remote)
    expect((await get(store, doc.id)).drive?.raw).toBe('\uFEFFtyped during upload\r\n')
  })
  it('refuses to upload a bound document or queued transfer to another account', async () => {
    const { store, doc, remote } = await setup()
    remote.loseResponse = true
    await expect(synchronizeDocument(store, doc.id, remote)).rejects.toThrow()
    remote.owner = 'account-b'
    await expect(synchronizeDocument(store, doc.id, remote)).rejects.toThrow('drive-account')
    expect(remote.files.size).toBe(1)
    remote.owner = 'account-a'
    await synchronizeDocument(store, doc.id, remote)
    remote.owner = 'account-b'
    await expect(synchronizeDocument(store, doc.id, remote)).rejects.toThrow('drive-account')
  })
  it('does not propagate a remote deletion to the local document', async () => {
    const { store, doc, remote } = await setup()
    await synchronizeDocument(store, doc.id, remote)
    remote.files.clear()
    await expect(synchronizeDocument(store, doc.id, remote)).rejects.toThrow('drive-missing')
    expect(exportDocument(await get(store, doc.id))).toBe(exportDocument(doc))
  })
  it('opening a remote version preserves an already edited local document', async () => {
    const { store, doc, remote } = await setup()
    await synchronizeDocument(store, doc.id, remote)
    const current = await get(store, doc.id)
    await store.save(updateDocument(current, 'unsent local draft'))
    const file = (await remote.list())[0]
    // Open the remote base separately instead of replacing or hiding the local draft.
    const openedId = await openDriveSnapshot(store, file, remote)
    expect(openedId).not.toBe(doc.id)
    expect(exportDocument(await get(store, openedId))).toBe(exportDocument(doc))
    expect((await get(store, doc.id)).text).toBe('unsent local draft')
    const other = await openDocumentStore(crypto.randomUUID())
    stores.push(other)
    const id = await openDriveSnapshot(other, file, remote)
    expect(exportDocument(await get(other, id))).toBe(exportDocument(doc))
  })
  it('treats an externally modified historical file as a separate visible head', async () => {
    const { store, doc, remote } = await setup()
    await synchronizeDocument(store, doc.id, remote)
    const base = await get(store, doc.id)
    await store.save(updateDocument(base, 'new local version'))
    await synchronizeDocument(store, doc.id, remote)
    remote.files.get(base.drive!.fileId)!.snapshot.version = '2'
    remote.files.get(base.drive!.fileId)!.raw = 'desktop edit of older file'
    expect(snapshotHeads(await remote.list())).toHaveLength(2)
    expect(await synchronizeDocument(store, doc.id, remote)).toBe('conflict')
  })
})
