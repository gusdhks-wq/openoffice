import type zh from './zh'
export default {
  cloudTitle: '外部 Codex の文書',
  cloudURL: '文書サーバーのアドレス',
  cloudKey: '所有者の接続キー',
  cloudConnect: 'サーバーに接続',
  cloudDisconnect: 'サーバーを切断',
  cloudSync: '文書を同期',
  cloudRefresh: 'サーバー文書を更新',
  cloudShare: '外部 Codex に共有',
  cloudUnshare: '共有を停止',
  cloudVersions: '以前の版',
  cloudRestore: '復元',
  cloudCopy: '新しい文書として送信',
  cloudConnected: '文書サーバー接続済み',
  cloudDisconnected: '文書サーバー未接続',
  cloudBusy: '文書サーバーで処理中…',
  cloudFailed: 'サーバー操作に失敗しました。端末の下書きは保持されます。',
  cloudConflict:
    'サーバーに別の変更があります。別に開くか、下書きを新しい文書として送信してください。',
  cloudPending: 'サーバーへの送信待ち',
  cloudNotice:
    '共有した文書だけを外部 Codex が読み書きできます。接続キーは今回の実行中のみメモリに保持します。',
} satisfies Record<keyof typeof zh, string>
