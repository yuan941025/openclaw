import { ArrowRight, Bot, FileText, Sparkles } from "lucide-react";
import { copy } from "../../app/copy";
import { Button } from "../../components/ui/Button";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { useSummaryAgent } from "../../hooks/useSummaryAgent";
import { AudienceSection } from "./AudienceSection";
import { CTASection } from "./CTASection";
import { EarlyAccessSection } from "./EarlyAccessSection";
import { ExampleSwitcher } from "./ExampleSwitcher";
import { FounderPreview } from "./FounderPreview";
import { InputPanel } from "./InputPanel";
import { OutputPanel } from "./OutputPanel";
import { PricingSection } from "./PricingSection";
import { ProductHighlights } from "./ProductHighlights";
import { SiteFooter } from "./SiteFooter";
import { WorkflowSection } from "./WorkflowSection";

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function SummaryAgentPage() {
  const {
    examples,
    selectedExample,
    selectedExampleId,
    setSelectedExampleId,
    rawInput,
    setRawInput,
    report,
    isGenerating,
    generateReport,
    loadExample,
    stats,
    feedbackChoice,
    submitFeedback,
    isFounderPreviewOpen,
    setIsFounderPreviewOpen,
  } = useSummaryAgent();

  return (
    <main className="min-h-screen px-4 py-6 md:px-8 md:py-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 md:gap-8">
        <section className="surface-card hero-panel brand-ring relative overflow-hidden border-[rgba(118,126,255,0.12)] p-6 md:p-9">
          <div className="hero-orb left-[-72px] top-[-52px] h-48 w-48 bg-[#8b8eff]" />
          <div className="hero-orb bottom-[-36px] right-[-56px] h-44 w-44 bg-[#8ec0ff]" />

          <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)]">
            <div className="max-w-3xl">
              <div className="mb-4 flex flex-wrap gap-2">
                <StatusBadge tone="accent">{copy.localMode}</StatusBadge>
                <StatusBadge>{copy.testMode}</StatusBadge>
                <StatusBadge>{copy.engine}</StatusBadge>
              </div>

              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-accent">{copy.hero.eyebrow}</p>

              <div className="flex items-start gap-4">
                <div className="rounded-[28px] bg-[linear-gradient(135deg,#4f56f5_0%,#7a89ff_100%)] p-3.5 text-white shadow-soft">
                  <Bot className="size-7" />
                </div>
                <div>
                  <h1 className="max-w-3xl bg-[linear-gradient(135deg,#172033_0%,#33406a_52%,#5b5df6_100%)] bg-clip-text text-4xl font-semibold tracking-[-0.045em] text-transparent md:text-[4.8rem] md:leading-[1.01]">
                    {copy.title}
                  </h1>
                  <p className="mt-3 text-xl leading-8 text-slate-800 md:max-w-2xl md:text-[1.65rem] md:leading-9">
                    {copy.subtitle}
                  </p>
                </div>
              </div>

              <h2 className="mt-7 max-w-3xl text-2xl font-semibold leading-9 text-ink md:text-[2.85rem] md:leading-[3.4rem]">
                {copy.hero.title}
              </h2>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-mist md:text-[1.04rem] md:leading-8">{copy.hero.body}</p>

              <div className="hero-line mt-6 h-px w-full max-w-xl" />

              <div className="mt-6 flex flex-wrap gap-2.5">
                <div className="brand-chip rounded-full border border-[#dfe3ff] bg-white/86 px-4 py-2 text-sm font-medium text-[#454ddc]">
                  3 種高頻使用場景
                </div>
                <div className="brand-chip rounded-full border border-white/90 bg-white/78 px-4 py-2 text-sm font-medium text-slate-700">
                  5 段固定結構輸出
                </div>
                <div className="brand-chip rounded-full border border-white/90 bg-white/78 px-4 py-2 text-sm font-medium text-slate-700">
                  立即體驗，無需設定
                </div>
              </div>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Button className="min-w-[168px]" onClick={() => scrollToSection("try")}>
                  <Sparkles className="mr-2 size-4" />
                  {copy.cta.primary}
                </Button>
                <Button className="min-w-[168px]" variant="secondary" onClick={() => scrollToSection("examples")}>
                  {copy.cta.secondary}
                </Button>
              </div>
            </div>

            <div className="brand-callout elevated-card brand-ring relative overflow-hidden rounded-[36px] border border-white/70 p-6 md:p-7">
              <div className="absolute right-[-12px] top-[-18px] h-36 w-36 rounded-full bg-[#cfd4ff]/60 blur-3xl" />
              <div className="absolute bottom-0 left-0 h-24 w-24 rounded-full bg-[#c9ecff]/60 blur-3xl" />

              <div className="relative mb-5 flex items-center gap-3">
                <div className="rounded-2xl bg-accentSoft p-3 text-accent shadow-sm">
                  <FileText className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink">{copy.hero.previewTitle}</p>
                  <p className="text-xs text-mist">品牌化展示的輸入到輸出流程</p>
                </div>
              </div>

              <div className="relative grid gap-4">
                <div className="brand-panel rounded-[24px] border border-white/90 p-4 shadow-[0_16px_30px_rgba(15,23,42,0.06)]">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-mist">Content In</p>
                    <StatusBadge>Meeting / AI / Client</StatusBadge>
                  </div>
                  <ul className="space-y-2 text-sm leading-6 text-slate-700">
                    <li>會議記錄與待辦事項</li>
                    <li>AI 長回覆與建議</li>
                    <li>客戶訊息與需求變更</li>
                  </ul>
                </div>

                <div className="flex items-center justify-center">
                  <div className="brand-chip inline-flex items-center gap-2 rounded-full border border-[#dde1ff] bg-white/88 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                    <Sparkles className="size-3.5" />
                    ActionBrief
                    <ArrowRight className="size-3.5" />
                  </div>
                </div>

                <div className="brand-spotlight rounded-[26px] p-5 text-white shadow-[0_24px_44px_rgba(59,73,168,0.2)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/75">Brief Out</p>
                  <ul className="mt-4 space-y-3">
                    {copy.hero.previewItems.map((item) => (
                      <li key={item} className="flex gap-3 text-sm leading-6 text-white/90">
                        <span className="mt-2 size-1.5 rounded-full bg-white/80" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        <CTASection
          onTry={() => scrollToSection("try")}
          onExamples={() => scrollToSection("examples")}
          onPricing={() => scrollToSection("signal")}
        />

        <AudienceSection />

        <ProductHighlights />

        <WorkflowSection />

        <PricingSection />

        <section id="signal">
          <EarlyAccessSection />
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)]">
          <InputPanel
            rawInput={rawInput}
            onChange={setRawInput}
            onGenerate={() => generateReport()}
            onLoadExample={loadExample}
            isGenerating={isGenerating}
            selectedExampleLabel={selectedExample.label}
          />
          <OutputPanel
            report={report}
            isGenerating={isGenerating}
            feedbackChoice={feedbackChoice}
            onFeedback={submitFeedback}
          />
        </section>

        <ExampleSwitcher
          examples={examples}
          selectedExampleId={selectedExampleId}
          onSelect={setSelectedExampleId}
        />

        <SiteFooter />

        <FounderPreview
          isOpen={isFounderPreviewOpen}
          onToggle={() => setIsFounderPreviewOpen((current) => !current)}
          stats={stats}
        />
      </div>
    </main>
  );
}
