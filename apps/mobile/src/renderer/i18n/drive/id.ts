import type zh from './zh'
export default {
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
