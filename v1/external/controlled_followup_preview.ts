import { getActionBoundaryRule } from "./action_boundary.ts";
import type {
  ActionBoundaryResult,
  ControlledFollowupPreview,
  ReplyFeedbackBridge,
  ReplyIntakeContract,
} from "../agents/agent_types.ts";

type BuildControlledFollowupPreviewInput = {
  replyFeedbackBridge: ReplyFeedbackBridge;
  actionBoundary: ActionBoundaryResult;
  replyIntake?: ReplyIntakeContract;
};

function getSuggestedActionType(
  bridge: ReplyFeedbackBridge,
): ControlledFollowupPreview["followup_preview"]["suggested_action_type"] {
  const signals = bridge.reply_feedback_bridge.monetization_feedback.revenue_signals;
  if (signals.includes("quote_request_detected")) {
    return "prepare_quote";
  }

  if (signals.includes("rejection_detected")) {
    return "prepare_followup_note";
  }

  return "prepare_message";
}

export function buildControlledFollowupPreview(
  input: BuildControlledFollowupPreviewInput,
): ControlledFollowupPreview {
  const suggestedActionType = getSuggestedActionType(input.replyFeedbackBridge);
  const boundaryRule = getActionBoundaryRule(suggestedActionType, input.actionBoundary);
  const linkedSessionId = input.replyIntake?.reply_intake_contract.linked_session_id ?? "approval_session_1";
  const followupContentPreview = suggestedActionType === "prepare_quote"
    ? [
      "Prepare a quote revision draft that answers the inbound quote request.",
      "Keep the quote in review-only mode until the next approval session.",
    ]
    : suggestedActionType === "prepare_followup_note"
      ? [
        "Prepare an internal follow-up note that records the rejection signal.",
        "Do not schedule a new outbound send until the offer path is reviewed.",
      ]
      : [
        "Prepare a follow-up message draft that responds to the inbound interest signal.",
        "Keep the draft in controlled review mode before any future outbound step.",
      ];

  return {
    followup_preview: {
      followup_id: `followup_preview_${linkedSessionId}`,
      linked_session_id: linkedSessionId,
      suggested_action_type: suggestedActionType,
      followup_content_preview: followupContentPreview,
      approval_required: boundaryRule?.approval_level === "user_required",
    },
    followup_summary: [
      `Suggested follow-up action: ${suggestedActionType}.`,
      `Linked session: ${linkedSessionId}.`,
      `Approval required: ${(boundaryRule?.approval_level === "user_required").toString()}.`,
    ],
    next_followup_step: "Review the follow-up preview and route it into the next approval session.",
  };
}
