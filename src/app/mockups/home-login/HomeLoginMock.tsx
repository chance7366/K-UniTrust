"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, LogOut } from "lucide-react";

import { SidebarBrandLogoMark } from "@/components/layout/SidebarBrand";

import "@/components/home/home-intro.css";
import "./home-login-mock.css";

type Role = "admin" | "user";

export function HomeLoginMock() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [session, setSession] = useState<{ role: Role; roleLabel: string } | null>(
    null,
  );

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        role?: Role;
        roleLabel?: string;
        error?: string;
      };
      if (!res.ok || !json.role || !json.roleLabel) {
        setError(json.error ?? "비밀번호가 올바르지 않습니다.");
        return;
      }
      setSession({ role: json.role, roleLabel: json.roleLabel });
      setPassword("");
    } catch {
      setError("비밀번호를 확인하지 못했습니다.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="him-page">
      <div className="him-root">
        <div className="him-bg-dots" aria-hidden />
        <div className="him-bg-blur-green" aria-hidden />
        <div className="him-bg-blur-blue" aria-hidden />

        <div className="him-mock-banner" role="note">
          <span>
            <strong>UI 목업</strong> — 시작페이지 비밀번호(관리자/사용자). 프로덕션{" "}
            <code className="rounded bg-white/70 px-1">/</code> 에는 아직 적용하지
            않습니다.
          </span>
          <Link
            href="/"
            className="font-semibold text-[#2a7a55] underline-offset-2 hover:underline"
          >
            프로덕션 홈 →
          </Link>
        </div>

        <div className="him-content hlm-content">
          <div className="him-inner">
            <div className="him-brand-row him-animate him-delay-0">
              <div className="him-brand-mark-slot" aria-hidden>
                <SidebarBrandLogoMark size={40} />
              </div>
              <span className="him-brand-wordmark font-brand">K-UniTrust</span>
            </div>

            <h1 className="mb-0">
              <span className="him-title him-title-gradient-green-blue him-animate him-delay-1 block">
                사립 대학·전문대학의 현황과 재정경쟁력을
                <br />
                K-UniTrust에서 조회하고 분석하세요
              </span>
            </h1>

            <p className="him-sub him-animate him-delay-2">
              아이디 없이 비밀번호만 입력합니다. 관리자는 전 권한, 사용자는 엑셀
              업로드와 경쟁력·추계분석의 일부 권한입니다. 메뉴별 사용자 권한은 이후
              정합니다.
            </p>

            {session ? (
              <div className="hlm-signed him-animate him-delay-3">
                <p className="hlm-role-kicker">접속됨 (목업)</p>
                <p className="hlm-role-name">
                  {session.roleLabel}
                  <span className="hlm-role-code">{session.role}</span>
                </p>
                <p className="hlm-role-note">
                  {session.role === "admin"
                    ? "모든 메뉴·업로드·설정·실행을 사용할 수 있는 역할입니다."
                    : "엑셀 업로드, 대학경쟁력분석, 재정추계분석의 일부만 사용할 역할입니다. 세부 권한은 아직 적용하지 않았습니다."}
                </p>
                <div className="him-actions">
                  <button
                    type="button"
                    className="him-btn-start"
                    onClick={() => setSession(null)}
                  >
                    비밀번호 화면으로
                    <LogOut size={18} aria-hidden />
                  </button>
                </div>
              </div>
            ) : (
              <form className="hlm-form him-animate him-delay-3" onSubmit={onSubmit}>
                <label className="hlm-label" htmlFor="hlm-password">
                  비밀번호
                </label>
                <div className="hlm-row">
                  <input
                    id="hlm-password"
                    type="password"
                    name="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="비밀번호 입력"
                    className="hlm-input"
                  />
                  <button
                    type="submit"
                    className="him-btn-start hlm-submit"
                    disabled={pending || !password.trim()}
                  >
                    {pending ? "확인 중…" : "들어가기"}
                    <ArrowRight size={18} aria-hidden />
                  </button>
                </div>
                {error ? (
                  <p className="hlm-error" role="alert">
                    {error}
                  </p>
                ) : (
                  <p className="hlm-hint">.env 의 관리자·사용자 비밀번호로 구분합니다.</p>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
