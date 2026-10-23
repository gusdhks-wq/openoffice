import type zh from './zh'
export default {
  driveCancelPending: 'Hủy tạo đang chờ (giữ tệp Drive)',
  driveLiveMode: 'Tài liệu Google có thể chỉnh sửa',
  driveBackupMode: 'Bản sao lưu tệp cũ',
  driveLiveNotice:
    'Đồng bộ tài liệu Google văn bản thuần mà không cần PC. Trong ChatGPT, dùng Google Drive để sửa cùng tài liệu. Không chỉnh sửa bảng, tài liệu có định dạng hay nhiều thẻ tại đây.',
  driveGoogleLink: 'Mở tài liệu Google',
  driveLiveConflict:
    'Cả hai bản đều đã thay đổi. Bản nháp được giữ lại. Hãy mở riêng bản trên Drive.',
  driveUnsupported:
    'Nội dung hoặc định dạng không được hỗ trợ. Bản gốc và bản nháp cục bộ được giữ lại.',
  driveUncertain:
    'Chưa rõ kết quả của Google. Thử đồng bộ lại để tìm đúng tệp đó; không tạo bản sao khác.',
  driveSetupHint:
    'Bật Drive API và Docs API trong Google Cloud. Đăng ký gói và chứng chỉ Android hoặc ứng dụng OAuth web cho nguồn này. Không cần bí mật ứng dụng.',
  driveWebClientId: 'ID ứng dụng OAuth web (công khai)',
  driveSaveSetup: 'Lưu thiết lập đăng nhập',
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
