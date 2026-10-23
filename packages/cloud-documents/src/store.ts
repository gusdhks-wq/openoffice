import { createHash, randomUUID } from 'node:crypto'
import { mkdir, lstat, readFile, open, rename, unlink } from 'node:fs/promises'
import { join } from 'node:path'
import {
  DocumentFailure,
  MAX_DOCUMENT_BYTES,
  type CreateInput,
  type UpdateInput,
  type RestoreInput,
  type ShareInput,
  type Principal,
  type DocumentInfo,
  type DocumentView,
  type VersionInfo,
} from './contracts'

interface Revision extends VersionInfo {
  content: string
}
interface StoredDocument {
  id: string
  name: string
  revision: string
  updatedAt: string
  sharedWithAgent: boolean
  versions: Revision[]
}
interface Receipt {
  fingerprint: string
  documentId: string
  revision: string
}
interface Database {
  schema: 1
  workspaceId: string
  documents: Record<string, StoredDocument>
  receipts: Record<string, Receipt>
}
const MAX_DATABASE_BYTES = 64 * 1024 * 1024
const MAX_DOCUMENTS = 256
const MAX_RECEIPTS = 4096
const MAX_VERSIONS = 128
const identifier = /^[A-Za-z0-9_-]{1,128}$/

function validateName(name: string) {
  if (
    typeof name !== 'string' ||
    name.length > 160 ||
    !/\.(md|markdown|txt)$/i.test(name) ||
    /[\\/\p{Cc}]/u.test(name)
  )
    throw new DocumentFailure('invalid')
}
function validateContent(content: string) {
  if (
    typeof content !== 'string' ||
    content.includes('\0') ||
    Buffer.byteLength(content, 'utf8') > MAX_DOCUMENT_BYTES ||
    Buffer.from(content, 'utf8').toString('utf8') !== content
  )
    throw new DocumentFailure('invalid')
}
function validateId(value: string) {
  if (typeof value !== 'string' || !identifier.test(value)) throw new DocumentFailure('invalid')
}
function info(doc: StoredDocument): DocumentInfo {
  return {
    id: doc.id,
    name: doc.name,
    revision: doc.revision,
    updatedAt: doc.updatedAt,
    sharedWithAgent: doc.sharedWithAgent,
  }
}
function view(doc: StoredDocument, revision = doc.revision): DocumentView {
  const version = doc.versions.find((item) => item.revision === revision)
  if (!version) throw new DocumentFailure('not-found')
  return {
    ...info(doc),
    name: version.name,
    revision: version.revision,
    updatedAt: version.createdAt,
    content: version.content,
  }
}
function document(db: Database, actor: Principal, id: string): StoredDocument {
  validateId(id)
  const doc = Object.hasOwn(db.documents, id) ? db.documents[id] : undefined
  if (!doc || (actor === 'agent' && !doc.sharedWithAgent)) throw new DocumentFailure('not-found')
  return doc
}

/** One process owns this directory; every mutation and receipt is one durable atomic write. */
export class CloudDocumentStore {
  private database: Database = { schema: 1, workspaceId: randomUUID(), documents: {}, receipts: {} }
  private queue: Promise<unknown> = Promise.resolve()
  private closed = false
  private constructor(
    private readonly directory: string,
    private readonly release: () => Promise<void>,
  ) {}

  static async open(directory: string): Promise<CloudDocumentStore> {
    await mkdir(directory, { recursive: true, mode: 0o700 })
    if (!(await lstat(directory)).isDirectory() || (await lstat(directory)).isSymbolicLink())
      throw new DocumentFailure('storage')
    const lockPath = join(directory, 'writer.lock')
    let lock
    try {
      lock = await open(lockPath, 'wx', 0o600)
      await lock.writeFile(String(process.pid))
      await lock.sync()
    } catch {
      throw new DocumentFailure('storage')
    }
    const store = new CloudDocumentStore(directory, async () => {
      await lock.close()
      await unlink(lockPath)
    })
    try {
      const path = join(directory, 'documents.json')
      try {
        const stat = await lstat(path)
        if (!stat.isFile() || stat.isSymbolicLink() || stat.size > MAX_DATABASE_BYTES)
          throw new DocumentFailure('storage')
        const parsed = JSON.parse(await readFile(path, 'utf8')) as Database
        if (
          parsed.schema !== 1 ||
          typeof parsed.workspaceId !== 'string' ||
          !identifier.test(parsed.workspaceId) ||
          !parsed.documents ||
          !parsed.receipts ||
          Array.isArray(parsed.documents) ||
          Array.isArray(parsed.receipts)
        )
          throw new DocumentFailure('storage')
        store.database = parsed
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
        await store.persist(store.database)
      }
      return store
    } catch {
      await store.release()
      throw new DocumentFailure('storage')
    }
  }

  get workspaceId() {
    return this.database.workspaceId
  }
  async close() {
    await this.queue
    if (!this.closed) {
      this.closed = true
      await this.release()
    }
  }
  private assertOpen() {
    if (this.closed) throw new DocumentFailure('storage')
  }
  list(actor: Principal, query = ''): DocumentInfo[] {
    this.assertOpen()
    if (query.length > 200) throw new DocumentFailure('invalid')
    const needle = query.toLocaleLowerCase()
    return Object.values(this.database.documents)
      .filter(
        (doc) =>
          (actor === 'owner' || doc.sharedWithAgent) &&
          (!needle ||
            doc.name.toLocaleLowerCase().includes(needle) ||
            doc.versions
              .find((item) => item.revision === doc.revision)!
              .content.toLocaleLowerCase()
              .includes(needle)),
      )
      .map(info)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }
  read(actor: Principal, id: string, revision?: string): DocumentView {
    this.assertOpen()
    if (revision) validateId(revision)
    return view(document(this.database, actor, id), revision)
  }
  versions(actor: Principal, id: string): VersionInfo[] {
    this.assertOpen()
    return document(this.database, actor, id)
      .versions.map(({ content: _content, ...version }) => ({ ...version }))
      .reverse()
  }

  private async persist(next: Database) {
    const serialized = JSON.stringify(next)
    if (Buffer.byteLength(serialized) > MAX_DATABASE_BYTES) throw new DocumentFailure('limit')
    const temporary = join(this.directory, `.documents-${randomUUID()}.tmp`)
    try {
      const file = await open(temporary, 'wx', 0o600)
      try {
        await file.writeFile(serialized)
        await file.sync()
      } finally {
        await file.close()
      }
      await rename(temporary, join(this.directory, 'documents.json'))
      this.database = next
      // Windows cannot open directories through this API. File fsync and atomic
      // replacement still apply; POSIX hosts also flush the directory entry.
      if (process.platform !== 'win32') {
        const directory = await open(this.directory, 'r')
        try {
          await directory.sync()
        } finally {
          await directory.close()
        }
      }
    } catch (error) {
      await unlink(temporary).catch(() => {})
      if (error instanceof DocumentFailure) throw error
      throw new DocumentFailure('storage')
    }
  }

  private mutation(
    actor: Principal,
    operationId: string,
    request: unknown,
    apply: (db: Database) => StoredDocument,
  ): Promise<DocumentView> {
    validateId(operationId)
    const fingerprint = createHash('sha256').update(JSON.stringify(request)).digest('hex')
    const receiptKey = `${actor}:${operationId}`
    const run = this.queue.then(async () => {
      this.assertOpen()
      const previous = this.database.receipts[receiptKey]
      if (previous) {
        if (previous.fingerprint !== fingerprint) throw new DocumentFailure('idempotency-conflict')
        // A replay cannot regain a document whose sharing was revoked.
        return view(document(this.database, actor, previous.documentId), previous.revision)
      }
      if (Object.keys(this.database.receipts).length >= MAX_RECEIPTS)
        throw new DocumentFailure('limit')
      const next = structuredClone(this.database)
      const changed = apply(next)
      next.receipts[receiptKey] = {
        fingerprint,
        documentId: changed.id,
        revision: changed.revision,
      }
      await this.persist(next)
      return view(changed)
    })
    this.queue = run.catch(() => {})
    return run
  }

  create(actor: Principal, input: CreateInput): Promise<DocumentView> {
    validateName(input.name)
    validateContent(input.content)
    return this.mutation(
      actor,
      input.operationId,
      { type: 'create', name: input.name, content: input.content },
      (db) => {
        if (Object.keys(db.documents).length >= MAX_DOCUMENTS) throw new DocumentFailure('limit')
        const id = randomUUID(),
          revision = randomUUID(),
          now = new Date().toISOString()
        const doc: StoredDocument = {
          id,
          name: input.name,
          revision,
          updatedAt: now,
          sharedWithAgent: actor === 'agent',
          versions: [
            {
              revision,
              parentRevision: null,
              name: input.name,
              content: input.content,
              createdAt: now,
              source: actor,
            },
          ],
        }
        db.documents[id] = doc
        return doc
      },
    )
  }
  update(actor: Principal, id: string, input: UpdateInput): Promise<DocumentView> {
    validateContent(input.content)
    if (input.name !== undefined) validateName(input.name)
    return this.mutation(
      actor,
      input.operationId,
      {
        type: 'update',
        id,
        baseRevision: input.baseRevision,
        name: input.name,
        content: input.content,
      },
      (db) => {
        const doc = document(db, actor, id)
        this.append(doc, input.baseRevision, input.name ?? doc.name, input.content, actor)
        return doc
      },
    )
  }
  restore(actor: Principal, id: string, input: RestoreInput): Promise<DocumentView> {
    return this.mutation(
      actor,
      input.operationId,
      { type: 'restore', id, baseRevision: input.baseRevision, revision: input.revision },
      (db) => {
        const doc = document(db, actor, id)
        const previous = view(doc, input.revision)
        this.append(doc, input.baseRevision, previous.name, previous.content, 'restore')
        return doc
      },
    )
  }
  share(actor: Principal, id: string, input: ShareInput): Promise<DocumentView> {
    if (actor !== 'owner') throw new DocumentFailure('unauthorized')
    if (typeof input.enabled !== 'boolean') throw new DocumentFailure('invalid')
    return this.mutation(
      actor,
      input.operationId,
      { type: 'share', id, baseRevision: input.baseRevision, enabled: input.enabled },
      (db) => {
        const doc = document(db, actor, id)
        // A sharing change is versioned too, so concurrent edits cannot reset it.
        this.append(doc, input.baseRevision, doc.name, view(doc).content, 'owner')
        doc.sharedWithAgent = input.enabled
        return doc
      },
    )
  }
  private append(
    doc: StoredDocument,
    baseRevision: string,
    name: string,
    content: string,
    source: VersionInfo['source'],
  ) {
    if (baseRevision !== doc.revision) throw new DocumentFailure('conflict', doc.revision)
    if (doc.versions.length >= MAX_VERSIONS) throw new DocumentFailure('limit')
    const revision = randomUUID(),
      now = new Date().toISOString()
    doc.versions.push({
      revision,
      parentRevision: doc.revision,
      name,
      content,
      createdAt: now,
      source,
    })
    doc.revision = revision
    doc.name = name
    doc.updatedAt = now
  }
}
