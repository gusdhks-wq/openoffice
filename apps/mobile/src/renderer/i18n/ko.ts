import cloud from './cloud/ko'
import drive from './drive/ko'
import type zh from './zh'
export default {
  ...cloud,
  ...drive,
  prototype: '모바일 시제품',
  newDocument: '새 문서',
  importFile: '가져오기',
  exportFile: '내보내기',
  documents: '문서 목록',
  editor: '문서 내용',
  saved: '이 기기에 저장됨',
  saving: '저장 중…',
  saveFailed: '저장하지 못했습니다. 나가기 전에 사본을 내보내세요.',
  retry: '저장 다시 시도',
  loading: '불러오는 중…',
  openFailed: '기기 저장소를 열지 못했습니다. 새로고침해 다시 시도하세요.',
  importFailed: '2MB 미만의 UTF-8 .md 또는 .txt 파일을 선택하세요.',
  exportFailed: '파일을 내보내지 못했습니다.',
  localOnly: '문서는 이 기기에 먼저 저장됩니다. 외부 연결은 선택 사항입니다.',
  untitled: '제목 없음',
  empty: '문서를 만들거나 가져와 시작하세요.',
  language: '언어',
} satisfies Record<keyof typeof zh, string>
