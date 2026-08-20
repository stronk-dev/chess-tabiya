// DISPOSABLE planning research registry — D639. Not product or RFC authority.

export type ResearchState = "done" | "partial_external" | "external_ready" | "blocked";

export interface ResearchTruth {
  readonly id: `R${number}`;
  readonly state: ResearchState;
  readonly sufficientFor: string;
  readonly missing: string;
}

export const RESEARCH_TRUTH = Object.freeze([
  { id: "R1", state: "done", sufficientFor: "evidence-plane and detector-grounding architecture", missing: "consumer-specific learner admission remains R3/R7" },
  { id: "R2", state: "done", sufficientFor: "local selector, sign boundary, budgets and abstention architecture", missing: "exact UX defaults remain R3" },
  { id: "R3", state: "partial_external", sufficientFor: "module/preset/workflow candidate contract", missing: "12 nontechnical participant sessions across desktop, phone and keyboard" },
  { id: "R4", state: "done", sufficientFor: "deterministic provenance compiler and exact/FTS runtime candidate", missing: "theory workflow choice remains R8" },
  { id: "R5", state: "done", sufficientFor: "LLM-as-optional-renderer boundary", missing: "learner wording comprehension is downstream, not authority" },
  { id: "R6", state: "done", sufficientFor: "pack compatibility/migration contract and negative Gate-F result", missing: "owner budget and primitive-complete pilot remain O6/R8/R10" },
  { id: "R7", state: "blocked", sufficientFor: "nothing yet", missing: "R3 participant-valid evidence packet, then Review Map/re-entry study" },
  { id: "R8", state: "blocked", sufficientFor: "nothing yet", missing: "R3 participant result, then theory-to-drill workflow study" },
  { id: "R9", state: "external_ready", sufficientFor: "preregistered learner/coach protocol only", missing: "recruited novice/intermediate learners and coaches" },
  { id: "R10", state: "blocked", sufficientFor: "nothing yet", missing: "playable official pilot plus R3/R8" },
  { id: "R11", state: "partial_external", sufficientFor: "layered bot-policy candidate and blind packet", missing: "at least five reviewers and three independent judgements per branch" },
  { id: "R12", state: "partial_external", sufficientFor: "12 literal short-session metrics and rejection of natural archetypes", missing: "longitudinal transfer before persistent coaching use" },
  { id: "R13", state: "blocked", sufficientFor: "nothing yet", missing: "R7 Review Map semantics plus R12 longitudinal population" },
  { id: "R14", state: "blocked", sufficientFor: "preregistered owner campaign protocol only", missing: "exact board interaction and an admitted real R3 packet" },
  { id: "R15", state: "blocked", sufficientFor: "nothing yet", missing: "R3/R7 plus coach participants" },
  { id: "R16", state: "blocked", sufficientFor: "nothing yet", missing: "R3/R7 composed broadcast-view study" },
  { id: "R17", state: "blocked", sufficientFor: "nothing yet", missing: "R11/R15 plus trust, clocks, moderation and adapter cost" },
  { id: "R18", state: "partial_external", sufficientFor: "Choice-C release architecture and F12 drafting input", missing: "physical-device and screen-reader participant proof for release acceptance" },
  { id: "R19", state: "blocked", sufficientFor: "nothing for 1.0", missing: "R17 scope decision and explicit post-1.0 promotion" },
] as const satisfies readonly ResearchTruth[]);

export type CandidateReadiness = "research_ready_process_blocked" | "research_ready_intent_blocked" | "research_blocked";

export const RFC_READINESS = Object.freeze([
  { id: "F1", state: "research_ready_process_blocked", reason: "A0-A4 and O1 are complete; protected intent amendment plus shared-register/lifecycle resolution remain" },
  { id: "F2", state: "research_blocked", reason: "O2 learner-family admission remains partial and F1 must be accepted first" },
  { id: "F3", state: "research_blocked", reason: "O6 waits on R8/R10 and F1" },
  { id: "F4", state: "research_blocked", reason: "R8/O5 and F1/F3 remain" },
  { id: "F5", state: "research_blocked", reason: "R3 participant exit and exact O4 defaults remain; F2 first" },
  { id: "F6", state: "research_blocked", reason: "R7/O7 have not run" },
  { id: "F7", state: "research_blocked", reason: "R8/R10/O6 plus F3/F4/F5 remain" },
  { id: "F8", state: "research_blocked", reason: "R11 human review and O8 remain" },
  { id: "F9", state: "research_blocked", reason: "R12 longitudinal/R13 and O9 remain" },
  { id: "F10", state: "research_blocked", reason: "R14/O10 and F5/F7/F8/F9 remain" },
  { id: "F11", state: "research_blocked", reason: "R15-R17 and O11/O12 remain" },
  { id: "F12", state: "research_ready_intent_blocked", reason: "R18 architecture and O13 Choice C are complete; protected design amendment remains, participant proof belongs to acceptance" },
] as const);

