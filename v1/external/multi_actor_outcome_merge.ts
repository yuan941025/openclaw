import type {
  ActorDecisionAudit,
  BatchApprovalStateMachineResult,
  MultiActorOutcomeMerge,
  SessionReceipt,
  SessionReassignment,
} from "../agents/agent_types.ts";

type MergeMultiActorOutcomesInput = {
  sessionReceipt?: SessionReceipt;
  batchStateMachineResult?: BatchApprovalStateMachineResult;
  actorAuditTrail: ActorDecisionAudit;
  reassignmentResult: SessionReassignment;
};

function resolveMergedStatus(
  approvedReviews: string[],
  rejectedReviews: string[],
  reviseRequiredReviews: string[],
): MultiActorOutcomeMerge["merged_actor_outcomes"]["merged_status"] {
  const total = approvedReviews.length + rejectedReviews.length + reviseRequiredReviews.length;
  if (total === 0) {
    return "partial";
  }

  if (reviseRequiredReviews.length > 0) {
    return "partial";
  }

  if (approvedReviews.length === total) {
    return "approved";
  }

  if (rejectedReviews.length === total) {
    return "rejected";
  }

  return "mixed";
}

export function mergeMultiActorOutcomes(
  input: MergeMultiActorOutcomesInput,
): MultiActorOutcomeMerge {
  const sessionId = input.sessionReceipt?.session_receipt.session_id
    ?? input.batchStateMachineResult?.batch_state_machine_result.session_id
    ?? "approval_session_1";
  const approvedReviews = input.sessionReceipt?.session_receipt.approved_reviews
    ?? input.batchStateMachineResult?.batch_state_machine_result.approved_reviews
    ?? [];
  const rejectedReviews = input.sessionReceipt?.session_receipt.rejected_reviews
    ?? input.batchStateMachineResult?.batch_state_machine_result.rejected_reviews
    ?? [];
  const reviseRequiredReviews = input.sessionReceipt?.session_receipt.revise_required_reviews
    ?? input.batchStateMachineResult?.batch_state_machine_result.revise_required_reviews
    ?? [];
  const involvedActors = [...new Set([
    ...input.actorAuditTrail.actor_audit_trail.map((entry) => entry.actor_id),
    ...input.reassignmentResult.reassignment_result.map((entry) => entry.new_actor_id),
  ])];
  const mergedStatus = resolveMergedStatus(
    approvedReviews,
    rejectedReviews,
    reviseRequiredReviews,
  );

  return {
    merged_actor_outcomes: {
      session_id: sessionId,
      involved_actors: involvedActors,
      merged_status: mergedStatus,
      approved_reviews: approvedReviews,
      rejected_reviews: rejectedReviews,
      revise_required_reviews: reviseRequiredReviews,
    },
    merge_summary: [
      `Involved actors: ${involvedActors.join(", ") || "none"}.`,
      `Merged status: ${mergedStatus}.`,
      `Approved reviews: ${approvedReviews.join(", ") || "none"}.`,
      `Rejected reviews: ${rejectedReviews.join(", ") || "none"}.`,
    ],
    next_merge_step: mergedStatus === "approved"
      ? "Prepare the merged approved session for real execution readiness checks."
      : "Resolve remaining mixed or partial outcomes before real execution readiness checks.",
  };
}
