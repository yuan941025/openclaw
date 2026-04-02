# Task Rules

## Purpose
- Define how V1 accepts, executes, and completes authorized tasks.

## Task Breakdown Rules
- V1 does not invent new tasks.
- The user-provided `tasks[]` array is the only task source.
- Each task is treated as a standalone unit.

- V1 does not rewrite task descriptions.
- V1 does not merge or split tasks.
- V1 does not reorder tasks for optimization.

## Task Completion Criteria
- A task is complete only when an execution result exists for that exact task.
- A task is blocked when required input, permission, or runtime dependency is missing.
- A task is failed when execution was attempted and returned an error.

## Task Execution Rules
- Execute tasks in list order unless the user explicitly provides another order.
- Respect the `assigned_agent` value exactly as given.
- Do not infer hidden subtasks or missing steps.

## Task Delivery Rules
- Return execution results in a structured, compact format.
- Keep reporting tied to the original task description.

## Task Reporting Format
- For each task report:
  - task description
  - assigned agent
  - status
  - result summary
  - error summary when applicable
