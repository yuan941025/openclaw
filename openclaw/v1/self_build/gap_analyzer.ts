import type {
  CurrentCapability,
  GapAnalysis,
  GoalInterpretation,
  MissingCapability,
} from "./self_build_types.ts";

const CURRENT_CAPABILITIES: CurrentCapability[] = [
  "proposal generation",
  "execution flow",
  "lobster-ui",
  "trading analysis",
  "codex task packaging",
];

const TAG_PRIORITIES: Record<string, MissingCapability[]> = {
  self_build: ["self-build loop", "execution feedback loop"],
  agent_planning: ["agent planner"],
  feedback_loop: ["execution feedback loop", "self-build loop"],
  external_actions: ["external action layer"],
};

const BASE_MISSING_CAPABILITIES: MissingCapability[] = [
  "self-build loop",
  "agent planner",
  "execution feedback loop",
  "external action layer",
];

function orderedMissingCapabilities(focusTags: string[]): MissingCapability[] {
  const ordered = new Set<MissingCapability>();

  for (const tag of focusTags) {
    for (const capability of TAG_PRIORITIES[tag] ?? []) {
      ordered.add(capability);
    }
  }

  for (const capability of BASE_MISSING_CAPABILITIES) {
    ordered.add(capability);
  }

  return [...ordered];
}

export function analyzeCapabilityGap(input: GoalInterpretation): GapAnalysis {
  return {
    goal_summary: input.goal_summary,
    current_capabilities: [...CURRENT_CAPABILITIES],
    missing_capabilities: orderedMissingCapabilities(input.focus_tags),
    focus_tags: [...input.focus_tags],
  };
}
