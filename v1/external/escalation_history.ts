import type {
  EscalationHistory,
  ReviewEscalations,
} from "../agents/agent_types.ts";

type BuildEscalationHistoryInput = {
  reviewEscalations: ReviewEscalations;
  sessionId?: string;
};

export function buildEscalationHistory(
  input: BuildEscalationHistoryInput,
): EscalationHistory {
  const escalatedReviews = input.reviewEscalations.escalations.map((entry) => ({
    review_id: entry.review_id,
    from_actor_id: entry.from_actor_id,
    to_actor_id: entry.to_actor_id,
    escalation_reason: entry.escalation_reason,
  }));

  return {
    escalation_history: {
      session_id: input.sessionId ?? "approval_session_1",
      escalated_reviews: escalatedReviews,
      history_summary: escalatedReviews.length > 0
        ? escalatedReviews.map((entry) =>
          `${entry.review_id} moved from ${entry.from_actor_id} to ${entry.to_actor_id}: ${entry.escalation_reason}`
        )
        : ["No escalations were recorded for this session."],
    },
  };
}
