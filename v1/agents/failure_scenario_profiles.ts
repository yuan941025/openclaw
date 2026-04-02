import type { FailureScenarioProfile } from "./agent_types.ts";

const FAILURE_SCENARIO_PROFILES: FailureScenarioProfile[] = [
  {
    scenario_id: "coder_output_missing",
    title: "Coder output missing",
    description: "Simulate the coder losing the implementation bundle before tester handoff.",
    failures: [
      {
        type: "missing_output",
        agent_id: "coder_1",
        artifact: "implementation bundle",
        reason: "simulate coder output loss",
      },
    ],
  },
  {
    scenario_id: "tester_blocked",
    title: "Tester blocked",
    description: "Simulate the tester being blocked during validation so downstream execution cannot continue.",
    failures: [
      {
        type: "blocked_agent",
        agent_id: "tester_1",
        reason: "simulate tester execution block",
      },
    ],
  },
  {
    scenario_id: "research_handoff_broken",
    title: "Research handoff broken",
    description: "Simulate the researcher-to-coder handoff breaking before build work can safely continue.",
    failures: [
      {
        type: "broken_handoff",
        agent_id: "researcher_1",
        artifact: "architecture_notes",
        reason: "simulate broken researcher to coder handoff",
      },
    ],
  },
];

export function getFailureScenarioProfile(
  scenarioId: string,
): FailureScenarioProfile | undefined {
  return FAILURE_SCENARIO_PROFILES.find((profile) => profile.scenario_id === scenarioId);
}

export function listFailureScenarioProfiles(): FailureScenarioProfile[] {
  return FAILURE_SCENARIO_PROFILES.map((profile) => ({
    ...profile,
    failures: profile.failures.map((failure) => ({ ...failure })),
  }));
}
