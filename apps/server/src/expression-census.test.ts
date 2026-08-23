import { resolvePackPath } from "@chess-tabiya/schema/pack-path";

import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

import type { StructuralExpression } from "@chess-tabiya/schema/drill-pack";
import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";
import { describe, expect, it } from "vitest";

import { evidenceCensus, runExpressionCensus } from "./expression-census.js";
import { runDeclarationCensus } from "./declaration-census.js";
import { checkShapeFile, formatProbeResult } from "./shape-check.js";
import { validateShapeEntry } from "./shape-validation.js";

function packFiles(): string[] {
  return ["content/drafts", "content/packs"].flatMap((root) => readdirSync(root).filter((name) => name.endsWith(".json") && !/\.(?:evidence|job|sources)\.json$/u.test(name)).map((name) => `${root}/${name}`));
}

const witnesses = JSON.parse(readFileSync("content/witnesses/expression-witnesses.json", "utf8"));
const fullReport = runExpressionCensus({ witnesses });
const fullDeclarationReport = runExpressionCensus({ witnesses, declarations: true });

describe("expression census", () => {
  it("walks every pack including root-only fixtures and reports the fixture split", () => {
    const report = fullReport;
    expect(report.corpus.packs).toBe(packFiles().length);
    expect(report.corpus.positions).toBeGreaterThan(report.corpus.packs);
    expect(report.corpus.packsWithoutSpine).toContain("trajectory-legs-browser");
    expect(report.corpus.fixturePacks).toEqual(packFiles().filter((name) => name.endsWith(".browser.json")).map((name) => JSON.parse(readFileSync(name, "utf8")).id).sort());
  });

  it("reports each pack's evidence rungs, backing, and corpus population", () => {
    const report = fullReport;
    expect(report.evidence.packs.length).toBeGreaterThan(0);
    expect(report.evidence.totals.claims).toBeGreaterThan(0);
    const citations = report.evidence.packs.flatMap((pack: any) => pack.citations);
    const corpus = citations.filter((citation: any) => citation.evidenceType === "corpus_observed");
    expect(corpus.length).toBeGreaterThan(0);
    expect(corpus.every((citation: any) => citation.rung === 4 && citation.backing.kind === "ledger")).toBe(true);
    expect(report.evidence.totals.byRung.map((row: any) => row.rung)).toContain(4);
  });

  it("matches ledger backing and exposes its machine-readable population", () => {
    const root = mkdtempSync(resolve(tmpdir(), "tabiya-evidence-census-"));
    const file = resolve(root, "sample.json");
    const pack = JSON.parse(readFileSync(resolvePackPath("anti-caro-advance-early-c5"), "utf8"));
    const claimText = "The corpus contains 9,346,096 games in this window.";
    pack.feedbackClaims = [{ id: "observed", text: claimText, evidenceTypes: ["corpus_observed"] }];
    writeFileSync(file, JSON.stringify(pack));
    writeFileSync(file.replace(/\.json$/u, ".evidence.json"), JSON.stringify({
      schema: "tabiya.sourcing.evidence.v1", sourcedAt: "2026-08-16T00:00:00.000Z", abstentions: [],
      records: [{ kind: "explorer_frequency", anchor: { fen: pack.start.fen }, sourceId: "lichess-explorer", retrievedAt: "2026-08-16T00:00:00.000Z", grounds: "citable_source", supports: ["/start/fen"], values: { ratings: [1400, 1600, 1800], speeds: ["blitz", "rapid"], since: "2024-01", until: "2026-07", total: 9346096 } }],
      claimBindings: [{ claimId: "observed", pointer: "/feedbackClaims/0/text", textSha256: `sha256:${createHash("sha256").update(claimText).digest("hex")}`, spans: [{ span: "9,346,096", assertion: { kind: "explorer.total@v1", args: { fen: pack.start.fen } } }] }],
    }));
    const report = evidenceCensus(new Map([[file, pack]]));
    expect(report.packs[0]?.citations[0]).toMatchObject({ evidenceType: "corpus_observed", rung: 4, backing: { kind: "ledger", backedClaims: 1, records: 1 }, populations: [{ ratings: [1400, 1600, 1800], speeds: ["blitz", "rapid"], since: "2024-01", until: "2026-07", total: 9346096 }] });
  });

  // Selects subjects BY OBSERVATION, never by name. The earlier form pinned
  // `black-anchor-the-knight` at 0 firings and `opposite-castling-race` at five empty
  // denominators; the 2026-08-15 middlegame wave gave both a home (the anchor fires 7),
  // so authoring correct content turned `make verify` red — D47's class, re-found one
  // instrument over. A census total is a fact about the corpus and moves whenever content
  // lands; what must hold is the SEPARATION between coverage and satisfiability. Each
  // population is asserted non-empty first, so an empty corpus cannot vacuously pass.
  it("separates zero coverage from satisfiability and preserves empty denominators", () => {
    const report = fullReport;
    const never = report.subjects.filter((subject: any) => subject.observations.includes("NEVER_FIRES_IN_CORPUS"));
    expect(never.length).toBeGreaterThan(0);
    for (const subject of never) {
      // Firing nowhere is a coverage fact. Only a sound refutation may say UNSATISFIABLE.
      expect(subject.coverage.corpus.fires).toBe(0);
      expect(subject.observations).not.toContain("UNSATISFIABLE");
      expect(subject.coverage.corpus.faults).toBeUndefined();
    }
    expect(never.some((subject: any) => subject.satisfiability.verdict === "satisfiable")).toBe(true);

    const empty = report.subjects.filter((subject: any) => subject.observations.includes("IN_SHAPE_DENOMINATOR_EMPTY"));
    expect(empty.length).toBeGreaterThan(0);
    // An empty denominator is preserved as its own observation, never collapsed into a rate.
    for (const subject of empty) expect(subject.coverage.inShape.of).toBe(0);

    const outside = report.subjects.filter((subject: any) => subject.observations.includes("FIRES_ONLY_OUTSIDE_SHAPE"));
    expect(outside.length).toBeGreaterThan(0);
    for (const subject of outside) {
      expect(subject.coverage.corpus.fires).toBeGreaterThan(0);
      expect(subject.coverage.inShape.fires).toBe(0);
      expect(subject.coverage.inShape.of).toBeGreaterThan(0);
    }

    // The three classifications are distinct: firing nowhere is not firing outside.
    expect(never.some((subject: any) => outside.includes(subject))).toBe(false);
  });

  it("reports vacuous degeneracy without turning it into an error", () => {
    const expression: StructuralExpression = { kind: "feature", feature: { kind: "piece_reach_count", color: "white", role: "bishop", scope: "every", comparison: "atLeast", count: 0 } };
    const report = runExpressionCensus({ expression, witnesses: {} });
    expect(report.subjects[0].observations).toContain("FIRES_ON_DEGENERATE");
    expect(report.subjects[0].degenerate).toContain("bare_kings");
    expect(report.subjects[0].observations).not.toContain("UNSATISFIABLE");
  });

  it("resolves pack-local plan signatures before measuring coverage", () => {
    const subjects = fullReport.subjects.filter((subject: any) =>
      [
        "closed-centre-chain-black-base-strike",
        "london-wedge-black-counterplay",
        "open-centre-french-exchange-black",
      ].includes(subject.site.subject.pack) &&
      subject.site.subject.kind === "pack_success_condition",
    );
    expect(subjects).toHaveLength(3);
    for (const subject of subjects) {
      expect(subject.coverage.corpus.faults).toBeUndefined();
      expect(subject.observations).not.toContain("EVALUATION_FAULT");
      expect(subject.satisfiability.verdict).not.toBe("unknown");
    }
  });

  it("is deterministic and does not mutate content", () => {
    const before = packFiles().map((name) => [name, statSync(name).mtimeMs, createHash("sha256").update(readFileSync(name)).digest("hex")] as const);
    const one = canonicalizeJson(runExpressionCensus({ witnesses }));
    const two = canonicalizeJson(runExpressionCensus({ witnesses }));
    expect(two).toBe(one);
    expect(packFiles().map((name) => [name, statSync(name).mtimeMs, createHash("sha256").update(readFileSync(name)).digest("hex")])).toEqual(before);
  }, 60_000);

  it("reuses the shipped walker and leaves the verification gate report-free", () => {
    const source = readFileSync(new URL("./expression-census.ts", import.meta.url), "utf8");
    expect(source).toContain('import { authoredSpineFens } from "./pack-validation.js"');
    expect(source).toContain('import { matchesStructuralExpression } from "@chess-tabiya/runtime"');
    expect(source).toContain('resolve("content/witnesses/expression-witnesses.json")');
    expect(source).not.toContain('resolve("apps/server/src/fixtures/expression-witnesses.json")');
    expect(source).not.toMatch(/chessops\/(?:util|chess)|\.spine|moveUci|parseUci/u);
    const makefile = readFileSync("Makefile", "utf8");
    expect(makefile.match(/^verify:.*$/mu)?.[0]).not.toContain("expression-census");
    expect(makefile).toContain('$(if $(DECLARATIONS),--declarations "$(DECLARATIONS)",)');
  });

  it("enumerates all four declaration namespaces from live sources", () => {
    expect(fullDeclarationReport.declarations.length).toBeGreaterThan(0);
    expect(Object.keys(fullDeclarationReport.totals.declarations).sort()).toEqual([
      "assistance", "corpus", "error", "runtime", "schema",
    ]);
    for (const namespace of ["schema", "error", "assistance", "runtime"]) {
      const rows = fullDeclarationReport.declarations.filter((row: any) => row.namespace === namespace);
      expect(rows.length).toBeGreaterThan(0);
      expect(rows.every((row: any) => row.declaredAt.module.length > 0 && row.declaredAt.symbol.length > 0)).toBe(true);
    }
  });

  it("derives each declaration namespace rather than pinning a subject list", () => {
    const baseline = runDeclarationCensus();
    const schema = JSON.parse(readFileSync("schemas/drill_pack.schema.json", "utf8"));
    schema.$defs.opponentPolicy.properties.mode.enum.push("fixture_mode");
    const errors = readFileSync("apps/server/src/errors.ts", "utf8").replace(
      '| "TARGET_ELO_OUT_OF_RANGE";',
      '| "TARGET_ELO_OUT_OF_RANGE"\n  | "FIXTURE_ERROR";',
    );
    const assistance = readFileSync("packages/runtime/src/assistance.ts", "utf8").replace(
      'readonly arrows: "off" | "sight" | "evidence";',
      'readonly arrows: "off" | "sight" | "evidence" | "fixture";',
    );
    const transition = readFileSync("packages/runtime/src/transition.ts", "utf8").replace(
      'export type IrreversibilityDetail =',
      'export type IrreversibilityDetail =\n  | { readonly subkind: "fixture" }',
    );
    const mutated = runDeclarationCensus({
      sourceOverrides: {
        "schemas/drill_pack.schema.json": JSON.stringify(schema),
        "apps/server/src/errors.ts": errors,
        "packages/runtime/src/assistance.ts": assistance,
        "packages/runtime/src/transition.ts": transition,
      },
    });
    for (const namespace of ["schema", "error", "assistance", "runtime"] as const) {
      expect(mutated.totals[namespace].subjects).toBe(baseline.totals[namespace].subjects + 1);
    }
  }, 60_000);

  it("finds producerless error codes without misclassifying the six observed near misses", () => {
    const rows = fullDeclarationReport.declarations.filter((row: any) => row.namespace === "error");
    expect(rows.filter((row: any) => row.producers.length === 0).map((row: any) => row.subject)).toEqual([]);
    for (const code of [
      "VOICE_UNAVAILABLE", "TTS_UNAVAILABLE", "CORPUS_UNAVAILABLE",
      "PERFECT_TABLEBASE_OUT_OF_RANGE", "PRACTICAL_RESISTANCE_OUT_OF_RANGE",
      "REPERTOIRE_IMPORT_LIMIT",
    ]) {
      expect(rows.find((row: any) => row.subject === code)?.producers.length).toBeGreaterThan(0);
    }
    const errors = readFileSync("apps/server/src/errors.ts", "utf8").replace(
      '| "TARGET_ELO_OUT_OF_RANGE";',
      '| "TARGET_ELO_OUT_OF_RANGE"\n  | "FIXTURE_PRODUCERLESS";',
    );
    const fixture = runDeclarationCensus({ sourceOverrides: { "apps/server/src/errors.ts": errors } });
    expect(fixture.declarations.find((row) => row.namespace === "error" && row.subject === "FIXTURE_PRODUCERLESS")?.producers).toEqual([]);
  }, 20_000);

  it("reproduces the clock-zeroed refutation on the shared transition denominator", () => {
    const rows = fullDeclarationReport.declarations.filter((row: any) => row.namespace === "runtime");
    const observation = (value: string) => rows.find((row: any) => row.subject === `TransitionObservation=${JSON.stringify(value)}`);
    const clock = observation("clock_zeroed");
    expect(clock).toMatchObject({ corpusFirings: expect.any(Number) });
    expect(clock.producers.length).toBeGreaterThanOrEqual(2);
    expect(clock.corpusFirings).toBeGreaterThan(0);
    const others = ["pawn_break", "castled", "last_of_role"].map((value) => observation(value));
    expect(others.every((row: any) => row?.corpusFirings > 0)).toBe(true);
    expect(clock.corpusFirings).toBeGreaterThan(others.reduce((sum: number, row: any) => sum + row.corpusFirings, 0));
    expect(fullDeclarationReport.totals.declarations.corpus.transitions).toBe(fullDeclarationReport.corpus.transitions);
  });

  it("keeps zeros factual and separates refusal sites from consumers", () => {
    const declarations = fullDeclarationReport.declarations;
    expect(JSON.stringify(declarations)).not.toMatch(/"(?:dead|unreachable|unsatisfiable|unused)"/u);
    const retry = declarations.find((row: any) => row.namespace === "schema" && row.subject === "/retryVariants");
    expect(retry).toMatchObject({
      consumers: [],
      refusalSites: [{ module: "apps/server/src/pack-validation.ts", symbol: "runtimeIssues", code: "RETRY_VARIANTS_NOT_EXECUTABLE" }],
      dispositionRow: "/retryVariants",
    });
  });

  it("keeps declaration discovery opt-in, deterministic, and content-read-only", () => {
    expect(runExpressionCensus({ witnesses })).toEqual(runExpressionCensus({ witnesses, declarations: false }));
    expect(fullReport).not.toHaveProperty("declarations");
    const trackedRoots = ["content", "schemas", "packages"];
    const walk = (path: string): string[] => readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
      const child = resolve(path, entry.name);
      return entry.isDirectory() && entry.name !== "node_modules" && entry.name !== "dist" ? walk(child) : entry.isFile() ? [child] : [];
    });
    const digest = () => trackedRoots.flatMap(walk).sort().map((file) => [file, createHash("sha256").update(readFileSync(file)).digest("hex")]);
    const before = digest();
    expect(canonicalizeJson(runExpressionCensus({ witnesses, declarations: true }))).toBe(canonicalizeJson(fullDeclarationReport));
    expect(digest()).toEqual(before);
  }, 30_000);

  it("refuses a proven impossibility without dropping probeMatches", () => {
    const entry = JSON.parse(readFileSync("content/shapes/carlsbad.json", "utf8"));
    entry.trigger = { kind: "feature", feature: { kind: "piece_count", color: "white", role: "king", basis: "count", comparison: "equal", count: 0 } };
    const result = validateShapeEntry(entry, { probeFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" });
    expect(result.valid).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toContain("STRUCTURAL_EXPRESSION_UNSATISFIABLE");
    expect(result).toHaveProperty("probeMatches", false);
  });

  it("adds opt-in corpus warnings without making shape-check fail", async () => {
    const result = await checkShapeFile("content/shapes/knight-vs-bishop.json", { corpus: ["content/drafts", "content/packs"] });
    expect(result.valid).toBe(true);
    expect(result.issues.some((issue) => issue.severity === "warning" && issue.code === "SHAPE_TRIGGER_NEVER_FIRES_IN_CORPUS")).toBe(true);
  }, 10_000);

  it("prints an unambiguous result for each shape probe", () => {
    expect(formatProbeResult("content/shapes/carlsbad.json", true)).toBe("PROBE FIRES: content/shapes/carlsbad.json#/trigger");
    expect(formatProbeResult("content/shapes/carlsbad.json", false)).toBe("PROBE DOES NOT FIRE: content/shapes/carlsbad.json#/trigger");
  });
});
