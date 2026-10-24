import type zh from './zh'
export default {
  driveCancelPending: 'Zrušit čekající vytvoření (zachovat soubory Drive)',
  driveLiveMode: 'Upravitelné dokumenty Google',
  driveBackupMode: 'Původní zálohy souborů',
  driveLiveNotice:
    'Synchronizujte textové dokumenty Google bez PC. V ChatGPT upravujte stejný dokument přes Google Drive. Tabulky, formátované dokumenty a více karet se zde neupravují.',
  driveGoogleLink: 'Otevřít dokument Google',
  driveLiveConflict:
    'Obě kopie se změnily. Koncept zůstává zachován. Otevřete kopii Drive samostatně.',
  driveUnsupported:
    'Nepodporovaný obsah nebo formátování. Originál i místní koncept zůstávají zachovány.',
  driveUncertain:
    'Výsledek Google je nejistý. Zkuste synchronizaci znovu, aby se našel stejný soubor; nevytvářejte další kopii.',
  driveSetupHint:
    'V Google Cloud zapněte Drive API a Docs API. Zaregistrujte balíček a podpisový certifikát Android nebo webového klienta OAuth pro tento původ. Tajný klíč klienta není potřeba.',
  driveWebClientId: 'ID webového klienta OAuth (veřejné)',
  driveSaveSetup: 'Uložit přihlášení',
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
