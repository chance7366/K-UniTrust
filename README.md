# K-UniTrust Dashboard

대학현황·대학재정분석·대학경쟁력·재정추계 대시보드입니다.  
엑셀 업로드 → CSV 저장 → 탭별 분석 UI.

이 저장소는 **GitHub로 코드를 공유**하기 위한 것입니다. 비밀번호·API 키는 올리지 마세요.

## Tech Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- CSV 파일 DB (`data/csv/`)
- Cesium + OpenLayers — 대학 지도
- ECharts / Recharts — 차트

## 처음 실행

```bash
git clone <이-저장소-URL>
cd "K-UniTrust Dashborad"
copy .env.example .env
```

`.env`에 비밀번호·브이월드 키를 채웁니다. (`.env`는 Git에 포함되지 않습니다.)

```bash
npm install
npm run dev
```

Windows PowerShell에서 `npm`이 막히면:

```powershell
npm.cmd run dev
```

브라우저: [http://localhost:3000](http://localhost:3000)

같은 사내망에서 접속하려면 서버 PC에서 `npm run dev`(이미 `0.0.0.0` 바인딩)를 켠 뒤  
`http://<서버-IP>:3000` 을 사용합니다. Cursor를 끄면 Cursor 안에서 켠 서버는 같이 종료됩니다.

## 환경 변수

`.env.example`을 참고합니다.

| 변수 | 용도 |
|------|------|
| `KUNITRUST_ADMIN_PASSWORD` | 관리자 비밀번호 |
| `KUNITRUST_USER_PASSWORD` | 사용자 비밀번호 |
| `KUNITRUST_AUTH_SECRET` | 로그인 쿠키 서명 |
| `VWORLD_API_KEY` | 지오코딩 등 서버용 |
| `NEXT_PUBLIC_VWORLD_MAP_KEY` | 지도 SDK |

## Menus

| 메뉴 | 경로 |
|------|------|
| 대학현황 | `/analysis/univ-map?tab=school-overview` |
| 대학재정분석 | `/analysis/finance-analysis?tab=...` |
| 대학경쟁력분석 | `/analysis/competitiveness-analysis/...` |
| 재정추계분석 | `/analysis/financial-projection/settings` |

## Project Structure

```text
data/csv/                 # 대시보드가 읽는 CSV
src/app/analysis/         # 페이지
src/app/api/              # 업로드·인증 API
src/components/analysis/  # 대시보드 UI
src/lib/                  # 로더·추계·경쟁력
scripts/                  # Cesium 복사, 검증
public/cesium/            # npm install 시 생성
```

## Scripts

```bash
npm run dev              # 개발 서버 (네트워크 0.0.0.0)
npm run build            # 프로덕션 빌드
npm run start            # 빌드 후 실행
npm run geocode:univ-map # 학교개황 지오코딩 (VWORLD_API_KEY)
```

## 데이터·권한

- 운영 표 데이터는 `data/csv/` 입니다.
- 업로드 원본 스냅샷(`data/01_raw/api/`)과 추계·경쟁력 실행 JSON은 Git에 넣지 않습니다.
- 가중치·추계 실행 결과는 **브라우저(PC)별**로 저장됩니다.

자세한 구조는 `docs/ARCHITECTURE.md`를 참고하세요.
