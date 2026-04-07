import { ArrowDownToLine, FileOutput, Send } from "lucide-react";
import { copy } from "../../app/copy";

const icons = [ArrowDownToLine, Send, FileOutput] as const;

export function WorkflowSection() {
  return (
    <section className="surface-card brand-tint brand-ring p-6 md:p-7">
      <div className="mb-6 max-w-2xl">
        <p className="mb-2 text-sm font-medium text-accent">{copy.workflow.eyebrow}</p>
        <h2 className="text-2xl font-semibold text-ink md:text-[2rem]">{copy.workflow.title}</h2>
        <p className="mt-3 text-sm leading-7 text-mist md:text-base">{copy.workflow.description}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {copy.workflow.steps.map((step, index) => {
          const Icon = icons[index];

          return (
            <div key={step.title} className="elevated-card rounded-[24px] border border-slate-200/80 bg-white/95 p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="inline-flex rounded-2xl bg-accentSoft p-3 text-accent">
                  <Icon className="size-5" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-mist">0{index + 1}</span>
              </div>
              <h3 className="text-lg font-semibold text-ink">{step.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-700">{step.body}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
