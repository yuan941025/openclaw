import type {
  ApprovalQueuePartition,
  QueuePartitionReplay,
} from "../agents/agent_types.ts";

type ReplayQueuePartitionsInput = {
  approvalQueuePartition: ApprovalQueuePartition;
};

export function replayQueuePartitions(
  input: ReplayQueuePartitionsInput,
): QueuePartitionReplay {
  const queueReplay = input.approvalQueuePartition.queue_partitions.map((entry) => ({
    actor_id: entry.actor_id,
    replayed_pending: [...entry.pending_reviews],
    replayed_escalated: [...entry.escalated_reviews],
    replayed_final: [...entry.final_reviews],
  }));

  return {
    queue_replay: queueReplay,
    queue_replay_summary: queueReplay.map((entry) =>
      `${entry.actor_id} replayed pending=${entry.replayed_pending.join(", ") || "none"}, escalated=${entry.replayed_escalated.join(", ") || "none"}, final=${entry.replayed_final.join(", ") || "none"}.`
    ),
    next_queue_replay_step: "Confirm replayed queue ownership before final pre-execution closure checks.",
  };
}
