import type { KnownIssueRecord } from "@/lib/competitiveness-analysis/post-run-validation/types";

/**
 * 경쟁력분석 — 알려진 이슈·검증 규칙 레지스트리
 *
 * 검증 중 새 유형의 오류·누락이 발견되면 이 배열에 항목을 추가하고
 * checks.ts에 대응 runCheck 함수를 구현한다.
 */
export const KNOWN_ISSUE_REGISTRY: KnownIssueRecord[] = [
  {
    id: "DB-DROPOUT-COHORT-001",
    title: "중도탈락률 DB 동종(전문대) 누락",
    category: "data",
    severity: "error",
    owner: "user",
    discoveredAt: "2026-08-10",
    description:
      "중도탈락율 *_rep.csv(finance_analysis_dropout_rate_rep)의 적용연도에 " +
      "전문대(junior-college) 행이 없으면 전문대 중도탈락 지수가 전원 누락된다.",
    userActionGuide:
      "재정분석지표 › 학생충원 › 중도탈락율에서 해당 연도 대학·전문대학 데이터가 모두 있는지 확인한다.",
    autoFixable: true,
    history: [
      {
        at: "2026-08-10",
        note: "2026-08-07 업로드가 2023/2024 전문대 137~138행 삭제. bronze(20260801) 복원 스크립트 추가.",
      },
      {
        at: "2026-08-15",
        note: "원천을 구 raw/consolidated가 아니라 dropout_rate_rep.csv 코호트로 변경.",
      },
    ],
  },
  {
    id: "DB-COHORT-COVERAGE-001",
    title: "지표별 전국분포 동종 커버리지",
    category: "data",
    severity: "error",
    owner: "user",
    discoveredAt: "2026-08-10",
    description:
      "2단계 백분위(P10/P90) 산출에 필요한 전국 분포에, 대상에 포함된 학교종류(4년제/전문대) 버킷 데이터가 없으면 " +
      "해당 동종 전체 지수가 0 또는 누락 처리된다.",
    userActionGuide: "해당 지표·연도 DB를 업로드하거나, 기본설정의 적용연도를 데이터가 있는 연도로 변경한다.",
    autoFixable: false,
  },
  {
    id: "DB-TARGET-MISSING-001",
    title: "대상대학 지표 원값 DB 누락",
    category: "data",
    severity: "warning",
    owner: "user",
    discoveredAt: "2026-08-10",
    description:
      "1단계에서 대상대학의 enabled 지표 원값을 재정분석 *_rep.csv에서 찾지 못한 경우.",
    userActionGuide:
      "재정분석지표 해당 탭에서 대학·연도·코호트(대학=combined 또는 university, 전문대=junior-college) 값을 확인한다.",
    autoFixable: false,
  },
  {
    id: "LOGIC-DATA-MISSING-001",
    title: "Step2 dataMissing — 종합점수 가중치 제외",
    category: "logic",
    severity: "info",
    owner: "system",
    discoveredAt: "2026-08-10",
    description:
      "원값·동종 분포 없음(dataMissing) 지표는 0점이 아닌 누락으로 표시하고, 3단계 종합·부문 점수 가중치에서 제외한다. " +
      "과거에는 null→0점 처리로 전문대 종합점수가 비정상적으로 낮아졌음.",
    autoFixable: true,
    history: [
      { at: "2026-08-10", note: "compute-step2 dataMissing 플래그, compute-run/run-analytics 가중치 제외 적용." },
    ],
  },
  {
    id: "LOGIC-INDEX-ALL-ZERO-001",
    title: "동종 전체 지수 0점 의심",
    category: "logic",
    severity: "error",
    owner: "user",
    discoveredAt: "2026-08-10",
    description:
      "특정 지표·동종에서 대상대학 전원 indexScore=0 이고 dataMissing이 아니면, 데이터·백분위 산출 이상을 의심한다.",
    userActionGuide: "해당 지표 DB·적용연도·동종 분포를 확인하고 재업로드 또는 재실행한다.",
    autoFixable: false,
  },
  {
    id: "LOGIC-COMPOSITE-GAP-001",
    title: "4년제·전문대 종합점수 평균 격차 과대",
    category: "logic",
    severity: "warning",
    owner: "monitor",
    discoveredAt: "2026-08-10",
    description:
      "동종 분리 평가 후에도 4년제 vs 전문대 종합점수 평균 차이가 임계(기본 8점)를 넘으면, " +
      "특정 지표 누락·가중치·데이터 편향을 점검한다.",
    userActionGuide: "격차 원인 지표(특히 학생충원 3지표) Step2 누락·0점 비율을 확인한다.",
    autoFixable: false,
  },
  {
    id: "DB-INCOME-PROPERTY-001",
    title: "수익용재산확보율 DB 누락",
    category: "data",
    severity: "warning",
    owner: "user",
    discoveredAt: "2026-08-10",
    description:
      "수익용재산확보율은 finance_analysis_income_property_secure_rate_rep.csv의 secure_rate를 사용한다. " +
      "해당 연도·코호트 행이 없으면 1단계 원값이 공란이 된다.",
    userActionGuide:
      "재정분석지표 › 법인재정 › 수익용재산확보율에서 해당 대학·연도 확보율(secure_rate)을 확인한다.",
    autoFixable: false,
    history: [
      {
        at: "2026-08-15",
        note: "전년도 등록금 산출 가정이 아니라 *_rep.csv secure_rate 직접 조회로 변경.",
      },
    ],
  },
  {
    id: "SYS-WEIGHT-001",
    title: "가중치 합 100% 검증",
    category: "system",
    severity: "error",
    owner: "user",
    discoveredAt: "2026-08-10",
    description: "카테고리·지표 가중치 합이 100%가 아니면 3단계 실행 불가.",
    userActionGuide: "기본설정 > 가중치 탭에서 카테고리·지표별 합 100% 맞춤.",
    autoFixable: false,
  },
  {
    id: "SYS-STORED-FRESH-001",
    title: "저장 결과 vs 재계산 일치",
    category: "system",
    severity: "error",
    owner: "system",
    discoveredAt: "2026-08-10",
    description: "edition DB 저장 step1/2/3 결과가 동일 설정으로 재실행한 결과와 불일치.",
    userActionGuide: "3단계 재실행 또는 scripts/rerun-competitiveness-analysis.ts 실행.",
    autoFixable: true,
  },
  {
    id: "MONITOR-GRADE-CUTOFF-001",
    title: "진단등급 baseline 캘리브레이션 컷오프",
    category: "logic",
    severity: "info",
    owner: "monitor",
    discoveredAt: "2026-08-10",
    description:
      "진단등급은 2026년 분포 기준 통합 컷오프(S 77·A 65·B 56·C 44·D 30)와 최약고리(고위험 지표 2개↑→C cap). 공식 순위와 무관.",
    autoFixable: false,
  },
  {
    id: "SET-TARGET-KIND-001",
    title: "대상대학 학교종류(대학·전문대학만)",
    category: "data",
    severity: "error",
    owner: "user",
    discoveredAt: "2026-08-15",
    description:
      "기본설정 대상대학은 대학·전문대학만 포함한다. 대학원·원격 등 other 종류가 섞이면 코호트 조회가 어긋난다.",
    userActionGuide: "기본설정 › 대상대학 탭에서 대학·전문대학만 남기고 설정을 저장한다.",
    autoFixable: false,
  },
  {
    id: "SET-YEAR-LABEL-001",
    title: "지표 적용연도 YYYY년 형식",
    category: "data",
    severity: "error",
    owner: "user",
    discoveredAt: "2026-08-15",
    description:
      "모든 지표 적용연도는 '2025년' 형식이다. 재학생충원율도 반기 조합이 아니라 표시연도만 저장한다.",
    userActionGuide: "기본설정 › 평가지표에서 각 지표 적용연도를 YYYY년으로 맞춘다.",
    autoFixable: false,
  },
  {
    id: "DB-REP-COVERAGE-001",
    title: "재정분석 *_rep.csv 적용연도·코호트 존재",
    category: "data",
    severity: "error",
    owner: "user",
    discoveredAt: "2026-08-15",
    description:
      "분석실행은 구 업로드 CSV가 아니라 *_rep.csv를 읽는다. " +
      "학생충원 대학=combined, 대학재정·법인재정 대학=university, 전문대=junior-college.",
    userActionGuide:
      "재정분석지표에서 해당 연도 표시값을 확인하고, 없으면 원천 데이터를 보강한 뒤 *_rep.csv를 다시 만든다.",
    autoFixable: false,
  },
  {
    id: "DB-ENROLLED-TOTAL-001",
    title: "재학생수 — 기본설정·1단계 vs *_rep.csv",
    category: "data",
    severity: "error",
    owner: "system",
    discoveredAt: "2026-08-15",
    description:
      "재학생수는 대학현황 › 대학알리미 › 재적학생의 재학생(A) 계·소계를 대표학교코드로 합산한 값이다. " +
      "대학=대학전문+대학원, 전문대학=대학전문, 분석연도와 같은 해. " +
      "1단계·대상대학 화면은 같은 합산을 쓴다. 저장 설정값이 비어 있는 것은 값 오류가 아니다.",
    userActionGuide:
      "기본설정 › 대상대학과 1단계 재학생수가 대학알리미 재적학생 재학생(A) 계·소계와 같은지 확인한다.",
    autoFixable: false,
  },
  {
    id: "DB-SCHOOL-SCALE-001",
    title: "규모 분류 — 3단계 vs 재적학생 재학생(A)",
    category: "data",
    severity: "error",
    owner: "system",
    discoveredAt: "2026-08-17",
    description:
      "재정분석 규모별 추이와 3단계 규모는 같은 재학생수·같은 임계값을 쓴다. " +
      "대학은 10,000/5,000, 전문대학은 4,000/2,000. " +
      "재학생수는 대학알리미 재적학생 재학생(A) 계·소계(대표학교코드 합산)이다.",
    userActionGuide:
      "3단계 재학생수·규모가 기본설정 대상대학 재학생수와 같은지 확인하고, 다르면 1~3단계를 재실행한다.",
    autoFixable: false,
  },
  {
    id: "DB-VALUE-SOURCE-001",
    title: "지표 원값 — 분석실행 vs 재정분석 *_rep.csv",
    category: "data",
    severity: "error",
    owner: "system",
    discoveredAt: "2026-08-15",
    description:
      "1단계 원지표값이 재정분석지표 *_rep.csv와 같아야 한다. " +
      "신입생·재학생=fill_rate_within_outside, 중도탈락=enrolled_dropout_rate, " +
      "자금확보=fund_secure_rate, 재정지원=benefit_rate, 등록금의존=tuition_dependency_rate, " +
      "수익용재산=secure_rate, 법인전입=transfer_ratio.",
    userActionGuide:
      "불일치 대학·지표를 재정분석지표 화면과 1단계 원지표값 탭에서 대조한다. 코드 조회 규칙이 어긋난 경우 수정 후 1~3단계를 재실행한다.",
    autoFixable: false,
  },
  {
    id: "DB-VALUE-STEP-ALIGN-001",
    title: "1·2·3단계 원값 일치",
    category: "data",
    severity: "error",
    owner: "system",
    discoveredAt: "2026-08-15",
    description: "2·3단계 지표 원값은 1단계와 동일해야 한다. 지수는 전국 동종 분포로만 재산출한다.",
    userActionGuide: "1~3단계를 순서대로 재실행한다.",
    autoFixable: true,
  },
  {
    id: "DB-VALUE-STORED-001",
    title: "저장 원값 vs 재정분석 *_rep.csv",
    category: "data",
    severity: "error",
    owner: "system",
    discoveredAt: "2026-08-15",
    description:
      "edition에 저장된 1·2·3단계 원값이 현재 *_rep.csv 조회값과 다르면, " +
      "설정·DB 변경 후 재실행하지 않았거나 저장 파이프라인 오류다.",
    userActionGuide: "3단계를 재실행해 저장 결과를 갱신한다.",
    autoFixable: true,
  },
  {
    id: "SYS-UNIVERSITY-DASHBOARD-001",
    title: "대학별경쟁력 화면 ↔ 분석실행 데이터 일치",
    category: "system",
    severity: "error",
    owner: "system",
    discoveredAt: "2026-08-11",
    description:
      "대학별경쟁력 메뉴의 지표값·순위·전국/권역/시·도 평균·그룹지수가 " +
      "edition DB runResults 및 university-detail-data 집계와 불일치.",
    userActionGuide:
      "npm run validate:competitiveness:university-dashboard 실행 후 불일치 필드 확인. " +
      "university-detail-data.ts·UniversityCompetitivenessDashboard.tsx 수정 후 재검증.",
    autoFixable: false,
    history: [
      {
        at: "2026-08-11",
        note: "validate-university-dashboard-data.ts · university-dashboard-validation.ts 추가. Post-Run 검증에 통합.",
      },
    ],
  },
];

export function getKnownIssue(id: string): KnownIssueRecord | undefined {
  return KNOWN_ISSUE_REGISTRY.find((r) => r.id === id);
}
