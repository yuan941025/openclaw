import { defineExternalActionBoundary, getActionBoundaryRule } from "./action_boundary.ts";
import type {
  ActionBoundaryResult,
  ApprovalDecisionContract,
  ControlledOutboundSimulation,
  OutboundReviewPackResult,
} from "../agents/agent_types.ts";

type SimulateControlledOutboundInput = {
  outboundReviewPack: OutboundReviewPackResult;
  approvalDecisionContract: ApprovalDecisionContract;
  actionBoundary?: ActionBoundaryResult;
};

function getSimulationStatus(
  decision: ApprovalDecisionContract["decisions"][number]["decision"],
  approvalLevel: ActionBoundaryResult["allowed_actions"][number]["approval_level"] | undefined,
): ControlledOutboundSimulation["simulated_actions"][number]["simulation_status"] {
  if (approvalLevel === "blocked") {
    return "blocked";
  }

  if (decision === "reject") {
    return "rejected";
  }

  if (decision === "revise") {
    return "revision_requested";
  }

  return "executed";
}

export function simulateControlledOutbound(
  input: SimulateControlledOutboundInput,
): ControlledOutboundSimulation {
  const actionBoundary = input.actionBoundary ?? defineExternalActionBoundary();
  const decisionLookup = new Map(
    input.approvalDecisionContract.decisions.map((decision) => [decision.review_id, decision]),
  );
  const simulatedActions = input.outboundReviewPack.review_packs.map((reviewPack) => {
    const decision = decisionLookup.get(reviewPack.review_id);
    const boundaryRule = getActionBoundaryRule(reviewPack.action_type, actionBoundary);
    const simulationStatus = getSimulationStatus(
      decision?.decision ?? "revise",
      boundaryRule?.approval_level,
    );

    return {
      review_id: reviewPack.review_id,
      action_type: reviewPack.action_type,
      source_agent_id: reviewPack.source_agent_id,
      decision: decision?.decision ?? "revise",
      simulation_status: simulationStatus,
      produced_artifacts: simulationStatus === "executed"
        ? [`simulated_${reviewPack.action_type}_artifact`, ...reviewPack.content_preview]
        : [],
      result_notes: [
        simulationStatus === "executed"
          ? `Simulated ${reviewPack.action_type} under controlled outbound mode.`
          : simulationStatus === "blocked"
            ? `Blocked ${reviewPack.action_type} because it is outside the current boundary.`
            : simulationStatus === "rejected"
              ? `Rejected ${reviewPack.action_type}; no outbound simulation was performed.`
              : `Revision requested for ${reviewPack.action_type}; await updated review pack.`,
        ...(decision?.decision_notes ?? []),
      ],
    };
  });

  return {
    simulated_actions: simulatedActions,
    simulation_summary: [
      `Executed simulations: ${simulatedActions.filter((action) => action.simulation_status === "executed").map((action) => action.review_id).join(", ") || "none"}.`,
      `Blocked simulations: ${simulatedActions.filter((action) => action.simulation_status === "blocked").map((action) => action.review_id).join(", ") || "none"}.`,
      `Revision-needed simulations: ${simulatedActions.filter((action) => action.simulation_status === "revision_requested").map((action) => action.review_id).join(", ") || "none"}.`,
    ],
    next_outbound_step: simulatedActions.every((action) => action.simulation_status === "executed")
      ? "Controlled outbound simulation completed. Review the receipt before any real send."
      : "Refresh the outbound review pack before the next simulation cycle.",
  };
}
