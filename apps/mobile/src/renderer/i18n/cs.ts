import cloud from './cloud/cs'
import drive from './drive/cs'
import type zh from './zh'
export default {
  ...cloud,
  ...drive,
  prototype: 'Mobilní prototyp',
  newDocument: 'Nový dokument',
  importFile: 'Importovat',
  exportFile: 'Exportovat',
  documents: 'Dokumenty',
  editor: 'Obsah dokumentu',
  saved: 'Uloženo v tomto zařízení',
  saving: 'Ukládání…',
  saveFailed: 'Neuloženo. Před odchodem exportujte kopii.',
  retry: 'Zkusit uložit znovu',
  loading: 'Načítání…',
  openFailed: 'Místní úložiště nelze otevřít. Obnovte stránku.',
  importFailed: 'Vyberte soubor UTF-8 .md nebo .txt menší než 2 MB.',
  exportFailed: 'Soubor nelze exportovat.',
  localOnly: 'Dokumenty se nejprve ukládají do tohoto zařízení. Externí připojení jsou volitelná.',
  untitled: 'Bez názvu',
  empty: 'Začněte vytvořením nebo importem dokumentu.',
  language: 'Jazyk',
} satisfies Record<keyof typeof zh, string>
