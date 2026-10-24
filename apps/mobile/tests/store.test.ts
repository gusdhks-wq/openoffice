import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { importDocument, updateDocument } from '../src/renderer/documents'
import { openDocumentStore } from '../src/renderer/store'

describe('durable local documents', () => {
  it('recovers the final document after closing and reopening storage', async () => {
    const name = crypto.randomUUID()
    const db = await openDocumentStore(name)
    const original = importDocument('note.md', new TextEncoder().encode('first'))
    await db.save(original)
    const edited = updateDocument(original, '한글 입력 완료')
    await db.save(edited)
    db.close()
    const reopened = await openDocumentStore(name)
    expect(await reopened.list()).toEqual([edited])
    reopened.close()
  })
  it('rejects another tab overwriting a concurrently changed document', async () => {
    const name = crypto.randomUUID()
    const first = await openDocumentStore(name)
    const second = await openDocumentStore(name)
    const original = importDocument('note.md', new Uint8Array())
    await first.save(original)
    const winner = updateDocument(original, 'first tab')
    await first.save(winner)
    await expect(second.save(updateDocument(original, 'second tab'))).rejects.toThrow(
      'revision-conflict',
    )
    // A later local edit must not bypass the conflict by increasing its revision.
    await expect(
      second.save(updateDocument(updateDocument(original, 'second tab'), 'newer edit'), 1),
    ).rejects.toThrow('revision-conflict')
    expect(await first.list()).toEqual([winner])
    first.close()
    second.close()
  })
  it('can persist the latest local edit after a skipped revision without replacing remote edits', async () => {
    const db = await openDocumentStore(crypto.randomUUID())
    const original = importDocument('note.md', new Uint8Array())
    await db.save(original)
    const latest = updateDocument(updateDocument(original, 'intermediate'), 'latest')
    await db.save(latest, original.revision)
    expect(await db.list()).toEqual([latest])
    db.close()
  })
})
