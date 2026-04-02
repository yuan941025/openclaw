import { afterEach, describe, expect, it } from "vitest";
import { createV1UiServer } from "../../v1/ui_server.ts";
import type { ContentLLMProvider } from "../../v1/llm_provider.ts";

const servers: Array<{ close: () => Promise<void> }> = [];

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => server.close()));
});

describe("createV1UiServer", () => {
  it("serves provider status, proposal output, and execution report", async () => {
    const provider: ContentLLMProvider = {
      async generateContent(request) {
        return {
          content: `Generated content for ${request.taskDescription}`,
        };
      },
    };

    const app = createV1UiServer({
      contentProvider: provider,
      providerMode: "local",
      port: 0,
    });
    servers.push(app);

    const { port } = await app.listen(0);

    const statusResponse = await fetch(`http://127.0.0.1:${port}/api/status`);
    expect(await statusResponse.json()).toEqual({
      providerMode: "local",
    });

    const proposalResponse = await fetch(`http://127.0.0.1:${port}/api/proposal`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: "local service lead generation",
        marketScope: "Taiwan SMB",
      }),
    });
    const proposalPayload = (await proposalResponse.json()) as {
      proposal: unknown[];
    };
    expect(proposalPayload.proposal.length).toBeGreaterThan(0);

    const runResponse = await fetch(`http://127.0.0.1:${port}/api/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: "local service lead generation",
        marketScope: "Taiwan SMB",
        authorization: {
          project_name: "SMB Lead Generation Sprint",
          agents: [{ role: "writer", responsibility: "write copy" }],
          tasks: [{ description: "Write landing page copy", assigned_agent: "writer" }],
          goal: "Produce first content asset",
        },
      }),
    });
    const runPayload = (await runResponse.json()) as {
      executionReport: {
        tasks: Array<{ status: string; content: string | null }>;
      };
    };
    expect(runPayload.executionReport.tasks).toEqual([
      expect.objectContaining({
        status: "success",
        content: "Generated content for Write landing page copy",
      }),
    ]);
  });
});
