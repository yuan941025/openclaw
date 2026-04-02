export type SelfBuildPriority = "high" | "medium" | "low";
export type SelfBuildTaskType =
  | "build_module"
  | "add_api_endpoint"
  | "add_loop_control"
  | "add_memory"
  | "refactor_module";

export type SelfBuildModule = {
  name: string;
  purpose: string;
  priority: SelfBuildPriority;
};

export type SelfBuildPlan = {
  goal_summary: string;
  current_capabilities: string[];
  missing_capabilities: string[];
  proposed_modules: SelfBuildModule[];
  build_order: string[];
};

export type SelfBuildTask = {
  task_id: string;
  type: SelfBuildTaskType;
  module_name: string;
  title: string;
  description: string;
  priority: SelfBuildPriority;
  expected_output: string;
};

export type BuildSpecFile = {
  path: string;
  purpose: string;
};

export type BuildSpec = {
  files_to_create: BuildSpecFile[];
  files_to_modify: BuildSpecFile[];
  execution_steps: string[];
  codex_instruction_pack: string;
};

export type TaskActionMapping = {
  files_to_create: BuildSpecFile[];
  files_to_modify: BuildSpecFile[];
  execution_steps: string[];
};

export type SelfBuildLoopResult = {
  goal: string;
  plan: SelfBuildPlan;
  tasks: SelfBuildTask[];
  build_spec: BuildSpec;
  completed: boolean;
};
