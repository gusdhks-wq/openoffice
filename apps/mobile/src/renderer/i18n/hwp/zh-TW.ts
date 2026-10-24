import type zh from './zh'
export default {
  hwpExitFullscreen: '離開全螢幕',

  hwpFullscreen: '全螢幕',

  hwpFitWidth: '符合寬度',

  hwpZoomOut: '縮小',

  hwpZoomIn: '放大',

  hwpHelp: '使用範圍與限制',

  sourceWorkspace: '文字文件與連線設定',

  hwpSaveFailed: '無法驗證或儲存修改。請保持編輯器開啟並重試。原件和上次儲存的副本已保留。',

  hwpSaveNative: '儲存 HWP/HWPX 修改副本',

  hwpNew: '新增 HWP 文件',

  hwpTitle: 'HWP 文件編輯 · 實驗功能',
  hwpScope:
    '在 HWP/HWPX 文件中直接輸入並編輯格式和表格。暫停輸入後自動儲存到本機，可匯出原格式修改副本並保留原件。不支援密碼和修訂記錄。仍需驗證韓文輸入及 Hangul 相容性，尚未連接 AI 和雲端同步。',
  hwpOpen: '開啟 HWP 或工作區備份',
  hwpOriginal: '匯出原檔 · 修改前',
  hwpBackup: '匯出工作區備份',
  hwpPrevious: '上一頁',
  hwpNext: '下一頁',
  hwpPage: '文件頁面',
  hwpFind: '要取代的文字 · 唯一詞句',
  hwpReplacement: '新文字',
  hwpReplace: '取代並儲存到本機',
  hwpUndo: '復原上次修改',
  hwpFailed: '無法開啟文件。請檢查格式、密碼保護和修訂記錄。原件及已儲存副本保持不變。',
} satisfies Record<keyof typeof zh, string>
