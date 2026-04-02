import type {
  ApprovalReviewSession,
  ApprovalWorkQueue,
  DecisionReplay,
  HumanDecisionPayload,
  ReviewOverrideUpdate,
} from "../agents/agent_types.ts";
import { applyReviewOverrideToDecisionReplay } from "./review_override_updater.ts";

type BuildApprovalWorkQueueInput = {
  approvalReviewSession: ApprovalReviewSession;
  decisionReplay?: DecisionReplay;
  overrideUpdate?: ReviewOverrideUpdate;
  decisionPayload?: HumanDecisionPayload;
};

export function getApprovalQueueStatusForReview(
  reviewId: string,
  approvalQueue: ApprovalWorkQueue["approval_queue"],
): "pending" | "approved" | "rejected" | "revise_required" | "unknown" {
  if (approvalQueue.pending_reviews.includes(reviewId)) {
    return "pending";
  }

  if (approvalQueue.approved_reviews.includes(reviewId)) {
    return "approved";
  }

  if (approvalQueue.rejected_reviews.includes(reviewId)) {
    return "rejected";
  }

  if (approvalQueue.revise_required_reviews.includes(reviewId)) {
    return "revise_required";
  }

  return "unknown";
}

export function getApprovalQueueNextAction(
  pendingReviews: string[],
  approvedReviews: string[],
  reviseRequiredReviews: string[],
): string {
  if (reviseRequiredReviews.length > 0) {
    return "Apply revision notes and re-enter the approval queue.";
  }

  if (pendingReviews.length === 0 && approvedReviews.length > 0) {
    return "Move approved reviews into the next controlled outbound step.";
  }

  return "Continue the human approval cycle with the next pending review.";
}

export function buildApprovalWorkQueue(
  input: BuildApprovalWorkQueueInput,
): ApprovalWorkQueue {
  const effectiveReplay = input.decisionReplay && input.overrideUpdate && input.decisionPayload
    ? applyReviewOverrideToDecisionReplay(input.decisionReplay, input.decisionPayload)
    : input.decisionReplay;
  const latestByReview = new Map<string, DecisionReplay["decision_history"][number]>();

  for (const reviewId of input.approvalReviewSession.review_session.review_ids) {
    const latestEntry = effectiveReplay
      ? [...effectiveReplay.decision_history]
        .filter((entry) => entry.review_id === reviewId)
        .sort((left, right) => right.revision_round - left.revision_round)[0]
      : undefined;
    if (latestEntry) {
      latestByReview.set(reviewId, latestEntry);
    }
  }

  const approvedReviews = [...latestByReview.values()]
    .filter((entry) => entry.decision === "approved")
    .map((entry) => entry.review_id);
  const rejectedReviews = [...latestByReview.values()]
    .filter((entry) => entry.decision === "rejected")
    .map((entry) => entry.review_id);
  const reviseRequiredReviews = [...latestByReview.values()]
    .filter((entry) => entry.decision === "revise_required")
    .map((entry) => entry.review_id);
  const pendingReviews = input.approvalReviewSession.review_session.review_ids.filter((reviewId) =>
    !latestByReview.has(reviewId)
  );

  const nextQueueAction = getApprovalQueueNextAction(
    pendingReviews,
    approvedReviews,
    reviseRequiredReviews,
  );

  return {
    approval_queue: {
      pending_reviews: pendingReviews,
      approved_reviews: approvedReviews,
      rejected_reviews: rejectedReviews,
      revise_required_reviews: reviseRequiredReviews,
    },
    queue_summary: [
      `Pending reviews: ${pendingReviews.join(", ") || "none"}.`,
      `Approved reviews: ${approvedReviews.join(", ") || "none"}.`,
      `Revise-required reviews: ${reviseRequiredReviews.join(", ") || "none"}.`,
      `Rejected reviews: ${rejectedReviews.join(", ") || "none"}.`,
    ],
    next_queue_action: nextQueueAction,
  };
}
