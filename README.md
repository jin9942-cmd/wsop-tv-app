# WSOP TV — 앱 데모 (Expo, Android + 웹 미리보기)

TTN Kick-off 전에 내부 리더와 유관 부서에 미리 보여주기 위한 **클릭 가능한 앱 데모**입니다. 실제 서비스 개발용 코드가 아닙니다.

- 기준: **배포된 웹 데모 v2** (https://tv-service-keig.vercel.app/v2/, 소스 `../tv-service/wsop-tv-v2`)의 모바일 화면. 대응표: [docs/web-demo-map.md](docs/web-demo-map.md)
- 대상: **Android**와 웹 미리보기. iOS는 빌드하지 않습니다.
- 데이터는 모두 목업입니다(가상 선수·결과). 이미지와 영상은 v2와 같은 Creative Commons 실사 포커 영상·스틸이며 WSOP 영상이 아닙니다(`assets/media/CREDITS.md`).
- 로그인(GGPASS)과 구독(WSOP+)은 버튼과 모의 화면으로 회원 상태만 바꿉니다. 입력 폼, 비밀번호, 결제는 없습니다.
- 상태는 메모리에만 있어서 앱을 다시 시작하면 초기화됩니다.

## 구조

| 경로 | 내용 |
| --- | --- |
| `src/app` | Expo Router 라우트. `(tabs)` = Home · Live · Schedule · Hands · More, 그 밖에 `watch/[dayId]`, `events`, `players`, `archive`, `search`, `my-list`, `account`, `plans`, `devices`, `ggpass`, `wsop-plus/join`, `membership/check`, `live/[id]`(딥링크) |
| `src/components` | 카드, 빌보드, Live 화면, 채널 화면, 플레이어(`player/`: 영상·오버레이·게이트·패널), 시트, 헤더 |
| `src/data` | v2 목업 그대로: 시리즈·이벤트·방송일·선수·핸드·아카이브(`mock.ts`), 채널 편성, 정책(`policy.ts`), 홈 기본 구성 |
| `src/state` | Context 하나(`app.tsx`: 데모 설정, 회원 상태, 알림 신청, My List, 시청 기록, 원격 홈 구성, 시트, 토스트) + 칩 카운트 |
| `src/theme` | v2 디자인 토큰 (다크 고정) |
| `src/lib` | 시간대, 방송 상태, 미디어(스틸·영상), 검색, 원격 홈 구성, 로컬 알림, 햅틱 |
| `assets/media` | v2 CC 스틸 74장 (`src/lib/stills.ts`가 번들에 포함) |
| `demo/home-config.json` | 원격 홈 구성 예시 — [docs/home-config.md](docs/home-config.md) |
| `scripts/serve-home-config.js` | 로컬 홈 구성 서버 (CORS, 캐시 없음) |
| `scripts/make-brand-assets.ps1` | 아이콘·Android adaptive 전경·스플래시·파비콘 생성 |

## 로컬 실행

명령은 모두 `wsop-tv-app` 폴더에서 실행합니다.

```bash
npm install
```

```bash
npx expo start --web
```

- 웹 미리보기: http://localhost:8081 (브라우저 개발자 도구에서 휴대폰 크기로 보면 앱과 같은 화면입니다)
- 원격 홈 구성을 로컬에서 시험하려면 다른 터미널에서 아래를 실행합니다. `.env.local`이 이 주소를 가리킵니다.

```bash
node scripts/serve-home-config.js
```

- Android 개발 빌드(아래 "빌드")를 설치했다면:

```bash
npx expo start --dev-client
```

> expo-video의 PiP·백그라운드 재생, expo-notifications 같은 네이티브 기능 때문에 **Expo Go가 아니라 개발 빌드**로 확인합니다.

### 데모 조작

- **데모 설정 시트**: 헤더의 WSOP TV 워드마크를 길게 누르거나 More > ⚙ Demo Settings
  - v2 Demo Controls: 회원 상태 9가지, WSOP TV included from, Featured stream(Live / Delayed / VOD / Late start / Interrupted), Region restricted / VPN / Traveling abroad, Spoiler-Free Mode, WSOP+ page result
  - 앱 설정: 운영 모드(Season / Off-season), No live broadcasts, 표시 시간대, 원격 홈 구성 상태와 다시 불러오기
- **홈 새로고침**: 당겨서 새로고침 (웹은 헤더의 ↻)

### 시연 시나리오

1. 비로그인 → 홈 → Watch live(또는 방송 카드) → Sign in to watch + GGPASS 로그인 시트
2. Continue with GGPASS → GGPASS 모의 화면(Sign in → Allow) → WSOP+ Free로 복귀 → 유료 방송 **10초 미리보기** → “WSOP+ Basic required” 시트 → Join WSOP+ Basic → 바로 시청
3. Live > Channels → 채널별 지금 방송의 권한(Highlights·Classic Free, Live는 해당 등급) · 잠긴 채널에서 볼 수 있는 채널 안내 · 채널 가이드
4. 데모 설정에서 Season / Off-season, No live broadcasts, 시간대 전환 → 홈·편성표에 즉시 반영
5. `demo/home-config.json` 수정 → 홈 당겨서 새로고침 → 섹션 순서 변경 (재배포 없음)
6. (Android 빌드) Schedule에서 Remind me → 처음이면 알림 권한 요청 → 10초 뒤 로컬 알림 “Live now” → 탭하면 `wsoptvdemo://live/{dayId}` 플레이어. 웹에서는 같은 시점에 앱 안 토스트(Watch 버튼)

## 검사

```bash
npx tsc --noEmit
```

```bash
npx expo lint
```

```bash
npx expo export -p web
```

## 빌드 (EAS, Android)

EAS 명령은 Expo 계정 로그인이 필요합니다. 프로필은 `eas.json` 그대로 씁니다.

```bash
npx eas-cli@latest login
```

```bash
npx eas-cli@latest init
```

- 개발 빌드 (개발 클라이언트, 내부 배포):

```bash
npx eas-cli@latest build --profile development --platform android
```

- 사내 공유용 APK (`preview` 채널):

```bash
npx eas-cli@latest build --profile preview --platform android
```

- 스토어용 (`production` 채널, AAB):

```bash
npx eas-cli@latest build --profile production --platform android
```

```bash
npx eas-cli@latest submit --platform android
```

빌드 프로필마다 `EXPO_PUBLIC_HOME_CONFIG_URL`이 `eas.json`에 들어 있습니다.

## OTA 업데이트 (EAS Update)

처음 한 번은 EAS Update 설정이 필요합니다. 이 명령은 `app.json`에 `runtimeVersion`과 `updates.url`을 추가합니다.

```bash
npx eas-cli@latest update:configure
```

JS·화면을 고친 뒤 이미 설치된 preview 빌드에 배포:

```bash
npx eas-cli@latest update --channel preview --message "demo: copy fixes" --environment preview
```

- SDK 55 이후로 `--environment`가 필수입니다. `EXPO_PUBLIC_HOME_CONFIG_URL`은 `.env`에도 있어서 업데이트 번들에 들어갑니다.
- 홈 섹션 순서만 바꿀 때는 업데이트도 필요 없습니다. 원격 `home-config.json`만 고치면 됩니다.
- 네이티브 설정(`app.json` 플러그인, 아이콘, 권한)을 바꿨다면 OTA가 아니라 새 빌드가 필요합니다.

## 웹 미리보기 배포 (Vercel)

`vercel.json`이 `npx expo export -p web` 결과(`dist`)를 정적 사이트로 배포하도록 설정되어 있습니다. Vercel 프로젝트의 Root Directory를 `wsop-tv-app`으로 지정하고 연결하거나, CLI로 배포합니다.

```bash
npx vercel --prod
```

## 원격 홈 구성 호스팅

`https://tv-service-keig.vercel.app/demo/home-config.json`에는 아직 파일이 없습니다(웹 데모로 리다이렉트됨). 그래서 지금은 앱이 내장 기본값으로 동작합니다. 올리는 방법은 [docs/home-config.md](docs/home-config.md#호스팅)에 정리했습니다.

## 아이콘·스플래시 다시 만들기

```bash
powershell -ExecutionPolicy Bypass -File scripts/make-brand-assets.ps1
```

`assets/images`의 `icon.png`(1024), `android-icon-foreground.png`(adaptive 전경, 안전 영역 안), `splash-icon.png`, `favicon.png`을 다시 만듭니다. 배경은 `#0B0C0F`, 마크는 "WSOP TV" 텍스트 워드마크입니다(공식 로고 미사용).
