# Status Tracking

## Purpose
- Define the minimum status model for V1 task execution.

## Status Levels
- `pending`
- `in_progress`
- `done`
- `failed`
- `blocked`

## Tracking Fields
- `task_description`
- `assigned_agent`
- `status`
- `result`
- `error`
- `started_at`
- `finished_at`

## Update Triggers
- Set `pending` when the authorized task list is parsed.
- Set `in_progress` when execution starts for a task.
- Set `done` when a task returns a successful result.
- Set `failed` when execution returns an error.
- Set `blocked` when execution cannot start safely.

## Blocker Rules
- Missing assigned agent.
- Missing task description.
- Missing authorization payload.
- Runtime dependency unavailable for the exact task.

## Reporting Format
- Track one record per task.
- Preserve original task wording in status output.
- Do not combine multiple tasks into one status record.
