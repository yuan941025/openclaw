import { runAgentPlanning } from "./agent_planner.ts";
import type {
  AgentAssignmentResult,
  AgentHandoff,
  AgentRole,
  AssignedTask,
  RequiredAgent,
} from "./agent_types.ts";

type TaskDefinition = {
  title: string;
  description: string;
};

const ROLE_TASK_DEFINITIONS: Record<AgentRole, TaskDefinition[]> = {
  researcher: [
    {
      title: "research_scope",
      description: "Define the scope boundary and inspect capability gaps for the goal.",
    },
    {
      title: "gap_summary",
      description: "Summarize the missing capabilities that downstream implementation must cover.",
    },
    {
      title: "architecture_notes",
      description: "Draft architecture notes that guide module and flow changes for the build phase.",
    },
  ],
  coder: [
    {
      title: "implement_module",
      description: "Implement the minimum module or file changes required for the goal.",
    },
    {
      title: "modify_existing_flow",
      description: "Modify existing runner or orchestration flow where the new capability needs to connect.",
    },
    {
      title: "prepare_build_output",
      description: "Prepare the build output bundle and implementation summary for validation.",
    },
  ],
  tester: [
    {
      title: "validate_cli",
      description: "Validate the CLI or runner entry path for the assigned implementation bundle.",
    },
    {
      title: "validate_loop_output",
      description: "Verify loop outputs or execution traces against the intended goal behavior.",
    },
    {
      title: "regression_check",
      description: "Check the touched flow for the minimum regression-sensitive surfaces.",
    },
  ],
  operator: [
    {
      title: "prepare_execution_handoff",
      description: "Prepare the execution handoff package from validated implementation output.",
    },
    {
      title: "review_trigger_conditions",
      description: "Review trigger conditions and safe-run requirements before any external action.",
    },
    {
      title: "prepare_external_runbook",
      description: "Prepare the minimum external runbook and follow-up checklist.",
    },
  ],
};

function getUpstreamAgentId(agentRole: AgentRole, requiredAgents: RequiredAgent[]): string | null {
  if (agentRole === "coder") {
    return requiredAgents.find((agent) => agent.role === "researcher")?.agent_id ?? null;
  }

  if (agentRole === "tester") {
    return requiredAgents.find((agent) => agent.role === "coder")?.agent_id ?? null;
  }

  if (agentRole === "operator") {
    return requiredAgents.find((agent) => agent.role === "tester")?.agent_id ?? null;
  }

  return null;
}

function buildAssignedTasks(
  agent: RequiredAgent,
  upstreamAgent: RequiredAgent | undefined,
): AssignedTask[] {
  const upstreamDependency = upstreamAgent
    ? `${upstreamAgent.agent_id}_task_${ROLE_TASK_DEFINITIONS[upstreamAgent.role].length}`
    : undefined;

  return ROLE_TASK_DEFINITIONS[agent.role].map((taskDefinition, index) => ({
    task_id: `${agent.agent_id}_task_${index + 1}`,
    title: taskDefinition.title,
    description: taskDefinition.description,
    depends_on: upstreamDependency ? [upstreamDependency] : undefined,
  }));
}

function buildHandoffFlow(requiredAgents: RequiredAgent[]): AgentHandoff[] {
  const handoffs: AgentHandoff[] = [];
  const researcher = requiredAgents.find((agent) => agent.role === "researcher");
  const coder = requiredAgents.find((agent) => agent.role === "coder");
  const tester = requiredAgents.find((agent) => agent.role === "tester");
  const operator = requiredAgents.find((agent) => agent.role === "operator");

  if (researcher && coder) {
    handoffs.push({
      from_agent_id: researcher.agent_id,
      to_agent_id: coder.agent_id,
      artifact: "research scope package",
      reason: "Coder needs the gap summary and architecture notes before implementation starts.",
    });
  }

  if (coder && tester) {
    handoffs.push({
      from_agent_id: coder.agent_id,
      to_agent_id: tester.agent_id,
      artifact: "implementation bundle",
      reason: "Tester validates the coded result after the build output is ready.",
    });
  }

  if (tester && operator) {
    handoffs.push({
      from_agent_id: tester.agent_id,
      to_agent_id: operator.agent_id,
      artifact: "validation report",
      reason: "Operator prepares the controlled execution handoff from validated outputs.",
    });
  }

  return handoffs;
}

function buildNextStep(requiredAgents: RequiredAgent[]): string {
  const hasResearcher = requiredAgents.some((agent) => agent.role === "researcher");
  const hasCoder = requiredAgents.some((agent) => agent.role === "coder");
  const hasTester = requiredAgents.some((agent) => agent.role === "tester");

  if (hasResearcher && hasCoder) {
    return "Start with researcher output, then hand off to coder.";
  }

  if (hasCoder && hasTester) {
    return "Create the coder and tester execution bundles first.";
  }

  if (hasResearcher) {
    return "Start with the researcher execution bundle first.";
  }

  return "Start with the first assigned agent bundle.";
}

export function runAgentAssignment(goal: string): AgentAssignmentResult {
  const plan = runAgentPlanning(goal);
  const agents = plan.required_agents.map((agent) => {
    const upstreamAgentId = getUpstreamAgentId(agent.role, plan.required_agents);
    const upstreamAgent = upstreamAgentId
      ? plan.required_agents.find((candidate) => candidate.agent_id === upstreamAgentId)
      : undefined;

    return {
      ...agent,
      assigned_tasks: buildAssignedTasks(agent, upstreamAgent),
    };
  });

  return {
    goal_summary: plan.goal_summary,
    agents,
    handoff_flow: buildHandoffFlow(plan.required_agents),
    execution_order: agents.map((agent) => agent.agent_id),
    next_step: buildNextStep(plan.required_agents),
  };
}
