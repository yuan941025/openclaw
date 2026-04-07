import { motion } from "framer-motion";
import { Activity, ArrowRight } from "lucide-react";
import { copy, formatStageValue } from "../../app/copy";
import { Card } from "../../components/ui/Card";
import type { TimelineEvent } from "../../types/dashboard";

type ActivityTimelineProps = {
  events: TimelineEvent[];
  compact?: boolean;
};

function stageClass(stage: TimelineEvent["stage"]) {
  switch (stage) {
    case "success":
      return "border-cyan-300/20 bg-cyan-300/8";
    case "running":
      return "border-violet-300/20 bg-violet-300/8";
    case "error":
      return "border-rose-300/20 bg-rose-300/8";
    default:
      return "border-white/10 bg-white/6";
  }
}

export function ActivityTimeline({ events, compact = false }: ActivityTimelineProps) {
  return (
    <Card className={compact ? "p-4" : "p-5"} accent="violet">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-white/42">{copy.activity.eyebrow}</p>
          <h3 className="mt-2 text-lg font-semibold text-slate-50">{copy.activity.title}</h3>
        </div>
        <div className="rounded-full border border-white/10 bg-white/6 p-2 text-white/54">
          <Activity className="size-4" />
        </div>
      </div>

      <div className="relative space-y-3 overflow-hidden">
        <div className="absolute bottom-0 left-[11px] top-1 hidden w-px bg-white/10 sm:block" />
        <div className="absolute left-[11px] top-0 hidden h-20 w-px bg-gradient-to-b from-cyan-300/0 via-cyan-300/55 to-cyan-300/0 sm:block sm:animate-drift-line" />

        {events.slice(0, compact ? 4 : 6).map((event, index) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="relative pl-0 sm:pl-8"
          >
            <span className="absolute left-0 top-4 hidden size-3 rounded-full border border-cyan-300/30 bg-cyan-300/55 sm:block" />
            <div className={`rounded-[22px] border p-4 ${stageClass(event.stage)}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-50">{event.title}</p>
                  <p className="mt-2 text-xs text-white/45">{formatStageValue(event.stage)}</p>
                  <p className="mt-2 text-sm leading-6 text-white/58">{event.detail}</p>
                </div>
                <div className="rounded-full border border-white/10 bg-slate-950/40 p-2 text-white/44">
                  <ArrowRight className="size-4" />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}