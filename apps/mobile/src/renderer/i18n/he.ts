import drive from './drive/he'
import type zh from './zh'
export default {
  ...drive,
  prototype: 'אב טיפוס לנייד',
  newDocument: 'מסמך חדש',
  importFile: 'ייבוא',
  exportFile: 'ייצוא',
  documents: 'מסמכים',
  editor: 'תוכן המסמך',
  saved: 'נשמר במכשיר זה',
  saving: 'שומר…',
  saveFailed: 'לא נשמר. יש לייצא עותק לפני היציאה.',
  retry: 'ניסיון שמירה נוסף',
  loading: 'טוען…',
  openFailed: 'לא ניתן לפתוח אחסון מקומי. יש לרענן את הדף.',
  importFailed: 'יש לבחור קובץ UTF-8 מסוג .md או .txt הקטן מ־2 MB.',
  exportFailed: 'לא ניתן לייצא את הקובץ.',
  localOnly: 'אחסון מקומי בלבד. Drive ובינה מלאכותית בענן אינם מחוברים.',
  untitled: 'ללא כותרת',
  empty: 'יש ליצור או לייבא מסמך כדי להתחיל.',
  language: 'שפה',
} satisfies Record<keyof typeof zh, string>
