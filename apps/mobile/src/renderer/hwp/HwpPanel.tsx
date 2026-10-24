import { useEffect, useRef, useState } from 'react'
import { createEditor, type RhwpEditor } from '@rhwp/editor'
import type { MessageKey } from '../i18n'
import { downloadBytes } from '../files'
import { exportHwpBackup, importHwpBackup, MAX_HWP_BACKUP_BYTES } from './backup'
import { initializeHwp, openHwpEngine } from './engine'
import { assertEditableSource, exportNativeHwp, restoreNativeBytes } from './native-save'
import {
  importHwp,
  MAX_HWP_BYTES,
  openHwpStore,
  type HwpStore,
  type HwpWorkspace,
} from './workspace'
import { createAgentBridge } from '../../../../hwp/src/renderer/ai/agent-bridge'
import {
  seededStudioSettings,
  STUDIO_SETTINGS_KEY,
} from '../../../../hwp/src/renderer/studio-settings'
import blankUrl from '../../../../hwp/src/renderer/assets/blank.hwp?url'

export function HwpPanel({ t }: { t: (key: MessageKey) => string }) {
  const [items, setItems] = useState<HwpWorkspace[]>([])
  const [active, setActive] = useState<HwpWorkspace | null>(null)
  const [busy, setBusy] = useState(true)
  const [expanded, setExpanded] = useState(false)
  const [unsaved, setUnsaved] = useState(false)
  const [status, setStatus] = useState<MessageKey>('loading')
  const database = useRef<HwpStore | null>(null)
  const editor = useRef<RhwpEditor | null>(null)
  const current = useRef<HwpWorkspace | null>(null)
  const host = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const mounted = useRef(false)
  const working = useRef(false)
  const composing = useRef(false)
  const pending = useRef(false)
  const paused = useRef(false)
  const downloadRequested = useRef(false)
  const lastInput = useRef(0)
  const foreign = useRef(0)
  const stopEvents = useRef<(() => void) | null>(null)
  const saveRef = useRef<(download?: boolean) => Promise<void>>(async () => {})

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
      stopEvents.current?.()
      owned?.close()
      database.current = null
      editor.current?.destroy()
      editor.current = null
    }
  }, [])

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!pending.current) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    const background = () => {
      if (document.visibilityState === 'hidden') void saveRef.current()
    }
    document.addEventListener('visibilitychange', background)
    const timer = setInterval(() => {
      if (!working.current && !composing.current && Date.now() - lastInput.current > 1000)
        void saveRef.current(downloadRequested.current)
    }, 1500)
    return () => {
      clearInterval(timer)
      window.removeEventListener('beforeunload', warn)
      document.removeEventListener('visibilitychange', background)
    }
  }, [])

  async function open(workspace: HwpWorkspace, isNew = false) {
    if (working.current || pending.current || !host.current) return
    working.current = true
    setBusy(true)
    setStatus('loading')
    let candidate: RhwpEditor | null = null
    const container = document.createElement('div')
    container.className = 'hwp-editor-instance'
    container.style.visibility = 'hidden'
    host.current.appendChild(container)
    try {
      if (editor.current) {
        const count = await createAgentBridge(() => editor.current).foreignChanges()
        if (count !== foreign.current) {
          pending.current = true
          setUnsaved(true)
          setStatus('saving')
          return
        }
      }
      assertEditableSource(workspace)
      localStorage.setItem(
        STUDIO_SETTINGS_KEY,
        seededStudioSettings(localStorage.getItem(STUDIO_SETTINGS_KEY), 'system'),
      )
      let bytes = workspace.edited ?? workspace.original
      if (!workspace.edited && workspace.operations.length) {
        await initializeHwp()
        const legacy = openHwpEngine(workspace)
        try {
          bytes = restoreNativeBytes(
            workspace,
            /\.hwpx$/i.test(workspace.name) ? legacy.doc.exportHwpx() : legacy.doc.exportHwp(),
          )
        } finally {
          legacy.close()
        }
      }
      const locale = document.documentElement.lang.startsWith('ko') ? 'ko' : 'en'
      candidate = await createEditor(container, {
        studioUrl: new URL(`./studio/index.html?chrome=embed&lang=${locale}`, window.location.href)
          .href,
        renderer: 'canvas2d',
      })
      if (!mounted.current) return
      await candidate.loadFile(bytes, workspace.name, { skipUnsavedGuard: true })
      if ((await candidate.commands.context()).passwordProtected !== false)
        throw new Error('hwp-protected-source')
      if (!mounted.current) return
      const bridge = createAgentBridge(() => candidate)
      const initialForeign = await bridge.foreignChanges()
      if (isNew) {
        if (!database.current) throw new Error('storage-unavailable')
        await database.current.save(workspace, 0)
      }
      if (!mounted.current) return
      stopEvents.current?.()
      editor.current?.destroy()
      for (const child of Array.from(host.current!.children))
        if (child !== container) child.remove()
      editor.current = candidate
      const live = candidate
      candidate = null
      current.current = workspace
      foreign.current = initialForeign
      pending.current = false
      paused.current = false
      composing.current = false
      setUnsaved(false)
      setActive(workspace)
      setStatus('saved')
      container.style.visibility = ''
      if (isNew) setItems((list) => [workspace, ...list.filter((item) => item.id !== workspace.id)])
      const frame = live.element.contentWindow
      const shortcut = (event: KeyboardEvent) => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
          event.preventDefault()
          event.stopImmediatePropagation()
          void saveRef.current(true)
        }
      }
      const changed = () => {
        pending.current = true
        lastInput.current = Date.now()
        setUnsaved(true)
        setStatus(paused.current ? 'hwpSaveFailed' : 'saving')
      }
      const start = () => {
        composing.current = true
        changed()
      }
      const end = () => {
        composing.current = false
        changed()
      }
      frame?.addEventListener('input', changed, true)
      frame?.addEventListener('compositionstart', start, true)
      frame?.addEventListener('compositionend', end, true)
      // Changes from menus and pointer formatting need the same persistence guard as typing.
      frame?.addEventListener('keydown', changed, true)
      frame?.addEventListener('keydown', shortcut, true)
      const pointer = () => {
        lastInput.current = Date.now()
      }
      frame?.addEventListener('pointerup', pointer, true)
      stopEvents.current = () => {
        frame?.removeEventListener('input', changed, true)
        frame?.removeEventListener('compositionstart', start, true)
        frame?.removeEventListener('compositionend', end, true)
        frame?.removeEventListener('keydown', changed, true)
        frame?.removeEventListener('keydown', shortcut, true)
        frame?.removeEventListener('pointerup', pointer, true)
      }
    } catch {
      setStatus('hwpFailed')
    } finally {
      candidate?.destroy()
      if (editor.current?.element.parentElement !== container) container.remove()
      working.current = false
      if (mounted.current) setBusy(false)
    }
  }

  async function save(download = false) {
    if (download) downloadRequested.current = true
    const live = editor.current,
      workspace = current.current,
      store = database.current
    if (
      !live ||
      !workspace ||
      !store ||
      working.current ||
      composing.current ||
      (!download && paused.current)
    )
      return
    if (download) paused.current = false
    working.current = true
    let freeze = false
    try {
      const bridge = createAgentBridge(() => live)
      const changes = await bridge.foreignChanges()
      const dirty = (await live.commands.context()).isDirty === true
      if (!download && !dirty && !pending.current) return
      if (!download && changes === foreign.current && !pending.current) return
      if (download) {
        live.element.inert = true
        freeze = true
      }
      setBusy(true)
      setStatus('saving')
      const bytes =
        !dirty && !workspace.operations.length && !workspace.edited
          ? workspace.original
          : await exportNativeHwp(live, workspace)
      const captured = await bridge.foreignChanges()
      if (captured !== changes) throw new Error('hwp-changed-during-save')
      const updated: HwpWorkspace = {
        ...workspace,
        edited: bytes.slice(),
        operations: [],
        revision: workspace.revision + 1,
        updatedAt: Date.now(),
      }
      try {
        await store.save(updated, workspace.revision)
      } catch (error) {
        if (download)
          await downloadBytes(
            workspace.name.replace(/\.(hwp|hwpx)$/i, '.edited.$1'),
            bytes,
            /\.hwpx$/i.test(workspace.name) ? 'application/hwp+zip' : 'application/x-hwp',
          )
        throw error
      }
      if (!mounted.current) return
      current.current = updated
      setActive(updated)
      setItems((list) => [updated, ...list.filter((item) => item.id !== updated.id)])
      foreign.current = captured
      const stillCurrent = !composing.current && (await bridge.foreignChanges()) === captured
      pending.current = !stillCurrent
      setUnsaved(!stillCurrent)
      setStatus(stillCurrent ? 'saved' : 'saving')
      // Autosave never clears the editor's dirty flag: edits arriving during persistence remain visible.
      if (download) {
        if (!stillCurrent) throw new Error('hwp-changed-during-save')
        downloadRequested.current = false
        try {
          await downloadBytes(
            workspace.name.replace(/\.(hwp|hwpx)$/i, '.edited.$1'),
            bytes,
            /\.hwpx$/i.test(workspace.name) ? 'application/hwp+zip' : 'application/x-hwp',
          )
        } catch {
          setStatus('exportFailed')
        }
      }
    } catch (error) {
      if (!(error instanceof Error && error.message === 'hwp-changed-during-save')) {
        paused.current = true
        downloadRequested.current = false
      }
      pending.current = true
      setUnsaved(true)
      setStatus(
        error instanceof Error && error.message === 'hwp-changed-during-save'
          ? 'saving'
          : 'hwpSaveFailed',
      )
    } finally {
      if (freeze) live.element.inert = false
      working.current = false
      if (mounted.current) setBusy(false)
    }
  }
  saveRef.current = save

  async function importFile(file: File) {
    try {
      const backup = /\.ieum-hwp\.json$/i.test(file.name)
      if (file.size > (backup ? MAX_HWP_BACKUP_BYTES : MAX_HWP_BYTES)) throw new Error('file-limit')
      const bytes = new Uint8Array(await file.arrayBuffer())
      await open(backup ? importHwpBackup(bytes) : importHwp(file.name, bytes), true)
      void navigator.storage?.persist?.().catch(() => {})
    } catch {
      setStatus('hwpFailed')
    }
  }

  const perform = (action: () => Promise<void>) => {
    void action().catch(() => setStatus('exportFailed'))
  }
  return (
    <details className={`hwp-panel${expanded ? ' is-expanded' : ''}`} open>
      <summary
        onClick={(event) => {
          if (expanded) event.preventDefault()
        }}
      >
        {t('hwpTitle')}
      </summary>
      {active ? (
        <details className="hwp-help hwp-aux">
          <summary>{t('hwpHelp')}</summary>
          <p>{t('hwpScope')}</p>
        </details>
      ) : (
        <p>{t('hwpScope')}</p>
      )}
      <div className="cloud-actions">
        <button
          className="hwp-aux"
          disabled={busy || unsaved}
          onClick={() =>
            perform(async () => {
              const response = await fetch(blankUrl)
              if (!response.ok) throw new Error('blank-document-unavailable')
              await open(
                importHwp(`${t('untitled')}.hwp`, new Uint8Array(await response.arrayBuffer())),
                true,
              )
            })
          }
        >
          {t('hwpNew')}
        </button>
        <button
          className="hwp-aux"
          disabled={busy || unsaved}
          onClick={() => input.current?.click()}
        >
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
            if (file && !busy && !pending.current) void importFile(file)
          }}
        />
        {active && (
          <>
            <button disabled={busy} onClick={() => void save(true)}>
              {t('hwpSaveNative')}
            </button>
            <button
              className="hwp-aux"
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
              className="hwp-aux"
              disabled={busy || unsaved}
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
            disabled={busy || unsaved}
            aria-current={active?.id === item.id ? 'page' : undefined}
            onClick={() => void open(item)}
          >
            {item.name}
          </button>
        ))}
      </div>
      {active && <h2>{active.name}</h2>}
      {active && (
        <div className="hwp-view-actions">
          <button
            disabled={busy}
            aria-label={t('hwpZoomOut')}
            onClick={() =>
              perform(async () => {
                await editor.current?.commands.execute('view:zoom-out')
              })
            }
          >
            −
          </button>
          <button
            disabled={busy}
            onClick={() =>
              perform(async () => {
                await editor.current?.commands.execute('view:zoom-100')
              })
            }
          >
            100%
          </button>
          <button
            disabled={busy}
            aria-label={t('hwpZoomIn')}
            onClick={() =>
              perform(async () => {
                await editor.current?.commands.execute('view:zoom-in')
              })
            }
          >
            +
          </button>
          <button
            disabled={busy}
            onClick={() =>
              perform(async () => {
                await editor.current?.commands.execute('view:zoom-fit-width')
              })
            }
          >
            {t('hwpFitWidth')}
          </button>
          <button onClick={() => setExpanded((value) => !value)}>
            {t(expanded ? 'hwpExitFullscreen' : 'hwpFullscreen')}
          </button>
        </div>
      )}
      <div
        ref={host}
        className={`hwp-studio-host${active ? ' is-open' : ''}`}
        aria-label={t('editor')}
      />
      <p
        role={
          ['hwpFailed', 'hwpSaveFailed', 'openFailed', 'exportFailed'].includes(status)
            ? 'alert'
            : 'status'
        }
      >
        {t(status)}
      </p>
      {status === 'hwpSaveFailed' && (
        <button disabled={busy} onClick={() => void save(true)}>
          {t('retry')}
        </button>
      )}
    </details>
  )
}
