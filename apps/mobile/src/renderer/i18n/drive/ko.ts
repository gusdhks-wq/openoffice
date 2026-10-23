import type zh from './zh'
export default {
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
