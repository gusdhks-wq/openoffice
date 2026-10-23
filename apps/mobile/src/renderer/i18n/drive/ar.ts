import type zh from './zh'
export default {
  driveConnect: 'ربط Drive',
  driveDisconnect: 'فصل Drive',
  driveSync: 'مزامنة هذا المستند',
  driveRefresh: 'تحديث',
  driveRemoteFiles: 'إصدارات Drive',
  driveConnected: 'تم ربط Drive',
  driveDisconnected: 'Drive غير متصل',
  driveBusy: 'جارٍ المزامنة…',
  driveSynced: 'اكتملت المزامنة',
  driveConflict: 'توجد إصدارات متعددة. افتح كل فرع من قائمة Drive.',
  driveFailed: 'فشلت عملية Drive. تم الاحتفاظ بالمستندات المحلية.',
  driveSetup: 'اضبط Google OAuth أولاً. راجع دليل الإعداد.',
  driveAccountMismatch: 'هذا المستند مرتبط بحساب Drive آخر. اربط ذلك الحساب.',
  drivePending: 'الرفع في قائمة الانتظار على هذا الجهاز',
  driveOffline: 'غير متصل. ستُعاد مزامنة المستندات المرتبطة عند الاتصال.',
  driveNotice: 'يحفظ Drive التعديلات كملفات جديدة. الذكاء الاصطناعي السحابي غير متصل.',
} satisfies Record<keyof typeof zh, string>
