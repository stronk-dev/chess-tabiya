import { normalizeMove } from "chessops/chess";
import { parseSquare, parseUci } from "chessops/util";
import { expect, it } from "vitest";
import { canonicalFen, positionFromFen } from "./chess.js";
import { CANDIDATE_EVENTS_SCOPE, candidatePlayedRow, compileCandidatePopulation } from "./candidate-population.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { evidenceForConsumer } from "./evidence-contract.js";
import { presentEvidenceItems } from "./presentation-contract.js";
import { localSemanticEventClosure } from "./semantic-evidence.js";
import { transitionSemanticFacts } from "./transition.js";
import { OCCUPIED_TARGET_IDENTITY_CASES } from "./testing/occupied-target-fixtures.js";

it.each(OCCUPIED_TARGET_IDENTITY_CASES)("D3762 retains exact target identity through facts, factories, candidates and rendering: $name", value => {
  const before = positionFromFen(value.fen);
  const move = normalizeMove(before, parseUci(value.uci)!);
  expect(before.isLegal(move)).toBe(true);
  const originalTarget = before.board.get(parseSquare(value.target)!);
  before.play(move);
  const afterFen = canonicalFen(before);
  expect(before.board.get(parseSquare(value.target)!)).toMatchObject({ role: value.sign === null ? "king" : "bishop", color: value.side });
  expect(originalTarget?.role).toBe(value.sign === null ? "rook" : "bishop");
  const facts = transitionSemanticFacts(value.fen, value.uci, afterFen).filter(fact => fact.family === "occupied_defence" && fact.subject.target === value.target);
  if (value.sign === null) expect(facts).toEqual([]);
  else expect(facts).toContainEqual(expect.objectContaining({ sign: value.sign, subject: { color: value.side, target: value.target, occupant: { color: value.side, role: "bishop" } } }));

  const closure = localSemanticEventClosure(value.fen, value.uci, afterFen);
  const events = closure.events.filter(event => event.projection.id === "rules.transition.event.occupied_defence" && (event.operands as { subject: { target: string } }).subject.target === value.target);
  expect(events.length).toBe(value.sign === null ? 0 : 1);
  const compiled = compileCandidatePopulation({ beforeFen: value.fen, ruleset: "standard", scope: CANDIDATE_EVENTS_SCOPE });
  if (compiled.kind !== "ready") throw new Error(`candidate source unavailable: ${compiled.error.code}`);
  const selected = candidatePlayedRow(compiled.receipt, value.uci);
  expect(selected.events.filter(event => event.projection.id === "rules.transition.event.occupied_defence" && (event.operands as { subject: { target: string } }).subject.target === value.target)).toEqual(events);
  const rendered = presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "module.review_map", version: 1 }, events.map(event => event.evidence)));
  expect(rendered.length).toBe(value.sign === null ? 0 : 1);
});
