"use client";

import { useState } from "react";

import { GlassHelpButtonPreview } from "@/components/analysis/GlassHelpButton";

export default function GlassHelpButtonMockPage() {
  const [active, setActive] = useState(false);

  return (
    <main className="min-h-screen bg-[#eef4ef] p-8 text-slate-700">
      <div className="mx-auto max-w-xl">
        <p className="text-sm text-slate-500">시안 · 신입생충원율 대학별DB 도움말</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-800">유리 링 + 파란 돔 도움말 버튼</h1>
        <p className="mt-2 text-sm text-slate-500">
          첨부 이미지와 같이 바깥 유리 링, 안쪽 파란 코어, 가운데 ? 로 맞춘 미리보기입니다.
        </p>
        <div className="mt-6">
          <GlassHelpButtonPreview
            active={active}
            onClick={() => setActive((value) => !value)}
          />
        </div>
        <p className="mt-4 text-center text-sm text-slate-500">
          {active ? "도움말 열림 (눌린 상태)" : "도움말 닫힘 · 호버·클릭으로 확인"}
        </p>
      </div>
    </main>
  );
}
