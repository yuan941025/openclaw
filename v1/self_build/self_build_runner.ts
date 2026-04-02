import { fileURLToPath } from "node:url";
import { createBuildSpec } from "./build_spec_builder.ts";
import {
  executeWithCodex,
  toExecutionReceipt,
  type CodexExecutionResult,
} from "./codex_executor.ts";
import {
  getCapabilityNameForTask,
  listCompletedCapabilities,
  listRetryCapabilities,
  type CapabilityStatus,
} from "./capability_tracker.ts";
import {
  inferCapabilityStatusesFromReceipt,
  inferCompletedTaskTypesFromReceipt,
  parseExecutionReceiptJson,
  type ExecutionReceipt,
} from "./execution_receipt.ts";
import type {
  SelfBuildLoopResult,
  SelfBuildModule,
  SelfBuildPlan,
  SelfBuildTask,
  SelfBuildTaskType,
} from "./build_spec_types.ts";
import { runSelfBuildPlanning } from "./self_build_orchestrator.ts";
import { getCapabilityNameForTaskType } from "./task_action_mapper.ts";

const DEFAULT_GOAL =
  "Upgrade the self-build loop so Lobster can turn planning output into a Codex-ready build spec package.";
const EXECUTE_WITH_CODEX_FLAG = "--execute-codex";
const EXECUTE_WITH_CODEX_ENV = "SELF_BUILD_EXECUTE_WITH_CODEX";
const PREVIOUS_RECEIPT_FLAG = "--receipt-json";
const PREVIOUS_RECEIPT_ENV = "SELF_BUILD_PREVIOUS_RECEIPT_JSON";
const AUTO_CONTINUE_FLAG = "--auto-continue";
const MAX_LOOPS_FLAG = "--max-loops";
const CURRENT_LOOP_FLAG = "--current-loop";
const CAPABILITY_REPORT_FORMAT = `
=== CAPABILITY REPORT FORMAT ===

Return a JSON block with:

{
  "capabilities": [
    {
      "name": "module_foundation",
      "status": "completed | partial | failed"
    }
  ]
}

Rules:
- completed = feature fully usable
- partial = partially implemented / not stable
- failed = not implemented or broken
`.trim();

type PlanningContext = {
  previous_execution_receipt: ExecutionReceipt | null;
  capability_report_source: ExecutionReceipt["capability_report_source"] | null;
  capability_statuses: CapabilityStatus[];
  completed_capabilities: string[];
  completed_task_types: SelfBuildTaskType[];
  planning_adjustment: string;
};

type LoopDecisionTaskMove = {
  task_id: string;
  from_index: number;
  to_index: number;
  move_reason: "skip_compression" | "reprioritized";
  trigger_capability?: string;
};

type LoopDecisionEvent = {
  event_type: "skip_compression" | "reprioritized";
  trigger_capability: string;
  affected_task_ids: string[];
  summary: string;
};

type LoopDecisionTrace = {
  capability_report_source?: ExecutionReceipt["capability_report_source"];
  completed_capabilities: string[];
  failed_capabilities: string[];
  skipped_task_types: string[];
  skipped_task_ids: string[];
  reprioritized_task_types: string[];
  reprioritized_task_ids: string[];
  task_order_before: string[];
  task_order_after: string[];
  task_moves: LoopDecisionTaskMove[];
  decision_events: LoopDecisionEvent[];
  reason_summary: string[];
};

type SelfBuildLoopRuntimeResult = SelfBuildLoopResult & {
  planning_context: PlanningContext;
  loop_decision_trace: LoopDecisionTrace;
};

type SelfBuildLoopIterationResult = SelfBuildLoopRuntimeResult & {
  codex_execution: CodexExecutionResult;
  execution_receipt: ExecutionReceipt;
};

type SelfBuildLoopSequenceResult = {
  loops: {
    loop_number: number;
    result: SelfBuildLoopIterationResult;
  }[];
  final_result: SelfBuildLoopIterationResult | null;
  stopped_reason: string;
};

type RunSelfBuildLoopOptions = {
  previousExecutionReceipt?: ExecutionReceipt | null;
  current_loop?: number;
  max_loops?: number;
  auto_continue?: boolean;
  executeCodex?: boolean;
  workingDirectory?: string;
};

function appendCapabilityReportFormat(instruction: string): string {
  if (instruction.includes("=== CAPABILITY REPORT FORMAT ===")) {
    return instruction;
  }

  return `${instruction}\n\n${CAPABILITY_REPORT_FORMAT}`;
}

function createModuleTasks(module: SelfBuildModule, index: number): SelfBuildTask[] {
  const taskPrefix = `module_${index + 1}`;

  return [
    {
      task_id: `${taskPrefix}_build_spec_contracts`,
      type: "build_module",
      module_name: module.name,
      title: `Build module foundation for ${module.name}`,
      description:
        "Create the module-building foundation that turns planned capabilities into structured construction targets.",
      priority: module.priority,
      expected_output:
        "Module-building contracts and registry rules exist so planned capabilities can become real construction packages.",
    },
    {
      task_id: `${taskPrefix}_api_package`,
      type: "add_api_endpoint",
      module_name: module.name,
      title: `Add API package scaffold for ${module.name}`,
      description:
        "Prepare a self-build-local endpoint package that can be wired later without touching external servers now.",
      priority: module.priority,
      expected_output:
        "The self-build module includes API contracts and handlers as future integration-ready capability pieces.",
    },
    {
      task_id: `${taskPrefix}_loop_control`,
      type: "add_loop_control",
      module_name: module.name,
      title: `Add loop control for ${module.name}`,
      description:
        "Add explicit loop control so the self-build loop can manage iteration order and stop conditions.",
      priority: module.priority,
      expected_output:
        "Loop orchestration is controlled by dedicated state and controller modules instead of runner-only flow.",
    },
    {
      task_id: `${taskPrefix}_memory`,
      type: "add_memory",
      module_name: module.name,
      title: `Add memory layer for ${module.name}`,
      description:
        "Add self-build-local memory so the loop can reuse previous state without adding a database.",
      priority: module.priority,
      expected_output:
        "The self-build loop can read and write in-memory state snapshots that shape future construction tasks.",
    },
    {
      task_id: `${taskPrefix}_refactor`,
      type: "refactor_module",
      module_name: module.name,
      title: `Refactor orchestration boundaries for ${module.name}`,
      description:
        "Separate planning, task mapping, and build-spec assembly so each self-build concern stays independently extensible.",
      priority: module.priority,
      expected_output:
        "The self-build pipeline has clear boundaries between planning, task typing, mapping, and output packaging.",
    },
  ];
}

function prioritizeTasksForReceipt(
  tasks: SelfBuildTask[],
  capabilityStatuses: CapabilityStatus[],
  previousExecutionReceipt: ExecutionReceipt | null,
): SelfBuildTask[] {
  const capabilityStatusLookup = new Map(
    capabilityStatuses.map((capabilityStatus) => [capabilityStatus.name, capabilityStatus.status]),
  );

  if (capabilityStatusLookup.size > 0) {
    const getTaskRank = (task: SelfBuildTask) => {
      const capabilityStatus = capabilityStatusLookup.get(getCapabilityNameForTask(task));
      if (capabilityStatus === "failed") {
        return 0;
      }
      if (capabilityStatus === "partial") {
        return 1;
      }
      return 2;
    };

    return [...tasks].sort((left, right) => getTaskRank(left) - getTaskRank(right));
  }

  if (previousExecutionReceipt?.status !== "failed") {
    return tasks;
  }

  return [...tasks].sort((left, right) => {
    if (left.type === "refactor_module" && right.type !== "refactor_module") {
      return -1;
    }
    if (left.type !== "refactor_module" && right.type === "refactor_module") {
      return 1;
    }
    return 0;
  });
}

function buildTasks(
  plan: SelfBuildPlan,
  previousExecutionReceipt: ExecutionReceipt | null,
): {
  tasks: SelfBuildTask[];
  capabilityStatuses: CapabilityStatus[];
  completedTaskTypes: SelfBuildTaskType[];
  skippedTasks: SelfBuildTask[];
  skippedTaskIds: string[];
  reprioritizedTasks: SelfBuildTask[];
  reprioritizedTaskIds: string[];
  taskOrderBefore: string[];
  taskOrderAfter: string[];
} {
  const plannedTasks = plan.proposed_modules.flatMap((module, index) => createModuleTasks(module, index));
  const taskTraceIdLookup = new Map(
    plannedTasks.map((task, index) => [task, getTaskTraceId(task, index)]),
  );
  const capabilityStatuses = inferCapabilityStatusesFromReceipt(previousExecutionReceipt);
  const completedTaskTypes = inferCompletedTaskTypesFromReceipt(previousExecutionReceipt);
  const completedTaskTypeSet = new Set(completedTaskTypes);
  const skippedTasks = plannedTasks.filter((task) => completedTaskTypeSet.has(task.type));
  const skippedTaskIds = skippedTasks.map((task) => taskTraceIdLookup.get(task) ?? task.task_id);
  const remainingTasks = plannedTasks.filter((task) => !completedTaskTypeSet.has(task.type));
  const prioritizedTasks = prioritizeTasksForReceipt(
    remainingTasks,
    capabilityStatuses,
    previousExecutionReceipt,
  );
  const originalTaskIndex = new Map(
    remainingTasks.map((task, index) => [task.task_id, index]),
  );
  const reprioritizedTasks = prioritizedTasks.filter(
    (task, index) => index < (originalTaskIndex.get(task.task_id) ?? Number.MAX_SAFE_INTEGER),
  );
  const reprioritizedTaskIds = reprioritizedTasks.map(
    (task) => taskTraceIdLookup.get(task) ?? task.task_id,
  );

  return {
    tasks: prioritizedTasks,
    capabilityStatuses,
    completedTaskTypes,
    skippedTasks,
    skippedTaskIds,
    reprioritizedTasks,
    reprioritizedTaskIds,
    taskOrderBefore: plannedTasks.map((task) => taskTraceIdLookup.get(task) ?? task.task_id),
    taskOrderAfter: prioritizedTasks.map((task) => taskTraceIdLookup.get(task) ?? task.task_id),
  };
}

function buildPlanningAdjustment(
  previousExecutionReceipt: ExecutionReceipt | null,
  capabilityStatuses: CapabilityStatus[],
  completedTaskTypes: SelfBuildTaskType[],
): string {
  if (!previousExecutionReceipt) {
    return "No previous execution receipt. Use the full self-build task set.";
  }

  if (previousExecutionReceipt.capability_report_source === "skipped") {
    return "No Codex capability report; execution was skipped.";
  }

  if (previousExecutionReceipt.capability_report_source === "fallback") {
    return "Capability report fallback applied.";
  }

  if (previousExecutionReceipt.capability_report_source === "codex_report") {
    const completedCapabilities = listCompletedCapabilities(capabilityStatuses);
    if (completedCapabilities.length > 0) {
      return `Capability report received directly from Codex. Skip already-landed capabilities: ${completedCapabilities.join(", ")}.`;
    }

    const retryCapabilities = listRetryCapabilities(capabilityStatuses);
    if (retryCapabilities.length > 0) {
      return `Capability report received directly from Codex. Prioritize these capabilities next: ${retryCapabilities.join(", ")}.`;
    }

    return "Capability report received directly from Codex.";
  }

  const retryCapabilities = listRetryCapabilities(capabilityStatuses);
  if (retryCapabilities.length > 0) {
    return `Previous execution reported incomplete capability work. Prioritize these capabilities next: ${retryCapabilities.join(", ")}.`;
  }

  if (previousExecutionReceipt.status === "failed") {
    return "Failed prior run detected. Prioritize refactor and recovery-oriented tasks before retrying the rest.";
  }

  if (previousExecutionReceipt.status === "skipped") {
    return "Previous run was skipped. Keep the original task sequence.";
  }

  return "Previous execution receipt did not map to completed task types. Keep the remaining task set unchanged.";
}

function buildLoopDecisionTrace(
  previousExecutionReceipt: ExecutionReceipt | null,
  capabilityStatuses: CapabilityStatus[],
  skippedTasks: SelfBuildTask[],
  skippedTaskIds: string[],
  reprioritizedTasks: SelfBuildTask[],
  reprioritizedTaskIds: string[],
  taskOrderBefore: string[],
  taskOrderAfter: string[],
  planningAdjustment: string,
): LoopDecisionTrace {
  const capabilityReportSource = previousExecutionReceipt?.capability_report_source;
  const completedCapabilities = listCompletedCapabilities(capabilityStatuses);
  const failedCapabilities = capabilityStatuses
    .filter(
      (capabilityStatus) =>
        capabilityStatus.status === "failed" || capabilityStatus.status === "partial",
    )
    .map((capabilityStatus) => capabilityStatus.name);
  const skippedTaskTypes = [...new Set(skippedTasks.map((task) => task.type))];
  const reprioritizedTaskTypes = [...new Set(reprioritizedTasks.map((task) => task.type))];
  const skippedTaskCapabilityLookup = new Map(
    skippedTasks.map((task, index) => [
      skippedTaskIds[index],
      getCapabilityNameForTaskType(task.type),
    ]),
  );
  const capabilityStatusLookup = new Map(
    capabilityStatuses.map((capabilityStatus) => [capabilityStatus.name, capabilityStatus.status]),
  );
  const reprioritizedTaskCapabilityLookup = new Map(
    reprioritizedTasks.flatMap((task, index) => {
      const capabilityName = getCapabilityNameForTaskType(task.type);
      const capabilityStatus = capabilityStatusLookup.get(capabilityName);
      if (capabilityStatus !== "failed" && capabilityStatus !== "partial") {
        return [];
      }

      return [[reprioritizedTaskIds[index], capabilityName] as const];
    }),
  );
  const taskMoves = buildTaskMoves(
    taskOrderBefore,
    taskOrderAfter,
    reprioritizedTaskIds,
    skippedTaskCapabilityLookup,
    reprioritizedTaskCapabilityLookup,
  );
  const decisionEvents = buildDecisionEvents(
    skippedTaskIds,
    skippedTaskCapabilityLookup,
    reprioritizedTaskIds,
    reprioritizedTaskCapabilityLookup,
    taskOrderBefore,
    taskMoves,
  );
  const reasonSummary: string[] = [];

  if (capabilityReportSource === "codex_report") {
    reasonSummary.push("Capability report received directly from Codex.");
  } else if (capabilityReportSource === "fallback") {
    reasonSummary.push("Capability report fallback applied.");
  } else if (capabilityReportSource === "skipped") {
    reasonSummary.push("No Codex capability report; execution was skipped.");
  } else {
    reasonSummary.push(planningAdjustment);
  }

  if (skippedTaskIds.length > 0) {
    reasonSummary.push("Task order compressed after completed capabilities were skipped.");
  }

  if (reprioritizedTaskIds.length > 0) {
    reasonSummary.push("Task order changed after reprioritization.");
  }

  if (taskMoves.some((taskMove) => taskMove.move_reason === "reprioritized")) {
    reasonSummary.push("Task move summary includes reprioritized tasks.");
  }

  if (taskMoves.some((taskMove) => taskMove.move_reason === "skip_compression")) {
    reasonSummary.push("Task move summary includes compression after skipped tasks.");
  }

  for (let index = 0; index < skippedTasks.length; index += 1) {
    const task = skippedTasks[index];
    const capabilityName = getCapabilityNameForTaskType(task.type);
    reasonSummary.push(
      `Skipped task ${skippedTaskIds[index]} because ${capabilityName} is already completed.`,
    );
  }

  for (let index = 0; index < reprioritizedTasks.length; index += 1) {
    const task = reprioritizedTasks[index];
    const capabilityName = getCapabilityNameForTaskType(task.type);
    const capabilityStatus = capabilityStatusLookup.get(capabilityName);
    if (capabilityStatus === "partial") {
      reasonSummary.push(
        `Reprioritized task ${reprioritizedTaskIds[index]} because ${capabilityName} was previously partial.`,
      );
    } else if (capabilityStatus === "failed") {
      reasonSummary.push(
        `Reprioritized task ${reprioritizedTaskIds[index]} because ${capabilityName} previously failed.`,
      );
    }
  }

  for (const taskMove of taskMoves) {
    if (taskMove.move_reason === "reprioritized" && taskMove.trigger_capability) {
      reasonSummary.push(
        `Task ${taskMove.task_id} moved because capability ${taskMove.trigger_capability} was reprioritized.`,
      );
    } else if (taskMove.move_reason === "skip_compression" && taskMove.trigger_capability) {
      reasonSummary.push(
        `Task ${taskMove.task_id} shifted forward because capability ${taskMove.trigger_capability} caused an earlier task to be skipped.`,
      );
    }
  }

  return {
    capability_report_source: capabilityReportSource ?? undefined,
    completed_capabilities: completedCapabilities,
    failed_capabilities: failedCapabilities,
    skipped_task_types: skippedTaskTypes,
    skipped_task_ids: skippedTaskIds,
    reprioritized_task_types: reprioritizedTaskTypes,
    reprioritized_task_ids: reprioritizedTaskIds,
    task_order_before: taskOrderBefore,
    task_order_after: taskOrderAfter,
    task_moves: taskMoves,
    decision_events: decisionEvents,
    reason_summary: reasonSummary,
  };
}

function buildTaskMoves(
  taskOrderBefore: string[],
  taskOrderAfter: string[],
  reprioritizedTaskIds: string[],
  skippedTaskCapabilityLookup: Map<string, string>,
  reprioritizedTaskCapabilityLookup: Map<string, string>,
): LoopDecisionTaskMove[] {
  const afterIndexLookup = new Map(
    taskOrderAfter.map((taskId, index) => [taskId, index]),
  );
  const beforeIndexLookup = new Map(
    taskOrderBefore.map((taskId, index) => [taskId, index]),
  );
  const reprioritizedTaskIdSet = new Set(reprioritizedTaskIds);
  const skippedTaskIds = [...skippedTaskCapabilityLookup.keys()];

  return taskOrderBefore.flatMap((taskId, fromIndex) => {
    const toIndex = afterIndexLookup.get(taskId);
    if (toIndex === undefined || toIndex === fromIndex) {
      return [];
    }

    const moveReason = reprioritizedTaskIdSet.has(taskId)
      ? "reprioritized"
      : "skip_compression";
    const triggerCapability = moveReason === "reprioritized"
      ? reprioritizedTaskCapabilityLookup.get(taskId)
      : getSkipCompressionTriggerCapability(
          fromIndex,
          skippedTaskIds,
          beforeIndexLookup,
          skippedTaskCapabilityLookup,
        );

    return [
      {
        task_id: taskId,
        from_index: fromIndex,
        to_index: toIndex,
        move_reason: moveReason,
        trigger_capability: triggerCapability,
      },
    ];
  });
}

function buildDecisionEvents(
  skippedTaskIds: string[],
  skippedTaskCapabilityLookup: Map<string, string>,
  reprioritizedTaskIds: string[],
  reprioritizedTaskCapabilityLookup: Map<string, string>,
  taskOrderBefore: string[],
  taskMoves: LoopDecisionTaskMove[],
): LoopDecisionEvent[] {
  const decisionEvents: LoopDecisionEvent[] = [];
  const skipCompressionAffectedTaskIds = new Map<string, Set<string>>();

  for (const skippedTaskId of skippedTaskIds) {
    const capabilityName = skippedTaskCapabilityLookup.get(skippedTaskId);
    if (!capabilityName) {
      continue;
    }

    const affectedTaskIds = getOrCreateAffectedTaskIdSet(
      skipCompressionAffectedTaskIds,
      capabilityName,
    );
    affectedTaskIds.add(skippedTaskId);
  }

  for (const taskMove of taskMoves) {
    if (
      taskMove.move_reason !== "skip_compression"
      || !taskMove.trigger_capability
    ) {
      continue;
    }

    const affectedTaskIds = getOrCreateAffectedTaskIdSet(
      skipCompressionAffectedTaskIds,
      taskMove.trigger_capability,
    );
    affectedTaskIds.add(taskMove.task_id);
  }

  for (const [capabilityName, affectedTaskIds] of skipCompressionAffectedTaskIds) {
    const affectedTaskIdList = [...affectedTaskIds];
    decisionEvents.push({
      event_type: "skip_compression",
      trigger_capability: capabilityName,
      affected_task_ids: affectedTaskIdList,
      summary: `Capability ${capabilityName} caused task compression affecting: ${affectedTaskIdList.join(", ")}.`,
    });
  }

  const reprioritizedAffectedTaskIds = new Map<string, Set<string>>();
  for (const reprioritizedTaskId of reprioritizedTaskIds) {
    const capabilityName = reprioritizedTaskCapabilityLookup.get(reprioritizedTaskId);
    if (!capabilityName) {
      continue;
    }

    const affectedTaskIds = getOrCreateAffectedTaskIdSet(
      reprioritizedAffectedTaskIds,
      capabilityName,
    );
    affectedTaskIds.add(reprioritizedTaskId);

    const reprioritizedTaskMove = taskMoves.find(
      (taskMove) =>
        taskMove.task_id === reprioritizedTaskId
        && taskMove.move_reason === "reprioritized"
        && taskMove.trigger_capability === capabilityName,
    );
    if (!reprioritizedTaskMove || reprioritizedTaskMove.to_index >= reprioritizedTaskMove.from_index) {
      continue;
    }

    for (const displacedTaskId of taskOrderBefore.slice(
      reprioritizedTaskMove.to_index,
      reprioritizedTaskMove.from_index,
    )) {
      affectedTaskIds.add(displacedTaskId);
    }
  }

  for (const [capabilityName, affectedTaskIds] of reprioritizedAffectedTaskIds) {
    const affectedTaskIdList = [...affectedTaskIds];
    decisionEvents.push({
      event_type: "reprioritized",
      trigger_capability: capabilityName,
      affected_task_ids: affectedTaskIdList,
      summary: `Capability ${capabilityName} caused reprioritization affecting: ${affectedTaskIdList.join(", ")}.`,
    });
  }

  return decisionEvents;
}

function getOrCreateAffectedTaskIdSet(
  affectedTaskIdsByCapability: Map<string, Set<string>>,
  capabilityName: string,
): Set<string> {
  const existingAffectedTaskIds = affectedTaskIdsByCapability.get(capabilityName);
  if (existingAffectedTaskIds) {
    return existingAffectedTaskIds;
  }

  const nextAffectedTaskIds = new Set<string>();
  affectedTaskIdsByCapability.set(capabilityName, nextAffectedTaskIds);
  return nextAffectedTaskIds;
}

function getSkipCompressionTriggerCapability(
  fromIndex: number,
  skippedTaskIds: string[],
  beforeIndexLookup: Map<string, number>,
  skippedTaskCapabilityLookup: Map<string, string>,
): string | undefined {
  const candidateCapabilities = [...new Set(
    skippedTaskIds.flatMap((skippedTaskId) => {
      const skippedIndex = beforeIndexLookup.get(skippedTaskId);
      const capabilityName = skippedTaskCapabilityLookup.get(skippedTaskId);
      if (
        skippedIndex === undefined
        || skippedIndex >= fromIndex
        || !capabilityName
      ) {
        return [];
      }

      return [capabilityName];
    }),
  )];

  if (candidateCapabilities.length !== 1) {
    return undefined;
  }

  return candidateCapabilities[0];
}

function getTaskTraceId(task: Pick<SelfBuildTask, "task_id" | "type">, index: number): string {
  if (typeof task.task_id === "string" && task.task_id.trim().length > 0) {
    return task.task_id;
  }

  return `${task.type}_${index + 1}`;
}

async function runSelfBuildLoopIteration(
  goal = DEFAULT_GOAL,
  options: { previousExecutionReceipt?: ExecutionReceipt | null } = {},
): Promise<SelfBuildLoopRuntimeResult> {
  const previousExecutionReceipt = options.previousExecutionReceipt ?? null;
  const plan = (await runSelfBuildPlanning({ goal })) as SelfBuildPlan;
  const {
    tasks,
    capabilityStatuses,
    completedTaskTypes,
    skippedTasks,
    skippedTaskIds,
    reprioritizedTasks,
    reprioritizedTaskIds,
    taskOrderBefore,
    taskOrderAfter,
  } = buildTasks(
    plan,
    previousExecutionReceipt,
  );
  const build_spec = createBuildSpec({
    goal,
    plan,
    tasks,
  });
  const buildSpecWithCapabilityReport = {
    ...build_spec,
    codex_instruction_pack: appendCapabilityReportFormat(build_spec.codex_instruction_pack),
  };
  const planningAdjustment = buildPlanningAdjustment(
    previousExecutionReceipt,
    capabilityStatuses,
    completedTaskTypes,
  );
  const loopDecisionTrace = buildLoopDecisionTrace(
    previousExecutionReceipt,
    capabilityStatuses,
    skippedTasks,
    skippedTaskIds,
    reprioritizedTasks,
    reprioritizedTaskIds,
    taskOrderBefore,
    taskOrderAfter,
    planningAdjustment,
  );

  return {
    goal,
    plan,
    tasks,
    build_spec: buildSpecWithCapabilityReport,
    completed: true,
    planning_context: {
      previous_execution_receipt: previousExecutionReceipt,
      capability_report_source: previousExecutionReceipt?.capability_report_source ?? null,
      capability_statuses: capabilityStatuses,
      completed_capabilities: listCompletedCapabilities(capabilityStatuses),
      completed_task_types: completedTaskTypes,
      planning_adjustment: planningAdjustment,
    },
    loop_decision_trace: loopDecisionTrace,
  };
}

function createLoopStoppedCodexExecution(
  instruction: string,
  workingDirectory: string,
  reason: string,
): CodexExecutionResult {
  return {
    status: "skipped",
    command: [],
    working_directory: workingDirectory,
    instruction_length: instruction.length,
    exit_code: null,
    stdout_preview: "",
    stderr_preview: "",
    capability_statuses: null,
    capability_report_error: null,
    capability_report_validation: {
      valid: false,
      reason,
    },
    capability_report_source: null,
    started_at: null,
    finished_at: null,
    reason,
  };
}

function normalizeLoopNumber(value: number | undefined, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(1, Math.trunc(value));
}

function isHardStopReceipt(receipt: ExecutionReceipt): boolean {
  return receipt.status === "failed" && receipt.capability_report_source === "fallback";
}

function createExecutionReceipt(
  codexExecution: CodexExecutionResult,
): ExecutionReceipt {
  const executionReceipt = toExecutionReceipt(codexExecution);
  if (codexExecution.status === "skipped" && !executionReceipt.capability_report_source) {
    executionReceipt.capability_report_source = "skipped";
  }

  return executionReceipt;
}

async function executeLoopResult(
  runtimeResult: SelfBuildLoopRuntimeResult,
  options: Pick<RunSelfBuildLoopOptions, "executeCodex" | "workingDirectory">,
): Promise<SelfBuildLoopIterationResult> {
  const workingDirectory = options.workingDirectory ?? process.cwd();
  const codexExecution =
    runtimeResult.tasks.length === 0
      ? createLoopStoppedCodexExecution(
          runtimeResult.build_spec.codex_instruction_pack,
          workingDirectory,
          "No tasks available for this loop.",
        )
      : await executeWithCodex(runtimeResult.build_spec.codex_instruction_pack, {
          enabled: options.executeCodex,
          workingDirectory,
        });
  const executionReceipt = createExecutionReceipt(codexExecution);

  return {
    ...runtimeResult,
    codex_execution: codexExecution,
    execution_receipt: executionReceipt,
  };
}

export async function runSelfBuildLoop(
  goal = DEFAULT_GOAL,
  options: RunSelfBuildLoopOptions = {},
): Promise<SelfBuildLoopSequenceResult> {
  const loops: SelfBuildLoopSequenceResult["loops"] = [];
  const maxLoops = normalizeLoopNumber(options.max_loops, 1);
  let loopNumber = normalizeLoopNumber(options.current_loop, 1);
  const autoContinue = options.auto_continue ?? false;
  let previousExecutionReceipt = options.previousExecutionReceipt ?? null;

  if (loopNumber > maxLoops) {
    return {
      loops,
      final_result: null,
      stopped_reason: "max_loops_reached",
    };
  }

  while (loopNumber <= maxLoops) {
    const runtimeResult = await runSelfBuildLoopIteration(goal, { previousExecutionReceipt });
    const iterationResult = await executeLoopResult(runtimeResult, options);

    loops.push({
      loop_number: loopNumber,
      result: iterationResult,
    });

    if (iterationResult.tasks.length === 0) {
      return {
        loops,
        final_result: iterationResult,
        stopped_reason: "no_tasks_remaining",
      };
    }

    if (isHardStopReceipt(iterationResult.execution_receipt)) {
      return {
        loops,
        final_result: iterationResult,
        stopped_reason: "failed_hard_stop_fallback",
      };
    }

    if (loopNumber >= maxLoops) {
      return {
        loops,
        final_result: iterationResult,
        stopped_reason: "max_loops_reached",
      };
    }

    if (!autoContinue) {
      return {
        loops,
        final_result: iterationResult,
        stopped_reason: "auto_continue_disabled",
      };
    }

    previousExecutionReceipt = iterationResult.execution_receipt;
    loopNumber += 1;
  }

  return {
    loops,
    final_result: loops.at(-1)?.result ?? null,
    stopped_reason: "max_loops_reached",
  };
}

function isTruthyEnvValue(value: string | undefined): boolean {
  if (!value) {
    return false;
  }

  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

function parseRunnerArgs(argv: string[]) {
  const goalParts: string[] = [];
  let executeCodex = isTruthyEnvValue(process.env[EXECUTE_WITH_CODEX_ENV]);
  let previousExecutionReceipt = parseExecutionReceiptJson(process.env[PREVIOUS_RECEIPT_ENV]);
  let autoContinue = false;
  let maxLoops = 1;
  let currentLoop = 1;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === EXECUTE_WITH_CODEX_FLAG) {
      executeCodex = true;
      continue;
    }
    if (arg === AUTO_CONTINUE_FLAG) {
      autoContinue = true;
      continue;
    }
    if (arg === MAX_LOOPS_FLAG) {
      const rawValue = argv[index + 1];
      if (!rawValue) {
        throw new Error("--max-loops requires a numeric argument");
      }
      maxLoops = normalizeLoopNumber(Number(rawValue), 1);
      index += 1;
      continue;
    }
    if (arg === CURRENT_LOOP_FLAG) {
      const rawValue = argv[index + 1];
      if (!rawValue) {
        throw new Error("--current-loop requires a numeric argument");
      }
      currentLoop = normalizeLoopNumber(Number(rawValue), 1);
      index += 1;
      continue;
    }
    if (arg === PREVIOUS_RECEIPT_FLAG) {
      const rawReceipt = argv[index + 1];
      if (!rawReceipt) {
        throw new Error("--receipt-json requires a JSON string argument");
      }
      previousExecutionReceipt = parseExecutionReceiptJson(rawReceipt);
      index += 1;
      continue;
    }

    goalParts.push(arg);
  }

  return {
    goal: goalParts.join(" ").trim() || DEFAULT_GOAL,
    executeCodex,
    previousExecutionReceipt,
    autoContinue,
    maxLoops,
    currentLoop,
  };
}

function printLoopResult(loopNumber: number, result: SelfBuildLoopIterationResult) {
  console.log(`=== LOOP ${loopNumber} START ===`);
  console.log("PLAN");
  console.log(JSON.stringify(result.plan, null, 2));
  console.log("");
  console.log("TASKS");
  console.log(JSON.stringify(result.tasks, null, 2));
  console.log("");
  console.log("planning_context");
  console.log(JSON.stringify(result.planning_context, null, 2));
  console.log("");
  console.log("=== LOOP DECISION TRACE ===");
  console.log(JSON.stringify(result.loop_decision_trace, null, 2));
  console.log("");
  console.log("build_spec");
  console.log(JSON.stringify(result.build_spec, null, 2));
  console.log("");
  console.log("codex_instruction_pack");
  console.log(result.build_spec.codex_instruction_pack);
  console.log("");
  console.log("codex_execution");
  console.log(JSON.stringify(result.codex_execution, null, 2));
  console.log("");
  console.log("=== CAPABILITY REPORT VALIDATION ===");
  console.log(
    `status: ${result.codex_execution.capability_report_validation.valid ? "valid" : "invalid"}`,
  );
  console.log(`reason: ${result.codex_execution.capability_report_validation.reason}`);
  console.log("");
  console.log("=== CAPABILITY REPORT SOURCE ===");
  console.log(result.execution_receipt.capability_report_source ?? "unknown");
  console.log("");
  console.log("execution_receipt");
  console.log(JSON.stringify(result.execution_receipt, null, 2));
  console.log(`=== LOOP ${loopNumber} END ===`);
}

async function main() {
  const {
    goal,
    executeCodex,
    previousExecutionReceipt,
    autoContinue,
    maxLoops,
    currentLoop,
  } = parseRunnerArgs(process.argv.slice(2));
  const sequenceResult = await runSelfBuildLoop(goal, {
    previousExecutionReceipt,
    auto_continue: autoContinue,
    max_loops: maxLoops,
    current_loop: currentLoop,
    executeCodex,
    workingDirectory: process.cwd(),
  });

  for (const loop of sequenceResult.loops) {
    printLoopResult(loop.loop_number, loop.result);
    console.log("");
  }

  console.log("auto_loop_result");
  console.log(JSON.stringify(sequenceResult, null, 2));
  console.log("");
  console.log("stopped_reason");
  console.log(sequenceResult.stopped_reason);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  void main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
