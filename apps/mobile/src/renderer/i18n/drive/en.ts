import type zh from './zh'
export default {
  driveCancelPending: 'Cancel pending creation (keep Drive files)',
  driveLiveMode: 'Editable Google documents',
  driveBackupMode: 'Legacy file backups',
  driveLiveNotice:
    'Sync plain-text Google documents without a PC. Use Google Drive in ChatGPT to edit the same document. Tables, styled and multi-tab documents are not edited here.',
  driveGoogleLink: 'Open Google document',
  driveLiveConflict: 'Both copies changed. Your draft is retained. Open the Drive copy separately.',
  driveUnsupported: 'Unsupported content or formatting. The original and local draft are retained.',
  driveUncertain:
    'Google’s result is uncertain. Retry sync to locate the same file; do not create another copy.',
  driveSetupHint:
    'Enable Drive API and Docs API in Google Cloud. Register the Android package/signing certificate or a web OAuth client for this exact origin. No client secret is needed.',
  driveWebClientId: 'Web OAuth client ID (public)',
  driveSaveSetup: 'Save login setup',
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
