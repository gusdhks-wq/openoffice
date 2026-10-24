import type zh from './zh'
export default {
  hwpExitFullscreen: 'Salir de pantalla completa',

  hwpFullscreen: 'Pantalla completa',

  hwpFitWidth: 'Ajustar ancho',

  hwpZoomOut: 'Reducir',

  hwpZoomIn: 'Ampliar',

  hwpHelp: 'Funciones y limitaciones',

  sourceWorkspace: 'Documentos de texto y conexiones',

  hwpSaveFailed:
    'No se pudo verificar o guardar. Mantén el editor abierto y vuelve a intentarlo. Se conservan el original y la última copia guardada.',

  hwpSaveNative: 'Guardar copia HWP/HWPX editada',

  hwpNew: 'Nuevo documento HWP',

  hwpTitle: 'Editor HWP · experimental',
  hwpScope:
    'Escribe en HWP/HWPX y edita formato y tablas. Guarda localmente al pausar y exporta copias en formato nativo conservando el original. No admite contraseñas ni control de cambios. Faltan pruebas de compatibilidad Hangul y teclado móvil; IA y Drive aún no están conectados.',
  hwpOpen: 'Abrir HWP o copia de trabajo',
  hwpOriginal: 'Exportar original sin cambios',
  hwpBackup: 'Exportar copia de trabajo',
  hwpPrevious: 'Página anterior',
  hwpNext: 'Página siguiente',
  hwpPage: 'Página del documento',
  hwpFind: 'Texto a sustituir · frase única',
  hwpReplacement: 'Texto nuevo',
  hwpReplace: 'Sustituir y guardar localmente',
  hwpUndo: 'Deshacer último cambio',
  hwpFailed:
    'No se pudo abrir el documento. Revisa formato, contraseña y control de cambios. Se conservan originales y copias guardadas.',
} satisfies Record<keyof typeof zh, string>
