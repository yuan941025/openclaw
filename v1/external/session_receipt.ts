import type {
  ControlledOutboundSimulation,
  DecisionReplay,
  SessionReceipt,
} from "../agents/agent_types.ts";

type BuildSessionReceiptInput = {
  decisionReplay: DecisionReplay;
  controlledOutboundSimulation?: ControlledOutboundSimulation;
};

export function getSessionReceiptFinalStatus(input: SessionReceipt["session_receipt"]): string {
  return input.final_session_status;
}

function getFinalDecisionByReview(decisionReplay: DecisionReplay) {
  const grouped = new Map<string, DecisionReplay["decision_history"]>();
  for (const entry of decisionReplay.decision_history) {
    const current = grouped.get(entry.review_id) ?? [];
    current.push(entry);
    grouped.set(entry.review_id, current);
  }

  return new Map(
    [...grouped.entries()].map(([reviewId, history]) => {
      const finalEntry = [...history].sort((left, right) => right.revision_round - left.revision_round)[0];
      return [reviewId, finalEntry];
    }),
  );
}

function getRevisionOutcomeByReview(decisionReplay: DecisionReplay) {
  const grouped = new Map<string, DecisionReplay["decision_history"]>();
  for (const entry of decisionReplay.decision_history) {
    const current = grouped.get(entry.review_id) ?? [];
    current.push(entry);
    grouped.set(entry.review_id, current);
  }

  const approvedAfterRevision: string[] = [];
  const stillRejectedAfterRevision: string[] = [];
  for (const [reviewId, history] of grouped.entries()) {
    const sortedHistory = [...history].sort((left, right) => left.revision_round - right.revision_round);
    const hadRevision = sortedHistory.some((entry) => entry.decision === "revise_required");
    if (!hadRevision) {
      continue;
    }

    const finalEntry = sortedHistory.at(-1);
    if (finalEntry?.decision === "approved") {
      approvedAfterRevision.push(reviewId);
      continue;
    }

    if (finalEntry?.decision === "rejected" || finalEntry?.decision === "revise_required") {
      stillRejectedAfterRevision.push(reviewId);
    }
  }

  return {
    approvedAfterRevision,
    stillRejectedAfterRevision,
  };
}

function getFinalSessionStatus(
  approvedReviews: string[],
  reviseRequiredReviews: string[],
  rejectedReviews: string[],
  simulation?: ControlledOutboundSimulation,
): SessionReceipt["session_receipt"]["final_session_status"] {
  const reviewCount = approvedReviews.length + reviseRequiredReviews.length + rejectedReviews.length;
  const rejectedActionTypes = new Set(
    simulation?.simulated_actions
      .filter((action) => rejectedReviews.includes(action.review_id))
      .map((action) => action.action_type) ?? [],
  );

  if (reviewCount > 0 && approvedReviews.length === reviewCount) {
    return "approved";
  }

  if (reviewCount > 0 && rejectedReviews.length === reviewCount) {
    return "rejected";
  }

  if (rejectedActionTypes.has("create_invoice")) {
    return "rejected";
  }

  return "partial";
}

export function buildSessionReceipt(
  input: BuildSessionReceiptInput,
): SessionReceipt {
  const finalDecisionByReview = getFinalDecisionByReview(input.decisionReplay);
  const approvedReviews = [...finalDecisionByReview.values()]
    .filter((entry) => entry.decision === "approved")
    .map((entry) => entry.review_id);
  const reviseRequiredReviews = [...finalDecisionByReview.values()]
    .filter((entry) => entry.decision === "revise_required")
    .map((entry) => entry.review_id);
  const rejectedReviews = [...finalDecisionByReview.values()]
    .filter((entry) => entry.decision === "rejected")
    .map((entry) => entry.review_id);
  const revisionOutcome = getRevisionOutcomeByReview(input.decisionReplay);
  const finalSessionStatus = getFinalSessionStatus(
    approvedReviews,
    reviseRequiredReviews,
    rejectedReviews,
    input.controlledOutboundSimulation,
  );

  return {
    session_receipt: {
      session_id: input.decisionReplay.session_id,
      final_session_status: finalSessionStatus,
      approved_reviews: approvedReviews,
      revise_required_reviews: reviseRequiredReviews,
      rejected_reviews: rejectedReviews,
      session_notes: [
        `Final session status: ${finalSessionStatus}.`,
        `Approved reviews: ${approvedReviews.join(", ") || "none"}.`,
        `Revise-required reviews: ${reviseRequiredReviews.join(", ") || "none"}.`,
        `Rejected reviews: ${rejectedReviews.join(", ") || "none"}.`,
        `Approved after revision: ${revisionOutcome.approvedAfterRevision.join(", ") || "none"}.`,
        `Still not approved after revision: ${revisionOutcome.stillRejectedAfterRevision.join(", ") || "none"}.`,
      ],
    },
  };
}
