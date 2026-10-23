import drive from './drive/vi'
import type zh from './zh'
export default {
  ...drive,
  prototype: 'Bản thử nghiệm di động',
  newDocument: 'Tài liệu mới',
  importFile: 'Nhập',
  exportFile: 'Xuất',
  documents: 'Tài liệu',
  editor: 'Nội dung tài liệu',
  saved: 'Đã lưu trên thiết bị này',
  saving: 'Đang lưu…',
  saveFailed: 'Chưa lưu. Hãy xuất bản sao trước khi thoát.',
  retry: 'Thử lưu lại',
  loading: 'Đang tải…',
  openFailed: 'Không mở được bộ nhớ cục bộ. Hãy tải lại trang.',
  importFailed: 'Chọn tệp UTF-8 .md hoặc .txt nhỏ hơn 2 MB.',
  exportFailed: 'Không xuất được tệp.',
  localOnly: 'Chỉ lưu cục bộ. Chưa kết nối Drive và AI đám mây.',
  untitled: 'Chưa có tiêu đề',
  empty: 'Tạo hoặc nhập tài liệu để bắt đầu.',
  language: 'Ngôn ngữ',
} satisfies Record<keyof typeof zh, string>
