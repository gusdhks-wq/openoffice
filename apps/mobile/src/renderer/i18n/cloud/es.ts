import type zh from './zh'
export default {
  cloudTitle: 'Documentos para Codex externo',
  cloudURL: 'Dirección del servidor de documentos',
  cloudKey: 'Clave de conexión del propietario',
  cloudConnect: 'Conectar servidor',
  cloudDisconnect: 'Desconectar servidor',
  cloudSync: 'Sincronizar documento',
  cloudRefresh: 'Actualizar documentos',
  cloudShare: 'Compartir con Codex externo',
  cloudUnshare: 'Dejar de compartir',
  cloudVersions: 'Versiones anteriores',
  cloudRestore: 'Restaurar',
  cloudCopy: 'Subir como documento nuevo',
  cloudConnected: 'Servidor de documentos conectado',
  cloudDisconnected: 'Servidor de documentos desconectado',
  cloudBusy: 'Trabajando con el servidor…',
  cloudFailed: 'La operación falló. Se conservan los borradores locales.',
  cloudConflict:
    'El servidor tiene otra versión. Ábrela por separado o sube el borrador como documento nuevo.',
  cloudPending: 'Envío al servidor pendiente',
  cloudNotice:
    'Codex externo solo puede leer y editar documentos compartidos. La clave permanece en memoria durante esta ejecución.',
} satisfies Record<keyof typeof zh, string>
