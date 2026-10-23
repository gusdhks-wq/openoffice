import type zh from './zh'
export default {
  hwpTitle: 'Área HWP · experimental',
  hwpScope:
    'Abra HWP/HWPX localmente e substitua texto em parágrafos ou células. Alterações e original ficam numa cópia reimportável. Exportação HWP/HWPX editada, IA e sincronização Drive ainda não estão disponíveis. As fontes podem alterar a paginação.',
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
    'Não foi possível abrir ou editar. Verifique texto repetido, formato e armazenamento. O trabalho existente é mantido.',
} satisfies Record<keyof typeof zh, string>
