import type { AgentPlan, AgentPriority, AgentRole, RequiredAgent } from "./agent_types.ts";

const ROLE_ORDER: AgentRole[] = ["researcher", "coder", "tester", "operator"];
const BUILD_KEYWORDS = [
  "build",
  "self-build",
  "self build",
  "module",
  "agent",
  "implementation",
  "validation",
];
const RESEARCH_KEYWORDS = [
  "planning",
  "plan",
  "analysis",
  "analyze",
  "strategy",
  "architecture",
];
const OPERATOR_KEYWORDS = [
  "execute",
  "execution",
  "operation",
  "operate",
  "external",
  "trigger",
  "run",
];

function normalizeGoal(goal: string): string {
  return goal.trim().toLowerCase();
}

function goalIncludesAny(goal: string, keywords: string[]): boolean {
  return keywords.some((keyword) => goal.includes(keyword));
}

function buildAgent(role: AgentRole, priority: AgentPriority): RequiredAgent {
  if (role === "researcher") {
    return {
      agent_id: "researcher_1",
      role,
      purpose: "Inspect the goal and convert it into a capability gap and architecture framing package.",
      responsibilities: [
        "inspect capability gaps",
        "summarize required architecture",
        "prepare implementation-facing research notes",
      ],
      priority,
    };
  }

  if (role === "coder") {
    return {
      agent_id: "coder_1",
      role,
      purpose: "Turn the planned goal into implementation-ready module and flow changes.",
      responsibilities: [
        "implement new module files",
        "modify existing runner or orchestrator",
        "prepare build-ready output bundle",
      ],
      priority,
    };
  }

  if (role === "tester") {
    return {
      agent_id: "tester_1",
      role,
      purpose: "Validate that the build output works through the intended CLI and loop surfaces.",
      responsibilities: [
        "validate CLI flow",
        "verify loop outputs",
        "check regression-sensitive behavior",
      ],
      priority,
    };
  }

  return {
    agent_id: "operator_1",
    role,
    purpose: "Prepare controlled execution handoff and keep run-trigger flow explicit and safe.",
    responsibilities: [
      "prepare execution handoff",
      "manage controlled external trigger flow",
      "prepare the external run checklist",
    ],
    priority,
  };
}

function buildCoordinationNotes(requiredAgents: RequiredAgent[]): string[] {
  const orderedAgents = ROLE_ORDER
    .map((role) => requiredAgents.find((agent) => agent.role === role))
    .filter((agent): agent is RequiredAgent => agent !== undefined);

  const coordinationNotes: string[] = [];
  const firstAgent = orderedAgents[0];
  coordinationNotes.push(
    `Start with ${firstAgent.agent_id} to create the first role-specific output bundle.`,
  );

  for (let index = 1; index < orderedAgents.length; index += 1) {
    const upstreamAgent = orderedAgents[index - 1];
    const currentAgent = orderedAgents[index];
    coordinationNotes.push(
      `${currentAgent.agent_id} should wait for ${upstreamAgent.agent_id} before starting its assigned work.`,
    );
  }

  coordinationNotes.push(
    `Minimum collaboration order: ${orderedAgents.map((agent) => agent.agent_id).join(" -> ")}.`,
  );

  return coordinationNotes;
}

function buildNextStep(requiredAgents: RequiredAgent[]): string {
  const hasResearcher = requiredAgents.some((agent) => agent.role === "researcher");
  const hasCoder = requiredAgents.some((agent) => agent.role === "coder");
  const hasTester = requiredAgents.some((agent) => agent.role === "tester");

  if (hasResearcher && hasCoder) {
    return "Start with researcher output, then hand off to coder.";
  }

  if (hasCoder && hasTester) {
    return "Create the coder and tester task bundle first.";
  }

  if (requiredAgents.some((agent) => agent.role === "operator")) {
    return "Prepare the operator handoff checklist first.";
  }

  return "Create the first role bundle from the goal summary.";
}

export function runAgentPlanning(goal: string): AgentPlan {
  const normalizedGoal = normalizeGoal(goal);
  const requiredRoleSet = new Set<AgentRole>();

  if (goalIncludesAny(normalizedGoal, BUILD_KEYWORDS)) {
    requiredRoleSet.add("coder");
    requiredRoleSet.add("tester");
  }

  if (goalIncludesAny(normalizedGoal, RESEARCH_KEYWORDS)) {
    requiredRoleSet.add("researcher");
  }

  if (goalIncludesAny(normalizedGoal, OPERATOR_KEYWORDS)) {
    requiredRoleSet.add("operator");
  }

  if (requiredRoleSet.size === 0) {
    requiredRoleSet.add("coder");
    requiredRoleSet.add("tester");
  }

  const requiredAgents = ROLE_ORDER
    .filter((role) => requiredRoleSet.has(role))
    .map((role) => buildAgent(
      role,
      role === "operator" ? "medium" : "high",
    ));

  return {
    goal_summary: goal.trim(),
    required_agents: requiredAgents,
    coordination_notes: buildCoordinationNotes(requiredAgents),
    next_step: buildNextStep(requiredAgents),
  };
}
