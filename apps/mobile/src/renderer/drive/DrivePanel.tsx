import { Capacitor } from '@capacitor/core'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { LocalDocument } from '../documents'
import { exportDocument } from '../documents'
import type { DocumentStore } from '../store'
import type { MessageKey } from '../i18n'
import {
  authorizeDrive,
  revokeDrive,
  googleWebClientId,
  saveGoogleWebClientId,
  type DriveSession,
} from './auth'
import { createGoogleDocsRemote } from './google-docs'
import { GoogleDocsPanel } from './GoogleDocsPanel'
import { createDriveRemote } from './remote'
import { openDriveSnapshot, synchronizeDocument } from './sync'
import { DriveFailure, snapshotHeads, type DriveSnapshot } from './types'

interface Props {
  store: DocumentStore | null
  active: LocalDocument | null
  disabled: boolean
  t(key: MessageKey): string
  onBusyChange(busy: boolean): void
  onReload(preferredId?: string): Promise<void>
}

export function DrivePanel({ store, active, disabled, t, onBusyChange, onReload }: Props) {
  const [live, setLive] = useState(true)
  const [clientId, setClientId] = useState(googleWebClientId)
  const [session, setSession] = useState<DriveSession | null>(null)
  const sessionRef = useRef<DriveSession | null>(null)
  const [files, setFiles] = useState<DriveSnapshot[]>([])
  const [message, setMessage] = useState<MessageKey>('driveDisconnected')
  const [online, setOnline] = useState(navigator.onLine)
  const [busy, setBusy] = useState(false)
  const inFlight = useRef(false)
  const autoPaused = useRef(false)
  const syncRef = useRef<() => void>(() => {})
  const remote = useMemo(
    () =>
      createDriveRemote(() => {
        const current = sessionRef.current
        return current && current.expiresAt > Date.now() ? current.accessToken : null
      }),
    [],
  )
  const docsRemote = useMemo(
    () =>
      createGoogleDocsRemote(
        () => {
          const current = sessionRef.current
          return current && current.expiresAt > Date.now() ? current.accessToken : null
        },
        () => remote.account(),
      ),
    [remote],
  )

  useEffect(() => {
    const connected = () => {
      autoPaused.current = false
      setOnline(true)
    }
    const disconnected = () => setOnline(false)
    window.addEventListener('online', connected)
    window.addEventListener('offline', disconnected)
    return () => {
      window.removeEventListener('online', connected)
      window.removeEventListener('offline', disconnected)
    }
  }, [])

  useEffect(() => {
    if (!session) return
    const timeout = setTimeout(
      () => {
        sessionRef.current = null
        setSession(null)
        setFiles([])
        setMessage('driveDisconnected')
      },
      Math.max(0, session.expiresAt - Date.now()),
    )
    return () => clearTimeout(timeout)
  }, [session])

  async function run(task: () => Promise<{ message: MessageKey; id?: string }>) {
    if (inFlight.current || disabled || !store) return
    inFlight.current = true
    setBusy(true)
    onBusyChange(true)
    setMessage('driveBusy')
    try {
      const result = await task()
      await onReload(result.id)
      autoPaused.current = false
      setMessage(result.message)
    } catch (error) {
      autoPaused.current = true
      if (error instanceof DriveFailure && error.kind === 'auth') {
        sessionRef.current = null
        setSession(null)
        setFiles([])
      }
      setMessage(
        error instanceof DriveFailure && error.kind === 'account'
          ? 'driveAccountMismatch'
          : 'driveFailed',
      )
      // A failed transfer can still have durably queued a reserved file ID.
      await onReload().catch(() => {})
    } finally {
      inFlight.current = false
      setBusy(false)
      onBusyChange(false)
    }
  }

  function sync() {
    if (!active || !store) return
    void run(async () => {
      const outcome = await synchronizeDocument(store, active.id, remote)
      setFiles(snapshotHeads(await remote.list()))
      return { message: outcome === 'conflict' ? 'driveConflict' : 'driveSynced' }
    })
  }
  syncRef.current = sync

  const needsSync =
    !!active &&
    (!!active.pendingUpload || (!!active.drive && exportDocument(active) !== active.drive.raw))
  useEffect(() => {
    if (live || !needsSync || !session || disabled || busy || autoPaused.current) return
    setMessage('drivePending')
    if (!online) return
    const timeout = setTimeout(() => syncRef.current(), 1500)
    return () => clearTimeout(timeout)
  }, [active?.revision, needsSync, session, online, disabled, busy, live])

  return (
    <section className="drive-panel" aria-label={t('driveRemoteFiles')}>
      <p className="notice">
        {session ? t(live ? 'driveLiveNotice' : 'driveNotice') : t('localOnly')}
      </p>
      <label>
        <select
          aria-label={t('driveRemoteFiles')}
          disabled={busy}
          value={live ? 'docs' : 'backup'}
          onChange={(event) => {
            setLive(event.target.value === 'docs')
            setFiles([])
          }}
        >
          <option value="docs">{t('driveLiveMode')}</option>
          <option value="backup">{t('driveBackupMode')}</option>
        </select>
      </label>
      {!session && (
        <details>
          <summary>{t('driveSetup')}</summary>
          <p>{t('driveSetupHint')}</p>
          {!Capacitor.isNativePlatform() && (
            <form
              onSubmit={(event) => {
                event.preventDefault()
                try {
                  saveGoogleWebClientId(clientId)
                  setMessage('driveDisconnected')
                } catch {
                  setMessage('driveSetup')
                }
              }}
            >
              <label>
                {t('driveWebClientId')}
                <input
                  value={clientId}
                  onChange={(event) => setClientId(event.target.value)}
                  required
                  autoComplete="off"
                />
              </label>
              <button>{t('driveSaveSetup')}</button>
            </form>
          )}
        </details>
      )}
      <div className="drive-actions">
        {!session ? (
          <button
            disabled={disabled || busy || !online}
            onClick={() => {
              if (!Capacitor.isNativePlatform() && !googleWebClientId()) {
                setMessage('driveSetup')
                return
              }
              void run(async () => {
                const next = await authorizeDrive()
                sessionRef.current = next
                await remote.account()
                setSession(next)
                if (!live) setFiles(snapshotHeads(await remote.list()))
                return { message: 'driveConnected' }
              })
            }}
          >
            {t('driveConnect')}
          </button>
        ) : (
          <>
            {!live && (
              <button disabled={disabled || busy || !online || !active} onClick={sync}>
                {t('driveSync')}
              </button>
            )}
            {!live && (
              <button
                disabled={disabled || busy || !online}
                onClick={() =>
                  void run(async () => {
                    setFiles(snapshotHeads(await remote.list()))
                    return { message: 'driveConnected' }
                  })
                }
              >
                {t('driveRefresh')}
              </button>
            )}
            <button
              disabled={disabled || busy || !online}
              onClick={() =>
                void run(async () => {
                  await revokeDrive(session)
                  sessionRef.current = null
                  setSession(null)
                  setFiles([])
                  return { message: 'driveDisconnected' }
                })
              }
            >
              {t('driveDisconnect')}
            </button>
          </>
        )}
      </div>
      {session && live && (
        <GoogleDocsPanel
          store={store}
          active={active}
          disabled={disabled || busy}
          remote={docsRemote}
          t={t}
          onBusyChange={(value) => {
            setBusy(value)
            onBusyChange(value)
          }}
          onReload={onReload}
        />
      )}
      <p role="status" aria-live="polite">
        {!online ? t('driveOffline') : t(message)}
      </p>
      {active?.pendingUpload && <p>{t('drivePending')}</p>}
      {!live && files.length > 0 && (
        <details>
          <summary>{t('driveRemoteFiles')}</summary>
          <ul>
            {files.map((file) => (
              <li key={file.id}>
                <button
                  disabled={disabled || busy || !online}
                  onClick={() =>
                    void run(async () => {
                      if (!store) throw new DriveFailure('missing')
                      const id = await openDriveSnapshot(store, file, remote)
                      return { message: 'driveSynced', id }
                    })
                  }
                >
                  {file.name} · {file.modifiedTime}
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  )
}
