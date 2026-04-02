import type {
  BuildSpecFile,
  SelfBuildTask,
  SelfBuildTaskType,
  TaskActionMapping,
} from "./build_spec_types.ts";

function file(path: string, purpose: string): BuildSpecFile {
  return { path, purpose };
}

function prefixTaskStep(task: SelfBuildTask, step: string): string {
  return `${task.title}: ${step}`;
}

type TaskActionMapper = (task: SelfBuildTask) => TaskActionMapping;

const TASK_CAPABILITY_NAMES: Record<SelfBuildTaskType, string> = {
  build_module: "module_foundation",
  add_api_endpoint: "api_package",
  add_loop_control: "loop_control",
  add_memory: "memory_layer",
  refactor_module: "orchestration_refactor",
};

const TASK_ACTION_MAPPERS: Record<SelfBuildTaskType, TaskActionMapper> = {
  build_module(task) {
    return {
      files_to_create: [
        file(
          "v1/self_build/module_registry.ts",
          "Register capability-building modules and expose lookup metadata for self-build construction planning.",
        ),
        file(
          "v1/self_build/module_builder.ts",
          "Turn proposed modules into structured module build actions for the self-build loop.",
        ),
      ],
      files_to_modify: [
        file(
          "v1/self_build/self_build_runner.ts",
          "Route module-building tasks through the self-build runner so module construction stays on the main capability path.",
        ),
      ],
      execution_steps: [
        prefixTaskStep(
          task,
          "Create module_registry.ts to hold capability-oriented module metadata and lookup helpers.",
        ),
        prefixTaskStep(
          task,
          "Create module_builder.ts to translate module plans into build actions that later task mappings can reuse.",
        ),
        prefixTaskStep(
          task,
          "Update self_build_runner.ts so build_module tasks can seed downstream self-build work from one registry.",
        ),
      ],
    };
  },
  add_api_endpoint(task) {
    return {
      files_to_create: [
        file(
          "v1/self_build/api_contracts.ts",
          "Define request and response contracts for self-build API packages without wiring external servers yet.",
        ),
        file(
          "v1/self_build/api_handlers.ts",
          "Provide self-build-local API handler implementations that can be wired by another layer later.",
        ),
      ],
      files_to_modify: [
        file(
          "v1/self_build/module_registry.ts",
          "Expose API-oriented build targets from the self-build registry without touching ui_server.",
        ),
      ],
      execution_steps: [
        prefixTaskStep(
          task,
          "Create api_contracts.ts for the endpoint payload shape and stable handler boundaries inside self_build.",
        ),
        prefixTaskStep(
          task,
          "Create api_handlers.ts so endpoint behavior exists as a capability package before any external routing work.",
        ),
        prefixTaskStep(
          task,
          "Update module_registry.ts to register the API package as a buildable capability module, not as UI wiring.",
        ),
      ],
    };
  },
  add_loop_control(task) {
    return {
      files_to_create: [
        file(
          "v1/self_build/loop_controller.ts",
          "Control self-build iteration order, stop conditions, and loop execution flow.",
        ),
        file(
          "v1/self_build/loop_state.ts",
          "Store loop state transitions that the self-build runner and memory layer can share.",
        ),
      ],
      files_to_modify: [
        file(
          "v1/self_build/self_build_runner.ts",
          "Hook the runner into explicit loop control so future iterations stay deterministic.",
        ),
        file(
          "v1/self_build/module_builder.ts",
          "Feed loop-control tasks into module-level construction planning.",
        ),
      ],
      execution_steps: [
        prefixTaskStep(
          task,
          "Create loop_state.ts to hold iteration state, stop markers, and loop-control metadata.",
        ),
        prefixTaskStep(
          task,
          "Create loop_controller.ts to apply loop-state transitions and execution guards.",
        ),
        prefixTaskStep(
          task,
          "Update self_build_runner.ts and module_builder.ts so loop-control tasks drive how module work is sequenced.",
        ),
      ],
    };
  },
  add_memory(task) {
    return {
      files_to_create: [
        file(
          "v1/self_build/memory_state.ts",
          "Define in-memory self-build state snapshots for loop progression and previous results.",
        ),
        file(
          "v1/self_build/memory_store.ts",
          "Provide a self-build-local memory store without introducing a database.",
        ),
      ],
      files_to_modify: [
        file(
          "v1/self_build/loop_controller.ts",
          "Connect loop control with the new self-build memory state so iterations can reuse prior context.",
        ),
        file(
          "v1/self_build/build_spec_builder.ts",
          "Allow build spec generation to reference memory-aware capability steps where needed.",
        ),
      ],
      execution_steps: [
        prefixTaskStep(
          task,
          "Create memory_state.ts for reusable loop snapshots and prior self-build results.",
        ),
        prefixTaskStep(
          task,
          "Create memory_store.ts to expose a pure in-memory persistence layer for self-build capability state.",
        ),
        prefixTaskStep(
          task,
          "Update loop_controller.ts and build_spec_builder.ts so memory-backed state can shape future loop actions.",
        ),
      ],
    };
  },
  refactor_module(task) {
    return {
      files_to_create: [],
      files_to_modify: [
        file(
          "v1/self_build/self_build_orchestrator.ts",
          "Separate planning responsibilities from execution packaging so the self-build module stays composable.",
        ),
        file(
          "v1/self_build/build_spec_builder.ts",
          "Keep build-spec assembly isolated from task-type mapping and packaging concerns.",
        ),
        file(
          "v1/self_build/self_build_runner.ts",
          "Tighten runner orchestration boundaries so plan, task mapping, and build packaging remain distinct.",
        ),
      ],
      execution_steps: [
        prefixTaskStep(
          task,
          "Refactor self_build_orchestrator.ts to keep planning focused on module output, not packaging details.",
        ),
        prefixTaskStep(
          task,
          "Refactor build_spec_builder.ts to consume task mappings instead of hardcoded file target templates.",
        ),
        prefixTaskStep(
          task,
          "Refactor self_build_runner.ts so orchestration only composes plan, tasks, and build-spec output boundaries.",
        ),
      ],
    };
  },
};

export function mapTaskToActions(task: SelfBuildTask): TaskActionMapping {
  return TASK_ACTION_MAPPERS[task.type](task);
}

export function getCapabilityNameForTaskType(taskType: SelfBuildTaskType): string {
  return TASK_CAPABILITY_NAMES[taskType];
}

const TASK_PATH_PROBES: Record<SelfBuildTaskType, SelfBuildTask> = {
  build_module: {
    task_id: "probe_build_module",
    type: "build_module",
    module_name: "Self-Build",
    title: "Build module foundation",
    description: "Probe task for build-module file extraction.",
    priority: "high",
    expected_output: "Probe output",
  },
  add_api_endpoint: {
    task_id: "probe_add_api_endpoint",
    type: "add_api_endpoint",
    module_name: "Self-Build",
    title: "Add API package scaffold",
    description: "Probe task for add-api-endpoint file extraction.",
    priority: "high",
    expected_output: "Probe output",
  },
  add_loop_control: {
    task_id: "probe_add_loop_control",
    type: "add_loop_control",
    module_name: "Self-Build",
    title: "Add loop control",
    description: "Probe task for add-loop-control file extraction.",
    priority: "high",
    expected_output: "Probe output",
  },
  add_memory: {
    task_id: "probe_add_memory",
    type: "add_memory",
    module_name: "Self-Build",
    title: "Add memory layer",
    description: "Probe task for add-memory file extraction.",
    priority: "high",
    expected_output: "Probe output",
  },
  refactor_module: {
    task_id: "probe_refactor_module",
    type: "refactor_module",
    module_name: "Self-Build",
    title: "Refactor orchestration boundaries",
    description: "Probe task for refactor-module file extraction.",
    priority: "high",
    expected_output: "Probe output",
  },
};

export function getTaskActionFilePaths(taskType: SelfBuildTaskType): string[] {
  const mapping = mapTaskToActions(TASK_PATH_PROBES[taskType]);

  return [
    ...new Set(
      [...mapping.files_to_create, ...mapping.files_to_modify].map((target) => target.path),
    ),
  ];
}
