import { CheckCircle2, FileCode2, OctagonAlert, Radar } from "lucide-react";
import { copy } from "../../app/copy";
import { Card } from "../../components/ui/Card";
import type { ExecutionResultState } from "../../types/dashboard";

type ExecutionResultProps = {
  result: ExecutionResultState;
};

function iconForState(state: ExecutionResultState["status"]) {
  switch (state) {
    case "success":
      return CheckCircle2;
    case "error":
      return OctagonAlert;
    case "running":
      return Radar;
    default:
      return FileCode2;
  }
}

export function ExecutionResult({ result }: ExecutionResultProps) {
  const Icon = iconForState(result.status);

  return (
    <Card className="p-5" accent="neutral">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-white/42">{copy.execution.eyebrow}</p>
          <h3 className="mt-2 text-lg font-semibold text-slate-50">{result.title}</h3>
          <p className="mt-2 text-sm leading-6 text-white/58">{result.body}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/6 p-3 text-white/54">
          <Icon className="size-5" />
        </div>
      </div>

      <div className="mt-4 rounded-[24px] border border-white/10 bg-slate-950/55 p-4">
        <pre className="overflow-auto text-xs leading-6 text-cyan-100/78">{result.raw}</pre>
      </div>
    </Card>
  );
}