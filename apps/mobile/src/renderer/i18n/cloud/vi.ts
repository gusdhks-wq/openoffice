import type zh from './zh'
export default {
  cloudTitle: 'Tài liệu cho Codex bên ngoài',
  cloudURL: 'Địa chỉ máy chủ tài liệu',
  cloudKey: 'Khóa kết nối chủ sở hữu',
  cloudConnect: 'Kết nối máy chủ',
  cloudDisconnect: 'Ngắt kết nối máy chủ',
  cloudSync: 'Đồng bộ tài liệu',
  cloudRefresh: 'Làm mới tài liệu',
  cloudShare: 'Chia sẻ với Codex bên ngoài',
  cloudUnshare: 'Dừng chia sẻ',
  cloudVersions: 'Phiên bản trước',
  cloudRestore: 'Khôi phục',
  cloudCopy: 'Tải lên thành tài liệu mới',
  cloudConnected: 'Đã kết nối máy chủ tài liệu',
  cloudDisconnected: 'Chưa kết nối máy chủ tài liệu',
  cloudBusy: 'Đang làm việc với máy chủ…',
  cloudFailed: 'Thao tác máy chủ thất bại. Bản nháp cục bộ được giữ lại.',
  cloudConflict: 'Máy chủ có phiên bản khác. Mở riêng hoặc tải bản nháp lên thành tài liệu mới.',
  cloudPending: 'Đang chờ tải lên máy chủ',
  cloudNotice:
    'Codex bên ngoài chỉ có thể đọc và sửa tài liệu được chia sẻ. Khóa chỉ nằm trong bộ nhớ trong lần chạy này.',
} satisfies Record<keyof typeof zh, string>
