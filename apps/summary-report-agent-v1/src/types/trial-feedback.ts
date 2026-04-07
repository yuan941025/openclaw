import type { SummaryExample } from "./summary";

export type TrialFeedbackChoice = "positive" | "negative";

export type TrialStats = {
  pageViews: number;
  generateClicks: number;
  successfulOutputs: number;
  exampleClicks: number;
  feedbackPositive: number;
  feedbackNegative: number;
  exampleUsage: Record<SummaryExample["id"], number>;
  scenarioSelections: Record<SummaryExample["id"], number>;
  lastUpdatedAt: string | null;
};

export type TrialEvent =
  | { type: "page_view" }
  | { type: "generate_click" }
  | { type: "successful_output" }
  | { type: "example_click"; exampleId: SummaryExample["id"] }
  | { type: "scenario_switch"; exampleId: SummaryExample["id"] }
  | { type: "feedback"; value: TrialFeedbackChoice };
