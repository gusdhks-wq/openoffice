import type zh from './zh'
export default {
  hwpTitle: 'Espace HWP · expérimental',
  hwpScope:
    'Ouvrez HWP/HWPX localement et remplacez le texte des paragraphes ou cellules. Les modifications et l’original sont conservés dans une sauvegarde réimportable. Export HWP/HWPX modifié, IA et synchronisation Drive indisponibles. Les polices peuvent modifier la pagination.',
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
    'Ouverture ou modification impossible. Vérifiez les doublons, le format et le stockage. Le travail existant est conservé.',
} satisfies Record<keyof typeof zh, string>
