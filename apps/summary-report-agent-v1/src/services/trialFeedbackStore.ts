import type { SummaryExample } from "../types/summary";
import type { TrialEvent, TrialStats } from "../types/trial-feedback";

const STORAGE_KEY = "actionbrief-trial-feedback-v1";

function createScenarioSelections(): Record<SummaryExample["id"], number> {
  return {
    meeting: 0,
    ai: 0,
    client: 0,
  };
}

export function createEmptyTrialStats(): TrialStats {
  return {
    pageViews: 0,
    generateClicks: 0,
    successfulOutputs: 0,
    exampleClicks: 0,
    feedbackPositive: 0,
    feedbackNegative: 0,
    exampleUsage: createScenarioSelections(),
    scenarioSelections: createScenarioSelections(),
    lastUpdatedAt: null,
  };
}

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function readTrialStats(): TrialStats {
  if (!canUseStorage()) {
    return createEmptyTrialStats();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createEmptyTrialStats();
    }

    const parsed = JSON.parse(raw) as Partial<TrialStats>;

    return {
      ...createEmptyTrialStats(),
      ...parsed,
      exampleUsage: {
        ...createScenarioSelections(),
        ...(parsed.exampleUsage ?? {}),
      },
      scenarioSelections: {
        ...createScenarioSelections(),
        ...(parsed.scenarioSelections ?? {}),
      },
    };
  } catch {
    return createEmptyTrialStats();
  }
}

function persistTrialStats(stats: TrialStats) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
}

export function trackTrialEvent(event: TrialEvent): TrialStats {
  const current = readTrialStats();
  const next: TrialStats = {
    ...current,
    exampleUsage: { ...current.exampleUsage },
    scenarioSelections: { ...current.scenarioSelections },
    lastUpdatedAt: new Date().toISOString(),
  };

  switch (event.type) {
    case "page_view":
      next.pageViews += 1;
      break;
    case "generate_click":
      next.generateClicks += 1;
      break;
    case "successful_output":
      next.successfulOutputs += 1;
      break;
    case "example_click":
      next.exampleClicks += 1;
      next.exampleUsage[event.exampleId] += 1;
      break;
    case "scenario_switch":
      next.scenarioSelections[event.exampleId] += 1;
      break;
    case "feedback":
      if (event.value === "positive") {
        next.feedbackPositive += 1;
      } else {
        next.feedbackNegative += 1;
      }
      break;
  }

  persistTrialStats(next);
  return next;
}
