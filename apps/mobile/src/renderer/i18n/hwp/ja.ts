import type zh from './zh'
export default {
  hwpTitle: 'HWP 作業領域 · 試験機能',
  hwpScope:
    'HWP/HWPXを端末で開き、本文や表の文字を部分的に置換します。変更は原本とともに作業バックアップに保存され、このアプリで再び開けます。編集済みHWP/HWPXの出力、AI、ドライブ同期は未対応です。フォントにより改ページが変わる場合があります。',
  hwpOpen: 'HWP・作業バックアップを開く',
  hwpOriginal: '編集前の原本を書き出す',
  hwpBackup: '作業バックアップを書き出す',
  hwpPrevious: '前のページ',
  hwpNext: '次のページ',
  hwpPage: '文書ページ',
  hwpFind: '置換する文字 · 一か所だけの語句',
  hwpReplacement: '新しい文字',
  hwpReplace: '置換して端末に保存',
  hwpUndo: '最後の変更を戻す',
  hwpFailed:
    '開くか編集することができませんでした。語句の重複、形式、保存領域を確認してください。既存の作業は保持されます。',
} satisfies Record<keyof typeof zh, string>
