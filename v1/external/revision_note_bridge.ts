import type {
  HumanDecisionPayload,
  OutboundReviewPackResult,
  RevisionNoteBridgeResult,
  ReviewOverrideUpdate,
} from "../agents/agent_types.ts";

type BridgeRevisionNotesInput = {
  decisionPayload: HumanDecisionPayload;
  overrideUpdate: ReviewOverrideUpdate;
  outboundReviewPack: OutboundReviewPackResult;
};

function getActionTypeForReview(
  outboundReviewPack: OutboundReviewPackResult,
  reviewId: string,
): string {
  return outboundReviewPack.review_packs.find((review) => review.review_id === reviewId)?.action_type
    ?? reviewId;
}

export function bridgeRevisionNotes(
  input: BridgeRevisionNotesInput,
): RevisionNoteBridgeResult {
  const reviewId = input.decisionPayload.decision_payload.review_id;
  const targetReview = input.outboundReviewPack.review_packs.find((review) => review.review_id === reviewId);
  const revisionNotes = input.decisionPayload.decision_payload.decision === "revise_required"
    ? input.decisionPayload.decision_payload.decision_notes
    : [];

  const bridge = reviewId
    ? [{
      review_id: reviewId,
      revision_notes_applied: revisionNotes,
      target_pack_updated: Boolean(targetReview) && input.overrideUpdate.override_update.update_status !== "rejected",
    }]
    : [];

  let nextRevisionStep =
    "No revision note bridge update is required for the current decision.";
  if (input.decisionPayload.decision_payload.decision === "revise_required") {
    const actionType = getActionTypeForReview(input.outboundReviewPack, reviewId);
    nextRevisionStep = actionType === "create_invoice"
      ? "Revise quote wording and re-enter approval."
      : `Update the ${actionType} draft before resubmitting.`;
  }

  return {
    revision_bridge: bridge,
    bridge_summary: [
      `Revision notes applied to ${reviewId || "no_review"}: ${revisionNotes.join(" | ") || "none"}.`,
      `Target review pack updated: ${bridge[0]?.target_pack_updated ? "true" : "false"}.`,
    ],
    next_revision_step: nextRevisionStep,
  };
}
