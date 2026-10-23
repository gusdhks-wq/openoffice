import type zh from './zh'
export default {
  driveConnect: 'Conectar Drive',
  driveDisconnect: 'Desconectar Drive',
  driveSync: 'Sincronizar este documento',
  driveRefresh: 'Actualizar',
  driveRemoteFiles: 'Versiones de Drive',
  driveConnected: 'Drive conectado',
  driveDisconnected: 'Drive desconectado',
  driveBusy: 'Sincronizando…',
  driveSynced: 'Sincronización completada',
  driveConflict: 'Hay varias versiones. Abre cada rama desde la lista de Drive.',
  driveFailed: 'La acción de Drive falló. Se conservan los documentos locales.',
  driveSetup: 'Configura primero Google OAuth. Consulta la guía de configuración.',
  driveAccountMismatch: 'Este documento pertenece a otra cuenta de Drive. Conecta esa cuenta.',
  drivePending: 'Subida pendiente en este dispositivo',
  driveOffline: 'Sin conexión. Se reintentará sincronizar los documentos vinculados al conectar.',
  driveNotice: 'Drive guarda los cambios como archivos nuevos. La IA en la nube no está conectada.',
} satisfies Record<keyof typeof zh, string>
