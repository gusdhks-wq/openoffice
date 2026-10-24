import 'fake-indexeddb/auto'
import { afterEach, describe, expect, it } from 'vitest'
import { importDocument, updateDocument, exportDocument } from '../src/renderer/documents'
import { openDocumentStore } from '../src/renderer/store'
import { DriveFailure } from '../src/renderer/drive/types'
import type { GoogleDocsRemote, GoogleDocView } from '../src/renderer/drive/google-docs'
import {
  synchronizeGoogleDoc,
  openGoogleDoc,
  cancelGoogleDocCreation,
} from '../src/renderer/drive/google-docs-sync'

const cleanup: Array<() => void> = []
afterEach(() => cleanup.splice(0).forEach((close) => close()))
async function setup() {
  const dbName = crypto.randomUUID(),
    store = await openDocumentStore(dbName)
  cleanup.push(() => store.close())
  const doc = importDocument('source.md', new TextEncoder().encode('\uFEFF# 원문\r\n본문\r\n'))
  await store.save(doc)
  const files = new Map<string, GoogleDocView>(),
    operations = new Map<string, string>()
  let accountId = 'account-a',
    createCount = 0,
    writes = 0,
    lostCreate = false,
    lostUpdate = false,
    noCreate = false
  let afterRead: (() => Promise<void>) | undefined
  const remote: GoogleDocsRemote = {
    account: async () => accountId,
    list: async () => Array.from(files.values()),
    findCreation: async (operation) => {
      const id = operations.get(operation)
      return id ? files.get(id)! : null
    },
    create: async (operation, name) => {
      createCount++
      if (noCreate) {
        noCreate = false
        throw new DriveFailure('network')
      }
      const id = crypto.randomUUID(),
        view = {
          id,
          name,
          text: '',
          revision: crypto.randomUUID(),
          tabId: 'tab-1',
          modifiedTime: '',
        }
      files.set(id, view)
      operations.set(operation, id)
      if (lostCreate) {
        lostCreate = false
        throw new DriveFailure('network')
      }
      return { ...view }
    },
    read: async (id) => {
      const view = files.get(id)
      if (!view) throw new DriveFailure('missing')
      const copy = { ...view },
        hook = afterRead
      afterRead = undefined
      await hook?.()
      return copy
    },
    update: async (base, text) => {
      if (files.get(base.id)?.revision !== base.revision) throw new DriveFailure('conflict')
      files.set(base.id, { ...base, text, revision: crypto.randomUUID() })
      writes++
      if (lostUpdate) {
        lostUpdate = false
        throw new DriveFailure('network')
      }
    },
  }
  const current = async () => (await store.list()).find((item) => item.id === doc.id)!
  const edit = async (text: string) => {
    await store.save(updateDocument(await current(), text))
  }
  const external = async (text: string) => {
    const id = (await current()).googleDoc!.id,
      view = files.get(id)!
    files.set(id, { ...view, text, revision: crypto.randomUUID() })
  }
  return {
    store,
    dbName,
    doc,
    remote,
    current,
    edit,
    external,
    files,
    counts: () => ({ createCount, writes }),
    loseCreate: () => {
      lostCreate = true
    },
    loseUpdate: () => {
      lostUpdate = true
    },
    neverCreate: () => {
      noCreate = true
    },
    switchAccount: () => {
      accountId = 'account-b'
    },
    afterRead: (hook: () => Promise<void>) => {
      afterRead = hook
    },
  }
}
describe('PC-independent native Google document synchronization', () => {
  it('keeps one stable Google document, accepts external edits and preserves source BOM/newline export', async () => {
    const s = await setup()
    await synchronizeGoogleDoc(s.store, s.doc.id, s.remote)
    const id = (await s.current()).googleDoc!.id
    expect(s.files.get(id)!.text).toBe(s.doc.text)
    expect(exportDocument(await s.current())).toBe(exportDocument(s.doc))
    await s.edit('phone edit\n')
    await synchronizeGoogleDoc(s.store, s.doc.id, s.remote)
    expect(s.files.get(id)!.text).toBe('phone edit\n')
    await s.external('ChatGPT edit\n')
    await synchronizeGoogleDoc(s.store, s.doc.id, s.remote)
    expect((await s.current()).text).toBe('ChatGPT edit\n')
    expect(exportDocument(await s.current())).toBe('\uFEFFChatGPT edit\r\n')
    expect(s.counts().createCount).toBe(1)
  })
  it('recovers a committed create across app restart without issuing another create', async () => {
    const s = await setup()
    s.loseCreate()
    await expect(synchronizeGoogleDoc(s.store, s.doc.id, s.remote)).rejects.toThrow('drive-network')
    expect((await s.current()).pendingGoogleDoc?.phase).toBe('creating')
    s.store.close()
    const reopened = await openDocumentStore(s.dbName)
    cleanup.push(() => reopened.close())
    await synchronizeGoogleDoc(reopened, s.doc.id, s.remote)
    expect(s.counts().createCount).toBe(1)
    expect(s.files.size).toBe(1)
    expect((await reopened.list())[0].pendingGoogleDoc).toBeUndefined()
  })
  it('does not duplicate an uncertain creation that is not visible in Drive', async () => {
    const s = await setup()
    s.neverCreate()
    await expect(synchronizeGoogleDoc(s.store, s.doc.id, s.remote)).rejects.toThrow('drive-network')
    await expect(synchronizeGoogleDoc(s.store, s.doc.id, s.remote)).rejects.toThrow(
      'drive-uncertain',
    )
    expect(s.counts().createCount).toBe(1)
    expect((await s.current()).text).toBe(s.doc.text)
    await cancelGoogleDocCreation(
      s.store,
      s.doc.id,
      (await s.current()).pendingGoogleDoc!.operationId,
    )
    expect((await s.current()).pendingGoogleDoc).toBeUndefined()
    expect((await s.current()).text).toBe(s.doc.text)
  })
  it('acknowledges a lost committed write response without rewriting the Google document', async () => {
    const s = await setup()
    await synchronizeGoogleDoc(s.store, s.doc.id, s.remote)
    await s.edit('desired')
    s.loseUpdate()
    await expect(synchronizeGoogleDoc(s.store, s.doc.id, s.remote)).rejects.toThrow('drive-network')
    const count = s.counts().writes
    await synchronizeGoogleDoc(s.store, s.doc.id, s.remote)
    expect(s.counts().writes).toBe(count)
    expect((await s.current()).pendingGoogleDoc).toBeUndefined()
  })
  it('retains both sides of a conflict and opens the remote copy as a separate local document', async () => {
    const s = await setup()
    await synchronizeGoogleDoc(s.store, s.doc.id, s.remote)
    await s.edit('local draft')
    await s.external('remote edit')
    await expect(synchronizeGoogleDoc(s.store, s.doc.id, s.remote)).rejects.toThrow(
      'drive-conflict',
    )
    const id = await openGoogleDoc(s.store, (await s.current()).googleDoc!.id, s.remote)
    expect(id).not.toBe(s.doc.id)
    expect((await s.current()).text).toBe('local draft')
    expect((await s.store.list()).find((doc) => doc.id === id)!.text).toBe('remote edit')
  })
  it('blocks account switching before reading or sending an existing account’s queue', async () => {
    const s = await setup()
    s.loseCreate()
    await expect(synchronizeGoogleDoc(s.store, s.doc.id, s.remote)).rejects.toThrow()
    s.switchAccount()
    await expect(synchronizeGoogleDoc(s.store, s.doc.id, s.remote)).rejects.toThrow('drive-account')
    expect(s.counts().createCount).toBe(1)
  })
  it('never overwrites a local edit made during a remote pull', async () => {
    const s = await setup()
    await synchronizeGoogleDoc(s.store, s.doc.id, s.remote)
    await s.external('remote edit')
    s.afterRead(() => s.edit('typing during download'))
    await expect(synchronizeGoogleDoc(s.store, s.doc.id, s.remote)).rejects.toThrow(
      'drive-conflict',
    )
    expect((await s.current()).text).toBe('typing during download')
  })
  it('refuses characters Google would strip before creating a cloud document', async () => {
    const s = await setup()
    await s.edit('private-use \ue000')
    await expect(synchronizeGoogleDoc(s.store, s.doc.id, s.remote)).rejects.toThrow(
      'drive-structure',
    )
    expect(s.counts().createCount).toBe(0)
  })
  it('allows only one creation when two tabs synchronize the same local draft', async () => {
    const s = await setup()
    const results = await Promise.allSettled([
      synchronizeGoogleDoc(s.store, s.doc.id, s.remote),
      synchronizeGoogleDoc(s.store, s.doc.id, s.remote),
    ])
    expect(results.some((result) => result.status === 'fulfilled')).toBe(true)
    expect(s.counts().createCount).toBe(1)
    expect(s.files.size).toBe(1)
  })
})
