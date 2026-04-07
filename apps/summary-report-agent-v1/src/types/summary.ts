export type SummarySectionKey = "completed" | "current" | "blockers" | "next";

export type SummaryNeedAction = "需要" | "不需要";

export type SummaryReport = {
  completed: string[];
  current: string[];
  blockers: string[];
  next: string[];
  needsAction: SummaryNeedAction;
  generatedAt: string | null;
  sourceMode: string;
};

export type SummaryExample = {
  id: "meeting" | "ai" | "client";
  label: string;
  caption: string;
  content: string;
};

export type GenerateSummaryInput = {
  rawText: string;
};

export type SummaryAgentService = {
  generateReport: (input: GenerateSummaryInput) => Promise<SummaryReport>;
};
