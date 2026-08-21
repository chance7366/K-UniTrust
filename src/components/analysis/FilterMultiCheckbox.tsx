"use client";

import { useEffect, useRef, useState } from "react";

import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";

export function FilterMultiCheckbox({
  label,
  options,
  selected,
  onChange,
  emptyLabel = "전체",
  labelClassName = `shrink-0 ${FDB_TYPO.toolbarLabel}`,
  controlClassName = `flex min-w-[5.5rem] items-center gap-1 rounded-md border border-border bg-surface-2 px-2.5 py-1 text-foreground outline-none hover:border-accent/60 focus:border-accent ${FDB_TYPO.toolbarControl}`,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  emptyLabel?: string;
  labelClassName?: string;
  controlClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function toggle(value: string) {
    onChange(
      selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value],
    );
  }

  const summary =
    selected.length === 0
      ? emptyLabel
      : selected.length === 1
        ? selected[0]
        : `${selected[0]} 외 ${selected.length - 1}`;

  return (
    <div ref={rootRef} className="relative flex items-center gap-2">
      <span className={labelClassName}>{label}</span>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={controlClassName}
        aria-expanded={open}
      >
        <span className="max-w-[8rem] truncate">{summary}</span>
        <span className="text-muted" aria-hidden>
          ▾
        </span>
      </button>
      {open ? (
        <div className="absolute left-0 top-full z-30 mt-1 min-w-[11rem] max-w-[16rem] rounded-md border border-border bg-surface p-2 shadow-lg">
          <label className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-xs hover:bg-surface-2">
            <input
              type="checkbox"
              checked={selected.length === 0}
              onChange={() => onChange([])}
              className="h-3.5 w-3.5 accent-accent"
            />
            <span>{emptyLabel}</span>
          </label>
          <div className="my-1 border-t border-border/60" />
          <div className="max-h-48 space-y-0.5 overflow-y-auto">
            {options.map((option) => (
              <label
                key={option}
                className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-xs hover:bg-surface-2"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(option)}
                  onChange={() => toggle(option)}
                  className="h-3.5 w-3.5 shrink-0 accent-accent"
                />
                <span className="min-w-0 break-words">{option}</span>
              </label>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
