import type zh from './zh'
export default {
  driveConnect: 'Připojit Drive',
  driveDisconnect: 'Odpojit Drive',
  driveSync: 'Synchronizovat tento dokument',
  driveRefresh: 'Obnovit',
  driveRemoteFiles: 'Verze na Drive',
  driveConnected: 'Drive připojen',
  driveDisconnected: 'Drive odpojen',
  driveBusy: 'Synchronizace…',
  driveSynced: 'Synchronizace dokončena',
  driveConflict: 'Existuje více verzí. Otevřete každou větev ze seznamu Drive.',
  driveFailed: 'Operace Drive selhala. Místní dokumenty jsou zachovány.',
  driveSetup: 'Nejprve nastavte Google OAuth. Viz průvodce nastavením.',
  driveAccountMismatch: 'Dokument patří jinému účtu Drive. Připojte tento účet.',
  drivePending: 'Nahrávání čeká na tomto zařízení',
  driveOffline: 'Offline. Synchronizace propojených dokumentů se zopakuje po připojení.',
  driveNotice: 'Drive ukládá změny jako nové soubory. Cloudová AI není připojena.',
} satisfies Record<keyof typeof zh, string>
