import type zh from './zh'
export default {
  driveCancelPending: 'Batal penciptaan tertunda (kekalkan fail Drive)',
  driveLiveMode: 'Dokumen Google boleh sunting',
  driveBackupMode: 'Sandaran fail lama',
  driveLiveNotice:
    'Segerakkan dokumen Google teks biasa tanpa PC. Dalam ChatGPT, gunakan Google Drive untuk menyunting dokumen yang sama. Jadual, dokumen berformat dan berbilang tab tidak disunting di sini.',
  driveGoogleLink: 'Buka dokumen Google',
  driveLiveConflict:
    'Kedua-dua salinan berubah. Draf dikekalkan. Buka salinan Drive secara berasingan.',
  driveUnsupported:
    'Kandungan atau format tidak disokong. Dokumen asal dan draf setempat dikekalkan.',
  driveUncertain:
    'Hasil Google belum pasti. Cuba segerak semula untuk mencari fail yang sama; jangan cipta salinan baharu.',
  driveSetupHint:
    'Aktifkan Drive API dan Docs API dalam Google Cloud. Daftar pakej dan sijil Android atau klien OAuth web untuk asal ini. Rahsia klien tidak diperlukan.',
  driveWebClientId: 'ID klien OAuth web (awam)',
  driveSaveSetup: 'Simpan tetapan log masuk',
  driveConnect: 'Sambungkan Drive',
  driveDisconnect: 'Putuskan Drive',
  driveSync: 'Segerakkan dokumen ini',
  driveRefresh: 'Muat semula',
  driveRemoteFiles: 'Versi Drive',
  driveConnected: 'Drive disambungkan',
  driveDisconnected: 'Drive diputuskan',
  driveBusy: 'Menyegerakkan…',
  driveSynced: 'Penyegerakan selesai',
  driveConflict: 'Terdapat beberapa versi. Buka setiap cabang daripada senarai Drive.',
  driveFailed: 'Tindakan Drive gagal. Dokumen setempat dikekalkan.',
  driveSetup: 'Sediakan Google OAuth dahulu. Lihat panduan persediaan.',
  driveAccountMismatch: 'Dokumen ini milik akaun Drive lain. Sambungkan akaun itu.',
  drivePending: 'Muat naik beratur pada peranti ini',
  driveOffline: 'Luar talian. Dokumen terpaut akan dicuba disegerakkan apabila disambungkan.',
  driveNotice: 'Drive menyimpan perubahan sebagai fail baharu. AI awan belum disambungkan.',
} satisfies Record<keyof typeof zh, string>
