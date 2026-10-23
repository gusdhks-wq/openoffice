import type zh from './zh'
export default {
  cloudTitle: 'מסמכים עבור Codex חיצוני',
  cloudURL: 'כתובת שרת המסמכים',
  cloudKey: 'מפתח חיבור הבעלים',
  cloudConnect: 'חיבור השרת',
  cloudDisconnect: 'ניתוק השרת',
  cloudSync: 'סנכרון מסמך',
  cloudRefresh: 'רענון מסמכים',
  cloudShare: 'שיתוף עם Codex חיצוני',
  cloudUnshare: 'הפסקת שיתוף',
  cloudVersions: 'גרסאות קודמות',
  cloudRestore: 'שחזור',
  cloudCopy: 'העלאה כמסמך חדש',
  cloudConnected: 'שרת המסמכים מחובר',
  cloudDisconnected: 'שרת המסמכים מנותק',
  cloudBusy: 'עובד עם השרת…',
  cloudFailed: 'פעולת השרת נכשלה. הטיוטות המקומיות נשמרו.',
  cloudConflict: 'בשרת קיימת גרסה אחרת. יש לפתוח אותה בנפרד או להעלות את הטיוטה כמסמך חדש.',
  cloudPending: 'העלאה לשרת ממתינה',
  cloudNotice:
    'Codex חיצוני יכול לקרוא ולערוך רק מסמכים משותפים. המפתח נשאר בזיכרון רק במהלך ההפעלה הזו.',
} satisfies Record<keyof typeof zh, string>
