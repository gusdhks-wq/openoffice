import type zh from './zh'
export default {
  cloudMethod: 'Metodo di connessione',
  cloudPairCode: 'Codice del telefono (8 cifre)',
  cloudPairHelp:
    'Inserisci il codice del telefono dalla finestra Mobile-connect sul PC. Valido una volta per 3 minuti. Digita P e premi Invio sul PC per un nuovo codice. È diverso dal codice di approvazione ChatGPT.',
  cloudAuthFailed:
    'Autenticazione scaduta o codice errato. Ottieni un nuovo codice del telefono sul PC e riconnettiti.',
  cloudReconnect: 'Riconnetti questo documento all’indirizzo attuale',
  cloudReconnectHelp:
    'Lo stesso server documenti ha un nuovo indirizzo. Riconnettiti mantenendo la bozza del dispositivo e le versioni precedenti.',
  cloudTitle: 'Documenti per Codex esterno',
  cloudURL: 'Indirizzo del server documenti',
  cloudKey: 'Chiave di connessione del proprietario',
  cloudConnect: 'Collega il server',
  cloudDisconnect: 'Scollega il server',
  cloudSync: 'Sincronizza documento',
  cloudRefresh: 'Aggiorna documenti',
  cloudShare: 'Condividi con Codex esterno',
  cloudUnshare: 'Interrompi condivisione',
  cloudVersions: 'Versioni precedenti',
  cloudRestore: 'Ripristina',
  cloudCopy: 'Carica come nuovo documento',
  cloudConnected: 'Server documenti collegato',
  cloudDisconnected: 'Server documenti scollegato',
  cloudBusy: 'Operazione sul server…',
  cloudFailed: 'Operazione non riuscita. Le bozze locali sono conservate.',
  cloudConflict:
    'Il server ha un’altra versione. Aprila separatamente o carica la bozza come nuovo documento.',
  cloudPending: 'Invio al server in attesa',
  cloudNotice:
    'Codex esterno può leggere e modificare solo documenti condivisi. La chiave resta in memoria per questa esecuzione.',
} satisfies Record<keyof typeof zh, string>
