import type zh from './zh'
export default {
  driveConnect: 'เชื่อมต่อ Drive',
  driveDisconnect: 'ยกเลิกการเชื่อมต่อ Drive',
  driveSync: 'ซิงค์เอกสารนี้',
  driveRefresh: 'รีเฟรช',
  driveRemoteFiles: 'รุ่นเอกสารใน Drive',
  driveConnected: 'เชื่อมต่อ Drive แล้ว',
  driveDisconnected: 'ยังไม่เชื่อมต่อ Drive',
  driveBusy: 'กำลังซิงค์…',
  driveSynced: 'ซิงค์เสร็จแล้ว',
  driveConflict: 'มีหลายรุ่น โปรดเปิดแต่ละสาขาจากรายการ Drive',
  driveFailed: 'การทำงานกับ Drive ล้มเหลว เอกสารในเครื่องยังอยู่',
  driveSetup: 'ตั้งค่า Google OAuth ก่อน ดูคู่มือการตั้งค่าแอป',
  driveAccountMismatch: 'เอกสารนี้เชื่อมกับบัญชี Drive อื่น โปรดเชื่อมต่อบัญชีนั้น',
  drivePending: 'รออัปโหลดบนอุปกรณ์นี้',
  driveOffline: 'ออฟไลน์ จะลองซิงค์เอกสารที่เชื่อมไว้เมื่อออนไลน์',
  driveNotice: 'Drive เก็บการแก้ไขเป็นไฟล์ใหม่ ยังไม่เชื่อมต่อ AI บนคลาวด์',
} satisfies Record<keyof typeof zh, string>
