import type zh from './zh'
export default {
  cloudTitle: 'External Codex documents',
  cloudURL: 'Document server URL',
  cloudKey: 'Owner connection key',
  cloudConnect: 'Connect server',
  cloudDisconnect: 'Disconnect server',
  cloudSync: 'Sync document',
  cloudRefresh: 'Refresh documents',
  cloudShare: 'Share with external Codex',
  cloudUnshare: 'Stop sharing',
  cloudVersions: 'Versions',
  cloudRestore: 'Restore',
  cloudCopy: 'Upload as a new document',
  cloudConnected: 'Document server connected',
  cloudDisconnected: 'Document server disconnected',
  cloudBusy: 'Working with document server…',
  cloudFailed: 'Server action failed. Local drafts are retained.',
  cloudConflict:
    'The server has another revision. Open it separately or upload this draft as a new document.',
  cloudPending: 'Server upload pending',
  cloudNotice:
    'External Codex can read and edit only shared documents. The connection key stays in memory for this run.',
} satisfies Record<keyof typeof zh, string>
