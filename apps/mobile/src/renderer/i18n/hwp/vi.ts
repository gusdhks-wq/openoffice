import type zh from './zh'
export default {
  hwpTitle: 'Không gian HWP · thử nghiệm',
  hwpScope:
    'Mở HWP/HWPX trên thiết bị và thay chữ trong đoạn hoặc ô bảng. Bản gốc và thay đổi được lưu trong bản sao có thể nhập lại. Chưa hỗ trợ xuất HWP/HWPX đã sửa, AI hay đồng bộ Drive. Phông chữ có thể làm đổi ngắt trang.',
  hwpOpen: 'Mở HWP hoặc bản sao công việc',
  hwpOriginal: 'Xuất bản gốc trước khi sửa',
  hwpBackup: 'Xuất bản sao công việc',
  hwpPrevious: 'Trang trước',
  hwpNext: 'Trang sau',
  hwpPage: 'Trang tài liệu',
  hwpFind: 'Chữ cần thay · cụm từ duy nhất',
  hwpReplacement: 'Chữ mới',
  hwpReplace: 'Thay và lưu trên thiết bị',
  hwpUndo: 'Hoàn tác thay đổi cuối',
  hwpFailed:
    'Không thể mở hoặc sửa. Kiểm tra chữ trùng, định dạng và bộ nhớ. Công việc hiện có được giữ lại.',
} satisfies Record<keyof typeof zh, string>
