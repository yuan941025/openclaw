import type { TaskExecutionInput, TaskExecutionResult, TaskRecord } from "./types.ts";

export type TaskRunner = (task: TaskExecutionInput) => Promise<{
  content?: string | null;
  error?: string | null;
}>;

export async function executeTasks(
  tasks: TaskRecord[],
  runTask: TaskRunner,
): Promise<TaskExecutionResult[]> {
  const results: TaskExecutionResult[] = [];

  for (const task of tasks) {
    const startedAt = new Date().toISOString();
    const finishedAt = new Date().toISOString();
    try {
      const output = await runTask({
        description: task.description,
        assignedAgent: task.assignedAgent,
      });
      const failed = typeof output.error === "string" && output.error.trim().length > 0;

      results.push({
        description: task.description,
        assignedAgent: task.assignedAgent,
        status: failed ? "failed" : "success",
        content: failed ? null : (output.content ?? null),
        error: failed ? output.error ?? "task failed" : null,
        startedAt,
        finishedAt,
      });
    } catch (error: unknown) {
      results.push({
        description: task.description,
        assignedAgent: task.assignedAgent,
        status: "failed",
        content: null,
        error: error instanceof Error ? error.message : String(error),
        startedAt,
        finishedAt,
      });
    }
  }

  return results;
}
