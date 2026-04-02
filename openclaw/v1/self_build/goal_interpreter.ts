import type { GoalInterpretation } from "./self_build_types.ts";

function normalizeGoal(goal: string): string {
  return goal.replace(/\s+/g, " ").trim();
}

function detectFocusTags(goal: string): string[] {
  const normalizedGoal = goal.toLowerCase();
  const tags: string[] = [];

  if (
    normalizedGoal.includes("self-build") ||
    normalizedGoal.includes("self build") ||
    normalizedGoal.includes("upgrade") ||
    normalizedGoal.includes("improve")
  ) {
    tags.push("self_build");
  }

  if (
    normalizedGoal.includes("agent") ||
    normalizedGoal.includes("planner") ||
    normalizedGoal.includes("plan")
  ) {
    tags.push("agent_planning");
  }

  if (
    normalizedGoal.includes("feedback") ||
    normalizedGoal.includes("loop") ||
    normalizedGoal.includes("learn")
  ) {
    tags.push("feedback_loop");
  }

  if (
    normalizedGoal.includes("action") ||
    normalizedGoal.includes("operate") ||
    normalizedGoal.includes("execution")
  ) {
    tags.push("external_actions");
  }

  return tags.length > 0 ? tags : ["self_build"];
}

export function interpretGoal(goal: string): GoalInterpretation {
  const normalizedGoal = normalizeGoal(goal);

  if (!normalizedGoal) {
    throw new Error("goal is required");
  }

  return {
    raw_goal: normalizedGoal,
    goal_summary: normalizedGoal,
    focus_tags: detectFocusTags(normalizedGoal),
  };
}
