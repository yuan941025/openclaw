import type {
  AgentFeedbackRouting,
  DegradedReplayReceipt,
  RepairRouting,
} from "./agent_types.ts";

type RouteRepairActionsInput = {
  degradedReplayReceipt: DegradedReplayReceipt;
  feedbackRouting: AgentFeedbackRouting;
};

function isPriorityAgent(agentId: string): boolean {
  return agentId.startsWith("coder_") || agentId.startsWith("tester_");
}

function extractIsolatedAgents(brokenHandoffs: string[]): string[] {
  return brokenHandoffs.map((handoff) => {
    const [, toAgent] = handoff.split("->");
    return toAgent?.split(":")[0] ?? "unknown";
  }).filter((agentId) => agentId !== "unknown");
}

export function routeRepairActions(
  input: RouteRepairActionsInput,
): RepairRouting {
  const retryAgents = [
    ...new Set([
      ...input.degradedReplayReceipt.degraded_agents,
      ...input.degradedReplayReceipt.blocked_agents,
    ]),
  ];
  const prioritizeAgents = [
    ...new Set([
      ...retryAgents.filter((agentId) => isPriorityAgent(agentId)),
      ...input.feedbackRouting.prioritized_agents,
    ]),
  ];
  const isolateAgents = [
    ...new Set(extractIsolatedAgents(input.degradedReplayReceipt.broken_handoffs)),
  ];
  const repairActions = [
    ...prioritizeAgents.map((agentId) => {
      const downstreamAgent = isolateAgents.find((candidate) => candidate !== agentId)
        ?? retryAgents.find((candidate) => candidate !== agentId);
      return downstreamAgent
        ? `Retry ${agentId} bundle generation before re-running ${downstreamAgent}.`
        : `Retry ${agentId} bundle generation before the next replay cycle.`;
    }),
    ...isolateAgents.map((agentId) =>
      `Isolate ${agentId} until upstream handoff is repaired.`
    ),
    ...retryAgents
      .filter((agentId) => !prioritizeAgents.includes(agentId))
      .map((agentId) =>
        `Retry ${agentId} after restoring the missing artifact contract.`
      ),
  ];

  return {
    retry_agents: retryAgents,
    prioritize_agents: prioritizeAgents,
    isolate_agents: isolateAgents,
    repair_actions: repairActions,
    repair_summary: [
      `Retry agents: ${retryAgents.length > 0 ? retryAgents.join(", ") : "none"}.`,
      `Prioritize agents: ${prioritizeAgents.length > 0 ? prioritizeAgents.join(", ") : "none"}.`,
      `Isolate agents: ${isolateAgents.length > 0 ? isolateAgents.join(", ") : "none"}.`,
    ],
    next_repair_step: prioritizeAgents.length > 0
      ? "Repair prioritized agents before the next team replay cycle."
      : retryAgents.length > 0
        ? "Retry degraded agents before the next team replay cycle."
        : "No repair action required; replay path is stable.",
  };
}
