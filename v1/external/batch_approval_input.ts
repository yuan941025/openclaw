import type { BatchApprovalInputSurface } from "../agents/agent_types.ts";
import { SUPPORTED_APPROVAL_DECISIONS } from "./approval_input_surface.ts";

export function buildBatchApprovalInputSurface(): BatchApprovalInputSurface {
  return {
    batch_input_surface: {
      supported_batch_size: 10,
      supported_decisions: [...SUPPORTED_APPROVAL_DECISIONS],
      batch_required_fields: ["review_ids", "decisions"],
      batch_optional_fields: ["decision_notes", "revision_round", "actor_id"],
    },
    batch_surface_summary: [
      "Supported batch size: 10 reviews per approval batch.",
      "review_ids and decisions are parallel arrays and must align by index.",
      "Each decision still requires review_id and decision; revise_required entries also need decision_notes.",
    ],
  };
}
