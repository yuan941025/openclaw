import type { ApprovalInputSurface } from "../agents/agent_types.ts";

export const SUPPORTED_APPROVAL_DECISIONS = ["approved", "rejected", "revise_required"] as const;
export const SUPPORTED_APPROVAL_TARGETS = ["review_pack", "approval_session"] as const;

export function buildApprovalInputSurface(): ApprovalInputSurface {
  return {
    input_surface: {
      supported_decisions: [...SUPPORTED_APPROVAL_DECISIONS],
      required_fields: ["review_id", "decision"],
      optional_fields: ["decision_notes", "revision_round", "actor_id"],
      supported_targets: [...SUPPORTED_APPROVAL_TARGETS],
    },
    surface_summary: [
      "Required fields: review_id, decision.",
      "Optional fields: decision_notes, revision_round, actor_id.",
      `Supported decisions: ${SUPPORTED_APPROVAL_DECISIONS.join(", ")}.`,
      `Supported targets: ${SUPPORTED_APPROVAL_TARGETS.join(", ")}.`,
    ],
  };
}
