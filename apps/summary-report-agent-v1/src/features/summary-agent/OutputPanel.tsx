import { motion } from "framer-motion";
import { Copy, CopyCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, CircleAlert, HandHelping, Radar } from "lucide-react";
import { copy } from "../../app/copy";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { StatusBadge } from "../../components/ui/StatusBadge";
import type { SummaryReport } from "../../types/summary";
import type { TrialFeedbackChoice } from "../../types/trial-feedback";

type OutputPanelProps = {
  report: SummaryReport;
  isGenerating: boolean;
  feedbackChoice: TrialFeedbackChoice | null;
  onFeedback: (choice: TrialFeedbackChoice) => void;
};

const sections = [
  { key: "completed", title: copy.sections.completed, icon: CheckCircle2, tone: "text-sage bg-emerald-50" },
  { key: "current", title: copy.sections.current, icon: Radar, tone: "text-accent bg-blue-50" },
  { key: "blockers", title: copy.sections.blockers, icon: CircleAlert, tone: "text-danger bg-rose-50" },
  { key: "next", title: copy.sections.next, icon: ArrowRight, tone: "text-warn bg-amber-50" },
  { key: "needsAction", title: copy.sections.needsAction, icon: HandHelping, tone: "text-ink bg-slate-100" },
] as const;

function formatGeneratedAt(value: string | null) {
  if (!value) {
    return "尚未產生";
  }

  return new Intl.DateTimeFormat("zh-TW", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

async function copyTextToClipboard(text: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  if (typeof document === "undefined") {
    throw new Error("clipboard_unavailable");
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

export function OutputPanel({ report, isGenerating, feedbackChoice, onFeedback }: OutputPanelProps) {
  const hasResult = report.generatedAt !== null;
  const [copyState, setCopyState] = useState<"idle" | "success">("idle");

  const fullResultText = useMemo(() => {
    const groups = [
      [copy.sections.completed, report.completed],
      [copy.sections.current, report.current],
      [copy.sections.blockers, report.blockers],
      [copy.sections.next, report.next],
      [copy.sections.needsAction, [report.needsAction]],
    ] as const;

    return groups
      .map(([title, lines]) => [`【${title}】`, ...lines.map((line) => `- ${line}`)].join("\n"))
      .join("\n\n");
  }, [report]);

  useEffect(() => {
    if (copyState !== "success") {
      return;
    }

    const timeout = window.setTimeout(() => setCopyState("idle"), 1800);
    return () => window.clearTimeout(timeout);
  }, [copyState]);

  async function handleCopy() {
    try {
      await copyTextToClipboard(fullResultText);
      setCopyState("success");
    } catch {
      setCopyState("success");
    }
  }

  return (
    <Card className="brand-tint brand-ring p-6 md:p-7">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-sm font-medium text-accent">{copy.panels.output.eyebrow}</p>
          <h2 className="text-2xl font-semibold text-ink">{copy.panels.output.title}</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-mist">{copy.panels.output.description}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <StatusBadge tone="accent">{report.sourceMode}</StatusBadge>
          <StatusBadge tone={isGenerating ? "accent" : "success"}>{isGenerating ? "整理中" : "已就緒"}</StatusBadge>
          {hasResult ? (
            <Button className="px-4 py-2.5 text-xs" variant="secondary" onClick={() => void handleCopy()}>
              {copyState === "success" ? <CopyCheck className="mr-2 size-3.5" /> : <Copy className="mr-2 size-3.5" />}
              {copyState === "success" ? copy.copyAction.success : copy.copyAction.label}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mb-5 rounded-[28px] border border-white/80 bg-[linear-gradient(180deg,rgba(247,249,252,0.96),rgba(255,255,255,0.92))] p-5 shadow-[0_16px_30px_rgba(15,23,42,0.05)]">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-base font-semibold text-ink">{copy.panels.output.frameTitle}</p>
            <p className="mt-2 text-sm leading-6 text-mist">{copy.panels.output.frameBody}</p>
          </div>
          <div className="grid gap-3 text-right sm:grid-cols-2 sm:text-left">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-mist">{copy.panels.output.generatedAt}</p>
              <p className="mt-2 text-sm font-medium text-ink">{formatGeneratedAt(report.generatedAt)}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-mist">{copy.panels.output.sourceMode}</p>
              <p className="mt-2 text-sm font-medium text-ink">{report.sourceMode}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          {sections.map((section, index) => {
            const Icon = section.icon;
            const lines =
              section.key === "needsAction"
                ? [report.needsAction]
                : report[section.key as keyof Pick<SummaryReport, "completed" | "current" | "blockers" | "next">];

            return (
              <motion.div
                key={section.key}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, delay: index * 0.04 }}
                className="elevated-card rounded-[24px] border border-white/80 bg-white/92 p-4"
              >
                <div className="mb-3 flex items-center gap-3">
                  <div className={`rounded-2xl p-2 ${section.tone}`}>
                    <Icon className="size-4" />
                  </div>
                  <h3 className="text-base font-semibold text-ink">{section.title}</h3>
                </div>

                <ul className="space-y-2">
                  {lines.map((line) => (
                    <li key={line} className="flex gap-3 text-sm leading-6 text-slate-700">
                      <span className="mt-2 size-1.5 rounded-full bg-slate-400" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>

        {hasResult ? (
          <div className="mt-5 rounded-[24px] border border-white/85 bg-white/84 p-4 shadow-[0_12px_24px_rgba(15,23,42,0.04)]">
            {copyState === "success" ? (
              <p className="mb-3 text-sm font-medium text-accent">{copy.copyAction.fallback}</p>
            ) : null}

            <p className="text-sm font-semibold text-ink">{copy.feedback.title}</p>
            <p className="mt-2 text-sm leading-6 text-mist">{copy.feedback.description}</p>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Button
                className="min-w-[132px]"
                variant={feedbackChoice === "positive" ? "primary" : "secondary"}
                onClick={() => onFeedback("positive")}
                disabled={feedbackChoice !== null}
              >
                {copy.feedback.positive}
              </Button>
              <Button
                className="min-w-[132px]"
                variant={feedbackChoice === "negative" ? "primary" : "secondary"}
                onClick={() => onFeedback("negative")}
                disabled={feedbackChoice !== null}
              >
                {copy.feedback.negative}
              </Button>
            </div>

            {feedbackChoice ? (
              <p className="mt-3 text-sm leading-6 text-mist">
                {feedbackChoice === "positive" ? copy.feedback.thanksPositive : copy.feedback.thanksNegative}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </Card>
  );
}
