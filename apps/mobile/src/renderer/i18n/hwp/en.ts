import type zh from './zh'
export default {
  hwpTitle: 'HWP workspace · experimental',
  hwpScope:
    'Open HWP/HWPX locally and replace text in paragraphs or table cells. Edits are saved with the original in a workspace backup, which this app can reopen. Edited HWP/HWPX export, AI and Drive sync are not available yet. Fonts may change page layout.',
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
    'Could not open or edit. Check for duplicate text, unsupported files or storage errors. Existing work is retained.',
} satisfies Record<keyof typeof zh, string>
