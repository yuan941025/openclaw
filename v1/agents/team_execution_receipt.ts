import type {
  AgentExecutionResult,
  TeamExecutionReceipt,
  TeamExecutionSimulation,
} from "./agent_types.ts";

function getCompletedAgents(results: AgentExecutionResult[]): string[] {
  return results
    .filter((result) => result.status === "completed")
    .map((result) => result.agent_id);
}

function getBlockedAgents(results: AgentExecutionResult[]): string[] {
  return results
    .filter((result) => result.status === "blocked")
    .map((result) => result.agent_id);
}

function getFailedAgents(results: AgentExecutionResult[]): string[] {
  return results
    .filter((result) => result.status === "failed")
    .map((result) => result.agent_id);
}

function buildRoutingNotes(results: AgentExecutionResult[]): string[] {
  const routingNotes = results.flatMap((result) => {
    if (result.status === "completed" && result.next_handoff) {
      return result.next_handoff.map((handoff) =>
        `${result.agent_id} can hand off ${handoff.artifact} to ${handoff.to_agent_id}.`
      );
    }

    if (result.status === "blocked" || result.status === "failed") {
      return [`${result.agent_id} needs recovery before downstream work can continue.`];
    }

    if (result.status === "partial") {
      return [`${result.agent_id} needs follow-up before the full team can proceed.`];
    }

    return [];
  });

  return routingNotes;
}

export function buildTeamExecutionReceipt(
  simulationResult: TeamExecutionSimulation,
): TeamExecutionReceipt {
  const results = simulationResult.simulated_agent_results;
  const completedAgents = getCompletedAgents(results);
  const blockedAgents = getBlockedAgents(results);
  const failedAgents = getFailedAgents(results);
  const hasPartial = results.some((result) => result.status === "partial");
  const hasFailed = failedAgents.length > 0;

  return {
    team_status: hasFailed
      ? "failed"
      : blockedAgents.length > 0 || hasPartial
        ? "partial"
        : "completed",
    agent_statuses: results.map((result) => ({
      agent_id: result.agent_id,
      role: result.role,
      status: result.status,
    })),
    completed_agents: completedAgents,
    blocked_agents: blockedAgents,
    failed_agents: failedAgents,
    produced_artifacts_summary: [
      ...new Set(results.flatMap((result) => result.produced_artifacts)),
    ],
    routing_notes: buildRoutingNotes(results),
  };
}
