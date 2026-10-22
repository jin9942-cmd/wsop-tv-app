# 웹 데모 → 앱 매핑 (web-demo-map)

## 기준

- **기준: 배포된 웹 데모 v2** — https://tv-service-keig.vercel.app/v2/ (소스 `tv-service/wsop-tv-v2`, 커밋 `d5d8049`)
- 앱은 v2의 **모바일 화면(폭 375px)** 을 그대로 옮겼습니다: 메뉴, 화면 구성, 목업 데이터, 문구, 컬러/타이포, 실사 스틸 이미지와 CC 영상.
- 처음 버전은 `wsop-tv-pitch`(앱 프레임 데모)를 기준으로 만들었으나, "배포된 v2와 같아야 한다"는 요청에 따라 v2 기준으로 다시 만들었습니다(2026-10-22).
- 대상 플랫폼: **Android + 웹 미리보기** (iOS 빌드 안 함). 번들 ID `com.wsop.wsoptvdemo`.

## 메뉴 (v2 모바일 하단 메뉴와 동일)

**Home · Live · Schedule · Hands · More**. More에는 v2 햄버거 메뉴 항목(Series & Events, Players, Archive, Search, My List, Account)과 앱 전용 **⚙ Demo Settings**가 있습니다. 헤더: 비로그인 배너(“WSOP TV is included with WSOP+ — free with every GGPass account.” + Continue with GGPASS), WSOP TV 워드마크(+ WORKING TITLE), 검색, Sign in / My.

## 화면 → 라우트

| v2 라우트 | 앱 라우트 | 내용 |
| --- | --- | --- |
| `#/` | `(tabs)/index` | 빌보드(대표 방송 실사 영상, 상태, Watch live / Key hands) → On air now → On the channels now → Continue Watching → My List → Coming up → Free highlights → From players you follow → Featured players → Relive the finals. 순서·노출은 원격 홈 구성 |
| `#/live` | `(tabs)/live` | Tournaments 탭: 대회 스트립 → 플레이어 → 스트림 정보·Overview → Streams 목록 → 핸드 |
| `#/live/channels/:id` | `(tabs)/live?tab=channels&channel=` | 채널 스트립, 채널 플레이어(되감기 없음), Now 정보, Next on, How channels work, 채널 가이드(EPG 8시간) |
| `#/watch/:dayId` | `watch/[dayId]` | Live와 같은 화면에 그 방송일 선택. 리플레이는 브레드크럼 + 방송일(에피소드) 목록 + More replays. `?clip=` 무료 하이라이트 |
| `#/schedule` | `(tabs)/schedule` | 시간대 선택, 날짜 스트립(방송 있는 날 점), PT 시각 + 내 시각, 상태·Remind me·Watch |
| `#/hands` | `(tabs)/hands` | 타입 필터, Trending / Biggest pot |
| `#/series`, `#/events/:id` | `events`, `events/[id]` | 시리즈별 이벤트, 스코어보드, 방송일, Key hands |
| `#/players`, `#/players/:id` | `players`, `players/[id]` | 검색·국적 필터, 프로필(상금·브레이슬릿·POY), Follow + Alerts, 최근 성적, 하이라이트 핸드 |
| `#/archive` | `archive` | Classics + 2026 Summer Championship replays (비로그인은 일부) |
| `#/search` | `search` | 최근 검색, 추천어, Status/Access 필터, 결과 탭 |
| `#/my-list` | `my-list` | 유형 필터, 빈 상태 안내 |
| `#/account` | `account` | GGPASS, WSOP+ membership, Viewing history, Devices, Viewing preferences, Notifications, Privacy, Responsible Gaming, Sign out |
| `#/plans` | `plans` | WSOP+ Free / Basic / Premium 비교 → WSOP+ |
| `#/devices` | `devices` | 동시 시청 기기 관리 |
| `#/auth/ggpass` | `ggpass` | GGPASS 외부 도메인 모의(밝은 톤): 로그인 → 동의 → 복귀. **입력 필드 없음** |
| `#/wsop-plus/join`, `#/membership/check` | `wsop-plus/join`, `membership/check` | WSOP+ 가입 모의 → 복귀 → 등급 재확인 |
| — | `live/[id]` | 앱 전용 딥링크 `wsoptvdemo://live/{dayId}` → 해당 플레이어 |

## 회원 상태와 시청 권한 (v2 그대로)

- 콘텐츠 접근 등급 `free`(계정 없이) / `signin`(GGPASS 계정 = WSOP+ Free) / `subscriber`(유료).
- 유료 콘텐츠가 요구하는 WSOP+ 등급은 **WSOP TV included from** 설정을 따름: Basic(기본) / Premium / Split(라이브는 Premium, 리플레이·아카이브·유료 클립은 Basic).
- 회원 상태 9가지: Not signed in · WSOP+ Free · Basic · Premium · GGPass 미연결 · 계정 제한 · 기기 초과 · 멤버십 종료 · 결제 문제(유예).
- 게이트 순서: 지역 제한 → VPN → 방송 상태(예정·지연 시작·중단) → 멤버십. 화면: Sign in to watch / WSOP+ Basic required / Link GGPASS / Account restricted / Membership ended / Too many devices.
- 리니어 채널: Studio·Highlights·Classic은 누구나 무료, Live·Replay는 그 방송의 등급. 잠긴 구간에서는 지금 볼 수 있는 채널을 안내. 지역 블랙아웃, 대기(Stand by) 처리.
- **앱 전용:** 로그인했지만 등급이 낮으면 **10초 미리보기** 후 “WSOP+ Basic required” 시트(Join WSOP+ Basic / Premium, See WSOP+ plans).
- 비로그인으로 방송을 열면 플레이어 자리에 Sign in to watch 패널이 나오고 GGPASS 로그인 시트가 뜹니다.

## 데이터 (v2 `data/mock.ts` 그대로)

시리즈 2(2026 Summer Championship, 2026 Autumn Classic), 이벤트 9, 방송일·테이블 피드(대표 방송 Main Event Final Table: 피드 4개, 30분 지연, Player Cam 지연 시작, Overhead Cam 중단), 가상 선수 20, 핸드 30, 아카이브 6, 리니어 채널 4(WSOP TV 1/2, WSOP Español, WSOP Classics)와 48시간 편성. 시각은 앱 시작 시각 기준 상대 시각이라 언제 열어도 방송 중입니다.

## 이미지·영상

- 카드 이미지: v2와 같은 **CC 실사 스틸 74장**(`assets/media`, 출처 `assets/media/CREDITS.md`)을 콘텐츠별로 고정 배정.
- 영상: v2와 같은 **Wikimedia Commons CC 포커 영상**(WPT, CC BY 3.0 / CC BY-SA 4.0)을 expo-video로 재생. WSOP 영상 아님. 재생 실패 시 스틸 + 가짜 진행바.
- WSOP 공식 로고 이미지는 쓰지 않고 텍스트 워드마크 "WSOP TV"를 씁니다(v2는 로고 이미지 사용).

## 디자인 토큰 (`src/theme`, v2 `styles/theme.css`)

bg `#0B0C0E` · surface `#131418` / `#1A1C21` / `#23262D` · line `#2A2D34` / `#3B3F48` · text `#F2F2F3` · muted `#A7ABB3` · subtle `#8A8F98` · gold `#C9A961` / `#DCC07E` · live `#E5484D` · delayed `#F5A524` · ok `#4CC38A` · radius 6/12/16 · label 11px 대문자 0.08em · 숫자 tabular · 다크 고정.

## 앱 전용 추가

| 기능 | 내용 |
| --- | --- |
| 데모 설정 시트 | 로고 길게 누르기 또는 More > Demo Settings. v2 Demo Controls 항목(회원 상태 9, WSOP TV included from, Featured stream, Region/VPN/Traveling, Spoiler-Free, WSOP+ page result) + 운영 모드(시즌/비시즌), 라이브 0건, 표시 시간대, 홈 구성 상태 |
| 원격 홈 구성 | [home-config.md](home-config.md) |
| 플레이어 | expo-video 네이티브 컨트롤, 가로는 기본 전체화면, PiP, 오버레이 Off/Basic/Pro, 멀티뷰 1/2(모바일 한도), 10초 미리보기 |
| 알림 | 편성 Remind me → 10초 뒤 로컬 알림 “Live now” → `wsoptvdemo://live/{dayId}`. 웹은 앱 안 토스트 |
| 햅틱 | 탭 전환, 알림 신청, 구독 완료 |

## 옮기지 않은 것

TV Preview(10-foot UI)와 플랫폼 셸, 플랫폼 선택(앱은 Android 모바일 고정), 4분할 멀티뷰(모바일 한도 2), 데스크톱 레이아웃과 키보드 단축키, 이메일 가입 폼(입력 폼 금지), GGPASS 모의 화면의 비밀번호 모양 칸, 리플레이 플레이어의 배속·자막 선택·Hands only 재생(네이티브 컨트롤로 대체), 하이라이트 클립 종료 카드.
