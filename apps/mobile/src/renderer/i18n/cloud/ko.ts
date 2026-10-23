import type zh from './zh'
export default {
  cloudTitle: '외부 Codex 문서 연결',
  cloudURL: '문서 서버 주소',
  cloudKey: '소유자 연결키',
  cloudConnect: '서버 연결',
  cloudDisconnect: '서버 연결 해제',
  cloudSync: '문서 동기화',
  cloudRefresh: '서버 문서 새로고침',
  cloudShare: '외부 Codex에 공유',
  cloudUnshare: '공유 중지',
  cloudVersions: '이전 버전',
  cloudRestore: '복원',
  cloudCopy: '새 문서로 올리기',
  cloudConnected: '문서 서버 연결됨',
  cloudDisconnected: '문서 서버 연결 안 됨',
  cloudBusy: '문서 서버 작업 중…',
  cloudFailed: '서버 작업에 실패했습니다. 기기의 초안은 보존됩니다.',
  cloudConflict: '서버에 다른 수정이 있습니다. 별도로 열거나 현재 초안을 새 문서로 올리세요.',
  cloudPending: '서버 전송 대기 중',
  cloudNotice:
    '공유한 문서만 외부 Codex가 읽고 수정할 수 있습니다. 연결키는 이번 실행 동안만 메모리에 보관합니다.',
} satisfies Record<keyof typeof zh, string>
