import type { Metadata } from "next";

import { HomeLoginMock } from "./HomeLoginMock";

export const metadata: Metadata = {
  title: "시작페이지 비밀번호 — UI 목업 · K-UniTrust",
  description:
    "아이디 없이 비밀번호만으로 관리자/사용자를 구분하는 시작 화면 시안. 프로덕션 홈은 변경하지 않음.",
};

export default function HomeLoginMockPage() {
  return <HomeLoginMock />;
}
