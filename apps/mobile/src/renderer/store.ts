import type { LocalDocument } from './documents'

export interface DocumentStore {
  list(): Promise<LocalDocument[]>
  save(document: LocalDocument, expectedRevision?: number): Promise<void>
  close(): void
}

export function openDocumentStore(name = 'genoffice-mobile-prototype'): Promise<DocumentStore> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, 1)
    request.onerror = () => reject(request.error)
    request.onblocked = () => reject(new Error('storage-blocked'))
    request.onupgradeneeded = () => request.result.createObjectStore('documents', { keyPath: 'id' })
    request.onsuccess = () => {
      const db = request.result
      db.onversionchange = () => db.close()
      resolve({
        list: () =>
          new Promise((done, fail) => {
            const tx = db.transaction('documents', 'readonly')
            const get = tx.objectStore('documents').getAll()
            tx.oncomplete = () =>
              done((get.result as LocalDocument[]).sort((a, b) => b.updatedAt - a.updatedAt))
            tx.onabort = () => fail(tx.error ?? new Error('storage-aborted'))
            tx.onerror = () => fail(tx.error)
          }),
        save: (document, expectedRevision = document.revision - 1) =>
          new Promise((done, fail) => {
            const tx = db.transaction('documents', 'readwrite')
            const store = tx.objectStore('documents')
            const get = store.get(document.id)
            let conflict = false
            get.onsuccess = () => {
              const existing = get.result as LocalDocument | undefined
              // Reject stale writes, including edits from a second browser tab.
              if ((existing?.revision ?? 0) !== expectedRevision) {
                conflict = true
                tx.abort()
              } else store.put(document)
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
