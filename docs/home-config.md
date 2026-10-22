# 원격 홈 구성 (home-config.json)

홈 화면의 **섹션 순서와 노출**을 앱 재배포 없이 바꾸기 위한 JSON입니다. 웹 데모(pitch)의 CMS "메인 화면 관리"가 하던 역할을 이 파일 하나로 대신합니다.

- 앱은 **시작할 때**와 **홈에서 당겨서 새로고침할 때** `process.env.EXPO_PUBLIC_HOME_CONFIG_URL`을 읽습니다. 웹 미리보기에는 당겨서 새로고침이 없어서 홈 헤더의 ↻ 버튼으로 대신합니다.
- 읽기에 실패하면(주소 없음, 네트워크 오류, 6초 시간 초과, HTTP 오류, JSON 형식 오류) **앱에 내장된 기본값**(`src/data/home.ts`의 `DEFAULT_HOME_CONFIG`)을 씁니다. 앱을 쓰는 중에 새로고침만 실패하면, 그 세션에서 마지막으로 받은 원격 구성을 그대로 유지합니다.
- 현재 어떤 구성을 쓰는지는 **데모 설정 > Home config**에서 볼 수 있습니다. 출처(remote / built-in default), 버전, 받은 시각, 마지막 오류가 표시되고, 다시 불러오기 버튼도 있습니다.
- 시즌/비시즌 중 어느 레이아웃을 보여줄지는 **데모 설정 > Operating mode**가 정합니다. JSON의 `mode`는 운영자가 권장하는 값을 기록해 두는 용도이고, 화면 전환에는 쓰지 않습니다.

예시 파일: [`demo/home-config.json`](../demo/home-config.json)
처음 받은 초안(`C:\dev\wsop-tv\home-config.json`)은 그대로 두었습니다. 초안과 달라진 점은 맨 아래 표에 정리했습니다.

## 스키마

```jsonc
{
  "version": 2,                       // number. 데모 설정에 표시
  "updatedAt": "2026-10-21T00:00:00Z", // string, 선택
  "mode": "season",                   // "season" | "offseason" (운영자 권장값, 기록용)
  "layouts": {
    "season":    [ /* Section, 위에서부터 홈 순서 */ ],
    "offseason": [ /* Section */ ]
  }
}
```

### Section

| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `type` | string | ✓ | 아래 섹션 타입 중 하나. **모르는 타입은 무시**합니다(앱 버전이 달라도 안전) |
| `visible` | boolean | | 기본값 `true`. `false`면 숨김 |
| `title` | string | | 섹션 제목을 덮어씀 |
| `audience` | string[] | | 이 회원 상태에게만 보임: `guest`, `free`, `basic`, `premium`. 생략하면 모두에게 보임 |
| `curationId` | string | | `curatedVod` 전용. `cu-1` Main Event Replay · `cu-2` This Week’s Highlights · `cu-3` Relive Las Vegas 2026. 생략하면 `title`이 같은 큐레이션, 그것도 없으면 첫 번째 큐레이션 |
| `emptyMode` | `"countdown"` \| `"hide"` | | `liveNow` 전용. 라이브가 0건일 때 다음 라이브 카운트다운을 보여줄지, 섹션을 숨길지 |
| `showViewers` | boolean | | `liveNow` 전용. 카드에 동시 시청자 수 표시 여부 (기본 `true`) |

- `audience`에는 호환용 별칭도 받습니다: `member` → `free`, `subscriber` → `basic`, `premium`, `signedIn` → `free`, `basic`, `premium`
- 한 레이아웃 안에 유효한 섹션이 하나도 없으면 그 레이아웃만 기본값을 씁니다.
- 같은 타입을 여러 번 넣을 수 있습니다(예: `curatedVod` 두 개).

### 섹션 타입 (웹 데모 홈 섹션과 대응)

| `type` | 웹 데모 | 기본 제목 | 내용 |
| --- | --- | --- | --- |
| `mainBanner` | banner | — | 메인 배너 캐러셀 (5초 롤링, 배너별 대상 등급) |
| `liveNow` | liveNow | LIVE NOW | 지금 방송 중인 카드, 권한 없는 등급은 잠금. 0건이면 `emptyMode` 처리 |
| `todaySchedule` | todaySchedule | Schedule | 오늘 / 내일 / 모레 편성, 알림 신청 |
| `exclusive` | exclusive | Only on WSOP TV | 브레이슬릿 파이널 테이블: 라이브 → 예정 → 다시보기 |
| `tournaments` | tournaments | Tournaments | 진행 중 → 예정 시리즈 |
| `stripBanner` | strip | — | 회원 등급별 띠배너 1개 |
| `curatedVod` | curation | 큐레이션 제목 | 큐레이션 VOD 한 줄 |
| `popularVod` | popular | Top 10 This Week | 조회수 TOP 10 (Shorts 제외) |
| `continueWatching` | continue | Continue Watching | 로그인 회원만, 90% 이상 시청한 영상 제외, Edit로 삭제 |
| `players` | players | Players | 추천 선수 |
| `notice` | notice | — | 회원 등급에 맞는 최신 공지 1건 (고정 공지 우선) |
| `plans` | plans | Plans | 플랜 비교 (선택 섹션, 기본 숨김) |

## 초안(home-config.json)과 달라진 점

| 항목 | 초안 | 지금 | 이유 |
| --- | --- | --- | --- |
| `shorts` | 있음 | 없음 (넣어도 무시) | 웹 데모 홈에 Shorts 섹션이 없음(원칙 1). Shorts는 VOD 탭의 타입 필터로 볼 수 있음 |
| `exclusive` | 없음 | 추가 | 웹 데모 홈의 "Only on WSOP TV" 섹션 |
| `plans` | 없음 | 추가 (`visible: false`) | 웹 데모의 선택 섹션 |
| `audience` 값 | `member`, `subscriber` | `guest` / `free` / `basic` / `premium` | 앱 회원 상태와 1:1. 예전 값도 별칭으로 계속 읽음 |
| `curatedVod` | `title`만 있음 | `curationId` 추가 | 같은 제목의 큐레이션이 바뀌어도 고정해서 가리키도록 |
| `liveNow` | 옵션 없음 | `emptyMode`, `showViewers` | 웹 데모 CMS의 LIVE NOW 설정(0건 처리, 시청자 수) |
| `version` | 1 | 2 | 스키마 변경 표시 |

## 호스팅

- `eas.json`과 `.env`의 주소: `https://tv-service-keig.vercel.app/demo/home-config.json`
- 지금 이 주소는 **아직 파일이 없어서** 웹 데모 v2로 리다이렉트(307)됩니다. 그래서 앱은 내장 기본값으로 동작합니다. 올리려면 tv-service 저장소에서 다음 두 가지를 해야 합니다.
  1. `wsop-tv/public/demo/home-config.json`에 이 파일 복사
  2. `vercel.json`: 모든 경로를 `/v2/`로 보내는 리다이렉트에서 `/demo/`는 빼고, `C:\dev\wsop-tv\web-demo-vercel-headers.json`의 CORS 헤더(`Access-Control-Allow-Origin: *`, `Cache-Control: no-store`)를 추가
- 웹 미리보기에서 원격 파일을 읽으려면 CORS 허용이 필요합니다. 네이티브 앱은 CORS 영향이 없습니다.

## 로컬에서 시험하기

```bash
node scripts/serve-home-config.js
```

- `demo/home-config.json`을 `http://localhost:8090/home-config.json`으로 서빙합니다(CORS 허용, 캐시 없음).
- `.env.local`에 `EXPO_PUBLIC_HOME_CONFIG_URL=http://localhost:8090/home-config.json`이 들어 있습니다. git에는 올라가지 않는 파일입니다.
- Android 에뮬레이터에서는 `http://10.0.2.2:8090/home-config.json`, 같은 Wi-Fi의 실기기에서는 `http://<PC IP>:8090/home-config.json`으로 바꿔서 씁니다.
- 파일을 고친 뒤 홈을 당겨서 새로고침하면(웹은 ↻) 순서가 바로 바뀝니다.
