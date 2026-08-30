// DISPOSABLE research harness — D2144. This proves the shipped boundary; it is not a repair.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  PRIMARY_EVIDENCE_MANIFEST,
  castlingRights,
  declareCastlingRightsEvidence,
  declareCastlingRightsLostEvidence,
  declareLoosePieceEvidence,
  declareMaterialRoleReadingEvidence,
  declarePawnContactsEvidence,
  declareSquareControlReadingEvidence,
  evidenceForConsumer,
  loosePieceReading,
  materialRoleSignatureReading,
  pawnContactsReading,
  squareControlReading,
  type DeclaredEvidence,
} from "@chess-tabiya/runtime";

const ROOT = new URL("../../", import.meta.url);
const adapters = readFileSync(new URL("packages/runtime/src/evidence-source-adapters.ts", ROOT), "utf8");
const barrel = readFileSync(new URL("packages/runtime/src/index.ts", ROOT), "utf8");

const INITIAL = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const LOOSE = "4k3/8/8/8/8/8/4q3/4R1K1 w - - 0 1";

function acceptingConsumers(value: DeclaredEvidence<unknown>): readonly string[] {
  return PRIMARY_EVIDENCE_MANIFEST.consumers.flatMap((consumer) => {
    const view = evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, consumer, [value]);
    return view.items.length === 0 ? [] : [`${consumer.id}@${consumer.version}`];
  });
}

describe("D2144 declared-evidence value authority", () => {
  it("exposes seventy-four public shape-only object adapters", () => {
    const rows = [...adapters.matchAll(/export const (declare[A-Za-z]+Evidence) = <T extends object>\(payload: T\) => exactObject\("[^"]+", "([^"]+)"/gu)]
      .map((match) => ({ name: match[1]!, projection: match[2]! }));
    expect(rows).toHaveLength(74);
    for (const row of rows) expect(barrel, row.name).toContain(row.name);

    const declarations = new Map(PRIMARY_EVIDENCE_MANIFEST.projections.map((projection) => [projection.id, projection]));
    const summary = Object.fromEntries([...Map.groupBy(rows, (row) => {
      const projection = declarations.get(row.projection)!;
      return `${projection.plane}/${projection.grounding}/${projection.exactness}`;
    })].map(([key, values]) => [key, values.length]).sort(([left], [right]) => left.localeCompare(right)));
    expect(summary).toMatchInlineSnapshot(`
      {
        "authored/authored_claim/authored": 3,
        "derived/declared_convention/convention": 13,
        "derived/declared_convention/exact": 1,
        "derived/position_rules/exact": 5,
        "derived/recorded_run/convention": 2,
        "derived/recorded_run/exact": 2,
        "human/human_corpus/measured": 2,
        "human/human_model/measured": 2,
        "rules/declared_convention/convention": 17,
        "rules/position_rules/exact": 20,
        "search/bounded_search/measured": 2,
        "search/tablebase_exact/exact": 4,
        "theory/authored_claim/authored": 1,
      }
    `);

    const bound = rows.filter((row) => PRIMARY_EVIDENCE_MANIFEST.bindings.some((binding) => binding.projection.id === row.projection));
    const boundSummary = Object.fromEntries([...Map.groupBy(bound, (row) => {
      const projection = declarations.get(row.projection)!;
      return `${projection.plane}/${projection.grounding}/${projection.exactness}`;
    })].map(([key, values]) => [key, values.length]).sort(([left], [right]) => left.localeCompare(right)));
    expect({ total: bound.length, byClass: boundSummary }).toMatchInlineSnapshot(`
      {
        "byClass": {
          "authored/authored_claim/authored": 3,
          "derived/declared_convention/convention": 11,
          "derived/declared_convention/exact": 1,
          "derived/position_rules/exact": 3,
          "derived/recorded_run/convention": 2,
          "derived/recorded_run/exact": 2,
          "human/human_corpus/measured": 2,
          "human/human_model/measured": 2,
          "rules/declared_convention/convention": 5,
          "rules/position_rules/exact": 12,
          "search/bounded_search/measured": 2,
          "search/tablebase_exact/exact": 4,
          "theory/authored_claim/authored": 1,
        },
        "total": 50,
      }
    `);
    expect(bound.filter((row) => {
      const projection = declarations.get(row.projection)!;
      return projection.grounding === "position_rules" && projection.exactness === "exact";
    }).map((row) => row.projection).sort()).toMatchInlineSnapshot(`
      [
        "derived.activity.event.open_file_occupancy",
        "derived.material.event.role_asymmetry",
        "derived.pawn.event.transitions",
        "rules.castling.event.rights_lost",
        "rules.endgame.reading",
        "rules.phase.reading",
        "rules.pivotal.marker",
        "rules.square.event.control",
        "rules.structural.event.pawn_islands",
        "rules.structural.predicate.result",
        "rules.structural.reading.named_structure",
        "rules.tactic.consequence.reply_breadth",
        "rules.tactic.event.check",
        "rules.tactic.event.defender_duty_relocated",
        "rules.tactic.event.defender_removed",
      ]
    `);
  });

  it("seals false same-key position readings whose current protection is zero consumer reach", () => {
    const rights = castlingRights(INITIAL);
    const control = squareControlReading(INITIAL);
    const material = materialRoleSignatureReading(INITIAL);
    const loose = loosePieceReading(LOOSE);
    expect(loose.pieces.length).toBeGreaterThan(0);

    const forged = [
      declareCastlingRightsEvidence({ ...rights, white: { ...rights.white, kingside: false } }),
      declareSquareControlReadingEvidence({ ...control, colors: [] }),
      declareMaterialRoleReadingEvidence({ ...material, magnitude: 99 }),
      declareLoosePieceEvidence({ ...loose, pieces: loose.pieces.map((row, index) => index === 0 ? { ...row, loose: !row.loose } : row) }),
    ] as readonly DeclaredEvidence<unknown>[];

    for (const evidence of forged) expect(acceptingConsumers(evidence), evidence.projection.id).toEqual([]);
  });

  it("seals an impossible same-key transition event without consulting either position", () => {
    const evidence = declareCastlingRightsLostEvidence({
      beforeFen: INITIAL,
      moveUci: "e2e4",
      afterFen: INITIAL,
      color: "white",
      wing: "kingside",
      cause: "rook_captured",
    });
    expect(evidence.payload).toMatchObject({ moveUci: "e2e4", cause: "rook_captured" });
    expect(acceptingConsumers(evidence)).toEqual(["research.semantic_selection@1"]);
  });

  it("keeps the repaired pawn-contact adapter as a working negative control", () => {
    const contacts = pawnContactsReading("8/1p6/8/8/8/8/P7/4K2k w - - 0 1");
    expect(() => declarePawnContactsEvidence({ ...contacts, passed: contacts.passed.map((row) => ({ ...row, passed: !row.passed })) })).toThrow(/does not equal the exact pawn-contact authority/u);
  });
});
