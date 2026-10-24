import type zh from './zh'
export default {
  hwpExitFullscreen: 'Esci da schermo intero',

  hwpFullscreen: 'Schermo intero',

  hwpFitWidth: 'Adatta larghezza',

  hwpZoomOut: 'Riduci',

  hwpZoomIn: 'Ingrandisci',

  hwpHelp: 'Funzioni e limiti',

  sourceWorkspace: 'Documenti di testo e connessioni',

  hwpSaveFailed:
    'Verifica o salvataggio falliti. Mantieni aperto l’editor e riprova. Originale e ultima copia salvata sono conservati.',

  hwpSaveNative: 'Salva copia HWP/HWPX modificata',

  hwpNew: 'Nuovo documento HWP',

  hwpTitle: 'Editor HWP · sperimentale',
  hwpScope:
    'Scrivi in HWP/HWPX e modifica formati e tabelle. Salvataggio locale dopo una pausa ed esportazione di copie nel formato nativo conservando l’originale. Password e revisioni non supportate. Compatibilità Hangul e tastiera mobile da verificare; IA e Drive non collegati.',
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
    'Impossibile aprire il documento. Verifica formato, password e revisioni. Originali e copie salvate sono conservati.',
} satisfies Record<keyof typeof zh, string>
