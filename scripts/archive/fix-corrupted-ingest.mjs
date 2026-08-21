import fs from "fs";
import path from "path";

const root = path.join(process.cwd(), "src/lib/ingest");

const templateFixes = [
  ["corp-transfer-ratio-upload.ts", "CORP_TRANSFER_RATIO_TEMPLATE_HEADER", "CORP_TRANSFER_RATIO_TEMPLATE_SAMPLES"],
  ["fund-secure-rate-upload.ts", "FUND_SECURE_RATE_TEMPLATE_HEADER", "FUND_SECURE_RATE_TEMPLATE_SAMPLES"],
  ["tuition-dependency-rate-upload.ts", "TUITION_DEPENDENCY_RATE_TEMPLATE_HEADER", "TUITION_DEPENDENCY_RATE_TEMPLATE_SAMPLES"],
  ["school-code-upload.ts", "SCHOOL_CODE_TEMPLATE_HEADER", "SCHOOL_CODE_TEMPLATE_SAMPLES"],
  ["income-property-secure-rate-upload.ts", "INCOME_PROPERTY_SECURE_RATE_TEMPLATE_HEADER", "INCOME_PROPERTY_TEMPLATE_SAMPLES"],
  ["dropout-rate-upload.ts", "DROPOUT_RATE_TEMPLATE_HEADER", "DROPOUT_RATE_TEMPLATE_SAMPLES"],
  ["financial-support-benefit-rate-upload.ts", "FINANCIAL_SUPPORT_BENEFIT_RATE_TEMPLATE_HEADER", "FINANCIAL_SUPPORT_BENEFIT_RATE_TEMPLATE_SAMPLES"],
];

function fixContent(content, header, samples) {
  content = content.replace(
    /throw new Error\(\s*`[^`]*mismatches\.join\("[^"]*"\)[^`]*`\s*,?\s*\)/g,
    'throw new Error(\n      `헤더가 올바르지 않습니다. 양식down 파일의 1행 헤더를 그대로 사용하세요. (불일치: ${mismatches.join(", ")})`,\n    )',
  );

  content = content.replace(
    /if \(aoa\.length < 2\) \{\s*throw new Error\("[^"]*"\);\s*\}/g,
    'if (aoa.length < 2) {\n    throw new Error("업로드 파일에 데이터가 없습니다.");\n  }',
  );

  content = content.replace(
    /if \(!parsed\.length\) \{\s*throw new Error\([\s\S]*?\);\s*\}/g,
    'if (!parsed.length) {\n    throw new Error(\n      "유효한 데이터 행을 찾지 못했습니다. 필수 열 값을 확인하세요.",\n    );\n  }',
  );

  content = content.replace(/reason: "[^"]*"/g, 'reason: "학교코드 데이터 없음"');

  content = content.replace(
    /\/\*\*[^*]*\*\/\s*\nfunction calcEnrolledFillRate/g,
    '/** 재학생충원율 = 재학생수 / (재학생정원 - 재학생모집중단정원) */\nfunction calcEnrolledFillRate',
  );

  if (header && samples) {
    content = content.replace(
      /function templateSampleToRow\([\s\S]*?\n\}/,
      `function templateSampleToRow(
  row: (typeof ${samples})[number],
): (string | number)[] {
  return ${header}.map((key) => row[key as keyof typeof row]);
}`,
    );
  }

  // Fix corrupted string comparisons in validateHeaders (h0[0] !== "..." patterns)
  content = content.replace(/h0\[0\] !== "[^"]*"/g, (m) => {
    if (content.includes('FRESHMAN_ENROLLMENT_TEMPLATE_HEADER_ROW1')) return m;
    return m;
  });

  return content;
}

const targets = fs.readdirSync(root).filter((f) => f.endsWith(".ts"));

for (const file of targets) {
  const full = path.join(root, file);
  let content = fs.readFileSync(full, "utf8");
  const tpl = templateFixes.find(([f]) => f === file);
  const next = fixContent(content, tpl?.[1], tpl?.[2]);
  if (next !== content) {
    fs.writeFileSync(full, next, "utf8");
    console.log("fixed:", file);
  }
}
