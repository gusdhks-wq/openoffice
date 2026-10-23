import type zh from './zh'
export default {
  driveConnect: 'Connecter Drive',
  driveDisconnect: 'Déconnecter Drive',
  driveSync: 'Synchroniser ce document',
  driveRefresh: 'Actualiser',
  driveRemoteFiles: 'Versions Drive',
  driveConnected: 'Drive connecté',
  driveDisconnected: 'Drive déconnecté',
  driveBusy: 'Synchronisation…',
  driveSynced: 'Synchronisation terminée',
  driveConflict: 'Plusieurs versions existent. Ouvrez chaque branche dans la liste Drive.',
  driveFailed: 'Échec de l’action Drive. Les documents locaux sont conservés.',
  driveSetup: 'Configurez d’abord Google OAuth. Consultez le guide de configuration.',
  driveAccountMismatch: 'Ce document appartient à un autre compte Drive. Reconnectez ce compte.',
  drivePending: 'Envoi en attente sur cet appareil',
  driveOffline: 'Hors ligne. Les documents liés seront resynchronisés à la connexion.',
  driveNotice:
    'Drive conserve les modifications dans de nouveaux fichiers. L’IA distante n’est pas connectée.',
} satisfies Record<keyof typeof zh, string>
