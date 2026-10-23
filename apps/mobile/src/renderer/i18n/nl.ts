import cloud from './cloud/nl'
import drive from './drive/nl'
import type zh from './zh'
export default {
  ...cloud,
  ...drive,
  prototype: 'Mobiel prototype',
  newDocument: 'Nieuw document',
  importFile: 'Importeren',
  exportFile: 'Exporteren',
  documents: 'Documenten',
  editor: 'Documentinhoud',
  saved: 'Op dit apparaat opgeslagen',
  saving: 'Opslaan…',
  saveFailed: 'Niet opgeslagen. Exporteer een kopie voordat je afsluit.',
  retry: 'Opnieuw opslaan',
  loading: 'Laden…',
  openFailed: 'Lokale opslag niet beschikbaar. Laad de pagina opnieuw.',
  importFailed: 'Kies een UTF-8-bestand (.md of .txt) kleiner dan 2 MB.',
  exportFailed: 'Bestand exporteren mislukt.',
  localOnly:
    'Documenten worden eerst op dit apparaat opgeslagen. Externe verbindingen zijn optioneel.',
  untitled: 'Naamloos',
  empty: 'Maak of importeer een document om te beginnen.',
  language: 'Taal',
} satisfies Record<keyof typeof zh, string>
