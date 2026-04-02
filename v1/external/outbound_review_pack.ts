import type {
  ApprovalGateContract,
  ExecutorContract,
  MonetizationLanePreview,
  OutboundReviewPackResult,
} from "../agents/agent_types.ts";

type BuildOutboundReviewPackInput = {
  monetizationLanePreview: MonetizationLanePreview;
  executorContract: ExecutorContract;
  approvalGate: ApprovalGateContract;
};

function getPrimarySourceAgent(executorContract: ExecutorContract): string {
  return executorContract.executable_agents.find((agent) => agent.role === "operator")?.agent_id
    ?? executorContract.executable_agents[0]?.agent_id
    ?? "operator_preview";
}

function getReviewActionTypes(lane: MonetizationLanePreview["monetization_lane"]): string[] {
  if (lane.offer_type === "AI quote service") {
    return ["send_message", "create_invoice"];
  }

  if (lane.offer_type === "AI content service") {
    return ["send_message", "publish_post"];
  }

  return ["send_message"];
}

function getTargetChannel(actionType: string): string {
  if (actionType === "publish_post") {
    return "social_publish_queue";
  }

  if (actionType === "create_invoice") {
    return "invoice_review_queue";
  }

  return "direct_outreach_queue";
}

function buildContentPreview(
  actionType: string,
  lane: MonetizationLanePreview["monetization_lane"],
): string[] {
  if (actionType === "create_invoice") {
    return [
      `Invoice draft for ${lane.target_customer}.`,
      `Offer type: ${lane.offer_type}.`,
      "Line items derived from the prepared quote draft.",
    ];
  }

  if (actionType === "publish_post") {
    return [
      `Public post draft for ${lane.target_customer}.`,
      `Highlight the ${lane.offer_type} offer with a controlled CTA.`,
      "Keep messaging aligned with the current approval boundary.",
    ];
  }

  return [
    `Outbound message draft for ${lane.target_customer}.`,
    `Introduce the ${lane.offer_type} offer clearly and concisely.`,
    "Request user approval before any live send.",
  ];
}

export function buildOutboundReviewPack(
  input: BuildOutboundReviewPackInput,
): OutboundReviewPackResult {
  const lane = input.monetizationLanePreview.monetization_lane;
  const sourceAgentId = getPrimarySourceAgent(input.executorContract);
  const approvalRequiredActions = new Set(
    input.approvalGate.approval_gate.approval_required_actions.map((action) => action.action_type),
  );
  const reviewPacks = getReviewActionTypes(lane).map((actionType, index) => ({
    review_id: `${sourceAgentId}_${actionType}_review_${index + 1}`,
    action_type: actionType,
    source_agent_id: sourceAgentId,
    target_channel: getTargetChannel(actionType),
    target_audience: lane.target_customer,
    content_preview: buildContentPreview(actionType, lane),
    linked_offer_type: lane.offer_type,
    linked_quote_summary: lane.offer_type === "AI quote service" || actionType === "create_invoice"
      ? [
        `Prepared quote draft for ${lane.target_customer}.`,
        "Quote approval remains required before any commercial commitment.",
      ]
      : undefined,
    safety_notes: [
      `Action ${actionType} is routed through the approval gate.`,
      "Do not treat this review pack as a live outbound execution request.",
      ...lane.blocked_points.map((point) => `Blocked point: ${point}.`),
    ],
    approval_required: approvalRequiredActions.has(actionType),
  }));

  return {
    review_packs: reviewPacks,
    review_summary: [
      `Built ${reviewPacks.length} outbound review pack(s) for ${lane.offer_type}.`,
      `Source agent: ${sourceAgentId}.`,
      `Approval-required actions in scope: ${reviewPacks.filter((pack) => pack.approval_required).map((pack) => pack.action_type).join(", ")}.`,
    ],
    next_review_step: "Review the outbound packs and choose approve, reject, or revise before simulation.",
  };
}
