import type {
  BatchDecisionIngress,
  BatchRevisionQueue,
} from "../agents/agent_types.ts";

export type BatchRevisionResubmissionResult = {
  resubmission_result: {
    resubmitted_reviews: string[];
    resubmission_round: number;
    new_batch_decision_payloads: BatchDecisionIngress["batch_decision_payloads"];
    resubmission_status: "ready" | "skipped";
  };
  resubmission_summary: string[];
  next_resubmission_step: string;
};

type BuildBatchRevisionResubmissionInput = {
  batchRevisionQueue: BatchRevisionQueue;
  originalBatchDecisionPayloads?: BatchDecisionIngress;
};

export function buildBatchRevisionResubmission(
  input: BuildBatchRevisionResubmissionInput,
): BatchRevisionResubmissionResult {
  if (input.batchRevisionQueue.revision_queue.length === 0) {
    return {
      resubmission_result: {
        resubmitted_reviews: [],
        resubmission_round: 0,
        new_batch_decision_payloads: [],
        resubmission_status: "skipped",
      },
      resubmission_summary: [
        "No revise-required reviews were found in the batch revision queue.",
      ],
      next_resubmission_step: "Keep the current batch decisions unchanged.",
    };
  }

  const originalPayloadByReview = new Map(
    input.originalBatchDecisionPayloads?.batch_decision_payloads.map((payload) => [payload.review_id, payload]) ?? [],
  );
  const newBatchDecisionPayloads = input.batchRevisionQueue.revision_queue.map((entry) => {
    const originalPayload = originalPayloadByReview.get(entry.review_id);
    return {
      actor_id: entry.source_actor_id,
      review_id: entry.review_id,
      decision: "approved" as const,
      decision_notes: [
        ...entry.revision_notes,
        "Resubmitted after revision review and marked approved.",
      ],
      revision_round: entry.revision_round + 1,
      target_type: originalPayload?.target_type ?? "review_pack",
    };
  });
  const resubmissionRound = Math.max(
    ...newBatchDecisionPayloads.map((payload) => payload.revision_round ?? 1),
  );

  return {
    resubmission_result: {
      resubmitted_reviews: newBatchDecisionPayloads.map((payload) => payload.review_id),
      resubmission_round: resubmissionRound,
      new_batch_decision_payloads: newBatchDecisionPayloads,
      resubmission_status: "ready",
    },
    resubmission_summary: [
      `Resubmitted reviews: ${newBatchDecisionPayloads.map((payload) => payload.review_id).join(", ")}.`,
      `Resubmission round: ${resubmissionRound}.`,
      "All resubmitted reviews are marked approved after revision.",
    ],
    next_resubmission_step: "Re-run the batch approval state machine with the resubmitted reviews.",
  };
}
