"use client";

import {
  GraduationCap,
  HandCoins,
  Landmark,
  Map,
  PieChart,
  Trophy,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react";

const NAV = {
  sections: [
    {
      id: "finance",
      label: "재정분석지표",
      icon: PieChart,
      groups: [
        {
          id: "student",
          label: "학생충원",
          icon: Users,
          open: true,
          items: [
            { id: "freshman", label: "신입생충원율", icon: UserPlus, active: true },
            { id: "enrolled", label: "재학생충원율", icon: UserCheck },
            { id: "dropout", label: "중도탈락율", icon: UserMinus },
          ],
        },
        {
          id: "univ-finance",
          label: "대학재정",
          icon: Landmark,
          items: [
            { id: "fund", label: "자금확보율", icon: HandCoins },
          ],
        },
        {
          id: "region",
          label: "지역인구",
          icon: Map,
          items: [{ id: "decline", label: "지역소멸", icon: Map }],
        },
      ],
    },
    {
      id: "univ",
      label: "대학현황",
      icon: GraduationCap,
      groups: [],
    },
    {
      id: "comp",
      label: "대학경쟁력분석",
      icon: Trophy,
      groups: [],
    },
  ],
};

export function KrdsMockSidebar() {
  return (
    <aside className="krds-mock-sidebar flex w-64 shrink-0 flex-col border-r border-border">
      <div className="border-b border-border px-5 py-5">
        <p className="text-base font-extrabold text-emerald-800">K-UniTrust</p>
        <p className="mt-0.5 text-[13px] font-medium text-slate-500">Dashboard · 목업</p>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {NAV.sections.map((section) => {
          const SectionIcon = section.icon;
          return (
            <div key={section.id} className="mb-4">
              <div className="mb-2 flex items-center gap-1.5 px-1 text-xs font-bold text-emerald-900">
                <SectionIcon size={14} strokeWidth={2.2} />
                {section.label}
              </div>
              {section.groups.map((group) => {
                const GroupIcon = group.icon;
                return (
                  <div key={group.id} className="mb-1">
                    <div className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-700">
                      <GroupIcon size={13} strokeWidth={2.2} />
                      {group.label}
                    </div>
                    {"open" in group && group.open ? (
                      <ul className="ml-3 space-y-0.5 border-l-2 border-emerald-200 pl-2.5">
                        {group.items.map((item) => {
                          const ItemIcon = item.icon;
                          return (
                            <li key={item.id}>
                              <span
                                className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] font-medium ${
                                  item.active
                                    ? "bg-gradient-to-r from-sky-500 to-blue-600 font-bold text-white shadow-sm"
                                    : "text-slate-600"
                                }`}
                              >
                                <ItemIcon size={12} strokeWidth={2.2} />
                                {item.label}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    ) : null}
                  </div>
                );
              })}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
