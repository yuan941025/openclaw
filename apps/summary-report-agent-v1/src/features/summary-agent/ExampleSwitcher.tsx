import { MessageSquareQuote, MessagesSquare, NotebookPen } from "lucide-react";
import { copy } from "../../app/copy";
import { Card } from "../../components/ui/Card";
import type { SummaryExample } from "../../types/summary";

type ExampleSwitcherProps = {
  examples: SummaryExample[];
  selectedExampleId: SummaryExample["id"];
  onSelect: (id: SummaryExample["id"]) => void;
};

const iconMap = {
  meeting: NotebookPen,
  ai: MessageSquareQuote,
  client: MessagesSquare,
} as const;

export function ExampleSwitcher({ examples, selectedExampleId, onSelect }: ExampleSwitcherProps) {
  return (
    <Card className="brand-tint brand-ring p-6 md:p-7" id="examples">
      <div className="mb-5">
        <p className="mb-2 text-sm font-medium text-accent">{copy.panels.examples.eyebrow}</p>
        <h2 className="text-2xl font-semibold text-ink">{copy.panels.examples.title}</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-mist">{copy.panels.examples.description}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {examples.map((example, index) => {
          const Icon = iconMap[example.id];
          const isActive = example.id === selectedExampleId;

          return (
            <button
              key={example.id}
              type="button"
              onClick={() => onSelect(example.id)}
              className={`elevated-card rounded-[24px] border p-5 text-left transition ${
                isActive
                  ? "border-[#d7dbff] bg-[linear-gradient(180deg,rgba(241,242,255,0.98),rgba(255,255,255,0.95))] shadow-soft"
                  : "border-slate-200 bg-white/95 hover:border-slate-300 hover:bg-white"
              }`}
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="inline-flex rounded-2xl bg-white p-3 text-accent shadow-sm">
                  <Icon className="size-5" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-mist">0{index + 1}</span>
              </div>
              <h3 className="text-lg font-semibold text-ink">{example.label}</h3>
              <p className="mt-2 text-sm leading-6 text-mist">{example.caption}</p>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
