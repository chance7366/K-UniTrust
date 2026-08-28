"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { StudentFillMockShell } from "../StudentFillMockShell";

import "./student-fill-report-mock.css";

/** 2025년 스냅샷은 사용자 제공 수치. 시계열은 목업용 가상 추세. */
const SNAPSHOT = {
  school: "가야대학교",
  sido: "경남",
  zone: "동남권",
  enrolled: "1,610명",
  scale: "소규모",
  estb: "사립",
  year: 2025,
  stage: "충원보통",
  recruitIn: 409,
  admitIn: 389,
  rateIn: 95.1,
  recruitOut: 23,
  admitOut: 25,
  outShare: 6.0,
  rateAll: 95.8,
  recruitChange: -8.1,
  freshmanDrop: 42,
  freshmanDropRate: 11.4,
  quota: 1765,
  enrolledFill: 1610,
  enrolledFillRate: 91.2,
  enrolledFillRateIn: 82.2,
  dropoutRate: 8.9,
  enrolledOut: 160,
  enrolledOutShare: 9.9,
  leave: 327,
  leaveShare: 16.9,
  defer: 0,
  deferShare: 0,
  foreignA: 12,
  foreignShare: 0.7,
  foreignB: 0,
  foreignC: 0,
  lang: 8.3,
  foreignDrop: 0,
};

const TREND = [
  { year: 2021, rateAll: 98.4, rateIn: 97.2, enrolledFillRate: 94.8, enrolledFillRateIn: 88.1, dropoutRate: 7.6, freshmanDropoutRate: 8.2, leaveShare: 12.1 },
  { year: 2022, rateAll: 97.6, rateIn: 96.4, enrolledFillRate: 93.9, enrolledFillRateIn: 86.4, dropoutRate: 8.1, freshmanDropoutRate: 9.0, leaveShare: 13.4 },
  { year: 2023, rateAll: 96.8, rateIn: 95.8, enrolledFillRate: 92.8, enrolledFillRateIn: 84.7, dropoutRate: 8.4, freshmanDropoutRate: 10.1, leaveShare: 14.8 },
  { year: 2024, rateAll: 96.2, rateIn: 95.4, enrolledFillRate: 92.0, enrolledFillRateIn: 83.5, dropoutRate: 8.7, freshmanDropoutRate: 10.8, leaveShare: 16.1 },
  { year: 2025, rateAll: 95.8, rateIn: 95.1, enrolledFillRate: 91.2, enrolledFillRateIn: 82.2, dropoutRate: 8.9, freshmanDropoutRate: 11.4, leaveShare: 16.9 },
];

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function StudentFillUniversityReportMock() {
  return (
    <StudentFillMockShell activeLabel="대학별분석 · 심층보고서 목업">
      <div className="sfa-rpt">
        <article className="sfa-rpt-paper">
          <header className="sfa-rpt-cover">
            <p className="sfa-rpt-kicker">목업 · 프로덕션 미적용 · 가야대학교는 예시</p>
            <h1 className="sfa-rpt-title">
              {SNAPSHOT.school} 학생충원 심층진단 보고서
              <br />
              ({SNAPSHOT.year}년 분석)
            </h1>
            <p className="sfa-rpt-sub">
              {SNAPSHOT.sido} · {SNAPSHOT.zone} · {SNAPSHOT.enrolled} · {SNAPSHOT.scale} · {SNAPSHOT.estb}
              {" · "}학위(A) 기본 · 정원외 ≠ 외국인 · 탈락은 분석연도−1
            </p>
            <dl className="sfa-rpt-kpi">
              <div className="sfa-rpt-kpi-item">
                <dt>충원단계</dt>
                <dd>{SNAPSHOT.stage}</dd>
              </div>
              <div className="sfa-rpt-kpi-item">
                <dt>정원내외 충원율</dt>
                <dd>{SNAPSHOT.rateAll.toFixed(1)}%</dd>
              </div>
              <div className="sfa-rpt-kpi-item">
                <dt>재학생충원율 / 정원내</dt>
                <dd>
                  {SNAPSHOT.enrolledFillRate}% / {SNAPSHOT.enrolledFillRateIn}%
                </dd>
              </div>
              <div className="sfa-rpt-kpi-item">
                <dt>신입 탈락율 / 휴학비중</dt>
                <dd>
                  {SNAPSHOT.freshmanDropRate}% / {SNAPSHOT.leaveShare}%
                </dd>
              </div>
            </dl>
          </header>

          <div className="sfa-rpt-body">
            <nav className="sfa-rpt-nav" aria-label="보고서 목차">
              <button type="button" onClick={() => scrollTo("sec-insight")}>심층분석</button>
              <button type="button" onClick={() => scrollTo("sec-dx")}>핵심진단</button>
              <button type="button" onClick={() => scrollTo("sec-action")}>대응과제</button>
              <button type="button" onClick={() => scrollTo("sec-budget")}>예산·효과</button>
            </nav>

            <p className="sfa-rpt-note">
              화면의 5개년 선은 2025년 확정 수치를 끝점으로 한 목업 추세입니다. 실제 공시 시계열과 다를 수 있습니다.
              충원(좌)과 누수(우)는 눈금이 달라 차트를 나눴습니다.
            </p>

            <div className="sfa-rpt-chart">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={TREND} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis domain={[78, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="rateAll" name="정원내외충원율" stroke="#2a7a55" dot={false} />
                  <Line type="monotone" dataKey="enrolledFillRate" name="재학생충원율" stroke="#0284c7" dot={false} />
                  <Line type="monotone" dataKey="enrolledFillRateIn" name="재학생 정원내" stroke="#0284c7" strokeDasharray="4 3" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="sfa-rpt-chart">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={TREND} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis domain={[6, 20]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="leaveShare" name="휴학비중" stroke="#d97706" dot={false} />
                  <Line type="monotone" dataKey="freshmanDropoutRate" name="신입탈락율" stroke="#dc2626" dot={false} />
                  <Line type="monotone" dataKey="dropoutRate" name="중도탈락율" stroke="#7c3aed" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <h2 id="sec-insight" className="sfa-rpt-h2" style={{ scrollMarginTop: 48 }}>
              1. 심층분석 — 지표를 교차해 읽기
            </h2>
            <p className="sfa-rpt-p">
              {SNAPSHOT.school}의 {SNAPSHOT.year}년 정원내외 충원율 {SNAPSHOT.rateAll}%는 단계상 「{SNAPSHOT.stage}」입니다.
              그러나 동일 시점의 모집 −{Math.abs(SNAPSHOT.recruitChange)}%, 재학생 정원내 충원율 {SNAPSHOT.enrolledFillRateIn}%,
              신입생 탈락율 {SNAPSHOT.freshmanDropRate}%, 휴학비중 {SNAPSHOT.leaveShare}%를 한 줄로 묶으면
              「신입 규모를 줄여 충원율을 방어하면서, 들어온 학생은 1학년에서 빠지고, 재적 장부상 휴학이 쌓이는」 구조입니다.
              외국인 학위 {SNAPSHOT.foreignA}명({SNAPSHOT.foreignShare}%)은 충원 대체재가 아닙니다.
            </p>

            <div className="sfa-rpt-insight warn">
              <h3>착시 1. 충원보통은 모집 분모 축소로 만들어진 숫자입니다</h3>
              <p className="sfa-rpt-p">
                정원내 모집 {SNAPSHOT.recruitIn}명·입학 {SNAPSHOT.admitIn}명(정원내 {SNAPSHOT.rateIn}%),
                정원외 모집 {SNAPSHOT.recruitOut}명·입학 {SNAPSHOT.admitOut}명(입학 비중 {SNAPSHOT.outShare}%),
                내외 합산 {SNAPSHOT.rateAll}%입니다. 전년 대비 모집이 {SNAPSHOT.recruitChange}%이므로,
                올해 입학 414명(389+25)을 「축소 전 모집 규모」로 나누면 충원율은 대략 88%대로 떨어집니다.
                (모집 432명 ÷ 0.919 ≈ 470명 가정 시 414/470 ≈ 88.1%.)
                즉 단계 라벨은 수요 회복이 아니라 좌석을 치운 효과에 가깝습니다.
                소규모 사립에서 모집 38명 전후를 줄이면 등록금 수입은 즉시 감소하고, 충원율만 보면 위기가 가려집니다.
              </p>
            </div>

            <div className="sfa-rpt-insight warn">
              <h3>착시 2. 신입 정원외 6% vs 재학 정원외 9.9% — 정원내가 비고 있습니다</h3>
              <p className="sfa-rpt-p">
                신입에서 정원외 입학 비중은 {SNAPSHOT.outShare}%에 불과합니다.
                그런데 재학생(충원) {SNAPSHOT.enrolledFill.toLocaleString("ko-KR")}명 중 정원외 {SNAPSHOT.enrolledOut}명({SNAPSHOT.enrolledOutShare}%)이고,
                재학생충원율 {SNAPSHOT.enrolledFillRate}% 대비 정원내 충원율은 {SNAPSHOT.enrolledFillRateIn}%로 9.0%p가 벌어집니다.
                학생정원 {SNAPSHOT.quota.toLocaleString("ko-KR")}명 기준 정원내 재학 충원은 약 1,451명 수준입니다.
                신입 흐름보다 재학 스톡에서 정원외 비중이 높다는 것은, 정원내 학생이 더 빨리 빠지거나 정원외가 누적되고 있다는 뜻입니다.
                정원외를 외국인으로 읽으면 안 됩니다. 학위 외국인은 12명뿐입니다.
              </p>
            </div>

            <div className="sfa-rpt-insight warn">
              <h3>누수 3. 신입 탈락 11.4%는 전체 탈락 8.9%보다 심각합니다</h3>
              <p className="sfa-rpt-p">
                중도탈락 {SNAPSHOT.dropoutRate}%(전년도) 대비 신입생 탈락은 {SNAPSHOT.freshmanDrop}명·{SNAPSHOT.freshmanDropRate}%입니다.
                1학년이 전체보다 2.5%p 높으면, 문제는 「대학 생활 전반」이 아니라 「입학 직후 8~16주」입니다.
                올해 정원내 모집 {SNAPSHOT.recruitIn}명의 약 10%에 해당하는 인원이 이미 1학년에서 사라지는 셈입니다.
                모집을 줄인 해에 신입 누수까지 겹치면, 2학년 이후 재학생충원율 {SNAPSHOT.enrolledFillRate}%는 추가로 하락할 여지가 큽니다.
              </p>
            </div>

            <div className="sfa-rpt-insight">
              <h3>잠복 4. 휴학 327명(16.9%)은 충원율 밖으로 빠져 있는 재적입니다</h3>
              <p className="sfa-rpt-p">
                재학생(충원) {SNAPSHOT.enrolledFill.toLocaleString("ko-KR")} + 휴학 {SNAPSHOT.leave} + 유예 {SNAPSHOT.defer} ≈ 재적 1,937명.
                휴학비중이 {SNAPSHOT.leaveShare}%면 장부상 학생의 1/6이 수업·등록금 사이클 밖에 있습니다.
                유예 0%이므로 「졸업 유예로 재학을 붙잡는」 전략도 없습니다.
                휴학이 높으면 재학생충원 산식의 분자(재학생)가 줄고, 복학 실패 시 중도탈락으로 이관됩니다.
              </p>
            </div>

            <div className="sfa-rpt-insight info">
              <h3>오판 5. 유학생 12명은 충원 카드가 아니라 학사 리스크입니다</h3>
              <p className="sfa-rpt-p">
                학위(A) {SNAPSHOT.foreignA}명, 공동(B)·연수(C) 0명, 재적 대비 {SNAPSHOT.foreignShare}%.
                언어능력 충족률 {SNAPSHOT.lang}%는 12명 중 약 1명만 기준을 맞춘 수준입니다.
                학위·전체 탈락률 0.0%는 표본이 작아 「관리 성공」으로 읽을 수 없습니다.
                지금 단계에서 유학생 모집을 늘리면, 충원율은 거의 안 오르고 수업 질·비자·중도탈락 리스크만 커집니다.
              </p>
            </div>

            <h2 id="sec-dx" className="sfa-rpt-h2" style={{ scrollMarginTop: 48 }}>
              2. 핵심진단 — 대학이 직면한 문제
            </h2>
            <div className="sfa-rpt-dx">
              <section className="sfa-rpt-dx-card crisis">
                <span className="sfa-rpt-badge crisis">심각 · 구조</span>
                <h3 className="sfa-rpt-h3" style={{ marginTop: 0 }}>
                  진단 A. 「충원보통」 단계에 가려진 수요 축소
                </h3>
                <p className="sfa-rpt-p">
                  핵심 문제는 95.8%가 아닙니다. −8.1% 모집 축소로 분모를 깎아 단계를 유지한 점입니다.
                  동남권 소규모 사립에서 이 패턴이 2~3년 반복되면, 학과 최소 운영 규모가 무너진 뒤에야 충원율이 급락합니다.
                  조치하지 않으면 2026~2027 신입 모집을 다시 줄여 「숫자 관리」를 반복할 가능성이 큽니다.
                </p>
              </section>
              <section className="sfa-rpt-dx-card crisis">
                <span className="sfa-rpt-badge crisis">심각 · 누수</span>
                <h3 className="sfa-rpt-h3" style={{ marginTop: 0 }}>
                  진단 B. 1학년 정착 실패가 재학생충원의 선행지표
                </h3>
                <p className="sfa-rpt-p">
                  신입 탈락 {SNAPSHOT.freshmanDropRate}%는 전체 {SNAPSHOT.dropoutRate}%를 웃돕니다.
                  상담 확대만으로는 출석 붕괴·기초학력·원거리 통학 이탈이 잡히지 않습니다.
                  1학년에서 42명이 빠지는 구조가 고정되면, 재학생충원 91.2%는 내년에도 하방입니다.
                </p>
              </section>
              <section className="sfa-rpt-dx-card warn">
                <span className="sfa-rpt-badge warn">경고 · 구성</span>
                <h3 className="sfa-rpt-h3" style={{ marginTop: 0 }}>
                  진단 C. 정원내 재학 공동화 + 휴학 과다
                </h3>
                <p className="sfa-rpt-p">
                  재학생 정원내 82.2%는 내외 91.2%와 따로 공시되어야 하는 위험 신호입니다.
                  휴학 16.9%와 겹치면 「들어와 있는 정원내 학생」이 실제로 수업에 남아 있는 비율은 더 낮습니다.
                  정원외 160명에 의존해 재학생충원율을 받치면, 정원 조정·재정지원 평가에서 취약해집니다.
                </p>
              </section>
              <section className="sfa-rpt-dx-card warn">
                <span className="sfa-rpt-badge warn">경고 · 국제</span>
                <h3 className="sfa-rpt-h3" style={{ marginTop: 0 }}>
                  진단 D. 유학 규모 확대 금지, 언어능력 8.3%부터 시정
                </h3>
                <p className="sfa-rpt-p">
                  12명 규모의 학위과정은 충원 전략이 될 수 없습니다.
                  언어능력 미충족이 다수인 상태에서 모집만 늘리면 학사경고·비자 리스크가 먼저 옵니다.
                </p>
              </section>
            </div>

            <h2 id="sec-action" className="sfa-rpt-h2" style={{ scrollMarginTop: 48 }}>
              3. 대응과제 — 실행 단위로 쪼개기
            </h2>
            <p className="sfa-rpt-p">
              아래는 「프로그램 확대」가 아니라, 누가·몇 명에게·몇 주에·얼마로 돌릴지를 고정한 목업 과제입니다.
              예산은 재학생 1,610명·신입 약 400명 규모 사립 단과 운영을 전제로 한 연간 추정치입니다.
            </p>

            <article className="sfa-rpt-action">
              <h3 className="sfa-rpt-h3" style={{ marginTop: 0 }}>
                과제 1. 모집축소 효과 분리 후 학과 정원 재배분 (2025.3분기~2026 모집요강)
              </h3>
              <p className="sfa-rpt-p">
                기획처가 학과×전형(수시/정시/정원외) 3년 매트릭스를 만듭니다. 행은 학과, 열은 모집·입학·등록률·미충원.
                「충원율 개선분」을 (a) 모집인원 감소 효과 (b) 실수요 회복으로 분해합니다.
                3년 연속 정원내 충원율 90% 미만이거나 등록률이 합격자의 70% 미만인 학과는 2027학년 정원 5~10% 감축안을
                교무위원회에 상정합니다. 감축분은 최근 2년 정원내 충원율 98% 이상 학과로만 재배분합니다.
                정원외 전형은 학위 외국인과 분리해 요강에 표기합니다.
              </p>
              <ol className="sfa-rpt-ol">
                <li>8월: 원자료 추출·모집축소 기여도 계산식 확정 (충원율 변동 = 분모효과 + 분자효과).</li>
                <li>9월: 학과장 대면 설명회 1회, 이의 제기 2주.</li>
                <li>10월: 2027 정원 조정안 이사회 보고. 2026 모집은 총량 동결을 기본값으로 함(추가 축소 금지).</li>
              </ol>
              <div className="sfa-rpt-meta">
                <div>
                  <strong>주관</strong>기획처(총괄) · 교무처(정원) · 입학처(전형)
                </div>
                <div>
                  <strong>예산</strong>내부 TF 전용 + 권역 수요조사 외주 1,500만원
                </div>
                <div>
                  <strong>성과지표</strong>2026 모집 총량 ≥ 2025, 분모효과 기여도 공개
                </div>
                <div>
                  <strong>기대효과</strong>충원율 착시 제거, 미충원 학과 좌석 이전
                </div>
              </div>
            </article>

            <article className="sfa-rpt-action">
              <h3 className="sfa-rpt-h3" style={{ marginTop: 0 }}>
                과제 2. 「Freshman 8」 — 입학 후 8주 출석·기초학력 패키지
              </h3>
              <p className="sfa-rpt-p">
                상담 창구를 늘리지 않습니다. 1학년 전원의 출석·진단고사·통학거리를 한 체계로 묶습니다.
                대상은 {SNAPSHOT.year}학번 신입(약 414명)입니다.
              </p>
              <ol className="sfa-rpt-ol">
                <li>
                  0주차: 전공기초 진단(국어·수리·전공입문 40분). 하위 30%(약 120명)를 튜터링 대상으로 자동 편성.
                </li>
                <li>
                  튜터링: 재학생 튜터 40명 × 주 2회 × 8주. 튜터는 학과 성적 상위 20%만. 수당은 장학금 전용
                  (시급 1.2만원 × 16회 × 40명 ≈ 768만원) + 튜터 선발·교육 232만원 → 튜터 라인 약 1,000만원.
                  대상 학생은 주 2회 미참석 시 학과 조교가 당일 연락.
                </li>
                <li>
                  출석 경보: 동일 교과 2주 연속 결석 시 LMS에서 학과 조교·지도교수에게 알림.
                  48시간 내 대면 또는 화상 미실시 시 학사팀 에스컬레이션. 조교 수당 1,800만원(학기, 학과당 0.3~0.5명).
                </li>
                <li>
                  원거리 이탈: 입학 주소가 경남 외이거나 통학 90분 초과인 신입 중 희망자 80명에게 1학기 기숙사 우선.
                  빈 침상 재배치가 원칙이며, 신규 기숙사 건축은 하지 않음.
                </li>
              </ol>
              <div className="sfa-rpt-meta">
                <div>
                  <strong>주관</strong>학생처 · 각 학과 조교 · 전산(LMS 규칙)
                </div>
                <div>
                  <strong>예산</strong>연 약 5,000만원 (튜터 1,000 + 조교 1,800 + LMS 800 + 운영 1,400)
                </div>
                <div>
                  <strong>성과지표</strong>신입 탈락율 11.4% → 8.0% 이하 (약 12명 잔류)
                </div>
                <div>
                  <strong>기대효과</strong>잔류 12명 × 연 등록금 약 800만원 ≈ 수입 9,600만원 방어
                </div>
              </div>
            </article>

            <article className="sfa-rpt-action">
              <h3 className="sfa-rpt-h3" style={{ marginTop: 0 }}>
                과제 3. 휴학 327명 전수 복학설계 — 「16주 복귀 창구」
              </h3>
              <p className="sfa-rpt-p">
                휴학 사유를 군입대·질병·경제·학업부진 4코드로만 재분류합니다(기타 금지).
                1년 초과 휴학생은 학과장이 배정받은 명단으로 3주 내 전화 접촉 100%를 목표로 합니다.
                복학 당해 학기는 최소 9학점 수강을 허용하고, 등록금은 3회 분납(위약금 없음)합니다.
                학업부진 휴학자는 Freshman 8과 같은 튜터 라인에 복학 첫 8주를 강제 연결합니다.
              </p>
              <ol className="sfa-rpt-ol">
                <li>계약직 복학코디네이터 1명(주 5일)이 명단·통화·복학원서 마감을 관리.</li>
                <li>복학 장학: 학기당 최대 50명 × 50만원(생활비가 아닌 등록 바우처, 분납 1회차 상계).</li>
                <li>3학기 연속 미복학은 제적 예고 통지. 「무기한 휴학」을 닫습니다.</li>
              </ol>
              <div className="sfa-rpt-meta">
                <div>
                  <strong>주관</strong>교무처 학사 · 학과장
                </div>
                <div>
                  <strong>예산</strong>코디 인건비 3,600만원 + 복학 바우처 2,500만원 = 6,100만원
                </div>
                <div>
                  <strong>성과지표</strong>휴학비중 16.9% → 13.0% (약 75명 수업 복귀)
                </div>
                <div>
                  <strong>기대효과</strong>재학생충원 분자 회복, 탈락 이관 지연
                </div>
              </div>
            </article>

            <article className="sfa-rpt-action">
              <h3 className="sfa-rpt-h3" style={{ marginTop: 0 }}>
                과제 4. 정원외 재학 캡 — 학과 단위 12%
              </h3>
              <p className="sfa-rpt-p">
                교무처가 매 학기 학과별 정원외 재학생 비중을 공개합니다. 12%를 넘는 학과는 다음 학년도 정원외 모집을 0으로 두고,
                미충원 정원내 좌석을 먼저 채웁니다. 신입 정원외 비중 {SNAPSHOT.outShare}%는 낮지만, 재학 스톡 {SNAPSHOT.enrolledOutShare}%가
                이미 높으므로 「신입은 괜찮다」고 넘어가지 않습니다.
                비용은 요강 개정·통계 공표이며 별도 사업비는 거의 들지 않습니다.
              </p>
              <div className="sfa-rpt-meta">
                <div>
                  <strong>주관</strong>교무처 · 입학처
                </div>
                <div>
                  <strong>예산</strong>0~200만원 (공시 표 개편)
                </div>
                <div>
                  <strong>성과지표</strong>학과 최대 정원외 재학 비중 ≤ 12%
                </div>
                <div>
                  <strong>기대효과</strong>정원내 82.2%와 내외 91.2% 격차 축소
                </div>
              </div>
            </article>

            <article className="sfa-rpt-action">
              <h3 className="sfa-rpt-h3" style={{ marginTop: 0 }}>
                과제 5. 학위 유학생 12명 언어 집중 — 모집 확대 모라토리엄 1년
              </h3>
              <p className="sfa-rpt-p">
                2026학년 학위과정 외국인 신입은 2025 재적 12명을 넘지 못하게 총량을 잠급니다.
                TOPIK 3 미만(또는 교내 동등 기준 미달)은 학기 시작 전 4주, 주 15시간 집중어학을 이수한 뒤에만 전공 수강을 엽니다.
                시간강사 한국어 1명(4주+학기 중 주 4시간)으로 운영하고, 전임 채용은 하지 않습니다.
              </p>
              <div className="sfa-rpt-meta">
                <div>
                  <strong>주관</strong>국제교류 · 교무(수강 제한)
                </div>
                <div>
                  <strong>예산</strong>강사 800만원 + 교재 100만원 = 900만원
                </div>
                <div>
                  <strong>성과지표</strong>언어능력 충족률 8.3% → 70% (8/12명)
                </div>
                <div>
                  <strong>기대효과</strong>학사·비자 리스크 차단, 허위 국제화 지표 방지
                </div>
              </div>
            </article>

            <h2 id="sec-budget" className="sfa-rpt-h2" style={{ scrollMarginTop: 48 }}>
              4. 예산 묶음과 우선순위
            </h2>
            <p className="sfa-rpt-p">
              1년 현금 지출 합계는 약 1.35억원(과제 1~3·5)입니다. 과제 2의 잔류 효과만으로도 등록금 수입 방어가
              사업비를 상회하도록 설계했습니다. 우선순위는 ①Freshman 8(누수 차단) ②모집 총량 동결·정원 재배분(착시 제거)
              ③휴학 복귀 ④정원외 캡 ⑤유학생 언어입니다. 유학생 모집 확대와 신규 기숙사 신축은 이 보고서에서 제외합니다.
            </p>
            <p className="sfa-rpt-p">
              이사회 보고 문장은 다음 한 줄로 고정하는 것을 권합니다.
              「충원율 95.8%는 모집 축소로 방어된 수치이며, 실질 과제는 1학년 탈락 11.4%와 휴학 16.9%, 정원내 재학 82.2%이다.」
            </p>

            <footer className="sfa-rpt-footer">
              학생충원분석 심층보고서 목업 · {SNAPSHOT.school} 예시 · 생성 가정일 2026-08-28
              · 프로덕션 진단 API·저장 보고서와 연결하지 않음
            </footer>
          </div>
        </article>
      </div>
    </StudentFillMockShell>
  );
}
