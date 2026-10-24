import type zh from './zh'
export default {
  driveCancelPending: '전송 대기 취소 (Drive 파일 유지)',
  driveLiveMode: 'Google 문서 동기화',
  driveBackupMode: '이전 방식: 파일별 백업',
  driveLiveNotice:
    'PC 없이 텍스트 Google 문서를 동기화합니다. ChatGPT에서는 Google Drive로 같은 문서를 수정하세요. 표·서식·여러 탭 문서는 여기서 수정하지 않습니다.',
  driveGoogleLink: 'Google 문서 열기',
  driveLiveConflict:
    '기기와 드라이브에서 모두 수정됐습니다. 초안은 보존됩니다. 드라이브 수정본을 별도로 열어 확인하세요.',
  driveUnsupported: '지원하지 않는 내용이나 서식이 있습니다. 원본과 기기 초안은 보존됩니다.',
  driveUncertain:
    'Google 처리 결과를 확인해야 합니다. 동기화를 재시도해 같은 파일을 찾으세요. 새 사본을 만들지 마세요.',
  driveSetupHint:
    'Google Cloud 프로젝트에서 Drive API와 Docs API를 켜세요. Android는 패키지·서명 인증서, 웹은 현재 주소의 OAuth 클라이언트를 등록하세요. 비밀키는 필요 없습니다.',
  driveWebClientId: '웹 로그인 클라이언트 ID (공개 값)',
  driveSaveSetup: '로그인 설정 저장',
  driveConnect: '드라이브 연결',
  driveDisconnect: '드라이브 연결 해제',
  driveSync: '이 문서 동기화',
  driveRefresh: '새로고침',
  driveRemoteFiles: '드라이브 버전 목록',
  driveConnected: '드라이브 연결됨',
  driveDisconnected: '드라이브 연결 안 됨',
  driveBusy: '동기화 중…',
  driveSynced: '동기화 완료',
  driveConflict: '수정본이 여러 개입니다. 드라이브 목록에서 각각 열어 확인하세요.',
  driveFailed: '드라이브 작업에 실패했습니다. 기기 문서는 보존됩니다.',
  driveSetup: '먼저 Google OAuth 설정이 필요합니다. 앱 실행 안내를 참고하세요.',
  driveAccountMismatch: '다른 드라이브 계정에 연결된 문서입니다. 원래 계정으로 연결하세요.',
  drivePending: '이 기기에서 드라이브 전송 대기 중',
  driveOffline: '오프라인입니다. 연결되면 연결된 문서의 동기화를 재시도합니다.',
  driveNotice: '드라이브는 수정본을 새 파일로 보관합니다. 클라우드 AI는 아직 연결되지 않았습니다.',
} satisfies Record<keyof typeof zh, string>
