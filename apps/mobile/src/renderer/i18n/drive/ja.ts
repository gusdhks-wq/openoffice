import type zh from './zh'
export default {
  driveCancelPending: '作成待ちを取消（Driveのファイルは保持）',
  driveLiveMode: '編集可能な Google ドキュメント',
  driveBackupMode: '従来のファイルバックアップ',
  driveLiveNotice:
    'PCなしでプレーンテキストの Google ドキュメントを同期します。ChatGPTでは Google Drive から同じ文書を編集してください。表・書式付き・複数タブの文書はここでは編集しません。',
  driveGoogleLink: 'Google ドキュメントを開く',
  driveLiveConflict:
    '両方で変更されています。下書きは保持されています。Driveの版を別に開いてください。',
  driveUnsupported: '未対応の内容または書式です。原本と端末の下書きは保持されています。',
  driveUncertain:
    'Googleの処理結果を確認できません。同期を再試行して同じファイルを探してください。別のコピーを作成しないでください。',
  driveSetupHint:
    'Google Cloudで Drive API と Docs API を有効にしてください。Androidのパッケージと署名証明書、または現在のオリジン用のウェブOAuthクライアントを登録します。クライアントシークレットは不要です。',
  driveWebClientId: 'ウェブOAuthクライアントID（公開）',
  driveSaveSetup: 'ログイン設定を保存',
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
