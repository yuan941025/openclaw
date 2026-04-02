import { fileURLToPath } from "node:url";
import { runActorSessionOrchestration } from "./actor_session_orchestration_runner.ts";
import { replayActorReassignments } from "./actor_reassignment_replay.ts";
import { buildEscalationHistory } from "./escalation_history.ts";
import { replayQueuePartitions } from "./queue_partition_replay.ts";
import { buildActorReadinessSnapshot } from "./actor_readiness_snapshot.ts";
import { buildActorTransitionTimeline } from "./actor_transition_timeline.ts";
import { buildMultiActorSessionReceipt } from "./multi_actor_session_receipt.ts";
import { revalidatePrepContract } from "./prep_contract_revalidator.ts";
import { buildExecutionHandoffClosure } from "./execution_handoff_closure.ts";
import { buildPreExecutionClosureReport } from "./pre_execution_closure_report.ts";

type ActorSessionHistoryResult = {
  goal_summary: string;
  orchestration_result: ReturnType<typeof runActorSessionOrchestration>;
  reassignment_replay: ReturnType<typeof replayActorReassignments>;
  escalation_history: ReturnType<typeof buildEscalationHistory>;
  queue_replay: ReturnType<typeof replayQueuePartitions>;
  actor_readiness_snapshot: ReturnType<typeof buildActorReadinessSnapshot>;
  actor_transition_timeline: ReturnType<typeof buildActorTransitionTimeline>;
  multi_actor_session_receipt: ReturnType<typeof buildMultiActorSessionReceipt>;
  prep_revalidation: ReturnType<typeof revalidatePrepContract>;
  execution_handoff_closure: ReturnType<typeof buildExecutionHandoffClosure>;
  pre_execution_closure_report: ReturnType<typeof buildPreExecutionClosureReport>;
  next_step: string;
};

const DEFAULT_GOAL =
  "prepare an AI service offer lane for a small business using the lobster team";

function parseGoal(argv: string[]): string {
  return argv.join(" ").trim() || DEFAULT_GOAL;
}

function buildNextStep(
  preExecutionClosureReport: ReturnType<typeof buildPreExecutionClosureReport>,
): string {
  const overallStatus = preExecutionClosureReport.closure_report.overall_status;
  if (overallStatus === "ready") {
    return "V7 is fully closed. The session is ready for the first real execution bridge.";
  }
  if (overallStatus === "partial") {
    return "Resolve remaining blockers before final real execution handoff.";
  }
  if (overallStatus === "blocked") {
    return "Keep the session in safe mode and repair the actor/execution path first.";
  }
  return "Continue actor/session closure checks.";
}

export function runActorSessionHistory(goal: string): ActorSessionHistoryResult {
  const orchestrationResult = runActorSessionOrchestration(goal);
  const sessionId = orchestrationResult.real_execution_prep_contract.real_execution_prep.session_id;
  const reassignmentReplay = replayActorReassignments({
    sessionReassignment: orchestrationResult.session_reassignment,
    actorOwnershipContract: orchestrationResult.actor_ownership_contract,
    sessionId,
  });
  const escalationHistory = buildEscalationHistory({
    reviewEscalations: orchestrationResult.review_escalations,
    sessionId,
  });
  const queueReplay = replayQueuePartitions({
    approvalQueuePartition: orchestrationResult.approval_queue_partition,
  });
  const actorReadinessSnapshot = buildActorReadinessSnapshot({
    realExecutionPrepContract: orchestrationResult.real_execution_prep_contract,
    approvalQueuePartition: orchestrationResult.approval_queue_partition,
  });
  const actorTransitionTimeline = buildActorTransitionTimeline({
    actorOwnershipContract: orchestrationResult.actor_ownership_contract,
    sessionAssignmentRoutes: orchestrationResult.session_assignment_routes,
    reviewEscalations: orchestrationResult.review_escalations,
    sessionReassignment: orchestrationResult.session_reassignment,
  });
  const multiActorSessionReceipt = buildMultiActorSessionReceipt({
    mergedActorOutcomes: orchestrationResult.merged_actor_outcomes,
    realExecutionPrepContract: orchestrationResult.real_execution_prep_contract,
    reviewEscalations: orchestrationResult.review_escalations,
  });
  const prepRevalidation = revalidatePrepContract({
    realExecutionPrepContract: orchestrationResult.real_execution_prep_contract,
    multiActorSessionReceipt,
    reassignmentReplay,
  });
  const executionHandoffClosure = buildExecutionHandoffClosure({
    prepRevalidation,
    realExecutionPrepContract: orchestrationResult.real_execution_prep_contract,
  });
  const preExecutionClosureReport = buildPreExecutionClosureReport({
    executionHandoffClosure,
    multiActorSessionReceipt,
    prepRevalidation,
  });

  return {
    goal_summary: goal,
    orchestration_result: orchestrationResult,
    reassignment_replay: reassignmentReplay,
    escalation_history: escalationHistory,
    queue_replay: queueReplay,
    actor_readiness_snapshot: actorReadinessSnapshot,
    actor_transition_timeline: actorTransitionTimeline,
    multi_actor_session_receipt: multiActorSessionReceipt,
    prep_revalidation: prepRevalidation,
    execution_handoff_closure: executionHandoffClosure,
    pre_execution_closure_report: preExecutionClosureReport,
    next_step: buildNextStep(preExecutionClosureReport),
  };
}

async function main() {
  const goal = parseGoal(process.argv.slice(2));
  const result = runActorSessionHistory(goal);

  console.log("=== REASSIGNMENT REPLAY ===");
  console.log(JSON.stringify(result.reassignment_replay, null, 2));
  console.log("");
  console.log("=== ESCALATION HISTORY ===");
  console.log(JSON.stringify(result.escalation_history, null, 2));
  console.log("");
  console.log("=== QUEUE REPLAY ===");
  console.log(JSON.stringify(result.queue_replay, null, 2));
  console.log("");
  console.log("=== ACTOR READINESS SNAPSHOT ===");
  console.log(JSON.stringify(result.actor_readiness_snapshot, null, 2));
  console.log("");
  console.log("=== ACTOR TRANSITION TIMELINE ===");
  console.log(JSON.stringify(result.actor_transition_timeline, null, 2));
  console.log("");
  console.log("=== MULTI-ACTOR SESSION RECEIPT ===");
  console.log(JSON.stringify(result.multi_actor_session_receipt, null, 2));
  console.log("");
  console.log("=== PREP CONTRACT REVALIDATION ===");
  console.log(JSON.stringify(result.prep_revalidation, null, 2));
  console.log("");
  console.log("=== EXECUTION HANDOFF CLOSURE ===");
  console.log(JSON.stringify(result.execution_handoff_closure, null, 2));
  console.log("");
  console.log("=== PRE-EXECUTION CLOSURE REPORT ===");
  console.log(JSON.stringify(result.pre_execution_closure_report, null, 2));
  console.log("");
  console.log("=== ACTOR SESSION HISTORY RESULT ===");
  console.log(JSON.stringify(result, null, 2));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  void main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
