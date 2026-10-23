import { useEffect, useRef, useState } from 'react'
import type { MessageKey } from '../i18n'
import { downloadBytes } from '../files'
import { exportHwpBackup, importHwpBackup, MAX_HWP_BACKUP_BYTES } from './backup'
import { initializeHwp, openHwpEngine, type HwpEngine } from './engine'
import {
  appendReplacement,
  importHwp,
  MAX_HWP_BYTES,
  openHwpStore,
  replacement,
  type HwpStore,
  type HwpWorkspace,
} from './workspace'

export function HwpPanel({ t }: { t: (key: MessageKey) => string }) {
  const [items, setItems] = useState<HwpWorkspace[]>([])
  const [active, setActive] = useState<HwpWorkspace | null>(null)
  const [busy, setBusy] = useState(true)
  const [status, setStatus] = useState<MessageKey>('loading')
  const [page, setPage] = useState(0)
  const [pages, setPages] = useState(0)
  const [find, setFind] = useState('')
  const [value, setValue] = useState('')
  const database = useRef<HwpStore | null>(null)
  const engine = useRef<HwpEngine | null>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const mounted = useRef(false)
  const working = useRef(false)

  useEffect(() => {
    mounted.current = true
    let disposed = false
    let owned: HwpStore | null = null
    void openHwpStore()
      .then(async (store) => {
        owned = store
        if (disposed) {
          store.close()
          return
        }
        database.current = store
        const documents = await store.list()
        if (!disposed) {
          setItems(documents)
          setStatus('saved')
          setBusy(false)
        }
      })
      .catch(() => {
        if (!disposed) {
          setStatus('openFailed')
          setBusy(false)
        }
      })
    return () => {
      disposed = true
      mounted.current = false
      owned?.close()
      database.current = null
      engine.current?.close()
      engine.current = null
    }
  }, [])

  useEffect(() => {
    const current = engine.current
    if (!current || !canvas.current) return
    try {
      // Canvas rendering never inserts untrusted engine HTML or SVG into the app DOM.
      current.doc.renderPageToCanvas(page, canvas.current, 1)
    } catch {
      setStatus('hwpFailed')
    }
  }, [active, page])

  async function open(workspace: HwpWorkspace, expectedRevision?: number) {
    if (working.current) return
    working.current = true
    setBusy(true)
    setStatus('loading')
    let candidate: HwpEngine | null = null
    try {
      await initializeHwp()
      if (!mounted.current) return
      candidate = openHwpEngine(workspace)
      const count = candidate.doc.pageCount()
      if (!count || count > 2000) throw new Error('page-limit')
      if (expectedRevision !== undefined) {
        if (!database.current) throw new Error('storage-unavailable')
        // Publish an edit only after both its source and command journal are durable.
        await database.current.save(workspace, expectedRevision)
      }
      if (!mounted.current) return
      engine.current?.close()
      engine.current = candidate
      candidate = null
      setActive(workspace)
      setPage(0)
      setPages(count)
      setStatus('saved')
      if (expectedRevision !== undefined)
        setItems((current) => [workspace, ...current.filter((item) => item.id !== workspace.id)])
    } catch {
      if (mounted.current) setStatus('hwpFailed')
    } finally {
      candidate?.close()
      working.current = false
      if (mounted.current) setBusy(false)
    }
  }

  async function importFile(file: File) {
    try {
      const backup = /\.ieum-hwp\.json$/i.test(file.name)
      if (file.size > (backup ? MAX_HWP_BACKUP_BYTES : MAX_HWP_BYTES)) throw new Error('file-limit')
      const bytes = new Uint8Array(await file.arrayBuffer())
      const workspace = backup ? importHwpBackup(bytes) : importHwp(file.name, bytes)
      await open(workspace, 0)
      void navigator.storage?.persist?.().catch(() => {})
    } catch {
      setStatus('hwpFailed')
    }
  }

  const perform = (action: () => Promise<void>) => {
    void action().catch(() => setStatus('exportFailed'))
  }
  return (
    <details className="hwp-panel" open>
      <summary>{t('hwpTitle')}</summary>
      <p>{t('hwpScope')}</p>
      <div className="cloud-actions">
        <button disabled={busy} onClick={() => input.current?.click()}>
          {t('hwpOpen')}
        </button>
        <input
          ref={input}
          type="file"
          accept=".hwp,.hwpx,.ieum-hwp.json"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0]
            event.target.value = ''
            if (file && !busy) void importFile(file)
          }}
        />
        {active && (
          <>
            <button
              disabled={busy}
              onClick={() =>
                perform(() =>
                  downloadBytes(
                    active.name,
                    active.original,
                    /\.hwpx$/i.test(active.name) ? 'application/hwp+zip' : 'application/x-hwp',
                  ),
                )
              }
            >
              {t('hwpOriginal')}
            </button>
            <button
              disabled={busy}
              onClick={() =>
                perform(() =>
                  downloadBytes(
                    `${active.name}.ieum-hwp.json`,
                    exportHwpBackup(active),
                    'application/json',
                  ),
                )
              }
            >
              {t('hwpBackup')}
            </button>
          </>
        )}
      </div>
      <div className="hwp-list">
        {items.map((item) => (
          <button
            key={item.id}
            disabled={busy}
            aria-current={active?.id === item.id ? 'page' : undefined}
            onClick={() => void open(item)}
          >
            {item.name}
          </button>
        ))}
      </div>
      {active && (
        <>
          <h2>{active.name}</h2>
          <div className="cloud-actions">
            <button disabled={busy || page === 0} onClick={() => setPage(page - 1)}>
              {t('hwpPrevious')}
            </button>
            <output>
              {page + 1} / {pages}
            </output>
            <button disabled={busy || page + 1 >= pages} onClick={() => setPage(page + 1)}>
              {t('hwpNext')}
            </button>
          </div>
          <div className="hwp-page">
            <canvas ref={canvas} aria-label={t('hwpPage')} />
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault()
              if (!active || busy) return
              try {
                void open(appendReplacement(active, replacement(find, value)), active.revision)
              } catch {
                setStatus('hwpFailed')
              }
            }}
          >
            <label>
              {t('hwpFind')}
              <input
                value={find}
                maxLength={20_000}
                required
                disabled={busy}
                onChange={(event) => setFind(event.target.value)}
              />
            </label>
            <label>
              {t('hwpReplacement')}
              <input
                value={value}
                maxLength={20_000}
                disabled={busy}
                onChange={(event) => setValue(event.target.value)}
              />
            </label>
            <div className="cloud-actions">
              <button disabled={busy || !find}>{t('hwpReplace')}</button>
              <button
                type="button"
                disabled={busy || active.operations.length === 0}
                onClick={() =>
                  void open(
                    {
                      ...active,
                      operations: active.operations.slice(0, -1),
                      revision: active.revision + 1,
                      updatedAt: Date.now(),
                    },
                    active.revision,
                  )
                }
              >
                {t('hwpUndo')}
              </button>
            </div>
          </form>
        </>
      )}
      <p
        role={
          status === 'hwpFailed' || status === 'openFailed' || status === 'exportFailed'
            ? 'alert'
            : 'status'
        }
      >
        {t(status)}
      </p>
    </details>
  )
}
