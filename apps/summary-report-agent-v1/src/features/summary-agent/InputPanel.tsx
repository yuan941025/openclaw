import { Sparkles, WandSparkles } from "lucide-react";
import { copy } from "../../app/copy";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { TextArea } from "../../components/ui/TextArea";

type InputPanelProps = {
  rawInput: string;
  onChange: (value: string) => void;
  onGenerate: () => Promise<void> | void;
  onLoadExample: () => Promise<void> | void;
  isGenerating: boolean;
  selectedExampleLabel: string;
};

export function InputPanel({
  rawInput,
  onChange,
  onGenerate,
  onLoadExample,
  isGenerating,
  selectedExampleLabel,
}: InputPanelProps) {
  return (
    <Card className="brand-tint brand-ring p-6 md:p-7" id="try">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-sm font-medium text-accent">{copy.panels.input.eyebrow}</p>
          <h2 className="text-2xl font-semibold text-ink">{copy.panels.input.title}</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-mist">{copy.panels.input.description}</p>
        </div>
        <div className="rounded-2xl bg-accentSoft p-3 text-accent shadow-sm">
          <WandSparkles className="size-5" />
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {copy.panels.input.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-white/90 bg-white/90 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-600 shadow-sm"
          >
            {tag}
          </span>
        ))}
      </div>

      <TextArea
        value={rawInput}
        onChange={(event) => onChange(event.target.value)}
        placeholder={copy.panels.input.placeholder}
      />

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Button className="min-w-[168px]" onClick={() => void onGenerate()} disabled={isGenerating}>
          <Sparkles className="mr-2 size-4" />
          {isGenerating ? "整理中..." : copy.panels.input.generate}
        </Button>
        <Button className="min-w-[196px]" variant="secondary" onClick={() => void onLoadExample()} disabled={isGenerating}>
          {copy.panels.input.loadExample}：{selectedExampleLabel}
        </Button>
      </div>

      <div className="mt-4 rounded-[18px] border border-white/90 bg-white/80 px-4 py-3 text-sm leading-6 text-mist shadow-sm">
        {copy.panels.input.helper}
      </div>
    </Card>
  );
}
