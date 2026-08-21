import type { Metadata } from "next";

import { TableRowDensityMock } from "./TableRowDensityMock";

export const metadata: Metadata = {
  title: "대학별DB 표 — 행 높이 통일 목업",
  description:
    "전 메뉴 thead·tbody 행 높이 py-1.5 통일 시안 (~80%, 프로덕션 미적용)",
};

export default function TableRowDensityMockPage() {
  return <TableRowDensityMock />;
}
