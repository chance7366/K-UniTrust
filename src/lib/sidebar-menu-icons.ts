import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowLeftRight,
  Award,
  Building,
  Building2,
  Coins,
  Compass,
  Database,
  Factory,
  GraduationCap,
  HandCoins,
  Hash,
  Landmark,
  LineChart,
  Map,
  MapPin,
  PieChart,
  PiggyBank,
  Play,
  Receipt,
  SlidersHorizontal,
  Target,
  Trophy,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  UsersRound,
} from "lucide-react";

export type SidebarIconConfig = {
  icon: LucideIcon;
  className?: string;
};

export const SIDEBAR_SECTION_ICONS = {
  univMap: GraduationCap,
  financeAnalysis: PieChart,
  competitiveness: Trophy,
  financialProjection: LineChart,
} as const;

const GROUP_ICONS: Record<string, LucideIcon> = {
  "school-overview": Building,
  "university-locations": MapPin,
  "university-alimi": GraduationCap,
  "finance-alimi": Landmark,
  "region-population": Map,
  "analysis-target": Target,
  "student-enrollment": Users,
  "univ-finance": Landmark,
  "corp-finance": Building2,
  settings: SlidersHorizontal,
  run: Play,
  scenario: LineChart,
  execute: Play,
  university: Award,
};

const TAB_ICONS: Record<string, SidebarIconConfig> = {
  "school-overview": { icon: Building },
  "university-locations": { icon: MapPin },
  "school-code": { icon: Hash },
  "freshman-enrollment": { icon: UserPlus },
  "freshman-enrollment-rate": { icon: UserPlus },
  "enrolled-enrollment": { icon: UserCheck },
  "enrolled-enrollment-rate": { icon: UserCheck },
  "dropout-rate": { icon: UserMinus, className: "text-rose-500" },
  "enrolled-students": { icon: Users },
  "avg-tuition": { icon: Receipt, className: "text-amber-600" },
  "origin-school": { icon: Compass },
  "edu-fund": { icon: Landmark },
  "edu-fund-expense": { icon: Landmark },
  "edu-balance": { icon: Building2 },
  "edu-operation": { icon: Database },
  "edu-accounting": { icon: Landmark },
  "corp-general": { icon: Building2 },
  "industry-accounting": { icon: Factory },
  "industry-fund": { icon: Factory },
  "industry-cash": { icon: Factory },
  "industry-balance": { icon: Building2 },
  "industry-operation": { icon: Database },
  "income-property": { icon: Coins },
  "financial-support": { icon: HandCoins },
  "regional-decline": { icon: AlertTriangle, className: "text-rose-500" },
  "school-age-population": { icon: UsersRound },
  "school-age-population-sigungu": { icon: Building2 },
  "origin-region": { icon: Compass },
  "analysis-target": { icon: Target },
  "fund-secure-rate": { icon: PiggyBank },
  "financial-support-benefit-rate": { icon: HandCoins },
  "tuition-dependency-rate": { icon: Receipt, className: "text-amber-600" },
  "income-property-secure-rate": { icon: Coins },
  "corp-transfer-ratio": { icon: ArrowLeftRight },
  settings: { icon: SlidersHorizontal },
  run: { icon: Play },
  scenario: { icon: LineChart },
  execute: { icon: Play },
  university: { icon: Award },
};

export function getSidebarGroupIcon(groupId: string): LucideIcon {
  return GROUP_ICONS[groupId] ?? Building;
}

export function getSidebarTabIcon(tabId: string): SidebarIconConfig {
  return TAB_ICONS[tabId] ?? { icon: Hash };
}
