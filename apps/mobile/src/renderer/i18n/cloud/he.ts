import type zh from './zh'
export default {
  cloudMethod: 'שיטת חיבור',
  cloudPairCode: 'קוד הטלפון (8 ספרות)',
  cloudPairHelp:
    'יש להזין את קוד הטלפון מחלון Mobile-connect במחשב. הקוד תקף פעם אחת למשך 3 דקות. לקבלת קוד חדש יש להקליד P ואז Enter במחשב. זהו קוד נפרד מקוד האישור של ChatGPT.',
  cloudAuthFailed: 'האימות פג או שהקוד שגוי. יש לקבל קוד טלפון חדש במחשב ולהתחבר שוב.',
  cloudReconnect: 'חיבור המסמך לכתובת הנוכחית',
  cloudReconnectHelp:
    'הכתובת של אותו שרת מסמכים השתנתה. אפשר להתחבר שוב תוך שמירת הטיוטה במכשיר והגרסאות הקודמות.',
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
