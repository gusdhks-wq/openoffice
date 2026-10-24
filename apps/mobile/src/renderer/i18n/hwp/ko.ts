import type zh from './zh'
export default {
  hwpExitFullscreen: '전체 화면 닫기',

  hwpFullscreen: '전체 화면',

  hwpFitWidth: '폭 맞춤',

  hwpZoomOut: '축소',

  hwpZoomIn: '확대',

  hwpHelp: '사용 범위와 주의사항',

  sourceWorkspace: '텍스트 문서와 연결 설정',

  hwpSaveFailed:
    '수정본을 검증하거나 저장하지 못했습니다. 현재 편집기를 닫지 말고 다시 저장하세요. 기존 저장본과 원본은 유지됩니다.',

  hwpSaveNative: '한글 파일로 수정본 저장',

  hwpNew: '새 한글 문서',

  hwpTitle: '한글 문서 편집 · 시험 기능',
  hwpScope:
    'HWP·HWPX 문서 위에서 직접 입력하고 서식·표를 편집할 수 있습니다. 변경은 잠시 입력을 멈추면 기기에 저장됩니다. 수정본은 한글 파일 사본으로 내보내며 원본은 보관합니다. 암호·변경 추적 문서는 지원하지 않습니다. 실제 한컴 호환성·휴대폰 한글 입력은 추가 검증이 필요하며, AI·드라이브 연동은 아직 없습니다.',
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
    '문서를 열지 못했습니다. 파일 형식과 암호·변경 추적 여부를 확인하세요. 기존 원본과 저장본은 유지됩니다.',
} satisfies Record<keyof typeof zh, string>
