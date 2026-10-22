# 웹 데모 → 앱 매핑 (web-demo-map)

앱 데모(Expo)로 옮기기 전에 웹 데모를 분석한 결과입니다. **개발은 이 문서를 확인받은 뒤 시작합니다.**

---

## 0. 먼저 확인할 것 (결정 필요)

### 0-1. "웹 데모 v2"의 소스가 두 개입니다

`C:\dev\wsop-tv\tv-service` 안에 데모가 세 개 있고, 요청서에 적힌 내용은 그중 두 개에 나뉘어 있습니다.

| 소스 | 배포 | 성격 | 요청서 항목 중 이 소스에만 있는 것 |
| --- | --- | --- | --- |
| `wsop-tv-v2` | https://tv-service-keig.vercel.app/v2/ (요청서 URL) | 반응형 **웹사이트** (PC 헤더 메뉴 + 모바일 하단 탭). TV Preview 포함 | **Live > Channels 탭**(24/7 리니어 채널, 편성 구간별 권한), GGPass + **WSOP+** 회원 모델과 문구, 하단 탭 구성 |
| `wsop-tv-pitch` | GitHub Pages `/pitch/` | 휴대폰 프레임 안의 **앱 화면** + 오른쪽 **데모 설정** + **CMS** | 시즌/비시즌, 라이브 0건, 표시 시간대 데모 설정, 홈 섹션 구성(메인 배너·띠배너·공지 등, `home-config.json`과 같은 구조), **10초 미리보기 → 구독 시트**, 편성표·VOD·대회·My 등 앱 화면 목록, "CMS는 제외" |
| `wsop-tv` | GitHub Pages 루트 | v1 시청자 데모 | (해당 없음) |

요청서의 "앱 화면 1:1", "웹 데모 설정 패널(회원 상태, 시즌/비시즌, 라이브 0건, 표시 시간대)", "CMS 화면 제외", 홈 섹션 스키마는 모두 **pitch**와 일치하고, `wsop-tv-v2`에는 없습니다. 반대로 "Live 메뉴: 대회 라이브 + 리니어 채널 탭"과 "WSOP+ 구독"은 **v2**에만 있습니다.

**제안 (A안):** 앱 화면, 데모 설정, 홈 섹션, 목업 데이터, 접근 흐름은 **pitch**를 기준으로 하고, **v2**에서는 Live > Channels 탭, 회원·구독 명칭(GGPass / WSOP+ Free·Basic·Premium), 하단 탭 구성, 디자인 토큰을 가져옵니다. 이 문서의 2장부터는 A안을 전제로 썼습니다.

- B안: v2만 기준으로 합니다. 이 경우 시즌/비시즌, 홈 섹션 원격 구성, 10초 미리보기는 v2에 없으니 "앱 전용 추가"로 새로 만들어야 합니다.
- C안: pitch만 기준으로 합니다. 이 경우 Live > Channels 탭과 WSOP+ 명칭은 빠집니다.

### 0-2. 번들 ID

요청서에 `[번들 ID]`가 자리표시자로 남아 있어서 `app.json`은 아직 바꾸지 않았습니다(`com.yourcompany.wsoptvdemo` 그대로). iOS는 하지 않으므로 실제 값을 알려주시면 `android.package`만 바꿉니다. `ios` 블록은 원칙 4에 따라 그대로 둡니다(빌드하지 않으면 영향 없음).

### 0-2a. 대상 플랫폼: Android + 웹 미리보기 (iOS 제외)

- 네이티브 빌드와 검증은 **Android만** 합니다. EAS 명령은 모두 `--platform android`로 안내하고, TestFlight(`npx testflight`)와 iOS 제출은 README에서 뺍니다.
- 웹 미리보기(`npx expo export -p web`)는 요청서 완료 기준이라 유지합니다.
- iOS 전용 처리는 넣지 않습니다. 예를 들어 iOS 알림 권한 옵션, iOS PiP 설정, SF Symbols는 쓰지 않습니다. 아이콘은 `expo-symbols`의 Material Symbols(Android·웹 지원)를 씁니다.
- PiP는 Android PiP(`supportsPictureInPicture`, 이미 app.json에 있음)만 확인합니다. 로컬 알림은 Android 알림 채널을 하나 만들어서 보냅니다.
- 아이콘/스플래시는 Android adaptive 전경, 스플래시, 웹 파비콘을 만듭니다. `icon.png`(1024)는 app.json이 참조하므로 그대로 만듭니다.

### 0-3. 하단 탭

| 소스 | 하단 탭 |
| --- | --- |
| v2 (모바일 하단 메뉴) | Home · Live · Schedule · Hands · More |
| pitch (앱) | Home · Schedule · VOD · Tournaments · My |

**제안:** **Home · Live · Schedule · VOD · My**(5개). 요청서에서 화면 목록에 Live(대회/채널 탭)와 My가 둘 다 있어서, v2의 Live 탭을 넣고 pitch의 Tournaments 탭을 뺐습니다. 대회 목록/상세는 홈 "Tournaments" 섹션, 검색, VOD 필터에서 들어갑니다. v2의 Hands는 pitch의 VOD(Hand/Clip 타입 포함)로 합칩니다. v2의 More는 앱에서는 My로 바꿉니다.

---

## 1. 소스 파일 위치

| 영역 | pitch | v2 |
| --- | --- | --- |
| 앱 셸 / 탭 / 시트 | `src/app/AppPhone.tsx` | `src/components/Layout.tsx` |
| 화면 | `src/app/screens/*.tsx`, `src/app/MyList.tsx`, `src/app/Launch.tsx` | `src/pages/*.tsx`, `src/features/**` |
| 플레이어 | `src/app/Player.tsx` | `src/features/player/*` |
| 목업 데이터 | `src/data/mock.ts`, `plans.ts`, `types.ts` | `src/data/mock.ts`, `channels.ts`, `policy.ts` |
| 상태 / 권한 | `src/state/store.ts`, `selectors.ts` | `src/state/app.tsx` |
| 데모 설정 | `src/demo/DemoPanel.tsx` | `src/features/demo/DemoControls.tsx` |
| 토큰 | `src/styles/app.css` (`.app` 변수) | `src/styles/theme.css` |
| CMS (앱 제외) | `src/cms/*` | 없음 |

---

## 2. 화면 목록 → 앱 라우트 (A안)

라우트는 Expo Router(`src/app`) 기준입니다. 딥링크는 `wsoptvdemo://<경로>`입니다.

| # | 화면 | 웹 소스 | 앱 라우트 | 주요 내용 |
| --- | --- | --- | --- | --- |
| 1 | 홈 | pitch `Home.tsx` | `(tabs)/index` | 워드마크 헤더(길게 누르면 데모 설정), 검색 아이콘, 섹션은 원격/기본 구성 순서대로(4장), 당겨서 새로고침 |
| 2 | Live · Tournaments 탭 | v2 `Live.tsx` 레이아웃 + pitch 데이터 | `(tabs)/live/index` | 지금 방송 중인 편성(라이브 카드, 시청자 수, 잠금), 0건이면 다음 방송 카운트다운 |
| 3 | Live · Channels 탭 | v2 `Channels.tsx` | `(tabs)/live/channels` | 채널 4개 스트립(지금 방송), 채널별 Now/Next, Next on 목록 + Remind me, 편성 구간별 권한(3-3) |
| 4 | 라이브 플레이어 | pitch `LivePlayer.tsx` + `Player.tsx` | `live/[id]` | 16:9 플레이어, LIVE 배지, 시청자 수, Switch broadcast(언어/채널), Up next, Remind me, 권한별 게이트(3-2), 종료 시 Replay available |
| 5 | 채널 플레이어 | v2 `Channels.tsx` | `channel/[id]` | 현재 프로그램 재생, 되감기 없음, 잠긴 구간이면 볼 수 있는 다른 채널 제안 |
| 6 | 편성표 | pitch `ScheduleTab.tsx` | `(tabs)/schedule` | Yesterday/Today/Tomorrow… 날짜 칩, 대회·채널·언어 필터, 행: 시간(표시 시간대)·상태·채널·언어·Changed·알림, 빈 상태 |
| 7 | VOD 목록 | pitch `Vod.tsx` (`VodTab`) | `(tabs)/vod` | 타입 칩(Full Replay / Highlight / Clip / Hand / Interview / Shorts), 대회 필터, Latest / Most popular 정렬, 빈 상태 |
| 8 | VOD 상세 | pitch `Vod.tsx` (`VodDetail`) | `vod/[id]` | 플레이어, 등급 배지, 설명, Key moments, Players, Watchlist 저장, 관련 영상 |
| 9 | 대회 목록 | pitch `Tournaments.tsx` (`TournamentsTab`) | `tournaments/index` | On now / Upcoming / Completed |
| 10 | 대회 상세 | pitch `Tournaments.tsx` (`SeriesDetail`) | `tournaments/[id]` | ON NOW, Events, Broadcast schedule, Videos |
| 11 | 선수 상세 | pitch `PlayerDetail.tsx` | `player/[id]` | Fictional demo player 표시, Bracelets / Rings / Earnings, Videos |
| 12 | 검색 | pitch `Search.tsx` | `search` | Recent / Popular searches, 결과(라이브·VOD·Players·Tournaments) |
| 13 | WSOP+ 구독 안내 (페이월) | pitch `Paywall.tsx` + v2 `Plans.tsx` 문구 | `paywall` (모달) | 플랜 비교표(Example policy · not final), Subscribe 버튼만 — 결제 폼 없음 |
| 14 | My | pitch `My.tsx` | `(tabs)/my` | 게스트 안내 / 프로필, Subscription, Continue Watching(Edit 삭제), Watchlist, Inbox, Notices, 설정, **Demo Settings**(앱 전용), 로그아웃 |
| 15 | Watchlist | pitch `MyList.tsx` | `my/watchlist` | 유형 필터(Videos / Live / Players / Events), 삭제, 빈 상태 |
| 16 | 알림함 | pitch `My.tsx` (`Inbox`) | `my/inbox` | 알림 신청 / 수신 목록 |
| 17 | 공지 목록/상세 | pitch `Notices.tsx` | `notices/index`, `notices/[id]` | 고정 공지 우선, 등급 공지, 링크·첨부 |
| — | GGPass 로그인 유도 시트 | pitch `AppPhone` BottomSheet + v2 `LoginModal` | 시트 컴포넌트 | "Continue with GGPass" 한 버튼, Not now. 입력 폼 없음 |
| — | 구독 안내 시트 | pitch BottomSheet(paywall) | 시트 컴포넌트 | Preview ended → Subscribe to WSOP+ (Basic / Premium), Compare plans |
| — | 데모 설정 시트 | pitch `DemoPanel.tsx` | `demo-settings` (모달) | 5장 |

**옮기지 않는 것:** pitch CMS 전체(`src/cms`), pitch 시연 시나리오 패널과 "기획 포인트 보기" 말풍선, pitch 실행 팝업 레이어(`Launch.tsx`: 강제 업데이트/점검/팝업 — 데모 설정 항목에 없음), v2 TV Preview / 플랫폼 셸, v2 GGPASS 외부 도메인 모의 화면(`/auth/ggpass`), v2 Devices, v2 PC 전용 레이아웃(멀티뷰, 오버레이 Pro, 사이드 패널 칩 카운트), v2 Account의 상세 설정. 데모 설정에 없는 pitch 항목(재생 환경, Widevine L3, 구독 만료)도 요청서 범위 밖이라 뺍니다. 넣기를 원하시면 알려주세요.

---

## 3. 회원 상태와 시청 권한

### 3-1. 회원 상태

| 앱 상태 키 | 표시 | pitch | v2 |
| --- | --- | --- | --- |
| `guest` | Not signed in | `guest` | `guest` |
| `free` | GGPass · WSOP+ Free | `free` | `free` (WSOP+ Free, GGPass 가입 시 자동) |
| `basic` | WSOP+ Basic | `basic` | `basic` |
| `premium` | WSOP+ Premium | `premium` | `premium` |

v2의 나머지 상태(unlinked / restricted / deviceLimit / expired / grace)는 데모 설정 범위 밖이라 뺍니다.

### 3-2. 콘텐츠 권한 (pitch `accessFor` 규칙, 이름은 v2)

콘텐츠마다 `tier`가 `free | basic | premium` 중 하나입니다. 순위는 `guest(0) < free(1) < basic(2) < premium(3)`입니다.

| 회원 \ 콘텐츠 | Free | Basic | Premium |
| --- | --- | --- | --- |
| Not signed in | **로그인 유도 시트** | 로그인 유도 시트 | 로그인 유도 시트 |
| WSOP+ Free | 재생 | **10초 미리보기 → 구독 안내 시트** | 10초 미리보기 → 구독 안내 시트 |
| WSOP+ Basic | 재생 | 재생 | 10초 미리보기 → 구독 안내 시트 |
| WSOP+ Premium | 재생 | 재생 | 재생 |

- 게스트는 홈·편성표·VOD·대회·선수 목록을 모두 볼 수 있고, **재생 / 알림 신청 / Watchlist 담기**를 할 때 로그인 유도 시트가 뜹니다(pitch AUTH-04).
- 로그인 시트의 "Continue with GGPass" → `free`로 바뀌고 원래 하려던 동작을 이어서 합니다(`then` 콜백).
- 구독 시트의 "Subscribe to WSOP+ Basic/Premium" → 해당 등급으로 바뀌고 플레이어가 그대로 재생됩니다. 가벼운 햅틱과 토스트 "Subscribed to … (demo) — enjoy the stream".
- 잠긴 카드에는 자물쇠 + 등급 배지(Free / Basic / Premium)를 표시합니다.

### 3-3. 리니어 채널 편성 구간별 권한 (v2 `channels.ts` 정책)

| 프로그램 종류 | 권한 |
| --- | --- |
| Studio, Highlights, Classic | **무료** (게스트도 시청) |
| Live, Replay | 그 프로그램이 송출하는 방송의 `tier`를 그대로 따름 (3-2 표 적용) |

- 권한은 **프로그램이 방송되는 시점**에 판단합니다. 같은 채널이라도 하이라이트 구간은 열리고 라이브 구간은 잠깁니다.
- 잠긴 구간에서는 "지금 볼 수 있는 채널"을 제안합니다(WSOP Classics는 24시간 무료).
- 되감기는 없습니다. 일시정지 후 재생하면 채널의 현재 시점으로 돌아갑니다.
- Remind me는 편성 알림 목록에 같이 저장합니다.

채널 구성(v2 이름, pitch 데이터에 맞춤):

| 채널 | 라이브 송출 (pitch 편성) | 나머지 시간 |
| --- | --- | --- |
| WSOP TV 1 | CH-01 Feature EN 편성 | 스튜디오, 리플레이, 하이라이트 |
| WSOP TV 2 | CH-03 Final Table 편성 | 리플레이, 하이라이트 |
| WSOP Español | CH-02 Feature ES 편성 | 스페인어 스튜디오, 리플레이 |
| WSOP Classics | 없음 (무료 24/7) | Classic, Highlights |

pitch의 CH-04(Studio / Highlights) 편성은 WSOP TV 1의 Studio/Highlights 구간으로 들어갑니다.

---

## 4. 홈 섹션 (원격 구성 대상)

pitch `defaultSeasonLayout` / `defaultOffSeasonLayout`과 `home-config.json` 예시의 대응입니다. `type` 이름은 `home-config.json`을 따릅니다.

| `type` (home-config) | pitch 섹션 id | 웹 데모 제목 | 내용 |
| --- | --- | --- | --- |
| `mainBanner` | `banner` | (캐러셀) | 배너 4개, `audiences`로 등급별 노출 |
| `liveNow` | `liveNow` | LIVE NOW (n) | 라이브 카드, 시청자 수, 잠금. 0건이면 `emptyMode: countdown`(다음 라이브 카운트다운) / `hide` |
| `todaySchedule` | `todaySchedule` | Schedule | 오늘/내일/모레 편성, 상태·채널·언어·Changed, 알림 |
| `exclusive` | `exclusive` | Only on WSOP TV | 파이널 테이블 편성 (**home-config 예시에는 없음 → 추가 제안**) |
| `tournaments` | `tournaments` | Tournaments | 진행 중 > 예정, 최대 10개 |
| `stripBanner` | `strip` | (띠배너) | 등급별 문구 1개 |
| `curatedVod` | `curation` | Main Event Replay 등 | `title`과 큐레이션 id로 여러 개 가능 |
| `popularVod` | `popular` | Top 10 This Week | 조회수 TOP 10, Shorts 제외 |
| `continueWatching` | `continue` | Continue Watching | 로그인 회원만, 90% 이상 시청 제외, Edit 삭제 |
| `shorts` | (없음) | — | **pitch 홈에는 Shorts 섹션이 없습니다.** VOD 데이터에 Shorts 6개는 있습니다. 원칙 1에 따라 빼거나, 넣을지 결정이 필요합니다 |
| `players` | `players` | Players | 추천 선수 |
| `notice` | `notice` | (공지 1건) | 등급에 맞는 최신 공지 1건(고정 우선) |
| — | `plans` | Plans | 기본 숨김 선택 섹션 |

- 시즌: `mainBanner → liveNow → todaySchedule → exclusive → tournaments → stripBanner → curatedVod → popularVod → continueWatching → players → notice`
- 비시즌: `mainBanner → exclusive → curatedVod → popularVod → continueWatching → todaySchedule → tournaments → stripBanner → players → notice` (liveNow 숨김)
- `audience` 값은 앱 회원 상태 키(`guest | free | basic | premium`)로 맞춥니다. `home-config.json` 예시의 `member` / `subscriber`는 각각 `free` / `basic, premium`으로 바꾸는 것을 제안합니다. 확정 스키마는 개발 단계에서 `docs/home-config.md`에 정리합니다.

---

## 5. 데모 설정 (pitch `DemoPanel` → 앱 시트)

| 항목 | 값 | 효과 |
| --- | --- | --- |
| 회원 상태 | Not signed in / WSOP+ Free / Basic / Premium | 3-1 |
| 운영 모드 | Season / Off-season | 홈 섹션 세트 전환 (원격 구성의 `layouts.season` / `layouts.offseason`) |
| 라이브 0건 | On / Off | 데모 시계를 오늘 첫 방송 45분 전으로 되돌림 (`demoNow`) → 홈 LIVE NOW 카운트다운, Live 탭, 편성표 상태가 모두 같이 바뀜 |
| 표시 시간대 | Seoul (KST) / Los Angeles (PT) | 앱 안의 모든 시각 변환. 기본값 `Asia/Seoul` |

웹 데모의 "앱 재실행" 버튼은 실행 팝업 레이어용이라 앱에서는 뺍니다.

---

## 6. 목업 데이터 (pitch `src/data/mock.ts` → 앱 `src/data/*.ts`)

편성 시각은 **앱을 연 시각(30분 단위 내림) 기준 상대 시각**이라 언제 열어도 라이브가 진행 중입니다.

| 데이터 | 개수 | 주요 필드 |
| --- | --- | --- |
| Series (투어 3종) | 4 (진행 1 · 예정 1 · 종료 2) | id, tour, name, start/end, venue, city, timezone, hue |
| Events (대회 이벤트) | 18 | id, seriesId, number, name, buyIn, days[] (Day 1A… Final Table) |
| Channels (송출) | 4 (CH-01~04) | id, name, signal |
| Schedules (편성) | 19 (오늘 라이브 3) | id, title, seriesId, eventId, dayId, type, channelId, lang(EN/ES/PT), **tier**, start/end, originalStart(Changed), vodId, baseViewers |
| VOD | 24 (Shorts 6 포함) | id, title, type, seriesId, eventId, **tier**, durationSec, views, publishedAt, playerIds, description |
| Players (가상) | 9 | id, name, country, flag, bracelets, rings, earnings, hue |
| Curations | 3 | id, title, vodIds |
| Banners / Strip banners | 4 / 4 (등급별) | audiences, link |
| Notices | 4 | type, pinned, audiences, link, attachment |
| Continue watching | 4 (1개는 95%라 숨김) | vodId, progress |
| Plans | Free / Basic / Premium | name, tagline, highlights, price(`TBD`) |
| 리니어 채널 프로그램 | v2 `channels.ts` 생성 규칙 | channelId, kind, title, subtitle, start/end, tier |

앱 파일 배치: `src/data/series.ts`, `schedules.ts`, `vods.ts`, `players.ts`, `home.ts`(배너·띠배너·공지·큐레이션·기본 레이아웃), `plans.ts`, `channels.ts`, `types.ts`.

**이미지:** 웹 데모 카드는 `hue` 기반 그라디언트 아트(pitch `Art`)입니다. 앱도 `expo-linear-gradient`로 같은 방식을 씁니다. v2의 CC 스틸 이미지(`public/media`)는 쓰지 않습니다. WSOP 로고 이미지(`wsop-logo.webp`)도 쓰지 않고 텍스트 워드마크 "WSOP TV"를 씁니다.

---

## 7. 디자인 토큰 (→ `src/theme`)

두 소스의 값이 조금씩 다릅니다. 아이콘/스플래시 배경 `#0B0C0F`가 v2 배경과 거의 같아서 **v2 토큰을 기준**으로 하고, 등급 색처럼 v2에 없는 값만 pitch에서 가져오는 것을 제안합니다.

### 컬러

| 토큰 | 값 (v2) | pitch 대응 | 용도 |
| --- | --- | --- | --- |
| `bg` | `#0B0C0E` | `#000` | 배경 |
| `surface` | `#131418` | `#121214` | 카드 |
| `surface2` | `#1A1C21` | `#1B1B1F` | 칩, 시트 |
| `surface3` | `#23262D` | — | 눌림 상태 |
| `line` | `#2A2D34` | `#26262C` | 구분선 |
| `lineStrong` | `#3B3F48` | — | 테두리 강조 |
| `text` | `#F2F2F3` | `#F4F4F6` | 본문 |
| `muted` | `#A7ABB3` | `#9A9AA3` | 보조 텍스트 |
| `subtle` | `#8A8F98` | — | 캡션 |
| `ink` | `#0B0C0E` | `#111` | 골드 위 텍스트 |
| `gold` | `#C9A961` | `#D9B24C` | 강조 (하나만) |
| `goldStrong` | `#DCC07E` | `#F0CF72` | 버튼 그라디언트 위쪽, 포커스 |
| `goldDim` | `#C9A96126` | — | 선택 배경 |
| `live` | `#E5484D` | `#E5322D` | LIVE |
| `delayed` | `#F5A524` | — | 지연 |
| `ok` | `#4CC38A` | — | 성공 |
| `tierFree` | — | `#8B93A1` | Free 배지 |
| `tierBasic` | — | `#4B8DF8` | Basic 배지 |
| `tierPremium` | — | `#D9B24C` → `gold` | Premium 배지 |
| 데모 설정 | `sky-400` 점선, 모노스페이스 | — | 제품 UI와 구분 |

### 타이포 (시스템 폰트)

| 토큰 | 값 |
| --- | --- |
| 본문 | 14px / 1.4 (pitch `.app`) |
| `title` | 28px / 1.15 (v2) |
| `label` | 11px, 대문자, letter-spacing 0.08em, 700 |
| 숫자 | tabular figures (`fontVariant: ['tabular-nums']`) |
| 버튼 | 14px, 800 |

### 간격·모양

| 토큰 | 값 |
| --- | --- |
| gutter | 16px |
| 버튼 최소 높이 | 44px (sm 38 / xs 32) |
| radius chip / card / panel | 6 / 12 / 16 (pitch 버튼 10) |
| 탭바 | 높이 약 84px(안전 영역 포함), 아이콘 22 |
| 모션 | 150–250ms, 강조 애니메이션은 LIVE 점 깜빡임만 |

톤: 어두운 차콜 바탕, 골드 강조 하나, 상태 색은 LIVE(빨강)·DELAYED(주황)에만. 펠트 초록, 칩·카드·주사위 장식, 실제 머니 플레이·베팅 문구 없음(v2 README).

---

## 8. 앱 전용 추가 (요청서) — 웹 데모와의 연결

| 추가 기능 | 연결되는 웹 데모 동작 |
| --- | --- |
| 데모 설정 시트 (로고 길게 누르기, My > Demo Settings) | 5장 |
| 원격 홈 구성 (`EXPO_PUBLIC_HOME_CONFIG_URL`, 실패 시 내장 기본값) | 4장, pitch CMS "메인 화면 관리"가 하던 역할 |
| expo-video + 공개 테스트 HLS, PiP, 10초 미리보기 | 3-2, pitch `Player.tsx` 미리보기 |
| 편성 알림 → 10초 뒤 로컬 알림 → `wsoptvdemo://live/{id}` | pitch Remind me / 알림 신청(`alarms`) |
| 햅틱 (탭 전환, 알림 신청, 구독 완료) | — |
| 아이콘 / 스플래시 (`#0B0C0F` + "WSOP TV" 워드마크) | — |
| 웹 export | — |
