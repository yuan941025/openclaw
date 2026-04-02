import type {
  AgentPlan,
  AgentRole,
  MonetizationLanePreview,
} from "../agents/agent_types.ts";

type BuildMonetizationLanePreviewInput = {
  goal: string;
  agentPlan?: AgentPlan;
};

function getTargetCustomer(goal: string): string {
  const normalizedGoal = goal.toLowerCase();
  if (normalizedGoal.includes("local business")) {
    return "local business";
  }

  if (normalizedGoal.includes("creator")) {
    return "creator";
  }

  return "small business";
}

function getOfferType(goal: string): string {
  const normalizedGoal = goal.toLowerCase();
  if (normalizedGoal.includes("quote")) {
    return "AI quote service";
  }

  if (normalizedGoal.includes("assistant")) {
    return "AI assistant setup";
  }

  return "AI content service";
}

export function buildMonetizationLanePreview(
  input: BuildMonetizationLanePreviewInput,
): MonetizationLanePreview {
  const targetCustomer = getTargetCustomer(input.goal);
  const offerType = getOfferType(input.goal);
  const agentRolesInvolved: AgentRole[] = input.agentPlan?.required_agents.map((agent) => agent.role) ?? [
    "coder",
    "tester",
    "operator",
  ];

  return {
    monetization_lane: {
      lane_id: "ai_service_offer_preparation_lane",
      title: `${offerType} preparation lane`,
      target_customer: targetCustomer,
      offer_type: offerType,
      preparation_steps: [
        "prepare offer brief",
        "prepare quote draft",
        "prepare outreach message",
        "wait for user approval before send",
      ],
      agent_roles_involved: [...new Set(agentRolesInvolved)],
      approval_points: [
        "outgoing message approval",
        "quote approval",
      ],
      blocked_points: [
        "direct payment collection",
        "autonomous outbound send",
      ],
    },
    lane_summary: [
      `Target customer: ${targetCustomer}.`,
      `Offer type: ${offerType}.`,
      `Agent roles involved: ${[...new Set(agentRolesInvolved)].join(", ")}.`,
    ],
    next_revenue_step: offerType === "AI quote service"
      ? "Generate a quote-ready service bundle before outreach."
      : "Prepare operator-facing outbound pack for user approval.",
  };
}
