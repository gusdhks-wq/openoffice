import { exportDocument, importDocument, type LocalDocument } from '../documents'
import type { DocumentStore } from '../store'
import {
  DriveFailure,
  snapshotHeads,
  snapshotKey,
  type DriveRemote,
  type DriveSnapshot,
} from './types'

async function find(store: DocumentStore, id: string): Promise<LocalDocument> {
  const doc = (await store.list()).find((item) => item.id === id)
  if (!doc) throw new DriveFailure('missing')
  return doc
}

/** Retry a local CAS only. Network effects are outside this transaction. */
async function mutate(
  store: DocumentStore,
  id: string,
  change: (doc: LocalDocument) => LocalDocument,
): Promise<LocalDocument> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const current = await find(store, id)
    const changed = change(current)
    if (changed === current) return current
    const next = { ...changed, revision: current.revision + 1 }
    try {
      await store.save(next, current.revision)
      return next
    } catch (error) {
      if (!(error instanceof Error) || error.message !== 'revision-conflict') throw error
    }
  }
  throw new DriveFailure('conflict')
}

async function flush(
  store: DocumentStore,
  doc: LocalDocument,
  remote: DriveRemote,
  accountId: string,
): Promise<LocalDocument> {
  const upload = doc.pendingUpload
  if (!upload || upload.accountId !== accountId) throw new DriveFailure('account')
  const saved = await remote.create(upload)
  return mutate(store, doc.id, (current) => {
    if (current.pendingUpload?.operationId !== upload.operationId)
      throw new DriveFailure('conflict')
    const { pendingUpload: _pending, ...rest } = current
    return {
      ...rest,
      drive: {
        accountId,
        documentId: upload.documentId,
        fileId: saved.id,
        fileVersion: saved.version,
        raw: upload.raw,
      },
    }
  })
}

/** Append-only Drive snapshots avoid relying on undocumented conditional updates. */
export async function synchronizeDocument(
  store: DocumentStore,
  id: string,
  remote: DriveRemote,
): Promise<'synced' | 'conflict'> {
  const accountId = await remote.account()
  let doc = await find(store, id)
  if (
    (doc.drive && doc.drive.accountId !== accountId) ||
    (doc.pendingUpload && doc.pendingUpload.accountId !== accountId)
  )
    throw new DriveFailure('account')
  if (doc.pendingUpload) doc = await flush(store, doc, remote, accountId)
  const all = await remote.list()
  const documentId = doc.drive?.documentId ?? doc.id
  const heads = snapshotHeads(all.filter((file) => file.documentId === documentId))
  const baseKey = doc.drive ? `${doc.drive.fileId}:${doc.drive.fileVersion}` : ''
  const changed = !doc.drive || exportDocument(doc) !== doc.drive.raw
  if (!changed) {
    if (heads.length > 1) return 'conflict'
    const head = heads[0]
    if (!head) throw new DriveFailure('missing')
    if (snapshotKey(head) === baseKey) return 'synced'
    const raw = await remote.read(head)
    await mutate(store, id, (current) => {
      // A user might have edited on a second tab during the download.
      if (
        current.pendingUpload ||
        exportDocument(current) !== doc.drive!.raw ||
        current.drive?.fileId !== doc.drive!.fileId ||
        current.drive?.fileVersion !== doc.drive!.fileVersion
      )
        throw new DriveFailure('conflict')
      const loaded = importDocument(head.name, new TextEncoder().encode(raw))
      return {
        ...current,
        ...loaded,
        id: current.id,
        drive: { accountId, documentId, fileId: head.id, fileVersion: head.version, raw },
      }
    })
    return 'synced'
  }
  const fileId = await remote.reserveId()
  doc = await mutate(store, id, (current) => {
    if (current.pendingUpload) return current
    if (current.drive?.accountId && current.drive.accountId !== accountId)
      throw new DriveFailure('account')
    return {
      ...current,
      pendingUpload: {
        accountId,
        documentId: current.drive?.documentId ?? current.id,
        fileId,
        operationId: crypto.randomUUID(),
        parentKey: current.drive ? `${current.drive.fileId}:${current.drive.fileVersion}` : '',
        name: current.name,
        raw: exportDocument(current),
      },
    }
  })
  await flush(store, doc, remote, accountId)
  const currentHeads = snapshotHeads(
    (await remote.list()).filter((file) => file.documentId === documentId),
  )
  return currentHeads.length > 1 ? 'conflict' : 'synced'
}

/** Opening a remote branch creates a separate local document, retaining any local draft. */
export async function openDriveSnapshot(
  store: DocumentStore,
  file: DriveSnapshot,
  remote: DriveRemote,
): Promise<string> {
  const accountId = await remote.account()
  const existing = (await store.list()).find(
    (doc) =>
      doc.drive?.accountId === accountId &&
      doc.drive.fileId === file.id &&
      doc.drive.fileVersion === file.version &&
      !doc.pendingUpload &&
      exportDocument(doc) === doc.drive.raw,
  )
  if (existing) return existing.id
  const raw = await remote.read(file)
  const doc = importDocument(file.name, new TextEncoder().encode(raw))
  doc.drive = {
    accountId,
    documentId: file.documentId,
    fileId: file.id,
    fileVersion: file.version,
    raw,
  }
  await store.save(doc, 0)
  return doc.id
}
