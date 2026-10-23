import drive from './drive/fr'
import type zh from './zh'
export default {
  ...drive,
  prototype: 'Prototype mobile',
  newDocument: 'Nouveau document',
  importFile: 'Importer',
  exportFile: 'Exporter',
  documents: 'Documents',
  editor: 'Contenu du document',
  saved: 'Enregistré sur cet appareil',
  saving: 'Enregistrement…',
  saveFailed: 'Échec de sauvegarde. Exportez une copie avant de quitter.',
  retry: 'Réessayer',
  loading: 'Chargement…',
  openFailed: 'Stockage local inaccessible. Rechargez la page.',
  importFailed: 'Choisissez un fichier UTF-8 .md ou .txt de moins de 2 Mo.',
  exportFailed: 'Impossible d’exporter le fichier.',
  localOnly: 'Stockage local uniquement. Drive et l’IA distante ne sont pas connectés.',
  untitled: 'Sans titre',
  empty: 'Créez ou importez un document pour commencer.',
  language: 'Langue',
} satisfies Record<keyof typeof zh, string>
