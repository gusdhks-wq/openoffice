# HWP/HWPX validation

검증 담당 전용 경로다. 모바일·Drive·ChatGPT 제품 코드나 엔진은 수정하지 않는다.
모바일 담당과의 합의·결과 공유는 [모바일 PR #1](https://github.com/gusdhks-wq/openoffice/pull/1)에서 한다.
명령 계약은 모바일 담당이 소유한다. 이 경로의 manifest는 시험 입력이며 제품 명령 API가 아니다.

## 환경

- 기준 커밋: `dabc1fc01c3c6fd16b90a13024982f4325b68d50`.
- Node.js 24.19.0에서 검증. 저장소의 `vendor/rhwp-core` 사용.
- `@rhwp/core` **0.8.7-ieum.4**, upstream **v0.8.7**, commit `1a76570e833917d15817415a53c09ad61ab3203f`.
- WASM SHA256: `9c948870df8f8a92decf259d56cd957763f1a24459e37449d25212b46fa923b5`.
  `run.mjs`는 버전과 manifest 해시를 검사한다. 엔진을 올리면 검토 후 기준을 갱신한다.
- UI 시험만: `@rhwp/editor` 0.8.7, 빌드된 Electron 앱, `playwright-core`, Linux에서 Xvfb 같은 화면 필요.
  이번 환경은 Electron 43.7.6, `DISPLAY=:99`. Node 엔진 시험에는 Electron/Android/네트워크가 필요 없다.
- 독립 검증 선택 도구: Python `olefile==0.47`, `pyhwp==0.1b15`, PyMuPDF.
  기존 가상 환경을 사용하고 프로젝트 의존성을 임의로 바꾸지 않는다.

## 실행

저장소 루트에서 실행한다. 아래 `/private`는 사용자가 소유한 **저장소 밖** 디렉터리로 바꾼다.

```sh
node tools/hwp-validation/run.mjs --synthetic --out /private/synthetic-results
```

실제 문서 없이 합성 문서의 HWP/HWPX 두 형식을 시험한다. 본문 교체, 기존 표 셀의 덮어쓰기 거부,
명시적 덮어쓰기, 저장·재열기, 없는 대상 거부를 검사한다. 합성 원본도 OS 임시 폴더에만 만든다.

비공개 시험 설정 `/private/cases.json` 예시:

```json
{
  "cases": [
    {
      "id": "case-a",
      "path": "document.hwp",
      "find": "시험할 기존 문장",
      "replace": "길이가 다른 새 시험 문장"
    }
  ]
}
```

`path`는 manifest 위치 기준이다. `id`는 비식별 영문·숫자·`_`·`-`만 사용한다.
`find`는 본문에서 정확히 한 번 나타나야 한다. 선택적 `tableEdit`는
`{"table":1,"row":2,"col":2,"text":"새 내용"}`이며 **기존 내용이 있는 칸**을 시험 대상으로 한다.
manifest와 문서는 저장소 밖에 둔다. 실문서 HWPX도 같은 방식으로 추가할 수 있다.

```sh
node tools/hwp-validation/run.mjs --manifest /private/cases.json --out /private/roundtrip-results
```

기본 출력은 본문·원본 경로를 제외한 `report.json`이다. `--artifacts`를 명시하면 수정 문서와
모든 페이지 SVG를 출력한다. **이 결과물은 비공개 문서 내용이므로 공개 업로드하지 않는다.**
원본은 덮어쓰지 않는다. 반환 코드: 0=필수 검사 통과, 1=사례 실패, 2=기본 설정 실패.
예상하지 못한 설정/manifest 오류도 비정상 종료한다. 경고가 있으면 0이어도 시각 검토 완료가 아니다.

### 실제 앱 저장·백업·PDF

먼저 저장소의 빌드 안내에 따라 앱을 빌드한다. 별도 준비된 빌드가 있으면 `--runtime-root`로 지정한다.
출력은 이전 실행이 없는 새 디렉터리여야 한다. 플랫폼에 따라 sandbox 비활성화가 허용되는 격리 시험 환경에서만 사용한다.

```sh
DISPLAY=:99 node tools/hwp-validation/ui.mjs \
  --manifest /private/cases.json --case case-a \
  --out /private/ui-results --runtime-root /built/checkout
```

이 스크립트는 원본 사본을 만들고 실제 앱 플러그인과 정규 저장·PDF IPC를 사용한다.
AI 응답/구독 프로그램/Google 로그인을 호출하지 않는다. React ref 접근은 시험용 구현 세부사항이므로
앱 변경 시 깨질 수 있다. UI 검사 성공은 Android UI나 사용자 계정 동기화 검증이 아니다.
PDF는 이 단계에서 서명만 확인한다. 독립 리더로 페이지·수정 문구·렌더를 추가 확인해야 한다.

### 독립 읽기·그림 검사

```sh
python tools/hwp-validation/inspect-assets.py /private/document.hwp /private/roundtrip-results/case-a/edited.hwp
hwp5txt /private/roundtrip-results/case-a/edited.hwp > /private/independent.txt
```

`inspect-assets.py`는 압축 해제한 HWP BinData의 해시 다중집합을 비교한다.
전체 파일/압축 바이트가 달라도 원 그림 데이터가 같은지 판정한다. HWPX 검사기는 아니며
그림 위치·크기·화면 동일성을 검사하지 않는다. `hwp5txt` 결과는 비공개로 유지하고 수정 문구와
나머지 본문을 대조한다. PDF는 PyMuPDF 등의 별도 도구로 열고 모든 쪽을 렌더한다.

## 성공·실패 기준

필수 검사 하나라도 false이거나 예외가 있으면 FAIL이다. 오류 메시지는 문서 내용을 포함할 수 있어
보고서에는 내부 오류 코드만 쓴다. PASS는 아래 자동 검사 범위에 한정한다.

| 단계        | 성공 기준                                             | 실패 시 처리                            |
| ----------- | ----------------------------------------------------- | --------------------------------------- |
| 엔진/입력   | 지정 버전·해시, 입력 형식 서명, 파싱 가능             | 시험 중단; 확장자만 바꾸지 않음         |
| 무편집 왕복 | 본문, 모든 표의 전체 셀·병합 span, 쪽수 동일          | 직렬화 문제로 분리; 편집 성공 주장 금지 |
| 본문 수정   | 대상 1개, 요청한 텍스트 교체만 발생                   | 모호한 대상/범위 오류로 거절            |
| 표 수정     | overwrite=false 거부 및 무변경; true에서 정확한 셀 값 | 표 명령 오류로 기록                     |
| 저장·재열기 | 같은 형식 서명, 편집 직후 본문·전체 표·쪽수 일치      | 결과 사용 중지                          |
| 전체 렌더   | 모든 페이지 SVG 생성                                  | 렌더 오류로 FAIL; 시각 동일성은 별도    |
| 실패 경로   | 없는 대상 거부, 본문·표·쪽수 무변경                   | 명령 원자성 문제로 기록                 |
| 원본 보존   | 원본 해시 동일, UI 백업이 원본과 동일                 | 결과 사용 중지                          |
| 독립 확인   | 다른 HWP 리더의 본문, 그림 해시, PDF 텍스트·렌더 확인 | 호환성 제한으로 기록                    |

글꼴·글자 크기·문단 속성·표 테두리 등 **전체 서식 속성은 아직 자동 판정하지 않는다**.
사설 문자 검출은 글꼴 검토 경고이며 그 자체가 누락 증명은 아니다. 편집으로 쪽수가 바뀌면
시각 검토 경고를 낸다. 같은 엔진의 쪽수 보존은 한컴 쪽수 일치 증명이 아니다.
한컴 재열기, Android의 열기/수정/저장, 실제 ChatGPT 명령과 Drive 충돌 복구는 별도 수용 시험이다.

## 공개 저장소에 넣는 것

이 폴더의 코드·설명·비식별 결과 요약만 커밋한다. 원본, 실제 문구가 들어간 manifest,
추출 본문, 그림, SVG, 스크린샷, HWP/HWPX/PDF, Electron profile은 커밋하지 않는다.
제품 코드나 공통 명령 계약 변경은 별도 협의한다. `REPORT.md`에 확인 결과와 미해결 항목을 기록한다.

## 레이아웃 비교 추가

`unchangedResolvedLayout`과 `reopenedResolvedLayout`은 모든 페이지의 `getPageTextLayout` 및
`getPageControlLayout` 결과를 비교한다. 텍스트·글꼴 이름·굵게 등의 엔진이 반환하는 표시 속성,
표/셀/개체의 속성과 좌표를 검사한다. 좌표·크기·글자 advance의 허용 오차는 **0.5 CSS px**이며,
행/열 번호와 병합 span 등은 정확히 같아야 한다. 직렬화 시 재번호가 가능한 `charShapeId`와
`paraShapeId`만 제외한다. 저장 전후 비교이며 한컴 출력과의 비교는 아니다.

엔진이 이 API로 반환하지 않는 속성(모든 테두리/문단 스타일 등)은 검사하지 못한다.
요청 편집으로 발생한 배치 변화와 저장 과정의 변화도 구분한다. 좌표 판정기의 실패 검사는 다음과 같다.

```sh
node --test tools/hwp-validation/layout.test.mjs
```

## 모바일 어댑터 계약 검증

모바일 PR #1의 `d5024560505a088b4f651a2d287f052b73374900`을 별도로 검토했다.
`verify-mobile-adapter.mjs`는 해당 커밋의 실제 `engine.ts`, `workspace.ts` 함수를
Node에서 실행한다. 어댑터를 새로 구현한 모형 시험이 아니다. 단, 브라우저/IndexedDB/Android 시험도 아니다.

해당 커밋의 `apps/mobile/src/renderer/hwp/engine.ts`와 `workspace.ts` 원문을 읽어
저장소 밖 JSON에 `{"engine":"...원문...","workspace":"...원문..."}` 형태로 넣는다.
원본 코드는 이 검증 브랜치에 복사해 커밋하지 않는다. 원문 SHA256을 검사하므로 모바일 담당이
코드를 바꾸면 먼저 검토하고 기준 해시와 커밋을 갱신해야 한다.

```sh
node tools/hwp-validation/verify-mobile-adapter.mjs \
  --source /private/mobile-source.json --out /private/mobile-report \
  --runtime-root /built/checkout
```

런타임에 `typescript`가 필요하다. 함수 코드를 transpile하고 Node용 import 위치만 바꿔 실행한다.
검사 항목은 양 형식의 본문/표 교체 재생, journal 기반 undo, 원본 불변/독립 사본,
결정적 재생, 중복 operation ID 거부, 오래된 대상 거부, 실패 후 이전 작업 읽기,
줄바꿈/빈 대상/모호한 대상 거부다. 미래 원격 명령의 base revision/hash·작업 영수증이나
브라우저 동시 탭 저장 충돌은 이 스크립트의 검사 범위가 아니다.

## 수정본 저장 전 보존 재현

`preservation.mts`는 합성 문서에서 생 엔진 export의 바탕쪽 누락과 새 탭 폭 누락을 재현하고,
**수정하지 않은 기존 PC 보존 함수**를 적용해 재검증한다. 새 바이트 보정이나 모바일 저장 구현은 추가하지 않는다.

```sh
node --import tsx tools/hwp-validation/preservation.mts \
  --out /private/preservation --runtime-root /built/checkout
```

`tsx`와 `cfb`가 설치된 기존 작업 환경을 사용한다. 별도 checkout에서 실행하면 `--import`에
해당 환경의 `node_modules/tsx/dist/loader.mjs` 절대 경로를 지정할 수 있다. tsx CLI의 IPC가
제한된 샌드박스에서는 위 Node loader 경로를 사용한다.

`reproductionAndExistingHelper: PASS`는 **손실을 재현했고 기존 보존 처리가 통과했다**는 뜻이다.
`rawExportSafe: false`를 모바일 저장 허용으로 바꾸어 해석하지 않는다.
시험은 HWP 바탕쪽 1개가 편집 후 0개가 되고 보존 후 1개로 복구되는지,
HWP/HWPX의 새 탭에 폭을 쓴 뒤 텍스트와 지정 폭을 엔진에서 다시 읽는지 확인한다.
폭 6000 HWPUNIT는 합성 시험값이다. 제품에서는 기존 `measureTabs` 경로의 실제 화면 측정값이 필요하다.
메모·필드·캡션·암호·변경 추적은 이 작은 재현기의 검사 범위가 아니며 기존 PC 시험과 별도로 연결해야 한다.
