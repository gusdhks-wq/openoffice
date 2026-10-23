import type zh from './zh'
export default {
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
