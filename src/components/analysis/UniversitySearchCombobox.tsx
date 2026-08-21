"use client";

import { useEffect, useId, useRef, useState } from "react";

import {
  formatUniversitySearchLabel,
  searchUniversities,
} from "@/lib/data/university-search";
import type { UniversityLocationRow } from "@/lib/ingest/university-locations-config";
import { schoolMarkerId } from "@/lib/map/types";

type UniversitySearchComboboxProps = {
  schools: UniversityLocationRow[];
  onSelect: (school: UniversityLocationRow) => void;
  className?: string;
  compact?: boolean;
};

export function UniversitySearchCombobox({
  schools,
  onSelect,
  className,
  compact = false,
}: UniversitySearchComboboxProps) {
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const results = searchUniversities(query, schools);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  function chooseSchool(school: UniversityLocationRow) {
    onSelect(school);
    setQuery("");
    setOpen(false);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (event.key === "ArrowDown" || event.key === "Enter")) {
      if (results.length > 0) setOpen(true);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, results.length - 1));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
      return;
    }

    if (event.key === "Enter" && results[activeIndex]) {
      event.preventDefault();
      chooseSchool(results[activeIndex]);
      return;
    }

    if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full max-w-md ${className ?? ""}`}
    >
      <label htmlFor={`${listboxId}-input`} className="sr-only">
        대학 검색
      </label>
      <input
        id={`${listboxId}-input`}
        type="search"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          if (query.trim()) setOpen(true);
        }}
        onKeyDown={handleKeyDown}
        placeholder='대학명 키워드 검색 (예: "단국대", "서울대")'
        className={
          compact
            ? "h-[26px] w-full rounded-md border border-border bg-surface-2 px-2.5 py-0 text-xs text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
            : "w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
        }
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
      />

      {open && query.trim() ? (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-border bg-surface py-1 shadow-lg"
        >
          {results.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted">검색 결과가 없습니다.</li>
          ) : (
            results.map((school, index) => (
              <li key={schoolMarkerId(school)} role="option" aria-selected={index === activeIndex}>
                <button
                  type="button"
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => chooseSchool(school)}
                  className={`flex w-full flex-col px-3 py-2 text-left text-sm ${
                    index === activeIndex
                      ? "bg-accent/10 text-foreground"
                      : "text-foreground hover:bg-surface-2"
                  }`}
                >
                  <span className="font-medium">
                    {formatUniversitySearchLabel(school)}
                  </span>
                  <span className="mt-0.5 text-[11px] text-muted">
                    {school.schoolType} · {school.establishment}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
