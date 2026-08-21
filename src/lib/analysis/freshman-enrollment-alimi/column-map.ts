import type { FreshmanEnrollmentDatasetKind } from "./types";

export const FRESHMAN_ENROLLMENT_ALIMI_COL = {
  undergrad: {
    year: 0,
    schoolCode: 1,
    schoolKind: 2,
    estb: 3,
    region: 4,
    status: 5,
    schoolName: 6,
    fillRateWithin: 19,
    firstMetric: 7,
  },
  grad: {
    year: 0,
    schoolCode: 1,
    schoolRep: 2,
    mainBranch: 3,
    schoolKind: 4,
    estb: 5,
    region: 6,
    status: 7,
    gradName: 8,
    firstMetric: 9,
  },
} as const;

export const FRESHMAN_ENROLLMENT_ALIMI_LABEL: Record<
  FreshmanEnrollmentDatasetKind,
  string
> = {
  undergrad: "대학전문",
  grad: "대학원",
};
