import cloud from './cloud/ja'
import drive from './drive/ja'
import type zh from './zh'
export default {
  ...cloud,
  ...drive,
  prototype: 'モバイル試作版',
  newDocument: '新規文書',
  importFile: '読み込み',
  exportFile: '書き出し',
  documents: '文書一覧',
  editor: '文書の内容',
  saved: 'この端末に保存済み',
  saving: '保存中…',
  saveFailed: '保存できません。終了前にコピーを書き出してください。',
  retry: '保存を再試行',
  loading: '読み込み中…',
  openFailed: '端末の保存領域を開けません。再読み込みしてください。',
  importFailed: '2 MB 未満の UTF-8 の .md または .txt ファイルを選択してください。',
  exportFailed: 'ファイルを書き出せませんでした。',
  localOnly: '文書はまず端末に保存されます。外部接続は任意です。',
  untitled: '無題',
  empty: '文書を作成または読み込んでください。',
  language: '言語',
} satisfies Record<keyof typeof zh, string>
