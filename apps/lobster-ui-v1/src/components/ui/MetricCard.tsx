import { ArrowUpRight } from "lucide-react";
import { Card } from "./Card";

type MetricCardProps = {
  title: string;
  value: string;
  caption: string;
};

export function MetricCard({ title, value, caption }: MetricCardProps) {
  return (
    <Card className="p-4" accent="neutral">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-white/45">{title}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-50">{value}</p>
        </div>
        <div className="rounded-full border border-white/10 bg-white/6 p-2 text-white/50">
          <ArrowUpRight className="size-4" />
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-white/58">{caption}</p>
    </Card>
  );
}
