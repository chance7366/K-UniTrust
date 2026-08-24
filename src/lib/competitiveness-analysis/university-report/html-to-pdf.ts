import path from "path";

import type { Browser } from "playwright-core";

let browserPromise: Promise<Browser> | null = null;

export function isServerlessPdfRuntime(): boolean {
  return Boolean(
    process.env.VERCEL ||
      process.env.AWS_LAMBDA_FUNCTION_NAME ||
      process.env.AWS_EXECUTION_ENV,
  );
}

async function launchBrowser(): Promise<Browser> {
  if (isServerlessPdfRuntime()) {
    const chromiumMod = await import("@sparticuz/chromium");
    const { chromium: playwrightChromium } = await import("playwright-core");
    const chromium = chromiumMod.default as {
      args: string[];
      executablePath: (url?: string) => Promise<string>;
    };

    const remotePack = process.env.CHROMIUM_REMOTE_EXEC_PATH?.trim();
    const executablePath = remotePack
      ? await chromium.executablePath(remotePack)
      : await chromium.executablePath();

    if (process.platform === "linux") {
      process.env.LD_LIBRARY_PATH = [
        path.dirname(executablePath),
        process.env.LD_LIBRARY_PATH,
      ]
        .filter(Boolean)
        .join(":");
    }

    return playwrightChromium.launch({
      args: chromium.args,
      executablePath,
      headless: true,
    });
  }

  const { chromium } = await import("playwright");
  return chromium.launch({ headless: true });
}

async function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = launchBrowser();
  }
  return browserPromise;
}

/** A4 HTML 보고서 → PDF Buffer (Playwright Chromium) */
export async function htmlToPdfBuffer(html: string): Promise<Buffer> {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: "load" });
    await page.emulateMedia({ media: "print" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });
    return Buffer.from(pdf);
  } finally {
    await page.close();
  }
}

/**
 * 공용 Chromium을 닫는다. 서버에서는 재사용을 위해 호출하지 않고,
 * CLI 스크립트가 정상 종료하도록 마지막에 호출한다.
 */
export async function closePdfBrowser(): Promise<void> {
  const pending = browserPromise;
  if (!pending) return;
  browserPromise = null;
  const browser = await pending;
  await browser.close();
}

export function universityReportPdfFilename(args: {
  analysisYear: number;
  schoolCodeStd: string;
  schoolName: string;
}): string {
  const safeName = args.schoolName.replace(/[\\/:*?"<>|]/g, "_").trim();
  return `${args.analysisYear}_${args.schoolCodeStd}_${safeName}_competitiveness-report.pdf`;
}
