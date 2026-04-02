import { fileURLToPath } from "node:url";
import type {
  HumanDecisionPayload,
} from "../agents/agent_types.ts";
import { runExternalFlow } from "./external_runner.ts";
import { buildApprovalInputSurface } from "./approval_input_surface.ts";
import { ingestHumanDecision } from "./human_decision_ingress.ts";
import { ingestSessionDecision } from "./session_decision_ingest.ts";
import { updateReviewOverride } from "./review_override_updater.ts";
import { runApprovalStateMachine } from "./approval_state_machine.ts";
import { bridgeRevisionNotes } from "./revision_note_bridge.ts";
import { buildDecisionAuditTrail } from "./decision_audit_trail.ts";
import { buildApprovalWorkQueue } from "./approval_work_queue.ts";
import { previewDecisionOutcome } from "./decision_outcome_preview.ts";

type HumanApprovalCycleResult = {
  goal_summary: string;
  external_flow: ReturnType<typeof runExternalFlow>;
  approval_input_surface: ReturnType<typeof buildApprovalInputSurface>;
  decision_payload: ReturnType<typeof ingestHumanDecision>;
  session_ingest_result: ReturnType<typeof ingestSessionDecision>;
  override_update: ReturnType<typeof updateReviewOverride>;
  state_machine_result: ReturnType<typeof runApprovalStateMachine>;
  revision_bridge: ReturnType<typeof bridgeRevisionNotes>;
  audit_trail: ReturnType<typeof buildDecisionAuditTrail>;
  approval_queue: ReturnType<typeof buildApprovalWorkQueue>;
  outcome_preview: ReturnType<typeof previewDecisionOutcome>;
  next_step: string;
};

const DEFAULT_GOAL =
  "prepare an AI service offer lane for a small business using the lobster team";

function parseGoal(argv: string[]): string {
  return argv.join(" ").trim() || DEFAULT_GOAL;
}

function buildStaticHumanDecision(
  externalFlow: ReturnType<typeof runExternalFlow>,
): Partial<HumanDecisionPayload["decision_payload"]> {
  const quoteReview = externalFlow.outbound_review_pack.review_packs.find((review) =>
    review.action_type === "create_invoice"
  );
  if (quoteReview) {
    return {
      actor_id: "human_reviewer_1",
      review_id: quoteReview.review_id,
      decision: "rejected",
      decision_notes: [
        "Keep invoice creation in safe mode until quote terms are clarified.",
      ],
      revision_round: 1,
      target_type: "review_pack",
    };
  }

  const sendMessageReview = externalFlow.outbound_review_pack.review_packs.find((review) =>
    review.action_type === "send_message"
  ) ?? externalFlow.outbound_review_pack.review_packs[0];

  return {
    actor_id: "human_reviewer_1",
    review_id: sendMessageReview?.review_id ?? "",
    decision: "revise_required",
    decision_notes: [
      "Revise the outbound wording before requesting final approval.",
    ],
    revision_round: 1,
    target_type: "review_pack",
  };
}

function buildNextStep(
  stateMachineResult: ReturnType<typeof runApprovalStateMachine>,
): string {
  const currentStatus = stateMachineResult.state_machine_result.current_status;
  if (currentStatus === "revise_required") {
    return "Revise the review pack and re-enter the approval cycle.";
  }

  if (currentStatus === "approved") {
    return "Move the approved review into the next controlled outbound step.";
  }

  if (currentStatus === "rejected") {
    return "Keep the rejected review in safe mode and continue with approved alternatives.";
  }

  if (currentStatus === "mixed") {
    return "Resolve mixed approval outcomes before the next outbound cycle.";
  }

  return "Continue the human approval cycle with the next pending review.";
}

export function runHumanApprovalCycle(goal: string): HumanApprovalCycleResult {
  const externalFlow = runExternalFlow(goal);
  const approvalInputSurface = buildApprovalInputSurface();
  const decisionPayload = ingestHumanDecision({
    rawDecision: buildStaticHumanDecision(externalFlow),
    approvalInputSurface,
  });
  const sessionIngestResult = ingestSessionDecision({
    approvalReviewSession: externalFlow.approval_review_session,
    decisionPayload,
    decisionReplay: externalFlow.decision_replay,
  });
  const overrideUpdate = updateReviewOverride({
    decisionReplay: externalFlow.decision_replay,
    decisionPayload,
  });
  const stateMachineResult = runApprovalStateMachine({
    approvalReviewSession: externalFlow.approval_review_session,
    decisionReplay: externalFlow.decision_replay,
    overrideUpdate,
    decisionPayload,
    sessionReceipt: externalFlow.session_receipt,
  });
  const revisionBridge = bridgeRevisionNotes({
    decisionPayload,
    overrideUpdate,
    outboundReviewPack: externalFlow.outbound_review_pack,
  });
  const auditTrail = buildDecisionAuditTrail({
    decisionPayload,
    overrideUpdate,
  });
  const approvalQueue = buildApprovalWorkQueue({
    approvalReviewSession: externalFlow.approval_review_session,
    decisionReplay: externalFlow.decision_replay,
    overrideUpdate,
    decisionPayload,
  });
  const outcomePreview = previewDecisionOutcome({
    stateMachineResult,
    outboundReceipt: externalFlow.outbound_receipt,
    revenueLoopPreview: externalFlow.revenue_loop_preview,
  });

  return {
    goal_summary: goal,
    external_flow: externalFlow,
    approval_input_surface: approvalInputSurface,
    decision_payload: decisionPayload,
    session_ingest_result: sessionIngestResult,
    override_update: overrideUpdate,
    state_machine_result: stateMachineResult,
    revision_bridge: revisionBridge,
    audit_trail: auditTrail,
    approval_queue: approvalQueue,
    outcome_preview: outcomePreview,
    next_step: buildNextStep(stateMachineResult),
  };
}

async function main() {
  const goal = parseGoal(process.argv.slice(2));
  const result = runHumanApprovalCycle(goal);

  console.log("=== APPROVAL INPUT SURFACE ===");
  console.log(JSON.stringify(result.approval_input_surface, null, 2));
  console.log("");
  console.log("=== HUMAN DECISION INGRESS ===");
  console.log(JSON.stringify(result.decision_payload, null, 2));
  console.log("");
  console.log("=== SESSION DECISION INGEST ===");
  console.log(JSON.stringify(result.session_ingest_result, null, 2));
  console.log("");
  console.log("=== REVIEW OVERRIDE UPDATE ===");
  console.log(JSON.stringify(result.override_update, null, 2));
  console.log("");
  console.log("=== APPROVAL STATE MACHINE ===");
  console.log(JSON.stringify(result.state_machine_result, null, 2));
  console.log("");
  console.log("=== REVISION NOTE BRIDGE ===");
  console.log(JSON.stringify(result.revision_bridge, null, 2));
  console.log("");
  console.log("=== DECISION AUDIT TRAIL ===");
  console.log(JSON.stringify(result.audit_trail, null, 2));
  console.log("");
  console.log("=== APPROVAL WORK QUEUE ===");
  console.log(JSON.stringify(result.approval_queue, null, 2));
  console.log("");
  console.log("=== DECISION OUTCOME PREVIEW ===");
  console.log(JSON.stringify(result.outcome_preview, null, 2));
  console.log("");
  console.log("=== HUMAN APPROVAL CYCLE RESULT ===");
  console.log(JSON.stringify(result, null, 2));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  void main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
