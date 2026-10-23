import type zh from './zh'
export default {
  cloudMethod: 'Metode koneksi',
  cloudPairCode: 'Kode ponsel (8 digit)',
  cloudPairHelp:
    'Masukkan kode ponsel dari jendela Mobile-connect di PC. Berlaku sekali selama 3 menit. Ketik P lalu Enter di PC untuk kode baru. Kode ini berbeda dari kode persetujuan ChatGPT.',
  cloudAuthFailed:
    'Autentikasi kedaluwarsa atau kode salah. Dapatkan kode ponsel baru di PC dan hubungkan kembali.',
  cloudReconnect: 'Hubungkan dokumen ini ke alamat saat ini',
  cloudReconnectHelp:
    'Server dokumen yang sama memiliki alamat baru. Hubungkan kembali dengan mempertahankan draf perangkat dan versi sebelumnya.',
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
