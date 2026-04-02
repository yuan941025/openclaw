import type { AgentFeedbackRouting, TeamExecutionReceipt } from "./agent_types.ts";

function isPrioritizedRole(role: string): boolean {
  return role === "coder" || role === "tester";
}

export function routeAgentFeedback(teamReceipt: TeamExecutionReceipt): AgentFeedbackRouting {
  const retryAgents = teamReceipt.agent_statuses
    .filter((agentStatus) => agentStatus.status === "failed" || agentStatus.status === "blocked")
    .map((agentStatus) => agentStatus.agent_id);
  const skipAgents = teamReceipt.agent_statuses
    .filter((agentStatus) => agentStatus.status === "completed")
    .map((agentStatus) => agentStatus.agent_id);
  const prioritizedAgents = teamReceipt.agent_statuses
    .filter((agentStatus) =>
      isPrioritizedRole(agentStatus.role)
      && (agentStatus.status === "failed" || agentStatus.status === "blocked")
    )
    .map((agentStatus) => agentStatus.agent_id);

  let nextTeamStep = "Review blocked agents and refresh handoff artifacts.";
  if (prioritizedAgents.length > 0) {
    nextTeamStep = "Retry prioritized agents before the next full team cycle.";
  } else if (retryAgents.length === 0 && skipAgents.length > 0) {
    const lastCompletedAgent = skipAgents.at(-1);
    nextTeamStep = `Skip ${skipAgents.join(", ")} and continue from ${lastCompletedAgent} completion review.`;
  }

  return {
    retry_agents: retryAgents,
    skip_agents: skipAgents,
    prioritized_agents: prioritizedAgents,
    feedback_summary: [
      `Skip next round for: ${skipAgents.length > 0 ? skipAgents.join(", ") : "none"}.`,
      `Retry next round for: ${retryAgents.length > 0 ? retryAgents.join(", ") : "none"}.`,
      `Prioritize recovery for: ${prioritizedAgents.length > 0 ? prioritizedAgents.join(", ") : "none"}.`,
    ],
    next_team_step: nextTeamStep,
  };
}
