export type AgentRole = "researcher" | "coder" | "tester" | "operator";

export type AgentPriority = "high" | "medium" | "low";
export type AgentExecutionStatus = "completed" | "partial" | "failed" | "blocked";

export type RequiredAgent = {
  agent_id: string;
  role: AgentRole;
  purpose: string;
  responsibilities: string[];
  priority: AgentPriority;
};

export type AgentPlan = {
  goal_summary: string;
  required_agents: RequiredAgent[];
  coordination_notes: string[];
  next_step: string;
};

export type AssignedTask = {
  task_id: string;
  title: string;
  description: string;
  depends_on?: string[];
};

export type AssignedAgent = RequiredAgent & {
  assigned_tasks: AssignedTask[];
};

export type AgentHandoff = {
  from_agent_id: string;
  to_agent_id: string;
  artifact: string;
  reason: string;
};

export type AgentAssignmentResult = {
  goal_summary: string;
  agents: AssignedAgent[];
  handoff_flow: AgentHandoff[];
  execution_order: string[];
  next_step: string;
};

export type SubAgentTemplate = {
  agent_id: string;
  role: AgentRole;
  system_profile: {
    identity: string;
    objective: string;
    constraints: string[];
    input_contract: string[];
    output_contract: string[];
    success_criteria: string[];
  };
  task_execution_style: string;
  escalation_rule: string;
};

export type CoordinationPhase = {
  phase_id: string;
  title: string;
  agents_involved: string[];
  required_artifacts: string[];
  completion_condition: string;
};

export type CoordinationHandoffRule = {
  from_agent_id: string;
  to_agent_id: string;
  artifact: string;
  condition: string;
};

export type CoordinationPlan = {
  execution_phases: CoordinationPhase[];
  handoff_rules: CoordinationHandoffRule[];
  final_execution_order: string[];
  coordination_summary: string[];
};

export type TeamMergeResult = {
  goal_summary: string;
  team_plan: {
    required_agents: RequiredAgent[];
    assignment: AgentAssignmentResult;
    sub_agent_templates: SubAgentTemplate[];
    coordination_plan: CoordinationPlan;
  };
  merged_outputs: {
    research_outputs: string[];
    build_outputs: string[];
    validation_outputs: string[];
    operation_outputs: string[];
  };
  final_team_summary: string[];
  next_step: string;
};

export type AgentExecutionBundle = {
  agent_id: string;
  role: AgentRole;
  profile_summary: string;
  assigned_tasks: AssignedTask[];
  required_inputs: string[];
  expected_outputs: string[];
  handoff_target?: string;
  execution_notes: string[];
};

export type AgentExecutionBundleExport = {
  goal_summary: string;
  bundles: AgentExecutionBundle[];
};

export type AgentExecutionResult = {
  agent_id: string;
  role: AgentRole;
  status: AgentExecutionStatus;
  output_summary: string[];
  produced_artifacts: string[];
  blockers: string[];
  next_handoff?: {
    to_agent_id: string;
    artifact: string;
  }[];
};

export type TeamExecutionSimulation = {
  execution_order: string[];
  simulated_agent_results: AgentExecutionResult[];
  simulation_summary: string[];
};

export type TeamExecutionReceipt = {
  team_status: "completed" | "partial" | "failed";
  agent_statuses: {
    agent_id: string;
    role: AgentRole;
    status: AgentExecutionStatus;
  }[];
  completed_agents: string[];
  blocked_agents: string[];
  failed_agents: string[];
  produced_artifacts_summary: string[];
  routing_notes: string[];
};

export type AgentFeedbackRouting = {
  retry_agents: string[];
  skip_agents: string[];
  prioritized_agents: string[];
  feedback_summary: string[];
  next_team_step: string;
};

export type TeamBundleValidation = {
  bundle_validation_status: "valid" | "partial" | "invalid";
  checked_agents: {
    agent_id: string;
    expected_outputs: string[];
    downstream_required_inputs: string[];
    matched_outputs: string[];
    missing_outputs: string[];
  }[];
  validation_summary: string[];
};

export type HandoffConsistencyResult = {
  handoff_status: "consistent" | "partial" | "inconsistent";
  checked_handoffs: {
    from_agent_id: string;
    to_agent_id: string;
    artifact: string;
    exists_in_outputs: boolean;
    exists_in_required_inputs: boolean;
  }[];
  inconsistency_notes: string[];
};

export type TeamReplayResult = {
  replay_order: string[];
  replay_steps: {
    step_id: string;
    agent_id: string;
    consumed_inputs: string[];
    produced_outputs: string[];
    status: "replayed" | "blocked";
  }[];
  replay_summary: string[];
};

export type TeamReplayReceipt = {
  replay_status: "completed" | "partial" | "failed";
  replayed_agents: string[];
  blocked_agents: string[];
  produced_artifacts: string[];
  replay_validation_notes: string[];
  next_feedback_target: string[];
};

export type AgentLoopPreview = {
  next_cycle_agents_to_skip: string[];
  next_cycle_agents_to_retry: string[];
  next_cycle_agents_to_prioritize: string[];
  loop_preview_summary: string[];
  next_team_goal_hint: string;
};

export type ReplayFailureInjection = {
  type: "missing_output" | "broken_handoff" | "blocked_agent";
  agent_id?: string;
  artifact?: string;
  reason: string;
};

export type FailureScenarioProfile = {
  scenario_id: string;
  title: string;
  description: string;
  failures: ReplayFailureInjection[];
};

export type DegradedReplayResult = {
  injected_failures: ReplayFailureInjection[];
  degraded_replay_order: string[];
  degraded_replay_steps: {
    step_id: string;
    agent_id: string;
    status: "replayed" | "blocked" | "degraded";
    failure_reason?: string;
  }[];
  degraded_summary: string[];
};

export type DegradedReplayReceipt = {
  degraded_status: "completed" | "partial" | "failed";
  degraded_agents: string[];
  blocked_agents: string[];
  broken_handoffs: string[];
  degraded_artifacts: string[];
  degradation_notes: string[];
  next_repair_targets: string[];
};

export type RepairRouting = {
  retry_agents: string[];
  prioritize_agents: string[];
  isolate_agents: string[];
  repair_actions: string[];
  repair_summary: string[];
  next_repair_step: string;
};

export type TeamRecoveryPreview = {
  recovery_order: string[];
  agents_to_retry: string[];
  agents_to_skip: string[];
  agents_to_prioritize: string[];
  recovery_summary: string[];
  next_team_goal_hint: string;
};

export type TeamLoopBridge = {
  self_build_goal: string;
  derived_team_goal: string;
  team_bridge_status: "linked" | "partial";
  mapped_team_focus: string[];
  bridge_notes: string[];
  next_joint_step: string;
};

export type ExecutorContract = {
  executable_agents: {
    agent_id: string;
    role: AgentRole;
    allowed_execution_mode: "internal_only" | "external_ready" | "approval_required";
    executable_bundle_summary: string[];
    required_receipt_fields: string[];
  }[];
  team_executor_contract: {
    contract_version: string;
    accepted_roles: AgentRole[];
    required_bundle_fields: string[];
    receipt_schema_ref: string;
  };
  contract_summary: string[];
};

export type ActionBoundaryResult = {
  allowed_actions: {
    action_type: string;
    approval_level: "none" | "user_required" | "blocked";
    reason: string;
  }[];
  blocked_actions: {
    action_type: string;
    reason: string;
  }[];
  boundary_notes: string[];
};

export type ExternalExecutorReceipt = {
  agent_id: string;
  role: AgentRole;
  status: AgentExecutionStatus;
  action_type: string;
  action_summary: string[];
  produced_artifacts: string[];
  consumed_inputs: string[];
  safety_notes: string[];
  boundary_result: "allowed" | "approval_required" | "blocked";
};

export type ExternalFeedbackBridge = {
  receipt_status: string;
  mapped_team_feedback: {
    retry_agents: string[];
    skip_agents: string[];
    prioritize_agents: string[];
  };
  mapped_self_build_feedback: {
    capability_hints: string[];
    risk_flags: string[];
  };
  bridge_summary: string[];
  next_bridge_step: string;
};

export type MonetizationLanePreview = {
  monetization_lane: {
    lane_id: string;
    title: string;
    target_customer: string;
    offer_type: string;
    preparation_steps: string[];
    agent_roles_involved: AgentRole[];
    approval_points: string[];
    blocked_points: string[];
  };
  lane_summary: string[];
  next_revenue_step: string;
};

export type ApprovalGateContract = {
  approval_gate: {
    approval_required_actions: {
      action_type: string;
      required_review_fields: string[];
      decision_type: string;
    }[];
    auto_allowed_actions: string[];
    blocked_actions: string[];
  };
  gate_summary: string[];
};

export type OutboundReviewPackResult = {
  review_packs: {
    review_id: string;
    action_type: string;
    source_agent_id: string;
    target_channel: string;
    target_audience: string;
    content_preview: string[];
    linked_offer_type?: string;
    linked_quote_summary?: string[];
    safety_notes: string[];
    approval_required: boolean;
  }[];
  review_summary: string[];
  next_review_step: string;
};

export type ApprovalDecisionContract = {
  decision_schema: {
    allowed_decisions: ("approve" | "reject" | "revise")[];
    required_fields: string[];
    optional_fields: string[];
  };
  decisions: {
    review_id: string;
    action_type: string;
    source_agent_id: string;
    decision: "approve" | "reject" | "revise";
    decision_source?: "default" | "override";
    decision_notes: string[];
    revised_content?: string[];
  }[];
  decision_summary: string[];
};

export type ControlledOutboundSimulation = {
  simulated_actions: {
    review_id: string;
    action_type: string;
    source_agent_id: string;
    decision: "approve" | "reject" | "revise";
    simulation_status: "executed" | "rejected" | "revision_requested" | "blocked";
    produced_artifacts: string[];
    result_notes: string[];
  }[];
  simulation_summary: string[];
  next_outbound_step: string;
};

export type OutboundReceipt = {
  outbound_status: "completed" | "partial" | "failed";
  action_receipts: {
    review_id: string;
    action_type: string;
    source_agent_id: string;
    decision: "approve" | "reject" | "revise";
    execution_status: "executed" | "rejected" | "revision_requested" | "blocked";
    produced_artifacts: string[];
    safety_notes: string[];
  }[];
  completed_actions: string[];
  blocked_actions: string[];
  rejected_actions: string[];
  receipt_summary: string[];
};

export type ApprovalReviewSession = {
  review_session: {
    session_id: string;
    review_ids: string[];
    source_agent_ids: string[];
    action_types: string[];
    session_status: "open" | "approved" | "rejected" | "revise_required" | "mixed";
    created_from_goal: string;
  };
  session_summary: string[];
};

export type DecisionReplay = {
  session_id: string;
  decision_history: {
    replay_id: string;
    review_id: string;
    decision: "approved" | "rejected" | "revise_required";
    decision_notes: string[];
    revision_round: number;
  }[];
  replay_summary: string[];
};

export type SessionReceipt = {
  session_receipt: {
    session_id: string;
    final_session_status: "approved" | "partial" | "rejected";
    approved_reviews: string[];
    revise_required_reviews: string[];
    rejected_reviews: string[];
    session_notes: string[];
  };
};

export type OutboundSafetyLedger = {
  safety_ledger: {
    ledger_id: string;
    session_id: string;
    recorded_actions: {
      review_id: string;
      action_type: string;
      boundary_result: string;
      decision: string;
      execution_mode: string;
    }[];
    safety_flags: string[];
    ledger_summary: string[];
  };
};

export type ApprovalOutboundBridge = {
  outbound_bridge: {
    session_id: string;
    executable_reviews: string[];
    blocked_reviews: string[];
    pending_reviews: string[];
    bridge_status: "ready" | "partial" | "blocked";
  };
  bridge_summary: string[];
  next_executor_step: string;
};

export type RevenueLaneSessionMap = {
  lane_session_map: {
    lane_id: string;
    session_id: string;
    mapped_action_types: string[];
    mapped_offer_type: string;
    mapped_target_customer: string;
  };
  mapping_summary: string[];
};

export type ConversionStagePreview = {
  conversion_stage_preview: {
    current_stage: "lead_preparation" | "quote_preparation" | "approval_gate" | "outbound_ready" | "reply_wait";
    completed_stages: string[];
    next_stage: string;
    stage_notes: string[];
  };
};

export type ReplyIntakeContract = {
  reply_intake_contract: {
    reply_id: string;
    source_channel: string;
    sender_type: "lead" | "customer" | "unknown";
    reply_type: "interest" | "question" | "quote_request" | "rejection" | "unknown";
    reply_summary: string[];
    linked_session_id?: string;
  };
};

export type ReplyFeedbackBridge = {
  reply_feedback_bridge: {
    team_feedback: {
      retry_agents: string[];
      skip_agents: string[];
      prioritize_agents: string[];
    };
    monetization_feedback: {
      revenue_signals: string[];
      next_offer_action: string[];
    };
    self_build_feedback: {
      capability_hints: string[];
      risk_flags: string[];
    };
    bridge_summary: string[];
    next_reply_step: string;
  };
};

export type ControlledFollowupPreview = {
  followup_preview: {
    followup_id: string;
    linked_session_id: string;
    suggested_action_type: "prepare_message" | "prepare_quote" | "prepare_followup_note";
    followup_content_preview: string[];
    approval_required: boolean;
  };
  followup_summary: string[];
  next_followup_step: string;
};

export type RevenueLoopPreview = {
  revenue_loop_preview: {
    lane_id: string;
    session_id: string;
    current_cycle_status: "preparing" | "awaiting_approval" | "awaiting_reply" | "followup_ready";
    revenue_signals: string[];
    next_controlled_action: string;
    loop_notes: string[];
  };
  loop_summary: string[];
  next_revenue_loop_step: string;
};

export type ApprovalInputSurface = {
  input_surface: {
    supported_decisions: ("approved" | "rejected" | "revise_required")[];
    required_fields: string[];
    optional_fields: string[];
    supported_targets: ("review_pack" | "approval_session")[];
  };
  surface_summary: string[];
};

export type HumanDecisionPayload = {
  decision_payload: {
    actor_id: string;
    review_id: string;
    decision: "approved" | "rejected" | "revise_required";
    decision_notes: string[];
    revision_round?: number;
    target_type: "review_pack" | "approval_session";
  };
  ingress_validation: {
    valid: boolean;
    issues: string[];
  };
  ingress_summary: string[];
};

export type SessionDecisionIngestResult = {
  session_ingest_result: {
    session_id: string;
    ingested_reviews: string[];
    updated_decisions: string[];
    ingest_status: "applied" | "partial" | "rejected";
  };
  ingest_notes: string[];
};

export type ReviewOverrideUpdate = {
  override_update: {
    review_id: string;
    previous_decision?: string;
    new_decision: string;
    update_status: "updated" | "created" | "rejected";
  };
  update_summary: string[];
};

export type ApprovalStateMachineResult = {
  state_machine_result: {
    session_id: string;
    previous_status: string;
    current_status: "open" | "approved" | "rejected" | "revise_required" | "mixed";
    transition_reason: string;
  };
  state_summary: string[];
};

export type RevisionNoteBridgeResult = {
  revision_bridge: {
    review_id: string;
    revision_notes_applied: string[];
    target_pack_updated: boolean;
  }[];
  bridge_summary: string[];
  next_revision_step: string;
};

export type DecisionAuditTrail = {
  audit_trail: {
    audit_id: string;
    actor_id: string;
    review_id: string;
    decision: string;
    revision_round?: number;
    timestamp_label: string;
  }[];
  audit_summary: string[];
};

export type ApprovalWorkQueue = {
  approval_queue: {
    pending_reviews: string[];
    approved_reviews: string[];
    rejected_reviews: string[];
    revise_required_reviews: string[];
  };
  queue_summary: string[];
  next_queue_action: string;
};

export type DecisionOutcomePreview = {
  outcome_preview: {
    expected_session_status: string;
    expected_outbound_status: string;
    expected_revenue_cycle_status: string;
  };
  outcome_summary: string[];
  next_decision_step: string;
};

export type BatchApprovalInputSurface = {
  batch_input_surface: {
    supported_batch_size: number;
    supported_decisions: ("approved" | "rejected" | "revise_required")[];
    batch_required_fields: string[];
    batch_optional_fields: string[];
  };
  batch_surface_summary: string[];
};

export type BatchDecisionIngress = {
  batch_decision_payloads: {
    actor_id: string;
    review_id: string;
    decision: "approved" | "rejected" | "revise_required";
    decision_notes: string[];
    revision_round?: number;
    target_type: "review_pack" | "approval_session";
  }[];
  batch_ingress_validation: {
    valid: boolean;
    issues: string[];
  };
  batch_ingress_summary: string[];
};

export type BatchSessionDecisionIngestResult = {
  batch_session_ingest_result: {
    session_id: string;
    ingested_reviews: string[];
    rejected_reviews: string[];
    ingest_status: "applied" | "partial" | "rejected";
  };
  batch_ingest_notes: string[];
};

export type BatchApprovalStateMachineResult = {
  batch_state_machine_result: {
    session_id: string;
    previous_status: string;
    current_status: "open" | "approved" | "rejected" | "revise_required" | "mixed";
    approved_reviews: string[];
    rejected_reviews: string[];
    revise_required_reviews: string[];
    transition_reason: string;
  };
  batch_state_summary: string[];
};

export type BatchRevisionQueue = {
  revision_queue: {
    review_id: string;
    revision_round: number;
    revision_notes: string[];
    source_actor_id: string;
  }[];
  revision_queue_summary: string[];
  next_revision_batch_step: string;
};

export type BatchAuditTrail = {
  batch_audit_trail: {
    audit_id: string;
    actor_id: string;
    review_id: string;
    decision: string;
    revision_round?: number;
    timestamp_label: string;
  }[];
  batch_audit_summary: string[];
};

export type BatchOutcomePreview = {
  batch_outcome_preview: {
    expected_session_status: string;
    expected_outbound_status: string;
    expected_revenue_cycle_status: string;
    reviews_ready_for_next_step: string[];
  };
  batch_outcome_summary: string[];
  next_batch_decision_step: string;
};

export type BatchApprovalCycleReplay = {
  batch_cycle_replay: {
    replay_id: string;
    processed_reviews: string[];
    replay_status: "completed" | "partial" | "failed";
  };
  replay_cycle_summary: string[];
};

export type FollowupDecisionBridge = {
  followup_decision_bridge: {
    allowed_followups: string[];
    blocked_followups: string[];
    pending_followups: string[];
  };
  followup_bridge_summary: string[];
  next_followup_decision_step: string;
};

export type ApprovalActorRole =
  | "reviewer"
  | "senior_reviewer"
  | "approver"
  | "operator_reviewer";

export type ApprovalAuthorityLevel = "standard" | "elevated" | "final";

export type ApprovalActorRegistry = {
  actor_registry: {
    actor_id: string;
    actor_role: ApprovalActorRole;
    supported_actions: string[];
    authority_level: ApprovalAuthorityLevel;
  }[];
  registry_summary: string[];
};

export type ActorOwnershipContract = {
  ownership_contract: {
    review_id: string;
    primary_actor_id: string;
    backup_actor_id?: string;
    ownership_reason: string;
  }[];
  ownership_summary: string[];
};

export type SessionAssignmentRoutes = {
  assignment_routes: {
    review_id: string;
    assigned_actor_id: string;
    route_status: "assigned" | "escalated" | "deferred";
  }[];
  route_summary: string[];
  next_assignment_step: string;
};

export type ReviewEscalations = {
  escalations: {
    review_id: string;
    from_actor_id: string;
    to_actor_id: string;
    escalation_reason: string;
  }[];
  escalation_summary: string[];
};

export type ApprovalQueuePartition = {
  queue_partitions: {
    actor_id: string;
    pending_reviews: string[];
    escalated_reviews: string[];
    final_reviews: string[];
  }[];
  partition_summary: string[];
  next_queue_partition_step: string;
};

export type ActorDecisionAudit = {
  actor_audit_trail: {
    actor_id: string;
    review_id: string;
    action: string;
    authority_level: string;
    audit_label: string;
  }[];
  actor_audit_summary: string[];
};

export type SessionReassignment = {
  reassignment_result: {
    review_id: string;
    previous_actor_id?: string;
    new_actor_id: string;
    reassignment_status: "reassigned" | "taken_over" | "unchanged";
  }[];
  reassignment_summary: string[];
  next_reassignment_step: string;
};

export type MultiActorOutcomeMerge = {
  merged_actor_outcomes: {
    session_id: string;
    involved_actors: string[];
    merged_status: "approved" | "partial" | "rejected" | "mixed";
    approved_reviews: string[];
    rejected_reviews: string[];
    revise_required_reviews: string[];
  };
  merge_summary: string[];
  next_merge_step: string;
};

export type RealExecutionPrepContract = {
  real_execution_prep: {
    session_id: string;
    ready_reviews: string[];
    not_ready_reviews: string[];
    prep_status: "ready" | "partial" | "blocked";
    readiness_requirements: string[];
  };
  prep_summary: string[];
  next_real_execution_step: string;
};

export type ActorReassignmentReplay = {
  reassignment_replay: {
    session_id: string;
    replay_steps: {
      review_id: string;
      previous_actor_id?: string;
      new_actor_id: string;
      replay_status: "reassigned" | "taken_over" | "unchanged";
    }[];
    replay_summary: string[];
  };
};

export type EscalationHistory = {
  escalation_history: {
    session_id: string;
    escalated_reviews: {
      review_id: string;
      from_actor_id: string;
      to_actor_id: string;
      escalation_reason: string;
    }[];
    history_summary: string[];
  };
};

export type QueuePartitionReplay = {
  queue_replay: {
    actor_id: string;
    replayed_pending: string[];
    replayed_escalated: string[];
    replayed_final: string[];
  }[];
  queue_replay_summary: string[];
  next_queue_replay_step: string;
};

export type ActorReadinessSnapshot = {
  readiness_snapshot: {
    actor_id: string;
    ready_reviews: string[];
    blocked_reviews: string[];
    readiness_status: "ready" | "partial" | "blocked";
  }[];
  readiness_summary: string[];
};

export type ActorTransitionTimeline = {
  transition_timeline: {
    timeline_id: string;
    review_id: string;
    transitions: string[];
  }[];
  timeline_summary: string[];
};

export type MultiActorSessionReceipt = {
  multi_actor_session_receipt: {
    session_id: string;
    involved_actors: string[];
    ready_reviews: string[];
    blocked_reviews: string[];
    escalated_reviews: string[];
    receipt_status: "ready" | "partial" | "blocked";
  };
  receipt_summary: string[];
};

export type PrepContractRevalidation = {
  prep_revalidation: {
    session_id: string;
    revalidated_ready_reviews: string[];
    revalidated_not_ready_reviews: string[];
    revalidation_status: "valid" | "partial" | "invalid";
  };
  revalidation_summary: string[];
  next_revalidation_step: string;
};

export type ExecutionHandoffClosure = {
  execution_handoff_closure: {
    session_id: string;
    handoff_ready_reviews: string[];
    handoff_blocked_reviews: string[];
    closure_status: "closed_ready" | "partial" | "blocked";
    closure_requirements: string[];
  };
  closure_summary: string[];
  next_handoff_step: string;
};

export type PreExecutionClosureReport = {
  closure_report: {
    session_id: string;
    final_ready_reviews: string[];
    remaining_blockers: string[];
    overall_status: "ready" | "partial" | "blocked";
  };
  report_summary: string[];
  next_real_world_step: string;
};

export type LeadStage =
  | "lead_open"
  | "message_sent"
  | "reply_received"
  | "followup_ready"
  | "quote_ready"
  | "won"
  | "lost";

export type RuntimeGuardrails = {
  guardrails: {
    safe_mode: boolean;
    approval_required: boolean;
    allowed_channels: string[];
    blocked_actions: string[];
    max_outbound_per_run: number;
  };
  guardrail_summary: string[];
};

export type KillSwitchState = {
  kill_switch: {
    is_enabled: boolean;
    reason?: string;
  };
  kill_switch_summary: string[];
};

export type RuntimeSessionState = {
  runtime_session: {
    session_id: string;
    outbound_count: number;
    last_outbound_review_id?: string;
    last_reply_id?: string;
    current_lead_stage: LeadStage;
  };
  runtime_summary: string[];
};

export type TelegramOutboundBridgeResult = {
  outbound_bridge_result: {
    channel: "telegram";
    target_id: string;
    message_text: string;
    send_status: "sent" | "blocked" | "dry_run_failed";
    platform_message_id?: string;
  };
  outbound_bridge_summary: string[];
};

export type RealExecutionBridgeResult = {
  real_execution_result: {
    review_id: string;
    channel: string;
    execution_mode: "real";
    status: "executed" | "blocked" | "failed";
    receipt_ref: string;
  };
  execution_summary: string[];
};

export type RealExecutorReceipt = {
  real_receipt: {
    receipt_id: string;
    review_id: string;
    channel: string;
    execution_status: "sent" | "blocked" | "failed";
    sent_artifacts: string[];
    safety_notes: string[];
    runtime_stage_update: string;
  };
  receipt_summary: string[];
};

export type TelegramReplyIntake = {
  telegram_reply_intake: {
    reply_id: string;
    source_channel: "telegram";
    source_user_id: string;
    message_text: string;
    reply_type: "interest" | "question" | "quote_request" | "rejection" | "unknown";
  };
  reply_intake_summary: string[];
};

export type RealFollowupResult = {
  followup_result: {
    linked_reply_id: string;
    followup_action_type: "prepare_message" | "prepare_quote";
    followup_preview: string[];
    followup_status: "ready_for_approval" | "blocked";
  };
  followup_summary: string[];
};

export type LeadStageResult = {
  lead_stage_result: {
    previous_stage: string;
    current_stage: LeadStage;
    transition_reason: string;
  };
  lead_stage_summary: string[];
};

export type RealOrderFlowResult = {
  order_flow_result: {
    session_id: string;
    outbound_review_id: string;
    real_receipt_id: string;
    reply_id?: string;
    lead_stage: string;
    flow_status:
      | "outbound_sent"
      | "reply_received"
      | "followup_ready"
      | "quote_ready"
      | "lost"
      | "blocked";
  };
  flow_summary: string[];
  next_order_step: string;
};
