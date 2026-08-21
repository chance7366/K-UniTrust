# CSV Data Store (Silver Layer)

Supabase/DuckDB 이전 전 **Silver(정제) 계층** CSV 저장소입니다.  
Bronze 원본은 `data/01_raw/`, Gold 요약은 `db/analytics.duckdb`입니다.

**전체 규칙:** [`docs/DB-MANAGEMENT-RULES.md`](../../docs/DB-MANAGEMENT-RULES.md)

## DB 갱신 (CSV → DuckDB)

```bash
npm run db:refresh   # schema + dimensions + facts + summaries
npm run db:verify    # row counts 확인
```

## 파일

| 파일 | 설명 | 키 |
|------|------|----|
| `universities.csv` | 대학 마스터/프로필 | `schl_id` |
| `departments.csv` | 학과 정보 | `schl_id` + `kedi_mjr_id` + `svy_yr` |
| `indicator_codes.csv` | 지표 코드북 | `cdid` |
| `indicator_facts.csv` | 대학×연도 지표 값 | `schl_id` + `svy_yr` + `operation` + `indct_id` |
| `basic_*.csv` | 대학기본정보(15158963) | 탭별 |
| `school_profiles.csv` | 대학·전문대학정보(15158665) | `schl_id` + `svy_yr` |
| `dept_*.csv` | 대학학과정보(15158955) | 탭별 |

## 수집

```bash
npm run ingest:all-domains
```

대학기본정보: `/analysis/univ-basic` 또는 `POST /api/ingest/univ-basic`

## 앱에서 읽기

- CSV: `src/lib/csv/read.ts`, `src/lib/data/*.ts`
- DuckDB (옵션): `USE_DUCKDB=true` + `src/lib/db/`
