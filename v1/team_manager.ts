import type { AuthorizedPlan, TeamMember } from "./types.ts";

export function buildTeam(plan: AuthorizedPlan): TeamMember[] {
  return plan.agents.map((agent) => ({
    role: agent.role,
    responsibility: agent.responsibility,
  }));
}
