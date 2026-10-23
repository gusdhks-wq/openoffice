import type zh from './zh'
export default {
  driveCancelPending: 'Annulla creazione in attesa (conserva i file Drive)',
  driveLiveMode: 'Documenti Google modificabili',
  driveBackupMode: 'Backup dei file precedenti',
  driveLiveNotice:
    'Sincronizza documenti Google di testo senza PC. In ChatGPT usa Google Drive per modificare lo stesso documento. Qui non si modificano tabelle, documenti formattati o con più schede.',
  driveGoogleLink: 'Apri documento Google',
  driveLiveConflict:
    'Entrambe le copie sono cambiate. La bozza è conservata. Apri separatamente la copia Drive.',
  driveUnsupported:
    'Contenuto o formattazione non supportati. Originale e bozza locale sono conservati.',
  driveUncertain:
    'Risultato Google incerto. Riprova la sincronizzazione per trovare lo stesso file; non creare un’altra copia.',
  driveSetupHint:
    'Abilita Drive API e Docs API in Google Cloud. Registra pacchetto e certificato Android oppure un client OAuth web per questa origine esatta. Non serve un segreto client.',
  driveWebClientId: 'ID client OAuth web (pubblico)',
  driveSaveSetup: 'Salva accesso',
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
