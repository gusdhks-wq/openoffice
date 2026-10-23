import type zh from './zh'
export default {
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
