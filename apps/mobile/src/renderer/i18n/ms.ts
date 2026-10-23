import drive from './drive/ms'
import type zh from './zh'
export default {
  ...drive,
  prototype: 'Prototaip mudah alih',
  newDocument: 'Dokumen baharu',
  importFile: 'Import',
  exportFile: 'Eksport',
  documents: 'Dokumen',
  editor: 'Kandungan dokumen',
  saved: 'Disimpan pada peranti ini',
  saving: 'Menyimpan…',
  saveFailed: 'Belum disimpan. Eksport salinan sebelum keluar.',
  retry: 'Cuba simpan semula',
  loading: 'Memuatkan…',
  openFailed: 'Storan setempat tidak dapat dibuka. Muat semula halaman.',
  importFailed: 'Pilih fail UTF-8 .md atau .txt di bawah 2 MB.',
  exportFailed: 'Fail tidak dapat dieksport.',
  localOnly: 'Storan setempat sahaja. Drive dan AI awan belum disambungkan.',
  untitled: 'Tanpa tajuk',
  empty: 'Cipta atau import dokumen untuk bermula.',
  language: 'Bahasa',
} satisfies Record<keyof typeof zh, string>
