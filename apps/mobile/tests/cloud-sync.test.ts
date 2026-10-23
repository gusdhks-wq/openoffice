import 'fake-indexeddb/auto'
import { afterEach, describe, expect, it } from 'vitest'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  CloudDocumentsClient,
  type CreateInput,
  type UpdateInput,
  type RestoreInput,
  type ShareInput,
} from '@genoffice/cloud-documents/browser'
import { CloudDocumentStore } from '../../../packages/cloud-documents/src/store'
import { openDocumentStore, type DocumentStore } from '../src/renderer/store'
import { importDocument, updateDocument, exportDocument } from '../src/renderer/documents'
import {
  syncCloudDocument,
  copyCloudDocument,
  openCloudDocument,
  shareCloudDocument,
  restoreCloudDocument,
} from '../src/renderer/cloud/sync'
const cleanup: (() => void | Promise<void>)[] = []
afterEach(async () => {
  for (const close of cleanup.splice(0).reverse()) await close()
})
async function setup() {
  const directory = await mkdtemp(join(tmpdir(), 'genoffice-mobile-cloud-'))
  cleanup.push(() => rm(directory, { recursive: true, force: true }))
  const remote = await CloudDocumentStore.open(directory)
  cleanup.push(() => remote.close())
  const storeName = crypto.randomUUID()
  const local = await openDocumentStore(storeName)
  cleanup.push(() => local.close())
  const doc = importDocument('note.md', new TextEncoder().encode('\uFEFF# 원문\r\n본문\r\n'))
  await local.save(doc)
  let loseResponse = false
  class LocalClient extends CloudDocumentsClient {
    constructor() {
      super('https://documents.example.com', () => 'test')
      this.workspaceId = remote.workspaceId
    }
    override async connect() {
      this.workspaceId = remote.workspaceId
      return { role: 'owner' as const, workspaceId: remote.workspaceId }
    }
    override async list(query = '') {
      return remote.list('owner', query)
    }
    override async read(id: string, revision?: string) {
      return remote.read('owner', id, revision)
    }
    override async create(input: CreateInput) {
      const result = await remote.create('owner', input)
      if (loseResponse) {
        loseResponse = false
        throw new Error('lost-response')
      }
      return result
    }
    override async update(id: string, input: UpdateInput) {
      return remote.update('owner', id, input)
    }
    override async share(id: string, input: ShareInput) {
      return remote.share('owner', id, input)
    }
    override async restore(id: string, input: RestoreInput) {
      return remote.restore('owner', id, input)
    }
    override async versions(id: string) {
      return remote.versions('owner', id)
    }
  }
  return {
    local,
    storeName,
    remote,
    doc,
    client: new LocalClient(),
    loseNext: () => {
      loseResponse = true
    },
  }
}
async function get(store: DocumentStore, id: string) {
  return (await store.list()).find((doc) => doc.id === id)!
}

describe('mobile and external-agent document exchange', () => {
  it('uploads exact source privately, shares explicitly, and receives an external edit', async () => {
    const { local, remote, doc, client } = await setup()
    await syncCloudDocument(local, doc.id, client)
    const linked = await get(local, doc.id)
    expect(linked.cloud?.raw).toBe(exportDocument(doc))
    expect(remote.list('agent')).toEqual([])
    await shareCloudDocument(local, doc.id, client, true)
    const shared = remote.read('agent', linked.cloud!.id)
    await remote.update('agent', shared.id, {
      operationId: crypto.randomUUID(),
      baseRevision: shared.revision,
      content: '\uFEFF외부에서 고친 문서\r\n',
    })
    await syncCloudDocument(local, doc.id, client)
    expect(exportDocument(await get(local, doc.id))).toBe('\uFEFF외부에서 고친 문서\r\n')
  })
  it('retains a pending create across restart and does not duplicate a committed upload', async () => {
    const { local, storeName, remote, doc, client, loseNext } = await setup()
    loseNext()
    await expect(syncCloudDocument(local, doc.id, client)).rejects.toThrow('lost-response')
    expect((await get(local, doc.id)).pendingCloudUpload).toBeDefined()
    local.close()
    const reopened = await openDocumentStore(storeName)
    cleanup.push(() => reopened.close())
    await syncCloudDocument(reopened, doc.id, client)
    expect(remote.list('owner')).toHaveLength(1)
    expect((await get(reopened, doc.id)).pendingCloudUpload).toBeUndefined()
  })
  it('retains an offline draft when an external edit changes the same base and permits explicit copy recovery', async () => {
    const { local, remote, doc, client } = await setup()
    await syncCloudDocument(local, doc.id, client)
    const linked = await get(local, doc.id)
    await shareCloudDocument(local, doc.id, client, true)
    const current = await get(local, doc.id)
    await local.save(updateDocument(current, 'offline edit'))
    const base = remote.read('agent', linked.cloud!.id)
    await remote.update('agent', base.id, {
      operationId: crypto.randomUUID(),
      baseRevision: base.revision,
      content: 'agent edit',
    })
    await expect(syncCloudDocument(local, doc.id, client)).rejects.toThrow('conflict')
    expect((await get(local, doc.id)).text).toBe('offline edit')
    expect(remote.read('owner', base.id).content).toBe('agent edit')
    const remoteCopyId = await openCloudDocument(local, base.id, client)
    expect(remoteCopyId).not.toBe(doc.id)
    expect((await get(local, remoteCopyId)).text).toBe('agent edit')
    await copyCloudDocument(local, doc.id, client)
    expect(remote.list('owner')).toHaveLength(2)
    expect(remote.read('owner', base.id).content).toBe('agent edit')
  })
  it('restores a version and revokes subsequent external access', async () => {
    const { local, remote, doc, client } = await setup()
    await syncCloudDocument(local, doc.id, client)
    await shareCloudDocument(local, doc.id, client, true)
    const current = await get(local, doc.id)
    await local.save(updateDocument(current, 'new text'))
    await syncCloudDocument(local, doc.id, client)
    const versions = await client.versions(current.cloud!.id)
    await restoreCloudDocument(local, doc.id, client, versions.at(-1)!.revision)
    expect(exportDocument(await get(local, doc.id))).toBe(exportDocument(doc))
    await shareCloudDocument(local, doc.id, client, false)
    expect(remote.list('agent')).toEqual([])
  })
  it('refuses to send a queued upload to a different server workspace at the same URL', async () => {
    const { local, doc, client, loseNext } = await setup()
    loseNext()
    await expect(syncCloudDocument(local, doc.id, client)).rejects.toThrow()
    client.workspaceId = 'different-workspace'
    await expect(syncCloudDocument(local, doc.id, client)).rejects.toThrow('invalid')
    expect((await get(local, doc.id)).pendingCloudUpload).toBeDefined()
  })
})
