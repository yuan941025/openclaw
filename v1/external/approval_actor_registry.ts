import type { ApprovalActorRegistry } from "../agents/agent_types.ts";

export function buildApprovalActorRegistry(): ApprovalActorRegistry {
  return {
    actor_registry: [
      {
        actor_id: "reviewer_1",
        actor_role: "reviewer",
        supported_actions: [
          "approve message drafts",
          "reject message drafts",
          "revise message drafts",
          "revise post drafts",
        ],
        authority_level: "standard",
      },
      {
        actor_id: "senior_reviewer_1",
        actor_role: "senior_reviewer",
        supported_actions: [
          "handle escalated revise cases",
          "handle escalated reject cases",
          "review high-risk outbound packs",
        ],
        authority_level: "elevated",
      },
      {
        actor_id: "approver_1",
        actor_role: "approver",
        supported_actions: [
          "final approval for outbound-ready packs",
          "final review for invoice-like packs",
          "approve execution-ready sessions",
        ],
        authority_level: "final",
      },
      {
        actor_id: "operator_reviewer_1",
        actor_role: "operator_reviewer",
        supported_actions: [
          "approve operator-originated message drafts",
          "approve operator-originated post drafts",
          "revise operator handoff content before outbound execution",
        ],
        authority_level: "standard",
      },
    ],
    registry_summary: [
      "reviewer_1 handles standard message and post draft decisions.",
      "senior_reviewer_1 handles escalated revise/reject cases with elevated authority.",
      "approver_1 owns final approval authority for outbound-ready and finance-like packs.",
      "operator_reviewer_1 reviews operator-originated outbound packs before real execution prep.",
    ],
  };
}
