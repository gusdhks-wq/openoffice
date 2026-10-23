import hwp from './hwp/es'
import cloud from './cloud/es'
import drive from './drive/es'
import type zh from './zh'
export default {
  ...hwp,
  ...cloud,
  ...drive,
  prototype: 'Prototipo móvil',
  newDocument: 'Nuevo documento',
  importFile: 'Importar',
  exportFile: 'Exportar',
  documents: 'Documentos',
  editor: 'Contenido del documento',
  saved: 'Guardado en este dispositivo',
  saving: 'Guardando…',
  saveFailed: 'No se ha guardado. Exporta una copia antes de salir.',
  retry: 'Reintentar',
  loading: 'Cargando…',
  openFailed: 'No se pudo abrir el almacenamiento local. Recarga la página.',
  importFailed: 'Elige un archivo UTF-8 .md o .txt de menos de 2 MB.',
  exportFailed: 'No se pudo exportar el archivo.',
  localOnly:
    'Los documentos se guardan primero en este dispositivo. Las conexiones externas son opcionales.',
  untitled: 'Sin título',
  empty: 'Crea o importa un documento para empezar.',
  language: 'Idioma',
} satisfies Record<keyof typeof zh, string>
