import type zh from './zh'
export default {
  cloudTitle: 'Documents pour Codex externe',
  cloudURL: 'Adresse du serveur de documents',
  cloudKey: 'Clé de connexion du propriétaire',
  cloudConnect: 'Connecter le serveur',
  cloudDisconnect: 'Déconnecter le serveur',
  cloudSync: 'Synchroniser le document',
  cloudRefresh: 'Actualiser les documents',
  cloudShare: 'Partager avec Codex externe',
  cloudUnshare: 'Arrêter le partage',
  cloudVersions: 'Versions précédentes',
  cloudRestore: 'Restaurer',
  cloudCopy: 'Envoyer comme nouveau document',
  cloudConnected: 'Serveur de documents connecté',
  cloudDisconnected: 'Serveur de documents déconnecté',
  cloudBusy: 'Opération sur le serveur…',
  cloudFailed: 'Échec de l’opération. Les brouillons locaux sont conservés.',
  cloudConflict:
    'Le serveur contient une autre version. Ouvrez-la séparément ou envoyez le brouillon comme nouveau document.',
  cloudPending: 'Envoi au serveur en attente',
  cloudNotice:
    'Codex externe ne peut lire et modifier que les documents partagés. La clé reste en mémoire pour cette exécution.',
} satisfies Record<keyof typeof zh, string>
