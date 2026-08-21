import type { Metadata } from "next";

import { Step3DetailTableUiMock } from "./Step3DetailTableUiMock";

export const metadata: Metadata = {
  title: "3단계 세부지수 테이블 목업",
  description:
    "분석실행 3단계 — 종합순위·진단등급 2줄 헤더, 진단등급을 대학명 우측으로 이동, 부문 세부지수 표시 제안",
};

export default function Step3DetailTableMockPage() {
  return <Step3DetailTableUiMock />;
}
