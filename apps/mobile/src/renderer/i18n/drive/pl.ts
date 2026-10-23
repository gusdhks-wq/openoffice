import type zh from './zh'
export default {
  driveConnect: 'Połącz Drive',
  driveDisconnect: 'Odłącz Drive',
  driveSync: 'Synchronizuj ten dokument',
  driveRefresh: 'Odśwież',
  driveRemoteFiles: 'Wersje na Drive',
  driveConnected: 'Drive połączony',
  driveDisconnected: 'Drive odłączony',
  driveBusy: 'Synchronizacja…',
  driveSynced: 'Synchronizacja zakończona',
  driveConflict: 'Istnieje kilka wersji. Otwórz każdą gałąź z listy Drive.',
  driveFailed: 'Operacja Drive nie powiodła się. Dokumenty lokalne zachowano.',
  driveSetup: 'Najpierw skonfiguruj Google OAuth. Zobacz instrukcję konfiguracji.',
  driveAccountMismatch: 'Dokument należy do innego konta Drive. Połącz to konto.',
  drivePending: 'Wysyłanie w kolejce na tym urządzeniu',
  driveOffline:
    'Brak sieci. Synchronizacja powiązanych dokumentów zostanie ponowiona po połączeniu.',
  driveNotice: 'Drive zapisuje zmiany jako nowe pliki. AI w chmurze nie jest połączone.',
} satisfies Record<keyof typeof zh, string>
