import { Compass, Layers3, Sparkles } from "lucide-react";
import { copy } from "../../app/copy";

const icons = [Sparkles, Layers3, Compass] as const;

export function ProductHighlights() {
  return (
    <section className="surface-card brand-tint brand-ring p-6 md:p-7">
      <div className="mb-6 max-w-2xl">
        <p className="mb-2 text-sm font-medium text-accent">{copy.highlights.eyebrow}</p>
        <h2 className="text-2xl font-semibold text-ink md:text-[2rem]">{copy.highlights.title}</h2>
        <p className="mt-3 text-sm leading-7 text-mist md:text-base">{copy.highlights.description}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {copy.highlights.items.map((item, index) => {
          const Icon = icons[index];

          return (
            <div key={item.title} className="elevated-card rounded-[24px] border border-slate-200/80 bg-slate-50/85 p-5">
              <div className="mb-4 inline-flex rounded-2xl bg-white p-3 text-accent shadow-sm">
                <Icon className="size-5" />
              </div>
              <h3 className="text-lg font-semibold text-ink">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-700">{item.body}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
