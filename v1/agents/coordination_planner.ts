import type {
  AgentAssignmentResult,
  CoordinationHandoffRule,
  CoordinationPhase,
  CoordinationPlan,
  SubAgentTemplate,
} from "./agent_types.ts";

function buildExecutionPhases(assignmentResult: AgentAssignmentResult): CoordinationPhase[] {
  const phases: CoordinationPhase[] = [];
  const researcherIds = assignmentResult.agents
    .filter((agent) => agent.role === "researcher")
    .map((agent) => agent.agent_id);
  const coderIds = assignmentResult.agents
    .filter((agent) => agent.role === "coder")
    .map((agent) => agent.agent_id);
  const testerIds = assignmentResult.agents
    .filter((agent) => agent.role === "tester")
    .map((agent) => agent.agent_id);
  const operatorIds = assignmentResult.agents
    .filter((agent) => agent.role === "operator")
    .map((agent) => agent.agent_id);

  if (researcherIds.length > 0) {
    phases.push({
      phase_id: "phase_1_research",
      title: "Research and architecture framing",
      agents_involved: researcherIds,
      required_artifacts: ["goal_summary"],
      completion_condition: "Research scope, gap summary, and architecture notes are ready.",
    });
  }

  if (coderIds.length > 0) {
    phases.push({
      phase_id: "phase_2_build",
      title: "Build and implementation",
      agents_involved: coderIds,
      required_artifacts: researcherIds.length > 0
        ? ["research scope package"]
        : ["goal_summary"],
      completion_condition: "Implementation bundle and build output notes are ready for validation.",
    });
  }

  if (testerIds.length > 0) {
    phases.push({
      phase_id: "phase_3_validate",
      title: "Validation and regression checking",
      agents_involved: testerIds,
      required_artifacts: ["implementation bundle"],
      completion_condition: "Validation report and regression summary are ready.",
    });
  }

  if (operatorIds.length > 0) {
    phases.push({
      phase_id: "phase_4_operate",
      title: "Controlled operation handoff",
      agents_involved: operatorIds,
      required_artifacts: ["validation report"],
      completion_condition: "Execution handoff package and run checklist are complete.",
    });
  }

  return phases;
}

function buildHandoffRules(assignmentResult: AgentAssignmentResult): CoordinationHandoffRule[] {
  return assignmentResult.handoff_flow.map((handoff) => ({
    from_agent_id: handoff.from_agent_id,
    to_agent_id: handoff.to_agent_id,
    artifact: handoff.artifact,
    condition: `Deliver ${handoff.artifact} when the upstream assigned tasks are completed and summarized for handoff.`,
  }));
}

function buildCoordinationSummary(
  executionPhases: CoordinationPhase[],
  handoffRules: CoordinationHandoffRule[],
  subAgentTemplates: SubAgentTemplate[],
): string[] {
  const coordinationSummary = executionPhases.map((phase) =>
    `${phase.phase_id} uses ${phase.agents_involved.join(", ")} and finishes when ${phase.completion_condition}`,
  );

  if (handoffRules.length > 0) {
    const handoffChain = [
      handoffRules[0].from_agent_id,
      ...handoffRules.map((rule) => rule.to_agent_id),
    ];
    coordinationSummary.push(
      `Handoff chain: ${handoffChain.join(" -> ")}.`,
    );
  }

  coordinationSummary.push(
    `Sub-agent templates prepared for: ${subAgentTemplates.map((template) => template.agent_id).join(", ")}.`,
  );

  return coordinationSummary;
}

export function buildCoordinationPlan(
  assignmentResult: AgentAssignmentResult,
  subAgentTemplates: SubAgentTemplate[],
): CoordinationPlan {
  const executionPhases = buildExecutionPhases(assignmentResult);
  const handoffRules = buildHandoffRules(assignmentResult);

  return {
    execution_phases: executionPhases,
    handoff_rules: handoffRules,
    final_execution_order: assignmentResult.execution_order,
    coordination_summary: buildCoordinationSummary(
      executionPhases,
      handoffRules,
      subAgentTemplates,
    ),
  };
}
