import type {
  ApprovalReviewSession,
  DecisionReplay,
  HumanDecisionPayload,
  SessionDecisionIngestResult,
} from "../agents/agent_types.ts";

type IngestSessionDecisionInput = {
  approvalReviewSession: ApprovalReviewSession;
  decisionPayload: HumanDecisionPayload;
  decisionReplay?: DecisionReplay;
};

export function ingestSessionDecision(
  input: IngestSessionDecisionInput,
): SessionDecisionIngestResult {
  if (!input.decisionPayload.ingress_validation.valid) {
    return {
      session_ingest_result: {
        session_id: input.approvalReviewSession.review_session.session_id,
        ingested_reviews: [],
        updated_decisions: [],
        ingest_status: "rejected",
      },
      ingest_notes: [
        `Rejected decision ingest for ${input.decisionPayload.decision_payload.review_id || "unknown_review"}.`,
        `Ingress validation issues: ${input.decisionPayload.ingress_validation.issues.join(" | ") || "none"}.`,
      ],
    };
  }

  const reviewIds = new Set(input.approvalReviewSession.review_session.review_ids);
  const reviewId = input.decisionPayload.decision_payload.review_id;
  if (!reviewIds.has(reviewId)) {
    return {
      session_ingest_result: {
        session_id: input.approvalReviewSession.review_session.session_id,
        ingested_reviews: [],
        updated_decisions: [],
        ingest_status: "rejected",
      },
      ingest_notes: [
        `Review ${reviewId} does not belong to session ${input.approvalReviewSession.review_session.session_id}.`,
      ],
    };
  }

  const ingestStatus = input.approvalReviewSession.review_session.review_ids.length > 1
    ? "partial"
    : "applied";
  const hadPriorDecision = input.decisionReplay?.decision_history.some((entry) => entry.review_id === reviewId);

  return {
    session_ingest_result: {
      session_id: input.approvalReviewSession.review_session.session_id,
      ingested_reviews: [reviewId],
      updated_decisions: [input.decisionPayload.decision_payload.decision],
      ingest_status: ingestStatus,
    },
    ingest_notes: [
      `Ingested ${input.decisionPayload.decision_payload.decision} for review ${reviewId}.`,
      hadPriorDecision
        ? `Session already had prior decision history for ${reviewId}.`
        : `Session accepted the first decision payload for ${reviewId}.`,
    ],
  };
}
