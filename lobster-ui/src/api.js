const MOCK_PROPOSAL = [
  {
    project_name: "SMB Lead Generation Sprint",
    summary: "Short outbound lead generation package for local service businesses.",
    feasibility: "high",
    return_level: "medium",
    reason: "Clear buyer profile and easy first validation.",
  },
];

const MOCK_REPORT = {
  project_name: "SMB Lead Generation Sprint",
  goal: "Produce first outbound assets",
  team: [
    { role: "writer", responsibility: "write copy" },
    { role: "operator", responsibility: "prepare execution batch" },
  ],
  tasks: [
    {
      description: "Write landing page copy",
      assignedAgent: "writer",
      status: "success",
      content: "Draft landing page copy generated in mock mode.",
      error: null,
      startedAt: new Date(0).toISOString(),
      finishedAt: new Date(0).toISOString(),
    },
  ],
};

const MOCK_BRAIN_STATUS = {
  mode: "mock",
  summary: {
    matrixName: "Lobster Matrix",
    role: "Operating AI mother system",
    currentVersion: "V2",
    currentMilestone: "V2-M2",
    currentPriority: "Be stable, usable, sustainable, and able to reach first revenue early.",
    nextStep:
      "Turn lobster-ui into a clearer mother-system console by tightening proposal and execution outputs into one mainline view.",
  },
  panels: {
    proposal: {
      title: "Proposal node",
      description:
        "Lobster Matrix first compresses the request into the smallest executable proposal. Keep only the directions that are practical, near monetization, and ready to move now.",
    },
    execute: {
      title: "Execute node",
      description:
        "After authorization, deliver usable output first instead of turning the console into a discussion panel. If a shortest viable version can move the mainline, ship that version first.",
    },
  },
};

const MOCK_TRADING_ANALYSIS = [
  {
    symbol: "NVDA",
    price: 119.86,
    trend: "up",
    risk_level: "medium",
    action: "consider_buy",
    entry_range: "118.062 - 121.059",
    stop_loss: "113.867",
    take_profit: "129.449",
    explanation:
      "NVDA shows positive 24h momentum with workable risk, so the mother system keeps it in consider_buy for observation instead of treating it like an order.",
  },
  {
    symbol: "BTC-USD",
    price: 86420.15,
    trend: "up",
    risk_level: "medium",
    action: "consider_buy",
    entry_range: "85123.85 - 87284.35",
    stop_loss: "82099.14",
    take_profit: "93333.76",
    explanation:
      "BTC-USD still has upward movement and enough liquidity, so it stays on the active watchlist with a structured entry range and guarded downside.",
  },
];

const MOCK_TRADING_FORMATTED = {
  ig: [
    "\u4eca\u65e5AI\u5e02\u5834\u89c0\u5bdf",
    "",
    "NVDA\uff5c\u8003\u616e\u8cb7\u5165",
    "\u9032\u5834\uff1a118.062 - 121.059",
    "\u505c\u640d\uff1a113.867",
    "\u505c\u5229\uff1a129.449",
    "",
    "BTC-USD\uff5c\u8003\u616e\u8cb7\u5165",
    "\u9032\u5834\uff1a85123.85 - 87284.35",
    "\u505c\u640d\uff1a82099.14",
    "\u505c\u5229\uff1a93333.76",
    "",
    "\u975e\u6295\u8cc7\u5efa\u8b70",
  ].join("\n"),
  report: [
    "AI \u5e02\u5834\u5206\u6790\u5831\u544a",
    "- NVDA\uff5c\u8003\u616e\u8cb7\u5165",
    "  \u9032\u5834\u5340\u9593\uff1a118.062 - 121.059",
    "  \u505c\u640d\u4f4d\u7f6e\uff1a113.867",
    "  \u505c\u5229\u4f4d\u7f6e\uff1a129.449",
    "  \u9867\u554f\u8aaa\u660e\uff1aNVDA shows positive 24h momentum with workable risk, so the mother system keeps it in consider_buy for observation instead of treating it like an order.",
    "- BTC-USD\uff5c\u8003\u616e\u8cb7\u5165",
    "  \u9032\u5834\u5340\u9593\uff1a85123.85 - 87284.35",
    "  \u505c\u640d\u4f4d\u7f6e\uff1a82099.14",
    "  \u505c\u5229\u4f4d\u7f6e\uff1a93333.76",
    "  \u9867\u554f\u8aaa\u660e\uff1aBTC-USD still has upward movement and enough liquidity, so it stays on the active watchlist with a structured entry range and guarded downside.",
    "- \u672c\u5831\u544a\u50c5\u4f9b\u53c3\u8003\uff0c\u975e\u6295\u8cc7\u5efa\u8b70\u3002",
  ].join("\n"),
  short: [
    "NVDA\uff5c\u8003\u616e\u8cb7\u5165\uff5c\u9032\u5834 118.062 - 121.059\uff5c\u505c\u640d 113.867\uff5c\u505c\u5229 129.449",
    "BTC-USD\uff5c\u8003\u616e\u8cb7\u5165\uff5c\u9032\u5834 85123.85 - 87284.35\uff5c\u505c\u640d 82099.14\uff5c\u505c\u5229 93333.76",
  ].join("\n"),
};

async function readJson(response) {
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error ?? "request failed");
  }
  return payload;
}

export async function loadBrainStatus() {
  try {
    const payload = await readJson(await fetch("/api/status"));

    return {
      mode: "live-api",
      summary: payload.brain?.summary ?? MOCK_BRAIN_STATUS.summary,
      panels: payload.brain?.panels ?? MOCK_BRAIN_STATUS.panels,
    };
  } catch {
    return MOCK_BRAIN_STATUS;
  }
}

export async function runProposal(query, marketScope) {
  try {
    const payload = await readJson(
      await fetch("/api/proposal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          marketScope,
        }),
      }),
    );

    return {
      mode: "live-api",
      proposal: payload.proposal,
    };
  } catch {
    return {
      mode: "mock",
      proposal: MOCK_PROPOSAL,
    };
  }
}

export async function runExecution(query, marketScope, authorization) {
  try {
    const payload = await readJson(
      await fetch("/api/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          marketScope,
          authorization,
        }),
      }),
    );

    return {
      mode: "live-api",
      proposal: payload.proposal,
      report: payload.executionReport,
    };
  } catch {
    return {
      mode: "mock",
      proposal: MOCK_PROPOSAL,
      report: {
        ...MOCK_REPORT,
        tasks: authorization?.tasks?.map((task, index) => ({
          description: task.description,
          assignedAgent: task.assigned_agent,
          status: "success",
          content: `Mock content output for task ${index + 1}: ${task.description}`,
          error: null,
          startedAt: new Date(0).toISOString(),
          finishedAt: new Date(0).toISOString(),
        })) ?? MOCK_REPORT.tasks,
      },
    };
  }
}

export async function runTradingAnalysis() {
  try {
    const payload = await readJson(await fetch("/api/trading/run"));

    return {
      mode: "live-api",
      analysis: payload.analysis ?? MOCK_TRADING_ANALYSIS,
      formatted: payload.formatted ?? MOCK_TRADING_FORMATTED,
    };
  } catch {
    return {
      mode: "mock",
      analysis: MOCK_TRADING_ANALYSIS,
      formatted: MOCK_TRADING_FORMATTED,
    };
  }
}
