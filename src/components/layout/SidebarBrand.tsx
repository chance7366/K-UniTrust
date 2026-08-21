/** Soft Mint 사이드바 브랜드 */
export function SidebarBrandLogoMark({ size = 40 }: { size?: number }) {
  const icon = Math.round(size * 0.55);
  return (
    <div
      className="relative shrink-0 sidebar-brand-mark"
      style={{ width: size, height: size }}
    >
      <div className="sidebar-brand-mark-glow absolute inset-0 rounded-full opacity-60 blur-md" />
      <div
        className="sidebar-brand-mark-ring relative flex h-full w-full items-center justify-center rounded-[12px] border border-[#3b9a6a]/35 shadow-[0_4px_12px_rgba(42,122,85,0.28),inset_0_1px_0_rgba(255,255,255,0.45)]"
        style={{
          background:
            "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.5), transparent 48%), linear-gradient(155deg, #6fd0a0 0%, #3b9a6a 48%, #287a54 100%)",
        }}
      >
        <svg
          width={icon}
          height={icon}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
        >
          <path
            d="M12 2L4 7v10l8 5 8-5V7L12 2z"
            stroke="#ffffff"
            strokeWidth="1.5"
            fill="rgba(255, 255, 255, 0.12)"
          />
          <circle cx="12" cy="12" r="2.5" fill="#FFD24A" />
        </svg>
      </div>
    </div>
  );
}

export function SidebarBrand() {
  return (
    <div className="flex items-center gap-3">
      <SidebarBrandLogoMark size={42} />
      <div className="min-w-0">
        <h1
          className="font-brand text-[1.55rem] font-extrabold leading-none tracking-[-0.03em]"
          style={{
            background:
              "linear-gradient(115deg, #1f6b4a 0%, #3b9a6a 35%, #1f8fe0 70%, #3db5ff 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            filter: "drop-shadow(0 1px 0 rgba(255,255,255,0.65))",
          }}
        >
          K-UniTrust
        </h1>
        <div className="mt-1.5">
          <span className="inline-block rounded-full border border-[#3b9a6a]/30 bg-[#e7f6ee] px-2 py-0.5 text-[10px] font-bold tracking-[0.06em] text-[#2a7a55] uppercase">
            Dashboard
          </span>
        </div>
      </div>
    </div>
  );
}
