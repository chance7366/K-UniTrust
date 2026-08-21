"use client";

import type { ReactNode } from "react";

import "./glass-help-button.css";

export function GlassHelpButton({
  active,
  onClick,
  tone = "green",
  size = "md",
}: {
  active: boolean;
  onClick: () => void;
  tone?: "green" | "blue" | "amber";
  size?: "sm" | "md";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={active}
      aria-label={active ? "도움말 닫기" : "도움말 열기"}
      className={`glass-help-btn glass-help-btn--${tone}${size === "sm" ? " glass-help-btn--sm" : ""}${active ? " is-active" : ""}`}
    >
      <span className="glass-help-btn-core" aria-hidden>
        ?
      </span>
    </button>
  );
}

export function GlassActionButton({
  children,
  onClick,
  disabled,
  title,
  tone = "blue",
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  tone?: "green" | "blue" | "orange";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`glass-save-btn shrink-0${tone === "blue" ? "" : ` glass-save-btn--${tone}`}`}
    >
      <span className="glass-save-btn-core">{children}</span>
    </button>
  );
}

export function GlassHelpButtonPreview({
  active,
  onClick,
}: {
  active: boolean;
  onClick: () => void;
}) {
  return (
    <div className="glass-help-preview">
      <GlassHelpButton active={active} onClick={onClick} />
    </div>
  );
}
