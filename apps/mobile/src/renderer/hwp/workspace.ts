/** Originals and guarded operations are the durable state, never a plain-text projection. */
export interface HwpReplacement {
  id: string
  kind: 'replaceText'
  find: string
  replacement: string
}

export interface HwpWorkspace {
  id: string
  name: string
  original: Uint8Array
  operations: HwpReplacement[]
  revision: number
  updatedAt: number
}

export const MAX_HWP_BYTES = 20 * 1024 * 1024
export const MAX_HWP_OPERATIONS = 200

export function importHwp(name: string, bytes: Uint8Array): HwpWorkspace {
  if (!/\.(hwp|hwpx)$/i.test(name) || !bytes.length || bytes.length > MAX_HWP_BYTES)
    throw new Error('unsupported-hwp')
  const hwp = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]
  const signature = /\.hwpx$/i.test(name) ? [0x50, 0x4b, 3, 4] : hwp
  if (!signature.every((byte, index) => bytes[index] === byte)) throw new Error('unsupported-hwp')
  return {
    id: crypto.randomUUID(),
    name,
    original: bytes.slice(),
    operations: [],
    revision: 1,
    updatedAt: Date.now(),
  }
}

export function replacement(find: string, value: string): HwpReplacement {
  if (!find || find.length > 20_000 || value.length > 20_000 || /[\r\n\0]/.test(find + value))
    throw new Error('invalid-replacement')
  return { id: crypto.randomUUID(), kind: 'replaceText', find, replacement: value }
}

export function appendReplacement(
  workspace: HwpWorkspace,
  operation: HwpReplacement,
): HwpWorkspace {
  if (workspace.operations.length >= MAX_HWP_OPERATIONS) throw new Error('operation-limit')
  if (workspace.operations.some((item) => item.id === operation.id))
    throw new Error('duplicate-operation')
  return {
    ...workspace,
    operations: [...workspace.operations, operation],
    revision: workspace.revision + 1,
    updatedAt: Date.now(),
  }
}

/** A separate database prevents source-only sync from ever uploading a flattened HWP. */
export function openHwpStore(name = 'genoffice-mobile-hwp'): Promise<{
  list(): Promise<HwpWorkspace[]>
  save(workspace: HwpWorkspace, expectedRevision: number): Promise<void>
  close(): void
}> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, 1)
    request.onerror = () => reject(request.error)
    request.onblocked = () => reject(new Error('storage-blocked'))
    request.onupgradeneeded = () =>
      request.result.createObjectStore('workspaces', { keyPath: 'id' })
    request.onsuccess = () => {
      const db = request.result
      db.onversionchange = () => db.close()
      resolve({
        list: () =>
          new Promise((done, fail) => {
            const tx = db.transaction('workspaces', 'readonly')
            const get = tx.objectStore('workspaces').getAll()
            tx.oncomplete = () =>
              done((get.result as HwpWorkspace[]).sort((a, b) => b.updatedAt - a.updatedAt))
            tx.onabort = () => fail(tx.error ?? new Error('storage-aborted'))
            tx.onerror = () => fail(tx.error)
          }),
        save: (workspace, expectedRevision) =>
          new Promise((done, fail) => {
            const tx = db.transaction('workspaces', 'readwrite')
            const store = tx.objectStore('workspaces')
            const get = store.get(workspace.id)
            let conflict = false
            get.onsuccess = () => {
              const existing = get.result as HwpWorkspace | undefined
              if (
                (existing?.revision ?? 0) !== expectedRevision ||
                workspace.revision !== expectedRevision + 1 ||
                (existing &&
                  (existing.name !== workspace.name ||
                    existing.original.length !== workspace.original.length ||
                    existing.original.some((byte, index) => byte !== workspace.original[index])))
              ) {
                conflict = true
                tx.abort()
              } else store.put(workspace)
            }
            tx.oncomplete = () => done()
            tx.onabort = () => fail(new Error(conflict ? 'revision-conflict' : 'storage-aborted'))
            tx.onerror = () => fail(tx.error)
          }),
        close: () => db.close(),
      })
    }
  })
}

export type HwpStore = Awaited<ReturnType<typeof openHwpStore>>
