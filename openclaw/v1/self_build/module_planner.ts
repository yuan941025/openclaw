import type {
  GapAnalysis,
  MissingCapability,
  ModulePlan,
  ModulePriority,
  ProposedModule,
} from "./self_build_types.ts";

const MODULE_BLUEPRINTS: Record<
  MissingCapability,
  {
    name: string;
    purpose: string;
  }
> = {
  "self-build loop": {
    name: "Self-Build Loop Core",
    purpose:
      "Let Lobster interpret a goal, inspect its own gaps, and queue the next capability build cycle.",
  },
  "agent planner": {
    name: "Agent Planner Core",
    purpose:
      "Turn high-level self-build goals into agent-sized modules, execution batches, and ownership boundaries.",
  },
  "execution feedback loop": {
    name: "Execution Feedback Loop",
    purpose:
      "Capture build outcomes, compare them with the goal, and feed the signal back into the next planning step.",
  },
  "external action layer": {
    name: "External Action Layer",
    purpose:
      "Bridge approved plans into controlled external actions without turning the system into autonomous execution.",
  },
};

function priorityByIndex(index: number): ModulePriority {
  if (index <= 1) {
    return "high";
  }
  if (index === 2) {
    return "medium";
  }
  return "low";
}

export function planModules(gapAnalysis: GapAnalysis): ModulePlan {
  const proposedModules: ProposedModule[] = gapAnalysis.missing_capabilities.map((capability, index) => {
    const blueprint = MODULE_BLUEPRINTS[capability];

    return {
      name: blueprint.name,
      purpose: blueprint.purpose,
      priority: priorityByIndex(index),
    };
  });

  return {
    proposed_modules: proposedModules,
    build_order: proposedModules.map((module) => module.name),
  };
}
