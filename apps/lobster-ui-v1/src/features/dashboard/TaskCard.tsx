import { Clock3 } from "lucide-react";
import { copy, formatSourceValue, formatStageValue } from "../../app/copy";
import { Card } from "../../components/ui/Card";
import { StatusPill } from "../../components/ui/StatusPill";
import type { TaskCardState } from "../../types/dashboard";

type TaskCardProps = {
  task: TaskCardState;
};

function stageTone(stage: TaskCardState["status"]) {
  switch (stage) {
    case "success":
      return "online";
    case "running":
      return "thinking";
    case "error":
      return "mock";
    default:
      return "idle";
  }
}

export function TaskCard({ task }: TaskCardProps) {
  return (
    <Card className="p-5" accent="cyan">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-[0.24em] text-white/42">{copy.task.eyebrow}</p>
          <h3 className="text-xl font-semibold text-slate-50">{task.title}</h3>
          <p className="max-w-2xl text-sm leading-6 text-white/58">{task.summary}</p>
          <div className="flex flex-wrap items-center gap-2 text-sm text-white/46">
            <span className="rounded-full border border-white/10 px-3 py-1">{formatSourceValue(task.source)}</span>
            <span className="rounded-full border border-white/10 px-3 py-1">{task.target}</span>
          </div>
        </div>

        <div className="space-y-3">
          <StatusPill label={copy.task.state} value={formatStageValue(task.status)} tone={stageTone(task.status)} />
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-2 text-sm text-white/54">
            <Clock3 className="size-4" />
            <span>{new Date(task.updatedAt).toLocaleTimeString("zh-TW")}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}