import { fileURLToPath } from "node:url";
import type { BatchDecisionIngress } from "../agents/agent_types.ts";
import { runExternalFlow } from "./external_runner.ts";
import {
  buildBatchApprovalInputSurface,
} from "./batch_approval_input.ts";
import {
  ingestBatchHumanDecisions,
  type RawBatchHumanDecisionInput,
} from "./batch_decision_ingress.ts";
import { ingestBatchSessionDecisions } from "./batch_session_ingest.ts";
import { runBatchApprovalStateMachine } from "./batch_approval_state_machine.ts";
import { buildBatchRevisionQueue } from "./batch_revision_queue.ts";
import { buildBatchDecisionAuditTrail } from "./batch_audit_trail.ts";
import { previewBatchDecisionOutcome } from "./batch_outcome_preview.ts";
import { replayBatchApprovalCycle } from "./approval_cycle_replay_runner.ts";
import { bridgeFollowupDecisions } from "./followup_decision_bridge.ts";
import { buildBatchRevisionResubmission } from "./batch_revision_resubmission.ts";

type BatchHumanApprovalCycleResult = {
  goal_summary: string;
  external_flow: ReturnType<typeof runExternalFlow>;
  batch_approval_input_surface: ReturnType<typeof buildBatchApprovalInputSurface>;
  batch_decision_payloads: ReturnType<typeof ingestBatchHumanDecisions>;
  batch_session_ingest_result: ReturnType<typeof ingestBatchSessionDecisions>;
  batch_state_machine_result: ReturnType<typeof runBatchApprovalStateMachine>;
  batch_revision_queue: ReturnType<typeof buildBatchRevisionQueue>;
  batch_audit_trail: ReturnType<typeof buildBatchDecisionAuditTrail>;
  batch_outcome_preview: ReturnType<typeof previewBatchDecisionOutcome>;
  batch_cycle_replay: ReturnType<typeof replayBatchApprovalCycle>;
  followup_decision_bridge: ReturnType<typeof bridgeFollowupDecisions>;
  batch_revision_resubmission?: ReturnType<typeof buildBatchRevisionResubmission>;
  resubmission_state_machine_result?: ReturnType<typeof runBatchApprovalStateMachine>;
  resubmission_outcome_preview?: ReturnType<typeof previewBatchDecisionOutcome>;
  next_step: string;
};

const DEFAULT_GOAL =
  "prepare an AI service offer lane for a small business using the lobster team";

function parseGoal(argv: string[]): string {
  return argv.join(" ").trim() || DEFAULT_GOAL;
}

function buildStaticBatchDecisionInput(
  externalFlow: ReturnType<typeof runExternalFlow>,
): RawBatchHumanDecisionInput {
  const sendMessageReview = externalFlow.outbound_review_pack.review_packs.find((review) =>
    review.action_type === "send_message"
  );
  const publishPostReview = externalFlow.outbound_review_pack.review_packs.find((review) =>
    review.action_type === "publish_post"
  );
  const createInvoiceReview = externalFlow.outbound_review_pack.review_packs.find((review) =>
    review.action_type === "create_invoice"
  );

  if (createInvoiceReview && sendMessageReview) {
    return {
      actor_id: "human_reviewer_1",
      review_ids: [sendMessageReview.review_id, createInvoiceReview.review_id],
      decisions: ["approved", "rejected"],
      decision_notes: [
        ["Approve the outbound message for the quote lane."],
        ["Reject invoice creation until quote approval is complete."],
      ],
      revision_rounds: [1, 1],
      target_type: "review_pack",
    };
  }

  return {
    actor_id: "human_reviewer_1",
    review_ids: [
      sendMessageReview?.review_id ?? "",
      publishPostReview?.review_id ?? "",
    ].filter(Boolean),
    decisions: [
      "revise_required",
      "approved",
    ].slice(0, publishPostReview ? 2 : 1) as BatchDecisionIngress["batch_decision_payloads"][number]["decision"][],
    decision_notes: publishPostReview
      ? [
        ["Revise send_message wording before the next approval round."],
        ["Approve publish_post for the current content lane."],
      ]
      : [["Revise send_message wording before the next approval round."]],
    revision_rounds: publishPostReview ? [1, 1] : [1],
    target_type: "review_pack",
  };
}

function buildNextStep(
  batchStateMachineResult: ReturnType<typeof runBatchApprovalStateMachine>,
  resubmissionStateMachineResult?: ReturnType<typeof runBatchApprovalStateMachine>,
  batchRevisionResubmission?: ReturnType<typeof buildBatchRevisionResubmission>,
): string {
  if (
    batchRevisionResubmission?.resubmission_result.resubmission_status === "ready"
    && resubmissionStateMachineResult?.batch_state_machine_result.current_status === "approved"
  ) {
    return "Batch revision resubmission succeeded. Advance the approved reviews.";
  }

  if (
    batchRevisionResubmission?.resubmission_result.resubmission_status === "ready"
    && resubmissionStateMachineResult?.batch_state_machine_result.current_status === "mixed"
  ) {
    return "Batch revision resolved partial reviews, but some rejected items remain.";
  }

  const currentStatus = batchStateMachineResult.batch_state_machine_result.current_status;
  if (currentStatus === "revise_required") {
    return "Resolve revision queue before the next outbound approval cycle.";
  }

  if (currentStatus === "approved") {
    return "Advance all approved reviews into the next controlled outbound step.";
  }

  if (currentStatus === "rejected") {
    return "Keep rejected reviews in safe mode and continue with approved alternatives.";
  }

  if (currentStatus === "mixed") {
    return "Resolve mixed batch approval outcomes before the next outbound cycle.";
  }

  return "Continue the batch approval cycle with pending reviews.";
}

export function runBatchHumanApprovalCycle(goal: string): BatchHumanApprovalCycleResult {
  const externalFlow = runExternalFlow(goal);
  const batchApprovalInputSurface = buildBatchApprovalInputSurface();
  const batchDecisionPayloads = ingestBatchHumanDecisions({
    rawBatchDecision: buildStaticBatchDecisionInput(externalFlow),
    batchApprovalInputSurface,
  });
  const batchSessionIngestResult = ingestBatchSessionDecisions({
    approvalReviewSession: externalFlow.approval_review_session,
    batchDecisionPayloads,
  });
  const batchStateMachineResult = runBatchApprovalStateMachine({
    approvalReviewSession: externalFlow.approval_review_session,
    batchDecisionPayloads,
    sessionReceipt: externalFlow.session_receipt,
  });
  const batchRevisionQueue = buildBatchRevisionQueue({
    batchDecisionPayloads,
  });
  const batchAuditTrail = buildBatchDecisionAuditTrail({
    batchDecisionPayloads,
  });
  const batchOutcomePreview = previewBatchDecisionOutcome({
    batchStateMachineResult,
    outboundReceipt: externalFlow.outbound_receipt,
    revenueLoopPreview: externalFlow.revenue_loop_preview,
  });
  const batchCycleReplay = replayBatchApprovalCycle({
    batchDecisionPayloads,
    batchStateMachineResult,
    batchRevisionQueue,
  });
  const followupDecisionBridge = bridgeFollowupDecisions({
    batchStateMachineResult,
    controlledFollowupPreview: externalFlow.controlled_followup_preview,
  });
  const batchRevisionResubmission = buildBatchRevisionResubmission({
    batchRevisionQueue,
    originalBatchDecisionPayloads: batchDecisionPayloads,
  });
  const resubmissionStateMachineResult = runBatchApprovalStateMachine({
    approvalReviewSession: externalFlow.approval_review_session,
    batchDecisionPayloads,
    sessionReceipt: externalFlow.session_receipt,
    resubmittedBatchDecisionPayloads: batchRevisionResubmission.resubmission_result.new_batch_decision_payloads,
  });
  const resubmissionOutcomePreview = previewBatchDecisionOutcome({
    batchStateMachineResult: resubmissionStateMachineResult,
    outboundReceipt: externalFlow.outbound_receipt,
    revenueLoopPreview: externalFlow.revenue_loop_preview,
    batchRevisionResubmission,
  });

  return {
    goal_summary: goal,
    external_flow: externalFlow,
    batch_approval_input_surface: batchApprovalInputSurface,
    batch_decision_payloads: batchDecisionPayloads,
    batch_session_ingest_result: batchSessionIngestResult,
    batch_state_machine_result: batchStateMachineResult,
    batch_revision_queue: batchRevisionQueue,
    batch_audit_trail: batchAuditTrail,
    batch_outcome_preview: batchOutcomePreview,
    batch_cycle_replay: batchCycleReplay,
    followup_decision_bridge: followupDecisionBridge,
    batch_revision_resubmission: batchRevisionResubmission,
    resubmission_state_machine_result: resubmissionStateMachineResult,
    resubmission_outcome_preview: resubmissionOutcomePreview,
    next_step: buildNextStep(
      batchStateMachineResult,
      resubmissionStateMachineResult,
      batchRevisionResubmission,
    ),
  };
}

async function main() {
  const goal = parseGoal(process.argv.slice(2));
  const result = runBatchHumanApprovalCycle(goal);

  console.log("=== BATCH APPROVAL INPUT SURFACE ===");
  console.log(JSON.stringify(result.batch_approval_input_surface, null, 2));
  console.log("");
  console.log("=== BATCH DECISION INGRESS ===");
  console.log(JSON.stringify(result.batch_decision_payloads, null, 2));
  console.log("");
  console.log("=== BATCH SESSION INGEST ===");
  console.log(JSON.stringify(result.batch_session_ingest_result, null, 2));
  console.log("");
  console.log("=== BATCH APPROVAL STATE MACHINE ===");
  console.log(JSON.stringify(result.batch_state_machine_result, null, 2));
  console.log("");
  console.log("=== BATCH REVISION QUEUE ===");
  console.log(JSON.stringify(result.batch_revision_queue, null, 2));
  console.log("");
  console.log("=== BATCH AUDIT TRAIL ===");
  console.log(JSON.stringify(result.batch_audit_trail, null, 2));
  console.log("");
  console.log("=== BATCH OUTCOME PREVIEW ===");
  console.log(JSON.stringify(result.batch_outcome_preview, null, 2));
  console.log("");
  console.log("=== APPROVAL CYCLE REPLAY ===");
  console.log(JSON.stringify(result.batch_cycle_replay, null, 2));
  console.log("");
  console.log("=== FOLLOW-UP DECISION BRIDGE ===");
  console.log(JSON.stringify(result.followup_decision_bridge, null, 2));
  console.log("");
  console.log("=== BATCH REVISION RESUBMISSION ===");
  console.log(JSON.stringify(result.batch_revision_resubmission, null, 2));
  console.log("");
  console.log("=== RESUBMISSION STATE MACHINE ===");
  console.log(JSON.stringify(result.resubmission_state_machine_result, null, 2));
  console.log("");
  console.log("=== RESUBMISSION OUTCOME PREVIEW ===");
  console.log(JSON.stringify(result.resubmission_outcome_preview, null, 2));
  console.log("");
  console.log("=== BATCH APPROVAL PATCH RESULT ===");
  console.log(JSON.stringify({
    batch_revision_resubmission: result.batch_revision_resubmission,
    resubmission_state_machine_result: result.resubmission_state_machine_result,
    resubmission_outcome_preview: result.resubmission_outcome_preview,
    next_step: result.next_step,
  }, null, 2));
  console.log("");
  console.log("=== BATCH HUMAN APPROVAL RESULT ===");
  console.log(JSON.stringify(result, null, 2));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  void main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
