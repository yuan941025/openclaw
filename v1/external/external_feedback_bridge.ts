import type {
  ExternalExecutorReceipt,
  ExternalFeedbackBridge,
  OutboundReceipt,
  TeamExecutionReceipt,
} from "../agents/agent_types.ts";

type MinimalSelfBuildPreview = {
  goal?: string;
  build_spec?: {
    execution_steps?: string[];
  };
};

type BridgeExternalFeedbackInput = {
  executorReceipt?: ExternalExecutorReceipt;
  outboundReceipt?: OutboundReceipt;
  teamReceipt?: TeamExecutionReceipt;
  selfBuildResult?: MinimalSelfBuildPreview;
};

function buildCapabilityHints(
  executorReceipt?: ExternalExecutorReceipt,
  outboundReceipt?: OutboundReceipt,
): string[] {
  const hints: string[] = [];

  if (executorReceipt?.action_type === "prepare_quote" && executorReceipt.status === "completed") {
    hints.push("quote_generation_ready");
  }

  if (executorReceipt?.role === "operator" && executorReceipt.boundary_result !== "allowed") {
    hints.push("operator_action_pack_needs_refinement");
  }

  if (executorReceipt?.action_type === "prepare_message" && executorReceipt.status === "completed") {
    hints.push("outreach_message_pack_ready");
  }

  if (outboundReceipt?.action_receipts.some((receipt) =>
    receipt.action_type === "send_message" && receipt.execution_status === "executed"
  )) {
    hints.push("controlled_outbound_ready");
  }

  if (outboundReceipt?.action_receipts.some((receipt) =>
    receipt.action_type === "create_invoice" && receipt.execution_status === "executed"
  )) {
    hints.push("invoice_preparation_ready");
  }

  if (outboundReceipt?.action_receipts.some((receipt) => receipt.execution_status !== "executed")) {
    hints.push("operator_review_pack_needs_revision");
  }

  return hints;
}

export function bridgeExternalFeedback(
  input: BridgeExternalFeedbackInput,
): ExternalFeedbackBridge {
  const mappedTeamFeedback = {
    retry_agents: [] as string[],
    skip_agents: [] as string[],
    prioritize_agents: [] as string[],
  };
  const riskFlags: string[] = [];
  const receiptStatus = input.outboundReceipt?.outbound_status ?? input.executorReceipt?.status ?? "blocked";

  if (input.outboundReceipt) {
    for (const receipt of input.outboundReceipt.action_receipts) {
      if (receipt.execution_status === "executed") {
        mappedTeamFeedback.skip_agents.push(receipt.source_agent_id);
        continue;
      }

      mappedTeamFeedback.retry_agents.push(receipt.source_agent_id);
      mappedTeamFeedback.prioritize_agents.push(receipt.source_agent_id);
      riskFlags.push(
        receipt.execution_status === "blocked"
          ? "outbound_boundary_blocked"
          : "approval_revision_required",
      );
    }
  }

  const receipt = input.executorReceipt;

  if (receipt && receipt.status === "completed" && receipt.boundary_result === "allowed") {
    mappedTeamFeedback.skip_agents.push(receipt.agent_id);
  }

  if (receipt?.boundary_result === "approval_required") {
    riskFlags.push("approval_gate_required");
  }

  if (
    receipt
    && (receipt.status === "failed" || receipt.status === "blocked" || receipt.boundary_result === "blocked")
  ) {
    mappedTeamFeedback.retry_agents.push(receipt.agent_id);
    if (receipt.role === "operator") {
      mappedTeamFeedback.prioritize_agents.push(receipt.agent_id);
    }
    riskFlags.push("external_action_blocked");
  }

  return {
    receipt_status: receiptStatus,
    mapped_team_feedback: {
      retry_agents: [...new Set(mappedTeamFeedback.retry_agents)],
      skip_agents: [...new Set(mappedTeamFeedback.skip_agents)],
      prioritize_agents: [...new Set(mappedTeamFeedback.prioritize_agents)],
    },
    mapped_self_build_feedback: {
      capability_hints: buildCapabilityHints(receipt, input.outboundReceipt),
      risk_flags: [...new Set(riskFlags)],
    },
    bridge_summary: [
      input.outboundReceipt
        ? `Outbound receipt status: ${input.outboundReceipt.outbound_status}.`
        : `External receipt status: ${receipt?.status ?? "unknown"} (${receipt?.boundary_result ?? "unknown"}).`,
      ...(input.teamReceipt
        ? [`Current team status: ${input.teamReceipt.team_status}.`]
        : []),
      ...(input.selfBuildResult?.goal
        ? [`Self-build preview goal: ${input.selfBuildResult.goal}.`]
        : []),
    ],
    next_bridge_step: input.outboundReceipt?.action_receipts.some((action) => action.execution_status === "blocked")
      ? "Repair outbound boundary issues before the next controlled send cycle."
      : input.outboundReceipt?.action_receipts.some((action) =>
          action.execution_status === "rejected" || action.execution_status === "revision_requested"
        )
        ? "Revise the outbound review pack and request approval again."
        : input.outboundReceipt?.outbound_status === "completed"
          ? "Controlled outbound simulation completed. Review the outbound receipt before any real send."
        : receipt?.boundary_result === "approval_required"
          ? "Refine operator bundle before requesting user approval."
          : receipt?.status === "failed" || receipt?.status === "blocked" || receipt?.boundary_result === "blocked"
            ? "Retry external preparation path after boundary adjustment."
            : "Keep the external preparation path ready for the next controlled execution step.",
  };
}
