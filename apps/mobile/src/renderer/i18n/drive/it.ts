import type zh from './zh'
export default {
  driveConnect: 'Collega Drive',
  driveDisconnect: 'Scollega Drive',
  driveSync: 'Sincronizza questo documento',
  driveRefresh: 'Aggiorna',
  driveRemoteFiles: 'Versioni Drive',
  driveConnected: 'Drive collegato',
  driveDisconnected: 'Drive scollegato',
  driveBusy: 'Sincronizzazione…',
  driveSynced: 'Sincronizzazione completata',
  driveConflict: 'Esistono più versioni. Apri ogni ramo dall’elenco Drive.',
  driveFailed: 'Operazione Drive non riuscita. I documenti locali sono conservati.',
  driveSetup: 'Configura prima Google OAuth. Consulta la guida di configurazione.',
  driveAccountMismatch: 'Il documento appartiene a un altro account Drive. Collega quell’account.',
  drivePending: 'Caricamento in attesa su questo dispositivo',
  driveOffline: 'Non in linea. I documenti collegati verranno risincronizzati alla connessione.',
  driveNotice: 'Drive salva le modifiche in nuovi file. L’IA nel cloud non è collegata.',
} satisfies Record<keyof typeof zh, string>
