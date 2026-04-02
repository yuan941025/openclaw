import { spawn } from "node:child_process";
import {
  createExecutionReceiptFromCodexExecution,
  type ExecutionReceipt,
} from "./execution_receipt.ts";
import type { CapabilityStatus } from "./capability_tracker.ts";
import {
  createCapabilityReportFallback,
  validateCapabilityReport,
} from "./receipt_validator.ts";

type CapabilityReportValidationSummary = {
  valid: boolean;
  reason: string;
};

export type CodexExecutionResult = {
  status: "skipped" | "ok" | "error";
  command: string[];
  working_directory: string;
  instruction_length: number;
  exit_code: number | null;
  stdout_preview: string;
  stderr_preview: string;
  capability_statuses: CapabilityStatus[] | null;
  capability_report_error: string | null;
  capability_report_validation: CapabilityReportValidationSummary;
  capability_report_source: ExecutionReceipt["capability_report_source"] | null;
  started_at: string | null;
  finished_at: string | null;
  reason: string | null;
};

export type { ExecutionReceipt } from "./execution_receipt.ts";

type ExecuteWithCodexOptions = {
  workingDirectory?: string;
  enabled?: boolean;
};

function createSkippedResult(
  instruction: string,
  workingDirectory: string,
  reason: string,
): CodexExecutionResult {
  return {
    status: "skipped",
    command: [],
    working_directory: workingDirectory,
    instruction_length: instruction.length,
    exit_code: null,
    stdout_preview: "",
    stderr_preview: "",
    capability_statuses: null,
    capability_report_error: null,
    capability_report_validation: {
      valid: false,
      reason: "Codex execution skipped; no capability report available.",
    },
    capability_report_source: null,
    started_at: null,
    finished_at: null,
    reason,
  };
}

function trimPreview(output: string, maxLength = 1200): string {
  const normalized = output.trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return normalized.slice(-maxLength);
}

function tryParseJson(value: string): { parsed: true; value: unknown } | { parsed: false } {
  try {
    return {
      parsed: true,
      value: JSON.parse(value) as unknown,
    };
  } catch {
    return { parsed: false };
  }
}

export function extractCapabilityReport(stdout: string): unknown | null {
  const fencedBlocks = [...stdout.matchAll(/```(?:json)?\s*([\s\S]*?)```/giu)];
  for (let index = fencedBlocks.length - 1; index >= 0; index -= 1) {
    const parsed = tryParseJson(fencedBlocks[index][1]);
    if (parsed.parsed) {
      return parsed.value;
    }
  }

  const trimmed = stdout.trim();
  if (trimmed.length === 0) {
    return null;
  }

  const lastClosingBrace = trimmed.lastIndexOf("}");
  if (lastClosingBrace < 0) {
    return null;
  }

  let startIndex = trimmed.lastIndexOf("{", lastClosingBrace);
  while (startIndex >= 0) {
    const parsed = tryParseJson(trimmed.slice(startIndex, lastClosingBrace + 1));
    if (parsed.parsed) {
      return parsed.value;
    }
    startIndex = trimmed.lastIndexOf("{", startIndex - 1);
  }

  return null;
}

function resolveCapabilityReport(
  stdout: string,
  executionStatus: CodexExecutionResult["status"],
): {
  capability_statuses: CapabilityStatus[] | null;
  capability_report_error: string | null;
  capability_report_validation: CapabilityReportValidationSummary;
  capability_report_source: ExecutionReceipt["capability_report_source"] | null;
} {
  const extractedReport = extractCapabilityReport(stdout);
  const validation = validateCapabilityReport(extractedReport);

  if (validation.valid) {
    return {
      capability_statuses: validation.capability_statuses,
      capability_report_error: null,
      capability_report_validation: {
        valid: true,
        reason: validation.reason,
      },
      capability_report_source: "codex_report",
    };
  }

  if (executionStatus === "skipped") {
    return {
      capability_statuses: null,
      capability_report_error: null,
      capability_report_validation: {
        valid: false,
        reason: validation.reason,
      },
      capability_report_source: null,
    };
  }

  return {
    capability_statuses: createCapabilityReportFallback(),
    capability_report_error: validation.reason,
    capability_report_validation: {
      valid: false,
      reason: validation.reason,
    },
    capability_report_source: "fallback",
  };
}

export async function executeWithCodex(
  instruction: string,
  options: ExecuteWithCodexOptions = {},
): Promise<CodexExecutionResult> {
  const workingDirectory = options.workingDirectory ?? process.cwd();
  const enabled = options.enabled ?? false;

  if (!enabled) {
    return createSkippedResult(
      instruction,
      workingDirectory,
      "Codex execution disabled. Pass --execute-codex or set SELF_BUILD_EXECUTE_WITH_CODEX=1 to enable the auto-build loop.",
    );
  }

  if (instruction.trim().length === 0) {
    return createSkippedResult(instruction, workingDirectory, "codex_instruction_pack is empty.");
  }

  const command = [
    "codex",
    "exec",
    "--full-auto",
    "--sandbox",
    "workspace-write",
    "-C",
    workingDirectory,
    "-",
  ];
  const startedAt = new Date().toISOString();

  return await new Promise<CodexExecutionResult>((resolve) => {
    const child = spawn(command[0], command.slice(1), {
      cwd: workingDirectory,
      stdio: ["pipe", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk: Buffer | string) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk: Buffer | string) => {
      stderr += chunk.toString();
    });

    child.on("error", (error: Error) => {
      const capabilityReport = resolveCapabilityReport(stdout, "error");

      resolve({
        status: "error",
        command,
        working_directory: workingDirectory,
        instruction_length: instruction.length,
        exit_code: null,
        stdout_preview: trimPreview(stdout),
        stderr_preview: trimPreview(`${stderr}\n${error.message}`),
        capability_statuses: capabilityReport.capability_statuses,
        capability_report_error: capabilityReport.capability_report_error,
        capability_report_validation: capabilityReport.capability_report_validation,
        capability_report_source: capabilityReport.capability_report_source,
        started_at: startedAt,
        finished_at: new Date().toISOString(),
        reason: error.message,
      });
    });

    child.on("close", (exitCode) => {
      const executionStatus = exitCode === 0 ? "ok" : "error";
      const capabilityReport = resolveCapabilityReport(stdout, executionStatus);

      resolve({
        status: executionStatus,
        command,
        working_directory: workingDirectory,
        instruction_length: instruction.length,
        exit_code: exitCode,
        stdout_preview: trimPreview(stdout),
        stderr_preview: trimPreview(stderr),
        capability_statuses: capabilityReport.capability_statuses,
        capability_report_error: capabilityReport.capability_report_error,
        capability_report_validation: capabilityReport.capability_report_validation,
        capability_report_source: capabilityReport.capability_report_source,
        started_at: startedAt,
        finished_at: new Date().toISOString(),
        reason: exitCode === 0 ? null : `codex exec exited with code ${String(exitCode)}`,
      });
    });

    child.stdin.end(instruction);
  });
}

export function toExecutionReceipt(result: CodexExecutionResult): ExecutionReceipt {
  return createExecutionReceiptFromCodexExecution(result);
}
