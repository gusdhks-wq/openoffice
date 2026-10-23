import drive from './drive/nl'
import type zh from './zh'
export default {
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
  localOnly: 'Alleen lokale opslag. Drive en cloud-AI zijn niet verbonden.',
  untitled: 'Naamloos',
  empty: 'Maak of importeer een document om te beginnen.',
  language: 'Taal',
} satisfies Record<keyof typeof zh, string>
