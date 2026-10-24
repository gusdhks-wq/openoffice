import type zh from './zh'
export default {
  hwpExitFullscreen: 'Quitter le plein écran',

  hwpFullscreen: 'Plein écran',

  hwpFitWidth: 'Largeur adaptée',

  hwpZoomOut: 'Réduire',

  hwpZoomIn: 'Agrandir',

  hwpHelp: 'Fonctions et limites',

  sourceWorkspace: 'Documents texte et connexions',

  hwpSaveFailed:
    'Vérification ou sauvegarde impossible. Gardez l’éditeur ouvert et réessayez. Original et dernière sauvegarde conservés.',

  hwpSaveNative: 'Enregistrer une copie HWP/HWPX modifiée',

  hwpNew: 'Nouveau document HWP',

  hwpTitle: 'Éditeur HWP · expérimental',
  hwpScope:
    'Saisissez dans HWP/HWPX et modifiez formats et tableaux. Sauvegarde locale après une pause, export en copie du format natif avec original conservé. Mots de passe et suivi des modifications non pris en charge. Compatibilité Hangul et saisie mobile à tester ; IA et Drive non connectés.',
  hwpOpen: 'Ouvrir HWP ou sauvegarde',
  hwpOriginal: 'Exporter l’original avant modification',
  hwpBackup: 'Exporter la sauvegarde de travail',
  hwpPrevious: 'Page précédente',
  hwpNext: 'Page suivante',
  hwpPage: 'Page du document',
  hwpFind: 'Texte à remplacer · expression unique',
  hwpReplacement: 'Nouveau texte',
  hwpReplace: 'Remplacer et enregistrer localement',
  hwpUndo: 'Annuler la dernière modification',
  hwpFailed:
    'Impossible d’ouvrir le document. Vérifiez le format, le mot de passe et le suivi des modifications. Originaux et copies enregistrées conservés.',
} satisfies Record<keyof typeof zh, string>
