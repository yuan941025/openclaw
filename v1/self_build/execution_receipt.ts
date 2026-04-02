import type { SelfBuildTaskType } from "./build_spec_types.ts";
import {
  inferCapabilityStatusesFromChangedFiles,
  inferCompletedTaskTypesFromCapabilityStatuses,
  type CapabilityStatus,
} from "./capability_tracker.ts";

export type ExecutionReceipt = {
  status: "success" | "failed" | "skipped";
  exit_code?: number;
  last_message?: string;
  stdout_preview?: string;
  stderr_preview?: string;
  changed_files_summary?: string[];
  capability_statuses?: CapabilityStatus[];
  capability_report_error?: string;
  capability_report_source?: "codex_report" | "fallback" | "skipped";
  started_at?: string;
  finished_at?: string;
};

type CodexExecutionLike = {
  status: "skipped" | "ok" | "error";
  exit_code: number | null;
  stdout_preview: string;
  stderr_preview: string;
  capability_statuses?: CapabilityStatus[] | null;
  capability_report_error?: string | null;
  capability_report_source?: ExecutionReceipt["capability_report_source"];
  started_at: string | null;
  finished_at: string | null;
  reason: string | null;
};

function getLastNonEmptyLine(value: string): string | undefined {
  const lines = value
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return lines.at(-1);
}

function extractChangedFilesSummary(stdoutPreview: string, stderrPreview: string): string[] {
  const combined = `${stdoutPreview}\n${stderrPreview}`;
  const matches = combined.match(/\bv1\/self_build\/[A-Za-z0-9_./-]+\.[A-Za-z0-9]+\b/gu) ?? [];

  return [...new Set(matches)];
}

export function createExecutionReceiptFromCodexExecution(
  execution: CodexExecutionLike,
): ExecutionReceipt {
  const status =
    execution.status === "ok"
      ? "success"
      : execution.status === "error"
        ? "failed"
        : "skipped";
  const lastMessage =
    getLastNonEmptyLine(execution.stdout_preview) ??
    getLastNonEmptyLine(execution.stderr_preview) ??
    execution.reason ??
    undefined;
  const changedFiles = extractChangedFilesSummary(
    execution.stdout_preview,
    execution.stderr_preview,
  );
  const capabilityStatuses =
    execution.capability_statuses && execution.capability_statuses.length > 0
      ? execution.capability_statuses
      : execution.capability_report_error
        ? []
      : inferCapabilityStatusesFromChangedFiles(status, changedFiles);

  return {
    status,
    exit_code: execution.exit_code ?? undefined,
    last_message: lastMessage,
    stdout_preview: execution.stdout_preview || undefined,
    stderr_preview: execution.stderr_preview || undefined,
    changed_files_summary: changedFiles.length > 0 ? changedFiles : undefined,
    capability_statuses: capabilityStatuses.length > 0 ? capabilityStatuses : undefined,
    capability_report_error: execution.capability_report_error ?? undefined,
    capability_report_source: execution.capability_report_source ?? undefined,
    started_at: execution.started_at ?? undefined,
    finished_at: execution.finished_at ?? undefined,
  };
}

function isCapabilityStatusStatus(value: unknown): value is CapabilityStatus["status"] {
  return value === "completed" || value === "partial" || value === "failed";
}

function isCapabilityStatus(value: unknown): value is CapabilityStatus {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return typeof candidate.name === "string" && isCapabilityStatusStatus(candidate.status);
}

function isCapabilityStatusArray(value: unknown): value is CapabilityStatus[] {
  return Array.isArray(value) && value.every((item) => isCapabilityStatus(item));
}

export function inferCapabilityStatusesFromReceipt(
  receipt: ExecutionReceipt | null | undefined,
): CapabilityStatus[] {
  if (!receipt) {
    return [];
  }

  if (receipt.capability_statuses && receipt.capability_statuses.length > 0) {
    return receipt.capability_statuses;
  }

  if (receipt.capability_report_source === "skipped") {
    return [];
  }

  if (receipt.capability_report_source === "fallback") {
    return [];
  }

  if (receipt.capability_report_error) {
    return [];
  }

  return inferCapabilityStatusesFromChangedFiles(receipt.status, receipt.changed_files_summary ?? []);
}

export function inferCompletedTaskTypesFromReceipt(
  receipt: ExecutionReceipt | null | undefined,
): SelfBuildTaskType[] {
  return inferCompletedTaskTypesFromCapabilityStatuses(inferCapabilityStatusesFromReceipt(receipt));
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isExecutionReceiptStatus(value: unknown): value is ExecutionReceipt["status"] {
  return value === "success" || value === "failed" || value === "skipped";
}

export function parseExecutionReceiptJson(raw: string | undefined): ExecutionReceipt | null {
  if (!raw || raw.trim().length === 0) {
    return null;
  }

  const parsed = JSON.parse(raw) as Record<string, unknown>;
  if (!isExecutionReceiptStatus(parsed.status)) {
    throw new Error("execution receipt status must be success, failed, or skipped");
  }

  const receipt: ExecutionReceipt = {
    status: parsed.status,
  };

  if (typeof parsed.exit_code === "number") {
    receipt.exit_code = parsed.exit_code;
  }
  if (typeof parsed.last_message === "string") {
    receipt.last_message = parsed.last_message;
  }
  if (typeof parsed.stdout_preview === "string") {
    receipt.stdout_preview = parsed.stdout_preview;
  }
  if (typeof parsed.stderr_preview === "string") {
    receipt.stderr_preview = parsed.stderr_preview;
  }
  if (isStringArray(parsed.changed_files_summary)) {
    receipt.changed_files_summary = parsed.changed_files_summary;
  }
  if (isCapabilityStatusArray(parsed.capability_statuses)) {
    receipt.capability_statuses = parsed.capability_statuses;
  }
  if (typeof parsed.capability_report_error === "string") {
    receipt.capability_report_error = parsed.capability_report_error;
  }
  if (
    parsed.capability_report_source === "codex_report" ||
    parsed.capability_report_source === "fallback" ||
    parsed.capability_report_source === "skipped"
  ) {
    receipt.capability_report_source = parsed.capability_report_source;
  }
  if (typeof parsed.started_at === "string") {
    receipt.started_at = parsed.started_at;
  }
  if (typeof parsed.finished_at === "string") {
    receipt.finished_at = parsed.finished_at;
  }

  return receipt;
}
