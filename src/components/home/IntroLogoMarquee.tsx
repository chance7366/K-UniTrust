"use client";

import { useEffect, useMemo, useState } from "react";

import type { UniversityLogosManifest } from "@/lib/university-logos-manifest";

import "./intro-logo-marquee.css";

type ApiLogoListResponse = {
  total?: number;
  displayedPerRow?: number;
  rows?: number[][];
  error?: string;
};

function LogoImage({
  src,
  priority,
}: {
  src: string;
  priority?: boolean;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      draggable={false}
      fetchPriority={priority ? "high" : "low"}
    />
  );
}

function MarqueeRow({
  sources,
  durationSec,
  rowIndex,
}: {
  sources: string[];
  durationSec: number;
  rowIndex: number;
}) {
  const loop = useMemo(() => [...sources, ...sources], [sources]);

  if (!sources.length) return null;

  return (
    <div className="ilm-row-wrap" aria-hidden>
      <div
        className="ilm-row-track"
        style={{ animationDuration: `${durationSec}s` }}
      >
        {loop.map((src, i) => (
          <div key={`${src}-${i}`} className="ilm-logo-cell">
            <LogoImage src={src} priority={rowIndex === 0 && i < 6} />
          </div>
        ))}
      </div>
    </div>
  );
}

function apiLogoSrc(index: number): string {
  return `/api/university-logos/${index}`;
}

async function fetchManifestFallback(): Promise<UniversityLogosManifest | null> {
  const res = await fetch("/university-logos/manifest.json");
  if (res.ok) {
    const data = (await res.json()) as UniversityLogosManifest;
    if (data.rows?.length === 3) return data;
  }

  const apiRes = await fetch("/api/university-logos/list");
  const apiData = (await apiRes.json()) as ApiLogoListResponse;
  if (!apiRes.ok || !apiData.rows) {
    throw new Error(apiData.error ?? "로고 목록 로드 실패");
  }

  return {
    total: apiData.total ?? 0,
    displayedPerRow: apiData.displayedPerRow ?? 0,
    generatedAt: "",
    rows: apiData.rows.map((row) => row.map((index) => apiLogoSrc(index))),
  };
}

export function IntroLogoMarquee({
  initialManifest = null,
}: {
  initialManifest?: UniversityLogosManifest | null;
}) {
  const [manifest, setManifest] = useState<UniversityLogosManifest | null>(
    initialManifest,
  );
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    initialManifest ? "ready" : "loading",
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialManifest) return;

    let cancelled = false;
    async function load() {
      try {
        const data = await fetchManifestFallback();
        if (cancelled) return;
        if (!data) throw new Error("로고 manifest가 없습니다.");
        setManifest(data);
        setStatus("ready");
      } catch (err) {
        if (cancelled) return;
        setStatus("error");
        setError(
          err instanceof Error ? err.message : "로고 목록을 불러오지 못했습니다.",
        );
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [initialManifest]);

  if (status === "loading") {
    return (
      <div className="ilm-section" aria-hidden>
        <div className="ilm-rows ilm-rows-skeleton">
          <div className="ilm-row-skeleton" />
          <div className="ilm-row-skeleton" />
          <div className="ilm-row-skeleton" />
        </div>
      </div>
    );
  }

  if (status === "error" || !manifest) {
    return (
      <div className="ilm-section" role="note">
        <p className="ilm-error">{error ?? "로고를 불러오지 못했습니다."}</p>
      </div>
    );
  }

  const rows = manifest.rows;

  return (
    <section className="ilm-section" aria-label="참여 대학 로고">
      <div className="ilm-fade ilm-fade-left" aria-hidden />
      <div className="ilm-fade ilm-fade-right" aria-hidden />
      <div className="ilm-rows">
        <MarqueeRow sources={rows[0] ?? []} durationSec={240} rowIndex={0} />
        <MarqueeRow sources={rows[1] ?? []} durationSec={210} rowIndex={1} />
        <MarqueeRow sources={rows[2] ?? []} durationSec={225} rowIndex={2} />
      </div>
      <p className="ilm-caption">
        {manifest.displayedPerRow}개×3행 (전체 {manifest.total}개교) · 정적 WebP
        썸네일
      </p>
    </section>
  );
}
