import type {
  AgentAssignmentResult,
  AgentPlan,
  CoordinationPlan,
  SubAgentTemplate,
  TeamMergeResult,
} from "./agent_types.ts";

type MergeAgentResultsInput = {
  goal_summary: string;
  required_agents: AgentPlan["required_agents"];
  assignment: AgentAssignmentResult;
  sub_agent_templates: SubAgentTemplate[];
  coordination_plan: CoordinationPlan;
};

function buildRoleOutputs(
  assignmentResult: AgentAssignmentResult,
  targetRole: "researcher" | "coder" | "tester" | "operator",
): string[] {
  return assignmentResult.agents
    .filter((agent) => agent.role === targetRole)
    .flatMap((agent) =>
      agent.assigned_tasks.map((task) => `${agent.agent_id}: ${task.title}`),
    );
}

function buildFinalTeamSummary(
  assignmentResult: AgentAssignmentResult,
  coordinationPlan: CoordinationPlan,
): string[] {
  const roles = assignmentResult.agents.map((agent) => agent.role).join(", ");
  const firstAgent = assignmentResult.execution_order[0] ?? "none";
  const lastAgent = assignmentResult.execution_order.at(-1) ?? "none";
  const handoffChain = assignmentResult.handoff_flow.length > 0
    ? [
      assignmentResult.handoff_flow[0].from_agent_id,
      ...assignmentResult.handoff_flow.map((handoff) => handoff.to_agent_id),
    ].join(" -> ")
    : "no handoff flow";

  return [
    `Roles used: ${roles}.`,
    `Execution starts with ${firstAgent}.`,
    `Handoff flow: ${handoffChain}.`,
    `Final wrap-up owner: ${lastAgent}.`,
    `Coordination phases: ${coordinationPlan.execution_phases.map((phase) => phase.phase_id).join(", ")}.`,
  ];
}

function buildNextStep(assignmentResult: AgentAssignmentResult): string {
  const hasResearcher = assignmentResult.agents.some((agent) => agent.role === "researcher");
  if (hasResearcher) {
    return "Run researcher phase before build phase.";
  }

  return "Create coder and tester execution bundles first.";
}

export function mergeAgentResults(input: MergeAgentResultsInput): TeamMergeResult {
  return {
    goal_summary: input.goal_summary,
    team_plan: {
      required_agents: input.required_agents,
      assignment: input.assignment,
      sub_agent_templates: input.sub_agent_templates,
      coordination_plan: input.coordination_plan,
    },
    merged_outputs: {
      research_outputs: buildRoleOutputs(input.assignment, "researcher"),
      build_outputs: buildRoleOutputs(input.assignment, "coder"),
      validation_outputs: buildRoleOutputs(input.assignment, "tester"),
      operation_outputs: buildRoleOutputs(input.assignment, "operator"),
    },
    final_team_summary: buildFinalTeamSummary(
      input.assignment,
      input.coordination_plan,
    ),
    next_step: buildNextStep(input.assignment),
  };
}
