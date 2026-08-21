"use client";

import Link from "next/link";
import { BarChart3, Database, type LucideIcon } from "lucide-react";

import "./glass-help-button.css";

export type GlassMintTabItem<T extends string> = {
  id: T;
  label: string;
  icon?: LucideIcon;
  count?: string;
  href?: string;
};

function TabInner<T extends string>({
  item,
}: {
  item: GlassMintTabItem<T>;
}) {
  const Icon = item.icon;
  return (
    <>
      {Icon ? <Icon size={12} strokeWidth={2.6} aria-hidden /> : null}
      {item.label}
      {item.count != null ? (
        <span className="glass-mint-seg-count">{item.count}</span>
      ) : null}
    </>
  );
}

export function GlassMintTabGroup<T extends string>({
  items,
  active,
  onChange,
  ariaLabel,
}: {
  items: GlassMintTabItem<T>[];
  active: T;
  onChange?: (id: T) => void;
  ariaLabel?: string;
}) {
  return (
    <div className="glass-mint-seg" role="tablist" aria-label={ariaLabel}>
      {items.map((item) => {
        const isOn = active === item.id;
        const className = `glass-mint-seg-item${isOn ? " is-on" : ""}`;
        if (item.href) {
          return (
            <Link
              key={item.id}
              href={item.href}
              role="tab"
              aria-selected={isOn}
              className={className}
            >
              <TabInner item={item} />
            </Link>
          );
        }
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={isOn}
            className={className}
            onClick={() => onChange?.(item.id)}
          >
            <TabInner item={item} />
          </button>
        );
      })}
    </div>
  );
}

export function FinanceSectionTabRow({
  active,
  onChange,
}: {
  active: "data" | "charts";
  onChange: (section: "data" | "charts") => void;
}) {
  return (
    <GlassMintTabGroup
      active={active}
      onChange={onChange}
      items={[
        { id: "data", label: "대학별지표", icon: Database },
        { id: "charts", label: "통계분석", icon: BarChart3 },
      ]}
    />
  );
}
