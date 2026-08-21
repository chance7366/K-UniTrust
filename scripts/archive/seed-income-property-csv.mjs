import fs from "fs";

import XLSX from "xlsx";



const EXCEL_PATH =

  "d:/대학DB/법인재정/수익용재산/(업로드)학교법인수익용기본재산.xlsx";

const OUT_CSV =

  "data/csv/finance_analysis_income_property_secure_rate.csv";



const COLUMNS = [

  "year",

  "school_code_std",

  "school_name",

  "corp_name",

  "school_division",

  "region",

  "estb",

  "school_status",

  "land_appraised",

  "land_net_income",

  "building_appraised",

  "building_net_income",

  "securities_appraised",

  "securities_net_income",

  "deposit_appraised",

  "deposit_net_income",

  "other_appraised",

  "other_net_income",

  "collateral_deduction",

  "total_appraised",

  "total_net_income",

  "uploaded_at",

];



function s(v) {

  return v == null ? "" : String(v).trim();

}



function num(v) {

  if (v == null || v === "") return 0;

  const n = Number(String(v).replace(/,/g, ""));

  return Number.isFinite(n) ? n : 0;

}



function padSchoolCode(v) {

  const s = String(v ?? "").trim();

  if (!s) return "";

  return s.padStart(7, "0");

}



function csvEscape(v) {

  const s = String(v ?? "");

  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;

  return s;

}



const uploadedAt = new Date().toISOString();

const wb = XLSX.readFile(EXCEL_PATH);

const matrix = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {

  header: 1,

  defval: "",

});



const rows = [];

for (let i = 1; i < matrix.length; i++) {

  const r = matrix[i];

  if (!r || !r[0]) continue;

  const year = Number(r[0]);

  const schoolCodeStd = padSchoolCode(r[1]);

  const schoolName = s(r[2]);

  if (!year || !schoolCodeStd || !schoolName) continue;



  rows.push({

    year: String(year),

    school_code_std: schoolCodeStd,

    school_name: schoolName,

    corp_name: s(r[3]),

    school_division: s(r[4]),

    region: s(r[5]),

    estb: s(r[6]),

    school_status: s(r[7]),

    land_appraised: String(num(r[8])),

    land_net_income: String(num(r[9])),

    building_appraised: String(num(r[10])),

    building_net_income: String(num(r[11])),

    securities_appraised: String(num(r[12])),

    securities_net_income: String(num(r[13])),

    deposit_appraised: String(num(r[14])),

    deposit_net_income: String(num(r[15])),

    other_appraised: String(num(r[16])),

    other_net_income: String(num(r[17])),

    collateral_deduction: String(num(r[18])),

    total_appraised: String(num(r[19])),

    total_net_income: String(num(r[20])),

    uploaded_at: uploadedAt,

  });

}



const lines = [

  COLUMNS.join(","),

  ...rows.map((row) => COLUMNS.map((col) => csvEscape(row[col])).join(",")),

];



fs.mkdirSync("data/csv", { recursive: true });

fs.writeFileSync(OUT_CSV, lines.join("\n"), "utf8");

console.log(`Wrote ${rows.length} rows to ${OUT_CSV}`);

