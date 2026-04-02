import type {
  DegradedReplayReceipt,
  DegradedReplayResult,
  HandoffConsistencyResult,
} from "./agent_types.ts";

type BuildDegradedReplayReceiptInput = {
  degradedReplayResult: DegradedReplayResult;
  handoffConsistency: HandoffConsistencyResult;
};

function buildBrokenHandoffs(
  degradedReplayResult: DegradedReplayResult,
  handoffConsistency: HandoffConsistencyResult,
): string[] {
  const brokenFailures = degradedReplayResult.injected_failures.filter((failure) =>
    failure.type === "broken_handoff"
  );

  return [
    ...new Set(brokenFailures.flatMap((failure) => {
      const matchingHandoffs = handoffConsistency.checked_handoffs.filter((handoff) =>
        (!failure.agent_id || handoff.from_agent_id === failure.agent_id)
        && (!failure.artifact || handoff.artifact === failure.artifact)
      );
      const fallbackHandoffs = matchingHandoffs.length > 0
        ? matchingHandoffs
        : handoffConsistency.checked_handoffs.filter((handoff) =>
          !failure.agent_id || handoff.from_agent_id === failure.agent_id
        );

      if (fallbackHandoffs.length > 0) {
        return fallbackHandoffs.map((handoff) =>
          `${handoff.from_agent_id}->${handoff.to_agent_id}:${handoff.artifact}`
        );
      }

      return [`${failure.agent_id ?? "unknown"}->unknown:${failure.artifact ?? "unspecified"}`];
    })),
  ];
}

export function buildDegradedReplayReceipt(
  input: BuildDegradedReplayReceiptInput,
): DegradedReplayReceipt {
  const degradedAgents = input.degradedReplayResult.degraded_replay_steps
    .filter((step) => step.status === "degraded")
    .map((step) => step.agent_id);
  const blockedAgents = input.degradedReplayResult.degraded_replay_steps
    .filter((step) => step.status === "blocked")
    .map((step) => step.agent_id);
  const brokenHandoffs = buildBrokenHandoffs(
    input.degradedReplayResult,
    input.handoffConsistency,
  );
  const degradedArtifacts = [
    ...new Set(
      input.degradedReplayResult.injected_failures
        .map((failure) => failure.artifact)
        .filter((artifact): artifact is string => Boolean(artifact)),
    ),
  ];
  const severeDegradation = blockedAgents.length >= Math.max(
    1,
    Math.ceil(input.degradedReplayResult.degraded_replay_steps.length / 2),
  ) || (brokenHandoffs.length > 0 && blockedAgents.length > 0);

  return {
    degraded_status: degradedAgents.length === 0 && blockedAgents.length === 0
      ? "completed"
      : severeDegradation
        ? "failed"
        : "partial",
    degraded_agents: degradedAgents,
    blocked_agents: blockedAgents,
    broken_handoffs: brokenHandoffs,
    degraded_artifacts: degradedArtifacts,
    degradation_notes: [
      `Degraded replay status derived from ${degradedAgents.length} degraded and ${blockedAgents.length} blocked agents.`,
      ...input.degradedReplayResult.degraded_summary,
      ...input.handoffConsistency.inconsistency_notes,
    ],
    next_repair_targets: [
      ...new Set([
        ...degradedAgents,
        ...blockedAgents,
        ...brokenHandoffs.map((handoff) => `handoff:${handoff}`),
        ...degradedArtifacts.map((artifact) => `artifact:${artifact}`),
      ]),
    ],
  };
}
