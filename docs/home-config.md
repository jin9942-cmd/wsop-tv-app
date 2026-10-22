# 원격 홈 구성 (home-config.json)

홈 화면의 **섹션 순서와 노출**을 앱 재배포 없이 바꾸기 위한 JSON입니다. 섹션은 배포된 웹 데모 v2(https://tv-service-keig.vercel.app/v2/) 홈과 같습니다.

- 앱은 **시작할 때**와 **홈에서 당겨서 새로고침할 때** `process.env.EXPO_PUBLIC_HOME_CONFIG_URL`을 읽습니다. 웹 미리보기에는 당겨서 새로고침이 없어서 홈 헤더의 ↻ 버튼으로 대신합니다.
- 읽기에 실패하면(주소 없음, 네트워크 오류, 6초 시간 초과, HTTP 오류, JSON 형식 오류) **앱에 내장된 기본값**(`src/data/home.ts`의 `DEFAULT_HOME_CONFIG`)을 씁니다. 앱을 쓰는 중에 새로고침만 실패하면 그 세션에서 마지막으로 받은 원격 구성을 유지합니다.
- 현재 상태는 **데모 설정 > Home config**에서 봅니다: 출처(remote / built-in default), 버전, 받은 시각, 마지막 오류, 다시 불러오기.
- 시즌/비시즌 중 어느 레이아웃을 쓸지는 **데모 설정 > Operating mode**가 정합니다. JSON의 `mode`는 운영자 권장값 기록용입니다.

예시 파일: [`demo/home-config.json`](../demo/home-config.json) · 처음 받은 초안(`C:\dev\wsop-tv\home-config.json`)은 그대로 두었습니다.

## 스키마

```jsonc
{
  "version": 3,                        // number. 데모 설정에 표시
  "updatedAt": "2026-10-22T00:00:00Z", // string, 선택
  "mode": "season",                    // "season" | "offseason" (기록용)
  "layouts": {
    "season":    [ /* Section, 위에서부터 홈 순서 */ ],
    "offseason": [ /* Section */ ]
  }
}
```

### Section

| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `type` | string | ✓ | 아래 섹션 타입 중 하나. **모르는 타입은 무시**합니다 |
| `visible` | boolean | | 기본 `true` |
| `title` | string | | 섹션 제목을 덮어씀 |
| `audience` | string[] | | 이 시청자에게만 보임: `guest`(비로그인), `signedIn`(로그인 전체), `wsopFree`, `basic`, `premium`. 생략하면 모두 |

- 호환용 별칭: `member` → `signedIn`, `free` → `wsopFree`, `subscriber` → `basic`, `premium`
- 한 레이아웃에 유효한 섹션이 하나도 없으면 그 레이아웃만 기본값을 씁니다. 같은 타입을 여러 번 넣어도 됩니다.
- `continueWatching`, `myList`, `followedPlayers`는 웹 데모처럼 **로그인했고 내용이 있을 때만** 보입니다(`audience`와 별개).

### 섹션 타입 (웹 데모 v2 홈)

| `type` | 웹 데모 v2 | 기본 제목 | 내용 |
| --- | --- | --- | --- |
| `billboard` | Billboard | — | 대표 방송(Main Event Final Table) 실사 영상 배경, 상태 배지, Watch live / Key hands, 그 아래 **On air now** (방송 중인 테이블 피드) |
| `channels` | ChannelsRow | On the channels now | 24/7 채널 4개의 지금 방송 |
| `continueWatching` | Continue Watching | Continue Watching | 이어보기 (95% 이상 시청 제외, ⋯ 메뉴로 제거 + Undo) |
| `myList` | My List | My List | 저장한 항목 최근 4개 |
| `comingUp` | Coming up | Coming up | 이벤트별 다음 방송일 카드 (라스베이거스 시각 + 내 시각) |
| `freeHighlights` | Free highlights | Free highlights | 계정 없이 볼 수 있는 핸드 |
| `followedPlayers` | From players you follow | From players you follow | 팔로우한 선수의 핸드 |
| `featuredPlayers` | Featured players | Featured players | POY 상위 10명 |
| `archive` | Relive the finals | Relive the finals | 아카이브 클래식 6편 |

## 첫 초안(home-config.json)과 달라진 점

웹 데모 v2 홈에 맞추면서 섹션 이름이 바뀌었습니다. 초안의 `mainBanner`, `liveNow`, `todaySchedule`, `tournaments`, `stripBanner`, `curatedVod`, `popularVod`, `shorts`, `players`, `notice`는 **v2 홈에 없는 섹션**이라(pitch 데모 기준) 앱이 무시합니다. 대응 관계는 아래와 같습니다.

| 초안 | 지금 |
| --- | --- |
| `mainBanner` + `liveNow` | `billboard` (대표 방송 + On air now) |
| `todaySchedule`, `tournaments` | `comingUp` |
| `curatedVod`, `popularVod` | `archive`, `freeHighlights` |
| `continueWatching` | `continueWatching` |
| `players` | `featuredPlayers` |
| `stripBanner`, `notice`, `shorts` | 없음 (v2 홈에 없음) |
| — | `channels`, `myList`, `followedPlayers` 추가 |
| `audience`: `member`, `subscriber` | `guest` / `signedIn` / `wsopFree` / `basic` / `premium` (예전 값은 별칭으로 읽음) |

## 호스팅

- `eas.json`과 `.env`의 주소: `https://tv-service-keig.vercel.app/demo/home-config.json`
- 지금 이 주소에는 **파일이 없어** 웹 데모로 리다이렉트(307)되므로 앱은 내장 기본값으로 동작합니다. 올리려면 tv-service 저장소에서:
  1. `wsop-tv/public/demo/home-config.json`에 이 파일 복사
  2. `vercel.json`: 모든 경로를 `/v2/`로 보내는 리다이렉트에서 `/demo/`는 빼고, `C:\dev\wsop-tv\web-demo-vercel-headers.json`의 CORS 헤더(`Access-Control-Allow-Origin: *`, `Cache-Control: no-store`)를 추가
- 웹 미리보기는 CORS 허용이 필요합니다. 네이티브 앱은 CORS 영향이 없습니다.

## 로컬에서 시험하기

```bash
node scripts/serve-home-config.js
```

- `demo/home-config.json`을 `http://localhost:8090/home-config.json`으로 서빙합니다(CORS 허용, 캐시 없음). `.env.local`(git 제외)이 이 주소를 가리킵니다.
- Android 에뮬레이터는 `http://10.0.2.2:8090/home-config.json`, 같은 Wi-Fi 실기기는 `http://<PC IP>:8090/home-config.json`.
- 파일을 고친 뒤 홈을 당겨서 새로고침(웹은 ↻)하면 순서가 바로 바뀝니다.
