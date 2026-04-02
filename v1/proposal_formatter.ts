import type { ProposalCandidate, ProposalOutput } from "./types.ts";
import { loadLobsterBrain } from "./lobster_brain.ts";

export function formatProposal(candidate: ProposalCandidate): ProposalOutput {
  const brain = loadLobsterBrain();

  return {
    [brain.proposalRules.requiredFields[0]]: candidate.projectName.trim(),
    [brain.proposalRules.requiredFields[1]]: candidate.summary.trim(),
    [brain.proposalRules.requiredFields[2]]: candidate.feasibility,
    [brain.proposalRules.requiredFields[3]]: candidate.returnLevel,
    [brain.proposalRules.requiredFields[4]]: candidate.reason.trim(),
  };
}
