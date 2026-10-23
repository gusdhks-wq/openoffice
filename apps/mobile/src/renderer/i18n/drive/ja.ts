import type zh from './zh'
export default {
  driveConnect: 'ドライブに接続',
  driveDisconnect: 'ドライブを切断',
  driveSync: 'この文書を同期',
  driveRefresh: '更新',
  driveRemoteFiles: 'ドライブの版一覧',
  driveConnected: 'ドライブ接続済み',
  driveDisconnected: 'ドライブ未接続',
  driveBusy: '同期中…',
  driveSynced: '同期完了',
  driveConflict: '複数の版があります。ドライブ一覧からそれぞれ開いてください。',
  driveFailed: 'ドライブ操作に失敗しました。端末の文書は保持されます。',
  driveSetup: '先に Google OAuth を設定してください。アプリの設定手順を参照してください。',
  driveAccountMismatch: '別のドライブアカウントの文書です。元のアカウントに接続してください。',
  drivePending: '端末でアップロード待ち',
  driveOffline: 'オフラインです。接続後に連携文書の同期を再試行します。',
  driveNotice: '変更は新しいファイルとしてドライブに保存します。クラウド AI は未接続です。',
} satisfies Record<keyof typeof zh, string>
