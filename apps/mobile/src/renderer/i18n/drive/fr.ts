import type zh from './zh'
export default {
  driveCancelPending: 'Annuler la création en attente (garder les fichiers Drive)',
  driveLiveMode: 'Documents Google modifiables',
  driveBackupMode: 'Anciennes sauvegardes de fichiers',
  driveLiveNotice:
    'Synchronisez des documents Google en texte brut sans PC. Dans ChatGPT, utilisez Google Drive pour modifier le même document. Les tableaux, documents mis en forme ou à plusieurs onglets ne sont pas modifiés ici.',
  driveGoogleLink: 'Ouvrir le document Google',
  driveLiveConflict:
    'Les deux copies ont changé. Le brouillon est conservé. Ouvrez séparément la copie Drive.',
  driveUnsupported:
    'Contenu ou mise en forme non pris en charge. L’original et le brouillon local sont conservés.',
  driveUncertain:
    'Résultat Google incertain. Relancez la synchronisation pour retrouver le même fichier, sans créer de copie.',
  driveSetupHint:
    'Activez Drive API et Docs API dans Google Cloud. Enregistrez le package et certificat Android ou un client OAuth Web pour cette origine exacte. Aucun secret client requis.',
  driveWebClientId: 'ID client OAuth Web (public)',
  driveSaveSetup: 'Enregistrer la connexion',
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
