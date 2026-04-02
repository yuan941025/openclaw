import type {
  AgentAssignmentResult,
  AgentExecutionBundle,
  AgentExecutionBundleExport,
  CoordinationPlan,
  SubAgentTemplate,
} from "./agent_types.ts";

type ExportAgentExecutionBundlesInput = {
  assignmentResult: AgentAssignmentResult;
  subAgentTemplates: SubAgentTemplate[];
  coordinationPlan: CoordinationPlan;
};

function buildRequiredInputs(
  agentId: string,
  assignedTasks: AgentExecutionBundle["assigned_tasks"],
  coordinationPlan: CoordinationPlan,
): string[] {
  const dependencyInputs = assignedTasks.flatMap((task) =>
    (task.depends_on ?? []).map((dependencyId) => `dependency:${dependencyId}`)
  );
  const handoffInputs = coordinationPlan.handoff_rules
    .filter((rule) => rule.to_agent_id === agentId)
    .map((rule) => `artifact:${rule.artifact}`);

  return [...new Set(["goal_summary", ...dependencyInputs, ...handoffInputs])];
}

function buildHandoffTarget(agentId: string, coordinationPlan: CoordinationPlan): string | undefined {
  return coordinationPlan.handoff_rules.find((rule) => rule.from_agent_id === agentId)?.to_agent_id;
}

function buildExpectedOutputs(
  agentId: string,
  template: SubAgentTemplate | undefined,
  coordinationPlan: CoordinationPlan,
): string[] {
  const handoffArtifacts = coordinationPlan.handoff_rules
    .filter((rule) => rule.from_agent_id === agentId)
    .map((rule) => rule.artifact);

  return [...new Set([...(template?.system_profile.output_contract ?? []), ...handoffArtifacts])];
}

function buildExecutionNotes(
  bundle: AgentExecutionBundle,
): string[] {
  const firstTask = bundle.assigned_tasks[0];

  return [
    firstTask
      ? `Start with task ${firstTask.task_id} (${firstTask.title}).`
      : "Start with the first assigned task bundle.",
    bundle.handoff_target
      ? `After completion, hand the output to ${bundle.handoff_target}.`
      : "After completion, summarize the result for the team merge layer.",
    "If any dependency or required artifact is missing, stop and report the blocker.",
  ];
}

export function exportAgentExecutionBundles(
  input: ExportAgentExecutionBundlesInput,
): AgentExecutionBundleExport {
  const templateLookup = new Map(
    input.subAgentTemplates.map((template) => [template.agent_id, template]),
  );

  return {
    goal_summary: input.assignmentResult.goal_summary,
    bundles: input.assignmentResult.agents.map((agent) => {
      const template = templateLookup.get(agent.agent_id);
      const bundle: AgentExecutionBundle = {
        agent_id: agent.agent_id,
        role: agent.role,
        profile_summary: template
          ? `${template.system_profile.identity} | ${template.system_profile.objective}`
          : agent.purpose,
        assigned_tasks: agent.assigned_tasks,
        required_inputs: buildRequiredInputs(
          agent.agent_id,
          agent.assigned_tasks,
          input.coordinationPlan,
        ),
        expected_outputs: buildExpectedOutputs(agent.agent_id, template, input.coordinationPlan),
        handoff_target: buildHandoffTarget(agent.agent_id, input.coordinationPlan),
        execution_notes: [],
      };

      bundle.execution_notes = buildExecutionNotes(bundle);
      return bundle;
    }),
  };
}
