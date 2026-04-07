import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { copy } from "../../app/copy";
import { Card } from "../../components/ui/Card";
import { MetricCard } from "../../components/ui/MetricCard";
import type { DashboardMetrics } from "../../types/dashboard";

type MetricsPanelProps = {
  metrics: DashboardMetrics;
};

export function MetricsPanel({ metrics }: MetricsPanelProps) {
  return (
    <div className="space-y-4">
      <Card className="p-5" accent="violet">
        <div className="space-y-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-white/42">{copy.metrics.eyebrow}</p>
            <h3 className="mt-2 text-lg font-semibold text-slate-50">{copy.metrics.title}</h3>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            <MetricCard
              title={copy.metrics.commands}
              value={String(metrics.todayCommands)}
              caption={copy.metrics.commandsCaption}
            />
            <MetricCard
              title={copy.metrics.success}
              value={`${metrics.successRate}%`}
              caption={copy.metrics.successCaption}
            />
            <MetricCard
              title={copy.metrics.avgResponse}
              value={`${metrics.avgResponseMs}ms`}
              caption={copy.metrics.avgResponseCaption}
            />
            <MetricCard
              title={copy.metrics.localRatio}
              value={`${metrics.localExecutionRatio}%`}
              caption={copy.metrics.localRatioCaption}
            />
            <MetricCard
              title={copy.metrics.modelRatio}
              value={`${metrics.modelUsageRatio}%`}
              caption={copy.metrics.modelRatioCaption}
            />
            <MetricCard
              title={copy.metrics.tokenCost}
              value={metrics.tokenCostLabel}
              caption={copy.metrics.tokenCostCaption}
            />
          </div>
        </div>
      </Card>

      <Card className="p-5" accent="cyan">
        <div className="space-y-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-white/42">{copy.metrics.flowEyebrow}</p>
            <h3 className="mt-2 text-lg font-semibold text-slate-50">{copy.metrics.flowTitle}</h3>
          </div>

          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.trend}>
                <defs>
                  <linearGradient id="commands-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#66e3ff" stopOpacity={0.55} />
                    <stop offset="95%" stopColor="#66e3ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="label" stroke="rgba(255,255,255,0.35)" tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.28)" tickLine={false} axisLine={false} width={28} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(5, 8, 22, 0.94)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "16px",
                    color: "#e2f6ff",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="commands"
                  stroke="#66e3ff"
                  strokeWidth={2}
                  fill="url(#commands-gradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>
    </div>
  );
}