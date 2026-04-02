import type { SelfBuildTask, SelfBuildTaskType } from "./build_spec_types.ts";
import {
  getCapabilityNameForTaskType,
  getTaskActionFilePaths,
} from "./task_action_mapper.ts";

export type CapabilityStatus = {
  name: string;
  status: "completed" | "partial" | "failed";
};

type ReceiptStatus = "success" | "failed" | "skipped";

const TASK_TYPES: SelfBuildTaskType[] = [
  "build_module",
  "add_api_endpoint",
  "add_loop_control",
  "add_memory",
  "refactor_module",
];

export function getCapabilityNameForTask(task: Pick<SelfBuildTask, "type">): string {
  return getCapabilityNameForTaskType(task.type);
}

export function inferCapabilityStatusesFromChangedFiles(
  receiptStatus: ReceiptStatus,
  changedFilesSummary: string[],
): CapabilityStatus[] {
  if (receiptStatus === "skipped" || changedFilesSummary.length === 0) {
    return [];
  }

  const changedFiles = new Set(changedFilesSummary);

  return TASK_TYPES.flatMap((taskType) => {
    const filePaths = getTaskActionFilePaths(taskType);
    const matchedCount = filePaths.filter((path) => changedFiles.has(path)).length;
    if (matchedCount === 0) {
      return [];
    }

    const status: CapabilityStatus["status"] =
      receiptStatus === "failed"
        ? "failed"
        : matchedCount === filePaths.length
          ? "completed"
          : "partial";

    return [
      {
        name: getCapabilityNameForTaskType(taskType),
        status,
      },
    ];
  });
}

export function inferCompletedTaskTypesFromCapabilityStatuses(
  capabilityStatuses: CapabilityStatus[],
): SelfBuildTaskType[] {
  const completedCapabilities = new Set(
    capabilityStatuses
      .filter((capabilityStatus) => capabilityStatus.status === "completed")
      .map((capabilityStatus) => capabilityStatus.name),
  );

  return TASK_TYPES.filter((taskType) =>
    completedCapabilities.has(getCapabilityNameForTaskType(taskType)),
  );
}

export function listCompletedCapabilities(capabilityStatuses: CapabilityStatus[]): string[] {
  return capabilityStatuses
    .filter((capabilityStatus) => capabilityStatus.status === "completed")
    .map((capabilityStatus) => capabilityStatus.name);
}

export function listRetryCapabilities(capabilityStatuses: CapabilityStatus[]): string[] {
  return capabilityStatuses
    .filter(
      (capabilityStatus) =>
        capabilityStatus.status === "failed" || capabilityStatus.status === "partial",
    )
    .map((capabilityStatus) => capabilityStatus.name);
}
