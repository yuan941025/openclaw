import { Check, Sparkles } from "lucide-react";
import { copy } from "../../app/copy";

export function PricingSection() {
  return (
    <section className="surface-card brand-tint brand-ring p-6 md:p-7" id="pricing">
      <div className="mb-6 max-w-2xl">
        <p className="mb-2 text-sm font-medium text-accent">{copy.pricing.eyebrow}</p>
        <h2 className="text-2xl font-semibold text-ink md:text-[2rem]">{copy.pricing.title}</h2>
        <p className="mt-3 text-sm leading-7 text-mist md:text-base">{copy.pricing.description}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {copy.pricing.plans.map((plan) => {
          const isFeatured = "featured" in plan && plan.featured;
          const isUpcoming = plan.price === "Coming Soon";
          const displayName = isUpcoming ? "Team — Coming Soon" : plan.name;

          return (
            <div
              key={plan.name}
              className={`elevated-card brand-ring relative overflow-hidden rounded-[30px] border p-6 ${
                isFeatured
                  ? "border-[#d7dbff] bg-[linear-gradient(180deg,rgba(241,242,255,0.99),rgba(255,255,255,0.95))] shadow-soft"
                  : isUpcoming
                    ? "border-amber-200/80 bg-[linear-gradient(180deg,rgba(255,249,239,0.98),rgba(255,255,255,0.95))]"
                    : "border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(249,250,255,0.94))]"
              }`}
            >
              {isFeatured ? <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#5b5df6,#84b8ff)]" /> : null}

              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-ink">{displayName}</p>
                  <p className="mt-2 text-sm text-mist">{plan.badge}</p>
                </div>
                {isFeatured ? (
                  <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold text-accent shadow-sm">
                    <Sparkles className="mr-1.5 size-3.5" />
                    主力方案
                  </span>
                ) : isUpcoming ? (
                  <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold text-amber-700 shadow-sm">
                    Coming Soon
                  </span>
                ) : null}
              </div>

              <p className="text-3xl font-semibold tracking-tight text-ink">{plan.price}</p>
              <p className="mt-3 text-sm leading-6 text-slate-700">{plan.description}</p>

              <ul className="mt-5 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-3 text-sm leading-6 text-slate-700">
                    <span className="mt-1 inline-flex rounded-full bg-emerald-100 p-1 text-emerald-700">
                      <Check className="size-3.5" />
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
