// Synthetic score pairs, in each endpoint's side-to-move frame. Not claims about these moves.
export const GRADE_PRESENTATION_CASES = [
  { arm: "eval_delta", klass: "inaccuracy", before: "cp 0", after: "cp 28" },
  { arm: "eval_delta", klass: "mistake", before: "cp 0", after: "cp 111" },
  { arm: "eval_delta", klass: "blunder", before: "cp 0", after: "cp 169" },
  { arm: "mate_lost", klass: "inaccuracy", before: "mate 2", after: "cp -1100" },
  { arm: "mate_lost", klass: "mistake", before: "mate 2", after: "cp -999" },
  { arm: "mate_lost", klass: "blunder", before: "mate 2", after: "cp -700" },
  { arm: "mate_allowed", klass: "inaccuracy", before: "cp -1200", after: "mate 2" },
  { arm: "mate_allowed", klass: "mistake", before: "cp -800", after: "mate 2" },
  { arm: "mate_allowed", klass: "blunder", before: "cp 0", after: "mate 2" },
] as const;
