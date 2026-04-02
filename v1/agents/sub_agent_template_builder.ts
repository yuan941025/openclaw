import type {
  AgentAssignmentResult,
  AgentRole,
  AssignedAgent,
  SubAgentTemplate,
} from "./agent_types.ts";

function buildOutputContract(role: AgentRole): string[] {
  if (role === "researcher") {
    return ["scope notes", "gap summary", "architecture notes"];
  }

  if (role === "coder") {
    return ["implementation bundle", "modified flow summary", "build output notes"];
  }

  if (role === "tester") {
    return ["CLI validation notes", "loop output validation report", "regression summary"];
  }

  return ["execution handoff package", "trigger checklist", "external runbook"];
}

function buildSuccessCriteria(role: AgentRole): string[] {
  if (role === "researcher") {
    return [
      "capability gaps are explicitly listed",
      "architecture notes are ready for the coder",
    ];
  }

  if (role === "coder") {
    return [
      "implementation bundle is ready for validation",
      "existing flow changes are summarized for tester handoff",
    ];
  }

  if (role === "tester") {
    return [
      "validation result is clear and reproducible",
      "regression-sensitive behavior is summarized for operator handoff",
    ];
  }

  return [
    "execution handoff is ready for controlled use",
    "trigger conditions and runbook are explicit",
  ];
}

function buildTaskExecutionStyle(role: AgentRole): string {
  if (role === "researcher") {
    return "Analyze first, then emit concise architecture-facing artifacts.";
  }

  if (role === "coder") {
    return "Implement the minimum working change set and summarize what changed.";
  }

  if (role === "tester") {
    return "Validate through direct execution paths and report observable results.";
  }

  return "Prepare controlled handoff artifacts and keep trigger conditions explicit.";
}

function buildTemplate(agent: AssignedAgent, goalSummary: string): SubAgentTemplate {
  const upstreamDependencyIds = [
    ...new Set(
      agent.assigned_tasks.flatMap((task) => task.depends_on ?? []),
    ),
  ];

  return {
    agent_id: agent.agent_id,
    role: agent.role,
    system_profile: {
      identity: `${agent.role} agent for ${goalSummary}`,
      objective: agent.purpose,
      constraints: [
        "Do not exceed assigned responsibilities.",
        "Wait for upstream outputs before starting dependent work.",
        "Report blockers immediately when the task cannot be completed.",
      ],
      input_contract: [
        "goal_summary",
        "assigned_tasks",
        ...(upstreamDependencyIds.length > 0 ? ["upstream task outputs"] : []),
      ],
      output_contract: buildOutputContract(agent.role),
      success_criteria: buildSuccessCriteria(agent.role),
    },
    task_execution_style: buildTaskExecutionStyle(agent.role),
    escalation_rule:
      "Escalate when dependencies are missing, blockers remain unresolved, or the requested output cannot be completed safely.",
  };
}

export function buildSubAgentTemplates(
  assignmentResult: AgentAssignmentResult,
): SubAgentTemplate[] {
  return assignmentResult.agents.map((agent) =>
    buildTemplate(agent, assignmentResult.goal_summary),
  );
}
