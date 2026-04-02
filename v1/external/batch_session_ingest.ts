import type {
  ApprovalReviewSession,
  BatchDecisionIngress,
  BatchSessionDecisionIngestResult,
} from "../agents/agent_types.ts";

type IngestBatchSessionDecisionsInput = {
  approvalReviewSession: ApprovalReviewSession;
  batchDecisionPayloads: BatchDecisionIngress;
};

export function ingestBatchSessionDecisions(
  input: IngestBatchSessionDecisionsInput,
): BatchSessionDecisionIngestResult {
  const sessionReviewIds = new Set(input.approvalReviewSession.review_session.review_ids);
  const ingestedReviews: string[] = [];
  const rejectedReviews: string[] = [];

  for (const payload of input.batchDecisionPayloads.batch_decision_payloads) {
    if (sessionReviewIds.has(payload.review_id)) {
      ingestedReviews.push(payload.review_id);
      continue;
    }
    rejectedReviews.push(payload.review_id);
  }

  const ingestStatus = ingestedReviews.length === 0
    ? "rejected"
    : rejectedReviews.length === 0
      ? "applied"
      : "partial";

  return {
    batch_session_ingest_result: {
      session_id: input.approvalReviewSession.review_session.session_id,
      ingested_reviews: ingestedReviews,
      rejected_reviews: rejectedReviews,
      ingest_status: ingestStatus,
    },
    batch_ingest_notes: [
      `Ingested reviews: ${ingestedReviews.join(", ") || "none"}.`,
      `Rejected reviews: ${rejectedReviews.join(", ") || "none"}.`,
      `Batch session ingest status: ${ingestStatus}.`,
    ],
  };
}
