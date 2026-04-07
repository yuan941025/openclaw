import { cn } from "../../styles/cn";

type StatusPillProps = {
  label: string;
  value: string;
  tone: "online" | "mock" | "idle" | "thinking";
};

const toneClasses: Record<StatusPillProps["tone"], string> = {
  online: "bg-cyan-300/12 text-cyan-100 border-cyan-300/20",
  mock: "bg-amber-300/10 text-amber-50 border-amber-300/20",
  idle: "bg-white/6 text-white/70 border-white/10",
  thinking: "bg-violet-300/12 text-violet-100 border-violet-300/25",
};

const dotClasses: Record<StatusPillProps["tone"], string> = {
  online: "bg-cyan-300 shadow-[0_0_18px_rgba(102,227,255,0.55)]",
  mock: "bg-amber-300 shadow-[0_0_18px_rgba(251,191,36,0.4)]",
  idle: "bg-white/50 shadow-[0_0_18px_rgba(255,255,255,0.22)]",
  thinking: "bg-violet-300 shadow-[0_0_18px_rgba(167,139,250,0.5)]",
};

export function StatusPill({ label, value, tone }: StatusPillProps) {
  return (
    <div
      className={cn(
        "inline-flex min-w-[132px] items-center gap-3 rounded-full border px-4 py-2.5",
        toneClasses[tone],
      )}
    >
      <span className={cn("size-2 rounded-full animate-soft-pulse", dotClasses[tone])} />
      <div className="leading-tight">
        <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">{label}</p>
        <p className="mt-1 text-sm font-medium text-inherit">{value}</p>
      </div>
    </div>
  );
}
