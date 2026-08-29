import type {
  StudentFillAction,
  StudentFillFinding,
} from "./build-deep-report";

export {
  buildStudentFillActions,
  buildStudentFillDiagnosis,
  counterfactualRateAll,
} from "./build-deep-report";
export type { StudentFillAction, StudentFillFinding } from "./build-deep-report";
export { buildStudentFillReportHtml } from "./build-report-html";

export type StudentFillUniversityReport = {
  analysisYear: number;
  schoolCodeStd: string;
  schoolName: string;
  generatedAt: string;
  guidelinesVersion?: string;
  diagnosis: StudentFillFinding[];
  actions: StudentFillAction[];
  html: string;
};
