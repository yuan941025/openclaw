import { BrainCircuit, GaugeCircle, Sparkle, TriangleAlert } from "lucide-react";
import { copy } from "../../app/copy";
import { Card } from "../../components/ui/Card";
import type { LearningStatus } from "../../types/dashboard";

type LearningPanelProps = {
  learning: LearningStatus;
};

const learningCards = [
  { key: "status", title: copy.learning.status, icon: BrainCircuit },
  { key: "optimizations", title: copy.learning.optimizations, icon: Sparkle },
  { key: "failure", title: copy.learning.failure, icon: TriangleAlert },
  { key: "suggestion", title: copy.learning.suggestion, icon: GaugeCircle },
] as const;

export function LearningPanel({ learning }: LearningPanelProps) {
  return (
    <Card className="p-5 sm:p-6" accent="violet">
      <div className="space-y-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-white/42">{copy.learning.eyebrow}</p>
          <h3 className="mt-2 text-xl font-semibold text-slate-50">{copy.learning.title}</h3>
        </div>

        <div className="grid gap-3 xl:grid-cols-4">
          {learningCards.map((card) => {
            const Icon = card.icon;
            const body =
              card.key === "status"
                ? learning.status
                : card.key === "optimizations"
                  ? learning.recentOptimizations.join(" ")
                  : card.key === "failure"
                    ? learning.lastFailure
                    : learning.nextSuggestion;
            return (
              <div
                key={card.key}
                className="rounded-[24px] border border-white/10 bg-white/6 p-4 text-sm leading-6 text-white/60"
              >
                <div className="mb-3 inline-flex rounded-2xl border border-white/10 bg-slate-950/45 p-2 text-cyan-100/78">
                  <Icon className="size-4" />
                </div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-white/40">{card.title}</p>
                <p className="mt-3 text-sm leading-7 text-white/68">{body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}