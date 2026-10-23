import type zh from './zh'
export default {
  cloudTitle: 'Dokumen untuk Codex luaran',
  cloudURL: 'Alamat pelayan dokumen',
  cloudKey: 'Kunci sambungan pemilik',
  cloudConnect: 'Sambungkan pelayan',
  cloudDisconnect: 'Putuskan pelayan',
  cloudSync: 'Segerakkan dokumen',
  cloudRefresh: 'Muat semula dokumen',
  cloudShare: 'Kongsi dengan Codex luaran',
  cloudUnshare: 'Hentikan perkongsian',
  cloudVersions: 'Versi terdahulu',
  cloudRestore: 'Pulihkan',
  cloudCopy: 'Muat naik sebagai dokumen baharu',
  cloudConnected: 'Pelayan dokumen disambungkan',
  cloudDisconnected: 'Pelayan dokumen diputuskan',
  cloudBusy: 'Memproses pada pelayan…',
  cloudFailed: 'Tindakan pelayan gagal. Draf setempat dikekalkan.',
  cloudConflict:
    'Pelayan mempunyai versi lain. Buka berasingan atau muat naik draf sebagai dokumen baharu.',
  cloudPending: 'Muat naik pelayan menunggu',
  cloudNotice:
    'Codex luaran hanya boleh membaca dan menyunting dokumen yang dikongsi. Kunci kekal dalam memori sepanjang sesi ini.',
} satisfies Record<keyof typeof zh, string>
