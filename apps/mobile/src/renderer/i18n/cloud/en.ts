import type zh from './zh'
export default {
  cloudMethod: 'Connection method',
  cloudPairCode: 'Phone pairing code (8 digits)',
  cloudPairHelp:
    'Enter the phone code from the PC Mobile-connect window. It is valid once for 3 minutes. Type P then Enter on the PC for a new code. This is separate from the ChatGPT approval code.',
  cloudAuthFailed:
    'Authentication expired or the code is incorrect. Get a new phone code on the PC and reconnect.',
  cloudReconnect: 'Reconnect this document at the current URL',
  cloudReconnectHelp:
    'The same document server has a new URL. Reconnect while retaining this device’s draft and previous revisions.',
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
