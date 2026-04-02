import type { AuthorizedAgent, AuthorizedPlan, AuthorizedTask } from "./types.ts";

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function parseAgent(value: unknown, index: number): AuthorizedAgent {
  if (!value || typeof value !== "object") {
    throw new Error(`agents[${index}] must be an object`);
  }
  const role = (value as { role?: unknown }).role;
  const responsibility = (value as { responsibility?: unknown }).responsibility;
  if (!isNonEmptyString(role)) {
    throw new Error(`agents[${index}].role must be a non-empty string`);
  }
  if (!isNonEmptyString(responsibility)) {
    throw new Error(`agents[${index}].responsibility must be a non-empty string`);
  }
  return {
    role: role.trim(),
    responsibility: responsibility.trim(),
  };
}

function parseTask(value: unknown, index: number): AuthorizedTask {
  if (!value || typeof value !== "object") {
    throw new Error(`tasks[${index}] must be an object`);
  }
  const description = (value as { description?: unknown }).description;
  const assignedAgent = (value as { assigned_agent?: unknown }).assigned_agent;
  if (!isNonEmptyString(description)) {
    throw new Error(`tasks[${index}].description must be a non-empty string`);
  }
  if (!isNonEmptyString(assignedAgent)) {
    throw new Error(`tasks[${index}].assigned_agent must be a non-empty string`);
  }
  return {
    description: description.trim(),
    assigned_agent: assignedAgent.trim(),
  };
}

export function parseAuthorizedPlan(input: unknown): AuthorizedPlan {
  if (!input || typeof input !== "object") {
    throw new Error("authorized plan must be an object");
  }

  const projectName = (input as { project_name?: unknown }).project_name;
  const agents = (input as { agents?: unknown }).agents;
  const tasks = (input as { tasks?: unknown }).tasks;
  const goal = (input as { goal?: unknown }).goal;

  if (!isNonEmptyString(projectName)) {
    throw new Error("project_name must be a non-empty string");
  }
  if (!Array.isArray(agents)) {
    throw new Error("agents must be an array");
  }
  if (!Array.isArray(tasks)) {
    throw new Error("tasks must be an array");
  }
  if (!isNonEmptyString(goal)) {
    throw new Error("goal must be a non-empty string");
  }

  return {
    project_name: projectName.trim(),
    agents: agents.map(parseAgent),
    tasks: tasks.map(parseTask),
    goal: goal.trim(),
  };
}
