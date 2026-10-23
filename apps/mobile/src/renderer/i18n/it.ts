import cloud from './cloud/it'
import drive from './drive/it'
import type zh from './zh'
export default {
  ...cloud,
  ...drive,
  prototype: 'Prototipo mobile',
  newDocument: 'Nuovo documento',
  importFile: 'Importa',
  exportFile: 'Esporta',
  documents: 'Documenti',
  editor: 'Contenuto del documento',
  saved: 'Salvato su questo dispositivo',
  saving: 'Salvataggio…',
  saveFailed: 'Salvataggio non riuscito. Esporta una copia prima di uscire.',
  retry: 'Riprova',
  loading: 'Caricamento…',
  openFailed: 'Impossibile aprire la memoria locale. Ricarica la pagina.',
  importFailed: 'Scegli un file UTF-8 .md o .txt inferiore a 2 MB.',
  exportFailed: 'Impossibile esportare il file.',
  localOnly:
    'I documenti vengono salvati prima su questo dispositivo. Le connessioni esterne sono facoltative.',
  untitled: 'Senza titolo',
  empty: 'Crea o importa un documento per iniziare.',
  language: 'Lingua',
} satisfies Record<keyof typeof zh, string>
