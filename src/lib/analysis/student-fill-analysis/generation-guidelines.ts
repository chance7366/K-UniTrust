/**
 * 학생충원분석 · 개별대학 보고서 생성 지침 (단일 출처)
 *
 * 대학별분석 화면의 분석결과(신입생충원·재학생충원·외국인)를 빠짐없이 담고,
 * 시계열·권역·규모·설립·시도 비교로 진단한 뒤 쉬운 대응전략을 적는다.
 * 서식은 대학별경쟁력·대학별추계와 동일한 A4 공통 양식이다.
 */

export const STUDENT_FILL_REPORT_GUIDELINES_VERSION = "2.2.0";

export const STUDENT_FILL_REPORT_OUTLINE = [
  { id: "cover", title: "표지·기본정보", order: 1 },
  { id: "freshman", title: "제1부 분석결과 — 신입생충원", order: 2 },
  { id: "enrolled", title: "제1부 분석결과 — 재학생충원", order: 3 },
  { id: "foreign", title: "제1부 분석결과 — 외국인", order: 4 },
  { id: "diagnosis", title: "제2부 진단 — 추세와 집단 비교", order: 5 },
  { id: "actions", title: "제3부 대응전략", order: 6 },
] as const;

export const STUDENT_FILL_REPORT_RESULT_METRICS = {
  freshman: [
    { key: "rateIn", label: "정원내충원율" },
    { key: "outShare", label: "정원외비중" },
    { key: "rateAll", label: "정원내외충원율" },
    { key: "freshmanDropoutRate", label: "신입생탈락율" },
  ],
  enrolled: [
    { key: "enrolledFillRate", label: "재학생충원율" },
    { key: "enrolledFillRateIn", label: "정원내충원율" },
    { key: "enrolledOutShare", label: "정원외비중" },
    { key: "leaveShare", label: "휴학비중" },
    { key: "deferShare", label: "유예비중" },
    { key: "dropoutRate", label: "중도탈락율" },
  ],
  foreign: [
    { key: "foreignShare", label: "재적대비비중" },
    { key: "langAbilityRate", label: "언어능력충족율" },
    { key: "foreignDropRate", label: "외국인탈락율" },
    { key: "foreignDropAllRate", label: "전체외국인탈락율" },
  ],
} as const;

export const STUDENT_FILL_REPORT_ROLE_POLICY = {
  admin: [
    "분석연도별 개별대학 보고서 생성·재생성",
    "생성 전 본 지침(보고서생성지침) 확인",
    "보고서 열람(별도 창)·인쇄·PDF 저장",
  ],
  user: [
    "생성된 보고서 열람(별도 창)·인쇄·PDF 저장",
    "생성·재생성 불가",
  ],
} as const;

export const STUDENT_FILL_REPORT_INTERPRETATION_RULES = [
  "분석결과 탭의 신입생충원·재학생충원·외국인 지표를 빠짐없이 표에 싣는다. 요약만 하고 지표를 빼지 않는다.",
  "각 지표마다 본교 최근 5개년 값과, 당해 연도 권역·규모·설립·시도·전국(동종) 평균을 함께 보여 준다.",
  "제1부 차트는 시계열만 넣는다. 권역별·학생규모별 막대 차트는 넣지 않는다.",
  "시계열은 해당 파트 지표를 빠짐없이 그린다. 각 지표마다 본교·권역·규모·전국 동종 5개년 선을 넣는다.",
  "시계열은 최근 5개년으로 증가·감소·유지를 한 문장으로 적는다. 자료가 2개년 미만이면 「시계열 부족」으로 둔다.",
  "본교 값이 집단 평균보다 0.5%p 이상 다르면 높음/낮음을 적고, 그 미만이면 「비슷」으로 적는다.",
  "정원외 ≠ 외국인. 학위과정 소계(A)가 외국인 기본값이며, 정원외 입학·재학생을 유학생으로 읽지 않는다.",
  "탈락·외국인 탈락은 분석연도 Y의 공시 시차상 Y−1 자료다. 본문에 시차를 적는다.",
  "신입생: 정원내충원율과 정원내외충원율을 나란히 보고, 정원외비중이 늘었는지 줄었는지 시계열로 판단한다.",
  "신입생탈락율이 중도탈락율보다 높으면 1학년에서 먼저 빠지고 있다고 적는다. 낮으면 그 사실을 밝힌다.",
  "재학생: 재학생충원율과 정원내 재학생충원율 격차가 크면 정원외가 합산 수치를 받치고 있다고 적는다.",
  "휴학비중·유예비중은 권역·규모·설립·시도 평균과 비교한다. 휴학이 평균보다 높으면 복학 안내를 과제로 둔다.",
  "외국인: 재적대비비중의 5개년 증가/감소, 언어능력충족율의 집단 비교, 전체외국인탈락율을 빠짐없이 적는다.",
  "충원단계 라벨은 참고일 뿐 결론으로 쓰지 않는다. 자료가 없으면 0으로 채우지 않고 「자료 없음」으로 둔다.",
] as const;

export const STUDENT_FILL_REPORT_ACTION_RULES = [
  "대응전략은 쉬운 말로 적는다. 전문 용어·긴 산식·복잡한 조직 개편안은 쓰지 않는다.",
  "한 과제는 「무엇을 / 누가 / 언제까지 / 어떻게 알 수 있는지」만 담는다.",
  "분석결과와 진단에서 나온 약한 지표에만 과제를 단다. 해당하지 않으면 억지로 만들지 않는다.",
  "모집 인원을 더 줄여 충원율을 올려 보이게 하는 안은 금지한다.",
  "기숙사 신축, 유학 규모 확대, 「프로그램 확대」「모니터링 강화」만 있는 문장은 과제로 인정하지 않는다.",
  "정원외를 늘려 충원을 메우는 안은 금지한다. 정원내 충원을 먼저 채운다.",
  "언어능력충족율이 집단 평균보다 낮으면 전공 수업 전 한국어 수업을 과제로 두고, 유학생을 더 뽑지 않는다.",
] as const;

export const STUDENT_FILL_REPORT_PRIORITY = [
  "1순위: 신입생탈락율이 중도탈락율보다 높으면 입학 직후 출석·기초학습을 챙긴다.",
  "2순위: 정원내충원율이 약하면 미충원 학과의 정원을 충원이 되는 학과로 옮긴다. 모집은 줄이지 않는다.",
  "3순위: 정원외비중이 늘고 있으면 정원외를 더 늘리지 않는다.",
  "4순위: 휴학·유예가 권역·규모·설립·시도 평균보다 높으면 복학 안내와 분납을 쉽게 한다.",
  "5순위: 외국인 언어능력충족율이 평균보다 낮으면 한국어 수업을 보강하고 모집은 늘리지 않는다.",
] as const;

export const STUDENT_FILL_REPORT_FORMAT_RULES = [
  "용지: A4 세로. 여백 상 25mm · 좌우 15mm · 하 18mm. Pretendard · 본문 10pt. 대학별경쟁력·대학별추계와 동일 CSS.",
  "표지: accent bar, 제목, 학교명, 기본정보 표, 목차. 본문 각 쪽은 머리글·바닥글·쪽 번호.",
  "제1부: 신입생충원·재학생충원·외국인. 파트마다 표 쪽(본교 5개년 + 집단비교)과 차트 쪽(지표별 시계열)을 둔다.",
  "제2부: 추세, 권역·규모·설립·시도 대비 위치, 정원내/정원외·탈락·휴학·외국인 교차 진단.",
  "제3부: 쉬운 대응전략. 과제당 주관과 확인 방법만 적는다.",
  "열람: 별도 창 HTML. 인쇄 / PDF 저장(Ctrl+P).",
] as const;

export const STUDENT_FILL_REPORT_WRITING_EXAMPLE = {
  schoolName: "가야대학교",
  year: 2025,
  oneLiner:
    "정원내외 충원율이 좋아 보여도 정원외비중과 신입생탈락율을 함께 보고, 권역·규모 평균과 비교해 약한 곳을 과제로 잡는다.",
} as const;
