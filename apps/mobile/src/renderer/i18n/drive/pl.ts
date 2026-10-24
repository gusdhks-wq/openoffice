import type zh from './zh'
export default {
  driveCancelPending: 'Anuluj oczekujące tworzenie (zachowaj pliki Drive)',
  driveLiveMode: 'Edytowalne dokumenty Google',
  driveBackupMode: 'Poprzednie kopie plików',
  driveLiveNotice:
    'Synchronizuj tekstowe dokumenty Google bez komputera. W ChatGPT edytuj ten sam dokument przez Google Drive. Tabele, formatowane dokumenty i wiele kart nie są tu edytowane.',
  driveGoogleLink: 'Otwórz dokument Google',
  driveLiveConflict:
    'Obie kopie się zmieniły. Wersja robocza jest zachowana. Otwórz kopię Drive osobno.',
  driveUnsupported:
    'Nieobsługiwana treść lub formatowanie. Oryginał i lokalna wersja robocza są zachowane.',
  driveUncertain:
    'Wynik Google jest niepewny. Ponów synchronizację, aby znaleźć ten sam plik; nie twórz kolejnej kopii.',
  driveSetupHint:
    'Włącz Drive API i Docs API w Google Cloud. Zarejestruj pakiet i certyfikat Android lub klienta OAuth WWW dla tego źródła. Sekret klienta nie jest potrzebny.',
  driveWebClientId: 'Identyfikator klienta OAuth WWW (publiczny)',
  driveSaveSetup: 'Zapisz logowanie',
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
