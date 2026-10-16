/** Actual legal modern runs, not manufactured semantic values or provider evidence. */
import { createRun, commitMove } from "../runtime.js";
import { canonicalRunStart } from "../session.js";
import { positionFromFen } from "../chess.js";
import { mirrorSemanticFen, mirrorSemanticUci } from "../semantic-validation.js";
import { RECORDED_SEQUENCE_POSITIVES } from "./recorded-sequence-fixtures.js";
import type { RecordedSequenceRoute } from "../recorded-sequence-window.js";
export const RECORDED_SEQUENCE_AT = "2026-10-16T00:00:00.000Z";
export function recordedSequenceWindowFixture(setup: { readonly fen: string; readonly moves: readonly string[] }, black = false, id = "recorded-sequence-window") {
  const fen = black ? mirrorSemanticFen(setup.fen, "color_and_vertical") : setup.fen;
  let run = createRun({ id, session: { kind: "position", start: canonicalRunStart({ fen, side: positionFromFen(fen).turn }), feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } },
    sessionDigest: `sha256:${"b".repeat(64)}`, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 1, createdAt: RECORDED_SEQUENCE_AT });
  for (const move of setup.moves) run = commitMove(run, black ? mirrorSemanticUci(move, "color_and_vertical") : move, { at: RECORDED_SEQUENCE_AT }).run;
  return run;
}
export function recordedSequenceRouteFixture(route: RecordedSequenceRoute, black = false) {
  const setup = RECORDED_SEQUENCE_POSITIVES.find(value => `${value.projection}@3` === route);
  if (setup === undefined) throw new TypeError("Missing actual sequence fixture");
  return recordedSequenceWindowFixture(setup, black, `${route}-${black}`);
}
