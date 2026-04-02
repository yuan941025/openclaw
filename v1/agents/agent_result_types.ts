import type { AgentExecutionResult, AgentRole } from "./agent_types.ts";

export type AgentResultSchema = AgentExecutionResult;

const ROLE_PRODUCED_ARTIFACTS: Record<AgentRole, string[]> = {
  researcher: ["gap_summary", "architecture_notes"],
  coder: ["module_patch_plan", "build_output_summary"],
  tester: ["validation_report", "regression_report"],
  operator: ["execution_handoff", "trigger_checklist"],
};

export function getTypicalProducedArtifacts(role: AgentRole): string[] {
  return ROLE_PRODUCED_ARTIFACTS[role];
}
