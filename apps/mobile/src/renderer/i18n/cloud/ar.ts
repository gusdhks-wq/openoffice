import type zh from './zh'
export default {
  cloudMethod: 'طريقة الاتصال',
  cloudPairCode: 'رمز الهاتف (8 أرقام)',
  cloudPairHelp:
    'أدخل رمز الهاتف من نافذة Mobile-connect على الكمبيوتر. صالح مرة واحدة لمدة 3 دقائق. اكتب P ثم اضغط Enter على الكمبيوتر لرمز جديد. يختلف عن رمز موافقة ChatGPT.',
  cloudAuthFailed:
    'انتهت المصادقة أو الرمز غير صحيح. احصل على رمز هاتف جديد من الكمبيوتر وأعد الاتصال.',
  cloudReconnect: 'إعادة ربط المستند بالعنوان الحالي',
  cloudReconnectHelp:
    'تغير عنوان خادم المستندات نفسه. أعد الاتصال مع الاحتفاظ بمسودة الجهاز والإصدارات السابقة.',
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
