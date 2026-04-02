import type {
  ApprovalReviewSession,
  BatchApprovalStateMachineResult,
  BatchDecisionIngress,
  SessionReceipt,
} from "../agents/agent_types.ts";

type RunBatchApprovalStateMachineInput = {
  approvalReviewSession: ApprovalReviewSession;
  batchDecisionPayloads: BatchDecisionIngress;
  sessionReceipt?: SessionReceipt;
  resubmittedBatchDecisionPayloads?: BatchDecisionIngress["batch_decision_payloads"];
};

function resolveBatchCurrentStatus(
  approvedReviews: string[],
  rejectedReviews: string[],
  reviseRequiredReviews: string[],
  totalDecisions: number,
): BatchApprovalStateMachineResult["batch_state_machine_result"]["current_status"] {
  if (totalDecisions === 0) {
    return "open";
  }

  if (reviseRequiredReviews.length > 0) {
    return "revise_required";
  }

  if (approvedReviews.length === totalDecisions) {
    return "approved";
  }

  if (rejectedReviews.length === totalDecisions) {
    return "rejected";
  }

  if (approvedReviews.length > 0 && rejectedReviews.length > 0) {
    return "mixed";
  }

  return "open";
}

export function runBatchApprovalStateMachine(
  input: RunBatchApprovalStateMachineInput,
): BatchApprovalStateMachineResult {
  const payloadByReview = new Map(
    input.batchDecisionPayloads.batch_decision_payloads.map((payload) => [payload.review_id, payload]),
  );
  for (const payload of input.resubmittedBatchDecisionPayloads ?? []) {
    payloadByReview.set(payload.review_id, payload);
  }

  const effectivePayloads = [...payloadByReview.values()];
  const approvedReviews = effectivePayloads
    .filter((payload) => payload.decision === "approved")
    .map((payload) => payload.review_id);
  const rejectedReviews = effectivePayloads
    .filter((payload) => payload.decision === "rejected")
    .map((payload) => payload.review_id);
  const reviseRequiredReviews = effectivePayloads
    .filter((payload) => payload.decision === "revise_required")
    .map((payload) => payload.review_id);
  const resubmittedReviewIds = new Set((input.resubmittedBatchDecisionPayloads ?? []).map((payload) => payload.review_id));
  const currentStatus = resolveBatchCurrentStatus(
    approvedReviews,
    rejectedReviews,
    reviseRequiredReviews,
    effectivePayloads.length,
  );
  const previousStatus = input.sessionReceipt?.session_receipt.final_session_status
    ?? input.approvalReviewSession.review_session.session_status;
  const transitionReason = currentStatus === "approved" && resubmittedReviewIds.size > 0
    ? `Resubmitted reviews cleared the revision queue: ${[...resubmittedReviewIds].join(", ")}.`
    : currentStatus === "approved"
      ? "All batch review decisions are approved."
      : currentStatus === "rejected"
        ? "All batch review decisions are rejected."
        : currentStatus === "revise_required"
          ? "At least one batch review requires revision."
          : currentStatus === "mixed" && resubmittedReviewIds.size > 0
            ? `Resubmission resolved some reviews, but rejected reviews remain: ${rejectedReviews.join(", ")}.`
            : currentStatus === "mixed"
              ? "Approved and rejected reviews coexist in the same batch."
              : "No valid batch decisions have been applied yet.";

  return {
    batch_state_machine_result: {
      session_id: input.approvalReviewSession.review_session.session_id,
      previous_status: previousStatus,
      current_status: currentStatus,
      approved_reviews: approvedReviews,
      rejected_reviews: rejectedReviews,
      revise_required_reviews: reviseRequiredReviews,
      transition_reason: transitionReason,
    },
    batch_state_summary: [
      `Previous status: ${previousStatus}.`,
      `Current batch status: ${currentStatus}.`,
      `Transition reason: ${transitionReason}`,
      resubmittedReviewIds.size > 0
        ? `Resubmitted reviews in scope: ${[...resubmittedReviewIds].join(", ")}.`
        : "Resubmitted reviews in scope: none.",
    ],
  };
}
