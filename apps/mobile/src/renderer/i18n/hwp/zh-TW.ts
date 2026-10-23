import type zh from './zh'
export default {
  hwpTitle: 'HWP 工作區 · 實驗功能',
  hwpScope:
    '在本機開啟 HWP/HWPX，取代內文或表格儲存格中的文字。修改與原檔一起儲存在工作區備份中，可用本應用程式重新匯入。暫不支援匯出修改後的 HWP/HWPX、AI 或雲端同步。字型可能影響分頁。',
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
  hwpFailed: '無法開啟或修改。請檢查重複文字、檔案格式或儲存錯誤。現有工作已保留。',
} satisfies Record<keyof typeof zh, string>
