"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight } from "lucide-react";

function readCapsLock(event: React.KeyboardEvent | React.FocusEvent) {
  return "getModifierState" in event && event.getModifierState("CapsLock");
}

export function HomePasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [focused, setFocused] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);

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
        error?: string;
        role?: "admin" | "user";
      };
      if (!res.ok) {
        setError(json.error ?? "비밀번호가 올바르지 않습니다.");
        return;
      }
      const { setLocalWorkspaceRole } = await import("@/lib/auth/local-workspace");
      setLocalWorkspaceRole(json.role ?? "user");
      setPassword("");
      router.refresh();
    } catch {
      setError("비밀번호를 확인하지 못했습니다.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="him-login-form him-animate him-delay-3" onSubmit={onSubmit}>
      <label className="him-login-label" htmlFor="him-password">
        비밀번호
      </label>
      <div className="him-login-row">
        <input
          id="him-password"
          type="password"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            if (error) setError(null);
          }}
          onFocus={(event) => {
            setFocused(true);
            setCapsLockOn(readCapsLock(event));
          }}
          onBlur={() => {
            setFocused(false);
            setCapsLockOn(false);
          }}
          onKeyDown={(event) => setCapsLockOn(readCapsLock(event))}
          onKeyUp={(event) => setCapsLockOn(readCapsLock(event))}
          placeholder="비밀번호 입력"
          className="him-login-input"
        />
        <button
          type="submit"
          className="him-btn-start him-login-submit focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#047857]"
          disabled={pending || !password.trim()}
        >
          {pending ? "확인 중…" : "들어가기"}
          <ArrowRight size={18} aria-hidden />
        </button>
      </div>
      {focused && capsLockOn ? (
        <p className="him-login-caps" role="status">
          Caps Lock이 켜져 있습니다. 대문자 입력 모드입니다.
        </p>
      ) : null}
      {error ? (
        <p className="him-login-error" role="alert">
          {error}
        </p>
      ) : (
        <p className="him-login-hint">관리자 또는 사용자 비밀번호를 입력하세요.</p>
      )}
    </form>
  );
}
