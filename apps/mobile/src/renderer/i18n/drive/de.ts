import type zh from './zh'
export default {
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
