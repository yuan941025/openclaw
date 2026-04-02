import { defineExternalActionBoundary, getActionBoundaryRule } from "./action_boundary.ts";
import type {
  ActionBoundaryResult,
  AgentExecutionStatus,
  ExternalExecutorReceipt,
} from "../agents/agent_types.ts";

type BuildExecutorReceiptInput = {
  agent_id: string;
  role: ExternalExecutorReceipt["role"];
  action_type: string;
  action_summary: string[];
  produced_artifacts: string[];
  consumed_inputs: string[];
  status?: AgentExecutionStatus;
  actionBoundary?: ActionBoundaryResult;
};

function getBoundaryResult(
  approvalLevel: ActionBoundaryResult["allowed_actions"][number]["approval_level"] | undefined,
): ExternalExecutorReceipt["boundary_result"] {
  if (approvalLevel === "blocked") {
    return "blocked";
  }

  if (approvalLevel === "user_required") {
    return "approval_required";
  }

  return "allowed";
}

export function buildExecutorReceipt(
  input: BuildExecutorReceiptInput,
): ExternalExecutorReceipt {
  const actionBoundary = input.actionBoundary ?? defineExternalActionBoundary();
  const boundaryRule = getActionBoundaryRule(input.action_type, actionBoundary);
  const boundaryResult = getBoundaryResult(boundaryRule?.approval_level);
  const requestedStatus = input.status ?? "completed";
  const status = boundaryResult === "blocked" && requestedStatus === "completed"
    ? "blocked"
    : requestedStatus;

  return {
    agent_id: input.agent_id,
    role: input.role,
    status,
    action_type: input.action_type,
    action_summary: input.action_summary,
    produced_artifacts: input.produced_artifacts,
    consumed_inputs: input.consumed_inputs,
    safety_notes: [
      boundaryResult === "blocked"
        ? `Blocked because ${boundaryRule?.reason ?? "the action is outside the current boundary"}.`
        : boundaryResult === "approval_required"
          ? `User approval required because ${boundaryRule?.reason ?? "the action affects an external surface"}.`
          : `Allowed because ${boundaryRule?.reason ?? "the action stays within the current preparation boundary"}.`,
    ],
    boundary_result: boundaryResult,
  };
}
