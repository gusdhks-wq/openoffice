import type zh from './zh'
export default {
  hwpTitle: '한글 문서 작업 · 시험 기능',
  hwpScope:
    'HWP·HWPX를 기기에서 열고 본문·표 안 글자를 부분 수정합니다. 수정은 원본과 함께 작업 사본에 저장됩니다. 작업 사본은 이 앱에서 다시 가져올 수 있으며, 한글 파일로 수정본 저장·AI·드라이브 연동은 아직 지원하지 않습니다. 글꼴에 따라 배치가 달라질 수 있습니다.',
  hwpOpen: '한글 문서·작업 사본 열기',
  hwpOriginal: '원본 내보내기 · 수정 전',
  hwpBackup: '작업 사본 내보내기',
  hwpPrevious: '이전 쪽',
  hwpNext: '다음 쪽',
  hwpPage: '문서 쪽',
  hwpFind: '바꿀 글자 · 한 곳에만 있는 문구',
  hwpReplacement: '새 글자',
  hwpReplace: '부분 수정 후 기기에 저장',
  hwpUndo: '마지막 수정 취소',
  hwpFailed:
    '문서를 열거나 수정하지 못했습니다. 문구 중복·파일 형식·기기 저장 상태를 확인하세요. 기존 작업은 유지됩니다.',
} satisfies Record<keyof typeof zh, string>
