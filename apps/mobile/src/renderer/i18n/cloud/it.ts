import type zh from './zh'
export default {
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
