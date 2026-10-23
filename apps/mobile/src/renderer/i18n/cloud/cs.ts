import type zh from './zh'
export default {
  cloudMethod: 'Způsob připojení',
  cloudPairCode: 'Kód telefonu (8 číslic)',
  cloudPairHelp:
    'Zadejte kód telefonu z okna Mobile-connect na počítači. Platí jednou po dobu 3 minut. Pro nový kód zadejte na počítači P a stiskněte Enter. Jde o jiný kód než schvalovací kód ChatGPT.',
  cloudAuthFailed:
    'Ověření vypršelo nebo je kód nesprávný. Získejte na počítači nový kód telefonu a připojte se znovu.',
  cloudReconnect: 'Připojit tento dokument k aktuální adrese',
  cloudReconnectHelp:
    'Stejný server dokumentů má novou adresu. Připojte se znovu se zachováním místního konceptu a předchozích verzí.',
  cloudTitle: 'Dokumenty pro externí Codex',
  cloudURL: 'Adresa serveru dokumentů',
  cloudKey: 'Připojovací klíč vlastníka',
  cloudConnect: 'Připojit server',
  cloudDisconnect: 'Odpojit server',
  cloudSync: 'Synchronizovat dokument',
  cloudRefresh: 'Obnovit dokumenty',
  cloudShare: 'Sdílet s externím Codex',
  cloudUnshare: 'Ukončit sdílení',
  cloudVersions: 'Předchozí verze',
  cloudRestore: 'Obnovit',
  cloudCopy: 'Nahrát jako nový dokument',
  cloudConnected: 'Server dokumentů připojen',
  cloudDisconnected: 'Server dokumentů odpojen',
  cloudBusy: 'Práce se serverem…',
  cloudFailed: 'Operace serveru selhala. Místní koncepty jsou zachovány.',
  cloudConflict:
    'Server má jinou verzi. Otevřete ji zvlášť nebo nahrajte koncept jako nový dokument.',
  cloudPending: 'Nahrání na server čeká',
  cloudNotice:
    'Externí Codex může číst a upravovat jen sdílené dokumenty. Klíč zůstává v paměti po dobu tohoto spuštění.',
} satisfies Record<keyof typeof zh, string>
