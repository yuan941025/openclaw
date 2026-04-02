import type {
  ApprovalStateMachineResult,
  DecisionOutcomePreview,
  OutboundReceipt,
  RevenueLoopPreview,
} from "../agents/agent_types.ts";

type PreviewDecisionOutcomeInput = {
  stateMachineResult: ApprovalStateMachineResult;
  outboundReceipt?: OutboundReceipt;
  revenueLoopPreview?: RevenueLoopPreview;
};

type ResolvedDecisionOutcome = {
  expectedOutboundStatus: string;
  expectedRevenueCycleStatus: string;
  nextDecisionStep: string;
};

export function resolveDecisionOutcome(
  currentStatus: ApprovalStateMachineResult["state_machine_result"]["current_status"],
  outboundReceipt?: OutboundReceipt,
  revenueLoopPreview?: RevenueLoopPreview,
): ResolvedDecisionOutcome {
  let expectedOutboundStatus = "review_only";
  let expectedRevenueCycleStatus = revenueLoopPreview?.revenue_loop_preview.current_cycle_status ?? "preparing";
  let nextDecisionStep = "Continue the human approval cycle with the next pending review.";

  if (currentStatus === "approved") {
    expectedOutboundStatus = outboundReceipt?.outbound_status === "completed"
      ? "executed_simulation_ready"
      : "ready_for_controlled_outbound";
    expectedRevenueCycleStatus = "awaiting_reply";
    nextDecisionStep = "Move the approved review into the next controlled outbound step.";
  } else if (currentStatus === "revise_required") {
    expectedOutboundStatus = "review_only";
    expectedRevenueCycleStatus = "awaiting_approval";
    nextDecisionStep = "Revise the review pack and re-enter the approval cycle.";
  } else if (currentStatus === "rejected") {
    expectedOutboundStatus = "safe_mode";
    expectedRevenueCycleStatus = "safe_mode";
    nextDecisionStep = "Keep the rejected review in safe mode and continue with approved alternatives.";
  } else if (currentStatus === "mixed") {
    expectedOutboundStatus = "partial_safe_mode";
    expectedRevenueCycleStatus = "awaiting_manual_resolution";
    nextDecisionStep = "Resolve mixed approval outcomes before the next outbound cycle.";
  }

  return {
    expectedOutboundStatus,
    expectedRevenueCycleStatus,
    nextDecisionStep,
  };
}

export function previewDecisionOutcome(
  input: PreviewDecisionOutcomeInput,
): DecisionOutcomePreview {
  const currentStatus = input.stateMachineResult.state_machine_result.current_status;
  const resolvedOutcome = resolveDecisionOutcome(
    currentStatus,
    input.outboundReceipt,
    input.revenueLoopPreview,
  );

  return {
    outcome_preview: {
      expected_session_status: currentStatus,
      expected_outbound_status: resolvedOutcome.expectedOutboundStatus,
      expected_revenue_cycle_status: resolvedOutcome.expectedRevenueCycleStatus,
    },
    outcome_summary: [
      `Expected session status: ${currentStatus}.`,
      `Expected outbound status: ${resolvedOutcome.expectedOutboundStatus}.`,
      `Expected revenue cycle status: ${resolvedOutcome.expectedRevenueCycleStatus}.`,
    ],
    next_decision_step: resolvedOutcome.nextDecisionStep,
  };
}
