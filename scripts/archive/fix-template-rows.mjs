import fs from "fs";

function replaceFunction(filePath, fnName, newBody) {
  let c = fs.readFileSync(filePath, "utf8");
  const start = c.indexOf(`function ${fnName}`);
  if (start < 0) throw new Error(`missing ${fnName} in ${filePath}`);
  const end = c.indexOf("\n}\n", start) + 3;
  c = c.slice(0, start) + newBody + c.slice(end);
  fs.writeFileSync(filePath, c, "utf8");
}

replaceFunction(
  "src/lib/ingest/freshman-enrollment-upload.ts",
  "templateSampleToRow",
  `function templateSampleToRow(
  row: (typeof FRESHMAN_ENROLLMENT_TEMPLATE_SAMPLES)[number],
): (string | number)[] {
  return [
    row["기준연도" as keyof typeof row] as number,
    row["학교종류" as keyof typeof row] as string,
    row["설립구분" as keyof typeof row] as string,
    row["지역" as keyof typeof row] as string,
    row["상태" as keyof typeof row] as string,
    row["학교코드_표준" as keyof typeof row] as string,
    row["학교" as keyof typeof row] as string,
    row["입학정원" as keyof typeof row] as number,
    row["모집인원_계" as keyof typeof row] as number,
    row["모집인원_정원내" as keyof typeof row] as number,
    row["모집인원_정원외" as keyof typeof row] as number,
    row["입학자_계" as keyof typeof row] as number,
    row["입학자_정원내" as keyof typeof row] as number,
    row["입학자_정원외" as keyof typeof row] as number,
    row["신입생충원율_정원내" as keyof typeof row] as number,
    row["신입생충원율_정원내외" as keyof typeof row] as number,
  ];
}
`,
);

replaceFunction(
  "src/lib/ingest/enrolled-enrollment-upload.ts",
  "templateSampleToRow",
  `function templateSampleToRow(
  row: (typeof ENROLLED_ENROLLMENT_TEMPLATE_SAMPLES)[number],
): (string | number)[] {
  return [
    row["기준연도" as keyof typeof row] as number,
    row["상하반기" as keyof typeof row] as string,
    row["학교종류" as keyof typeof row] as string,
    row["설립구분" as keyof typeof row] as string,
    row["지역" as keyof typeof row] as string,
    row["상태" as keyof typeof row] as string,
    row["학교코드_표준" as keyof typeof row] as string,
    row["학교" as keyof typeof row] as string,
    row["학생정원" as keyof typeof row] as number,
    row["학생모집정지인원" as keyof typeof row] as number,
    row["재학생_계" as keyof typeof row] as number,
    row["재학생_정원내" as keyof typeof row] as number,
    row["재학생_정원외" as keyof typeof row] as number,
    row["재학생충원율" as keyof typeof row] as number,
    row["정원내재학생충원율" as keyof typeof row] as number,
  ];
}
`,
);

let c = fs.readFileSync("src/lib/ingest/school-age-population-upload.ts", "utf8");
c = c.replace(
  /\.\.\.SCHOOL_AGE_POPULATION_TEMPLATE_SAMPLES\.map\(\(row\) => \[[\s\S]*?\]\),/,
  `...SCHOOL_AGE_POPULATION_TEMPLATE_SAMPLES.map((row) => [
      row["지역코드"],
      row["구분"],
      row.high_3,
      row.high_2,
      row.high_1,
      row.middle_3,
      row.middle_2,
      row.middle_1,
      row.elem_6,
      row.elem_5,
      row.elem_4,
      row.elem_3,
      row.elem_2,
      row.elem_1,
    ]),`,
);
fs.writeFileSync("src/lib/ingest/school-age-population-upload.ts", c, "utf8");

console.log("template fixes done");
