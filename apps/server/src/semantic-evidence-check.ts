import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

import { Chess, normalizeMove } from "chessops/chess";
import { INITIAL_FEN, parseFen } from "chessops/fen";
import { parseUci } from "chessops/util";

import { EVIDENCE_ADAPTERS, EVIDENCE_CONSUMERS, EVIDENCE_ELIGIBILITY_DECLARATIONS, EVIDENCE_PRODUCERS, EVIDENCE_REASON_DECLARATIONS, EVIDENCE_SELECTION_POLICIES, SEMANTIC_EVENT_PROJECTION_IDS, CANDIDATE_EVENTS_SCOPE, candidateAlternatives, canonicalFen, compileCandidatePopulation, selectLocalSemanticEvidence } from "@chess-tabiya/runtime";

import { EVIDENCE_MANIFEST } from "./evidence-manifest.js";

const tuple = [EVIDENCE_MANIFEST.producers.length, EVIDENCE_MANIFEST.projections.length, EVIDENCE_MANIFEST.consumers.length, EVIDENCE_MANIFEST.bindings.length, EVIDENCE_MANIFEST.semanticEvents.length, EVIDENCE_MANIFEST.eligibility.length, EVIDENCE_MANIFEST.reasons.length, EVIDENCE_MANIFEST.selectionPolicies.length];
const declaredTuple = [EVIDENCE_PRODUCERS.length, EVIDENCE_PRODUCERS.flatMap((producer) => producer.outputs).length, EVIDENCE_CONSUMERS.length, EVIDENCE_ADAPTERS.length, SEMANTIC_EVENT_PROJECTION_IDS.length, EVIDENCE_ELIGIBILITY_DECLARATIONS.length, EVIDENCE_REASON_DECLARATIONS.length, EVIDENCE_SELECTION_POLICIES.length];
if (tuple.join("/") !== declaredTuple.join("/")) throw new TypeError(`Semantic evidence compiler dropped a declaration: compiled ${tuple.join("/")}, declared ${declaredTuple.join("/")}`);

const position = Chess.fromSetup(parseFen(INITIAL_FEN).unwrap()).unwrap();
const move = normalizeMove(position, parseUci("e2e4")!);
position.play(move);
const selected = selectLocalSemanticEvidence({ id: "research.r2_candidate", version: 1 }, { beforeFen: INITIAL_FEN, moveUci: "e2e4", afterFen: canonicalFen(position) });
// Contract instrument, not a product consumer (rfc/shared-candidate-evidence-packet.md §5.4/§6.0):
// the selection's population is asserted set-equal to the compiled packet's alternatives rather
// than to two baked integers.
const packet = compileCandidatePopulation({ beforeFen: INITIAL_FEN, ruleset: "standard", scope: CANDIDATE_EVENTS_SCOPE });
if (packet.kind !== "ready") throw new TypeError(`Candidate packet did not compile: ${packet.error.code}`);
const alternatives = new Set(candidateAlternatives(packet.receipt, "e2e4").map((row) => row.moveUci));
const legal = new Set(packet.receipt.packet.legalMoves.map((move) => move.uci).filter((uci) => uci !== "e2e4"));
if (alternatives.size !== legal.size || [...legal].some((uci) => !alternatives.has(uci))) throw new TypeError("Candidate packet alternatives are not set-equal to the exact legal authority");
if (selected.population.legalAlternatives !== alternatives.size || selected.population.evaluatedAlternatives !== alternatives.size || selected.selected.length > 2) throw new TypeError("Research selector did not evaluate the complete compiled candidate population");

function jsonFiles(path: string): readonly string[] {
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? jsonFiles(resolve(path, entry.name)) : entry.isFile() && entry.name.endsWith(".json") ? [resolve(path, entry.name)] : []);
}
const outpostDocuments = jsonFiles(resolve(process.cwd(), "content")).filter((path) => /"kind"\s*:\s*"outpost"/u.test(readFileSync(path, "utf8")));
if (outpostDocuments.length !== 3) throw new TypeError(`Outpost dependency report expected three affected documents, found ${outpostDocuments.length}`);

console.log(JSON.stringify({ digest: EVIDENCE_MANIFEST.digest, counts: tuple, researchSelection: selected.population, dependency: { projection: "rules.structural.predicate.outpost@1", dependsOn: "rules.structural.predicate.pawn_safe_square@1", affectedDocuments: outpostDocuments.map((path) => path.slice(process.cwd().length + 1)) } }));
