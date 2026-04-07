import type { PropsWithChildren } from "react";

type StatusBadgeProps = PropsWithChildren<{
  tone?: "accent" | "neutral" | "success";
}>;

const toneClassName = {
  accent: "border-[#d8dbff] bg-[#eef0ff] text-[#454bdb]",
  neutral: "border-white/80 bg-white/90 text-slate-600",
  success: "border-emerald-200/90 bg-emerald-50/90 text-emerald-700",
};

export function StatusBadge({ children, tone = "neutral" }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1.5 text-[11px] font-semibold tracking-[0.08em] uppercase ${toneClassName[tone]}`}
    >
      {children}
    </span>
  );
}
