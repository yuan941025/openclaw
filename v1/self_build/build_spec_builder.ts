import { mapTaskToActions } from "./task_action_mapper.ts";
import type {
  BuildSpec,
  BuildSpecFile,
  SelfBuildPlan,
  SelfBuildTask,
  TaskActionMapping,
} from "./build_spec_types.ts";

type CreateBuildSpecParams = {
  goal: string;
  plan: SelfBuildPlan;
  tasks: SelfBuildTask[];
};

type TaskBuildSection = {
  task: SelfBuildTask;
  action: TaskActionMapping;
};

function mergePurpose(existing: string, incoming: string): string {
  if (existing === incoming) {
    return existing;
  }

  const parts = new Set([...existing.split(" / "), ...incoming.split(" / ")].filter(Boolean));
  return [...parts].join(" / ");
}

function collectFiles(sections: TaskBuildSection[], action: "create" | "modify"): BuildSpecFile[] {
  const files = new Map<string, BuildSpecFile>();

  for (const section of sections) {
    const targets =
      action === "create" ? section.action.files_to_create : section.action.files_to_modify;

    for (const target of targets) {
      const existing = files.get(target.path);
      if (!existing) {
        files.set(target.path, target);
        continue;
      }

      files.set(target.path, {
        path: target.path,
        purpose: mergePurpose(existing.purpose, target.purpose),
      });
    }
  }

  return [...files.values()];
}

function removeCreateModifyOverlap(
  filesToCreate: BuildSpecFile[],
  filesToModify: BuildSpecFile[],
): BuildSpecFile[] {
  const createdPaths = new Set(filesToCreate.map((file) => file.path));
  return filesToModify.filter((file) => !createdPaths.has(file.path));
}

function buildExecutionSteps(sections: TaskBuildSection[]): string[] {
  const steps = ["Review plan.proposed_modules and keep implementation scope inside v1/self_build only."];

  for (const section of sections) {
    steps.push(`Task ${section.task.task_id} (${section.task.type}): ${section.task.title}`);
    steps.push(...section.action.execution_steps);
  }

  steps.push("Run node --experimental-strip-types v1/self_build/self_build_runner.ts and confirm the output includes PLAN, TASKS, build_spec, and codex_instruction_pack.");

  return [...new Set(steps)];
}

function formatFileSection(title: string, files: BuildSpecFile[], verb: "Create" | "Modify"): string[] {
  const lines = [title];

  if (files.length === 0) {
    lines.push(`- ${verb}: none`);
    return lines;
  }

  for (const file of files) {
    lines.push(`- ${verb}: ${file.path}`);
    lines.push(`  Purpose: ${file.purpose}`);
  }

  return lines;
}

function buildCodexInstructionPack(params: {
  goal: string;
  plan: SelfBuildPlan;
  sections: TaskBuildSection[];
  filesToCreate: BuildSpecFile[];
  filesToModify: BuildSpecFile[];
  executionSteps: string[];
}): string {
  const moduleSummary =
    params.plan.proposed_modules.length > 0
      ? params.plan.proposed_modules.map((module) => module.name).join(", ")
      : "Self-Build Loop Core";

  const lines = [
    "Goal:",
    `${params.goal}`,
    `Primary module focus: ${moduleSummary}`,
    "Keep the work focused on capability-building inside self_build. Do not spend effort on UI, copywriting, or visual polish.",
    "",
    ...formatFileSection("Files to create:", params.filesToCreate, "Create"),
    "",
    ...formatFileSection("Files to modify:", params.filesToModify, "Modify"),
    "",
    "Task packages:",
    ...params.sections.flatMap((section, index) => {
      const lines = [
        `Task ${index + 1}: ${section.task.title}`,
        `Type: ${section.task.type}`,
        `Construction goal: ${section.task.description}`,
        "Affected files:",
      ];

      lines.push(
        ...formatFileSection("", section.action.files_to_create, "Create").filter(Boolean),
      );
      lines.push(
        ...formatFileSection("", section.action.files_to_modify, "Modify").filter(Boolean),
      );
      lines.push("Construction steps:");
      lines.push(...section.action.execution_steps.map((step, stepIndex) => `${stepIndex + 1}. ${step}`));
      lines.push("");

      return lines;
    }),
    "Execution order:",
    ...params.executionSteps.map((step, index) => `${index + 1}. ${step}`),
    "",
    "Constraints:",
    "- Do not touch ui_server, lobster-ui, TG bot, or trading.",
    "- Do not add a database layer.",
    "- Do not write files outside the self_build module.",
    "- Keep the solution static-rule based; do not add another AI planning pass.",
    "",
    "Report back after completion:",
    "- Which files were changed",
    "- The resulting build_spec structure",
    "- A sample codex_instruction_pack",
    "- The validation command and its output summary",
  ];

  return lines.join("\n");
}

export function createBuildSpec(params: CreateBuildSpecParams): BuildSpec {
  const sections = params.tasks.map((task) => ({
    task,
    action: mapTaskToActions(task),
  }));
  const files_to_create = collectFiles(sections, "create");
  const files_to_modify = removeCreateModifyOverlap(
    files_to_create,
    collectFiles(sections, "modify"),
  );
  const execution_steps = buildExecutionSteps(sections);

  return {
    files_to_create,
    files_to_modify,
    execution_steps,
    codex_instruction_pack: buildCodexInstructionPack({
      goal: params.goal,
      plan: params.plan,
      sections,
      filesToCreate: files_to_create,
      filesToModify: files_to_modify,
      executionSteps: execution_steps,
    }),
  };
}
