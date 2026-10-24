import type zh from './zh'
export default {
  hwpExitFullscreen: 'Sair do ecrã inteiro',

  hwpFullscreen: 'Ecrã inteiro',

  hwpFitWidth: 'Ajustar largura',

  hwpZoomOut: 'Reduzir',

  hwpZoomIn: 'Ampliar',

  hwpHelp: 'Funcionalidades e limites',

  sourceWorkspace: 'Documentos de texto e ligações',

  hwpSaveFailed:
    'Não foi possível verificar ou guardar. Mantenha o editor aberto e tente novamente. O original e a última cópia guardada são preservados.',

  hwpSaveNative: 'Guardar cópia HWP/HWPX editada',

  hwpNew: 'Novo documento HWP',

  hwpTitle: 'Editor HWP · experimental',
  hwpScope:
    'Escreva em HWP/HWPX e edite formatação e tabelas. Guarda localmente após uma pausa e exporta cópias no formato nativo, preservando o original. Não suporta palavras-passe nem alterações controladas. Compatibilidade Hangul e teclado móvel ainda em teste; IA e Drive não ligados.',
  hwpOpen: 'Abrir HWP ou cópia de trabalho',
  hwpOriginal: 'Exportar original antes das alterações',
  hwpBackup: 'Exportar cópia de trabalho',
  hwpPrevious: 'Página anterior',
  hwpNext: 'Página seguinte',
  hwpPage: 'Página do documento',
  hwpFind: 'Texto a substituir · expressão única',
  hwpReplacement: 'Texto novo',
  hwpReplace: 'Substituir e guardar localmente',
  hwpUndo: 'Desfazer última alteração',
  hwpFailed:
    'Não foi possível abrir o documento. Verifique formato, palavra-passe e alterações controladas. Originais e cópias guardadas são preservados.',
} satisfies Record<keyof typeof zh, string>
