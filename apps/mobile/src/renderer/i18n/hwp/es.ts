import type zh from './zh'
export default {
  hwpTitle: 'Área HWP · experimental',
  hwpScope:
    'Abre HWP/HWPX localmente y sustituye texto en párrafos o celdas. Los cambios y el original se guardan en una copia que esta app puede reabrir. Aún no hay exportación HWP/HWPX editada, IA ni sincronización Drive. Las fuentes pueden cambiar la paginación.',
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
    'No se pudo abrir o editar. Revisa texto duplicado, formato y almacenamiento. Se conserva el trabajo existente.',
} satisfies Record<keyof typeof zh, string>
