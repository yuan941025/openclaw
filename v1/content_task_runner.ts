import type { ContentLLMProvider } from "./llm_provider.ts";
import { getLobsterExecutionPromptPrefix } from "./lobster_brain.ts";
import type { TaskExecutionInput } from "./types.ts";

const CONTENT_TASK_PATTERN =
  /\b(write|draft|create|generate|compose|summarize|outline|rewrite|edit|produce|prepare content)\b/i;

function isContentOutputTask(description: string): boolean {
  return CONTENT_TASK_PATTERN.test(description);
}

function buildContentPrompt(task: TaskExecutionInput): string {
  return [
    getLobsterExecutionPromptPrefix(),
    "You are executing one content-output task.",
    "Do not split the task, do not change the task, and do not add strategy.",
    "Produce only the content requested by the task description.",
    `Assigned agent: ${task.assignedAgent}`,
    `Task description: ${task.description}`,
  ].join("\n");
}

export function createContentTaskRunner(provider: ContentLLMProvider) {
  return async (task: TaskExecutionInput): Promise<{
    content?: string | null;
    error?: string | null;
  }> => {
    if (!isContentOutputTask(task.description)) {
      return {
        error: "unsupported task type: content output tasks only",
      };
    }

    const response = await provider.generateContent({
      taskDescription: task.description,
      assignedAgent: task.assignedAgent,
      prompt: buildContentPrompt(task),
    });

    return {
      content: response.content,
    };
  };
}
