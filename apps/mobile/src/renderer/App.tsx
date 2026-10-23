import { useEffect, useRef, useState } from 'react'
import { LANGS, htmlDir, htmlLang, normalizeLang, productName, type Lang } from '@genoffice/i18n'
import { importDocument, MAX_IMPORT_BYTES, updateDocument, type LocalDocument } from './documents'
import { downloadDocument } from './files'
import { openDocumentStore, type DocumentStore } from './store'
import { translate, type MessageKey } from './i18n'
import { DrivePanel } from './drive/DrivePanel'
import { CloudPanel } from './cloud/CloudPanel'
import { lazy, Suspense } from 'react'

const HwpPanel = lazy(() =>
  import('./hwp/HwpPanel').then((module) => ({ default: module.HwpPanel })),
)

export function App() {
  const [lang, setLang] = useState<Lang>(() => normalizeLang(navigator.language))
  const [documents, setDocuments] = useState<LocalDocument[]>([])
  const [active, setActive] = useState<LocalDocument | null>(null)
  const [status, setStatus] = useState<MessageKey>('loading')
  const [error, setError] = useState<MessageKey | null>(null)
  const store = useRef<DocumentStore | null>(null)
  const [database, setDatabase] = useState<DocumentStore | null>(null)
  const [driveBusy, setDriveBusy] = useState(false)
  const [cloudBusy, setCloudBusy] = useState(false)
  const [composing, setComposing] = useState(false)
  const latest = useRef<LocalDocument | null>(null)
  const persistedRevisions = useRef(new Map<string, number>())
  const writes = useRef<Promise<void>>(Promise.resolve())
  const importInput = useRef<HTMLInputElement>(null)
  const t = (key: MessageKey) => translate(lang, key)

  useEffect(() => {
    document.documentElement.lang = htmlLang(lang)
    document.documentElement.dir = htmlDir(lang)
    document.title = productName(lang)
  }, [lang])

  useEffect(() => {
    let disposed = false
    void openDocumentStore()
      .then(async (db) => {
        if (disposed) {
          db.close()
          return
        }
        store.current = db
        setDatabase(db)
        const docs = await db.list()
        if (!disposed) {
          persistedRevisions.current = new Map(docs.map((doc) => [doc.id, doc.revision]))
          setDocuments(docs)
          latest.current = docs[0] ?? null
          setActive(latest.current)
          setStatus('saved')
        }
      })
      .catch(() => {
        if (!disposed) setStatus('openFailed')
      })
    return () => {
      disposed = true
      store.current?.close()
    }
  }, [])

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    if (status !== 'saving' && status !== 'saveFailed') return
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [status])

  function persist(doc: LocalDocument) {
    latest.current = doc
    setActive(doc)
    setStatus('saving')
    // Queue every revision immediately, including during IME composition. No debounce
    // or dependence on mobile background execution is needed to start a write.
    writes.current = writes.current
      .catch(() => {})
      .then(async () => {
        try {
          if (!store.current) throw new Error('storage-unavailable')
          await store.current.save(doc, persistedRevisions.current.get(doc.id) ?? 0)
          persistedRevisions.current.set(doc.id, doc.revision)
          setDocuments((docs) => [doc, ...docs.filter((item) => item.id !== doc.id)])
          if (latest.current?.id === doc.id && latest.current.revision === doc.revision)
            setStatus('saved')
        } catch {
          if (latest.current?.id === doc.id && latest.current.revision === doc.revision)
            setStatus('saveFailed')
        }
      })
  }

  async function reload(preferredId?: string) {
    if (!store.current) return
    const docs = await store.current.list()
    persistedRevisions.current = new Map(docs.map((doc) => [doc.id, doc.revision]))
    setDocuments(docs)
    latest.current =
      docs.find((doc) => doc.id === (preferredId ?? latest.current?.id)) ?? docs[0] ?? null
    setActive(latest.current)
    setStatus('saved')
  }

  const canNavigate = status === 'saved' && !driveBusy && !cloudBusy
  function createDocument() {
    if (!canNavigate) return
    void navigator.storage?.persist?.().catch(() => {})
    persist(importDocument(`${t('untitled')}.md`, new Uint8Array()))
  }

  async function importFile(file: File) {
    try {
      if (file.size > MAX_IMPORT_BYTES) throw new Error('file-too-large')
      const doc = importDocument(file.name, new Uint8Array(await file.arrayBuffer()))
      persist(doc)
      setError(null)
    } catch {
      setError('importFailed')
    }
  }

  return (
    <main>
      <header>
        <div>
          <h1>{productName(lang)}</h1>
          <span>{t('prototype')}</span>
        </div>
        <select
          aria-label={t('language')}
          value={lang}
          onChange={(event) => setLang(event.target.value as Lang)}
        >
          {LANGS.map((value) => (
            <option key={value} value={value}>
              {new Intl.DisplayNames([lang], { type: 'language' }).of(htmlLang(value))}
            </option>
          ))}
        </select>
      </header>

      <nav>
        <button disabled={!canNavigate} onClick={createDocument}>
          {t('newDocument')}
        </button>
        <button disabled={!canNavigate} onClick={() => importInput.current?.click()}>
          {t('importFile')}
        </button>
        <button
          disabled={!active}
          onClick={() => {
            if (active) void downloadDocument(active).catch(() => setError('exportFailed'))
          }}
        >
          {t('exportFile')}
        </button>
        <input
          ref={importInput}
          type="file"
          accept=".md,.markdown,.txt,text/plain,text/markdown"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0]
            event.target.value = ''
            if (file && canNavigate) void importFile(file)
          }}
        />
      </nav>
      <Suspense fallback={<p>{t('loading')}</p>}>
        <HwpPanel t={t} />
      </Suspense>
      <DrivePanel
        store={database}
        active={active}
        disabled={status !== 'saved' || composing || cloudBusy}
        t={t}
        onBusyChange={setDriveBusy}
        onReload={reload}
      />
      <CloudPanel
        store={database}
        active={active}
        disabled={status !== 'saved' || composing || driveBusy}
        t={t}
        onBusyChange={setCloudBusy}
        onReload={reload}
      />
      {error && <p role="alert">{t(error)}</p>}
      <div className="workspace">
        <aside aria-label={t('documents')}>
          {documents.map((doc) => (
            <button
              key={doc.id}
              disabled={!canNavigate}
              aria-current={active?.id === doc.id ? 'page' : undefined}
              onClick={() => {
                latest.current = doc
                setActive(doc)
                setError(null)
              }}
            >
              {doc.name}
            </button>
          ))}
        </aside>
        <section>
          {active ? (
            <>
              <h2>{active.name}</h2>
              <textarea
                aria-label={t('editor')}
                value={active.text}
                spellCheck={false}
                disabled={driveBusy || cloudBusy}
                onCompositionStart={() => setComposing(true)}
                onCompositionEnd={() => setComposing(false)}
                autoCapitalize="off"
                onChange={(event) => {
                  const doc = latest.current
                  if (doc) persist(updateDocument(doc, event.target.value))
                }}
              />
            </>
          ) : (
            <p>{t('empty')}</p>
          )}
          <footer>
            <span role="status" aria-live="polite">
              {t(status)}
            </span>
            {status === 'saveFailed' && (
              <button
                onClick={() => {
                  if (latest.current) persist(latest.current)
                }}
              >
                {t('retry')}
              </button>
            )}
          </footer>
        </section>
      </div>
    </main>
  )
}
