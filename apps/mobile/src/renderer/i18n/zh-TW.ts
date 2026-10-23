import cloud from './cloud/zh-TW'
import drive from './drive/zh-TW'
import type zh from './zh'
export default {
  ...cloud,
  ...drive,
  prototype: '行動版原型',
  newDocument: '新增文件',
  importFile: '匯入',
  exportFile: '匯出',
  documents: '文件',
  editor: '文件內容',
  saved: '已儲存至此裝置',
  saving: '正在儲存…',
  saveFailed: '儲存失敗。離開前請匯出副本。',
  retry: '重試儲存',
  loading: '正在載入…',
  openFailed: '無法開啟本機儲存空間，請重新整理後再試。',
  importFailed: '請選擇小於 2 MB 的 UTF-8 .md 或 .txt 檔案。',
  exportFailed: '無法匯出檔案。',
  localOnly: '文件會先儲存在本機，外部連線為選用項目。',
  untitled: '未命名',
  empty: '建立或匯入文件以開始。',
  language: '語言',
} satisfies Record<keyof typeof zh, string>
