import { analyzeCapabilityGap } from "./gap_analyzer.ts";
import { interpretGoal } from "./goal_interpreter.ts";
import { planModules } from "./module_planner.ts";
import type { SelfBuildOutput } from "./self_build_types.ts";

export function runSelfBuildPlanning(goal: string): SelfBuildOutput {
  const interpretedGoal = interpretGoal(goal);
  const gapAnalysis = analyzeCapabilityGap(interpretedGoal);
  const modulePlan = planModules(gapAnalysis);

  return {
    goal_summary: gapAnalysis.goal_summary,
    current_capabilities: [...gapAnalysis.current_capabilities],
    missing_capabilities: [...gapAnalysis.missing_capabilities],
    proposed_modules: [...modulePlan.proposed_modules],
    build_order: [...modulePlan.build_order],
  };
}
