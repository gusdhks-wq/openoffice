import type zh from './zh'
export default {
  hwpTitle: 'HWP-Arbeitsbereich · experimentell',
  hwpScope:
    'HWP/HWPX lokal öffnen und Text in Absätzen oder Tabellenzellen ersetzen. Änderungen und Original werden als erneut importierbare Arbeitskopie gespeichert. Export bearbeiteter HWP/HWPX, KI und Drive-Synchronisierung fehlen noch. Schriftarten können den Seitenumbruch ändern.',
  hwpOpen: 'HWP oder Arbeitskopie öffnen',
  hwpOriginal: 'Original vor Änderungen exportieren',
  hwpBackup: 'Arbeitskopie exportieren',
  hwpPrevious: 'Vorherige Seite',
  hwpNext: 'Nächste Seite',
  hwpPage: 'Dokumentseite',
  hwpFind: 'Zu ersetzender Text · eindeutige Phrase',
  hwpReplacement: 'Neuer Text',
  hwpReplace: 'Ersetzen und lokal speichern',
  hwpUndo: 'Letzte Änderung rückgängig',
  hwpFailed:
    'Öffnen oder Bearbeiten fehlgeschlagen. Mehrdeutigen Text, Dateiformat und Speicher prüfen. Vorhandene Arbeit bleibt erhalten.',
} satisfies Record<keyof typeof zh, string>
