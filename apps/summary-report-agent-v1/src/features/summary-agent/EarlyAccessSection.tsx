import { CheckCircle2, Send } from "lucide-react";
import { useState, type FormEvent } from "react";
import { copy } from "../../app/copy";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { saveInterestSignal } from "../../services/interestSignalStore";

type EarlyAccessSectionProps = {
  compact?: boolean;
};

export function EarlyAccessSection({ compact = false }: EarlyAccessSectionProps) {
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) {
      return;
    }

    saveInterestSignal(email, note);
    setIsSubmitted(true);
    setEmail("");
    setNote("");
  }

  return (
    <Card className="brand-tint brand-ring p-6 md:p-7">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <p className="mb-2 text-sm font-medium text-accent">{copy.signal.eyebrow}</p>
          <h2 className="text-2xl font-semibold leading-9 text-ink">{copy.signal.titleEn}</h2>
          <p className="mt-2 text-base leading-8 text-slate-700">{copy.signal.titleZh}</p>
          <div className="mt-4 space-y-3">
            <p className="text-sm leading-7 text-mist">{copy.signal.descriptionEn}</p>
            <p className="text-sm leading-7 text-slate-600">{copy.signal.descriptionZh}</p>
          </div>
        </div>

        {!compact ? (
          <div className="rounded-full border border-[#dde1ff] bg-white/88 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-accent shadow-sm">
            {copy.signal.badge}
          </div>
        ) : null}
      </div>

      <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <label className="grid gap-2">
            <span className="grid gap-0.5">
              <span className="text-sm font-medium text-ink">{copy.signal.emailLabelEn}</span>
              <span className="text-xs text-mist">{copy.signal.emailLabelZh}</span>
            </span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={copy.signal.emailPlaceholder}
              className="rounded-[18px] border border-white/85 bg-white/92 px-4 py-3 text-sm text-ink shadow-[0_10px_20px_rgba(15,23,42,0.04)] outline-none transition focus:border-[#cfd4ff] focus:ring-4 focus:ring-[#eef0ff]"
              required
            />
          </label>

          <label className="grid gap-2">
            <span className="grid gap-0.5">
              <span className="text-sm font-medium text-ink">{copy.signal.noteLabelEn}</span>
              <span className="text-xs text-mist">{copy.signal.noteLabelZh}</span>
            </span>
            <input
              type="text"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder={copy.signal.notePlaceholder}
              className="rounded-[18px] border border-white/85 bg-white/92 px-4 py-3 text-sm text-ink shadow-[0_10px_20px_rgba(15,23,42,0.04)] outline-none transition focus:border-[#cfd4ff] focus:ring-4 focus:ring-[#eef0ff]"
            />
          </label>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1 text-sm leading-6 text-mist">
            <p>{copy.signal.helperEn}</p>
            <p className="text-slate-600">{copy.signal.helperZh}</p>
          </div>
          <Button className="min-w-[148px]" type="submit">
            <Send className="mr-2 size-4" />
            {copy.signal.submit}
          </Button>
        </div>

        {isSubmitted ? (
          <div className="rounded-[18px] border border-emerald-200/80 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-800 shadow-sm">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 size-4" />
              <div>
                <p className="font-medium">{copy.signal.success}</p>
                <p className="mt-1 text-emerald-700">{copy.signal.successHint}</p>
              </div>
            </div>
          </div>
        ) : null}
      </form>
    </Card>
  );
}
