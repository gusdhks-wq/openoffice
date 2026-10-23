import type zh from './zh'
export default {
  driveCancelPending: 'Ausstehende Erstellung abbrechen (Drive-Dateien behalten)',
  driveLiveMode: 'Bearbeitbare Google-Dokumente',
  driveBackupMode: 'Bisherige Dateisicherungen',
  driveLiveNotice:
    'Google-Dokumente als reinen Text ohne PC synchronisieren. In ChatGPT dasselbe Dokument über Google Drive bearbeiten. Tabellen, formatierte Dokumente und mehrere Tabs werden hier nicht bearbeitet.',
  driveGoogleLink: 'Google-Dokument öffnen',
  driveLiveConflict:
    'Beide Kopien wurden geändert. Der Entwurf bleibt erhalten. Öffnen Sie die Drive-Kopie separat.',
  driveUnsupported:
    'Nicht unterstützter Inhalt oder Formatierung. Original und lokaler Entwurf bleiben erhalten.',
  driveUncertain:
    'Google-Ergebnis unklar. Synchronisierung erneut versuchen, um dieselbe Datei zu finden; keine weitere Kopie erstellen.',
  driveSetupHint:
    'Drive API und Docs API in Google Cloud aktivieren. Android-Paket und Signaturzertifikat oder einen Web-OAuth-Client für diese genaue Herkunft registrieren. Kein Clientschlüssel nötig.',
  driveWebClientId: 'Web-OAuth-Client-ID (öffentlich)',
  driveSaveSetup: 'Anmeldung speichern',
  driveConnect: 'Drive verbinden',
  driveDisconnect: 'Drive trennen',
  driveSync: 'Dieses Dokument synchronisieren',
  driveRefresh: 'Aktualisieren',
  driveRemoteFiles: 'Drive-Versionen',
  driveConnected: 'Drive verbunden',
  driveDisconnected: 'Drive nicht verbunden',
  driveBusy: 'Synchronisierung…',
  driveSynced: 'Synchronisierung abgeschlossen',
  driveConflict: 'Mehrere Versionen vorhanden. Jeden Zweig in der Drive-Liste öffnen.',
  driveFailed: 'Drive-Aktion fehlgeschlagen. Lokale Dokumente bleiben erhalten.',
  driveSetup: 'Zuerst Google OAuth konfigurieren. Siehe Einrichtungsanleitung.',
  driveAccountMismatch:
    'Dieses Dokument gehört zu einem anderen Drive-Konto. Dieses Konto erneut verbinden.',
  drivePending: 'Upload auf diesem Gerät vorgemerkt',
  driveOffline: 'Offline. Verknüpfte Dokumente werden bei Verbindung erneut synchronisiert.',
  driveNotice: 'Drive speichert Änderungen als neue Dateien. Cloud-KI ist nicht verbunden.',
} satisfies Record<keyof typeof zh, string>
