import { useState } from "react";
import { copy } from "../../app/copy";
import { Card } from "../../components/ui/Card";
import { readTrialStats } from "../../services/trialFeedbackStore";
import { FounderPreview } from "./FounderPreview";
import { SiteFooter } from "./SiteFooter";

export function FounderPreviewPage() {
  const [isOpen, setIsOpen] = useState(true);
  const [stats] = useState(() => readTrialStats());

  return (
    <main className="min-h-screen px-4 py-6 md:px-8 md:py-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 md:gap-8">
        <Card className="hero-panel brand-ring overflow-hidden p-6 md:p-8">
          <a href="#/" className="text-sm font-medium text-accent transition hover:opacity-80">
            {copy.legal.backHome}
          </a>

          <div className="mt-5 max-w-3xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-accent">
              Founder Preview
            </p>
            <h1 className="text-4xl font-semibold tracking-[-0.04em] text-ink md:text-5xl">
              Founder Preview
            </h1>
            <p className="mt-4 text-base leading-8 text-mist">
              這是 founder 專用的最小試用統計預覽頁，不會在公開首頁中直接顯示。
            </p>
          </div>
        </Card>

        <FounderPreview isOpen={isOpen} onToggle={() => setIsOpen((current) => !current)} stats={stats} />

        <SiteFooter />
      </div>
    </main>
  );
}
