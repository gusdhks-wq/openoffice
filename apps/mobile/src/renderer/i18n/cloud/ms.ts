import type zh from './zh'
export default {
  cloudMethod: 'Kaedah sambungan',
  cloudPairCode: 'Kod telefon (8 digit)',
  cloudPairHelp:
    'Masukkan kod telefon daripada tetingkap Mobile-connect pada PC. Sah sekali selama 3 minit. Taip P kemudian Enter pada PC untuk kod baharu. Kod ini berbeza daripada kod kelulusan ChatGPT.',
  cloudAuthFailed:
    'Pengesahan tamat tempoh atau kod salah. Dapatkan kod telefon baharu pada PC dan sambung semula.',
  cloudReconnect: 'Sambung semula dokumen ini ke alamat semasa',
  cloudReconnectHelp:
    'Pelayan dokumen yang sama mempunyai alamat baharu. Sambung semula sambil mengekalkan draf peranti dan versi terdahulu.',
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
