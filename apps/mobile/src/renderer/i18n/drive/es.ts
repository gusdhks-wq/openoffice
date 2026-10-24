import type zh from './zh'
export default {
  driveCancelPending: 'Cancelar creación pendiente (conservar archivos Drive)',
  driveLiveMode: 'Documentos Google editables',
  driveBackupMode: 'Copias de archivos anteriores',
  driveLiveNotice:
    'Sincroniza documentos Google de texto sin PC. En ChatGPT, usa Google Drive para editar el mismo documento. Aquí no se editan tablas, documentos con formato ni con varias pestañas.',
  driveGoogleLink: 'Abrir documento Google',
  driveLiveConflict:
    'Ambas copias cambiaron. Se conserva el borrador. Abre la copia de Drive por separado.',
  driveUnsupported:
    'Contenido o formato no compatible. Se conservan el original y el borrador local.',
  driveUncertain:
    'El resultado de Google es incierto. Reintenta sincronizar para encontrar el mismo archivo; no crees otra copia.',
  driveSetupHint:
    'Activa Drive API y Docs API en Google Cloud. Registra el paquete y certificado Android o un cliente OAuth web para este origen exacto. No se necesita secreto de cliente.',
  driveWebClientId: 'ID de cliente OAuth web (público)',
  driveSaveSetup: 'Guardar acceso',
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
