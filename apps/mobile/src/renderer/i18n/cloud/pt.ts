import type zh from './zh'
export default {
  cloudMethod: 'Método de ligação',
  cloudPairCode: 'Código do telemóvel (8 dígitos)',
  cloudPairHelp:
    'Introduza o código do telemóvel mostrado no Mobile-connect do PC. Válido uma vez durante 3 minutos. Escreva P e prima Enter no PC para gerar outro. É diferente do código de autorização do ChatGPT.',
  cloudAuthFailed:
    'A autenticação expirou ou o código está incorreto. Obtenha um novo código do telemóvel no PC e volte a ligar.',
  cloudReconnect: 'Voltar a ligar este documento ao endereço atual',
  cloudReconnectHelp:
    'O mesmo servidor de documentos mudou de endereço. Volte a ligar mantendo o rascunho deste dispositivo e as versões anteriores.',
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
