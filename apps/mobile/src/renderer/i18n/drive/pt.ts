import type zh from './zh'
export default {
  driveCancelPending: 'Cancelar criação pendente (manter ficheiros Drive)',
  driveLiveMode: 'Documentos Google editáveis',
  driveBackupMode: 'Cópias de ficheiros anteriores',
  driveLiveNotice:
    'Sincronize documentos Google de texto sem PC. No ChatGPT, use o Google Drive para editar o mesmo documento. Tabelas, documentos formatados ou com vários separadores não são editados aqui.',
  driveGoogleLink: 'Abrir documento Google',
  driveLiveConflict:
    'Ambas as cópias foram alteradas. O rascunho é mantido. Abra a cópia do Drive separadamente.',
  driveUnsupported:
    'Conteúdo ou formatação não suportados. O original e o rascunho local são mantidos.',
  driveUncertain:
    'O resultado do Google é incerto. Repita a sincronização para localizar o mesmo ficheiro; não crie outra cópia.',
  driveSetupHint:
    'Ative Drive API e Docs API no Google Cloud. Registe o pacote e certificado Android ou um cliente OAuth Web para esta origem exata. Não é necessário segredo de cliente.',
  driveWebClientId: 'ID de cliente OAuth Web (público)',
  driveSaveSetup: 'Guardar acesso',
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
