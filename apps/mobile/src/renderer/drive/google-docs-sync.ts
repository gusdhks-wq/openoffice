import { importDocument, type LocalDocument } from '../documents'
import type { DocumentStore } from '../store'
import { DriveFailure } from './types'
import type { GoogleDocsRemote, GoogleDocView } from './google-docs'
import { validateGoogleText } from './google-docs'

async function find(store: DocumentStore, id: string) {
  const doc = (await store.list()).find((item) => item.id === id)
  if (!doc) throw new DriveFailure('missing')
  return doc
}
async function mutate(
  store: DocumentStore,
  id: string,
  change: (doc: LocalDocument) => LocalDocument,
) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const previous = await find(store, id),
      next = { ...change(previous), revision: previous.revision + 1 }
    try {
      await store.save(next, previous.revision)
      return next
    } catch (error) {
      if (!(error instanceof Error) || error.message !== 'revision-conflict') throw error
    }
  }
  throw new DriveFailure('conflict')
}
function binding(accountId: string, view: GoogleDocView) {
  return { accountId, id: view.id, text: view.text, revision: view.revision }
}
async function flush(
  store: DocumentStore,
  id: string,
  remote: GoogleDocsRemote,
  accountId: string,
) {
  let doc = await find(store, id),
    pending = doc.pendingGoogleDoc
  if (!pending || pending.accountId !== accountId) throw new DriveFailure('account')
  if (!pending.id) {
    if (pending.phase === 'prepared') {
      doc = await mutate(store, id, (current) => {
        if (current.pendingGoogleDoc?.operationId !== pending!.operationId)
          throw new DriveFailure('conflict')
        if (current.pendingGoogleDoc.phase !== 'prepared') throw new DriveFailure('uncertain')
        return { ...current, pendingGoogleDoc: { ...current.pendingGoogleDoc, phase: 'creating' } }
      })
      pending = doc.pendingGoogleDoc!
      try {
        const created = await remote.create(pending.operationId, pending.name)
        doc = await mutate(store, id, (current) => {
          if (current.pendingGoogleDoc?.operationId !== pending!.operationId)
            throw new DriveFailure('conflict')
          return {
            ...current,
            pendingGoogleDoc: {
              ...current.pendingGoogleDoc,
              id: created.id,
              phase: 'editing',
              baseText: '',
            },
          }
        })
      } catch (error) {
        // A definite auth rejection did not create a file. An unknown outcome must never be blindly recreated.
        if (error instanceof DriveFailure && error.kind === 'auth')
          await mutate(store, id, (current) => {
            if (current.pendingGoogleDoc?.operationId !== pending!.operationId)
              throw new DriveFailure('conflict')
            return { ...current, pendingGoogleDoc: { ...pending!, phase: 'prepared' } }
          })
        throw error
      }
    } else {
      const found = await remote.findCreation(pending.operationId)
      if (!found) throw new DriveFailure('uncertain')
      doc = await mutate(store, id, (current) => {
        if (current.pendingGoogleDoc?.operationId !== pending!.operationId)
          throw new DriveFailure('conflict')
        return {
          ...current,
          pendingGoogleDoc: {
            ...current.pendingGoogleDoc,
            id: found.id,
            phase: 'editing',
            baseText: '',
          },
        }
      })
    }
  }
  pending = doc.pendingGoogleDoc!
  const base = await remote.read(pending.id!)
  let committed = base
  if (base.text !== pending.text) {
    if (
      (pending.baseRevision && base.revision !== pending.baseRevision) ||
      base.text !== pending.baseText
    )
      throw new DriveFailure('conflict')
    await remote.update(base, pending.text)
    committed = await remote.read(base.id)
    if (committed.text !== pending.text) throw new DriveFailure('conflict')
  }
  return mutate(store, id, (current) => {
    if (current.pendingGoogleDoc?.operationId !== pending!.operationId)
      throw new DriveFailure('conflict')
    const { pendingGoogleDoc: _pending, ...rest } = current
    return { ...rest, googleDoc: binding(accountId, committed) }
  })
}

/** A stable native Google document, with guarded writes and durable recovery of uncertain outcomes. */
export async function synchronizeGoogleDoc(
  store: DocumentStore,
  id: string,
  remote: GoogleDocsRemote,
) {
  const accountId = await remote.account()
  let doc = await find(store, id)
  validateGoogleText(doc.text)
  if (
    [doc.googleDoc, doc.pendingGoogleDoc, doc.drive, doc.pendingUpload].some(
      (item) => item && item.accountId !== accountId,
    )
  )
    throw new DriveFailure('account')
  if (doc.pendingGoogleDoc) doc = await flush(store, id, remote, accountId)
  if (doc.googleDoc) {
    const previous = doc.googleDoc,
      view = await remote.read(previous.id)
    if (doc.text === previous.text) {
      if (view.revision === previous.revision) return
      await mutate(store, id, (current) => {
        if (
          current.pendingGoogleDoc ||
          current.googleDoc?.revision !== previous.revision ||
          current.text !== previous.text
        )
          throw new DriveFailure('conflict')
        // Retain the source codec/BOM/newline preference; only the editor text changes.
        return {
          ...current,
          text: view.text,
          updatedAt: Date.now(),
          googleDoc: binding(accountId, view),
        }
      })
      return
    }
    if (view.revision !== previous.revision) throw new DriveFailure('conflict')
  }
  await mutate(store, id, (current) => {
    if (
      current.pendingGoogleDoc ||
      current.googleDoc?.revision !== doc.googleDoc?.revision ||
      current.googleDoc?.id !== doc.googleDoc?.id
    )
      throw new DriveFailure('conflict')
    return {
      ...current,
      pendingGoogleDoc: {
        accountId,
        operationId: crypto.randomUUID(),
        name: current.name,
        text: current.text,
        phase: current.googleDoc ? 'editing' : 'prepared',
        id: current.googleDoc?.id,
        baseText: current.googleDoc?.text,
        baseRevision: current.googleDoc?.revision,
      },
    }
  })
  await flush(store, id, remote, accountId)
}

/** Read the server version into a separate local draft; never replace a conflicting local edit. */
export async function openGoogleDoc(store: DocumentStore, id: string, remote: GoogleDocsRemote) {
  const accountId = await remote.account(),
    view = await remote.read(id)
  const existing = (await store.list()).find(
    (doc) =>
      doc.googleDoc?.accountId === accountId &&
      doc.googleDoc.id === id &&
      doc.googleDoc.revision === view.revision &&
      !doc.pendingGoogleDoc &&
      doc.text === view.text,
  )
  if (existing) return existing.id
  const name = /\.(md|markdown|txt)$/i.test(view.name) ? view.name : view.name + '.md'
  const doc = importDocument(name, new TextEncoder().encode(view.text))
  doc.googleDoc = binding(accountId, view)
  await store.save(doc, 0)
  return doc.id
}

/** Explicitly abandon only an unbound, uncertain creation; keep every local/remote document. */
export async function cancelGoogleDocCreation(
  store: DocumentStore,
  id: string,
  operationId: string,
) {
  await mutate(store, id, (current) => {
    const pending = current.pendingGoogleDoc
    if (
      !pending ||
      pending.id ||
      pending.phase !== 'creating' ||
      pending.operationId !== operationId
    )
      throw new DriveFailure('conflict')
    const { pendingGoogleDoc: _pending, ...rest } = current
    return rest
  })
}
