import type zh from './zh'
export default {
  driveConnect: 'Connect Drive',
  driveDisconnect: 'Disconnect Drive',
  driveSync: 'Sync this document',
  driveRefresh: 'Refresh',
  driveRemoteFiles: 'Drive versions',
  driveConnected: 'Drive connected',
  driveDisconnected: 'Drive disconnected',
  driveBusy: 'Synchronizing…',
  driveSynced: 'Synchronization complete',
  driveConflict: 'Several versions exist. Open each branch from the Drive list.',
  driveFailed: 'Drive action failed. Local documents are retained.',
  driveSetup: 'Configure Google OAuth first. See the app setup guide.',
  driveAccountMismatch: 'This document belongs to another Drive account. Reconnect that account.',
  drivePending: 'Upload queued on this device',
  driveOffline: 'Offline. Linked documents will retry when connected.',
  driveNotice: 'Drive keeps edits as new files. Cloud AI is not connected.',
} satisfies Record<keyof typeof zh, string>
