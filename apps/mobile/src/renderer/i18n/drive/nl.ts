import type zh from './zh'
export default {
  driveConnect: 'Drive verbinden',
  driveDisconnect: 'Drive loskoppelen',
  driveSync: 'Dit document synchroniseren',
  driveRefresh: 'Vernieuwen',
  driveRemoteFiles: 'Drive-versies',
  driveConnected: 'Drive verbonden',
  driveDisconnected: 'Drive niet verbonden',
  driveBusy: 'Synchroniseren…',
  driveSynced: 'Synchronisatie voltooid',
  driveConflict: 'Er zijn meerdere versies. Open elke tak vanuit de Drive-lijst.',
  driveFailed: 'Drive-actie mislukt. Lokale documenten blijven behouden.',
  driveSetup: 'Stel eerst Google OAuth in. Zie de installatiehandleiding.',
  driveAccountMismatch: 'Dit document hoort bij een ander Drive-account. Verbind dat account.',
  drivePending: 'Upload op dit apparaat in wachtrij',
  driveOffline: 'Offline. Gekoppelde documenten worden bij verbinding opnieuw gesynchroniseerd.',
  driveNotice: 'Drive bewaart wijzigingen als nieuwe bestanden. Cloud-AI is niet verbonden.',
} satisfies Record<keyof typeof zh, string>
