import cloud from './cloud/ar'
import drive from './drive/ar'
import type zh from './zh'
export default {
  ...cloud,
  ...drive,
  prototype: 'نموذج تطبيق الهاتف',
  newDocument: 'مستند جديد',
  importFile: 'استيراد',
  exportFile: 'تصدير',
  documents: 'المستندات',
  editor: 'محتوى المستند',
  saved: 'محفوظ على هذا الجهاز',
  saving: 'جارٍ الحفظ…',
  saveFailed: 'لم يتم الحفظ. صدّر نسخة قبل المغادرة.',
  retry: 'إعادة الحفظ',
  loading: 'جارٍ التحميل…',
  openFailed: 'تعذر فتح التخزين المحلي. أعد تحميل الصفحة.',
  importFailed: 'اختر ملف UTF-8 بصيغة .md أو .txt أصغر من 2 ميغابايت.',
  exportFailed: 'تعذر تصدير الملف.',
  localOnly: 'تُحفظ المستندات على هذا الجهاز أولاً. الاتصالات الخارجية اختيارية.',
  untitled: 'بدون عنوان',
  empty: 'أنشئ مستندًا أو استورده للبدء.',
  language: 'اللغة',
} satisfies Record<keyof typeof zh, string>
