"use client";

import { Download, EyeOff, FileSpreadsheet } from "lucide-react";

import { GlassHelpButton } from "@/components/analysis/GlassHelpButton";
import { useCanUploadExcel } from "@/components/auth/AccessRoleProvider";

import "./glass-help-button.css";

export function UploadPanelTemplateLink({
  href,
  download,
  children = "양식down",
}: {
  href: string;
  download: string;
  children?: React.ReactNode;
}) {
  return (
    <a href={href} download={download} className="glass-db-down-btn">
      <span className="glass-db-down-btn-core">
        <Download size={12} strokeWidth={2.6} aria-hidden />
        {children}
      </span>
    </a>
  );
}

export function UploadPanelSelectButton({
  disabled,
  pending,
  onClick,
}: {
  disabled?: boolean;
  pending?: boolean;
  onClick: () => void;
}) {
  const canUpload = useCanUploadExcel();
  const blocked = !canUpload;
  return (
    <button
      type="button"
      disabled={disabled || blocked}
      title={blocked ? "관리자만 데이터를 업로드할 수 있습니다." : undefined}
      onClick={onClick}
      className="glass-db-down-btn glass-db-down-btn--sky"
    >
      <span className="glass-db-down-btn-core">
        {!pending ? <FileSpreadsheet size={12} strokeWidth={2.6} aria-hidden /> : null}
        {pending ? "업로드 중…" : "엑셀 파일 선택"}
      </span>
    </button>
  );
}

export function UploadPanelHideButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="glass-db-down-btn glass-db-down-btn--slate">
      <span className="glass-db-down-btn-core">
        <EyeOff size={12} strokeWidth={2.6} aria-hidden />
        숨기기
      </span>
    </button>
  );
}

export function UploadPanelHelpButton({
  active,
  onClick,
}: {
  active: boolean;
  onClick: () => void;
}) {
  return <GlassHelpButton active={active} onClick={onClick} tone="amber" size="sm" />;
}
