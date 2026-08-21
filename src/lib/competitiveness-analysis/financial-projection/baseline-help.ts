import type { HelpSection } from "@/lib/analysis/advanced-chart-help";

export const FP_BASELINE_HELP_TITLE = "기초자료 도움말";
export const FP_BASELINE_HELP_SUB =
  "기초자료가 무엇을 만드는지, 산출 규칙이 어떻게 적용되는지 정리한 설명입니다.";

export function fpBaselineHelp(opts: {
  analysisYear: number;
  settlementYear: number;
  endYear: number;
  indexBaseYear: number;
}): HelpSection[] {
  const { analysisYear, settlementYear, endYear, indexBaseYear } = opts;
  return [
    {
      title: "이 화면이 하는 일",
      body: `대상대학별로 학부·대학원 재학생충원 재학생(계)·충원·중탈·수업료와 교비자금 등록금실적·맞춤형국가장학금·기타수입·지출·가용자금 초를 생성합니다. 학부 신입은 소재 시도 학령지수(${indexBaseYear}=100, ${endYear}년까지)를 붙입니다. CPI·시나리오는 ${analysisYear}년 에디션 공통입니다.`,
    },
    {
      title: "자료 연도",
      body: `결산은 ${settlementYear}년 교비(교비자금 수입·지출·대차). 충원·중탈·가중평균수업료·학령인구는 ${analysisYear}년 알리미. 전망 끝은 ${endYear}년(${analysisYear}년 탭 0세 → ${endYear}년 대입).`,
    },
    {
      title: "운영수입 3구분",
      body: "운영수입 = 등록금수입 + 맞춤형국가장학금 + 기타수입. CPI·시나리오는 에디션 공통이며, 지역소멸지수는 등록금 경로에 넣지 않습니다.",
    },
    {
      title: "등록금수입",
      body: `${settlementYear}년까지는 교비자금(수입) 6.학부생수업료[1008]+6.대학원생수업료[1009](캠퍼스→대표학교 합산, 천원→원). ${analysisYear}년은 재학생충원율 재학생(계)×가중평균수업료. ${indexBaseYear}~${endYear}년 학부 신입만 소재 시도 학령지수. 대학원은 학령 없이 자체 충원·중탈 코호트.`,
    },
    {
      title: "맞춤형국가장학금",
      body: `연도값 = min(재정지원 맞춤형국가장학금, 교비 국고[1048]). 추계 기준액은 max(${settlementYear - 2}~${settlementYear} 3년 평균, ${settlementYear - 1}~${settlementYear} 2년 평균). 전망은 재학생 수에 비례. 시나리오 증감·가산은 적용하지 않습니다.`,
    },
    {
      title: "기타수입",
      body: "운영수입[1086] − 수업료[1008·1009] − 국가장학금. 기준액은 같은 3년·2년 평균 중 큰 값. 학생 수와 무관. 전망은 기준액 × (1+가산비율) × (1+증감률)^τ.",
    },
    {
      title: "지출 · 가용자금 초",
      body: `지출은 교비자금(지출) 3·2년 평균 중 큰 값(보수·관리운영비·교육외비용=고정비, 연구학생경비=변동비). 가용자금 초는 ${settlementYear}년 단년(이월+임의+원금보존, 산단 제외).`,
    },
    {
      title: "대학현황에서 선정",
      body: "대학알리미 자료이며 모두 필수입니다. 입학정원(학부·대학원), 신입생충원율(학부·대학원), 중도탈락율(학부·대학원), 가중평균수업료(학부·대학원).",
    },
    {
      title: "재정분석지표에서 선정",
      body: "재정분석지표이며 모두 필수입니다. 재학생충원율(학부·대학원), 재학생(계)·상·하반기 평균, 자금확보율(교비 이월·임의·원금보존), 운영수입[1086]−수업료(기타수입 잔액), 국고보조금수입[1048](국가장학금 한도), 맞춤형국가장학금(한도: 교비 국고[1048]), 보수[1136](고정비), 관리운영비[1154](고정비), 연구학생경비[1186](변동비), 교육외비용[1205](고정비 합산).",
    },
    {
      title: "계정분류 (교비자금 지출)",
      body: "수입은 등록금·맞춤형국가장학금·기타 3줄입니다. 지출 4계정은 3년·2년 평균 중 큰 값입니다. 1136 3.보수=고정비, 1154 3.관리운영비=고정비, 1186 3.연구학생경비=변동비, 1205 3.교육외비용=고정비.",
    },
  ];
}
