import { useEffect, useRef, useState } from 'react'
import type { LocalDocument } from '../documents'
import type { DocumentStore } from '../store'
import type { MessageKey } from '../i18n'
import { DriveFailure } from './types'
import { googleDocumentURL, type GoogleDocInfo, type GoogleDocsRemote } from './google-docs'
import { openGoogleDoc, synchronizeGoogleDoc, cancelGoogleDocCreation } from './google-docs-sync'

interface Props {
  store: DocumentStore | null
  active: LocalDocument | null
  disabled: boolean
  remote: GoogleDocsRemote
  t(key: MessageKey): string
  onBusyChange(value: boolean): void
  onReload(id?: string): Promise<void>
}
export function GoogleDocsPanel({
  store,
  active,
  disabled,
  remote,
  t,
  onBusyChange,
  onReload,
}: Props) {
  const [files, setFiles] = useState<GoogleDocInfo[]>([])
  const [message, setMessage] = useState<MessageKey>('driveConnected')
  const [busy, setBusy] = useState(false),
    [online, setOnline] = useState(navigator.onLine)
  const inFlight = useRef(false),
    paused = useRef(false),
    loaded = useRef(false)
  const refreshRef = useRef<() => void>(() => {}),
    syncRef = useRef<() => void>(() => {})
  const linked = !!active?.googleDoc || !!active?.pendingGoogleDoc
  const dirty = !!active && (!!active.pendingGoogleDoc || active.googleDoc?.text !== active.text)
  async function run(action: () => Promise<string | void>) {
    if (!store || disabled || inFlight.current) return
    inFlight.current = true
    setBusy(true)
    onBusyChange(true)
    setMessage('driveBusy')
    try {
      const id = await action()
      await onReload(id || undefined)
      paused.current = false
      setMessage('driveSynced')
    } catch (error) {
      paused.current = true
      const kind = error instanceof DriveFailure ? error.kind : ''
      setMessage(
        kind === 'account'
          ? 'driveAccountMismatch'
          : kind === 'conflict'
            ? 'driveLiveConflict'
            : kind === 'structure'
              ? 'driveUnsupported'
              : kind === 'uncertain'
                ? 'driveUncertain'
                : 'driveFailed',
      )
      await onReload().catch(() => {})
    } finally {
      inFlight.current = false
      setBusy(false)
      onBusyChange(false)
    }
  }
  function refresh() {
    void run(async () => {
      setFiles(await remote.list())
    })
  }
  function sync() {
    if (!store || !active) return
    void run(async () => {
      await synchronizeGoogleDoc(store, active.id, remote)
      setFiles(await remote.list())
    })
  }
  refreshRef.current = refresh
  syncRef.current = sync
  useEffect(() => {
    if (store && !disabled && !loaded.current) {
      loaded.current = true
      refreshRef.current()
    }
  }, [store, disabled])
  useEffect(() => {
    const connected = () => {
        paused.current = false
        setOnline(true)
      },
      disconnected = () => setOnline(false)
    window.addEventListener('online', connected)
    window.addEventListener('offline', disconnected)
    return () => {
      window.removeEventListener('online', connected)
      window.removeEventListener('offline', disconnected)
    }
  }, [])
  useEffect(() => {
    if (!linked || !online || disabled || busy || paused.current) return
    if (dirty) setMessage('drivePending')
    const timer = setTimeout(() => syncRef.current(), dirty ? 1500 : 15000)
    return () => clearTimeout(timer)
  }, [active?.revision, linked, dirty, online, disabled, busy])
  return (
    <div className="google-docs-panel">
      <div className="drive-actions">
        <button disabled={disabled || busy || !online || !active} onClick={sync}>
          {t('driveSync')}
        </button>
        <button disabled={disabled || busy || !online} onClick={refresh}>
          {t('driveRefresh')}
        </button>
        {active?.pendingGoogleDoc?.phase === 'creating' && !active.pendingGoogleDoc.id && (
          <button
            disabled={disabled || busy}
            onClick={() =>
              void run(async () => {
                await cancelGoogleDocCreation(
                  store!,
                  active.id,
                  active.pendingGoogleDoc!.operationId,
                )
              })
            }
          >
            {t('driveCancelPending')}
          </button>
        )}
        {active?.googleDoc && (
          <a
            href={googleDocumentURL(active.googleDoc.id)}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('driveGoogleLink')}
          </a>
        )}
      </div>
      <p role="status" aria-live="polite">
        {t(online ? message : 'driveOffline')}
      </p>
      {files.length > 0 && (
        <ul aria-label={t('driveLiveMode')}>
          {files.map((file) => (
            <li key={file.id}>
              <button
                disabled={disabled || busy || !online}
                onClick={() => void run(async () => openGoogleDoc(store!, file.id, remote))}
              >
                {file.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
