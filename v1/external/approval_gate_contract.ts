import type {
  ActionBoundaryResult,
  ApprovalGateContract,
  ExecutorContract,
} from "../agents/agent_types.ts";

type BuildApprovalGateContractInput = {
  actionBoundary: ActionBoundaryResult;
  executorContract: ExecutorContract;
};

const REVIEW_FIELDS = [
  "action_type",
  "target_channel",
  "content_preview",
  "safety_notes",
  "source_agent_id",
];

export function buildApprovalGateContract(
  input: BuildApprovalGateContractInput,
): ApprovalGateContract {
  const approvalRequiredActions = input.actionBoundary.allowed_actions
    .filter((action) => action.approval_level === "user_required")
    .map((action) => ({
      action_type: action.action_type,
      required_review_fields: [...REVIEW_FIELDS],
      decision_type: "approve_reject_revise",
    }));
  const autoAllowedActions = input.actionBoundary.allowed_actions
    .filter((action) => action.approval_level === "none")
    .map((action) => action.action_type);
  const blockedActions = input.actionBoundary.blocked_actions
    .map((action) => action.action_type);
  const approvalReadyAgents = input.executorContract.executable_agents
    .filter((agent) => agent.allowed_execution_mode === "approval_required")
    .map((agent) => agent.agent_id);

  return {
    approval_gate: {
      approval_required_actions: approvalRequiredActions,
      auto_allowed_actions: autoAllowedActions,
      blocked_actions: blockedActions,
    },
    gate_summary: [
      `Approval-required actions: ${approvalRequiredActions.map((action) => action.action_type).join(", ")}.`,
      `Auto-allowed preparation actions: ${autoAllowedActions.join(", ")}.`,
      `Blocked actions: ${blockedActions.join(", ")}.`,
      approvalReadyAgents.length > 0
        ? `Approval-ready agents: ${approvalReadyAgents.join(", ")}.`
        : "No agent is currently marked as approval-ready for outbound review.",
    ],
  };
}
