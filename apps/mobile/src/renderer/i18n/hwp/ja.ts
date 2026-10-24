import type zh from './zh'
export default {
  hwpExitFullscreen: '全画面を終了',

  hwpFullscreen: '全画面',

  hwpFitWidth: '幅に合わせる',

  hwpZoomOut: '縮小',

  hwpZoomIn: '拡大',

  hwpHelp: '対応範囲と制限',

  sourceWorkspace: 'テキスト文書と接続設定',

  hwpSaveFailed:
    '編集内容の検証または保存に失敗しました。編集画面を閉じずに再試行してください。原本と前回の保存内容は保持されます。',

  hwpSaveNative: 'HWP/HWPX編集済みコピーを保存',

  hwpNew: '新しいHWP文書',

  hwpTitle: 'HWP 文書編集 · 試験機能',
  hwpScope:
    'HWP/HWPXに直接入力し、書式や表を編集できます。入力を止めると端末に保存され、原本を残して同じ形式の編集済みコピーを出力できます。パスワード・変更履歴付き文書は未対応です。Hangul互換性と実機IMEは検証中で、AI・ドライブ連携は未実装です。',
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
    '文書を開けませんでした。形式、パスワード、変更履歴を確認してください。原本と保存済みコピーは保持されます。',
} satisfies Record<keyof typeof zh, string>
