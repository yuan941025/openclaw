import type {
  DecisionReplay,
  HumanDecisionPayload,
  ReviewOverrideUpdate,
} from "../agents/agent_types.ts";

type UpdateReviewOverrideInput = {
  decisionReplay: DecisionReplay;
  decisionPayload: HumanDecisionPayload;
};

function getLatestDecisionForReview(
  decisionReplay: DecisionReplay,
  reviewId: string,
) {
  return [...decisionReplay.decision_history]
    .filter((entry) => entry.review_id === reviewId)
    .sort((left, right) => right.revision_round - left.revision_round)[0];
}

function getNextReplayId(decisionReplay: DecisionReplay): string {
  const maxReplayIndex = decisionReplay.decision_history.reduce((maxIndex, entry) => {
    const parsed = Number.parseInt(entry.replay_id.replace("decision_replay_", ""), 10);
    return Number.isInteger(parsed) ? Math.max(maxIndex, parsed) : maxIndex;
  }, 0);
  return `decision_replay_${maxReplayIndex + 1}`;
}

export function applyReviewOverrideToDecisionReplay(
  decisionReplay: DecisionReplay,
  decisionPayload: HumanDecisionPayload,
): DecisionReplay {
  if (!decisionPayload.ingress_validation.valid) {
    return decisionReplay;
  }

  const reviewId = decisionPayload.decision_payload.review_id;
  const preservedEntries = decisionReplay.decision_history.filter((entry) => entry.review_id !== reviewId);
  const latestEntry = getLatestDecisionForReview(decisionReplay, reviewId);
  const nextRound = decisionPayload.decision_payload.revision_round
    ?? latestEntry?.revision_round
    ?? 1;

  return {
    ...decisionReplay,
    decision_history: [
      ...preservedEntries,
      {
        replay_id: getNextReplayId(decisionReplay),
        review_id: reviewId,
        decision: decisionPayload.decision_payload.decision,
        decision_notes: decisionPayload.decision_payload.decision_notes,
        revision_round: nextRound,
      },
    ],
    replay_summary: [
      ...decisionReplay.replay_summary,
      `Applied human override ${decisionPayload.decision_payload.decision} to ${reviewId}.`,
    ],
  };
}

export function updateReviewOverride(
  input: UpdateReviewOverrideInput,
): ReviewOverrideUpdate {
  if (!input.decisionPayload.ingress_validation.valid) {
    return {
      override_update: {
        review_id: input.decisionPayload.decision_payload.review_id,
        new_decision: input.decisionPayload.decision_payload.decision,
        update_status: "rejected",
      },
      update_summary: [
        `Rejected override update for ${input.decisionPayload.decision_payload.review_id || "unknown_review"}.`,
        `Ingress validation issues: ${input.decisionPayload.ingress_validation.issues.join(" | ") || "none"}.`,
      ],
    };
  }

  const latestDecision = getLatestDecisionForReview(
    input.decisionReplay,
    input.decisionPayload.decision_payload.review_id,
  );

  return {
    override_update: {
      review_id: input.decisionPayload.decision_payload.review_id,
      previous_decision: latestDecision?.decision,
      new_decision: input.decisionPayload.decision_payload.decision,
      update_status: latestDecision ? "updated" : "created",
    },
    update_summary: [
      latestDecision
        ? `Updated review ${input.decisionPayload.decision_payload.review_id} from ${latestDecision.decision} to ${input.decisionPayload.decision_payload.decision}.`
        : `Created new override for review ${input.decisionPayload.decision_payload.review_id}.`,
    ],
  };
}
