import drive from './drive/en'
import type zh from './zh'
export default {
  ...drive,
  prototype: 'Mobile prototype',
  newDocument: 'New document',
  importFile: 'Import',
  exportFile: 'Export',
  documents: 'Documents',
  editor: 'Document content',
  saved: 'Saved on this device',
  saving: 'Saving…',
  saveFailed: 'Not saved. Export a copy before leaving.',
  retry: 'Retry save',
  loading: 'Loading…',
  openFailed: 'Could not open local storage. Reload to retry.',
  importFailed: 'Choose a UTF-8 .md or .txt file under 2 MB.',
  exportFailed: 'Could not export the file.',
  localOnly: 'Local documents only. Drive and cloud AI are not connected.',
  untitled: 'Untitled',
  empty: 'Create or import a document to start.',
  language: 'Language',
} satisfies Record<keyof typeof zh, string>
