import {
  CloudDocumentsClient,
  DocumentFailure,
  type DocumentView,
} from '@genoffice/cloud-documents/browser'
import { exportDocument, importDocument, type LocalDocument } from '../documents'
import type { DocumentStore } from '../store'

export interface CloudBinding {
  origin: string
  workspaceId: string
  id: string
  revision: string
  raw: string
  sharedWithAgent: boolean
}
export interface PendingCloudUpload {
  origin: string
  workspaceId: string
  operationId: string
  name: string
  raw: string
  id?: string
  baseRevision?: string
}

async function get(store: DocumentStore, id: string): Promise<LocalDocument> {
  const doc = (await store.list()).find((item) => item.id === id)
  if (!doc) throw new DocumentFailure('not-found')
  return doc
}
async function mutate(
  store: DocumentStore,
  id: string,
  change: (doc: LocalDocument) => LocalDocument,
) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const current = await get(store, id)
    const next = { ...change(current), revision: current.revision + 1 }
    try {
      await store.save(next, current.revision)
      return next
    } catch (error) {
      if (!(error instanceof Error) || error.message !== 'revision-conflict') throw error
    }
  }
  throw new DocumentFailure('conflict')
}
function binding(client: CloudDocumentsClient, remote: DocumentView): CloudBinding {
  return {
    origin: client.origin,
    workspaceId: client.workspaceId!,
    id: remote.id,
    revision: remote.revision,
    raw: remote.content,
    sharedWithAgent: remote.sharedWithAgent,
  }
}
async function flush(store: DocumentStore, id: string, client: CloudDocumentsClient) {
  const doc = await get(store, id),
    pending = doc.pendingCloudUpload
  if (!pending || pending.origin !== client.origin || pending.workspaceId !== client.workspaceId)
    throw new DocumentFailure('invalid')
  const remote = pending.id
    ? await client.update(pending.id, {
        operationId: pending.operationId,
        baseRevision: pending.baseRevision!,
        name: pending.name,
        content: pending.raw,
      })
    : await client.create({
        operationId: pending.operationId,
        name: pending.name,
        content: pending.raw,
      })
  return mutate(store, id, (current) => {
    if (current.pendingCloudUpload?.operationId !== pending.operationId)
      throw new DocumentFailure('conflict')
    const { pendingCloudUpload: _pending, ...rest } = current
    return { ...rest, cloud: binding(client, remote) }
  })
}

/** Explicitly move a local binding to a new URL for the same authenticated workspace. */
export async function reconnectCloudDocument(
  store: DocumentStore,
  id: string,
  client: CloudDocumentsClient,
): Promise<void> {
  if (!client.workspaceId) await client.connect()
  await mutate(store, id, (current) => {
    const bindings = [current.cloud, current.pendingCloudUpload].filter((value) => !!value)
    if (!bindings.length || bindings.some((value) => value.workspaceId !== client.workspaceId))
      throw new DocumentFailure('invalid')
    if (
      current.cloud &&
      current.pendingCloudUpload &&
      current.cloud.origin !== current.pendingCloudUpload.origin
    )
      throw new DocumentFailure('invalid')
    return {
      ...current,
      ...(current.cloud ? { cloud: { ...current.cloud, origin: client.origin } } : {}),
      ...(current.pendingCloudUpload
        ? { pendingCloudUpload: { ...current.pendingCloudUpload, origin: client.origin } }
        : {}),
    }
  })
}

export async function syncCloudDocument(
  store: DocumentStore,
  id: string,
  client: CloudDocumentsClient,
): Promise<void> {
  if (!client.workspaceId) await client.connect()
  let doc = await get(store, id)
  if (
    (doc.cloud &&
      (doc.cloud.origin !== client.origin || doc.cloud.workspaceId !== client.workspaceId)) ||
    (doc.pendingCloudUpload &&
      (doc.pendingCloudUpload.origin !== client.origin ||
        doc.pendingCloudUpload.workspaceId !== client.workspaceId))
  )
    throw new DocumentFailure('invalid')
  if (doc.pendingCloudUpload) doc = await flush(store, id, client)
  if (doc.cloud && exportDocument(doc) === doc.cloud.raw) {
    const previous = doc.cloud
    const remote = await client.read(previous.id)
    if (remote.revision === previous.revision) return
    await mutate(store, id, (current) => {
      if (
        current.pendingCloudUpload ||
        exportDocument(current) !== previous.raw ||
        current.cloud?.revision !== previous.revision
      )
        throw new DocumentFailure('conflict')
      const loaded = importDocument(remote.name, new TextEncoder().encode(remote.content))
      return { ...current, ...loaded, id: current.id, cloud: binding(client, remote) }
    })
    return
  }
  await mutate(store, id, (current) => {
    if (current.pendingCloudUpload) return current
    if (
      current.cloud &&
      (current.cloud.origin !== client.origin || current.cloud.workspaceId !== client.workspaceId)
    )
      throw new DocumentFailure('invalid')
    return {
      ...current,
      pendingCloudUpload: {
        origin: client.origin,
        workspaceId: client.workspaceId!,
        operationId: crypto.randomUUID(),
        name: current.name,
        raw: exportDocument(current),
        id: current.cloud?.id,
        baseRevision: current.cloud?.revision,
      },
    }
  })
  await flush(store, id, client)
}

/** Explicit conflict recovery: retain the server document and publish this draft separately. */
export async function copyCloudDocument(
  store: DocumentStore,
  id: string,
  client: CloudDocumentsClient,
): Promise<void> {
  if (!client.workspaceId) await client.connect()
  await mutate(store, id, (current) => ({
    ...current,
    pendingCloudUpload: {
      origin: client.origin,
      workspaceId: client.workspaceId!,
      operationId: crypto.randomUUID(),
      name: current.name,
      raw: exportDocument(current),
    },
  }))
  await flush(store, id, client)
}
export async function openCloudDocument(
  store: DocumentStore,
  id: string,
  client: CloudDocumentsClient,
): Promise<string> {
  if (!client.workspaceId) await client.connect()
  const remote = await client.read(id)
  const existing = (await store.list()).find(
    (doc) =>
      doc.cloud?.origin === client.origin &&
      doc.cloud.id === id &&
      doc.cloud.workspaceId === client.workspaceId &&
      doc.cloud.revision === remote.revision &&
      !doc.pendingCloudUpload &&
      exportDocument(doc) === doc.cloud.raw,
  )
  if (existing) return existing.id
  const doc = importDocument(remote.name, new TextEncoder().encode(remote.content))
  doc.cloud = binding(client, remote)
  await store.save(doc, 0)
  return doc.id
}
export async function shareCloudDocument(
  store: DocumentStore,
  id: string,
  client: CloudDocumentsClient,
  enabled: boolean,
) {
  const doc = await get(store, id)
  if (
    !doc.cloud ||
    doc.cloud.origin !== client.origin ||
    doc.cloud.workspaceId !== client.workspaceId ||
    doc.pendingCloudUpload ||
    exportDocument(doc) !== doc.cloud.raw
  )
    throw new DocumentFailure('conflict')
  const remote = await client.share(doc.cloud.id, {
    operationId: crypto.randomUUID(),
    baseRevision: doc.cloud.revision,
    enabled,
  })
  await mutate(store, id, (current) => ({ ...current, cloud: binding(client, remote) }))
}
export async function restoreCloudDocument(
  store: DocumentStore,
  id: string,
  client: CloudDocumentsClient,
  revision: string,
) {
  const doc = await get(store, id)
  if (
    !doc.cloud ||
    doc.cloud.origin !== client.origin ||
    doc.cloud.workspaceId !== client.workspaceId ||
    doc.pendingCloudUpload ||
    exportDocument(doc) !== doc.cloud.raw
  )
    throw new DocumentFailure('conflict')
  await client.restore(doc.cloud.id, {
    operationId: crypto.randomUUID(),
    baseRevision: doc.cloud.revision,
    revision,
  })
  // Read the committed version through the same conflict-preserving local import path.
  await syncCloudDocument(store, id, client)
  return id
}
