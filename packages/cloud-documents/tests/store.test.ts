import { mkdtemp, rm, readFile, writeFile, symlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { CloudDocumentStore } from '../src/store'
import { MAX_DOCUMENT_BYTES } from '../src/contracts'
const cleanup: (() => Promise<void>)[] = []
afterEach(async () => {
  for (const close of cleanup.splice(0).reverse()) await close()
})
async function setup() {
  const directory = await mkdtemp(join(tmpdir(), 'genoffice-cloud-'))
  cleanup.push(() => rm(directory, { recursive: true, force: true }))
  const store = await CloudDocumentStore.open(directory)
  cleanup.push(() => store.close())
  return { directory, store }
}
const create = (operationId = crypto.randomUUID(), content = '\uFEFF# 제목\r\n본문\r\n') => ({
  operationId,
  name: 'note.md',
  content,
})

describe('durable shared documents', () => {
  it('preserves exact source and recovers documents, versions and idempotent receipts after reopening', async () => {
    const { store, directory } = await setup()
    const input = create()
    const first = await store.create('owner', input)
    const updated = await store.update('owner', first.id, {
      operationId: crypto.randomUUID(),
      baseRevision: first.revision,
      content: 'new',
    })
    await store.close()
    const reopened = await CloudDocumentStore.open(directory)
    cleanup.push(() => reopened.close())
    expect(reopened.read('owner', first.id)).toEqual(updated)
    expect(reopened.read('owner', first.id, first.revision).content).toBe(input.content)
    expect(await reopened.create('owner', input)).toEqual(first)
    expect(reopened.list('owner')).toHaveLength(1)
  })
  it('treats identical arguments in a different property order as the same retry', async () => {
    const { store } = await setup()
    const input = create()
    const doc = await store.create('owner', input)
    expect(
      await store.create('owner', {
        content: input.content,
        name: input.name,
        operationId: input.operationId,
      }),
    ).toEqual(doc)
  })
  it('makes existing owner documents invisible until explicitly shared and revokes access immediately', async () => {
    const { store } = await setup()
    const doc = await store.create('owner', create())
    expect(store.list('agent')).toEqual([])
    expect(() => store.read('agent', doc.id)).toThrow('not-found')
    const shared = await store.share('owner', doc.id, {
      operationId: crypto.randomUUID(),
      baseRevision: doc.revision,
      enabled: true,
    })
    expect(store.read('agent', doc.id).content).toBe(doc.content)
    const operation = {
      operationId: crypto.randomUUID(),
      baseRevision: shared.revision,
      content: 'agent edit',
    }
    const edited = await store.update('agent', doc.id, operation)
    await store.share('owner', doc.id, {
      operationId: crypto.randomUUID(),
      baseRevision: edited.revision,
      enabled: false,
    })
    expect(store.list('agent')).toEqual([])
    await expect(store.update('agent', doc.id, operation)).rejects.toThrow('not-found')
    expect(() =>
      store.share('agent', doc.id, {
        operationId: crypto.randomUUID(),
        baseRevision: edited.revision,
        enabled: true,
      }),
    ).toThrow('unauthorized')
  })
  it('allows external creation but gives the owner control over further access', async () => {
    const { store } = await setup()
    const input = create()
    const doc = await store.create('agent', input)
    expect(store.list('owner')).toHaveLength(1)
    expect(store.list('agent')).toHaveLength(1)
    const revoked = await store.share('owner', doc.id, {
      operationId: crypto.randomUUID(),
      baseRevision: doc.revision,
      enabled: false,
    })
    expect(revoked.sharedWithAgent).toBe(false)
    await expect(store.create('agent', input)).rejects.toThrow('not-found')
  })
  it('rejects a stale edit and keeps both history and the current version unchanged', async () => {
    const { store } = await setup()
    const doc = await store.create('agent', create())
    const first = await store.update('agent', doc.id, {
      operationId: crypto.randomUUID(),
      baseRevision: doc.revision,
      content: 'first',
    })
    await expect(
      store.update('agent', doc.id, {
        operationId: crypto.randomUUID(),
        baseRevision: doc.revision,
        content: 'stale',
      }),
    ).rejects.toMatchObject({ code: 'conflict', currentRevision: first.revision })
    expect(store.read('owner', doc.id).content).toBe('first')
    expect(store.versions('owner', doc.id)).toHaveLength(2)
  })
  it('serializes racing edits so exactly one matching-base update commits', async () => {
    const { store } = await setup()
    const doc = await store.create('agent', create())
    const results = await Promise.allSettled(
      ['a', 'b'].map((content) =>
        store.update('agent', doc.id, {
          operationId: crypto.randomUUID(),
          baseRevision: doc.revision,
          content,
        }),
      ),
    )
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1)
    expect(store.versions('owner', doc.id)).toHaveLength(2)
  })
  it('restores by appending a version and retains the replaced text', async () => {
    const { store } = await setup()
    const first = await store.create('agent', create())
    const second = await store.update('agent', first.id, {
      operationId: crypto.randomUUID(),
      baseRevision: first.revision,
      content: 'second',
    })
    const restored = await store.restore('agent', first.id, {
      operationId: crypto.randomUUID(),
      baseRevision: second.revision,
      revision: first.revision,
    })
    expect(restored.content).toBe(first.content)
    expect(restored.revision).not.toBe(first.revision)
    expect(store.read('owner', first.id, second.revision).content).toBe('second')
    expect(store.versions('owner', first.id)).toHaveLength(3)
  })
  it('rejects a reused operation ID with different input and does not consume a rejected stale operation', async () => {
    const { store } = await setup()
    const input = create()
    const doc = await store.create('agent', input)
    await expect(store.create('agent', { ...input, content: 'different' })).rejects.toThrow(
      'idempotency-conflict',
    )
    const op = crypto.randomUUID()
    await expect(
      store.update('agent', doc.id, { operationId: op, baseRevision: 'stale', content: 'fixed' }),
    ).rejects.toThrow('conflict')
    const updated = await store.update('agent', doc.id, {
      operationId: op,
      baseRevision: doc.revision,
      content: 'fixed',
    })
    expect(updated.content).toBe('fixed')
  })
  it('does not leak another document through search or version history', async () => {
    const { store } = await setup()
    const hidden = await store.create('owner', create())
    await store.create('agent', create(crypto.randomUUID(), 'visible'))
    expect(store.list('agent', '본문')).toEqual([])
    expect(() => store.versions('agent', hidden.id)).toThrow('not-found')
  })
  it('rejects unsupported filenames, binary text, oversized content and prototype keys', async () => {
    const { store } = await setup()
    for (const input of [
      { ...create(), name: '../note.md' },
      { ...create(), name: 'a.docx' },
      create(crypto.randomUUID(), '\0'),
      create(crypto.randomUUID(), 'x'.repeat(MAX_DOCUMENT_BYTES + 1)),
      create(crypto.randomUUID(), '\ud800'),
    ]) {
      expect(() => store.create('owner', input)).toThrow('invalid')
    }
    expect(() => store.read('agent', '__proto__')).toThrow('not-found')
    expect(store.list('owner')).toEqual([])
  })
  it('refuses a second writer and releases the directory lock on clean shutdown', async () => {
    const { store, directory } = await setup()
    await expect(CloudDocumentStore.open(directory)).rejects.toThrow('storage')
    await store.close()
    const second = await CloudDocumentStore.open(directory)
    cleanup.push(() => second.close())
    expect(second.list('owner')).toEqual([])
  })
  it('does not reset a corrupt database and rejects a symlinked database file', async () => {
    const { store, directory } = await setup()
    await store.close()
    await writeFile(join(directory, 'documents.json'), '{broken')
    await expect(CloudDocumentStore.open(directory)).rejects.toThrow('storage')
    expect(await readFile(join(directory, 'documents.json'), 'utf8')).toBe('{broken')
    await rm(join(directory, 'documents.json'))
    await writeFile(join(directory, 'other.json'), '{}')
    await symlink(join(directory, 'other.json'), join(directory, 'documents.json'))
    await expect(CloudDocumentStore.open(directory)).rejects.toThrow('storage')
  })
})
