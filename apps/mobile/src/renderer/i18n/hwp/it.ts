import type zh from './zh'
export default {
  hwpTitle: 'Area HWP · sperimentale',
  hwpScope:
    'Apri HWP/HWPX localmente e sostituisci testo in paragrafi o celle. Modifiche e originale sono salvati in una copia reimportabile. Esportazione HWP/HWPX modificata, IA e sincronizzazione Drive non disponibili. I caratteri possono cambiare la paginazione.',
  hwpOpen: 'Apri HWP o copia di lavoro',
  hwpOriginal: 'Esporta originale prima delle modifiche',
  hwpBackup: 'Esporta copia di lavoro',
  hwpPrevious: 'Pagina precedente',
  hwpNext: 'Pagina successiva',
  hwpPage: 'Pagina del documento',
  hwpFind: 'Testo da sostituire · frase unica',
  hwpReplacement: 'Nuovo testo',
  hwpReplace: 'Sostituisci e salva localmente',
  hwpUndo: 'Annulla ultima modifica',
  hwpFailed:
    'Impossibile aprire o modificare. Controlla testo duplicato, formato e archiviazione. Il lavoro esistente è conservato.',
} satisfies Record<keyof typeof zh, string>
