// DISPOSABLE research harness — D629. Not production code or chess-truth authority.
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import {
  STRUCTURAL_FEATURE_KINDS,
  TRANSITION_FEATURE_KINDS,
  matchesStructuralFeature,
  matchesTransitionFeature,
  structuralReading,
  transitionReading,
  type TransitionObservation,
} from "@chess-tabiya/runtime";
import type { TransitionFeature } from "@chess-tabiya/schema/drill-pack";

import { transitions } from "../r1r2-primitives-harness/corpus.js";
import { STRUCTURAL_FIXTURES } from "./fixtures.js";
import { GENERIC_READER_SINKS, STRUCTURAL_CONFORMANCE, TRANSITION_CONFORMANCE } from "./registry.js";

const ROOT = new URL("../../", import.meta.url);
const OUT = new URL("./output.md", import.meta.url);

function after(fen: string, moveUci: string): string {
  const position = Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
  const move = parseUci(moveUci);
  if (move === undefined || !position.isLegal(move)) throw new TypeError(`Illegal fixture move ${moveUci}`);
  position.play(move);
  return makeFen(position.toSetup());
}

function jsonFiles(url: URL): readonly URL[] {
  return readdirSync(url, { withFileTypes: true }).flatMap((entry) => {
    const child = new URL(entry.name + (entry.isDirectory() ? "/" : ""), url);
    return entry.isDirectory() ? jsonFiles(child) : entry.isFile() && entry.name.endsWith(".json") ? [child] : [];
  });
}

function leafKey(observation: TransitionObservation): string {
  return observation.kind === "move_irreversibility"
    ? `${observation.kind}:${observation.subkind}`
    : `${observation.kind}:${observation.direction}`;
}

function exactFeature(observation: TransitionObservation): TransitionFeature {
  if (observation.kind === "move_irreversibility") return { kind: observation.kind, subkind: observation.subkind };
  return {
    kind: observation.kind,
    color: observation.color,
    direction: observation.direction,
    comparison: "equal",
    count: observation.count,
  } as TransitionFeature;
}

function wrongExactCount(feature: TransitionFeature): TransitionFeature | undefined {
  if (feature.kind === "move_irreversibility") return undefined;
  return { ...feature, count: feature.count + 1 };
}

describe("D629 detector semantic conformance", () => {
  it("closes the audit registry over every declared detector family", () => {
    expect(STRUCTURAL_CONFORMANCE.map((row) => row.kind)).toEqual([...STRUCTURAL_FEATURE_KINDS]);
    expect(TRANSITION_CONFORMANCE.map((row) => row.kind)).toEqual([...TRANSITION_FEATURE_KINDS]);
    expect(STRUCTURAL_FIXTURES.map((row) => row.kind)).toEqual([...STRUCTURAL_FEATURE_KINDS]);
  });

  it("pins a positive and hard-negative matcher fixture for all 18 structural kinds", () => {
    for (const fixture of STRUCTURAL_FIXTURES) {
      expect(matchesStructuralFeature(fixture.positiveFen, fixture.feature), `${fixture.kind} positive`).toBe(true);
      expect(matchesStructuralFeature(fixture.hardNegativeFen, fixture.feature), `${fixture.kind} hard negative`).toBe(false);
    }
  });

  it("censuses reader witnesses, transition leaves, operand loss, and generic sinks", () => {
    const corpus = transitions();
    const positions = [...new Set(corpus.flatMap((edge) => [edge.parentFen, edge.fen]))];
    const structuralObservations = positions.flatMap((fen) => structuralReading(fen).features);
    const structuralCounts = new Map<string, { observations: number; positions: Set<string> }>();
    for (const fen of positions) {
      for (const observation of structuralReading(fen).features) {
        const row = structuralCounts.get(observation.kind) ?? { observations: 0, positions: new Set<string>() };
        row.observations += 1;
        row.positions.add(fen);
        structuralCounts.set(observation.kind, row);
      }
    }

    const transitionCounts = new Map<string, number>();
    const transitionWitness = new Map<string, { before: string; moveUci: string; after: string; observation: TransitionObservation }>();
    let transitionObservationCount = 0;
    let transitionObservationsWithSquares = 0;
    for (const edge of corpus) {
      const reading = transitionReading(edge.parentFen, edge.uci, edge.fen);
      expect(reading, `${edge.pack}:${edge.uci}`).not.toBeNull();
      for (const observation of reading!.observations) {
        transitionObservationCount += 1;
        if ("squares" in observation && (observation.squares?.length ?? 0) > 0) transitionObservationsWithSquares += 1;
        const key = leafKey(observation);
        transitionCounts.set(key, (transitionCounts.get(key) ?? 0) + 1);
        if (!transitionWitness.has(key)) transitionWitness.set(key, { before: edge.parentFen, moveUci: edge.uci, after: edge.fen, observation });
      }
    }

    for (const [key, witness] of transitionWitness) {
      const feature = exactFeature(witness.observation);
      expect(matchesTransitionFeature(witness.before, witness.moveUci, witness.after, feature), `${key} positive`).toBe(true);
      const negative = wrongExactCount(feature);
      if (negative !== undefined) expect(matchesTransitionFeature(witness.before, witness.moveUci, witness.after, negative), `${key} exact-count negative`).toBe(false);
    }

    for (const sink of GENERIC_READER_SINKS) {
      const source = readFileSync(new URL(sink.path, ROOT), "utf8");
      expect(source, sink.path).toContain(sink.needle);
    }

    const observedStructuralKinds = new Set(structuralObservations.map((item) => item.kind));
    const observedTransitionKinds = new Set([...transitionCounts].map(([key]) => key.split(":")[0]));
    expect([...STRUCTURAL_FEATURE_KINDS].filter((kind) => !observedStructuralKinds.has(kind))).toEqual(["pawn_count"]);
    expect([...TRANSITION_FEATURE_KINDS].filter((kind) => !observedTransitionKinds.has(kind))).toEqual([]);
    expect(transitionObservationsWithSquares).toBe(0);

    const contentDocuments = jsonFiles(new URL("content/", ROOT)).map((url) => ({ url, text: readFileSync(url, "utf8") }));
    const authoredUsage = new Map<string, { documents: number; occurrences: number }>();
    for (const kind of [...STRUCTURAL_FEATURE_KINDS, ...TRANSITION_FEATURE_KINDS]) {
      const pattern = new RegExp(`"kind"\\s*:\\s*"${kind}"`, "gu");
      const matches = contentDocuments.map(({ text }) => [...text.matchAll(pattern)].length);
      authoredUsage.set(kind, { documents: matches.filter((count) => count > 0).length, occurrences: matches.reduce((sum, count) => sum + count, 0) });
    }

    const priorityBefore = "4k3/8/8/4q3/3P4/8/8/4K3 w - - 0 1";
    const priorityAfter = after(priorityBefore, "d4e5");
    const prioritySubkinds = transitionReading(priorityBefore, "d4e5", priorityAfter)!.observations
      .filter((observation): observation is Extract<TransitionObservation, { kind: "move_irreversibility" }> => observation.kind === "move_irreversibility")
      .map((observation) => observation.subkind);
    expect(prioritySubkinds).toEqual(["clock_zeroed", "last_of_role"]);

    const lines = [
      "# D629 detector conformance — raw output",
      "",
      `Population: ${new Set(corpus.map((edge) => edge.pack)).size} packs, ${corpus.length} committed transitions, ${positions.length} distinct positions.`,
      "",
      "## Structural families",
      "",
      "| kind | observations | positions | authored docs / occurrences | fidelity | disposition |",
      "|---|---:|---:|---:|---|---|",
      ...STRUCTURAL_CONFORMANCE.map((row) => {
        const count = structuralCounts.get(row.kind);
        const authored = authoredUsage.get(row.kind)!;
        return `| \`${row.kind}\` | ${count?.observations ?? 0} | ${count?.positions.size ?? 0} | ${authored.documents} / ${authored.occurrences} | ${row.fidelity} | ${row.disposition} |`;
      }),
      "",
      `Declared structural kinds: ${STRUCTURAL_FEATURE_KINDS.length}; reader witnesses: ${observedStructuralKinds.size}; matcher-only/cannot-emit: ${[...STRUCTURAL_FEATURE_KINDS].filter((kind) => !observedStructuralKinds.has(kind)).join(", ")}.`,
      "",
      "## Transition leaves",
      "",
      "| leaf | observations | first witness | authored family docs / occurrences |",
      "|---|---:|---|---:|",
      ...[...transitionCounts].sort(([left], [right]) => left.localeCompare(right)).map(([key, count]) => {
        const witness = transitionWitness.get(key)!;
        const authored = authoredUsage.get(key.split(":")[0]!)!;
        return `| \`${key}\` | ${count} | ${witness.moveUci} | ${authored.documents} / ${authored.occurrences} |`;
      }),
      "",
      `Declared transition families: ${TRANSITION_FEATURE_KINDS.length}; witnessed families: ${observedTransitionKinds.size}; witnessed leaves: ${transitionCounts.size}.`,
      `Transition observations retaining affected squares: ${transitionObservationsWithSquares}/${transitionObservationCount}.`,
      `Priority/multi-label control: d4e5 both captures Black's last queen and creates pawn contact; the reading emits ${prioritySubkinds.join(" + ")} and suppresses pawn_break.`,
      "",
      "## Interface and admission result",
      "",
      `Structural fidelity: ${STRUCTURAL_CONFORMANCE.filter((row) => row.fidelity === "round_trip").length} round-trip, ${STRUCTURAL_CONFORMANCE.filter((row) => row.fidelity === "reader_subset").length} reader-subset, ${STRUCTURAL_CONFORMANCE.filter((row) => row.fidelity === "lossy").length} lossy, ${STRUCTURAL_CONFORMANCE.filter((row) => row.fidelity === "matcher_only").length} matcher-only.`,
      `Transition fidelity: ${TRANSITION_CONFORMANCE.filter((row) => row.fidelity === "round_trip").length} round-trip, ${TRANSITION_CONFORMANCE.filter((row) => row.fidelity === "lossy").length} lossy.`,
      `Generic reader sinks verified: ${GENERIC_READER_SINKS.length}. These sinks accept whole readings rather than declaring detector-family eligibility.`,
      "Unconditionally learner-eligible detector families: 0. Exact atoms remain usable by an inspector or named authored condition; learner modules still require semantic eligibility, local selection and consumer validation.",
      "",
      "## Registry detail",
      "",
      "| family | literal computation | blocker |",
      "|---|---|---|",
      ...STRUCTURAL_CONFORMANCE.map((row) => `| \`${row.kind}\` | ${row.literalComputation} | ${row.blocker} |`),
      ...TRANSITION_CONFORMANCE.map((row) => `| \`${row.kind}\` | ${row.literalComputation} | ${row.blocker} |`),
      "",
    ];
    writeFileSync(OUT, lines.join("\n"));
  });
});
