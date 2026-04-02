import { defineExternalActionBoundary, getActionBoundaryRule } from "./action_boundary.ts";
import type {
  ActionBoundaryResult,
  ControlledOutboundSimulation,
  OutboundReceipt,
} from "../agents/agent_types.ts";

type BuildOutboundReceiptInput = {
  controlledOutboundSimulation: ControlledOutboundSimulation;
  actionBoundary?: ActionBoundaryResult;
};

function getOutboundStatus(
  simulation: ControlledOutboundSimulation,
): OutboundReceipt["outbound_status"] {
  const hasBlocked = simulation.simulated_actions.some((action) => action.simulation_status === "blocked");
  const hasRejected = simulation.simulated_actions.some((action) =>
    action.simulation_status === "rejected" || action.simulation_status === "revision_requested"
  );
  const allExecuted = simulation.simulated_actions.every((action) => action.simulation_status === "executed");

  if (allExecuted) {
    return "completed";
  }

  if (hasBlocked && !simulation.simulated_actions.some((action) => action.simulation_status === "executed")) {
    return "failed";
  }

  if (hasBlocked || hasRejected) {
    return "partial";
  }

  return "failed";
}

export function buildOutboundReceipt(
  input: BuildOutboundReceiptInput,
): OutboundReceipt {
  const actionBoundary = input.actionBoundary ?? defineExternalActionBoundary();
  const actionReceipts = input.controlledOutboundSimulation.simulated_actions.map((action) => {
    const boundaryRule = getActionBoundaryRule(action.action_type, actionBoundary);

    return {
      review_id: action.review_id,
      action_type: action.action_type,
      source_agent_id: action.source_agent_id,
      decision: action.decision,
      execution_status: action.simulation_status,
      produced_artifacts: action.produced_artifacts,
      safety_notes: [
        action.simulation_status === "blocked"
          ? `Blocked because ${boundaryRule?.reason ?? "the action is outside the boundary"}.`
          : action.simulation_status === "executed"
            ? `Simulated safely because ${boundaryRule?.reason ?? "the action passed the current controlled review path"}.`
            : action.simulation_status === "rejected"
              ? "Outbound simulation stopped because the review decision was reject."
              : "Outbound simulation is waiting for revised content before retry.",
      ],
    };
  });

  return {
    outbound_status: getOutboundStatus(input.controlledOutboundSimulation),
    action_receipts: actionReceipts,
    completed_actions: actionReceipts
      .filter((receipt) => receipt.execution_status === "executed")
      .map((receipt) => receipt.review_id),
    blocked_actions: actionReceipts
      .filter((receipt) => receipt.execution_status === "blocked")
      .map((receipt) => receipt.review_id),
    rejected_actions: actionReceipts
      .filter((receipt) => receipt.execution_status === "rejected" || receipt.execution_status === "revision_requested")
      .map((receipt) => receipt.review_id),
    receipt_summary: [
      `Outbound status: ${getOutboundStatus(input.controlledOutboundSimulation)}.`,
      `Completed actions: ${actionReceipts.filter((receipt) => receipt.execution_status === "executed").map((receipt) => receipt.review_id).join(", ") || "none"}.`,
      `Blocked or rejected actions: ${actionReceipts.filter((receipt) => receipt.execution_status !== "executed").map((receipt) => receipt.review_id).join(", ") || "none"}.`,
    ],
  };
}
