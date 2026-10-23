import type zh from './zh'
export default {
  driveConnect: '連接雲端硬碟',
  driveDisconnect: '中斷雲端硬碟連線',
  driveSync: '同步此文件',
  driveRefresh: '重新整理',
  driveRemoteFiles: '雲端硬碟版本',
  driveConnected: '雲端硬碟已連接',
  driveDisconnected: '雲端硬碟未連接',
  driveBusy: '正在同步…',
  driveSynced: '同步完成',
  driveConflict: '存在多個版本，請從雲端清單分別開啟。',
  driveFailed: '雲端操作失敗，本機文件已保留。',
  driveSetup: '請先設定 Google OAuth，參閱應用程式設定指南。',
  driveAccountMismatch: '此文件屬於另一個雲端帳號，請連接原帳號。',
  drivePending: '已在本機排程等待上傳',
  driveOffline: '目前離線，連線後將重試同步已連結的文件。',
  driveNotice: '雲端硬碟將修改儲存為新檔案，尚未連接雲端 AI。',
} satisfies Record<keyof typeof zh, string>
