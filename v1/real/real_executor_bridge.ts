import { sendTelegramMessage, type TelegramTransport } from "./telegram_outbound_bridge.ts";
import type {
  OutboundReviewPackResult,
  RealExecutionBridgeResult,
  RuntimeGuardrails,
  KillSwitchState,
  TelegramOutboundBridgeResult,
} from "../agents/agent_types.ts";
import { runActorSessionHistory } from "../external/actor_session_history_runner.ts";

type RunRealExecutorBridgeInput = {
  actorSessionHistory: ReturnType<typeof runActorSessionHistory>;
  runtimeGuardrails: RuntimeGuardrails;
  killSwitch: KillSwitchState;
  targetId: string;
  botToken?: string;
  transport?: TelegramTransport;
  runtimeOutboundCount?: number;
};

type RealExecutorBridgeOutput = RealExecutionBridgeResult & {
  outbound_bridge_result: TelegramOutboundBridgeResult;
  selected_review_pack?: OutboundReviewPackResult["review_packs"][number];
};

function getReviewMessage(reviewPack: OutboundReviewPackResult["review_packs"][number]): string {
  return reviewPack.content_preview.join("\n");
}

export async function runRealExecutorBridge(
  input: RunRealExecutorBridgeInput,
): Promise<RealExecutorBridgeOutput> {
  const readyReviews = new Set(
    input.actorSessionHistory.execution_handoff_closure.execution_handoff_closure.handoff_ready_reviews,
  );
  const reviewPacks = input.actorSessionHistory.orchestration_result.external_flow.outbound_review_pack
    .review_packs;
  const selectedReview = reviewPacks.find((review) =>
    readyReviews.has(review.review_id) && review.action_type === "send_message"
  );

  if (!selectedReview) {
    const blockedReviewId = input.actorSessionHistory.execution_handoff_closure.execution_handoff_closure
      .handoff_blocked_reviews[0] ?? "no_closed_ready_send_message_review";
    return {
      real_execution_result: {
        review_id: blockedReviewId,
        channel: "telegram",
        execution_mode: "real",
        status: "blocked",
        receipt_ref: `real_receipt_${blockedReviewId}`,
      },
      execution_summary: [
        "No closed_ready send_message review was available for the first real executor bridge.",
      ],
      outbound_bridge_result: {
        outbound_bridge_result: {
          channel: "telegram",
          target_id: input.targetId,
          message_text: "",
          send_status: "blocked",
        },
        outbound_bridge_summary: [
          "Real execution stopped because the session had no closed_ready send_message review.",
        ],
      },
    };
  }

  if (input.runtimeOutboundCount !== undefined &&
    input.runtimeOutboundCount >= input.runtimeGuardrails.guardrails.max_outbound_per_run) {
    return {
      real_execution_result: {
        review_id: selectedReview.review_id,
        channel: "telegram",
        execution_mode: "real",
        status: "blocked",
        receipt_ref: `real_receipt_${selectedReview.review_id}`,
      },
      execution_summary: [
        `Outbound count ${input.runtimeOutboundCount} already reached the max_outbound_per_run guardrail.`,
      ],
      outbound_bridge_result: {
        outbound_bridge_result: {
          channel: "telegram",
          target_id: input.targetId,
          message_text: getReviewMessage(selectedReview),
          send_status: "blocked",
        },
        outbound_bridge_summary: [
          "Real execution stopped because the runtime outbound limit was reached.",
        ],
      },
      selected_review_pack: selectedReview,
    };
  }

  const outboundBridgeResult = await sendTelegramMessage({
    reviewId: selectedReview.review_id,
    targetId: input.targetId,
    messageText: getReviewMessage(selectedReview),
    actionType: selectedReview.action_type,
    runtimeGuardrails: input.runtimeGuardrails,
    killSwitch: input.killSwitch,
    approvalGateContract: input.actorSessionHistory.orchestration_result.external_flow.approval_gate_contract,
    actionBoundary: input.actorSessionHistory.orchestration_result.external_flow.action_boundary,
    reviewApproved: input.actorSessionHistory.pre_execution_closure_report.closure_report.final_ready_reviews
      .includes(selectedReview.review_id),
    reviewReady: readyReviews.has(selectedReview.review_id),
    botToken: input.botToken,
    transport: input.transport,
  });

  const status = outboundBridgeResult.outbound_bridge_result.send_status === "sent"
    ? "executed"
    : outboundBridgeResult.outbound_bridge_result.send_status === "blocked"
      ? "blocked"
      : "failed";

  return {
    real_execution_result: {
      review_id: selectedReview.review_id,
      channel: "telegram",
      execution_mode: "real",
      status,
      receipt_ref: `real_receipt_${selectedReview.review_id}`,
    },
    execution_summary: [
      `Selected review: ${selectedReview.review_id}.`,
      "Channel: telegram.",
      `Execution status: ${status}.`,
      ...outboundBridgeResult.outbound_bridge_summary,
    ],
    outbound_bridge_result: outboundBridgeResult,
    selected_review_pack: selectedReview,
  };
}
