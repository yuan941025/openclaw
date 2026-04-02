import type {
  BatchApprovalStateMachineResult,
  BatchOutcomePreview,
  OutboundReceipt,
  RevenueLoopPreview,
} from "../agents/agent_types.ts";
import { resolveDecisionOutcome } from "./decision_outcome_preview.ts";
import type { BatchRevisionResubmissionResult } from "./batch_revision_resubmission.ts";

type PreviewBatchDecisionOutcomeInput = {
  batchStateMachineResult: BatchApprovalStateMachineResult;
  outboundReceipt?: OutboundReceipt;
  revenueLoopPreview?: RevenueLoopPreview;
  batchRevisionResubmission?: BatchRevisionResubmissionResult;
};

export function previewBatchDecisionOutcome(
  input: PreviewBatchDecisionOutcomeInput,
): BatchOutcomePreview {
  const currentStatus = input.batchStateMachineResult.batch_state_machine_result.current_status;
  const resolvedOutcome = resolveDecisionOutcome(
    currentStatus,
    input.outboundReceipt,
    input.revenueLoopPreview,
  );
  const reviewsReadyForNextStep = input.batchStateMachineResult.batch_state_machine_result.approved_reviews;
  const resubmittedApprovedReviews = input.batchRevisionResubmission?.resubmission_result.new_batch_decision_payloads
    .filter((payload) => payload.decision === "approved")
    .map((payload) => payload.review_id) ?? [];

  return {
    batch_outcome_preview: {
      expected_session_status: currentStatus,
      expected_outbound_status: resolvedOutcome.expectedOutboundStatus,
      expected_revenue_cycle_status: resolvedOutcome.expectedRevenueCycleStatus,
      reviews_ready_for_next_step: reviewsReadyForNextStep,
    },
    batch_outcome_summary: [
      `Expected session status: ${currentStatus}.`,
      `Ready reviews: ${reviewsReadyForNextStep.join(", ") || "none"}.`,
      resubmittedApprovedReviews.length > 0
        ? `Approved after resubmission: ${resubmittedApprovedReviews.join(", ")}.`
        : "Approved after resubmission: none.",
      `Expected outbound status: ${resolvedOutcome.expectedOutboundStatus}.`,
      `Expected revenue cycle status: ${resolvedOutcome.expectedRevenueCycleStatus}.`,
    ],
    next_batch_decision_step: currentStatus === "approved" && resubmittedApprovedReviews.length > 0
      ? "Advance all revised reviews into the next controlled outbound step."
      : currentStatus === "revise_required"
      ? "Resolve revision items before the next outbound approval batch."
      : currentStatus === "mixed" && input.batchStateMachineResult.batch_state_machine_result.rejected_reviews.length > 0
      ? "Keep rejected reviews in safe mode and continue with approved alternatives."
      : resolvedOutcome.nextDecisionStep,
  };
}
