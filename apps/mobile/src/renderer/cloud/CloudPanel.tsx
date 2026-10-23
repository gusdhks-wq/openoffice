import { useEffect, useRef, useState } from 'react'
import {
  CloudDocumentsClient,
  DocumentFailure,
  type DocumentInfo,
  type VersionInfo,
} from '@genoffice/cloud-documents/browser'
import { exportDocument, type LocalDocument } from '../documents'
import type { DocumentStore } from '../store'
import type { MessageKey } from '../i18n'
import {
  copyCloudDocument,
  openCloudDocument,
  restoreCloudDocument,
  shareCloudDocument,
  syncCloudDocument,
} from './sync'

interface Props {
  store: DocumentStore | null
  active: LocalDocument | null
  disabled: boolean
  t(key: MessageKey): string
  onBusyChange(value: boolean): void
  onReload(id?: string): Promise<void>
}
export function CloudPanel({ store, active, disabled, t, onBusyChange, onReload }: Props) {
  const [address, setAddress] = useState('')
  const [key, setKey] = useState('')
  const token = useRef<string | null>(null)
  const [client, setClient] = useState<CloudDocumentsClient | null>(null)
  const [documents, setDocuments] = useState<DocumentInfo[]>([])
  const [versions, setVersions] = useState<VersionInfo[]>([])
  const [message, setMessage] = useState<MessageKey>('cloudDisconnected')
  const [busy, setBusy] = useState(false)
  const inFlight = useRef(false)
  const paused = useRef(false)
  const syncRef = useRef<() => void>(() => {})
  const bound =
    !!client &&
    active?.cloud?.origin === client.origin &&
    active.cloud.workspaceId === client.workspaceId
  const dirty =
    !!active &&
    (!!active.pendingCloudUpload || (!!active.cloud && exportDocument(active) !== active.cloud.raw))

  async function run(action: () => Promise<string | void>) {
    if (!store || disabled || inFlight.current) return
    inFlight.current = true
    setBusy(true)
    onBusyChange(true)
    setMessage('cloudBusy')
    try {
      const id = await action()
      await onReload(id || undefined)
      paused.current = false
      setMessage('cloudConnected')
    } catch (error) {
      paused.current = true
      setMessage(
        error instanceof DocumentFailure && error.code === 'conflict'
          ? 'cloudConflict'
          : 'cloudFailed',
      )
      await onReload().catch(() => {})
    } finally {
      inFlight.current = false
      setBusy(false)
      onBusyChange(false)
    }
  }
  function sync() {
    if (!store || !client || !active) return
    void run(async () => {
      await syncCloudDocument(store, active.id, client)
      setDocuments(await client.list())
      setVersions([])
    })
  }
  syncRef.current = sync
  useEffect(() => {
    if (!client || !bound || disabled || busy || paused.current || !navigator.onLine) return
    if (dirty) setMessage('cloudPending')
    const timeout = setTimeout(() => syncRef.current(), dirty ? 1500 : 15_000)
    return () => clearTimeout(timeout)
  }, [client, bound, active?.revision, disabled, busy, dirty])
  useEffect(() => {
    const reconnect = () => {
      paused.current = false
      syncRef.current()
    }
    window.addEventListener('online', reconnect)
    return () => window.removeEventListener('online', reconnect)
  }, [])

  return (
    <details className="cloud-panel">
      <summary>{t('cloudTitle')}</summary>
      <p>{t('cloudNotice')}</p>
      {!client ? (
        <form
          onSubmit={(event) => {
            event.preventDefault()
            void run(async () => {
              token.current = key
              const next = new CloudDocumentsClient(address, () => token.current)
              if ((await next.connect()).role !== 'owner') throw new DocumentFailure('unauthorized')
              setDocuments(await next.list())
              setClient(next)
              setKey('')
            })
          }}
        >
          <label>
            {t('cloudURL')}
            <input
              type="url"
              required
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="https://documents.example.com"
              autoComplete="off"
            />
          </label>
          <label>
            {t('cloudKey')}
            <input
              type="password"
              required
              value={key}
              onChange={(event) => setKey(event.target.value)}
              autoComplete="off"
            />
          </label>
          <button disabled={disabled || busy}>{t('cloudConnect')}</button>
        </form>
      ) : (
        <div className="cloud-actions">
          <button disabled={disabled || busy || !active} onClick={sync}>
            {t('cloudSync')}
          </button>
          <button
            disabled={disabled || busy}
            onClick={() =>
              void run(async () => {
                setDocuments(await client.list())
              })
            }
          >
            {t('cloudRefresh')}
          </button>
          {active && (
            <button
              disabled={disabled || busy}
              onClick={() =>
                void run(async () => {
                  await copyCloudDocument(store!, active.id, client)
                  setDocuments(await client.list())
                })
              }
            >
              {t('cloudCopy')}
            </button>
          )}
          <button
            disabled={disabled || busy}
            onClick={() => {
              token.current = null
              setClient(null)
              setKey('')
              setVersions([])
              setDocuments([])
              setMessage('cloudDisconnected')
            }}
          >
            {t('cloudDisconnect')}
          </button>
        </div>
      )}
      <p role="status" aria-live="polite">
        {t(message)}
      </p>
      {active?.pendingCloudUpload && <p>{t('cloudPending')}</p>}
      {client && active && bound && (
        <div className="cloud-actions">
          <button
            disabled={disabled || busy || dirty}
            onClick={() =>
              void run(async () => {
                await shareCloudDocument(store!, active.id, client, !active.cloud!.sharedWithAgent)
                setDocuments(await client.list())
              })
            }
          >
            {t(active.cloud!.sharedWithAgent ? 'cloudUnshare' : 'cloudShare')}
          </button>
          <button
            disabled={disabled || busy}
            onClick={() =>
              void run(async () => {
                setVersions(await client.versions(active.cloud!.id))
              })
            }
          >
            {t('cloudVersions')}
          </button>
        </div>
      )}
      {client && documents.length > 0 && (
        <ul aria-label={t('documents')}>
          {documents.map((doc) => (
            <li key={doc.id}>
              <button
                disabled={disabled || busy}
                onClick={() =>
                  void run(async () => {
                    const id = await openCloudDocument(store!, doc.id, client)
                    setVersions([])
                    return id
                  })
                }
              >
                {doc.name}
              </button>
            </li>
          ))}
        </ul>
      )}
      {client && active && versions.length > 0 && (
        <ul aria-label={t('cloudVersions')}>
          {versions.map((version) => (
            <li key={version.revision}>
              <span>
                {version.createdAt} · {version.name}
              </span>
              <button
                disabled={disabled || busy || dirty || version.revision === active.cloud?.revision}
                onClick={() =>
                  void run(async () => {
                    const id = await restoreCloudDocument(
                      store!,
                      active.id,
                      client,
                      version.revision,
                    )
                    setVersions([])
                    setDocuments(await client.list())
                    return id
                  })
                }
              >
                {t('cloudRestore')}
              </button>
            </li>
          ))}
        </ul>
      )}
    </details>
  )
}
