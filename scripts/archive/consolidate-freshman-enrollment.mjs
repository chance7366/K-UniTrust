import { consolidateFreshmanEnrollmentYears } from "../src/lib/ingest/freshman-enrollment-consolidate.ts";

const result = await consolidateFreshmanEnrollmentYears();
console.log(result);
