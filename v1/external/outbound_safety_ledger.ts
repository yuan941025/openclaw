import { getActionBoundaryRule } from "./action_boundary.ts";
import type {
  ActionBoundaryResult,
  ApprovalReviewSession,
  ControlledOutboundSimulation,
  DecisionReplay,
  OutboundSafetyLedger,
} from "../agents/agent_types.ts";

type BuildOutboundSafetyLedgerInput = {
  approvalReviewSession: ApprovalReviewSession;
  decisionReplay: DecisionReplay;
  controlledOutboundSimulation: ControlledOutboundSimulation;
  actionBoundary: ActionBoundaryResult;
};

export function buildOutboundSafetyLedger(
  input: BuildOutboundSafetyLedgerInput,
): OutboundSafetyLedger {
  const decisionLookup = new Map(
    input.decisionReplay.decision_history.map((entry) => [entry.review_id, entry]),
  );
  const simulationLookup = new Map(
    input.controlledOutboundSimulation.simulated_actions.map((action) => [action.review_id, action]),
  );
  const recordedActions = input.approvalReviewSession.review_session.review_ids.map((reviewId) => {
    const simulatedAction = simulationLookup.get(reviewId);
    const decision = decisionLookup.get(reviewId);
    const boundaryRule = simulatedAction
      ? getActionBoundaryRule(simulatedAction.action_type, input.actionBoundary)
      : undefined;

    return {
      review_id: reviewId,
      action_type: simulatedAction?.action_type ?? "unknown",
      boundary_result: boundaryRule?.approval_level ?? "unknown",
      decision: decision?.decision ?? "unknown",
      execution_mode: simulatedAction?.simulation_status === "executed"
        ? "controlled_simulation"
        : simulatedAction?.simulation_status === "blocked"
          ? "blocked_by_boundary"
          : "review_only",
    };
  });

  const safetyFlags = [
    recordedActions.some((action) => action.boundary_result === "user_required")
      ? "approval_required_action_present"
      : null,
    recordedActions.some((action) => action.boundary_result === "blocked" || action.execution_mode === "blocked_by_boundary")
      ? "blocked_action_present"
      : null,
    recordedActions.some((action) => action.decision === "revise_required")
      ? "revise_required_present"
      : null,
  ].filter((flag): flag is string => Boolean(flag));

  return {
    safety_ledger: {
      ledger_id: "outbound_safety_ledger_1",
      session_id: input.approvalReviewSession.review_session.session_id,
      recorded_actions: recordedActions,
      safety_flags: safetyFlags,
      ledger_summary: [
        `Recorded actions: ${recordedActions.map((action) => action.review_id).join(", ") || "none"}.`,
        `Safety flags: ${safetyFlags.join(", ") || "none"}.`,
        `Execution modes: ${[...new Set(recordedActions.map((action) => action.execution_mode))].join(", ") || "none"}.`,
      ],
    },
  };
}
