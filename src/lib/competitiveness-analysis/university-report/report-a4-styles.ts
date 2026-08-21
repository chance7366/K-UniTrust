/** A4 보고서 공통 CSS (화면 미리보기 + 인쇄) */
export function reportA4Styles(): string {
  return `
    :root {
      color-scheme: light;
      --a4-width: 210mm;
      --a4-height: 297mm;
      --a4-margin: 15mm;
      --a4-margin-top: 25mm;
      --a4-margin-bottom: 18mm;
      --report-text: #334155;
      --report-body-size: 10pt;
      --report-line: 1.65;
      --color-part: #0f172a;
      --color-section: #0284c7;
      --color-subsection: #0369a1;
      --color-accent: #dc2626;
      --color-accent-soft: #f8fafc;
      --report-border: #e2e8f0;
      --report-table-head: #0f6363;
      --report-table-head-text: #ffffff;
      --exec-teal: #0f6363;
      --exec-teal-dark: #0a5249;
      --exec-navy: #0f172a;
      --exec-sky: #0284c7;
      --exec-risk: #dc2626;
      --exec-success: #059669;
      --exec-warning: #d97706;
    }

    @page {
      size: A4 portrait;
      margin: var(--a4-margin-top) var(--a4-margin) var(--a4-margin-bottom);
    }

    * { box-sizing: border-box; }

    html, body {
      margin: 0;
      padding: 0;
      background: #e2e8f0;
    }

    body {
      font-family: "Pretendard", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif;
      font-size: var(--report-body-size);
      line-height: var(--report-line);
      color: var(--report-text);
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .report-shell {
      padding: 12mm 0 20mm;
    }

    .report-page {
      width: var(--a4-width);
      min-height: var(--a4-height);
      margin: 0 auto 12mm;
      padding: var(--a4-margin-top) var(--a4-margin) var(--a4-margin-bottom);
      background: #fff;
      box-shadow: 0 2px 16px rgba(15, 23, 42, 0.12);
      position: relative;
      box-sizing: border-box;
      break-after: page;
      page-break-after: always;
    }

    .report-page-body {
      max-width: var(--a4-width);
      overflow-x: hidden;
    }

    .report-page-cover {
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    /* ── 표지 ── */
    .report-cover {
      text-align: center;
      padding: 8mm 4mm 4mm;
    }

    .cover-accent-bar {
      height: 4mm;
      background: linear-gradient(90deg, #0f172a, #0284c7);
      border-radius: 2px;
      margin: 0 auto 10mm;
      width: 100%;
    }

    .cover-eyebrow {
      font-size: 10pt;
      color: #64748b;
      margin: 0 0 5mm;
      letter-spacing: 0.02em;
    }

    .cover-main-title {
      font-size: 22pt;
      font-weight: 800;
      color: var(--color-part);
      line-height: 1.35;
      margin: 0 0 8mm;
    }

    .cover-school-name {
      font-size: 18pt;
      font-weight: 700;
      color: var(--color-accent);
      margin: 0 0 10mm;
    }

    .cover-meta-box {
      background: var(--color-accent-soft);
      border: 1px solid #bfdbfe;
      border-radius: 6px;
      padding: 4mm;
      margin: 0 0 6mm;
      text-align: center;
    }

    .cover-meta-table {
      width: 100%;
      margin: 0;
      font-size: 9.5pt;
    }

    .cover-meta-table th {
      background: #1e40af;
      color: #fff;
      font-weight: 600;
      width: 18%;
    }

    .cover-meta-table td {
      background: #fff;
      width: 32%;
    }

    .cover-highlight {
      font-weight: 700;
      color: #0f3460;
    }

    .cover-run-at,
    .cover-generated-at {
      font-size: 9pt;
      color: #64748b;
      margin: 2mm 0;
    }

    .cover-toc {
      margin-top: 10mm;
      text-align: left;
      border-top: 2px solid var(--color-part);
      padding-top: 6mm;
    }

    .cover-toc-title {
      font-size: 12pt;
      font-weight: 700;
      color: var(--color-section);
      margin: 0 0 4mm;
    }

    .cover-toc-list {
      margin: 0;
      padding-left: 0;
      list-style: none;
      font-size: 10pt;
      line-height: 1.9;
    }

    .cover-toc-list li {
      display: flex;
      align-items: baseline;
      gap: 2mm;
      margin: 1mm 0;
    }

    .cover-toc-entry {
      flex: 1;
      min-width: 0;
    }

    .cover-toc-list .toc-num {
      color: var(--color-accent);
      font-weight: 700;
      margin-right: 2mm;
    }

    .cover-toc-leader {
      flex: 0 1 12mm;
      border-bottom: 1px dotted #cbd5e1;
      margin: 0 2mm;
      min-width: 4mm;
      align-self: flex-end;
      margin-bottom: 2px;
    }

    .cover-toc-page {
      flex-shrink: 0;
      min-width: 6mm;
      text-align: right;
      font-size: 9pt;
      color: #64748b;
      font-weight: 600;
    }

    /* ── 제목 체계 (주제목/부제목/소제목) ── */
    .section-title,
    h1.report-part-title {
      font-size: 16pt;
      font-weight: 800;
      color: var(--color-part);
      margin: 10mm 0 5mm;
      padding-bottom: 3mm;
      border-bottom: 3px solid var(--color-accent);
      page-break-after: avoid;
    }

    .subsection-title,
    h2.report-section-title {
      font-size: 13pt;
      font-weight: 700;
      color: var(--color-section);
      margin: 8mm 0 4mm;
      page-break-after: avoid;
    }

    .subsubsection-title,
    h3.report-subsection-title,
    h4.report-subsubsection-title {
      font-size: 11pt;
      font-weight: 700;
      color: var(--color-subsection);
      margin: 6mm 0 3mm;
      page-break-after: avoid;
    }

    /* 본문 다음 제목 시작 전 한 줄 여백 */
    p + .section-title,
    p + .subsection-title,
    p + .subsubsection-title,
    table + .section-title,
    table + .subsection-title,
    table + .subsubsection-title,
    .report-chart + .subsection-title,
    .report-chart-grid + .subsection-title,
    ul + .section-title,
    ol + .section-title {
      margin-top: 10mm;
    }

    p, li {
      font-size: var(--report-body-size);
      line-height: var(--report-line);
      margin: 3mm 0;
    }

    ul, ol {
      margin: 4mm 0 5mm;
      padding-left: 6mm;
    }

    /* ── KPI 카드 ── */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 3mm;
      margin: 5mm 0 7mm;
    }

    .kpi-card {
      border: 1px solid #bfdbfe;
      border-radius: 6px;
      background: linear-gradient(180deg, #f8fafc 0%, #eff6ff 100%);
      padding: 3mm;
      text-align: center;
    }

    .kpi-title {
      font-size: 8.5pt;
      font-weight: 600;
      color: #475569;
      margin-bottom: 2mm;
    }

    .kpi-value {
      font-size: 12pt;
      font-weight: 700;
      color: var(--color-part);
      margin-bottom: 1mm;
    }

    .kpi-sub {
      font-size: 8.5pt;
      color: #64748b;
    }

    /* ── Executive Dashboard v2.5 (Canvas Navy & Slate) ── */
    .report-executive-dashboard { margin-bottom: 8mm; }

    /* ── v2 Insights Panel (대시보드 UniversityV2InsightsPanel) ── */
    .report-v2-insights.rv2-panel {
      border: 1px solid color-mix(in srgb, #0284c7 35%, var(--report-border));
      border-radius: 8px;
      background: color-mix(in srgb, #0284c7 4%, #fff);
      padding: 4mm;
      margin-bottom: 4mm;
    }

    .rv2-panel-head { margin-bottom: 3mm; }
    .rv2-title { font-size: 11pt; font-weight: 700; color: #0284c7; margin: 0; }
    .rv2-lead { font-size: 8pt; color: #64748b; margin: 1mm 0 0; }
    .rv2-h4 { font-size: 9pt; font-weight: 600; color: #0369a1; margin: 0 0 2mm; }
    .rv2-section-gap { margin-top: 4mm; }

    .rv2-exec-cards {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 2mm;
      margin-bottom: 3mm;
    }

    .rv2-exec-card {
      border: 1px solid var(--report-border);
      border-radius: 6px;
      padding: 2.5mm 3mm;
      background: #f8fafc;
    }

    .rv2-exec-grade { border-top: 2px solid #0f172a; }
    .rv2-exec-strength { border-top: 2px solid #059669; }
    .rv2-exec-risk { border-top: 2px solid #dc2626; }
    .rv2-exec-label { font-size: 7pt; color: #64748b; font-weight: 600; margin: 0; }
    .rv2-exec-value { font-size: 14pt; font-weight: 800; margin: 1mm 0; color: #0f172a; }
    .rv2-exec-value-sm { font-size: 10pt; }
    .rv2-exec-value-risk { color: #dc2626; }
    .rv2-exec-sub { font-size: 7.5pt; color: #64748b; margin: 0; }

    .rv2-callout {
      border-left: 3px solid #0284c7;
      background: #f8fafc;
      padding: 2.5mm 3mm;
      border-radius: 0 6px 6px 0;
      font-size: 8.5pt;
      line-height: 1.55;
      margin-bottom: 3mm;
    }

    .rv2-grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 3mm;
    }

    .rv2-card {
      border: 1px solid var(--report-border);
      border-radius: 6px;
      padding: 2.5mm;
      background: #fff;
    }

    .rv2-chart-slot .report-chart { margin: 0; }
    .rv2-chart-slot .report-chart svg { max-height: 42mm; width: 100%; height: auto; }
    .rv2-caption { font-size: 7.5pt; color: #64748b; margin: 2mm 0 0; }

    .rv2-indicator-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 2mm;
    }

    .rv2-indicator-card {
      border: 1px solid var(--report-border);
      border-radius: 6px;
      padding: 2mm;
      background: #fff;
    }

    .rv2-indicator-head {
      display: flex;
      justify-content: space-between;
      font-size: 7.5pt;
      font-weight: 600;
      margin-bottom: 1.5mm;
    }

    .rv2-status {
      font-size: 6.5pt;
      padding: 0.3mm 1.5mm;
      border-radius: 3px;
      font-weight: 700;
    }

    .rv2-status-danger { background: #fef2f2; color: #dc2626; }
    .rv2-status-warning { background: #fffbeb; color: #d97706; }
    .rv2-status-success { background: #ecfdf5; color: #059669; }
    .rv2-status-neutral { color: #94a3b8; background: #f1f5f9; }

    .rv2-indicator-metrics {
      display: flex;
      gap: 3mm;
      font-size: 7pt;
      margin-bottom: 1.5mm;
    }

    .rv2-metric-label { display: block; color: #64748b; font-size: 6.5pt; }
    .rv2-momentum-drop { color: #dc2626; }
    .rv2-momentum-surge { color: #059669; }

    .rv2-indicator-bottom {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 2mm;
    }

    .rv2-gap {
      flex: 1;
      position: relative;
      height: 14px;
      background: #e2e8f0;
      border-radius: 3px;
      font-size: 6.5pt;
      display: flex;
      align-items: center;
      padding-left: 2mm;
    }

    .rv2-gap-fill {
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      opacity: 0.35;
      border-radius: 3px;
    }

    .rv2-gap-pos { background: #059669; }
    .rv2-gap-warn { background: #d97706; }
    .rv2-gap-neg { background: #dc2626; }
    .rv2-gap-neu { background: #94a3b8; }
    .rv2-gap-empty, .rv2-spark-empty { font-size: 7pt; color: #94a3b8; }

    .rv2-roadmap {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2.5mm;
    }

    .rv2-roadmap-col {
      border: 1px solid var(--report-border);
      border-radius: 6px;
      padding: 2.5mm;
      font-size: 8pt;
      background: #f8fafc;
    }

    .rv2-roadmap-col ul {
      margin: 2mm 0 0;
      padding-left: 4mm;
      line-height: 1.5;
    }

    .exec-report-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--exec-navy);
      color: #fff;
      padding: 3mm 4mm;
      border-radius: 6px;
      margin-bottom: 5mm;
      font-size: 8.5pt;
    }

    .exec-brand {
      background: #0284c7;
      font-weight: 800;
      font-size: 7pt;
      padding: 1mm 2mm;
      border-radius: 3px;
      margin-right: 2mm;
      letter-spacing: 0.04em;
    }

    .exec-report-title { font-weight: 700; }
    .exec-report-header-right { color: #cbd5e1; text-align: right; }
    .exec-header-sep { color: #475569; margin: 0 1.5mm; }

    .exec-panel {
      background: #fff;
      border: 1px solid var(--report-border);
      border-radius: 8px;
      padding: 4mm;
      margin-bottom: 5mm;
      box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
    }

    .exec-panel-dark {
      background: linear-gradient(135deg, var(--exec-teal) 0%, var(--exec-teal-dark) 100%);
      border-color: var(--exec-teal-dark);
      color: #f0fdfa;
    }

    .exec-panel-dark .exec-panel-head {
      border-bottom-color: rgba(255, 255, 255, 0.28);
    }

    .exec-panel-head { border-bottom: 1px solid #f1f5f9; padding-bottom: 3mm; margin-bottom: 4mm; }
    .exec-panel-head-split { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 3mm; }

    .exec-eyebrow {
      font-size: 7.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--exec-sky);
    }

    .exec-eyebrow-light { color: #ccfbf1; }

    .exec-h1 { font-size: 14pt; font-weight: 800; color: #0f172a; margin: 1mm 0 0; }
    .exec-h2 { font-size: 12pt; font-weight: 800; color: #0f172a; margin: 1mm 0 0; }
    .exec-h2-light { color: #fff; }
    .exec-h3 { font-size: 10pt; font-weight: 700; color: #0f172a; margin: 0 0 2mm; }

    .exec-meta-chips {
      font-size: 8pt;
      color: #64748b;
      background: #f1f5f9;
      padding: 2mm 3mm;
      border-radius: 6px;
      align-self: flex-start;
    }

    .exec-chip-sep { color: #cbd5e1; margin: 0 1mm; }

    .exec-narrative, .exec-lead {
      font-size: 9pt;
      color: #475569;
      line-height: 1.65;
      margin: 0 0 4mm;
    }

    .exec-lead-light { color: #ecfdf5; }
    .exec-caption { font-size: 8pt; color: #64748b; margin: 2mm 0; }

    .text-risk { color: var(--exec-risk); font-weight: 700; }
    .text-success { color: var(--exec-success); font-weight: 700; }
    .text-left { text-align: left !important; }
    .font-semibold { font-weight: 600; }

    .kpi-grid-4 {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 2.5mm;
      margin-bottom: 5mm;
    }

    .kpi-card {
      border-radius: 8px;
      padding: 3mm;
      text-align: center;
      border: 1px solid var(--report-border);
    }

    .kpi-risk { background: #fef2f2; border-color: #fecaca; }
    .kpi-strength { background: #ecfdf5; border-color: #a7f3d0; }
    .kpi-neutral { background: #f8fafc; border-color: #e2e8f0; }

    .kpi-label { font-size: 7pt; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em; }
    .kpi-value { font-size: 16pt; font-weight: 900; color: #0f172a; margin: 1mm 0; }
    .kpi-unit { font-size: 9pt; font-weight: 400; }
    .kpi-sub { font-size: 7.5pt; color: #64748b; }
    .kpi-pill {
      display: inline-block;
      font-size: 7pt;
      font-weight: 700;
      padding: 0.5mm 2mm;
      border-radius: 999px;
      margin-top: 1mm;
    }
    .kpi-pill-risk { background: #fecaca; color: #991b1b; }

    .exec-split-charts {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4mm;
      margin-top: 3mm;
    }

    .exec-chart-box {
      background: #f8fafc;
      border: 1px solid var(--report-border);
      border-radius: 8px;
      padding: 2mm;
    }

    .exec-chart-label {
      font-size: 8pt;
      font-weight: 700;
      color: #334155;
      margin-bottom: 2mm;
    }

    .quad-matrix {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2mm;
      background: #f1f5f9;
      padding: 2mm;
      border-radius: 8px;
      border: 1px solid var(--report-border);
    }

    .quad-cell {
      background: #fff;
      border: 1px solid var(--report-border);
      border-radius: 6px;
      padding: 2.5mm;
      position: relative;
      min-height: 14mm;
    }

    .quad-cell-active {
      background: #fef2f2;
      border: 2px solid var(--exec-risk);
    }

    .quad-pin {
      position: absolute;
      top: 2mm;
      right: 2mm;
      background: var(--exec-risk);
      color: #fff;
      font-size: 6.5pt;
      font-weight: 700;
      padding: 0.5mm 1.5mm;
      border-radius: 3px;
    }

    .quad-roman { font-size: 8pt; font-weight: 800; color: #334155; margin-bottom: 1mm; }
    .quad-cell-active .quad-roman { color: #991b1b; }
    .quad-desc { font-size: 7pt; color: #64748b; }

    .exec-table-wrap { overflow: hidden; border-radius: 6px; border: 1px solid var(--report-border); }

    .exec-indicator-table thead th {
      background: var(--report-table-head);
      color: var(--report-table-head-text);
      font-size: 8pt;
    }

    /* v2 Deep-Dive + 지표표 병합(3쪽) — 차트·표가 A4 본문 높이를 채움 */
    .report-page-merge-v2-deepdive {
      --deepdive-body-h: calc(var(--a4-height) - var(--a4-margin-top) - var(--a4-margin-bottom));
      --deepdive-chart-h: 62mm;
      --deepdive-table-head-h: 8mm;
      --deepdive-table-h: calc(var(--deepdive-body-h) - 26mm - var(--deepdive-chart-h) - 16mm);
      --deepdive-row-h: calc((var(--deepdive-table-h) - var(--deepdive-table-head-h)) / 8);
      display: flex;
      flex-direction: column;
    }

    .report-page-merge-v2-deepdive .report-v2-continued,
    .report-page-merge-v2-deepdive .exec-panel {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: var(--deepdive-body-h);
      margin-bottom: 0;
      box-sizing: border-box;
    }

    .report-page-merge-v2-deepdive .exec-panel-head {
      flex-shrink: 0;
      margin-bottom: 2mm;
      padding-bottom: 2mm;
    }

    .report-page-merge-v2-deepdive .exec-lead {
      margin-bottom: 2mm;
    }

    .report-page-merge-v2-deepdive .exec-split-charts {
      flex-shrink: 0;
      height: var(--deepdive-chart-h);
      margin: 0 0 3mm;
      gap: 3mm;
      align-items: stretch;
    }

    .report-page-merge-v2-deepdive .exec-chart-box {
      height: 100%;
      min-height: 0;
      display: flex;
      flex-direction: column;
      padding: 1.5mm;
      box-sizing: border-box;
      overflow: hidden;
    }

    .report-page-merge-v2-deepdive .exec-chart-box .report-chart {
      flex: 1;
      display: flex;
      flex-direction: column;
      margin: 0;
      min-height: 0;
      height: 100%;
    }

    .report-page-merge-v2-deepdive .exec-chart-box .report-chart-title {
      flex-shrink: 0;
      font-size: 8pt;
      margin: 0 0 1mm;
      line-height: 1.25;
    }

    .report-page-merge-v2-deepdive .exec-chart-box .report-chart svg {
      flex: 1;
      width: 100%;
      height: 100%;
      min-height: 0;
      max-height: none;
      display: block;
    }

    .report-page-merge-v2-deepdive .exec-table-wrap {
      flex-shrink: 0;
      height: var(--deepdive-table-h);
      display: flex;
      flex-direction: column;
      overflow: visible;
    }

    .report-page-merge-v2-deepdive .exec-indicator-table {
      height: 100%;
      width: 100%;
      font-size: 7.5pt;
      table-layout: fixed;
      border-collapse: collapse;
    }

    .report-page-merge-v2-deepdive .exec-indicator-table thead th {
      font-size: 7.5pt;
      padding: 1.5mm 1.5mm;
      height: var(--deepdive-table-head-h);
      vertical-align: middle;
    }

    .report-page-merge-v2-deepdive .exec-indicator-table tbody tr {
      height: var(--deepdive-row-h);
    }

    .report-page-merge-v2-deepdive .exec-indicator-table th,
    .report-page-merge-v2-deepdive .exec-indicator-table td {
      padding: 1.5mm 1.5mm;
      line-height: 1.2;
      vertical-align: middle;
    }

    /* v2 Decision + SWOT 병합(4+5쪽) */
    .report-page-merge-v2-decision-swot {
      --decision-swot-body-h: calc(var(--a4-height) - var(--a4-margin-top) - var(--a4-margin-bottom));
      display: flex;
      flex-direction: column;
      min-height: var(--decision-swot-body-h);
    }

    .report-page-merge-v2-decision-swot .exec-panel-dark {
      flex-shrink: 0;
      margin-bottom: 3mm;
      padding: 3mm 4mm;
    }

    .report-page-merge-v2-decision-swot .exec-panel-dark .exec-h2 {
      font-size: 11pt;
    }

    .report-page-merge-v2-decision-swot .exec-panel-dark .exec-lead,
    .report-page-merge-v2-decision-swot .exec-panel-dark .exec-tip {
      font-size: 8pt;
      margin-bottom: 2mm;
    }

    .report-page-merge-v2-decision-swot .exec-priority-list {
      font-size: 8pt;
      margin: 0 0 2mm;
    }

    .report-page-merge-v2-decision-swot .exec-panel:not(.exec-panel-dark) {
      flex: 1;
      display: flex;
      flex-direction: column;
      margin-bottom: 0;
      min-height: 0;
      padding: 3mm 4mm;
    }

    .report-page-merge-v2-decision-swot .exec-panel-head {
      flex-shrink: 0;
      margin-bottom: 2mm;
      padding-bottom: 2mm;
    }

    .report-page-merge-v2-decision-swot .exec-panel-head .exec-lead {
      margin-bottom: 0;
      font-size: 8pt;
    }

    .report-page-merge-v2-decision-swot .swot-grid {
      flex: 1;
      gap: 2.5mm;
      align-content: stretch;
      min-height: 0;
    }

    .report-page-merge-v2-decision-swot .swot-card {
      padding: 2.5mm;
      display: flex;
      flex-direction: column;
    }

    .report-page-merge-v2-decision-swot .swot-body {
      font-size: 7.5pt;
      line-height: 1.45;
      flex: 1;
    }

    /* v2 Decision+SWOT+Roadmap 병합(레거시) */
    .report-page-merge-v2-strategy .exec-panel,
    .report-page-merge-v2-strategy .exec-panel-dark {
      margin-bottom: 2mm;
      padding-bottom: 2mm;
    }
    .report-page-merge-v2-strategy .swot-grid { gap: 2mm; }
    .report-page-merge-v2-strategy .swot-card { padding: 2mm; }
    .report-page-merge-v2-strategy .swot-body { font-size: 7.5pt; line-height: 1.45; }
    .report-page-merge-v2-strategy .roadmap-list { gap: 2mm; }
    .report-page-merge-v2-strategy .roadmap-item { padding: 2mm 3mm; }

    .badge {
      display: inline-block;
      font-size: 7pt;
      font-weight: 700;
      padding: 0.5mm 2mm;
      border-radius: 999px;
      border: 1px solid transparent;
    }

    .badge-danger { background: #fef2f2; color: #991b1b; border-color: #fecaca; }
    .badge-warning { background: #fffbeb; color: #92400e; border-color: #fde68a; }
    .badge-strength { background: #ecfdf5; color: #065f46; border-color: #a7f3d0; }
    .badge-neutral { color: #94a3b8; }

    .exec-priority-list {
      margin: 3mm 0;
      padding-left: 5mm;
      font-size: 9pt;
      color: #ecfdf5;
    }

    .exec-panel-dark .exec-priority-list strong {
      color: #ffffff;
      font-weight: 700;
    }

    .exec-tip {
      font-size: 8pt;
      color: #99f6e4;
      border-top: 1px solid rgba(255, 255, 255, 0.28);
      padding-top: 3mm;
      margin: 3mm 0 0;
    }

    .swot-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 3mm;
    }

    .swot-card {
      border-radius: 8px;
      padding: 3mm;
      border: 1px solid var(--report-border);
    }

    .swot-so { background: #ecfdf5; border-color: #a7f3d0; }
    .swot-st { background: #f0f9ff; border-color: #bae6fd; }
    .swot-wo { background: #fffbeb; border-color: #fde68a; }
    .swot-wt { background: #fef2f2; border-color: #fecaca; }

    .swot-tag { font-size: 7pt; font-weight: 800; margin-bottom: 2mm; color: #475569; }
    .swot-title { font-size: 9.5pt; font-weight: 700; color: #0f172a; margin: 0 0 2mm; }
    .swot-body { font-size: 8pt; color: #64748b; line-height: 1.55; margin: 0; }

    .roadmap-list { display: flex; flex-direction: column; gap: 3mm; }

    .roadmap-item {
      background: #f8fafc;
      border: 1px solid var(--report-border);
      border-left: 4px solid var(--exec-risk);
      border-radius: 0 8px 8px 0;
      padding: 3mm 4mm;
    }

    .roadmap-mid { border-left-color: var(--exec-sky); }

    .roadmap-phase {
      font-size: 7pt;
      font-weight: 700;
      color: #991b1b;
      background: #fef2f2;
      padding: 0.5mm 2mm;
      border-radius: 4px;
      margin-right: 2mm;
    }

    .roadmap-phase-mid { color: #075985; background: #e0f2fe; }

    .roadmap-head { display: flex; flex-wrap: wrap; align-items: center; gap: 2mm; margin-bottom: 2mm; }
    .roadmap-title { font-size: 10pt; font-weight: 700; color: #0f172a; margin: 0; }
    .roadmap-body { font-size: 8pt; color: #64748b; margin: 0; }
    .roadmap-kpi { font-size: 7.5pt; color: #475569; margin: 2mm 0 0; }

    /* ── 제3부 A4 전용 ── */
    .report-page-part3 {
      page-break-before: always;
      break-before: page;
    }

    .report-part-3 .section-title,
    .report-part-3-continued .subsection-title:first-child {
      margin-top: 0;
    }

    .report-part-3 .subsection-title {
      font-size: 12pt;
      margin-top: 6mm;
    }

    .report-part-3 p,
    .report-part-3-continued p {
      font-size: 9.5pt;
      text-align: justify;
      word-break: keep-all;
      overflow-wrap: break-word;
    }

    .report-part3-roadmap {
      margin: 4mm 0 6mm;
    }

    .report-part3-roadmap .roadmap-item {
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .report-part3-swot {
      margin: 4mm 0 0;
    }

    .report-part3-swot .swot-card {
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .report-part-3 .data-table {
      font-size: 8pt;
    }

    .report-part-3 .data-table th,
    .report-part-3 .data-table td {
      padding: 1.5mm 2mm;
      vertical-align: top;
    }

    .report-part3-note {
      font-size: 8.5pt;
      color: #64748b;
      margin: 3mm 0 5mm;
      padding: 2mm 3mm;
      background: #f8fafc;
      border-left: 3px solid var(--exec-sky);
    }

    @media print {
      .kpi-grid-4 { grid-template-columns: repeat(2, 1fr); }
      .exec-split-charts, .swot-grid { grid-template-columns: 1fr 1fr; }
    }

    @media (max-width: 180mm) {
      .kpi-grid-4 { grid-template-columns: repeat(2, 1fr); }
    }

    /* legacy v2 aliases */
    .exec-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 2.5mm; }
    .callout-ai {
      border-left: 4px solid var(--exec-sky);
      background: #f8fafc;
      padding: 3mm 4mm;
      margin: 4mm 0;
      font-size: 9pt;
    }

    .status-danger { color: var(--exec-risk); font-weight: 700; }
    .status-warning { color: var(--exec-warning); font-weight: 700; }
    .status-success { color: var(--exec-success); font-weight: 700; }

    /* ── 등급 뱃지 ── */
    .grade-badge-S { background: #7c3aed; color: #fff; padding: 1mm 3mm; border-radius: 4px; font-weight: 700; }
    .grade-badge-A { background: #2563eb; color: #fff; padding: 1mm 3mm; border-radius: 4px; font-weight: 700; }
    .grade-badge-B { background: #059669; color: #fff; padding: 1mm 3mm; border-radius: 4px; font-weight: 700; }
    .grade-badge-C { background: #d97706; color: #fff; padding: 1mm 3mm; border-radius: 4px; font-weight: 700; }
    .grade-badge-D { background: #ea580c; color: #fff; padding: 1mm 3mm; border-radius: 4px; font-weight: 700; }
    .grade-badge-E { background: #dc2626; color: #fff; padding: 1mm 3mm; border-radius: 4px; font-weight: 700; }
    .grade-badge-none { background: #94a3b8; color: #fff; padding: 1mm 3mm; border-radius: 4px; font-weight: 700; }

    /* ── 표 (전체 가운데 정렬) ── */
    table,
    .data-table,
    .ucm-table {
      width: 100%;
      max-width: 100%;
      table-layout: fixed;
      border-collapse: collapse;
      margin: 5mm 0 7mm;
      font-size: 9pt;
      page-break-inside: avoid;
    }

    .data-table th,
    .data-table td,
    .ucm-table th,
    .ucm-table td {
      word-break: keep-all;
      overflow-wrap: break-word;
      hyphens: auto;
    }

    th, td {
      border: 1px solid var(--report-border);
      padding: 2.5mm 2mm;
      text-align: center;
      vertical-align: middle;
    }

    th {
      background: var(--report-table-head);
      color: var(--report-table-head-text);
      font-weight: 700;
    }

    tbody tr:nth-child(even) td {
      background: #f8fafc;
    }

    /* ── 차트 ── */
    .report-chart {
      margin: 5mm 0 7mm;
      page-break-inside: avoid;
    }

    .report-chart-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4mm;
      margin: 5mm 0 7mm;
    }

    .report-chart-card {
      border: 1px solid var(--report-border);
      border-radius: 4px;
      padding: 3mm;
      background: #fafafa;
      page-break-inside: avoid;
    }

    .report-chart-title {
      font-size: 9pt;
      font-weight: 700;
      color: var(--color-section);
      margin: 0 0 2mm;
      text-align: center;
    }

    .report-chart svg {
      display: block;
      width: 100%;
      height: auto;
    }

    .report-chart-legend {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 3mm 5mm;
      margin-top: 2mm;
      font-size: 7.5pt;
      color: #475569;
    }

    .report-chart-legend-item {
      display: inline-flex;
      align-items: center;
      gap: 1.5mm;
    }

    .report-chart-legend-swatch {
      width: 8px;
      height: 8px;
      border-radius: 999px;
      flex-shrink: 0;
    }

    [data-chart-id] {
      border: none;
      background: transparent;
      padding: 0;
    }

    .page-break {
      page-break-after: always;
      break-after: page;
      height: 0;
      margin: 0;
    }

    .page {
      margin: 0;
      padding: 0;
    }

    .report-page-footer {
      position: absolute;
      left: var(--a4-margin);
      right: var(--a4-margin);
      bottom: 8mm;
      text-align: center;
      font-size: 9pt;
      color: #64748b;
      border-top: 1px solid var(--report-border);
      padding-top: 2mm;
    }

    .report-page-num {
      font-weight: 600;
      font-variant-numeric: tabular-nums;
    }

    strong { color: #0f172a; }

    @media print {
      html, body { background: #fff; }
      .report-shell { padding: 0; }
      .no-print, .report-view-toolbar { display: none !important; }
      .report-page {
        width: auto;
        min-height: auto;
        margin: 0;
        padding: 0;
        box-shadow: none;
        page-break-after: always;
      }
      .report-page:last-child { page-break-after: auto; }
    }
  `.trim();
}
