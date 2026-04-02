import { describe, expect, it } from "vitest";
import { createContentTaskRunner } from "../../v1/content_task_runner.ts";
import { runV1MainFlow } from "../../v1/orchestrator.ts";
import type { ContentLLMProvider } from "../../v1/llm_provider.ts";

describe("runV1MainFlow", () => {
  it("runs the minimum V1 flow from user input to execution report", async () => {
    const provider: ContentLLMProvider = {
      async generateContent(request) {
        return {
          content: `content for ${request.taskDescription}`,
        };
      },
    };

    const result = await runV1MainFlow({
      input: {
        query: "find local service business opportunities",
        marketScope: "Taiwan local SMB services",
      },
      search: async () => [
        {
          projectName: "SMB Lead Generation Sprint",
          summary: "Short outbound service package for local service businesses.",
          feasibility: "high",
          returnLevel: "medium",
          reason: "Clear buyer profile and short delivery cycle.",
          lowValue: false,
        },
        {
          projectName: "Low Margin Custom Build",
          summary: "Custom work with unclear buyer and low upside.",
          feasibility: "low",
          returnLevel: "low",
          reason: "Weak demand and poor payoff.",
          lowValue: true,
        },
      ],
      authorizedInput: {
        project_name: "SMB Lead Generation Sprint",
        agents: [
          { role: "researcher", responsibility: "collect target companies" },
          { role: "operator", responsibility: "prepare execution batch" },
        ],
        tasks: [
          { description: "Write target company brief", assigned_agent: "researcher" },
          { description: "Draft first outreach batch", assigned_agent: "operator" },
        ],
        goal: "Launch the first outreach wave",
      },
      runTask: createContentTaskRunner(provider),
    });

    expect(result.proposalStage.searchInput).toEqual({
      query: "find local service business opportunities",
      marketScope: "Taiwan local SMB services",
    });
    expect(result.proposalStage.candidates).toHaveLength(1);
    expect(result.proposalStage.candidates[0]?.projectName).toBe("SMB Lead Generation Sprint");
    expect(result.proposalStage.proposals).toEqual([
      {
        project_name: "SMB Lead Generation Sprint",
        summary: "Short outbound service package for local service businesses.",
        feasibility: "high",
        return_level: "medium",
        reason: "Clear buyer profile and short delivery cycle.",
      },
    ]);

    expect(result.executionStage.plan.project_name).toBe("SMB Lead Generation Sprint");
    expect(result.executionStage.team).toEqual([
      { role: "researcher", responsibility: "collect target companies" },
      { role: "operator", responsibility: "prepare execution batch" },
    ]);
    expect(
      result.executionStage.results.map((item) => ({
        description: item.description,
        assignedAgent: item.assignedAgent,
        status: item.status,
        content: item.content,
        error: item.error,
      })),
    ).toEqual([
      {
        description: "Write target company brief",
        assignedAgent: "researcher",
        status: "success",
        content: "content for Write target company brief",
        error: null,
      },
      {
        description: "Draft first outreach batch",
        assignedAgent: "operator",
        status: "success",
        content: "content for Draft first outreach batch",
        error: null,
      },
    ]);
    expect(result.executionStage.report.project_name).toBe("SMB Lead Generation Sprint");
    expect(result.executionStage.report.goal).toBe("Launch the first outreach wave");
    expect(result.executionStage.report.tasks[0]?.content).toBe("content for Write target company brief");
  });
});
