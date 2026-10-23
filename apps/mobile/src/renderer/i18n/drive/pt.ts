import type zh from './zh'
export default {
  driveConnect: 'Conectar Drive',
  driveDisconnect: 'Desconectar Drive',
  driveSync: 'Sincronizar este documento',
  driveRefresh: 'Atualizar',
  driveRemoteFiles: 'Versões do Drive',
  driveConnected: 'Drive conectado',
  driveDisconnected: 'Drive desconectado',
  driveBusy: 'Sincronizando…',
  driveSynced: 'Sincronização concluída',
  driveConflict: 'Há várias versões. Abra cada ramificação na lista do Drive.',
  driveFailed: 'A ação do Drive falhou. Os documentos locais foram preservados.',
  driveSetup: 'Configure o Google OAuth primeiro. Consulte o guia de configuração.',
  driveAccountMismatch: 'Este documento pertence a outra conta do Drive. Conecte essa conta.',
  drivePending: 'Envio pendente neste dispositivo',
  driveOffline: 'Sem conexão. A sincronização dos documentos vinculados será tentada ao conectar.',
  driveNotice: 'O Drive salva alterações em novos arquivos. A IA na nuvem não está conectada.',
} satisfies Record<keyof typeof zh, string>
