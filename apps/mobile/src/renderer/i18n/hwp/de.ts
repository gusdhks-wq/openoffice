import type zh from './zh'
export default {
  hwpExitFullscreen: 'Vollbild verlassen',

  hwpFullscreen: 'Vollbild',

  hwpFitWidth: 'Seitenbreite',

  hwpZoomOut: 'Verkleinern',

  hwpZoomIn: 'Vergrößern',

  hwpHelp: 'Umfang und Einschränkungen',

  sourceWorkspace: 'Textdokumente und Verbindungen',

  hwpSaveFailed:
    'Prüfen oder Speichern fehlgeschlagen. Editor geöffnet lassen und erneut versuchen. Original und letzte Speicherung bleiben erhalten.',

  hwpSaveNative: 'Bearbeitete HWP/HWPX-Kopie speichern',

  hwpNew: 'Neues HWP-Dokument',

  hwpTitle: 'HWP-Dokumenteditor · experimentell',
  hwpScope:
    'Direkt in HWP/HWPX schreiben, Formatierung und Tabellen bearbeiten. Lokale Speicherung nach Tipp-Pausen und Export bearbeiteter Kopien im Originalformat. Passwort und Änderungsverfolgung werden nicht unterstützt. Hangul-Kompatibilität und mobile Eingabe müssen geprüft werden; KI und Drive fehlen noch.',
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
    'Dokument kann nicht geöffnet werden. Format, Passwortschutz und Änderungsverfolgung prüfen. Originale und gespeicherte Kopien bleiben erhalten.',
} satisfies Record<keyof typeof zh, string>
