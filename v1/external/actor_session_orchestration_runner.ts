import { fileURLToPath } from "node:url";
import { runExternalFlow } from "./external_runner.ts";
import { buildApprovalActorRegistry } from "./approval_actor_registry.ts";
import { buildActorOwnershipContract } from "./actor_ownership_contract.ts";
import { routeSessionAssignments } from "./session_assignment_router.ts";
import { buildReviewEscalations } from "./review_escalation_rules.ts";
import { partitionApprovalQueue } from "./approval_queue_partition.ts";
import { buildActorDecisionAudit } from "./actor_decision_audit.ts";
import { runSessionReassignment } from "./session_reassignment.ts";
import { mergeMultiActorOutcomes } from "./multi_actor_outcome_merge.ts";
import { buildRealExecutionPrepContract } from "./real_execution_prep_contract.ts";
import { buildApprovalWorkQueue } from "./approval_work_queue.ts";
import { runBatchHumanApprovalCycle } from "./batch_human_approval_runner.ts";

type ActorSessionOrchestrationResult = {
  goal_summary: string;
  external_flow: ReturnType<typeof runExternalFlow>;
  approval_actor_registry: ReturnType<typeof buildApprovalActorRegistry>;
  actor_ownership_contract: ReturnType<typeof buildActorOwnershipContract>;
  session_assignment_routes: ReturnType<typeof routeSessionAssignments>;
  review_escalations: ReturnType<typeof buildReviewEscalations>;
  approval_queue_partition: ReturnType<typeof partitionApprovalQueue>;
  actor_decision_audit: ReturnType<typeof buildActorDecisionAudit>;
  session_reassignment: ReturnType<typeof runSessionReassignment>;
  merged_actor_outcomes: ReturnType<typeof mergeMultiActorOutcomes>;
  real_execution_prep_contract: ReturnType<typeof buildRealExecutionPrepContract>;
  next_step: string;
};

const DEFAULT_GOAL =
  "prepare an AI service offer lane for a small business using the lobster team";

function parseGoal(argv: string[]): string {
  return argv.join(" ").trim() || DEFAULT_GOAL;
}

function buildNextStep(
  realExecutionPrepContract: ReturnType<typeof buildRealExecutionPrepContract>,
): string {
  const prepStatus = realExecutionPrepContract.real_execution_prep.prep_status;
  if (prepStatus === "ready") {
    return "The session is ready for the first real outbound executor bridge.";
  }

  if (prepStatus === "partial") {
    return "Resolve not-ready reviews before enabling real execution.";
  }

  if (prepStatus === "blocked") {
    return "Keep the session in safe mode and repair the approval chain first.";
  }

  return "Continue actor/session orchestration before real execution.";
}

export function runActorSessionOrchestration(goal: string): ActorSessionOrchestrationResult {
  const externalFlow = runExternalFlow(goal);
  const approvalActorRegistry = buildApprovalActorRegistry();
  const actorOwnershipContract = buildActorOwnershipContract({
    approvalReviewSession: externalFlow.approval_review_session,
    actorRegistry: approvalActorRegistry,
  });
  const approvalWorkQueue = buildApprovalWorkQueue({
    approvalReviewSession: externalFlow.approval_review_session,
    decisionReplay: externalFlow.decision_replay,
  });
  const sessionAssignmentRoutes = routeSessionAssignments({
    ownershipContract: actorOwnershipContract,
    approvalWorkQueue,
  });
  const batchFlow = runBatchHumanApprovalCycle(goal);
  const reviewEscalations = buildReviewEscalations({
    assignmentRoutes: sessionAssignmentRoutes,
    batchStateMachineResult: batchFlow.batch_state_machine_result,
    sessionReceipt: externalFlow.session_receipt,
  });
  const approvalQueuePartition = partitionApprovalQueue({
    approvalWorkQueue,
    actorRegistry: approvalActorRegistry,
    assignmentRoutes: sessionAssignmentRoutes,
    escalations: reviewEscalations,
  });
  const actorDecisionAudit = buildActorDecisionAudit({
    actorRegistry: approvalActorRegistry,
    batchDecisionPayloads: batchFlow.batch_decision_payloads,
    assignmentRoutes: sessionAssignmentRoutes,
  });
  const sessionReassignment = runSessionReassignment({
    escalations: reviewEscalations,
    ownershipContract: actorOwnershipContract,
  });
  const mergedActorOutcomes = mergeMultiActorOutcomes({
    sessionReceipt: externalFlow.session_receipt,
    batchStateMachineResult: batchFlow.batch_state_machine_result,
    actorAuditTrail: actorDecisionAudit,
    reassignmentResult: sessionReassignment,
  });
  const realExecutionPrepContract = buildRealExecutionPrepContract({
    mergedActorOutcomes,
    approvalOutboundBridge: externalFlow.approval_outbound_bridge,
    approvalGateContract: externalFlow.approval_gate_contract,
  });

  return {
    goal_summary: goal,
    external_flow: externalFlow,
    approval_actor_registry: approvalActorRegistry,
    actor_ownership_contract: actorOwnershipContract,
    session_assignment_routes: sessionAssignmentRoutes,
    review_escalations: reviewEscalations,
    approval_queue_partition: approvalQueuePartition,
    actor_decision_audit: actorDecisionAudit,
    session_reassignment: sessionReassignment,
    merged_actor_outcomes: mergedActorOutcomes,
    real_execution_prep_contract: realExecutionPrepContract,
    next_step: buildNextStep(realExecutionPrepContract),
  };
}

async function main() {
  const goal = parseGoal(process.argv.slice(2));
  const result = runActorSessionOrchestration(goal);

  console.log("=== APPROVAL ACTOR REGISTRY ===");
  console.log(JSON.stringify(result.approval_actor_registry, null, 2));
  console.log("");
  console.log("=== ACTOR OWNERSHIP CONTRACT ===");
  console.log(JSON.stringify(result.actor_ownership_contract, null, 2));
  console.log("");
  console.log("=== SESSION ASSIGNMENT ROUTER ===");
  console.log(JSON.stringify(result.session_assignment_routes, null, 2));
  console.log("");
  console.log("=== REVIEW ESCALATION RULES ===");
  console.log(JSON.stringify(result.review_escalations, null, 2));
  console.log("");
  console.log("=== APPROVAL QUEUE PARTITION ===");
  console.log(JSON.stringify(result.approval_queue_partition, null, 2));
  console.log("");
  console.log("=== ACTOR DECISION AUDIT ===");
  console.log(JSON.stringify(result.actor_decision_audit, null, 2));
  console.log("");
  console.log("=== SESSION REASSIGNMENT ===");
  console.log(JSON.stringify(result.session_reassignment, null, 2));
  console.log("");
  console.log("=== MULTI-ACTOR OUTCOME MERGE ===");
  console.log(JSON.stringify(result.merged_actor_outcomes, null, 2));
  console.log("");
  console.log("=== REAL EXECUTION PREP CONTRACT ===");
  console.log(JSON.stringify(result.real_execution_prep_contract, null, 2));
  console.log("");
  console.log("=== ACTOR SESSION ORCHESTRATION RESULT ===");
  console.log(JSON.stringify(result, null, 2));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  void main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
