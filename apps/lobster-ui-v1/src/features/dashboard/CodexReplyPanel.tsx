import { BotMessageSquare, CheckCircle2, OctagonAlert, Radar } from "lucide-react";
import { copy, formatSourceValue } from "../../app/copy";
import { Card } from "../../components/ui/Card";
import { StatusPill } from "../../components/ui/StatusPill";
import type { CodexReplyState } from "../../types/dashboard";

type CodexReplyPanelProps = {
  reply: CodexReplyState;
};

function iconForState(state: CodexReplyState["status"]) {
  switch (state) {
    case "success":
      return CheckCircle2;
    case "error":
      return OctagonAlert;
    case "running":
      return Radar;
    default:
      return BotMessageSquare;
  }
}

function toneForState(state: CodexReplyState["status"]) {
  switch (state) {
    case "success":
      return "online";
    case "error":
      return "mock";
    case "running":
      return "thinking";
    default:
      return "idle";
  }
}

export function CodexReplyPanel({ reply }: CodexReplyPanelProps) {
  const Icon = iconForState(reply.status);

  return (
    <Card className="p-5" accent="cyan">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-100/70">
              {copy.codex.latestReplyEyebrow}
            </p>
            <h3 className="mt-2 text-xl font-semibold text-slate-50">{copy.codex.latestReplyTitle}</h3>
            <p className="mt-2 text-sm leading-6 text-white/64">{reply.summary}</p>
          </div>

          <div className="flex flex-wrap gap-2 text-sm text-white/58">
            <span className="rounded-full border border-white/10 px-3 py-1">
              {formatSourceValue(reply.source)}
            </span>
            <span className="rounded-full border border-white/10 px-3 py-1">
              {new Intl.DateTimeFormat("zh-TW", {
                hour: "2-digit",
                minute: "2-digit",
              }).format(new Date(reply.updatedAt))}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <StatusPill
            label={copy.codex.latestReplyState}
            value={reply.stateLabel}
            tone={toneForState(reply.status)}
          />
          <div className="rounded-2xl border border-white/10 bg-white/6 p-3 text-white/58">
            <Icon className="size-5" />
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-[24px] border border-cyan-300/14 bg-slate-950/60 p-4 sm:p-5">
        <pre className="overflow-auto whitespace-pre-wrap text-sm leading-7 text-cyan-50/88">{reply.report}</pre>
      </div>
    </Card>
  );
}
