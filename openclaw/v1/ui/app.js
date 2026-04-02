const providerStatus = document.querySelector("#provider-status");
const queryInput = document.querySelector("#query");
const marketScopeInput = document.querySelector("#market-scope");
const proposalOutput = document.querySelector("#proposal-output");
const authorizationInput = document.querySelector("#authorization-input");
const executionOutput = document.querySelector("#execution-output");
const proposalButton = document.querySelector("#run-proposal");
const executeButton = document.querySelector("#execute-flow");

async function readJson(response) {
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error ?? "request failed");
  }
  return payload;
}

async function loadProviderStatus() {
  const payload = await readJson(await fetch("/api/status"));
  providerStatus.textContent =
    payload.providerMode === "live" ? "live provider" : "local fallback";
}

async function runProposal() {
  proposalOutput.textContent = "Running proposal...";

  try {
    const payload = await readJson(
      await fetch("/api/proposal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: queryInput.value,
          marketScope: marketScopeInput.value,
        }),
      }),
    );

    proposalOutput.textContent = JSON.stringify(payload.proposal, null, 2);
  } catch (error) {
    proposalOutput.textContent = String(error instanceof Error ? error.message : error);
  }
}

async function runExecution() {
  executionOutput.textContent = "Running execution...";

  try {
    const authorization = JSON.parse(authorizationInput.value);
    const payload = await readJson(
      await fetch("/api/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: queryInput.value,
          marketScope: marketScopeInput.value,
          authorization,
        }),
      }),
    );

    proposalOutput.textContent = JSON.stringify(payload.proposal, null, 2);
    executionOutput.textContent = JSON.stringify(payload.executionReport, null, 2);
  } catch (error) {
    executionOutput.textContent = String(error instanceof Error ? error.message : error);
  }
}

proposalButton?.addEventListener("click", () => {
  void runProposal();
});

executeButton?.addEventListener("click", () => {
  void runExecution();
});

void loadProviderStatus();
