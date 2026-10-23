import type zh from './zh'
export default {
  cloudTitle: 'مستندات Codex الخارجي',
  cloudURL: 'عنوان خادم المستندات',
  cloudKey: 'مفتاح اتصال المالك',
  cloudConnect: 'ربط الخادم',
  cloudDisconnect: 'فصل الخادم',
  cloudSync: 'مزامنة المستند',
  cloudRefresh: 'تحديث المستندات',
  cloudShare: 'مشاركة مع Codex الخارجي',
  cloudUnshare: 'إيقاف المشاركة',
  cloudVersions: 'الإصدارات السابقة',
  cloudRestore: 'استعادة',
  cloudCopy: 'رفع كمستند جديد',
  cloudConnected: 'خادم المستندات متصل',
  cloudDisconnected: 'خادم المستندات غير متصل',
  cloudBusy: 'جارٍ العمل مع الخادم…',
  cloudFailed: 'فشلت عملية الخادم. تم الاحتفاظ بالمسودات المحلية.',
  cloudConflict: 'لدى الخادم إصدار آخر. افتحه منفصلاً أو ارفع المسودة كمستند جديد.',
  cloudPending: 'الرفع إلى الخادم قيد الانتظار',
  cloudNotice:
    'يمكن لـ Codex الخارجي قراءة وتعديل المستندات المشتركة فقط. يبقى المفتاح في الذاكرة خلال هذا التشغيل فقط.',
} satisfies Record<keyof typeof zh, string>
