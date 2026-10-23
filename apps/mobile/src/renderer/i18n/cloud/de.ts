import type zh from './zh'
export default {
  cloudMethod: 'Verbindungsmethode',
  cloudPairCode: 'Telefon-Kopplungscode (8 Ziffern)',
  cloudPairHelp:
    'Geben Sie den Telefoncode aus dem PC-Fenster Mobile-connect ein. Er gilt einmalig für 3 Minuten. Für einen neuen Code am PC P und Eingabe drücken. Dies ist nicht der ChatGPT-Bestätigungscode.',
  cloudAuthFailed:
    'Authentifizierung abgelaufen oder Code falsch. Fordern Sie am PC einen neuen Telefoncode an und verbinden Sie sich erneut.',
  cloudReconnect: 'Dieses Dokument mit der aktuellen Adresse verbinden',
  cloudReconnectHelp:
    'Derselbe Dokumentserver hat eine neue Adresse. Entwurf und frühere Versionen bleiben beim erneuten Verbinden erhalten.',
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
