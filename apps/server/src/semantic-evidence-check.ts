import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

import { Chess, normalizeMove } from "chessops/chess";
import { INITIAL_FEN, parseFen } from "chessops/fen";
import { parseUci } from "chessops/util";

import { canonicalFen, selectLocalSemanticEvidence } from "@chess-tabiya/runtime";

import { EVIDENCE_MANIFEST } from "./evidence-manifest.js";

const tuple = [EVIDENCE_MANIFEST.producers.length, EVIDENCE_MANIFEST.projections.length, EVIDENCE_MANIFEST.consumers.length, EVIDENCE_MANIFEST.bindings.length, EVIDENCE_MANIFEST.semanticEvents.length, EVIDENCE_MANIFEST.eligibility.length, EVIDENCE_MANIFEST.reasons.length, EVIDENCE_MANIFEST.selectionPolicies.length];
if (tuple.join("/") !== "25/156/25/188/46/46/15/1") throw new TypeError(`Semantic evidence closure drift: ${tuple.join("/")}`);

const position = Chess.fromSetup(parseFen(INITIAL_FEN).unwrap()).unwrap();
const move = normalizeMove(position, parseUci("e2e4")!);
position.play(move);
const selected = selectLocalSemanticEvidence({ id: "research.r2_candidate", version: 1 }, { beforeFen: INITIAL_FEN, moveUci: "e2e4", afterFen: canonicalFen(position) });
if (selected.population.legalAlternatives !== 19 || selected.population.evaluatedAlternatives !== 19 || selected.selected.length > 2) throw new TypeError("Research selector did not evaluate the complete finite local population");

function jsonFiles(path: string): readonly string[] {
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? jsonFiles(resolve(path, entry.name)) : entry.isFile() && entry.name.endsWith(".json") ? [resolve(path, entry.name)] : []);
}
const outpostDocuments = jsonFiles(resolve(process.cwd(), "content")).filter((path) => /"kind"\s*:\s*"outpost"/u.test(readFileSync(path, "utf8")));
if (outpostDocuments.length !== 3) throw new TypeError(`Outpost dependency report expected three affected documents, found ${outpostDocuments.length}`);

console.log(JSON.stringify({ digest: EVIDENCE_MANIFEST.digest, counts: tuple, researchSelection: selected.population, dependency: { projection: "rules.structural.predicate.outpost@1", dependsOn: "rules.structural.predicate.pawn_safe_square@1", affectedDocuments: outpostDocuments.map((path) => path.slice(process.cwd().length + 1)) } }));
