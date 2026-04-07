import { ArrowRight, FileSearch2, PlayCircle } from "lucide-react";
import { copy } from "../../app/copy";
import { Button } from "../../components/ui/Button";

type CTASectionProps = {
  onTry: () => void;
  onExamples: () => void;
  onPricing: () => void;
};

export function CTASection({ onTry, onExamples, onPricing }: CTASectionProps) {
  return (
    <section className="surface-card brand-tint brand-ring overflow-hidden p-6 md:p-7">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="max-w-2xl">
          <p className="mb-2 text-sm font-medium text-accent">{copy.cta.eyebrow}</p>
          <h2 className="text-2xl font-semibold text-ink md:text-[2rem]">{copy.cta.title}</h2>
          <p className="mt-3 text-sm leading-7 text-mist md:text-base">{copy.cta.body}</p>

          <div className="mt-5 flex flex-wrap gap-2">
            <span className="brand-chip rounded-full border border-[#dde1ff] bg-white/90 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-[#4a50df]">
              Fast to Try
            </span>
            <span className="brand-chip rounded-full border border-white/90 bg-white/85 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">
              No Setup
            </span>
            <span className="brand-chip rounded-full border border-white/90 bg-white/85 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">
              Structured Output
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
          <Button className="min-w-[160px]" onClick={onTry}>
            <PlayCircle className="mr-2 size-4" />
            {copy.cta.primary}
          </Button>
          <Button className="min-w-[156px]" variant="secondary" onClick={onExamples}>
            <FileSearch2 className="mr-2 size-4" />
            {copy.cta.secondary}
          </Button>
          <Button className="min-w-[144px]" variant="ghost" onClick={onPricing}>
            <ArrowRight className="mr-2 size-4" />
            {copy.cta.tertiary}
          </Button>
        </div>
      </div>
    </section>
  );
}
