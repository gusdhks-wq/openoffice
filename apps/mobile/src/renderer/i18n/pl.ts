import cloud from './cloud/pl'
import drive from './drive/pl'
import type zh from './zh'
export default {
  ...cloud,
  ...drive,
  prototype: 'Prototyp mobilny',
  newDocument: 'Nowy dokument',
  importFile: 'Importuj',
  exportFile: 'Eksportuj',
  documents: 'Dokumenty',
  editor: 'Treść dokumentu',
  saved: 'Zapisano na tym urządzeniu',
  saving: 'Zapisywanie…',
  saveFailed: 'Nie zapisano. Przed wyjściem wyeksportuj kopię.',
  retry: 'Ponów zapis',
  loading: 'Wczytywanie…',
  openFailed: 'Nie można otworzyć pamięci lokalnej. Odśwież stronę.',
  importFailed: 'Wybierz plik UTF-8 .md lub .txt mniejszy niż 2 MB.',
  exportFailed: 'Nie można wyeksportować pliku.',
  localOnly:
    'Dokumenty są najpierw zapisywane na tym urządzeniu. Połączenia zewnętrzne są opcjonalne.',
  untitled: 'Bez tytułu',
  empty: 'Utwórz lub zaimportuj dokument, aby rozpocząć.',
  language: 'Język',
} satisfies Record<keyof typeof zh, string>
