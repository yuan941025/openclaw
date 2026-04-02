import type {
  AgentRole,
  ReplyFeedbackBridge,
  ReplyIntakeContract,
  RevenueLaneSessionMap,
  TelegramReplyIntake,
} from "../agents/agent_types.ts";
import type {
  AgentTeamExecutionResult,
} from "../agents/agent_team_runner.ts";

type BridgeReplyFeedbackInput = {
  replyIntake?: ReplyIntakeContract;
  telegramReplyIntake?: TelegramReplyIntake;
  teamFlow: AgentTeamExecutionResult;
  laneSessionMap: RevenueLaneSessionMap;
};

function getAgentsByRole(teamFlow: AgentTeamExecutionResult, role: AgentRole): string[] {
  return teamFlow.agent_plan.required_agents
    .filter((agent) => agent.role === role)
    .map((agent) => agent.agent_id);
}

function getReplyType(input: BridgeReplyFeedbackInput): string {
  return input.telegramReplyIntake?.telegram_reply_intake.reply_type ??
    input.replyIntake?.reply_intake_contract.reply_type ??
    "unknown";
}

export function bridgeReplyFeedback(
  input: BridgeReplyFeedbackInput,
): ReplyFeedbackBridge {
  const replyType = getReplyType(input);
  const teamFeedback = {
    retry_agents: [] as string[],
    skip_agents: [] as string[],
    prioritize_agents: [] as string[],
  };
  const revenueSignals: string[] = [];
  const nextOfferAction: string[] = [];
  const capabilityHints: string[] = [];
  const riskFlags: string[] = [];

  if (input.telegramReplyIntake) {
    capabilityHints.push("telegram_outbound_working", "reply_classification_working");
  }

  if (replyType === "interest") {
    teamFeedback.prioritize_agents.push(...getAgentsByRole(input.teamFlow, "operator"));
    revenueSignals.push("lead_interest_detected");
    nextOfferAction.push("prepare_followup_message_pack");
    capabilityHints.push("operator_followup_pack_ready");
  }

  if (replyType === "question") {
    teamFeedback.prioritize_agents.push(
      ...getAgentsByRole(input.teamFlow, "researcher"),
      ...getAgentsByRole(input.teamFlow, "operator"),
    );
    revenueSignals.push("lead_question_detected");
    nextOfferAction.push("prepare_answer_bundle");
    capabilityHints.push("research_response_pack_needed");
  }

  if (replyType === "quote_request") {
    const coderAgents = getAgentsByRole(input.teamFlow, "coder");
    const operatorAgents = getAgentsByRole(input.teamFlow, "operator");
    teamFeedback.prioritize_agents.push(...coderAgents, ...operatorAgents);
    teamFeedback.retry_agents.push(...operatorAgents);
    revenueSignals.push("quote_request_detected");
    nextOfferAction.push("prepare_quote_revision_pack");
    capabilityHints.push(
      "quote_generation_ready",
      "operator_quote_handoff_ready",
      "quote_followup_needed",
    );
    if (coderAgents.length === 0) {
      capabilityHints.push("quote_path_needs_coder_support");
    }
  }

  if (replyType === "rejection") {
    teamFeedback.retry_agents.push(...getAgentsByRole(input.teamFlow, "operator"));
    revenueSignals.push("rejection_detected");
    nextOfferAction.push("review_offer_positioning");
    capabilityHints.push("offer_positioning_needs_refinement");
    riskFlags.push("lead_rejection_detected");
  }

  return {
    reply_feedback_bridge: {
      team_feedback: {
        retry_agents: [...new Set(teamFeedback.retry_agents)],
        skip_agents: [...new Set(teamFeedback.skip_agents)],
        prioritize_agents: [...new Set(teamFeedback.prioritize_agents)],
      },
      monetization_feedback: {
        revenue_signals: [...new Set(revenueSignals)],
        next_offer_action: [...new Set(nextOfferAction)],
      },
      self_build_feedback: {
        capability_hints: [...new Set(capabilityHints)],
        risk_flags: [...new Set(riskFlags)],
      },
      bridge_summary: [
        `Reply type: ${replyType}.`,
        `Prioritized agents: ${[...new Set(teamFeedback.prioritize_agents)].join(", ") || "none"}.`,
        `Revenue signals: ${[...new Set(revenueSignals)].join(", ") || "none"}.`,
        `Linked lane: ${input.laneSessionMap.lane_session_map.lane_id}.`,
      ],
      next_reply_step: replyType === "quote_request"
        ? "Prepare a quote-focused follow-up pack for the next approval cycle."
        : replyType === "interest"
          ? "Prepare a follow-up message pack for controlled review."
          : replyType === "question"
            ? "Prepare a clarification response pack for controlled review."
            : "Review the rejection signal before preparing another controlled outbound pack.",
    },
  };
}
