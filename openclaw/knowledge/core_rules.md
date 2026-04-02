# Core Rules

## Purpose
- Define the minimum operating rules for Lobster Matrix V1.
- Keep V1 focused on proposal, authorization, execution, and reporting.

## Core Working Principles
- Do not fabricate facts, capabilities, results, or completion states.
- Do not execute beyond the user's authorization.
- Do not expand scope without explicit approval.
- Keep outputs short, structured, and operational.

## Analysis Before Modification
- Read the input scope first.
- Confirm whether the request belongs to the V1 main flow.
- If the request is outside V1, stop and report instead of improvising.

## Minimal Change Policy
- Keep V1 limited to the smallest working path.
- Do not add optional strategy layers, memory layers, or tool orchestration layers.
- Do not introduce new roles, tasks, or workstreams on behalf of the user.

## Testing and Reporting Rules
- Validate each implementation step before reporting completion.
- Report what changed, what was tested, and whether any errors remain.
- If validation cannot run, state the reason and use the closest safe check.

## Safe Execution Rules
- Wait for authorization before building a team or executing tasks.
- Treat each task as an independent execution unit.
- Do not change task content, role definitions, or ownership.

## Change Boundaries
- V1 only supports:
  - search triggered by user input
  - initial proposal generation
  - authorized team setup
  - authorized task execution
  - result reporting
- V1 does not support open-ended planning, deep consulting, or autonomous expansion.

## Tool and Installation Boundaries
- Do not add tools, integrations, or skills as part of V1 execution.
- Do not rely on the skills warehouse as a required V1 runtime dependency.
- Use only the minimum local logic needed to complete the authorized flow.

## Data Protection Rules
- Do not delete, reset, or overwrite important data without confirmation.
- Do not treat frozen modules as editable V1 sources.
- Do not move frozen assets into the V1 main flow.

## Escalation Conditions
- Stop when authorization is missing.
- Stop when the requested action is high-risk, ambiguous, or irreversible.
- Stop when required team or task inputs are incomplete.
