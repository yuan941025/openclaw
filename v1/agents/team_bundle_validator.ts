import type {
  AgentExecutionBundleExport,
  CoordinationPlan,
  TeamBundleValidation,
} from "./agent_types.ts";

type ValidateTeamBundlesInput = {
  executionBundles: AgentExecutionBundleExport;
  coordinationPlan: CoordinationPlan;
};

function findBundle(
  bundles: AgentExecutionBundleExport["bundles"],
  agentId: string,
) {
  return bundles.find((bundle) => bundle.agent_id === agentId);
}

function extractArtifactInputs(requiredInputs: string[]): string[] {
  return requiredInputs
    .filter((requiredInput) => requiredInput.startsWith("artifact:"))
    .map((requiredInput) => requiredInput.slice("artifact:".length));
}

export function validateTeamBundles(
  input: ValidateTeamBundlesInput,
): TeamBundleValidation {
  const checkedAgents = input.executionBundles.bundles.map((bundle) => {
    const downstreamRules = input.coordinationPlan.handoff_rules
      .filter((rule) => rule.from_agent_id === bundle.agent_id);
    const downstreamRequiredInputs = downstreamRules.flatMap((rule) => {
      const downstreamBundle = findBundle(input.executionBundles.bundles, rule.to_agent_id);
      return downstreamBundle ? extractArtifactInputs(downstreamBundle.required_inputs) : [];
    });
    const matchedOutputs = downstreamRequiredInputs.filter((requiredInput) =>
      bundle.expected_outputs.includes(requiredInput)
    );
    const missingOutputs = downstreamRequiredInputs.filter((requiredInput) =>
      !bundle.expected_outputs.includes(requiredInput)
    );

    return {
      agent_id: bundle.agent_id,
      expected_outputs: bundle.expected_outputs,
      downstream_required_inputs: [...new Set(downstreamRequiredInputs)],
      matched_outputs: [...new Set(matchedOutputs)],
      missing_outputs: [...new Set(missingOutputs)],
    };
  });

  const totalRequired = checkedAgents.reduce(
    (count, agent) => count + agent.downstream_required_inputs.length,
    0,
  );
  const totalMissing = checkedAgents.reduce(
    (count, agent) => count + agent.missing_outputs.length,
    0,
  );
  const totalMatched = checkedAgents.reduce(
    (count, agent) => count + agent.matched_outputs.length,
    0,
  );
  const bundleValidationStatus = totalRequired === 0 || totalMissing === 0
    ? "valid"
    : totalMatched >= totalMissing
      ? "partial"
      : "invalid";

  return {
    bundle_validation_status: bundleValidationStatus,
    checked_agents: checkedAgents,
    validation_summary: checkedAgents.flatMap((agent) => {
      if (agent.downstream_required_inputs.length === 0) {
        return [`Bundle ${agent.agent_id} has no downstream bundle requirements to validate.`];
      }

      if (agent.missing_outputs.length === 0) {
        return [
          `Bundle ${agent.agent_id} can hand off directly through: ${agent.matched_outputs.join(", ")}.`,
        ];
      }

      return [
        `Bundle ${agent.agent_id} is missing downstream output matches for: ${agent.missing_outputs.join(", ")}.`,
      ];
    }),
  };
}
