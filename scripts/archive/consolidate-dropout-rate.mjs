import { consolidateDropoutRateYears } from "../src/lib/ingest/dropout-rate-consolidate.ts";

const result = await consolidateDropoutRateYears();
console.log(result);
