import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowLeftRight,
  Award,
  Building,
  Building2,
  ChevronUp,
  Coins,
  Compass,
  GraduationCap,
  HandCoins,
  Hash,
  Landmark,
  PanelLeft,
  LineChart,
  Map,
  MapPin,
  PieChart,
  PiggyBank,
  Play,
  Receipt,
  ShieldCheck,
  SlidersHorizontal,
  Trophy,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  UsersRound,
} from "lucide-react";

export type IconCardTone = "emerald" | "indigo" | "rose" | "amber" | "teal" | "violet";

export type IconGalleryItem = {
  label: string;
  lucideName: string;
  icon: LucideIcon;
  tone?: IconCardTone;
};

export type SidebarSubItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  iconClass?: string;
  active?: boolean;
};

export type SidebarGroup = {
  id: string;
  label: string;
  icon: LucideIcon;
  items: SidebarSubItem[];
};

export type SidebarSection = {
  id: string;
  label: string;
  icon: LucideIcon;
  flatItems?: SidebarSubItem[];
  groups?: SidebarGroup[];
};

export const SIDEBAR_SECTIONS: SidebarSection[] = [
  {
    id: "univ-map",
    label: "대학현황",
    icon: GraduationCap,
    flatItems: [
      { id: "school-overview", label: "학교개황", icon: Building },
      { id: "university-locations", label: "대학위치", icon: MapPin },
      { id: "school-code", label: "학교코드", icon: Hash },
    ],
  },
  {
    id: "finance",
    label: "재정분석지표",
    icon: PieChart,
    groups: [
      {
        id: "student-enrollment",
        label: "학생충원",
        icon: Users,
        items: [
          { id: "freshman", label: "신입생충원율", icon: UserPlus },
          { id: "enrolled", label: "재학생충원율", icon: UserCheck },
          {
            id: "dropout",
            label: "중도탈락율",
            icon: UserMinus,
            iconClass: "text-rose-500",
          },
        ],
      },
      {
        id: "univ-finance",
        label: "대학재정",
        icon: Landmark,
        items: [
          {
            id: "fund-secure-rate",
            label: "자금확보율",
            icon: PiggyBank,
            active: true,
          },
          { id: "financial-support", label: "재정지원수혜율", icon: HandCoins },
          {
            id: "tuition-dependency",
            label: "등록금의존율",
            icon: Receipt,
            iconClass: "text-amber-600",
          },
        ],
      },
      {
        id: "corp-finance",
        label: "법인재정",
        icon: Building2,
        items: [
          { id: "income-property", label: "수익용재산확보율", icon: Coins },
          { id: "corp-transfer", label: "법인전입금비율", icon: ArrowLeftRight },
        ],
      },
      {
        id: "regional-population",
        label: "지역인구",
        icon: Map,
        items: [
          {
            id: "regional-decline",
            label: "지역소멸",
            icon: AlertTriangle,
            iconClass: "text-rose-500",
          },
          { id: "school-age", label: "학령인구", icon: UsersRound },
          { id: "origin-region", label: "출신지역", icon: Compass },
        ],
      },
    ],
  },
  {
    id: "competitiveness",
    label: "대학경쟁력분석",
    icon: Trophy,
    flatItems: [
      { id: "settings", label: "기본설정", icon: SlidersHorizontal },
      { id: "run", label: "분석실행", icon: Play },
      { id: "university", label: "대학별경쟁력", icon: Award },
    ],
  },
  {
    id: "financial-projection",
    label: "재정추계분석",
    icon: LineChart,
    flatItems: [
      { id: "fp-settings", label: "기본설정", icon: SlidersHorizontal },
      { id: "fp-execute", label: "분석결과", icon: Play },
      { id: "fp-university", label: "대학별추계", icon: Award },
    ],
  },
];

export const ICON_GALLERY_SECTIONS: {
  title: string;
  sectionIcon: LucideIcon;
  cols: string;
  items: IconGalleryItem[];
}[] = [
  {
    title: "1. 대학현황 섹션 아이콘",
    sectionIcon: GraduationCap,
    cols: "sm:grid-cols-3",
    items: [
      { label: "학교개황", lucideName: "Building", icon: Building, tone: "emerald" },
      { label: "대학위치", lucideName: "MapPin", icon: MapPin, tone: "emerald" },
      { label: "학교코드", lucideName: "Hash", icon: Hash, tone: "emerald" },
    ],
  },
  {
    title: "2. 재정분석지표 세부 아이콘",
    sectionIcon: PieChart,
    cols: "sm:grid-cols-2 lg:grid-cols-3",
    items: [
      { label: "신입생충원율", lucideName: "UserPlus", icon: UserPlus, tone: "indigo" },
      { label: "재학생충원율", lucideName: "UserCheck", icon: UserCheck, tone: "indigo" },
      { label: "중도탈락율", lucideName: "UserMinus", icon: UserMinus, tone: "rose" },
      { label: "자금확보율", lucideName: "PiggyBank", icon: PiggyBank, tone: "emerald" },
      { label: "재정지원수혜율", lucideName: "HandCoins", icon: HandCoins, tone: "emerald" },
      { label: "등록금의존율", lucideName: "Receipt", icon: Receipt, tone: "amber" },
      { label: "수익용재산확보율", lucideName: "Coins", icon: Coins, tone: "teal" },
      {
        label: "법인전입금비율",
        lucideName: "ArrowLeftRight",
        icon: ArrowLeftRight,
        tone: "teal",
      },
      {
        label: "지역소멸",
        lucideName: "AlertTriangle",
        icon: AlertTriangle,
        tone: "rose",
      },
    ],
  },
  {
    title: "3. 대학경쟁력분석 섹션 아이콘",
    sectionIcon: Trophy,
    cols: "sm:grid-cols-2 lg:grid-cols-3",
    items: [
      {
        label: "기본설정",
        lucideName: "SlidersHorizontal",
        icon: SlidersHorizontal,
        tone: "violet",
      },
      { label: "분석실행", lucideName: "Play", icon: Play, tone: "violet" },
      { label: "대학별경쟁력", lucideName: "Award", icon: Award, tone: "violet" },
    ],
  },
  {
    title: "4. 재정추계분석 섹션 아이콘",
    sectionIcon: LineChart,
    cols: "sm:grid-cols-3",
    items: [
      { label: "기본설정", lucideName: "SlidersHorizontal", icon: SlidersHorizontal, tone: "teal" },
      { label: "시나리오", lucideName: "LineChart", icon: LineChart, tone: "teal" },
      { label: "분석결과", lucideName: "Play", icon: Play, tone: "teal" },
      { label: "대학별추계", lucideName: "Award", icon: Award, tone: "teal" },
    ],
  },
];

export const SHOWCASE_BRAND_ICONS = {
  sidebar: PanelLeft,
  shield: ShieldCheck,
  chevron: ChevronUp,
};

export const TONE_CLASS: Record<
  IconCardTone,
  { card: string; icon: string }
> = {
  emerald: {
    card: "bg-slate-50 border-slate-100",
    icon: "bg-emerald-100 text-emerald-800",
  },
  indigo: {
    card: "bg-slate-50 border-slate-100",
    icon: "bg-indigo-100 text-indigo-700",
  },
  rose: {
    card: "bg-rose-50/60 border-rose-100",
    icon: "bg-rose-100 text-rose-700",
  },
  amber: {
    card: "bg-amber-50/60 border-amber-100",
    icon: "bg-amber-100 text-amber-800",
  },
  teal: {
    card: "bg-slate-50 border-slate-100",
    icon: "bg-teal-100 text-teal-800",
  },
  violet: {
    card: "bg-slate-50 border-slate-100",
    icon: "bg-violet-100 text-violet-800",
  },
};
