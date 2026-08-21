import { consolidateEnrolledEnrollmentPeriods } from "../src/lib/ingest/enrolled-enrollment-consolidate.ts";

const result = await consolidateEnrolledEnrollmentPeriods();
console.log(result);
