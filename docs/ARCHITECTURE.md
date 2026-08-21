# Architecture

## Overview

K-UniTrust Dashboard는 **엑셀 업로드 → CSV 저장 → Next.js SSR 대시보드** 구조입니다.

- **대학현황** (`univ-map`): 학교개황, 대학위치(3D 지도)
- **대학재정분석** (`finance-analysis`): 학교코드, 학생충원, 재정 지표, 지역인구 등

## Data Layers

| Layer | Path | Role |
|-------|------|------|
| Silver | `data/csv/*.csv` | 대시보드·API가 읽는 정규화 CSV |
| Bronze | `data/01_raw/api/<domain>/` | 업로드 시점 원본 스냅샷 (감사·복구용) |

업로드 흐름: `POST /api/ingest/.../upload` → ingest 모듈 파싱 → Silver CSV 갱신 → Bronze 스냅샷 기록.

## Key Directories

```text
src/app/analysis/univ-map/          # 대학현황 페이지
src/app/analysis/finance-analysis/  # 대학재정분석 페이지
src/app/analysis/[domain]/          # 구 URL → 신 메뉴 redirect
src/app/api/ingest/                 # 업로드·export·template API
src/lib/data/                       # 탭별 load*Dashboard()
src/lib/ingest/                     # 탭별 ingest*Upload()
src/lib/map/university-map-controller.ts  # Cesium 3D 지도
```

## Environment

| Variable | Required | Usage |
|----------|----------|-------|
| `VWORLD_API_KEY` | 지오코딩 시 | 서버-side 주소 변환 |
| `NEXT_PUBLIC_VWORLD_MAP_KEY` | 지도 표시 시 | 브라우저 지도 SDK |

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run geocode:univ-map` | 학교개황 CSV 주소 지오코딩 |
| `postinstall` | Cesium 에셋을 `public/cesium/`으로 복사 |

`scripts/archive/`에는 개발 초기 1회성 시드 스크립트가 보관되어 있습니다.
