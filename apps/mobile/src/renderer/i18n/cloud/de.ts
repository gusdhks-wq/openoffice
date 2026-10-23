import type zh from './zh'
export default {
  cloudTitle: 'Dokumente für externes Codex',
  cloudURL: 'Adresse des Dokumentservers',
  cloudKey: 'Verbindungsschlüssel des Eigentümers',
  cloudConnect: 'Server verbinden',
  cloudDisconnect: 'Server trennen',
  cloudSync: 'Dokument synchronisieren',
  cloudRefresh: 'Dokumente aktualisieren',
  cloudShare: 'Mit externem Codex teilen',
  cloudUnshare: 'Freigabe beenden',
  cloudVersions: 'Frühere Versionen',
  cloudRestore: 'Wiederherstellen',
  cloudCopy: 'Als neues Dokument hochladen',
  cloudConnected: 'Dokumentserver verbunden',
  cloudDisconnected: 'Dokumentserver nicht verbunden',
  cloudBusy: 'Dokumentserver arbeitet…',
  cloudFailed: 'Serveraktion fehlgeschlagen. Lokale Entwürfe bleiben erhalten.',
  cloudConflict:
    'Der Server enthält eine andere Version. Separat öffnen oder den Entwurf als neues Dokument hochladen.',
  cloudPending: 'Server-Upload ausstehend',
  cloudNotice:
    'Externes Codex kann nur freigegebene Dokumente lesen und bearbeiten. Der Schlüssel bleibt für diesen Lauf im Speicher.',
} satisfies Record<keyof typeof zh, string>
