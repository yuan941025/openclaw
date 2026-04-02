import { describe, expect, it, vi } from "vitest";
import { createContentTaskRunner } from "../../v1/content_task_runner.ts";
import { executeTasks } from "../../v1/executor.ts";
import { generateExecutionReport } from "../../v1/report_generator.ts";
import type { ContentLLMProvider } from "../../v1/llm_provider.ts";

describe("content task runner", () => {
  it("produces real content for supported content tasks", async () => {
    const generateContent = vi.fn(async (request: { taskDescription: string }) => ({
      content: `Generated output for ${request.taskDescription}`,
    }));
    const provider: ContentLLMProvider = { generateContent };
    const runTask = createContentTaskRunner(provider);

    const results = await executeTasks(
      [
        {
          description: "Write landing page copy",
          assignedAgent: "writer",
          status: "pending",
          result: null,
          error: null,
          startedAt: null,
          finishedAt: null,
        },
      ],
      runTask,
    );

    expect(generateContent).toHaveBeenCalledOnce();
    expect(results).toEqual([
      expect.objectContaining({
        description: "Write landing page copy",
        assignedAgent: "writer",
        status: "success",
        content: "Generated output for Write landing page copy",
        error: null,
      }),
    ]);
  });

  it("executes multiple content tasks one by one and includes content in the report", async () => {
    const provider: ContentLLMProvider = {
      async generateContent(request) {
        return {
          content: `Content block for ${request.taskDescription}`,
        };
      },
    };

    const results = await executeTasks(
      [
        {
          description: "Write project summary",
          assignedAgent: "writer",
          status: "pending",
          result: null,
          error: null,
          startedAt: null,
          finishedAt: null,
        },
        {
          description: "Draft outreach message",
          assignedAgent: "operator",
          status: "pending",
          result: null,
          error: null,
          startedAt: null,
          finishedAt: null,
        },
      ],
      createContentTaskRunner(provider),
    );

    expect(results.map((item) => item.status)).toEqual(["success", "success"]);
    expect(results.map((item) => item.content)).toEqual([
      "Content block for Write project summary",
      "Content block for Draft outreach message",
    ]);

    const report = generateExecutionReport({
      plan: {
        project_name: "Content Ops",
        agents: [
          { role: "writer", responsibility: "write copy" },
          { role: "operator", responsibility: "prepare messages" },
        ],
        tasks: [
          { description: "Write project summary", assigned_agent: "writer" },
          { description: "Draft outreach message", assigned_agent: "operator" },
        ],
        goal: "Produce first outbound content assets",
      },
      team: [
        { role: "writer", responsibility: "write copy" },
        { role: "operator", responsibility: "prepare messages" },
      ],
      results,
    });

    expect(report.tasks[0]?.content).toBe("Content block for Write project summary");
    expect(report.tasks[1]?.content).toBe("Content block for Draft outreach message");
  });

  it("fails unsupported non-content tasks", async () => {
    const provider: ContentLLMProvider = {
      async generateContent() {
        return { content: "should not run" };
      },
    };

    const results = await executeTasks(
      [
        {
          description: "Collect 20 target companies",
          assignedAgent: "researcher",
          status: "pending",
          result: null,
          error: null,
          startedAt: null,
          finishedAt: null,
        },
      ],
      createContentTaskRunner(provider),
    );

    expect(results).toEqual([
      expect.objectContaining({
        description: "Collect 20 target companies",
        status: "failed",
        content: null,
        error: "unsupported task type: content output tasks only",
      }),
    ]);
  });

  it("marks provider failures as failed and continues with later tasks", async () => {
    const provider: ContentLLMProvider = {
      async generateContent(request) {
        if (request.taskDescription === "Write project brief") {
          throw new Error("live provider unavailable");
        }
        return {
          content: `Generated content for ${request.taskDescription}`,
        };
      },
    };

    const results = await executeTasks(
      [
        {
          description: "Write project brief",
          assignedAgent: "writer",
          status: "pending",
          result: null,
          error: null,
          startedAt: null,
          finishedAt: null,
        },
        {
          description: "Draft outreach message",
          assignedAgent: "operator",
          status: "pending",
          result: null,
          error: null,
          startedAt: null,
          finishedAt: null,
        },
      ],
      createContentTaskRunner(provider),
    );

    expect(results).toEqual([
      expect.objectContaining({
        description: "Write project brief",
        status: "failed",
        content: null,
        error: "live provider unavailable",
      }),
      expect.objectContaining({
        description: "Draft outreach message",
        status: "success",
        content: "Generated content for Draft outreach message",
        error: null,
      }),
    ]);
  });
});
