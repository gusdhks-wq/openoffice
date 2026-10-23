import type zh from './zh'
export default {
  driveCancelPending: 'ביטול יצירה ממתינה (שמירת קובצי Drive)',
  driveLiveMode: 'מסמכי Google הניתנים לעריכה',
  driveBackupMode: 'גיבויי קבצים קודמים',
  driveLiveNotice:
    'סנכרון מסמכי Google בטקסט פשוט ללא מחשב. ב-ChatGPT יש להשתמש ב-Google Drive לעריכת אותו מסמך. טבלאות, מסמכים מעוצבים ומסמכים מרובי כרטיסיות אינם נערכים כאן.',
  driveGoogleLink: 'פתיחת מסמך Google',
  driveLiveConflict: 'שני העותקים השתנו. הטיוטה נשמרת. יש לפתוח בנפרד את עותק Drive.',
  driveUnsupported: 'תוכן או עיצוב לא נתמכים. המקור והטיוטה המקומית נשמרים.',
  driveUncertain:
    'תוצאת Google אינה ודאית. יש לנסות לסנכרן שוב כדי למצוא את אותו קובץ, בלי ליצור עותק נוסף.',
  driveSetupHint:
    'יש להפעיל Drive API ו-Docs API ב-Google Cloud ולרשום חבילת Android ותעודת חתימה או לקוח OAuth לאתר ממקור זה. אין צורך בסוד לקוח.',
  driveWebClientId: 'מזהה לקוח OAuth לאתר (ציבורי)',
  driveSaveSetup: 'שמירת הגדרות כניסה',
  driveConnect: 'חיבור Drive',
  driveDisconnect: 'ניתוק Drive',
  driveSync: 'סנכרון המסמך הזה',
  driveRefresh: 'רענון',
  driveRemoteFiles: 'גרסאות Drive',
  driveConnected: 'Drive מחובר',
  driveDisconnected: 'Drive מנותק',
  driveBusy: 'מסנכרן…',
  driveSynced: 'הסנכרון הושלם',
  driveConflict: 'קיימות כמה גרסאות. יש לפתוח כל ענף מרשימת Drive.',
  driveFailed: 'פעולת Drive נכשלה. המסמכים המקומיים נשמרו.',
  driveSetup: 'יש להגדיר תחילה Google OAuth. עיינו במדריך ההגדרה.',
  driveAccountMismatch: 'המסמך שייך לחשבון Drive אחר. יש לחבר חשבון זה.',
  drivePending: 'העלאה ממתינה במכשיר זה',
  driveOffline: 'אין חיבור. סנכרון המסמכים המקושרים ינסה שוב בחיבור לרשת.',
  driveNotice: 'Drive שומר שינויים כקבצים חדשים. בינה מלאכותית בענן אינה מחוברת.',
} satisfies Record<keyof typeof zh, string>
