import { FileSpreadsheet } from "lucide-react";

import "./glass-help-button.css";

export function ExcelUploadButton({
  onClick,
  className = "",
  type = "button",
  variant = "default",
  disabled = false,
}: {
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit";
  variant?: "default" | "emerald";
  disabled?: boolean;
}) {
  const label = variant === "emerald" ? "엑셀 업로드" : "엑셀업로드";

  if (variant === "emerald") {
    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={`glass-db-down-btn ${className}`.trim()}
      >
        <span className="glass-db-down-btn-core">
          <FileSpreadsheet size={12} strokeWidth={2.6} aria-hidden />
          {label}
        </span>
      </button>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`excel-upload-btn ${className}`.trim()}
    >
      <FileSpreadsheet size={13} strokeWidth={2.4} aria-hidden />
      {label}
    </button>
  );
}
