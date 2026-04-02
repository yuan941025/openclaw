import type {
  RealExecutionBridgeResult,
  RealExecutorReceipt,
  TelegramOutboundBridgeResult,
} from "../agents/agent_types.ts";

type BuildRealExecutorReceiptInput = {
  realExecutionResult: RealExecutionBridgeResult;
  telegramOutboundBridge: TelegramOutboundBridgeResult;
};

export function buildRealExecutorReceipt(
  input: BuildRealExecutorReceiptInput,
): RealExecutorReceipt {
  const executionStatus = input.telegramOutboundBridge.outbound_bridge_result.send_status === "sent"
    ? "sent"
    : input.telegramOutboundBridge.outbound_bridge_result.send_status === "blocked"
      ? "blocked"
      : "failed";
  const sentArtifacts = executionStatus === "sent"
    ? [
      `telegram_message:${input.telegramOutboundBridge.outbound_bridge_result.platform_message_id ?? "sent_without_platform_id"}`,
    ]
    : [];
  const runtimeStageUpdate = executionStatus === "sent" ? "message_sent" : "lead_open";

  return {
    real_receipt: {
      receipt_id: input.realExecutionResult.real_execution_result.receipt_ref,
      review_id: input.realExecutionResult.real_execution_result.review_id,
      channel: input.realExecutionResult.real_execution_result.channel,
      execution_status: executionStatus,
      sent_artifacts: sentArtifacts,
      safety_notes: [...input.telegramOutboundBridge.outbound_bridge_summary],
      runtime_stage_update: runtimeStageUpdate,
    },
    receipt_summary: [
      `Receipt id: ${input.realExecutionResult.real_execution_result.receipt_ref}.`,
      `Execution status: ${executionStatus}.`,
      `Runtime stage update: ${runtimeStageUpdate}.`,
      `Sent artifacts: ${sentArtifacts.join(", ") || "none"}.`,
    ],
  };
}
