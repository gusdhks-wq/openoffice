import type zh from './zh'
export default {
  cloudTitle: 'Documentos para Codex externo',
  cloudURL: 'Endereço do servidor de documentos',
  cloudKey: 'Chave de conexão do proprietário',
  cloudConnect: 'Conectar servidor',
  cloudDisconnect: 'Desconectar servidor',
  cloudSync: 'Sincronizar documento',
  cloudRefresh: 'Atualizar documentos',
  cloudShare: 'Compartilhar com Codex externo',
  cloudUnshare: 'Parar de compartilhar',
  cloudVersions: 'Versões anteriores',
  cloudRestore: 'Restaurar',
  cloudCopy: 'Enviar como novo documento',
  cloudConnected: 'Servidor de documentos conectado',
  cloudDisconnected: 'Servidor de documentos desconectado',
  cloudBusy: 'Trabalhando com o servidor…',
  cloudFailed: 'A operação falhou. Os rascunhos locais foram preservados.',
  cloudConflict:
    'O servidor tem outra versão. Abra separadamente ou envie o rascunho como novo documento.',
  cloudPending: 'Envio ao servidor pendente',
  cloudNotice:
    'O Codex externo só pode ler e editar documentos compartilhados. A chave fica na memória durante esta execução.',
} satisfies Record<keyof typeof zh, string>
