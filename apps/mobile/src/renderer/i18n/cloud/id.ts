import type zh from './zh'
export default {
  cloudTitle: 'Dokumen untuk Codex eksternal',
  cloudURL: 'Alamat server dokumen',
  cloudKey: 'Kunci koneksi pemilik',
  cloudConnect: 'Hubungkan server',
  cloudDisconnect: 'Putuskan server',
  cloudSync: 'Sinkronkan dokumen',
  cloudRefresh: 'Segarkan dokumen',
  cloudShare: 'Bagikan ke Codex eksternal',
  cloudUnshare: 'Hentikan berbagi',
  cloudVersions: 'Versi sebelumnya',
  cloudRestore: 'Pulihkan',
  cloudCopy: 'Unggah sebagai dokumen baru',
  cloudConnected: 'Server dokumen terhubung',
  cloudDisconnected: 'Server dokumen terputus',
  cloudBusy: 'Memproses di server…',
  cloudFailed: 'Tindakan server gagal. Draf lokal tetap disimpan.',
  cloudConflict: 'Server memiliki versi lain. Buka terpisah atau unggah draf sebagai dokumen baru.',
  cloudPending: 'Unggahan server tertunda',
  cloudNotice:
    'Codex eksternal hanya dapat membaca dan mengedit dokumen yang dibagikan. Kunci tetap di memori selama sesi ini.',
} satisfies Record<keyof typeof zh, string>
