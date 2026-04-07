import { BarChart3, ChevronDown, ChevronUp } from "lucide-react";
import { copy } from "../../app/copy";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import type { TrialStats } from "../../types/trial-feedback";

type FounderPreviewProps = {
  isOpen: boolean;
  onToggle: () => void;
  stats: TrialStats;
};

const scenarioLabels = {
  meeting: "會議記錄整理",
  ai: "AI 長回覆整理",
  client: "客戶對話整理",
} as const;

export function FounderPreview({ isOpen, onToggle, stats }: FounderPreviewProps) {
  const metrics = [
    { label: copy.founder.metrics.pageViews, value: stats.pageViews },
    { label: copy.founder.metrics.generateClicks, value: stats.generateClicks },
    { label: copy.founder.metrics.successfulOutputs, value: stats.successfulOutputs },
    { label: copy.founder.metrics.exampleClicks, value: stats.exampleClicks },
    { label: copy.founder.metrics.feedbackPositive, value: stats.feedbackPositive },
    { label: copy.founder.metrics.feedbackNegative, value: stats.feedbackNegative },
  ];

  return (
    <Card className="brand-tint brand-ring p-5 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl">
          <p className="mb-2 text-sm font-medium text-accent">{copy.founder.eyebrow}</p>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-accentSoft p-2.5 text-accent shadow-sm">
              <BarChart3 className="size-4" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-ink">{copy.founder.title}</h2>
              <p className="mt-1 text-sm leading-6 text-mist">{copy.founder.description}</p>
            </div>
          </div>
        </div>

        <Button variant="ghost" onClick={onToggle}>
          {isOpen ? <ChevronUp className="mr-2 size-4" /> : <ChevronDown className="mr-2 size-4" />}
          {isOpen ? copy.founder.toggleClose : copy.founder.toggleOpen}
        </Button>
      </div>

      {isOpen ? (
        <div className="mt-5 grid gap-4">
          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-[22px] border border-white/85 bg-white/86 px-4 py-4 shadow-[0_12px_24px_rgba(15,23,42,0.05)]"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-mist">{metric.label}</p>
                <p className="mt-3 text-2xl font-semibold tracking-tight text-ink">{metric.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-[24px] border border-white/85 bg-white/82 p-4 shadow-[0_12px_24px_rgba(15,23,42,0.05)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-mist">{copy.founder.scenariosTitle}</p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {Object.entries(stats.exampleUsage).map(([key, value]) => (
                <div key={key} className="rounded-[18px] border border-slate-200/80 bg-slate-50/85 px-4 py-3">
                  <p className="text-sm font-medium text-ink">{scenarioLabels[key as keyof typeof scenarioLabels]}</p>
                  <p className="mt-2 text-sm text-mist">使用次數：{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
