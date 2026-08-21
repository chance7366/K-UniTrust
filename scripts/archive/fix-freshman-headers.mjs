import fs from "fs";

function replaceValidateHeaders(filePath, row1Const, row2Const) {
  let c = fs.readFileSync(filePath, "utf8");
  const start = c.indexOf("function validateHeaders(row0: unknown[], row1: unknown[])");
  if (start < 0) return false;
  const end = c.indexOf("function parseWideRows", start);
  const replacement = `function validateHeaders(row0: unknown[], row1: unknown[]) {
  const h0 = row0.map((c) => s(c));
  const h1 = row1.map((c) => s(c));
  const expected0 = [...${row1Const}];
  const expected1 = [...${row2Const}];
  const mismatches0 = expected0.filter((label, i) => h0[i] !== label);
  const mismatches1 = expected1.filter((label, i) => h1[i] !== label);
  if (mismatches0.length || mismatches1.length) {
    throw new Error(
      "헤더가 올바르지 않습니다. 양식down 파일의 1·2행 헤더를 그대로 사용하세요.",
    );
  }
}

`;
  c = c.slice(0, start) + replacement + c.slice(end);
  c = c.replace(
    /if \(aoa\.length < 3\) \{\s*throw new Error\("[^"]*"\);\s*\}/,
    'if (aoa.length < 3) {\n    throw new Error("업로드 파일에 데이터가 없습니다.");\n  }',
  );
  fs.writeFileSync(filePath, c, "utf8");
  return true;
}

replaceValidateHeaders(
  "src/lib/ingest/freshman-enrollment-upload.ts",
  "FRESHMAN_ENROLLMENT_TEMPLATE_HEADER_ROW1",
  "FRESHMAN_ENROLLMENT_TEMPLATE_HEADER_ROW2",
);
console.log("done");
