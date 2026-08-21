"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { SidebarBrand } from "@/components/layout/SidebarBrand";
import {
  ICON_GALLERY_SECTIONS,
  SHOWCASE_BRAND_ICONS,
  SIDEBAR_SECTIONS,
  TONE_CLASS,
  type SidebarSubItem,
} from "./sidebar-icons-data";
import "./sidebar-icons.css";

function MenuIcon({
  icon: Icon,
  className = "text-emerald-600",
  size = 14,
}: {
  icon: LucideIcon;
  className?: string;
  size?: number;
}) {
  return <Icon className={className} size={size} strokeWidth={2.2} aria-hidden />;
}

function SidebarMenuItem({
  item,
  compact = false,
}: {
  item: SidebarSubItem;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      className={`si-k-menu-item flex w-full items-center gap-2 rounded-xl text-left ${
        item.active ? "active font-bold" : "font-semibold text-slate-700"
      } ${compact ? "rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-slate-600" : "px-3 py-2"}`}
    >
      <MenuIcon
        icon={item.icon}
        className={item.active ? "text-white" : item.iconClass ?? "text-emerald-600"}
        size={compact ? 12 : 14}
      />
      {item.label}
    </button>
  );
}

function SidebarPreview() {
  const { chevron } = SHOWCASE_BRAND_ICONS;

  return (
    <div className="flex w-64 flex-col overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
      <div className="bg-glow-sidebar-brand border-b border-border px-5 py-5">
        <SidebarBrand />
      </div>
      <div className="si-k-sidebar flex-1 space-y-4 p-4 text-xs shadow-inner">
      {SIDEBAR_SECTIONS.map((section) => (
        <div key={section.id} className="space-y-1.5 pt-1 first:pt-0">
          <div className="flex items-center justify-between px-1 py-1 font-bold text-emerald-900">
            <span className="flex items-center gap-1.5 text-xs">
              <MenuIcon icon={section.icon} className="text-emerald-700" size={16} />
              {section.label}
            </span>
            <MenuIcon icon={chevron} className="text-emerald-600" size={14} />
          </div>

          <div className="space-y-1 pl-1">
            {section.flatItems?.map((item) => (
              <SidebarMenuItem key={item.id} item={item} />
            ))}

            {section.groups?.map((group) => (
              <div key={group.id} className="space-y-1">
                <button
                  type="button"
                  className="si-k-menu-item flex w-full items-center justify-between rounded-xl px-3 py-2 text-left font-bold text-slate-800"
                >
                  <span className="flex items-center gap-2">
                    <MenuIcon icon={group.icon} size={14} />
                    {group.label}
                  </span>
                </button>
                <div className="si-sub-bar-line ml-3.5 space-y-1 pl-2.5">
                  {group.items.map((item) => (
                    <SidebarMenuItem key={item.id} item={item} compact />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      </div>
    </div>
  );
}

function IconGallery() {
  return (
    <div className="space-y-6">
      {ICON_GALLERY_SECTIONS.map((section) => {
        const SectionIcon = section.sectionIcon;
        return (
          <div
            key={section.title}
            className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <h3 className="flex items-center gap-2 border-b border-slate-100 pb-2 text-xs font-bold uppercase tracking-wider text-emerald-700">
              <SectionIcon className="h-4 w-4" strokeWidth={2.2} />
              {section.title}
            </h3>
            <div className={`grid grid-cols-1 gap-3 ${section.cols}`}>
              {section.items.map((item) => {
                const tone = TONE_CLASS[item.tone ?? "emerald"];
                const ItemIcon = item.icon;
                return (
                  <div
                    key={item.label}
                    className={`flex items-center gap-3 rounded-xl border p-3 ${tone.card}`}
                  >
                    <div className={`rounded-xl p-2.5 ${tone.icon}`}>
                      <ItemIcon className="h-5 w-5" strokeWidth={2.2} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">{item.label}</div>
                      <div className="font-mono text-[11px] text-slate-500">
                        `{item.lucideName}`
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function SidebarIconsShowcase() {
  const SidebarIcon = SHOWCASE_BRAND_ICONS.sidebar;

  return (
    <div className="si-root p-6 antialiased">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold text-amber-900">
              목업 갤러리 — 프로덕션 사이드바에는 Lucide 아이콘이 적용되었습니다
            </p>
            <Link href="/analysis/finance-analysis?tab=fund-secure-rate" className="font-bold text-emerald-700 hover:text-emerald-900">
              현재 앱 사이드바 보기 →
            </Link>
          </div>
        </div>

        <header className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                K-UniTrust 디자인 시스템
              </span>
              <h1 className="text-xl font-extrabold text-slate-900">
                사이드바 메뉴 아이콘 리뉴얼 미리보기
              </h1>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              다이아몬드/원형 아이콘 대신 메뉴별 의미에 직관적으로 부합하는 Lucide 벡터
              아이콘을 적용한 시각화 가이드입니다.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">아이콘 라이브러리:</span>
            <span className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-1 font-mono text-xs font-bold text-slate-700">
              Lucide React
            </span>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <SidebarIcon className="h-4 w-4 text-emerald-600" strokeWidth={2.2} />
                적용 후 사이드바 미리보기
              </h2>
              <span className="rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                실제 비율 1:1
              </span>
            </div>
            <SidebarPreview />
          </div>

          <div className="lg:col-span-8">
            <IconGallery />
          </div>
        </div>
      </div>
    </div>
  );
}
