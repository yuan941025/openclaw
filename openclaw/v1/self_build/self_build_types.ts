export type CurrentCapability =
  | "proposal generation"
  | "execution flow"
  | "lobster-ui"
  | "trading analysis"
  | "codex task packaging";

export type MissingCapability =
  | "external action layer"
  | "self-build loop"
  | "agent planner"
  | "execution feedback loop";

export type ModulePriority = "high" | "medium" | "low";

export type GoalInterpretation = {
  raw_goal: string;
  goal_summary: string;
  focus_tags: string[];
};

export type GapAnalysis = {
  goal_summary: string;
  current_capabilities: CurrentCapability[];
  missing_capabilities: MissingCapability[];
  focus_tags: string[];
};

export type ProposedModule = {
  name: string;
  purpose: string;
  priority: ModulePriority;
};

export type ModulePlan = {
  proposed_modules: ProposedModule[];
  build_order: string[];
};

export type SelfBuildOutput = {
  goal_summary: string;
  current_capabilities: string[];
  missing_capabilities: string[];
  proposed_modules: ProposedModule[];
  build_order: string[];
};
