const definitions = {
  "mechanical-objective-placeholder": {
    variables: [],
    statement: "objective.summary is the emitter's mechanical placeholder; an author must replace it with this pack's actual teaching objective before reviewStatus leaves draft",
  },
  "outcome-ungraded": {
    variables: [],
    statement: "The objective transitions on reaching the checkpoint, i.e. on playing the position out. No shipped mechanism grades how it was played out or what happened to the position; adding one is an authored act.",
  },
  "start-assessment-absent": {
    variables: [],
    statement: "The start position is whatever the puzzle's solution produced; it is not asserted to be winning, equal, or better for the learner. No engine or tablebase has evaluated it.",
  },
  "target-elo-authored": {
    variables: [],
    statement: "targetElo clamp [1100, 2000] is an authoring convention, not a Maia capability claim",
  },
  "authored-teaching-absent": {
    variables: [],
    statement: "No authored plan, deviation, or feedback claim exists; a reviewer must add any chess judgement rather than infer one from puzzle metadata.",
  },
  "opponent-policy-authored": {
    variables: ["opponent"],
    statement: "opponent mode {opponent} is an authoring choice that must be reviewed for this convert/hold/save drill",
  },
  "tablebase-opponent-not-selected": {
    variables: ["opponent"],
    statement: "Exact tablebase grading is available for this root and perfect_tablebase is selectable where the provider is published; this draft still requests {opponent}, which can deviate from perfect play",
  },
  "recorded-play-needs-authoring": {
    variables: [],
    statement: "Session-distilled moves are recorded play, not reviewed theory; a human author must judge every line before publication.",
  },
  "mechanical-objective-needs-grounding": {
    variables: [],
    statement: "The mechanical objective and checkpoint are navigation facts, not a chess assessment; replace or ground them before publication.",
  },
};

export const EMITTER_GRADUATION_BLOCKER_TEMPLATES = Object.freeze(Object.fromEntries(
  Object.entries(definitions).map(([id, definition]) => [id, Object.freeze({
    variables: Object.freeze([...definition.variables]),
    statement: definition.statement,
  })]),
));

export const EMITTER_TEMPLATE_IDS = Object.freeze(Object.keys(EMITTER_GRADUATION_BLOCKER_TEMPLATES));

export function emitterGraduationBlocker(id, values = {}) {
  const definition = EMITTER_GRADUATION_BLOCKER_TEMPLATES[id];
  if (definition === undefined) throw new TypeError(`unknown emitter graduation blocker template: ${id}`);
  const supplied = Object.keys(values).sort();
  const expected = [...definition.variables].sort();
  if (supplied.length !== expected.length || supplied.some((name, index) => name !== expected[index])) {
    throw new TypeError(`template ${id} requires variables [${expected.join(", ")}], received [${supplied.join(", ")}]`);
  }
  let statement = definition.statement;
  for (const variable of expected) {
    const value = values[variable];
    if (typeof value !== "string" || value.trim() === "") throw new TypeError(`template ${id} variable ${variable} must be a non-empty string`);
    statement = statement.replaceAll(`{${variable}}`, value);
  }
  return Object.freeze({ id, state: "blocking", statement });
}
