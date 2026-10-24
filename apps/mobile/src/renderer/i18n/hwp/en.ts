import type zh from './zh'
export default {
  hwpExitFullscreen: 'Exit full screen',

  hwpFullscreen: 'Full screen',

  hwpFitWidth: 'Fit width',

  hwpZoomOut: 'Zoom out',

  hwpZoomIn: 'Zoom in',

  hwpHelp: 'Scope and limitations',

  sourceWorkspace: 'Text documents and connections',

  hwpSaveFailed:
    'Could not verify or save edits. Keep this editor open and retry. The previous saved copy and original are retained.',

  hwpSaveNative: 'Save edited HWP/HWPX copy',

  hwpNew: 'New HWP document',

  hwpTitle: 'HWP document editor · experimental',
  hwpScope:
    'Type directly in HWP/HWPX documents and edit formatting or tables. Changes save locally after a typing pause. Export edited native-format copies while retaining originals. Password-protected and tracked-change documents are unsupported. Hangul compatibility and phone IME need further testing; AI and Drive integration are not available yet.',
  hwpOpen: 'Open HWP or workspace backup',
  hwpOriginal: 'Export original · before edits',
  hwpBackup: 'Export workspace backup',
  hwpPrevious: 'Previous page',
  hwpNext: 'Next page',
  hwpPage: 'Document page',
  hwpFind: 'Text to replace · unique phrase',
  hwpReplacement: 'Replacement text',
  hwpReplace: 'Replace and save locally',
  hwpUndo: 'Undo last edit',
  hwpFailed:
    'Could not open this document. Check its format, password protection and tracked changes. Existing originals and saved copies are retained.',
} satisfies Record<keyof typeof zh, string>
