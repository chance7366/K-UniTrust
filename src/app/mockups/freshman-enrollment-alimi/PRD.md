# 신입생충원 UI PRD v1.0

> 상태: **프로덕션 적용** · `/analysis/univ-map?tab=freshman-enrollment`  
> 목업: `/mockups/freshman-enrollment-alimi`

## 변경 요약

| 제거 | 추가/변경 |
|------|-----------|
| 통계분석 탭 | **대학전문** / **대학원** 탭 |
| 캠퍼스별·본교통합 | 업로드 **원본 그대로** 표시 |
| 단일 업로드·단일 양식 | **2종** 업로드·양식·DB·다운로드 |

## v0.2

- **기준연도**: 엑셀 텍스트 형식 그대로 표시 (숫자 변환 없음)
- **필터**: 프로덕션과 동일 — 표시 연도, 설립구분, 학교구분, 학교종류, 지역, 학교명 검색
- **표**: `FDB_TABLE` / `FDB_TABLE_COLOR` — 학교명 녹색, 충원율 핑크, 줄무늬 행

## 데이터 파일

| 구분 | 파일 |
|------|------|
| 대학전문 | `(업로드)신입생충원_대학전문.xlsx` — 3행 헤더, 21열 |
| 대학원 | `(업로드)신입생충원_대학원.xlsx` — 3행 헤더, 19열, 대학원명 |

## Phase 2 (프로덕션)

1. CSV/DB 스키마: `freshman_enrollment_undergrad`, `freshman_enrollment_grad` 분리
2. Upload API 2종 + template 2종
3. Export: `{label} 원본 down` — 저장 원본 xlsx 변환
4. `FreshmanEnrollmentDashboard` 교체 또는 신규 `FreshmanEnrollmentAlimiDashboard`
