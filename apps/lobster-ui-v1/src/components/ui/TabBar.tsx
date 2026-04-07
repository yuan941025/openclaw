import { Activity, BrainCircuit, Gauge, Joystick } from "lucide-react";
import { getTabLabel } from "../../app/copy";
import type { MobileTab } from "../../types/dashboard";
import { cn } from "../../styles/cn";

type TabBarProps = {
  activeTab: MobileTab;
  onSelect: (tab: MobileTab) => void;
};

const tabs: Array<{ id: MobileTab; icon: typeof Joystick }> = [
  { id: "control", icon: Joystick },
  { id: "activity", icon: Activity },
  { id: "metrics", icon: Gauge },
  { id: "learn", icon: BrainCircuit },
];

export function TabBar({ activeTab, onSelect }: TabBarProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-slate-950/85 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-2xl lg:hidden">
      <div className="mx-auto grid max-w-xl grid-cols-4 gap-2 rounded-[28px] border border-white/10 bg-white/6 p-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelect(tab.id)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium transition-all duration-200",
                active ? "bg-cyan-300/14 text-cyan-50" : "text-white/55",
              )}
            >
              <Icon className="size-4" />
              <span>{getTabLabel(tab.id)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}