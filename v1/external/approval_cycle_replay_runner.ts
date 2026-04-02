import type {
  BatchApprovalCycleReplay,
  BatchApprovalStateMachineResult,
  BatchDecisionIngress,
  BatchRevisionQueue,
} from "../agents/agent_types.ts";

type ReplayBatchApprovalCycleInput = {
  batchDecisionPayloads: BatchDecisionIngress;
  batchStateMachineResult: BatchApprovalStateMachineResult;
  batchRevisionQueue: BatchRevisionQueue;
};

export function replayBatchApprovalCycle(
  input: ReplayBatchApprovalCycleInput,
): BatchApprovalCycleReplay {
  const processedReviews = input.batchDecisionPayloads.batch_decision_payloads.map((payload) => payload.review_id);
  const currentStatus = input.batchStateMachineResult.batch_state_machine_result.current_status;
  const replayStatus = processedReviews.length === 0
    ? "failed"
    : currentStatus === "approved" && input.batchRevisionQueue.revision_queue.length === 0
      ? "completed"
      : currentStatus === "rejected"
        ? "failed"
        : "partial";

  return {
    batch_cycle_replay: {
      replay_id: "batch_approval_cycle_replay_1",
      processed_reviews: processedReviews,
      replay_status: replayStatus,
    },
    replay_cycle_summary: [
      `Processed reviews: ${processedReviews.join(", ") || "none"}.`,
      `Replay status: ${replayStatus}.`,
      `Revision queue size during replay: ${input.batchRevisionQueue.revision_queue.length}.`,
    ],
  };
}
