import { fileURLToPath } from "node:url";
import { runAgentTeamFlow } from "../agents/agent_team_runner.ts";
import { buildExecutorContract } from "./executor_contract.ts";
import { defineExternalActionBoundary } from "./action_boundary.ts";
import { buildExecutorReceipt } from "./executor_receipt.ts";
import { bridgeExternalFeedback } from "./external_feedback_bridge.ts";
import { buildMonetizationLanePreview } from "./monetization_lane_preview.ts";
import { buildApprovalGateContract } from "./approval_gate_contract.ts";
import { buildOutboundReviewPack } from "./outbound_review_pack.ts";
import {
  buildApprovalDecisionContract,
  buildApprovalDecisionOverride,
} from "./approval_decision_contract.ts";
import { simulateControlledOutbound } from "./controlled_outbound_simulator.ts";
import { buildOutboundReceipt } from "./outbound_receipt.ts";
import { buildApprovalReviewSession } from "./approval_review_session.ts";
import { replayApprovalDecisions } from "./decision_replay_layer.ts";
import { buildSessionReceipt } from "./session_receipt.ts";
import { buildOutboundSafetyLedger } from "./outbound_safety_ledger.ts";
import { buildApprovalOutboundBridge } from "./approval_outbound_bridge.ts";
import { mapRevenueLaneSession } from "./revenue_lane_session_mapper.ts";
import { buildConversionStagePreview } from "./conversion_stage_preview.ts";
import { buildReplyIntakeContract } from "./reply_intake_contract.ts";
import { bridgeReplyFeedback } from "./reply_feedback_bridge.ts";
import { buildControlledFollowupPreview } from "./controlled_followup_preview.ts";
import { buildRevenueLoopPreview } from "./revenue_loop_preview.ts";
import { runApprovalRevision } from "./approval_revision_runner.ts";
import type {
  AgentTeamExecutionResult,
} from "../agents/agent_team_runner.ts";

type ExternalExecutionResult = {
  goal_summary: string;
  team_flow: AgentTeamExecutionResult;
  executor_contract: ReturnType<typeof buildExecutorContract>;
  action_boundary: ReturnType<typeof defineExternalActionBoundary>;
  executor_receipt: ReturnType<typeof buildExecutorReceipt>;
  approval_gate_contract: ReturnType<typeof buildApprovalGateContract>;
  outbound_review_pack: ReturnType<typeof buildOutboundReviewPack>;
  approval_decision_contract: ReturnType<typeof buildApprovalDecisionContract>;
  controlled_outbound_simulation: ReturnType<typeof simulateControlledOutbound>;
  outbound_receipt: ReturnType<typeof buildOutboundReceipt>;
  external_feedback_bridge: ReturnType<typeof bridgeExternalFeedback>;
  monetization_lane_preview: ReturnType<typeof buildMonetizationLanePreview>;
  approval_review_session: ReturnType<typeof buildApprovalReviewSession>;
  decision_replay: ReturnType<typeof replayApprovalDecisions>;
  session_receipt: ReturnType<typeof buildSessionReceipt>;
  approval_decision_override: ReturnType<typeof buildApprovalDecisionOverride>;
  approval_revision_result: ReturnType<typeof runApprovalRevision>;
  outbound_safety_ledger: ReturnType<typeof buildOutboundSafetyLedger>;
  approval_outbound_bridge: ReturnType<typeof buildApprovalOutboundBridge>;
  lane_session_map: ReturnType<typeof mapRevenueLaneSession>;
  conversion_stage_preview: ReturnType<typeof buildConversionStagePreview>;
  reply_intake_contract: ReturnType<typeof buildReplyIntakeContract>;
  reply_feedback_bridge: ReturnType<typeof bridgeReplyFeedback>;
  controlled_followup_preview: ReturnType<typeof buildControlledFollowupPreview>;
  revenue_loop_preview: ReturnType<typeof buildRevenueLoopPreview>;
  next_step: string;
};

const DEFAULT_GOAL =
  "prepare an AI service offer lane for a small business using the lobster team";

function parseGoal(argv: string[]): string {
  return argv.join(" ").trim() || DEFAULT_GOAL;
}

function deriveTeamFlowGoal(goal: string): string {
  const normalizedGoal = goal.toLowerCase();
  if (
    normalizedGoal.includes("execution")
    || normalizedGoal.includes("external")
    || normalizedGoal.includes("trigger")
    || normalizedGoal.includes("run")
  ) {
    return goal;
  }

  return `${goal} with controlled execution handoff`;
}

function chooseActionType(goal: string): string {
  const normalizedGoal = goal.toLowerCase();
  if (normalizedGoal.includes("quote")) {
    return "prepare_quote";
  }

  if (normalizedGoal.includes("content")) {
    return "generate_content";
  }

  return "prepare_message";
}

function getPrimaryExecutableAgent(
  executorContract: ExternalExecutionResult["executor_contract"],
) {
  return executorContract.executable_agents.find((agent) => agent.role === "operator")
    ?? executorContract.executable_agents.at(-1);
}

function buildNextStep(
  approvalRevisionResult: ExternalExecutionResult["approval_revision_result"],
  revenueLoopPreview: ExternalExecutionResult["revenue_loop_preview"],
): string {
  if (approvalRevisionResult.still_rejected_reviews.length > 0) {
    return "Keep rejected reviews in safe mode and continue with approved alternatives.";
  }

  if (approvalRevisionResult.approved_after_revision.length > 0) {
    return "Approval revision cycle succeeded. Prepare the next controlled outbound step.";
  }

  if (revenueLoopPreview.revenue_loop_preview.current_cycle_status === "followup_ready") {
    return "Request approval for the next follow-up pack.";
  }

  if (revenueLoopPreview.revenue_loop_preview.current_cycle_status === "awaiting_reply") {
    return "Wait for reply intake before preparing the next controlled action.";
  }

  if (revenueLoopPreview.revenue_loop_preview.current_cycle_status === "awaiting_approval") {
    return "Review and approve the next outbound session before continuing.";
  }

  return "Refine the approval cycle and revenue lane mapping.";
}

export function runExternalFlow(goal: string): ExternalExecutionResult {
  const teamFlow = runAgentTeamFlow(deriveTeamFlowGoal(goal));
  const executorContract = buildExecutorContract({
    executionBundles: teamFlow.execution_bundles,
    teamPlan: teamFlow.team_plan,
  });
  const actionBoundary = defineExternalActionBoundary();
  const monetizationLanePreview = buildMonetizationLanePreview({
    goal,
    agentPlan: teamFlow.agent_plan,
  });
  const primaryAgent = getPrimaryExecutableAgent(executorContract);
  const actionType = chooseActionType(goal);
  const executorReceipt = buildExecutorReceipt({
    agent_id: primaryAgent?.agent_id ?? "operator_preview",
    role: primaryAgent?.role ?? "operator",
    action_type: actionType,
    action_summary: [
      `Prepared ${actionType} package for ${monetizationLanePreview.monetization_lane.target_customer}.`,
      `Offer type: ${monetizationLanePreview.monetization_lane.offer_type}.`,
    ],
    produced_artifacts: [
      `${actionType}_draft`,
      ...monetizationLanePreview.monetization_lane.preparation_steps,
    ],
    consumed_inputs: [
      "team_execution_bundles",
      "action_boundary_rules",
      "monetization_lane_preview",
    ],
    actionBoundary,
  });
  const approvalGateContract = buildApprovalGateContract({
    actionBoundary,
    executorContract,
  });
  const outboundReviewPack = buildOutboundReviewPack({
    monetizationLanePreview,
    executorContract,
    approvalGate: approvalGateContract,
  });
  const approvalDecisionContract = buildApprovalDecisionContract({
    outboundReviewPack,
  });
  const controlledOutboundSimulation = simulateControlledOutbound({
    outboundReviewPack,
    approvalDecisionContract,
    actionBoundary,
  });
  const outboundReceipt = buildOutboundReceipt({
    controlledOutboundSimulation,
    actionBoundary,
  });
  const externalFeedbackBridge = bridgeExternalFeedback({
    executorReceipt,
    outboundReceipt,
    teamReceipt: teamFlow.team_receipt,
    selfBuildResult: {
      goal: teamFlow.team_loop_bridge.self_build_goal,
      build_spec: {
        execution_steps: teamFlow.execution_bundles.bundles.flatMap((bundle) =>
          bundle.assigned_tasks.map((task) => `${bundle.agent_id}:${task.task_id}`)
        ),
      },
    },
  });
  const approvalReviewSession = buildApprovalReviewSession({
    outboundReviewPack,
    goal_summary: goal,
  });
  const approvalDecisionOverride = buildApprovalDecisionOverride({
    outboundReviewPack,
  });
  const decisionReplay = replayApprovalDecisions({
    approvalReviewSession,
    approvalDecisionContract,
    approvalDecisionOverride,
  });
  const approvalRevisionResult = runApprovalRevision({
    approvalReviewSession,
    decisionReplay,
  });
  const sessionReceipt = buildSessionReceipt({
    decisionReplay,
    controlledOutboundSimulation,
  });
  const outboundSafetyLedger = buildOutboundSafetyLedger({
    approvalReviewSession,
    decisionReplay,
    controlledOutboundSimulation,
    actionBoundary,
  });
  const approvalOutboundBridge = buildApprovalOutboundBridge({
    sessionReceipt,
    controlledOutboundSimulation,
  });
  const laneSessionMap = mapRevenueLaneSession({
    monetizationLanePreview,
    approvalReviewSession,
  });
  const conversionStagePreview = buildConversionStagePreview({
    sessionReceipt,
    laneSessionMap,
    approvalOutboundBridge,
    outboundReceipt,
  });
  const replyIntakeContract = buildReplyIntakeContract({
    laneSessionMap,
  });
  const replyFeedbackBridge = bridgeReplyFeedback({
    replyIntake: replyIntakeContract,
    teamFlow,
    laneSessionMap,
  });
  const controlledFollowupPreview = buildControlledFollowupPreview({
    replyFeedbackBridge,
    actionBoundary,
    replyIntake: replyIntakeContract,
  });
  const revenueLoopPreview = buildRevenueLoopPreview({
    laneSessionMap,
    conversionStagePreview,
    replyFeedbackBridge,
    followupPreview: controlledFollowupPreview,
  });

  return {
    goal_summary: goal,
    team_flow: teamFlow,
    executor_contract: executorContract,
    action_boundary: actionBoundary,
    executor_receipt: executorReceipt,
    approval_gate_contract: approvalGateContract,
    outbound_review_pack: outboundReviewPack,
    approval_decision_contract: approvalDecisionContract,
    controlled_outbound_simulation: controlledOutboundSimulation,
    outbound_receipt: outboundReceipt,
    external_feedback_bridge: externalFeedbackBridge,
    monetization_lane_preview: monetizationLanePreview,
    approval_review_session: approvalReviewSession,
    decision_replay: decisionReplay,
    session_receipt: sessionReceipt,
    approval_decision_override: approvalDecisionOverride,
    approval_revision_result: approvalRevisionResult,
    outbound_safety_ledger: outboundSafetyLedger,
    approval_outbound_bridge: approvalOutboundBridge,
    lane_session_map: laneSessionMap,
    conversion_stage_preview: conversionStagePreview,
    reply_intake_contract: replyIntakeContract,
    reply_feedback_bridge: replyFeedbackBridge,
    controlled_followup_preview: controlledFollowupPreview,
    revenue_loop_preview: revenueLoopPreview,
    next_step: buildNextStep(approvalRevisionResult, revenueLoopPreview),
  };
}

async function main() {
  const goal = parseGoal(process.argv.slice(2));
  const result = runExternalFlow(goal);

  console.log("=== TEAM FLOW PREVIEW ===");
  console.log(JSON.stringify(result.team_flow, null, 2));
  console.log("");
  console.log("=== EXECUTOR CONTRACT ===");
  console.log(JSON.stringify(result.executor_contract, null, 2));
  console.log("");
  console.log("=== ACTION BOUNDARY ===");
  console.log(JSON.stringify(result.action_boundary, null, 2));
  console.log("");
  console.log("=== EXECUTOR RECEIPT ===");
  console.log(JSON.stringify(result.executor_receipt, null, 2));
  console.log("");
  console.log("=== APPROVAL GATE CONTRACT ===");
  console.log(JSON.stringify(result.approval_gate_contract, null, 2));
  console.log("");
  console.log("=== OUTBOUND REVIEW PACK ===");
  console.log(JSON.stringify(result.outbound_review_pack, null, 2));
  console.log("");
  console.log("=== APPROVAL DECISION CONTRACT ===");
  console.log(JSON.stringify(result.approval_decision_contract, null, 2));
  console.log("");
  console.log("=== CONTROLLED OUTBOUND SIMULATION ===");
  console.log(JSON.stringify(result.controlled_outbound_simulation, null, 2));
  console.log("");
  console.log("=== OUTBOUND RECEIPT ===");
  console.log(JSON.stringify(result.outbound_receipt, null, 2));
  console.log("");
  console.log("=== EXTERNAL FEEDBACK BRIDGE ===");
  console.log(JSON.stringify(result.external_feedback_bridge, null, 2));
  console.log("");
  console.log("=== MONETIZATION LANE PREVIEW ===");
  console.log(JSON.stringify(result.monetization_lane_preview, null, 2));
  console.log("");
  console.log("=== APPROVAL REVIEW SESSION ===");
  console.log(JSON.stringify(result.approval_review_session, null, 2));
  console.log("");
  console.log("=== DECISION REPLAY ===");
  console.log(JSON.stringify(result.decision_replay, null, 2));
  console.log("");
  console.log("=== APPROVAL DECISION OVERRIDE ===");
  console.log(JSON.stringify(result.approval_decision_override, null, 2));
  console.log("");
  console.log("=== APPROVAL REVISION RUNNER ===");
  console.log(JSON.stringify(result.approval_revision_result, null, 2));
  console.log("");
  console.log("=== SESSION RECEIPT ===");
  console.log(JSON.stringify(result.session_receipt, null, 2));
  console.log("");
  console.log("=== OUTBOUND SAFETY LEDGER ===");
  console.log(JSON.stringify(result.outbound_safety_ledger, null, 2));
  console.log("");
  console.log("=== APPROVAL OUTBOUND BRIDGE ===");
  console.log(JSON.stringify(result.approval_outbound_bridge, null, 2));
  console.log("");
  console.log("=== REVENUE LANE SESSION MAP ===");
  console.log(JSON.stringify(result.lane_session_map, null, 2));
  console.log("");
  console.log("=== CONVERSION STAGE PREVIEW ===");
  console.log(JSON.stringify(result.conversion_stage_preview, null, 2));
  console.log("");
  console.log("=== REPLY INTAKE CONTRACT ===");
  console.log(JSON.stringify(result.reply_intake_contract, null, 2));
  console.log("");
  console.log("=== REPLY FEEDBACK BRIDGE ===");
  console.log(JSON.stringify(result.reply_feedback_bridge, null, 2));
  console.log("");
  console.log("=== CONTROLLED FOLLOW-UP PREVIEW ===");
  console.log(JSON.stringify(result.controlled_followup_preview, null, 2));
  console.log("");
  console.log("=== REVENUE LOOP PREVIEW ===");
  console.log(JSON.stringify(result.revenue_loop_preview, null, 2));
  console.log("");
  console.log("=== HUMAN APPROVAL PREVIEW ===");
  console.log(JSON.stringify({
    session_id: result.approval_review_session.review_session.session_id,
    review_ids: result.approval_review_session.review_session.review_ids,
    current_review_only_status: result.approval_review_session.review_session.session_status,
  }, null, 2));
  console.log("");
  console.log("=== APPROVAL CYCLE PATCH RESULT ===");
  console.log(JSON.stringify({
    approval_decision_override: result.approval_decision_override,
    approval_revision_result: result.approval_revision_result,
    next_step: result.next_step,
  }, null, 2));
  console.log("");
  console.log("=== APPROVAL CYCLE RESULT ===");
  console.log(JSON.stringify(result, null, 2));
  console.log("");
  console.log("=== EXTERNAL EXECUTION RESULT ===");
  console.log(JSON.stringify(result, null, 2));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  void main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
