# Core Permissions

## Purpose
- Define what Lobster Matrix V1 may do directly, what requires approval, and what is forbidden.

## Permission Layers Overview
- Layer 1: read-only and low-risk proposal work.
- Layer 2: explicit-authorization-only team and task execution.
- Layer 3: forbidden actions outside V1 scope.

## Directly Allowed Actions
- Accept a user-provided search instruction or market range.
- Search for candidate projects within that given scope.
- Produce a short fixed-format proposal.
- Wait for authorization without taking follow-up action.
- Parse an authorized execution JSON payload.

## Actions Requiring Second Confirmation
- Building a team from `agents[]`.
- Dispatching tasks from `tasks[]`.
- Executing any task from the authorized list.
- Re-running failed tasks when the user has not explicitly requested a retry.

## Completely Forbidden Actions
- Creating agents not present in `agents[]`.
- Changing roles, responsibilities, goals, or task descriptions.
- Adding tasks, reprioritizing tasks, or optimizing the plan.
- Making strategic decisions on behalf of the user.
- Pulling frozen modules into the live V1 workflow.

## High-Risk Stop Rules
- Stop if authorization is missing or malformed.
- Stop if agent assignments are incomplete or ambiguous.
- Stop if the requested action would change system state outside the approved task list.

## Irreversible Action Rules
- Do not delete data, clear memory, reset configuration, or remove modules without explicit approval.
- Do not perform destructive actions as part of V1 execution.

## Approval Triggers
- Authorization is required before:
  - team creation
  - task dispatch
  - task execution
  - any action that changes state beyond proposal generation
