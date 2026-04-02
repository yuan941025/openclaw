import type { AuthorizedPlan, TaskRecord } from "./types.ts";

export function dispatchTasks(plan: AuthorizedPlan): TaskRecord[] {
  return plan.tasks.map((task) => ({
    description: task.description,
    assignedAgent: task.assigned_agent,
    status: "pending",
    result: null,
    error: null,
    startedAt: null,
    finishedAt: null,
  }));
}
