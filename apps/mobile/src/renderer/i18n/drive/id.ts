import type zh from './zh'
export default {
  driveCancelPending: 'Batalkan pembuatan tertunda (simpan berkas Drive)',
  driveLiveMode: 'Dokumen Google yang dapat diedit',
  driveBackupMode: 'Cadangan berkas lama',
  driveLiveNotice:
    'Sinkronkan dokumen Google teks biasa tanpa PC. Di ChatGPT, gunakan Google Drive untuk mengedit dokumen yang sama. Tabel, dokumen berformat dan banyak tab tidak diedit di sini.',
  driveGoogleLink: 'Buka dokumen Google',
  driveLiveConflict:
    'Kedua salinan berubah. Draf dipertahankan. Buka salinan Drive secara terpisah.',
  driveUnsupported: 'Konten atau format tidak didukung. Dokumen asli dan draf lokal dipertahankan.',
  driveUncertain:
    'Hasil Google belum pasti. Coba sinkronkan lagi untuk menemukan berkas yang sama; jangan buat salinan baru.',
  driveSetupHint:
    'Aktifkan Drive API dan Docs API di Google Cloud. Daftarkan paket dan sertifikat Android atau klien OAuth web untuk asal ini. Rahasia klien tidak diperlukan.',
  driveWebClientId: 'ID klien OAuth web (publik)',
  driveSaveSetup: 'Simpan pengaturan masuk',
  driveConnect: 'Hubungkan Drive',
  driveDisconnect: 'Putuskan Drive',
  driveSync: 'Sinkronkan dokumen ini',
  driveRefresh: 'Segarkan',
  driveRemoteFiles: 'Versi Drive',
  driveConnected: 'Drive terhubung',
  driveDisconnected: 'Drive terputus',
  driveBusy: 'Menyinkronkan…',
  driveSynced: 'Sinkronisasi selesai',
  driveConflict: 'Ada beberapa versi. Buka setiap cabang dari daftar Drive.',
  driveFailed: 'Tindakan Drive gagal. Dokumen lokal tetap disimpan.',
  driveSetup: 'Siapkan Google OAuth terlebih dahulu. Lihat panduan penyiapan.',
  driveAccountMismatch: 'Dokumen ini milik akun Drive lain. Hubungkan akun tersebut.',
  drivePending: 'Unggahan mengantre di perangkat ini',
  driveOffline: 'Luring. Dokumen tertaut akan dicoba disinkronkan saat terhubung.',
  driveNotice: 'Drive menyimpan perubahan sebagai berkas baru. AI awan belum terhubung.',
} satisfies Record<keyof typeof zh, string>
