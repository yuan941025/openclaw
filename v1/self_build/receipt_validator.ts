import type { CapabilityStatus } from "./capability_tracker.ts";

export type CapabilityReport = {
  capabilities: CapabilityStatus[];
};

export type CapabilityReportValidationResult = {
  valid: boolean;
  reason: string;
  capability_statuses: CapabilityStatus[] | null;
  has_report: boolean;
};

const UNKNOWN_CAPABILITY_REPORT: CapabilityStatus = {
  name: "unknown_capability_report",
  status: "failed",
};

function createInvalidResult(
  reason: string,
  hasReport: boolean,
): CapabilityReportValidationResult {
  return {
    valid: false,
    reason,
    capability_statuses: null,
    has_report: hasReport,
  };
}

function isCapabilityStatusStatus(value: unknown): value is CapabilityStatus["status"] {
  return value === "completed" || value === "partial" || value === "failed";
}

export function validateCapabilityReport(input: unknown): CapabilityReportValidationResult {
  if (input === null || input === undefined) {
    return createInvalidResult("Capability report JSON block not found.", false);
  }

  if (typeof input !== "object" || Array.isArray(input)) {
    return createInvalidResult("Capability report root must be an object.", true);
  }

  const candidate = input as Record<string, unknown>;
  if (!Array.isArray(candidate.capabilities)) {
    return createInvalidResult("Capability report capabilities must be an array.", true);
  }

  const capabilityStatuses: CapabilityStatus[] = [];

  for (let index = 0; index < candidate.capabilities.length; index += 1) {
    const capability = candidate.capabilities[index];
    if (!capability || typeof capability !== "object" || Array.isArray(capability)) {
      return createInvalidResult(
        `Capability report capabilities[${String(index)}] must be an object.`,
        true,
      );
    }

    const capabilityRecord = capability as Record<string, unknown>;
    if (typeof capabilityRecord.name !== "string" || capabilityRecord.name.trim().length === 0) {
      return createInvalidResult(
        `Capability report capabilities[${String(index)}].name is required.`,
        true,
      );
    }

    if (typeof capabilityRecord.status !== "string") {
      return createInvalidResult(
        `Capability report capabilities[${String(index)}].status is required.`,
        true,
      );
    }

    if (!isCapabilityStatusStatus(capabilityRecord.status)) {
      return createInvalidResult(
        `Capability report capabilities[${String(index)}].status must be completed, partial, or failed.`,
        true,
      );
    }

    capabilityStatuses.push({
      name: capabilityRecord.name.trim(),
      status: capabilityRecord.status,
    });
  }

  return {
    valid: true,
    reason: "Capability report valid.",
    capability_statuses: capabilityStatuses,
    has_report: true,
  };
}

export function createCapabilityReportFallback(): CapabilityStatus[] {
  return [UNKNOWN_CAPABILITY_REPORT];
}
