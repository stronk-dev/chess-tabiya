// DISPOSABLE research instrument (D345 wave, 2026-08-16). Not production.
// Answers the one question every middlegame-pack author has to ask before
// writing a plan class: does this shape entry's trigger fire on this position,
// and does this plan's success signature fire on it? `shape-check PROBE=` now
// prints trigger firing (D113 fixed) but says nothing about plan signatures,
// which is what `plan_consequence` success conditions are graded on.
//
//   make shape-probe SHAPE=<shape-id> PROBE='<fen>'
//   make shape-probe PACK=<pack.json>           (walks the authored spine)
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { declareCurrentStructuralPredicateEvidence } from "../../../packages/runtime/src/structural-evidence.js";
import { authoredStructuralDocument, selectAuthoredStructuralCondition, type AuthoredStructuralConditionSource } from "../../../packages/runtime/src/internal/authored-structural-source.js";
import { validateShapeEntry } from "./shape-validation.js";
import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { parseUci } from "chessops/util";

export interface ShapeProbePosition { readonly label: string; readonly fen: string }
export interface ShapeProbeResult extends ShapeProbePosition {
  readonly trigger: boolean;
  readonly plans: readonly { readonly id: string; readonly side: "white" | "black" }[];
}

async function entry(id: string): Promise<unknown> {
  return JSON.parse(await readFile(resolve("content/shapes", `${id}.json`), "utf8"));
}

/** A complete supplied document goes through the actual draft validator, never a raw AST tuple. */
export function probeShapeDocument(value: unknown, positions: readonly ShapeProbePosition[]): readonly ShapeProbeResult[] {
  const validation = validateShapeEntry(value);
  if (!validation.valid || validation.document === undefined) throw new TypeError(`Invalid shape: ${validation.issues.map(issue => `${issue.code} ${issue.path}`).join("; ")}`);
  const document = validation.document, source = authoredStructuralDocument(document);
  const trigger = selectAuthoredStructuralCondition(source, "/trigger");
  const plans = document.plans.flatMap((plan, index) => plan.success.signature === null ? [] : [{
    id: plan.id, side: plan.side, source: selectAuthoredStructuralCondition(source, `/plans/${index}/success/signature`),
  }]);
  const matches = (fen: string, condition: AuthoredStructuralConditionSource): boolean => {
    const result = declareCurrentStructuralPredicateEvidence(fen, condition);
    if (result.kind !== "available") throw new TypeError(`Shape probe unavailable: ${result.reason}`);
    return result.value.payload.observation.matched;
  };
  return Object.freeze(positions.map(position => Object.freeze({ ...position,
    trigger: matches(position.fen, trigger),
    plans: Object.freeze(plans.filter(plan => matches(position.fen, plan.source)).map(plan => Object.freeze({ id: plan.id, side: plan.side }))),
  })));
}

function report(shape: unknown, positions: readonly ShapeProbePosition[]): void {
  for (const { label, trigger, plans } of probeShapeDocument(shape, positions)) {
    console.log(`${label.padEnd(26)} trigger=${trigger ? "FIRES" : "-    "}  plans: ${plans.length === 0 ? "(none)" : plans.map(plan => `${plan.side}/${plan.id}`).join(", ")}`);
  }
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  if (argv[0] === "--pack") {
    const packPath = argv[1];
    if (packPath === undefined) throw new TypeError("--pack requires a pack path");
    const pack = JSON.parse(await readFile(resolve(packPath), "utf8")) as { id: string; shapes?: (string | { shape: string })[]; start: { fen: string }; spine?: Node[] };
    const shapeIds = (pack.shapes ?? []).map((value) => (typeof value === "string" ? value : value.shape));
    const extra = argv.slice(2);
    for (const id of [...shapeIds, ...extra]) {
      const shape = await entry(id);
      console.log(`\n## ${pack.id} against shape ${id}`);
      const root = Chess.fromSetup(parseFen(pack.start.fen).unwrap()).unwrap();
      const positions: ShapeProbePosition[] = [{ label: "start", fen: makeFen(root.toSetup()) }];
      const walk = (nodes: readonly Node[], position: Chess): void => {
        for (const node of nodes) {
          const branch = position.clone();
          const move = parseUci(node.moveUci);
          if (!move || !branch.isLegal(move)) { console.log(`ILLEGAL ${node.id}`); continue; }
          branch.play(move);
          positions.push({ label: node.id, fen: makeFen(branch.toSetup()) });
          walk(node.children, branch);
        }
      };
      walk(pack.spine ?? [], root);
      report(shape, positions);
    }
    return;
  }
  const shapeId = argv[0];
  if (shapeId === undefined) throw new TypeError("shape probe requires a shape id");
  const shape = await entry(shapeId);
  report(shape, argv.slice(1).map((fen, index) => ({ label: `fen[${index}]`, fen })));
}

interface Node { readonly id: string; readonly moveUci: string; readonly children: readonly Node[] }

if (process.argv[1]?.endsWith("shape-probe.js")) await main();
