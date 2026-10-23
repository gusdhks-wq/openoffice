import cloud from './cloud/pt'
import drive from './drive/pt'
import type zh from './zh'
export default {
  ...cloud,
  ...drive,
  prototype: 'Protótipo móvel',
  newDocument: 'Novo documento',
  importFile: 'Importar',
  exportFile: 'Exportar',
  documents: 'Documentos',
  editor: 'Conteúdo do documento',
  saved: 'Salvo neste dispositivo',
  saving: 'Salvando…',
  saveFailed: 'Não foi salvo. Exporte uma cópia antes de sair.',
  retry: 'Tentar novamente',
  loading: 'Carregando…',
  openFailed: 'Não foi possível abrir o armazenamento local. Recarregue a página.',
  importFailed: 'Escolha um arquivo UTF-8 .md ou .txt com menos de 2 MB.',
  exportFailed: 'Não foi possível exportar o arquivo.',
  localOnly:
    'Os documentos são salvos primeiro neste dispositivo. Conexões externas são opcionais.',
  untitled: 'Sem título',
  empty: 'Crie ou importe um documento para começar.',
  language: 'Idioma',
} satisfies Record<keyof typeof zh, string>
