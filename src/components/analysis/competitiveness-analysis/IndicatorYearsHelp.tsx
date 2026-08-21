"use client";

import { GlassHelpButton } from "@/components/analysis/GlassHelpButton";
import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";

export function IndicatorYearsHelpPanel({ onClose }: { onClose: () => void }) {
  return (
    <section className="mb-4 rounded-xl border border-accent/30 bg-surface-2/50 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-accent">
            적용연도 도움말
          </p>
          <h3 className={`mt-1 ${FDB_TYPO.panelTitle}`}>
            지표별 공시시기 · 기준연도 · 선택 예시
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-muted hover:text-foreground"
        >
          닫기
        </button>
      </div>

      <div className="mt-4 max-h-[480px] space-y-5 overflow-y-auto pr-1 text-sm">
        <div>
          <h4 className="font-semibold text-foreground">
            지표별 공시시기와 기준연도
          </h4>
          <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-muted">
            <li>
              <span className="font-medium text-foreground">신입생충원율</span>
              {" · "}8월 공시, 당해연도
            </li>
            <li>
              <span className="font-medium text-foreground">재학생충원율</span>
              {" · "}8월 공시, 전년도 10.1 ~ 당해연도 4.1
            </li>
            <li>
              <span className="font-medium text-foreground">중도탈락율</span>
              {" · "}8월 공시, 전년도 3.1 ~ 당해연도 2월말
            </li>
            <li>
              <span className="font-medium text-foreground">자금확보율</span>
              {" · "}8월 공시, 전년도 결산
            </li>
            <li>
              <span className="font-medium text-foreground">재정지원수혜율</span>
              {" · "}8월 공시, 전년도 결산과 실적
            </li>
            <li>
              <span className="font-medium text-foreground">등록금의존율</span>
              {" · "}8월 공시, 전년도 결산
            </li>
            <li>
              <span className="font-medium text-foreground">수익용재산확보율</span>
              {" · "}10월 공시, 당해연도 평가액 · 전년도 결산
            </li>
            <li>
              <span className="font-medium text-foreground">전입금비율</span>
              {" · "}8월 공시, 전년도 결산
            </li>
            <li>
              <span className="font-medium text-foreground">
                신입생의 출신고등학교 유형별 현황
              </span>
              {" · "}6월 공시, 당해연도 입학자
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-foreground">분석연도 선택 예시</h4>
          <p className="mt-1 text-xs text-accent-orange">
            대학경쟁력분석은 최소한 10월 공시 이후 실시하여야 합니다.
          </p>
          <ul className="mt-2 space-y-2 text-xs leading-relaxed text-muted">
            <li>
              <span className="font-medium text-foreground">분석연도</span>
              {" · "}2025년도
            </li>
            <li>
              <span className="font-medium text-foreground">신입생충원율</span>
              {" · "}2025년 공시된 2025년도 신입생충원율
            </li>
            <li>
              <span className="font-medium text-foreground">재학생충원율</span>
              {" · "}2025년 공시된 2025년 상반기, 2024년 하반기 평균
            </li>
            <li>
              <span className="font-medium text-foreground">중도탈락율</span>
              {" · "}2025년 공시된 2024년 중도탈락율
            </li>
            <li>
              <span className="font-medium text-foreground">자금확보율</span>
              {" · "}2025년 공시된 2024년 결산
            </li>
            <li>
              <span className="font-medium text-foreground">재정지원수혜율</span>
              {" · "}2025년 공시된 2024년 재정지원실적과 2024년 결산 등록금수입
            </li>
            <li>
              <span className="font-medium text-foreground">등록금의존율</span>
              {" · "}2025년 공시된 2024년 결산
            </li>
            <li>
              <span className="font-medium text-foreground">수익용재산확보율</span>
              <ul className="mt-1 ml-4 list-disc space-y-1">
                <li>
                  10월 공시 전: 2024년 공시된 2024년 수익용재산 평가액과 2024년
                  결산 등록금수입
                </li>
                <li>
                  10월 공시 이후: 2025년 수익용재산 평가액과 2024년 결산
                  등록금수입
                </li>
              </ul>
            </li>
            <li>
              <span className="font-medium text-foreground">전입금비율</span>
              {" · "}2025년 공시된 2024년 결산
            </li>
            <li>
              <span className="font-medium text-foreground">
                신입생의 출신고등학교 유형별 현황
              </span>
              {" · "}2025년 공시된 당해연도 2025년 입학자 출신고 유형
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

export function IndicatorYearsHelpToggle({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) {
  return <GlassHelpButton active={open} onClick={onToggle} size="sm" />;
}
