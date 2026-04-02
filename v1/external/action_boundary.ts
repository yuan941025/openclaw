import type { ActionBoundaryResult } from "../agents/agent_types.ts";

const ALLOWED_ACTIONS: ActionBoundaryResult["allowed_actions"] = [
  {
    action_type: "generate_content",
    approval_level: "none",
    reason: "Content generation stays in preparation mode and does not contact external systems.",
  },
  {
    action_type: "prepare_message",
    approval_level: "none",
    reason: "Message drafting is internal preparation and does not send anything externally.",
  },
  {
    action_type: "prepare_quote",
    approval_level: "none",
    reason: "Quote drafting is internal preparation and does not create a live commercial commitment.",
  },
  {
    action_type: "send_message",
    approval_level: "user_required",
    reason: "Outbound messaging requires explicit user approval before delivery.",
  },
  {
    action_type: "publish_post",
    approval_level: "user_required",
    reason: "Publishing public content requires explicit user approval.",
  },
  {
    action_type: "create_invoice",
    approval_level: "user_required",
    reason: "Invoice creation affects a real customer workflow and needs user approval.",
  },
  {
    action_type: "collect_payment",
    approval_level: "blocked",
    reason: "Autonomous payment collection is outside the current safety boundary.",
  },
  {
    action_type: "modify_account",
    approval_level: "blocked",
    reason: "Autonomous account changes are blocked until a stricter control layer exists.",
  },
];

export function defineExternalActionBoundary(): ActionBoundaryResult {
  return {
    allowed_actions: ALLOWED_ACTIONS.map((action) => ({ ...action })),
    blocked_actions: ALLOWED_ACTIONS
      .filter((action) => action.approval_level === "blocked")
      .map((action) => ({
        action_type: action.action_type,
        reason: action.reason,
      })),
    boundary_notes: [
      "The current external layer may prepare content, messages, and quotes, but it may not send them autonomously.",
      "Outbound messages, public posts, and invoices require explicit user approval before execution.",
      "Payment collection and account modification remain fully blocked in this version.",
    ],
  };
}

export function getActionBoundaryRule(
  actionType: string,
  boundary: ActionBoundaryResult = defineExternalActionBoundary(),
): ActionBoundaryResult["allowed_actions"][number] | undefined {
  return boundary.allowed_actions.find((action) => action.action_type === actionType);
}
