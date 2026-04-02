import type {
  AgentExecutionBundleExport,
  CoordinationPlan,
  HandoffConsistencyResult,
} from "./agent_types.ts";

type CheckHandoffConsistencyInput = {
  executionBundles: AgentExecutionBundleExport;
  coordinationPlan: CoordinationPlan;
};

function findBundle(
  bundles: AgentExecutionBundleExport["bundles"],
  agentId: string,
) {
  return bundles.find((bundle) => bundle.agent_id === agentId);
}

export function checkHandoffConsistency(
  input: CheckHandoffConsistencyInput,
): HandoffConsistencyResult {
  const checkedHandoffs = input.coordinationPlan.handoff_rules.map((rule) => {
    const upstreamBundle = findBundle(input.executionBundles.bundles, rule.from_agent_id);
    const downstreamBundle = findBundle(input.executionBundles.bundles, rule.to_agent_id);

    return {
      from_agent_id: rule.from_agent_id,
      to_agent_id: rule.to_agent_id,
      artifact: rule.artifact,
      exists_in_outputs: upstreamBundle?.expected_outputs.includes(rule.artifact) ?? false,
      exists_in_required_inputs:
        downstreamBundle?.required_inputs.includes(`artifact:${rule.artifact}`) ?? false,
    };
  });

  const fullyConsistent = checkedHandoffs.filter((handoff) =>
    handoff.exists_in_outputs && handoff.exists_in_required_inputs
  ).length;
  const partiallyConsistent = checkedHandoffs.filter((handoff) =>
    handoff.exists_in_outputs !== handoff.exists_in_required_inputs
  ).length;
  const handoffStatus = checkedHandoffs.length === 0 || fullyConsistent === checkedHandoffs.length
    ? "consistent"
    : fullyConsistent > 0 || partiallyConsistent > 0
      ? "partial"
      : "inconsistent";

  return {
    handoff_status: handoffStatus,
    checked_handoffs: checkedHandoffs,
    inconsistency_notes: checkedHandoffs.flatMap((handoff) => {
      if (handoff.exists_in_outputs && handoff.exists_in_required_inputs) {
        return [];
      }

      if (!handoff.exists_in_outputs && !handoff.exists_in_required_inputs) {
        return [
          `Handoff ${handoff.from_agent_id} -> ${handoff.to_agent_id} is missing artifact ${handoff.artifact} on both sides.`,
        ];
      }

      if (!handoff.exists_in_outputs) {
        return [
          `Handoff ${handoff.from_agent_id} -> ${handoff.to_agent_id} is missing ${handoff.artifact} in upstream expected outputs.`,
        ];
      }

      return [
        `Handoff ${handoff.from_agent_id} -> ${handoff.to_agent_id} is missing ${handoff.artifact} in downstream required inputs.`,
      ];
    }),
  };
}
