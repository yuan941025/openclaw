import type {
  ApprovalReviewSession,
  DecisionReplay,
} from "../agents/agent_types.ts";

export type ApprovalRevisionResult = {
  session_id: string;
  revised_reviews: string[];
  approved_after_revision: string[];
  still_rejected_reviews: string[];
  revision_summary: string[];
  next_revision_step: string;
};

type RunApprovalRevisionInput = {
  approvalReviewSession: ApprovalReviewSession;
  decisionReplay: DecisionReplay;
};

function getActionTypeFromReviewId(reviewId: string): string {
  const match = reviewId.match(/_(send_message|publish_post|create_invoice)_review_/);
  return match?.[1] ?? reviewId;
}

export function runApprovalRevision(
  input: RunApprovalRevisionInput,
): ApprovalRevisionResult {
  const reviewIds = new Set(input.approvalReviewSession.review_session.review_ids);
  const grouped = new Map<string, DecisionReplay["decision_history"]>();

  for (const entry of input.decisionReplay.decision_history) {
    if (!reviewIds.has(entry.review_id)) {
      continue;
    }
    const current = grouped.get(entry.review_id) ?? [];
    current.push(entry);
    grouped.set(entry.review_id, current);
  }

  const revisedReviews: string[] = [];
  const approvedAfterRevision: string[] = [];
  const stillRejectedReviews: string[] = [];

  for (const [reviewId, history] of grouped.entries()) {
    const sortedHistory = [...history].sort((left, right) => left.revision_round - right.revision_round);
    const hasRevision = sortedHistory.some((entry) => entry.decision === "revise_required");
    if (!hasRevision) {
      continue;
    }

    revisedReviews.push(reviewId);
    const finalDecision = sortedHistory.at(-1)?.decision;
    if (finalDecision === "approved") {
      approvedAfterRevision.push(reviewId);
      continue;
    }

    if (finalDecision === "rejected" || finalDecision === "revise_required") {
      stillRejectedReviews.push(reviewId);
    }
  }

  let nextRevisionStep =
    "No revision-specific action is required before the next approval cycle.";

  if (stillRejectedReviews.length > 0) {
    nextRevisionStep = `Keep ${getActionTypeFromReviewId(stillRejectedReviews[0])} in rejected state and continue with safe alternatives.`;
  } else if (approvedAfterRevision.length > 0) {
    nextRevisionStep = `Advance revised ${getActionTypeFromReviewId(approvedAfterRevision[0])} pack into the next controlled outbound step.`;
  }

  return {
    session_id: input.approvalReviewSession.review_session.session_id,
    revised_reviews: revisedReviews,
    approved_after_revision: approvedAfterRevision,
    still_rejected_reviews: stillRejectedReviews,
    revision_summary: [
      `Revised reviews: ${revisedReviews.join(", ") || "none"}.`,
      `Approved after revision: ${approvedAfterRevision.join(", ") || "none"}.`,
      `Still rejected after revision: ${stillRejectedReviews.join(", ") || "none"}.`,
    ],
    next_revision_step: nextRevisionStep,
  };
}
