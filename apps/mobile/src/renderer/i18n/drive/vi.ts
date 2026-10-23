import type zh from './zh'
export default {
  driveConnect: 'Kết nối Drive',
  driveDisconnect: 'Ngắt kết nối Drive',
  driveSync: 'Đồng bộ tài liệu này',
  driveRefresh: 'Làm mới',
  driveRemoteFiles: 'Các phiên bản Drive',
  driveConnected: 'Đã kết nối Drive',
  driveDisconnected: 'Chưa kết nối Drive',
  driveBusy: 'Đang đồng bộ…',
  driveSynced: 'Đồng bộ hoàn tất',
  driveConflict: 'Có nhiều phiên bản. Mở từng nhánh trong danh sách Drive.',
  driveFailed: 'Thao tác Drive thất bại. Tài liệu cục bộ được giữ lại.',
  driveSetup: 'Hãy cấu hình Google OAuth trước. Xem hướng dẫn thiết lập.',
  driveAccountMismatch: 'Tài liệu thuộc tài khoản Drive khác. Hãy kết nối tài khoản đó.',
  drivePending: 'Đang chờ tải lên trên thiết bị này',
  driveOffline: 'Đang ngoại tuyến. Tài liệu đã liên kết sẽ được đồng bộ lại khi có mạng.',
  driveNotice: 'Drive lưu thay đổi thành tệp mới. Chưa kết nối AI đám mây.',
} satisfies Record<keyof typeof zh, string>
