import type { Metadata } from "next";

import { Step3TableUiMock } from "./Step3TableUiMock";
import "@/components/analysis/competitiveness-analysis/step3-composite-table.css";

export const metadata: Metadata = {
  title: "3단계 종합지수 테이블 목업",
  description:
    "분석실행 Step3 종합지수 — 통계분석형 테이블 UI (Step3CompositeResultsTable 공유 컴포넌트)",
};

export default function Step3TableMockPage() {
  return <Step3TableUiMock />;
}
