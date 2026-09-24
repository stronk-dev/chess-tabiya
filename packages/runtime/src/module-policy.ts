// rfc/module-registration.md §1 — the one policy authority for the eleven learner modules ([[D3066]]).
// Every non-evidence field of every ModuleDeclaration is written here exactly once. The F1 module
// consumers in `evidence-catalog.ts`, the compiled registry in `module-registry.ts` and the author
// fixtures under `tools/` all derive from this table; none of them restates a capability, a form, a
// role, a timing or a budget. Session ceilings are not written at all: they are derived from the
// shipped WORKFLOW_CONTEXT_POLICIES ([[D1206]]).

import type { AnswerDistance, EvidenceForm, EvidenceRole, EvidenceTiming } from "./evidence-contract.js";
import {
  INSPECTOR_FAMILY_IDS,
  MODULE_IDS,
  moduleAnswerImage,
  moduleEvidenceForms,
  moduleEvidenceTimings,
  type ModuleAnswerContract,
  type ModuleBudgets,
  type ModuleEmptyBehavior,
  type ModuleForm,
  type ModuleId,
  type ModuleSeatClass,
  type ModuleTimingDeclaration,
} from "./module-contract.js";
import { WORKFLOW_CONTEXT_POLICIES, type WorkflowContextPolicy } from "./presets.js";
import type { AssistanceContext } from "./assistance.js";

export interface ModulePolicy {
  readonly id: ModuleId;
  readonly intent: string;
  readonly learnerAction: string;
  readonly timings: readonly ModuleTimingDeclaration[];
  readonly answer: ModuleAnswerContract;
  readonly roles: readonly EvidenceRole[];
  readonly budgets: ModuleBudgets;
  readonly emptyBehavior: ModuleEmptyBehavior;
  readonly seatClass: ModuleSeatClass;
  readonly forms: readonly ModuleForm[];
  readonly noveltyWindow: number;
}

const PLAY_ROLES: readonly EvidenceRole[] = Object.freeze(["learner", "host"]);
const policy = (value: ModulePolicy): ModulePolicy => Object.freeze({
  ...value,
  timings: Object.freeze(value.timings.map((timing) => Object.freeze({ ...timing }))),
  roles: Object.freeze([...value.roles]),
  budgets: Object.freeze({ ...value.budgets }),
  forms: Object.freeze([...value.forms]),
});
const capabilities = (...values: Extract<ModuleAnswerContract, { kind: "capabilities" }>["capabilities"]): ModuleAnswerContract =>
  Object.freeze({ kind: "capabilities" as const, capabilities: Object.freeze(values) });

/**
 * §1.1 (declaration table), §1.2 (roles), §1.4 (intent, learner action, forms), §1.5 (novelty),
 * §2.3(a) (capabilities) and §5.2 (empty behaviour), in MODULE_IDS order.
 */
export const MODULE_POLICIES: readonly ModulePolicy[] = Object.freeze([
  policy({
    id: "rules_floor", intent: "Which moves are legal here, and where does the piece I have picked up go?", learnerAction: "commit a legal move",
    timings: [{ timing: "pre_commit", initiative: "ambient" }], answer: Object.freeze({ kind: "none" }),
    // §1.2 rule 2 exception: both seated Match roles keep legal destinations and the semantic grid.
    roles: ["learner", "host", "participant"],
    budgets: { maxFacts: 0, maxWords: 0, maxMarks: null, maxArrows: 0 }, emptyBehavior: { kind: "silent" },
    seatClass: "board_input", forms: ["square"], noveltyWindow: 0,
  }),
  policy({
    id: "sight_on_request", intent: "What is arithmetically true about the square I selected, right now?", learnerAction: "select another square",
    timings: [{ timing: "pre_commit", initiative: "on_request" }, { timing: "post_commit", initiative: "on_request" }], answer: capabilities("pattern", "candidates"),
    roles: PLAY_ROLES, budgets: { maxFacts: 1, maxWords: 30, maxMarks: 6, maxArrows: 1 },
    emptyBehavior: { kind: "stated_absence", sentence: "No rung-0 observation is scoped to that square." },
    seatClass: "rail", forms: ["sentence", "card", "square", "arrow"], noveltyWindow: 0,
  }),
  policy({
    id: "blunder_prevention", intent: "Does the move I have staged expose something concrete?", learnerAction: "revise or confirm the staged move",
    timings: [{ timing: "at_commit", initiative: "proactive" }], answer: capabilities("threat"),
    roles: PLAY_ROLES, budgets: { maxFacts: 1, maxWords: 20, maxMarks: 1, maxArrows: 1 }, emptyBehavior: { kind: "silent" },
    seatClass: "board_adjacent", forms: ["sentence", "card", "square", "arrow"], noveltyWindow: 0,
  }),
  policy({
    id: "threat_radar", intent: "What can the opponent's pieces do to me from this position?", learnerAction: "open the named threat's fact card",
    timings: [{ timing: "pre_commit", initiative: "on_request" }, { timing: "post_commit", initiative: "on_request" }], answer: capabilities("pattern", "threat"),
    roles: PLAY_ROLES, budgets: { maxFacts: 3, maxWords: 60, maxMarks: 4, maxArrows: 2 },
    emptyBehavior: { kind: "stated_absence", sentence: "No one-ply threat under the declared convention." },
    seatClass: "rail", forms: ["sentence", "card", "square", "arrow"], noveltyWindow: 0,
  }),
  policy({
    id: "postcommit_nudge", intent: "What did the move I just played actually change?", learnerAction: "branch from this move and try the other idea",
    timings: [{ timing: "post_commit", initiative: "proactive" }], answer: capabilities("threat", "evaluation"),
    roles: PLAY_ROLES, budgets: { maxFacts: 2, maxWords: 50, maxMarks: 2, maxArrows: 1 }, emptyBehavior: { kind: "silent" },
    seatClass: "rail", forms: ["sentence", "card", "square", "arrow"], noveltyWindow: 3,
  }),
  policy({
    id: "structure_nudge", intent: "What kind of position is this, and what is that kind generally about?", learnerAction: "open the cited shape entry",
    timings: [{ timing: "post_commit", initiative: "proactive" }], answer: capabilities("theory"),
    roles: PLAY_ROLES, budgets: { maxFacts: 1, maxWords: 80, maxMarks: 4, maxArrows: 0 },
    emptyBehavior: { kind: "stated_absence", sentence: "Nothing recognizes this structure." },
    seatClass: "rail", forms: ["card", "timeline_mark"], noveltyWindow: 3,
  }),
  policy({
    id: "theory_breadcrumb", intent: "Has anyone written about this position, and where?", learnerAction: "open the cited passage",
    timings: [{ timing: "post_commit", initiative: "on_request" }], answer: capabilities("theory"),
    roles: PLAY_ROLES, budgets: { maxFacts: 1, maxWords: 60, maxMarks: 0, maxArrows: 0 },
    emptyBehavior: { kind: "stated_absence", sentence: "Nothing is written about this position." },
    seatClass: "rail", forms: ["sentence", "card"], noveltyWindow: 0,
  }),
  policy({
    id: "guided_hint", intent: "I am stuck — reveal the least that will unstick me.", learnerAction: "request the next rung",
    timings: [{ timing: "checkpoint", initiative: "on_request" }], answer: Object.freeze({ kind: "guided_hint@1" }),
    roles: PLAY_ROLES, budgets: { maxFacts: 1, maxWords: 40, maxMarks: 2, maxArrows: 1 },
    emptyBehavior: { kind: "unavailable_source", sentence: "No engine, tablebase or authored ground covers this position." },
    seatClass: "rail", forms: ["sentence", "square", "arrow"], noveltyWindow: 0,
  }),
  policy({
    id: "compare_coach", intent: "What is the smallest recorded difference between my two attempts?", learnerAction: "enter the other attempt at the divergence",
    timings: [{ timing: "checkpoint", initiative: "on_request" }, { timing: "review", initiative: "on_request" }], answer: capabilities("move", "evaluation"),
    // §1.2: a play timing and a review timing take the narrower role set (Discharge D6).
    roles: PLAY_ROLES, budgets: { maxFacts: 2, maxWords: 60, maxMarks: 2, maxArrows: 2 },
    emptyBehavior: { kind: "stated_absence", sentence: "These attempts do not differ in anything recorded." },
    seatClass: "rail", forms: ["sentence", "card", "arrow"], noveltyWindow: 0,
  }),
  policy({
    id: "review_map", intent: "Where did this run actually turn?", learnerAction: "replay from this moment",
    timings: [{ timing: "review", initiative: "proactive" }], answer: capabilities("threat", "theory", "evaluation"),
    // §1.2 rule 3: a finished run has nothing left to contaminate.
    roles: ["learner", "host", "participant", "spectator"], budgets: { maxFacts: 3, maxWords: 80, maxMarks: 3, maxArrows: 2 },
    emptyBehavior: { kind: "stated_absence", sentence: "No grounded moments were detected in this game." },
    seatClass: "timeline", forms: ["timeline_mark", "card", "sentence", "square", "arrow"], noveltyWindow: 0,
  }),
  policy({
    id: "full_inspector", intent: "Show me everything, attributed.", learnerAction: "open a fact's provenance",
    timings: [{ timing: "review", initiative: "explicit_mode" }], answer: capabilities("threat", "theory", "evaluation", "principal_variation"),
    // §1.2: Maia rows keep the inspector from becoming the bypass for participants and spectators.
    roles: PLAY_ROLES, budgets: { maxFacts: 20, maxWords: 400, maxMarks: 20, maxArrows: 8 },
    emptyBehavior: { kind: "family_partitioned", families: INSPECTOR_FAMILY_IDS },
    seatClass: "explicit_surface", forms: ["panel", "card", "sentence", "square", "arrow"], noveltyWindow: 0,
  }),
]);

if (MODULE_POLICIES.map((value) => value.id).join("|") !== MODULE_IDS.join("|")) throw new TypeError("MODULE_POLICIES must follow MODULE_IDS exactly");

export function modulePolicy(id: ModuleId): ModulePolicy {
  const found = MODULE_POLICIES.find((value) => value.id === id);
  if (found === undefined) throw new TypeError(`Unknown module ${id}`);
  return found;
}

/** §1.2 sessions: exactly the workflow contexts whose shipped `moduleCeiling` contains the module. */
export function moduleSessions(id: ModuleId, contexts: readonly WorkflowContextPolicy[] = WORKFLOW_CONTEXT_POLICIES): readonly string[] {
  return Object.freeze(contexts.filter((context) => context.moduleCeiling.includes(id)).map((context) => context.id));
}

/** §1.2: the one total projection from a runtime assistance role to the evidence role union. */
export function moduleEvidenceRole(role: AssistanceContext["role"]): EvidenceRole {
  switch (role) {
    case "solo": return "learner";
    case "host": return "host";
    case "participant": return "participant";
    case "spectator": return "spectator";
  }
}

/** The F1 consumer ceilings of one module, derived from its policy rather than restated. */
export function moduleConsumerCeilings(id: ModuleId): {
  readonly timing: readonly EvidenceTiming[];
  readonly roles: readonly EvidenceRole[];
  readonly sessions: readonly string[];
  readonly forms: readonly EvidenceForm[];
  readonly answerContent: readonly AnswerDistance[];
  readonly maxFacts: number;
} {
  const value = modulePolicy(id);
  return Object.freeze({
    timing: moduleEvidenceTimings(value),
    roles: value.roles,
    sessions: moduleSessions(id),
    forms: moduleEvidenceForms(value),
    answerContent: moduleAnswerImage(value.answer),
    maxFacts: value.budgets.maxFacts,
  });
}
