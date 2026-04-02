import type {
  BatchDecisionIngress,
  BatchRevisionQueue,
} from "../agents/agent_types.ts";

type BuildBatchRevisionQueueInput = {
  batchDecisionPayloads: BatchDecisionIngress;
};

export function buildBatchRevisionQueue(
  input: BuildBatchRevisionQueueInput,
): BatchRevisionQueue {
  const revisionQueue = input.batchDecisionPayloads.batch_decision_payloads
    .filter((payload) => payload.decision === "revise_required")
    .map((payload) => ({
      review_id: payload.review_id,
      revision_round: payload.revision_round ?? 1,
      revision_notes: payload.decision_notes,
      source_actor_id: payload.actor_id,
    }));

  return {
    revision_queue: revisionQueue,
    revision_queue_summary: [
      `Revision queue size: ${revisionQueue.length}.`,
      `Queued reviews: ${revisionQueue.map((entry) => entry.review_id).join(", ") || "none"}.`,
      `Revision rounds: ${revisionQueue.map((entry) => `${entry.review_id}@${entry.revision_round}`).join(", ") || "none"}.`,
    ],
    next_revision_batch_step: revisionQueue.length > 0
      ? "Resolve the revision queue and resubmit the updated review batch."
      : "No revision batch is pending.",
  };
}
