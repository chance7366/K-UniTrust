import fs from "fs";

import type {
  UnivAlimiDatasetKind,
  UnivAlimiIndicatorId,
} from "@/lib/analysis/univ-alimi-raw/types";
import { ingestUnivAlimiRawUpload } from "@/lib/ingest/univ-alimi-raw-upload";

const FILES: {
  indicator: UnivAlimiIndicatorId;
  kind: UnivAlimiDatasetKind;
  filePath: string;
}[] = [
  {
    indicator: "enrolled-enrollment",
    kind: "undergrad",
    filePath:
      "d:/바이브코딩/데이터관리/대학알리미/재학생충원/(업로드)재학생충원율_대학전문.xlsx",
  },
  {
    indicator: "enrolled-enrollment",
    kind: "grad",
    filePath:
      "d:/바이브코딩/데이터관리/대학알리미/재학생충원/(업로드)재학생충원율_대학원.xlsx",
  },
  {
    indicator: "dropout-rate",
    kind: "undergrad",
    filePath:
      "d:/바이브코딩/데이터관리/대학알리미/중도탈락/(업로드)중도탈락_대학전문.xlsx",
  },
  {
    indicator: "dropout-rate",
    kind: "grad",
    filePath:
      "d:/바이브코딩/데이터관리/대학알리미/중도탈락/(업로드)중도탈락_대학원.xlsx",
  },
  {
    indicator: "enrolled-students",
    kind: "undergrad",
    filePath:
      "d:/바이브코딩/데이터관리/대학알리미/재적학생/(업로드)재적학생_대학전문.xlsx",
  },
  {
    indicator: "enrolled-students",
    kind: "grad",
    filePath:
      "d:/바이브코딩/데이터관리/대학알리미/재적학생/(업로드)재적학생_대학원.xlsx",
  },
  {
    indicator: "origin-school",
    kind: "undergrad",
    filePath:
      "d:/바이브코딩/데이터관리/대학알리미/출신학교/(업로드)신입생의 출신 고등학교 유형별 현황.xlsx",
  },
  {
    indicator: "avg-tuition",
    kind: "undergrad",
    filePath:
      "d:/바이브코딩/데이터관리/대학알리미/평균등록금/(업로드)평균등록금_대학전문.xlsx",
  },
  {
    indicator: "avg-tuition",
    kind: "grad",
    filePath:
      "d:/바이브코딩/데이터관리/대학알리미/평균등록금/(업로드)평균등록금_대학원.xlsx",
  },
  {
    indicator: "edu-fund",
    kind: "undergrad",
    filePath:
      "d:/바이브코딩/데이터관리/대학재정알리미/대학결산/(업로드)교비자금_수입.xlsx",
  },
  {
    indicator: "edu-fund-expense",
    kind: "undergrad",
    filePath:
      "d:/바이브코딩/데이터관리/대학재정알리미/대학결산/(업로드)교비자금_지출.xlsx",
  },
  {
    indicator: "edu-balance",
    kind: "undergrad",
    filePath:
      "d:/바이브코딩/데이터관리/대학재정알리미/대학결산/(업로드)교비대차.xlsx",
  },
  {
    indicator: "edu-operation",
    kind: "undergrad",
    filePath:
      "d:/바이브코딩/데이터관리/대학재정알리미/대학결산/(업로드)교비운영.xlsx",
  },
  {
    indicator: "corp-fund",
    kind: "undergrad",
    filePath:
      "d:/바이브코딩/데이터관리/대학재정알리미/대학결산/(업로드)법인자금_수입.xlsx",
  },
  {
    indicator: "corp-fund-expense",
    kind: "undergrad",
    filePath:
      "d:/바이브코딩/데이터관리/대학재정알리미/대학결산/(업로드)법인자금_지출.xlsx",
  },
  {
    indicator: "corp-balance",
    kind: "undergrad",
    filePath:
      "d:/바이브코딩/데이터관리/대학재정알리미/대학결산/(업로드)법인대차.xlsx",
  },
  {
    indicator: "corp-operation",
    kind: "undergrad",
    filePath:
      "d:/바이브코딩/데이터관리/대학재정알리미/대학결산/(업로드)법인운영.xlsx",
  },
  {
    indicator: "industry-cash",
    kind: "undergrad",
    filePath:
      "d:/바이브코딩/데이터관리/대학재정알리미/산단결산/(업로드)산단현금.xlsx",
  },
  {
    indicator: "industry-balance",
    kind: "undergrad",
    filePath:
      "d:/바이브코딩/데이터관리/대학재정알리미/산단결산/(업로드)산단대차.xlsx",
  },
  {
    indicator: "industry-operation",
    kind: "undergrad",
    filePath:
      "d:/바이브코딩/데이터관리/대학재정알리미/산단결산/(업로드)산단운영.xlsx",
  },
  {
    indicator: "income-property",
    kind: "undergrad",
    filePath:
      "d:/바이브코딩/데이터관리/대학재정알리미/수익용재산/(업로드)학교법인수익용기본재산.xlsx",
  },
  {
    indicator: "financial-support",
    kind: "undergrad",
    filePath:
      "d:/바이브코딩/데이터관리/대학재정알리미/재정지원/(업로드)재정지원.xlsx",
  },
];

async function main() {
  const only = process.argv[2];
  for (const { indicator, kind, filePath } of FILES) {
    if (only && indicator !== only) continue;
    if (!fs.existsSync(filePath)) {
      console.error(`파일 없음: ${filePath}`);
      process.exitCode = 1;
      continue;
    }
    const buffer = fs.readFileSync(filePath);
    const result = await ingestUnivAlimiRawUpload(
      indicator,
      kind,
      buffer,
      filePath.split(/[/\\]/).pop() ?? filePath,
    );
    console.log(
      `[${indicator}/${kind}] ${result.rowCount}행 · 연도 ${result.years.join(", ")}`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
