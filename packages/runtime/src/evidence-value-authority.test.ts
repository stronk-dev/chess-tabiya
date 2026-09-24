// Permanent value-authority gate (rfc/evidence-value-authority.md §7-§8). Run by
// `make evidence-value-authority` (part of `make verify-software`) and by `make test-software`.
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";

import { normalizeMove } from "chessops/chess";
import { parseUci } from "chessops/util";
import ts from "typescript";
import { describe, expect, it } from "vitest";

import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";

import { sha256Hex } from "./assistance-exchange.js";
import { canonicalFen, positionFromFen } from "./chess.js";
import { compileConceptRegistry, conceptRegistryDigest, conceptRegistryHeadBytes, conceptRegistryRevisionBytes } from "./concept-registry.js";
import { compareBranches } from "./compare.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import {
  assertDeclaredEvidence,
  evidenceDigest,
  evidenceForConsumer,
  evidenceValueReceipt,
  identitySealedEvidenceWithoutValueReceipt,
  renderEvidenceItems,
  type DeclaredEvidence,
} from "./evidence-contract.js";
import { attachEvidence } from "./evidence.js";
import { evidenceFactorySymbol } from "./evidence-factories.js";
import { invokeEvidenceValueRoute, evidenceValueRouteRegistry, type EvidenceValueRoute } from "./internal/evidence-value-routes.js";
import { ENDGAME_MATERIAL_MAX, phaseBandReading } from "./phase.js";
import { branchPath } from "./branch-path.js";
import { commitMove, createRun, fork, rewind } from "./runtime.js";
import { compileSemanticEvidenceEvent, legalAlternativeEdges, loosePieceSemanticEvents, pawnIslandSemanticEvents, structuralSemanticEvents, transitionSemanticEvents } from "./semantic-evidence.js";
import type { RecordedMoveAnchor } from "./pawn-dynamics.js";
import type { DrillRun } from "./types.js";
import { evaluationDelivery as reviewEvaluationDelivery } from "./testing/review-evidence-fixture.js";
import { PROVIDER_EXCHANGE_AUTHORITY } from "./provider-exchange.js";
import { normalizeProviderRequest } from "./provider-requests.js";
import { FIXTURE_AT, allLegalRows, evaluationCapture, evaluationRequest, explorerBody, explorerRequest, httpCapture, legalRootCapture, legalRootLines, legalRootRequest, maiaCapture, maiaRequest, syzygyBody, syzygyRequest } from "./provider-test-fixtures.js";
import type { ProviderExecutionCapture, ProviderOperationId, ProviderRequestedIdentityMap } from "./provider-types.js";

/** One scheduler-sealed live delivery per provider operation, keyed by its source route. */
function providerDeliveries(): readonly (readonly [string, ProviderOperationId, unknown])[] {
  const seal = <K extends ProviderOperationId>(operation: K, requested: ProviderRequestedIdentityMap[K], capture: ProviderExecutionCapture<K>): unknown => {
    const acquisition = PROVIDER_EXCHANGE_AUTHORITY.makeProviderAcquisitionReceipt({ operation, requestedIdentity: requested, capture, requestedAt: FIXTURE_AT, retrievedAt: FIXTURE_AT });
    const { payload, payloadReceipt } = PROVIDER_EXCHANGE_AUTHORITY.makeProviderParsedPayload(acquisition);
    return PROVIDER_EXCHANGE_AUTHORITY.makeProviderDelivery({ kind: "live", acquisition, payload, payloadReceipt, servedAt: FIXTURE_AT });
  };
  const promotion = "8/P7/8/8/8/8/8/k6K w - - 0 1";
  const kqk = "8/8/8/8/8/8/3Q4/k1K5 w - - 0 1";
  const initial = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  const root = normalizeProviderRequest("stockfish.legal_root_table@1", legalRootRequest(promotion));
  const evaluation = normalizeProviderRequest("stockfish.position_evaluation@1", evaluationRequest(initial));
  const maia = normalizeProviderRequest("maia.policy_page@1", maiaRequest({ kind: "exact_fen", fen: initial }, { requestedWidth: 2 }));
  const syzygy = normalizeProviderRequest("syzygy.position@1", syzygyRequest(kqk));
  const explorer = normalizeProviderRequest("lichess_explorer.position_page@1", explorerRequest());
  return [
    ["live.stockfish.legal_root_table@1", "stockfish.legal_root_table@1", seal("stockfish.legal_root_table@1", root, legalRootCapture(root, legalRootLines(promotion, allLegalRows(promotion), 8)))],
    ["live.stockfish.position_eval@1", "stockfish.position_evaluation@1", seal("stockfish.position_evaluation@1", evaluation, evaluationCapture(evaluation, ["info depth 12 score cp 20 wdl 300 600 100 pv e2e4", "bestmove e2e4"]))],
    ["human.maia.policy_page@1", "maia.policy_page@1", seal("maia.policy_page@1", maia, maiaCapture(maia, ["info depth 1 multipv 1 policy 0.4 pv e2e4", "info depth 1 multipv 2 policy 0.3 pv d2d4", "bestmove e2e4"]))],
    ["live.syzygy.position_result@1", "syzygy.position@1", seal("syzygy.position@1", syzygy, httpCapture("syzygy.position@1", syzygyBody(kqk)))],
    ["human.explorer.position_page@1", "lichess_explorer.position_page@1", seal("lichess_explorer.position_page@1", explorer, httpCapture("lichess_explorer.position_page@1", explorerBody()))],
  ];
}

const ROOT = new URL("../../../", import.meta.url);
const read = (path: string): string => readFileSync(new URL(path, ROOT), "utf8");
const exact = (value: { readonly id: string; readonly version: number }): string => `${value.id}@${value.version}`;
const REGISTRY = evidenceValueRouteRegistry();
const ROUTES = new Map(REGISTRY.map((meta) => [meta.route, meta]));
const invoke = (route: string, inputs: unknown): unknown => invokeEvidenceValueRoute(route as EvidenceValueRoute, inputs as never);

// ---------------------------------------------------------------------------------------------
// §8.1-§8.2 static closure: one mint boundary, one dispatcher, no package exposure
// ---------------------------------------------------------------------------------------------

function sourceFiles(directory: string): readonly string[] {
  const url = new URL(directory, ROOT);
  if (!existsSync(url)) return [];
  return readdirSync(url, { withFileTypes: true }).flatMap((entry) => {
    const path = `${directory}${entry.name}${entry.isDirectory() ? "/" : ""}`;
    if (entry.isDirectory()) return entry.name === "dist" || entry.name === "node_modules" ? [] : sourceFiles(path);
    return /\.(?:ts|svelte)$/u.test(entry.name) ? [path] : [];
  });
}

const isTestFile = (path: string): boolean => /\.(?:test|spec)\.ts$|\.test-support\.ts$|\.typecheck\.ts$/u.test(path);
const ALL_FILES = ["packages/runtime/src/", "apps/server/src/", "apps/web/src/"].flatMap(sourceFiles);
const PRODUCTION_FILES = ALL_FILES.filter((path) => !isTestFile(path));

function scriptOf(path: string): string {
  const text = read(path);
  if (!path.endsWith(".svelte")) return text;
  return [...text.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gu)].map((match) => match[1]).join("\n");
}

interface FileFacts {
  readonly calls: ReadonlySet<string>;
  readonly valueImports: readonly { readonly module: string; readonly names: readonly string[] }[];
}

function factsOf(path: string): FileFacts {
  const source = ts.createSourceFile(path, scriptOf(path), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const calls = new Set<string>();
  const valueImports: { module: string; names: string[] }[] = [];
  const visit = (node: ts.Node): void => {
    if (ts.isCallExpression(node)) {
      const callee = node.expression;
      if (ts.isIdentifier(callee)) calls.add(callee.text);
      else if (ts.isPropertyAccessExpression(callee)) calls.add(callee.name.text);
    }
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier) && node.importClause !== undefined && !node.importClause.isTypeOnly) {
      const bindings = node.importClause.namedBindings;
      const names = bindings === undefined ? [] : ts.isNamespaceImport(bindings) ? ["*"] : bindings.elements.filter((element) => !element.isTypeOnly).map((element) => (element.propertyName ?? element.name).text);
      if (node.importClause.name !== undefined) names.push("default");
      if (names.length > 0) valueImports.push({ module: node.moduleSpecifier.text, names });
    }
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword && ts.isStringLiteral(node.arguments[0]!)) {
      valueImports.push({ module: (node.arguments[0] as ts.StringLiteral).text, names: ["*"] });
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return { calls, valueImports };
}

const FACTS = new Map(ALL_FILES.map((path) => [path, factsOf(path)]));
const importers = (fragment: RegExp, files: readonly string[] = ALL_FILES): readonly string[] =>
  files.filter((path) => FACTS.get(path)!.valueImports.some((entry) => fragment.test(entry.module))).sort();

const RECEIPT = JSON.parse(read("planning/evidence-foundation-ux/evidence-value-authority-route-map.json")) as {
  readonly routes: readonly { readonly oldOperation: string; readonly currentProjection: string; readonly targetProfiles: readonly { readonly projection: string; readonly factoryShape: string; readonly factorySymbol: string; readonly dependency: string }[] }[];
  readonly noRoute: readonly { readonly projection: string; readonly disposition: string; readonly requiredAction: string }[];
  readonly summary: Readonly<Record<string, unknown>>;
};

describe("value authority: static closure", () => {
  it("only evidence-factories.ts calls declareEvidence outside tests (criterion 5, §8.1)", () => {
    const callers = PRODUCTION_FILES.filter((path) => FACTS.get(path)!.calls.has("declareEvidence")).sort();
    expect(callers).toEqual(["packages/runtime/src/evidence-factories.ts"]);
    expect(PRODUCTION_FILES.filter((path) => FACTS.get(path)!.calls.has("identitySealedEvidenceWithoutValueReceipt"))).toEqual([]);
    expect(existsSync(new URL("packages/runtime/src/evidence-source-adapters.ts", ROOT))).toBe(false);
    // The census would detect a new caller (able to fail).
    const probe = ts.createSourceFile("probe.ts", "const leaked = declareEvidence(p, q, payload, authority);", ts.ScriptTarget.Latest, true);
    let found = false;
    const visit = (node: ts.Node): void => { if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "declareEvidence") found = true; ts.forEachChild(node, visit); };
    visit(probe);
    expect(found).toBe(true);
  });

  it("only the central registry value-imports projection factories; no second dispatcher (criterion 19a)", () => {
    expect(importers(/(?:^|\/)evidence-factories\.js$/u, PRODUCTION_FILES)).toEqual(["packages/runtime/src/internal/evidence-value-routes.ts"]);
    const dispatcherImporters = importers(/internal\/evidence-value-routes\.js$/u, PRODUCTION_FILES);
    expect(dispatcherImporters.every((path) => path.startsWith("packages/runtime/src/"))).toBe(true);
    expect(dispatcherImporters).not.toContain("packages/runtime/src/index.ts");
    // Test-only fixtures never reach production.
    expect(importers(/\.test-support\.js$/u, PRODUCTION_FILES)).toEqual([]);
  });

  it("keeps the mint helper, receipts, dispatcher, factories and every retired adapter out of the package (§8.2)", () => {
    const barrel = read("packages/runtime/src/index.ts");
    const exported = new Set([...barrel.matchAll(/\b([A-Za-z_$][\w$]*)\b/gu)].map((match) => match[1]!));
    for (const name of ["declareEvidence", "evidenceValueReceipt", "identitySealedEvidenceWithoutValueReceipt", "invokeEvidenceValueRoute", "evidenceValueRouteRegistry", "mint"]) expect(exported.has(name), name).toBe(false);
    for (const meta of REGISTRY) expect(exported.has(meta.symbol), meta.symbol).toBe(false);
    const oldOperations = new Set(RECEIPT.routes.map((row) => row.oldOperation));
    for (const name of [...oldOperations, "declareSerializedReviewStoryEvidence", "declarePhaseReadingEvidence", "declareNamedStructureEvidence", "declarePivotalMarkerEvidence", "declareEndgameReadingEvidence", "declareRecordedEngineEvidence", "declareRecordedTablebaseEvidence", "declareMaiaPolicyEvidence", "declareExplorerPositionEvidence", "declareExplorerPopulationEvidence", "declareEvidenceReferenceResolution"]) {
      expect(exported.has(name), name).toBe(false);
    }
    const manifest = JSON.parse(read("packages/runtime/package.json")) as { readonly exports: Readonly<Record<string, string>> };
    // The provider scheduler-only subpath carries receipt constructors, not an evidence mint; its sole
    // importer is census-checked in provider-protocol.test.ts.
    expect(Object.keys(manifest.exports).sort()).toEqual([".", "./provider-exchange-authority", "./rating"]);
    expect(Object.values(manifest.exports).some((path) => /internal|factories|test-support/u.test(path))).toBe(false);
  });
});

// ---------------------------------------------------------------------------------------------
// §8.3-§8.4 registry, catalogue and migration-receipt equality
// ---------------------------------------------------------------------------------------------

const ACTIVE = PRIMARY_EVIDENCE_MANIFEST.projections.filter((projection) => projection.disposition?.kind !== "retired").map(exact).sort();
const RETIRED = PRIMARY_EVIDENCE_MANIFEST.projections.filter((projection) => projection.disposition?.kind === "retired").map(exact).sort();
/** Receipt targets retired after migration, each with its typed successor route. */
const RETIRED_AFTER_MIGRATION: ReadonlyMap<string, string> = new Map([["derived.story.eval_shift@1", "derived.review.eval_delta@1"]]);

describe("value authority: registry equality", () => {
  it("is set-equal to every non-retired catalogue projection, with bindings a subset (§8.3, criterion 13)", () => {
    expect([...ROUTES.keys()].sort()).toEqual(ACTIVE);
    // 216 + the five typed Review projections and forced-mate v2 and the concept reference, less the retired Story eval shift
    // (rfc/review-evidence-compiler.md).
    expect(ACTIVE).toHaveLength(222);
    expect(RETIRED).toEqual([
      "derived.story.eval_shift@1",
      "rules.endgame.reading@1", "rules.phase.reading@1", "rules.pivotal.marker@1",
      "rules.structural.predicate.result@1", "rules.structural.reading.named_structure@1", "rules.structural.reading.pawn_count@1",
    ]);
    for (const route of RETIRED) expect(() => invoke(route, { fen: "8/8/8/8/8/8/8/K6k w - - 0 1" })).toThrow(/Unknown evidence value route/u);
    for (const binding of PRIMARY_EVIDENCE_MANIFEST.bindings) expect(ROUTES.has(exact(binding.projection)), exact(binding.projection)).toBe(true);
    // No consumer binds a retired v1 id (criteria 8/9, §8.7).
    expect(PRIMARY_EVIDENCE_MANIFEST.bindings.filter((binding) => RETIRED.includes(exact(binding.projection)))).toEqual([]);
    for (const meta of REGISTRY) {
      expect(meta.symbol).toBe(evidenceFactorySymbol(meta.route));
      expect(meta.arms.length, meta.route).toBeGreaterThan(0);
    }
  });

  it("refuses unknown routes, missing/extra keys and crossed sealed inputs before invocation (criterion 19a)", () => {
    const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    expect(() => invoke("rules.castling.reading.rights@9", { fen })).toThrow(/Unknown evidence value route/u);
    expect(() => invoke("toString", { fen })).toThrow(/Unknown evidence value route/u);
    expect(() => invoke("rules.castling.reading.rights@1", {})).toThrow(/missing: fen/u);
    expect(() => invoke("rules.castling.reading.rights@1", { fen, payload: { white: "both" } })).toThrow(/extra: payload/u);
    expect(() => invoke("rules.castling.reading.rights@1", Object.create({ fen }))).toThrow(/plain authority-input record/u);
    const reading = invoke("rules.castling.reading.rights@1", { fen }) as DeclaredEvidence<unknown>;
    // A sealed value of another projection is a crossed input.
    expect(() => invoke("derived.tactic.fork_survives_reply@1", { doubleAttack: reading, breadth: reading })).toThrow(/is sealed rules\.castling\.reading\.rights@1/u);
    // No factory accepts a payload, output, receipt, factory name or ancestry field.
    for (const meta of REGISTRY) for (const arm of meta.arms) for (const key of Object.keys(arm)) {
      expect(["payload", "output", "receipt", "factory", "ancestry", "matched", "cause"], `${meta.route}.${key}`).not.toContain(key);
    }
  });

  it("migrates exactly the literal route receipt: every old route reaches one final factory (§8.4, criteria 1/4)", () => {
    expect(RECEIPT.summary).toMatchObject({ routeCount: 204, distinctCurrentProjections: 200, noRouteCount: 6 });
    expect(RECEIPT.routes).toHaveLength(204);
    expect(RECEIPT.summary.duplicateProjections).toEqual(["human.maia.event@1", "live.stockfish.eval@1", "live.syzygy.result@1", "rules.structural.reading.named_structure@1"]);
    const targets = new Map<string, Set<string>>();
    for (const row of RECEIPT.routes) {
      expect(row.targetProfiles.length, row.oldOperation).toBeGreaterThan(0);
      for (const target of row.targetProfiles) {
        expect(target.projection, row.oldOperation).not.toMatch(/\*|generic/u);
        // rfc/review-evidence-compiler.md §5 retires this receipt target after migration: its route
        // is removed with the projection, and the typed Review successor carries the evidence.
        if (RETIRED_AFTER_MIGRATION.has(target.projection)) {
          expect(ROUTES.has(target.projection), target.projection).toBe(false);
          expect(ROUTES.has(RETIRED_AFTER_MIGRATION.get(target.projection)!), target.projection).toBe(true);
          continue;
        }
        const meta = ROUTES.get(target.projection);
        expect(meta, `${row.oldOperation} -> ${target.projection}`).toBeDefined();
        expect(meta!.symbol).toBe(target.factorySymbol);
        expect(meta!.shape, target.projection).toBe(target.factoryShape);
        targets.set(target.projection, new Set([...(targets.get(target.projection) ?? []), row.currentProjection]));
      }
    }
    // The four duplicate-route projections collapse to one final factory each.
    for (const duplicate of RECEIPT.summary.duplicateProjections as readonly string[]) {
      const rows = RECEIPT.routes.filter((row) => row.currentProjection === duplicate);
      expect(rows.length).toBe(2);
      expect(new Set(rows.flatMap((row) => row.targetProfiles.map((target) => target.factorySymbol))).size).toBe(1);
    }
    // No-route declarations: the retired one stays factoryless; the other five gained factories.
    for (const row of RECEIPT.noRoute) {
      if (row.requiredAction === "remain_factoryless") expect(ROUTES.has(row.projection), row.projection).toBe(false);
      else expect(ROUTES.has(row.projection), row.projection).toBe(true);
    }
    // The registry is exactly the receipt's targets plus the five no-route factories and method_stage.
    const extra = [...ROUTES.keys()].filter((route) => !targets.has(route)).sort();
    // Plus the six provider-exchange routes (rfc/provider-exchange-and-execution.md §9), which have no
    // pre-exchange route in the frozen receipt.
    // Plus the six typed Review routes (rfc/review-evidence-compiler.md), which post-date the receipt.
    // Plus rfc/concept-registry.md §3's identity-only authored reference, which has no pre-registry route.
    expect(extra).toEqual(["derived.grade.move_quality@1", "derived.opening.deepest_reached@1", "derived.review.eval_delta@1", "derived.review.eval_point@1", "derived.review.mate_transition@1", "derived.review.wdl_point@1", "derived.review.wdl_white@1", "human.explorer.position_page@1", "human.maia.policy_page@1", "live.stockfish.legal_root_table@1", "live.stockfish.position_eval@1", "live.syzygy.position_result@1", "pack.authored.concept_reference@1", "rules.endgame.tablebase_domain@1", "rules.tactic.consequence.forced_mate_after_move@2", "run.record.position@1", "theory.endgame.method_stage@1", "theory.opening.catalogue_membership@1", "theory.opening.current_endpoint@1"]);
  });

  it("re-derives the 75 generic caller-payload adapter partition from the literal receipt (criterion 25)", () => {
    const specialized = new Set(["declarePackPhaseEvidence", "declareMaiaCandidateWdlEvidence", "declareExactLegalMovesEvidence", "declarePawnContactsEvidence", "declareStructuralReadingSourceEvidence", "declareTransitionReadingSourceEvidence", "declareStructuralPredicateFeatureEvidence", "declareOpponentProviderEvidence", "declareLivePacketEvidence", "declareSourcingRecordEvidence", "declareCompareDerivedEvidence", "declareRunRecordEvidence", "declareStoryDerivedEvidence", "declareStructuralSemanticSourceEvidence", "declareTransitionSemanticSourceEvidence", "declareAvoidanceEvidence", "declareRecordedEdgeEvidence"]);
    const generic = RECEIPT.routes.filter((row) => !specialized.has(row.oldOperation) && !/^declareRecorded(?!Engine|Tablebase)/u.test(row.oldOperation));
    expect(generic).toHaveLength(75);
    const partition: Record<string, number> = {};
    for (const row of generic) {
      const shape = ROUTES.get(row.targetProfiles[0]!.projection)!.shape;
      partition[shape] = (partition[shape] ?? 0) + 1;
    }
    // Correction recorded in the RFC changelog (2026-09-24): the literal receipt yields 35/27/9/4.
    expect(partition).toEqual({ computed: 35, derived: 27, source_receipt: 9, authored_authority: 4 });
    // [[D2327]]: the two runtime recorded readings are derived from their same-record ledger evidence.
    expect(ROUTES.get("recorded.engine.eval@1")!.shape).toBe("derived");
    expect(ROUTES.get("recorded.tablebase.result@1")!.shape).toBe("derived");
    expect(ROUTES.get("recorded.engine.eval@1")!.arms).toEqual([{ ledger: { kind: "sealed", routes: ["sourcing.ledger.engine_eval@1"] } }]);
  });

  it("keeps the §3 twenty-row grounding review: 9 literal / 6 under convention / 2 classifiers / 3 split (criteria 2/7)", () => {
    const projection = (route: string) => PRIMARY_EVIDENCE_MANIFEST.projections.find((value) => exact(value) === route)!;
    const literal = ["rules.castling.reading.rights@1", "rules.castling.reading.legality@1", "rules.castling.event.rights_lost@1", "rules.structural.reading.pawn_connectivity@1", "rules.structural.event.pawn_islands@1", "rules.tactic.consequence.mate_in_one@1", "rules.tactic.consequence.reply_breadth@1", "rules.tactic.event.check@1", "rules.tactic.reading.rook_on_seventh@1"];
    const convention = ["rules.square.reading.control@1", "rules.square.event.control@1", "rules.tactic.reading.defender_duty_set@1", "rules.tactic.event.defender_removed@1", "rules.tactic.event.defender_duty_relocated@1", "rules.tactic.consequence.forced_mate_after_move@1"];
    for (const route of literal) {
      expect(projection(route)).toMatchObject({ grounding: "position_rules", exactness: "exact" });
      expect(ROUTES.get(route)).toMatchObject({ shape: "computed", dependency: "none" });
    }
    for (const route of convention) {
      expect(projection(route)).toMatchObject({ grounding: "position_rules", exactness: "exact" });
      // D1: closure is carried by semantic-convention-provenance, stated as an explicit pending gap.
      expect(ROUTES.get(route)).toMatchObject({ shape: "computed", dependency: "semantic-convention-provenance" });
      expect(ROUTES.get(route)!.pending).toMatch(/semantic-convention-provenance/u);
    }
    expect(projection("rules.phase.reading@2")).toMatchObject({ grounding: "declared_convention", exactness: "convention" });
    expect(projection("rules.structural.reading.named_structure@2")).toMatchObject({ grounding: "declared_convention", exactness: "convention", operands: ["id", "name", "provenanceNote"] });
    for (const route of ["rules.endgame.classification@1", "theory.endgame.setup_match@1", "derived.pivotal.irreversibility@1", "derived.pivotal.phase_change@1", "derived.pivotal.human_divergence@1", "derived.pivotal.option_collapse@1", "derived.structural.predicate_result@1"]) expect(ROUTES.has(route), route).toBe(true);
    expect(projection("derived.pivotal.human_divergence@1").grounding).not.toBe("position_rules");
    expect(projection("derived.structural.predicate_result@1")).toMatchObject({ grounding: "authored_claim", derivation: { inputs: [{ id: "authored.structural_condition.input", version: 1 }] } });
  });
});

// ---------------------------------------------------------------------------------------------
// §3 successors: phase v2, named structure v2, endgame split, predicate result
// ---------------------------------------------------------------------------------------------

describe("value authority: corrected successors", () => {
  const phase = (fen: string) => (invoke("rules.phase.reading@2", { fen }) as DeclaredEvidence<ReturnType<typeof phaseBandReading>>).payload;
  const withMaterial = (points: number): string => {
    // White: king + non-pawn pieces summing to `points`; black: bare king. No minor on a home square.
    const values = [["Q", 9], ["R", 5], ["N", 3]] as const;
    const search = (left: number, from: number, chosen: string[]): string[] | undefined => {
      if (left === 0) return chosen;
      if (chosen.length === 5) return undefined;
      for (let index = from; index < values.length; index += 1) {
        const [piece, value] = values[index]!;
        if (value <= left) { const found = search(left - value, index, [...chosen, piece]); if (found !== undefined) return found; }
      }
      return undefined;
    };
    const pieces = search(points, 0, []);
    if (pieces === undefined) throw new Error(`fixture cannot reach ${points}`);
    const empties = 5 - pieces.length;
    return `4k3/8/8/8/8/${pieces.join("")}${empties + 3}/8/4K3 w - - 0 1`;
  };

  it("derives phase and one of five decision arms together from one FEN (criterion 8)", () => {
    const arms = new Set<string>();
    const cases: readonly [string, string, Record<string, number>][] = [
      [withMaterial(13), "endgame_material_band", { observed: 13, boundary: 13, marginInsideBand: 0 }],
      [withMaterial(14), "material_transition_gap", { observed: 14, distanceToEndgameBand: 1, distanceToDevelopedBand: 4 }],
      [withMaterial(17), "material_transition_gap", { observed: 17, distanceToEndgameBand: 4, distanceToDevelopedBand: 1 }],
      ["rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", "opening_development_band", { observed: 8, boundary: 5, marginInsideBand: 3 }],
      ["rn1qkb1r/pppppppp/8/8/8/8/PPPPPPPP/RN1QKB1R w KQkq - 0 1", "development_transition_gap", { observed: 4, distanceToMiddlegameBand: 2, distanceToOpeningBand: 1 }],
      ["rn1qk2r/pppppppp/8/8/8/8/PPPPPPPP/RNBQK2R w KQkq - 0 1", "development_transition_gap", { observed: 3, distanceToMiddlegameBand: 1, distanceToOpeningBand: 2 }],
      ["r2qk2r/pppppppp/8/8/8/8/PPPPPPPP/RN1QK1NR w KQkq - 0 1", "middlegame_development_band", { observed: 2, boundary: 2, marginInsideBand: 0 }],
      ["rnbqk1nr/pppppppp/8/8/8/8/PPPPPPPP/RNBQK2R w KQkq - 0 1", "opening_development_band", { observed: 5, boundary: 5, marginInsideBand: 0 }],
    ];
    for (const [fen, kind, fields] of cases) {
      const value = phase(fen);
      expect(value.decision.kind, fen).toBe(kind);
      expect(value.decision.phase).toBe(value.phase);
      expect(value.decision).toMatchObject(fields);
      expect(value.conventionId).toBe("phase-bands@1");
      expect(Object.keys(value).sort()).toEqual(["conventionId", "decision", "fen", "material", "phase", "undevelopedMinors"]);
      expect(JSON.stringify(value)).not.toMatch(/confidence|probability|provenanceNote/u);
      arms.add(value.decision.kind);
    }
    expect(arms).toEqual(new Set(["endgame_material_band", "material_transition_gap", "opening_development_band", "middlegame_development_band", "development_transition_gap"]));
    expect(ENDGAME_MATERIAL_MAX).toBe(13);
    // The 13/14 and 2/3 and 4/5 and 17/18 boundaries fail independently.
    expect(phase(withMaterial(13)).phase).toBe("endgame");
    expect(phase(withMaterial(14)).phase).toBe("unclear");
    expect(phase(withMaterial(17)).phase).toBe("unclear");
    // A caller cannot supply a phase, arm, margin or boundary.
    for (const extra of [{ phase: "endgame" }, { decision: { kind: "endgame_material_band" } }, { marginInsideBand: 0 }, { boundary: 13 }]) {
      expect(() => invoke("rules.phase.reading@2", { fen: withMaterial(14), ...extra })).toThrow(/refused its authority inputs/u);
    }
  });

  it("computes named-structure@2 from the registered catalogue with exactly id/name/provenanceNote (criterion 26)", () => {
    const carlsbad = "r1bqr1k1/pp1nbppp/2p2n2/3p2B1/3P4/2NBP3/PPQ1NPPP/R4RK1 b - - 7 10";
    const values = invoke("rules.structural.reading.named_structure@2", { fen: carlsbad }) as readonly DeclaredEvidence<Record<string, string>>[];
    expect(values.map((value) => value.payload.id)).toEqual(["carlsbad"]);
    expect(Object.keys(values[0]!.payload).sort()).toEqual(["id", "name", "provenanceNote"]);
    expect(() => invoke("rules.structural.reading.named_structure@2", { fen: carlsbad, provenanceNote: "arbitrary prose" })).toThrow(/refused its authority inputs/u);
    expect(PRIMARY_EVIDENCE_MANIFEST.bindings.some((binding) => exact(binding.projection) === "rules.structural.reading.named_structure@1")).toBe(false);
    expect(JSON.stringify(values[0]!.payload)).not.toMatch(/nodeId|runId/u);
  });

  it("names Lucena/Philidor/Vancura only from a registered, cited setup convention's computed intersection (criterion 10)", () => {
    const lucenaLike = "1K1k4/1P6/8/8/8/8/r7/2R5 w - - 0 1";
    const classification = invoke("rules.endgame.classification@1", { fen: lucenaLike }) as readonly DeclaredEvidence<Record<string, unknown>>[];
    expect(classification.map((value) => (value.payload.type as { id: string } | null)?.id)).toEqual(["rook-and-pawn-vs-rook"]);
    expect(JSON.stringify(classification[0]!.payload)).not.toMatch(/lucena|philidor|vancura|technique/iu);
    const outcome = (id: string) => (invoke("theory.endgame.setup_match@1", { fen: lucenaLike, convention: { id, version: 1 } }) as { kind: string }).kind;
    expect([outcome("lucena-setup"), outcome("philidor-third-rank-setup"), outcome("vancura-setup")]).toEqual(["available", "not_matched", "not_matched"]);
    expect(invoke("theory.endgame.setup_match@1", { fen: lucenaLike, convention: { id: "lucena", version: 1 } })).toMatchObject({ kind: "unavailable", dependency: "semantic-convention-provenance" });
    expect(() => invoke("theory.endgame.setup_match@1", { fen: lucenaLike, convention: { id: "lucena-setup", version: 1 }, technique: "lucena" })).toThrow(/extra: technique/u);
    const forgedSetup = identitySealedEvidenceWithoutValueReceipt({ id: "theory.endgame", version: 1 }, { id: "theory.endgame.setup_match", version: 1 }, { fen: lucenaLike, technique: "lucena" });
    expect(() => invoke("theory.endgame.method_stage@1", { setup: forgedSetup, edges: [], convention: { id: "lucena-bridge-method", version: 1 } })).toThrow(/value-authority receipt/u);
    expect(PRIMARY_EVIDENCE_MANIFEST.projections.some((value) => value.id === "derived.endgame.setup_reachable")).toBe(false);
  });

  it("mints the structural predicate result only from the exact sealed authored condition (criterion 12)", () => {
    const fen = "rnbqkbnr/1ppppppp/8/8/8/8/1PPPPPPP/RNBQKBNR w KQkq - 0 1";
    const expression = { kind: "feature", feature: { kind: "open_file", file: "a" } };
    const condition = invoke("authored.structural_condition.input@1", { source: "shape", documentId: "shape-a", pointer: "/trigger", expression }) as DeclaredEvidence<unknown>;
    const result = invoke("derived.structural.predicate_result@1", { condition, fen }) as DeclaredEvidence<{ readonly matched: boolean; readonly condition: unknown }>;
    expect(result.payload.matched).toBe(true);
    expect(evidenceValueReceipt(result).sourceDigests).toEqual([evidenceValueReceipt(condition).payloadDigest]);
    expect(() => invoke("derived.structural.predicate_result@1", { condition: expression, fen })).toThrow(/refused its authority inputs/u);
    expect(() => invoke("derived.structural.predicate_result@1", { condition, fen, matched: false })).toThrow(/extra: matched/u);
    expect(() => invoke("derived.structural.predicate_result@1", { condition, fen, trace: [] })).toThrow(/extra: trace/u);
    const changed = invoke("derived.structural.predicate_result@1", { condition, fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" }) as DeclaredEvidence<{ readonly matched: boolean }>;
    expect(changed.payload.matched).toBe(false);
    const forged = identitySealedEvidenceWithoutValueReceipt({ id: "authored.structural_condition", version: 1 }, { id: "authored.structural_condition.input", version: 1 }, { source: "shape", documentId: "shape-a", pointer: "/trigger", expression: { kind: "not", of: expression } });
    expect(() => invoke("derived.structural.predicate_result@1", { condition: forged, fen })).toThrow(/value-authority receipt/u);
  });
});

// ---------------------------------------------------------------------------------------------
// D2144 negatives and authority-family refusals (criteria 6, 14-19)
// ---------------------------------------------------------------------------------------------

function after(fen: string, uci: string): string {
  const position = positionFromFen(fen);
  position.play(normalizeMove(position, parseUci(uci)!));
  return canonicalFen(position);
}

const INITIAL = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

describe("value authority: negative authority cases", () => {
  it("makes the D2144 impossible castling-loss event unrepresentable (criterion 14)", () => {
    expect(() => invoke("rules.castling.event.rights_lost@1", { beforeFen: INITIAL, moveUci: "e2e4", afterFen: INITIAL })).toThrow(/after FEN is not the result/u);
    expect(invoke("rules.castling.event.rights_lost@1", { beforeFen: INITIAL, moveUci: "e2e4", afterFen: after(INITIAL, "e2e4") })).toEqual([]);
    expect(() => invoke("rules.castling.event.rights_lost@1", { beforeFen: INITIAL, moveUci: "e2e4", afterFen: after(INITIAL, "e2e4"), cause: "rook_captured" })).toThrow(/extra: cause/u);
    const forged = identitySealedEvidenceWithoutValueReceipt({ id: "rules.castling", version: 1 }, { id: "rules.castling.event.rights_lost", version: 1 }, { beforeFen: INITIAL, moveUci: "e2e4", afterFen: INITIAL, color: "white", wing: "kingside", cause: "rook_captured" });
    expect(() => compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, { evidence: forged, anchor: { beforeFen: INITIAL, moveUci: "e2e4", afterFen: after(INITIAL, "e2e4"), side: "white" }, sign: "lost" })).toThrow(/value-authority receipt/u);
  });

  it("refuses the four same-key reading forgeries and the pawn-contact inversion (criterion 14)", () => {
    const loose = "4k3/8/8/8/8/8/4q3/4R1K1 w - - 0 1";
    for (const [route, fen] of [["rules.castling.reading.rights@1", INITIAL], ["rules.tactic.reading.loose_piece@1", loose], ["derived.material.reading.role_signature@1", INITIAL], ["rules.square.reading.control@1", INITIAL]] as const) {
      const genuine = invoke(route, { fen }) as DeclaredEvidence<Record<string, unknown>>;
      const mutated = { ...genuine.payload, fen: "8/8/8/8/8/8/8/K6k w - - 0 1" };
      expect(() => invoke(route, { fen: mutated })).toThrow(/refused its authority inputs/u);
      expect(() => invoke(route, mutated)).toThrow(/refused its authority inputs/u);
      const forged = identitySealedEvidenceWithoutValueReceipt(genuine.producer, genuine.projection, mutated);
      expect(() => evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "research.semantic_selection", version: 1 }, [forged])).toThrow(/value-authority receipt/u);
    }
    const contacts = invoke("rules.pawn.reading.contacts@1", { fen: "8/1p6/8/8/8/8/P7/4K2k w - - 0 1" }) as DeclaredEvidence<Record<string, unknown>>;
    const inverted = { ...contacts.payload, passed: [] };
    expect(() => invoke("rules.pawn.reading.contacts@1", { fen: inverted })).toThrow(/refused its authority inputs/u);
  });

  it("derived factories reject missing, extra, duplicate, wrong-version and same-id/different-value ancestry (criterion 15)", () => {
    const start = "4k3/8/4p3/3p4/4P3/8/8/4K3 w - - 0 1";
    const boundary = after(start, "e4d5");
    const capture = (invoke("rules.transition.event.capture@1", { beforeFen: start, moveUci: "e4d5", afterFen: boundary }) as readonly DeclaredEvidence<unknown>[])[0]!;
    const exchange = (invoke("rules.exchange.predicate.legal_exchange@1", { fen: start, captureUci: "e4d5" }) as readonly DeclaredEvidence<unknown>[])[0]!;
    expect((invoke("derived.exchange.capture_class@1", { capture, exchange }) as readonly unknown[]).length).toBe(1);
    expect(() => invoke("derived.exchange.capture_class@1", { capture })).toThrow(/missing: exchange/u);
    expect(() => invoke("derived.exchange.capture_class@1", { capture, exchange, class: "winning" })).toThrow(/extra: class/u);
    // Same projection id, different value: the exchange of another capture.
    const recapture = (invoke("rules.exchange.predicate.legal_exchange@1", { fen: boundary, captureUci: "e6d5" }) as readonly DeclaredEvidence<unknown>[])[0]!;
    expect(() => invoke("derived.exchange.capture_class@1", { capture, exchange: recapture })).toThrow(/not the exact exchange/u);
    // Wrong version: a v1 recorded move where the v2 successor requires run.record.edge@1.
    const path: RecordedMoveAnchor[] = [{ beforeNodeId: "n0", afterNodeId: "n1", beforeFen: canonicalFen(positionFromFen(start)), moveUci: "e4d5", afterFen: boundary }];
    const move = invoke("run.record.move@1", { path, offset: 0 }) as DeclaredEvidence<unknown>;
    expect(() => invoke("derived.pawn.sequence.contact_timing@2", { edges: [move] })).toThrow(/run\.record\.move@1, not run\.record\.edge@1/u);
    // Duplicate ancestry: the same recorded move twice is not an ordered window.
    expect(() => invoke("derived.pawn.sequence.harassment_pressure@1", { moves: [move, move] })).toThrow(/offset order/u);
    // Output payload supply is impossible: no route has an output-shaped key.
    expect(() => invoke("derived.exchange.capture_class@1", { capture, exchange, payload: {} })).toThrow(/extra: payload/u);
  });

  it("source factories refuse mismatched kind/source and derive recorded readings only from same-record ledger evidence (criteria 16, 25)", () => {
    const engine = { kind: "eval", source: "engine_validated", values: { centipawns: 20 } } as const;
    const model = { kind: "bestline", source: "human_model_predicted", values: { moves: ["e2e4"] } } as const;
    expect((invoke("live.stockfish.eval@1", { packet: engine }) as DeclaredEvidence<unknown>).projection.id).toBe("live.stockfish.eval");
    expect(() => invoke("live.stockfish.eval@1", { packet: model })).toThrow(/refused its authority inputs/u);
    expect(() => invoke("live.stockfish.pv@1", { packet: model })).toThrow(/refused its authority inputs/u);
    expect(() => invoke("human.maia.event@1", { packet: engine })).toThrow(/refused its authority inputs/u);
    expect(() => invoke("live.syzygy.category@1", { packet: engine })).toThrow(/refused its authority inputs/u);
    expect(() => invoke("live.stockfish.eval@1", { packet: { ...engine, sourceId: "caller" } })).toThrow(/refused its authority inputs/u);
    const record = { kind: "engine_eval", anchor: { fen: INITIAL }, sourceId: "sf", retrievedAt: "2026-01-01T00:00:00Z", grounds: "machine_validation", values: { centipawns: 20, depth: 20, multiPv: 1, perspective: "white", engineId: "sf", engineName: "Stockfish", engineVersion: "17" }, supports: [] };
    const ledger = invoke("sourcing.ledger.engine_eval@1", { record }) as DeclaredEvidence<unknown>;
    const reading = invoke("recorded.engine.eval@1", { ledger }) as { kind: string; value: DeclaredEvidence<{ readonly fen: string; readonly sourceId: string }> };
    expect(reading.kind).toBe("available");
    expect(reading.value.payload).toMatchObject({ fen: INITIAL, sourceId: "sf" });
    expect(evidenceValueReceipt(reading.value).sourceDigests).toEqual([evidenceValueReceipt(ledger).payloadDigest]);
    // Caller bytes, a tablebase record and a mutated same-FEN value never mint an engine reading.
    expect(() => invoke("recorded.engine.eval@1", { ledger: record })).toThrow(/refused its authority inputs/u);
    const tablebase = invoke("sourcing.ledger.tablebase_result@1", { record: { ...record, kind: "tablebase_result", values: { category: "draw", dtz: 0, precise_dtz: 0, dtm: null, pieceCount: 3, checkmate: false, stalemate: false, insufficient_material: true } } }) as DeclaredEvidence<unknown>;
    expect(() => invoke("recorded.engine.eval@1", { ledger: tablebase })).toThrow(/is sealed sourcing\.ledger\.tablebase_result@1/u);
    const mutated = identitySealedEvidenceWithoutValueReceipt(ledger.producer, ledger.projection, { ...record, values: { ...record.values, centipawns: 900 } });
    expect(() => invoke("recorded.engine.eval@1", { ledger: mutated })).toThrow(/value-authority receipt/u);
    expect(invoke("recorded.engine.eval@1", { ledger: invoke("sourcing.ledger.engine_eval@1", { record: { ...record, grounds: "citable_source" } }) })).toMatchObject({ kind: "unavailable" });
  });

  it("authored factories project only the authority's fields and never upgrade grounding (criterion 17)", () => {
    const item = { kind: "claim", id: "claim#one", revealedBy: { kind: "outcome", eventSeq: 4 }, anchor: { claimId: "one" }, text: "Authored sentence.", evidenceTypes: ["tablebase_exact"], earnedEvidenceTypes: ["tablebase_exact"], binding: "ledger_bound", authorSpans: [], principles: [] };
    expect((invoke("pack.authored.claim_delivery@1", { item }) as DeclaredEvidence<unknown>).payload).toEqual(item);
    expect(() => invoke("pack.authored.claim_delivery@1", { item: { ...item, note: "caller prose" } })).toThrow(/refused its authority inputs/u);
    expect(() => invoke("pack.authored.claim_delivery@1", { item: { ...item, earnedEvidenceTypes: ["engine_eval"] } })).toThrow(/earns evidence it does not declare/u);
    const annotation = { kind: "annotation", id: "a1", text: "Watch the d-file.", revealedBy: { kind: "checkpoint", eventSeq: 7 } };
    const claim = (invoke("pack.authored.claim@1", { item: annotation }) as readonly DeclaredEvidence<Record<string, string>>[])[0]!;
    expect(claim.payload).toEqual({ id: "a1", text: "Watch the d-file.", attribution: "authored:checkpoint:7" });
    expect(() => invoke("pack.authored.claim@1", { item: annotation, attribution: "caller" })).toThrow(/extra: attribution/u);
    for (const route of ["pack.authored.claim@1", "pack.authored.claim_delivery@1", "pack.authored.phase@1", "authored.structural_condition.input@1", "theory.shapes.firing@1"]) {
      expect(PRIMARY_EVIDENCE_MANIFEST.projections.find((value) => exact(value) === route)!.grounding, route).toBe("authored_claim");
    }
    expect(() => invoke("pack.authored.phase@1", { pack: { id: "p", phase: "all_phases" } })).toThrow(/refused its authority inputs/u);
  });

  it("receipts record input/source digests and assertDeclaredEvidence rechecks the payload digest (criterion 18)", () => {
    const reading = invoke("rules.castling.reading.rights@1", { fen: INITIAL }) as DeclaredEvidence<unknown>;
    const receipt = evidenceValueReceipt(reading);
    expect(receipt).toMatchObject({ projection: { id: "rules.castling.reading.rights", version: 1 }, factory: "createRulesCastlingReadingRightsV1Evidence", payloadDigest: evidenceDigest(reading.payload), inputDigest: evidenceDigest({ fen: INITIAL }), sourceDigests: [] });
    expect(() => assertDeclaredEvidence(reading)).not.toThrow();
    expect(Object.isFrozen(reading.payload)).toBe(true);
    const clone = { ...reading };
    expect(() => assertDeclaredEvidence(clone)).toThrow(/not constructed/u);
  });

  it("every admission surface rejects identity-sealed, value-unverified wrappers (criterion 19)", () => {
    const genuine = invoke("rules.phase.reading@2", { fen: INITIAL }) as DeclaredEvidence<unknown>;
    const forged = identitySealedEvidenceWithoutValueReceipt(genuine.producer, genuine.projection, genuine.payload);
    for (const consumer of ["guidance.deterministic", "guidance.voice", "guidance.voice_story"]) {
      expect(() => evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: consumer, version: 1 }, [forged])).toThrow(/value-authority receipt/u);
    }
    const view = evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "guidance.deterministic", version: 1 }, [genuine]);
    expect(renderEvidenceItems(view, { "rules.phase.reading@2": () => ["ok"] }).items).toHaveLength(1);
    expect(() => renderEvidenceItems({ ...view, items: [forged] } as never, { "rules.phase.reading@2": () => ["forged"] })).toThrow(/not constructed by evidenceForConsumer/u);
    const edge = { beforeFen: INITIAL, moveUci: "e2e4", afterFen: after(INITIAL, "e2e4") };
    const event = structuralSemanticEvents(edge.beforeFen, edge.moveUci, edge.afterFen)[0]!;
    const forgedEvent = identitySealedEvidenceWithoutValueReceipt(event.evidence.producer, event.evidence.projection, event.evidence.payload);
    expect(() => compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, { evidence: forgedEvent, anchor: event.anchor, sign: event.sign })).toThrow(/value-authority receipt/u);
  });
});

// ---------------------------------------------------------------------------------------------
// §7 one permanent authority profile per final factory, pinned by payload digest
// ---------------------------------------------------------------------------------------------

type Outcome = { readonly availability: "available" | "unavailable" | "empty"; readonly cardinality: number; readonly payloadDigests: readonly string[]; readonly reason?: string };

function outcomeOf(result: unknown): Outcome {
  const sealed = (value: unknown): DeclaredEvidence<unknown> => {
    const candidate = (value as { readonly evidence?: unknown }).evidence ?? value;
    assertDeclaredEvidence(candidate);
    return candidate as DeclaredEvidence<unknown>;
  };
  const digests = (values: readonly unknown[]) => values.map((value) => evidenceValueReceipt(sealed(value)).payloadDigest);
  if (Array.isArray(result)) return { availability: result.length === 0 ? "empty" : "available", cardinality: result.length, payloadDigests: digests(result) };
  const record = result as { readonly kind?: string; readonly value?: unknown; readonly reason?: string };
  if (record.kind === "unavailable") return { availability: "unavailable", cardinality: 0, payloadDigests: [], reason: record.reason! };
  if (record.kind === "available") {
    const values = Array.isArray(record.value) ? record.value : [record.value];
    return { availability: "available", cardinality: values.length, payloadDigests: digests(values) };
  }
  return { availability: "available", cardinality: 1, payloadDigests: digests([result]) };
}

const at = "2026-09-24T00:00:00.000Z";
const policyConfig = { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } } as const;
const FENS = Object.freeze([
  INITIAL,
  "r1bqr1k1/pp1nbppp/2p2n2/3p2B1/3P4/2NBP3/PPQ1NPPP/R4RK1 b - - 7 10",
  "r3k2r/pppq1ppp/2npbn2/4p3/2B1P3/2NP1N2/PPPQ1PPP/R3K2R w KQkq - 0 1",
  "1B5k/r2pq3/2n5/8/8/8/8/4R1K1 w - - 0 1",
  "8/8/8/4k3/8/4K3/8/8 w - - 0 1",
  "4r1k1/8/8/8/8/8/3Q4/6K1 w - - 0 1",
  "7k/5Q2/6K1/8/8/8/8/8 w - - 0 1",
  "6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1",
  "7k/8/8/8/4r3/5N2/6B1/7K w - - 0 1",
  "4k3/P7/8/8/8/8/8/4K3 w - - 0 1",
  "6k1/1R6/8/8/8/8/8/6K1 w - - 0 1",
  "4k2r/8/8/8/8/8/RP6/4K3 w - - 0 1",
  "4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1",
  "rnbqkbnr/1ppppppp/8/8/8/8/1PPPPPPP/RNBQKBNR w KQkq - 0 1",
  "r1bqkb1r/5ppp/p1np1n2/1p1Np3/4P3/N7/PPP2PPP/R2QKB1R w KQkq - 0 1",
  "4k3/8/8/2p5/1pP5/1P6/1P6/4K3 w - - 0 1",
  "4k3/8/8/8/4N3/3P4/8/4K3 w - - 0 1",
]);
const EDGE_SEEDS: readonly (readonly [string, string])[] = Object.freeze([
  [INITIAL, "e2e4"], [INITIAL, "g1f3"],
  ["r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1", "e1g1"], ["r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1", "h1h2"],
  ["4k3/4q3/8/8/8/8/4R3/4K3 w - - 0 1", "e2e7"], ["4k3/p7/8/4p3/3P4/8/8/4K3 w - - 0 1", "d4e5"],
  ["4k3/8/4p3/3p4/4P3/8/8/4K3 w - - 0 1", "e4d5"], ["4k3/P7/8/8/8/8/8/4K3 w - - 0 1", "a7a8q"],
  ["r3k3/1P6/8/8/8/8/8/4K3 w - - 0 1", "b7a8q"], ["7k/8/8/8/4r3/5N2/6B1/7K w - - 0 1", "f3h4"],
  ["4k3/8/8/8/8/8/4r3/4K3 w - - 0 1", "e1d1"], ["6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1", "a1a8"],
  ["4r1k1/8/8/8/8/8/3Q4/6K1 w - - 0 1", "d2e2"], ["1B5k/r2pq3/2n5/8/8/8/8/4R1K1 w - - 0 1", "b8a7"],
  ["4k3/8/3p4/8/8/8/P7/R3K3 w - - 0 1", "a1d1"], ["4k3/8/8/8/8/8/P7/R3K3 w - - 0 1", "a1d1"],
  ["r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3", "f1b5"],
  ["rnbqkb1r/pppp1ppp/5n2/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3", "f3e5"],
  ["4k3/8/8/3p4/8/8/4P3/4K3 w - - 0 1", "e2e4"], ["4k3/1n6/8/8/8/8/1P6/4K3 w - - 0 1", "b2b4"],
  ["4k3/8/1n6/8/8/8/8/4K3 b - - 0 1", "b6d7"], ["r1bqkbnr/pppppppp/2n5/8/3P4/8/PPP1PPPP/RNBQKBNR w KQkq - 1 2", "d4d5"],
  ["8/5k2/8/8/8/8/2K5/8 w - - 0 1", "c2d3"], ["6k1/5pp1/7p/8/8/8/5PPP/3R2K1 w - - 0 1", "d1d8"],
  ["4k3/8/8/8/1n6/8/8/R3K3 b - - 0 1", "b4c2"], ["8/8/8/4k3/8/8/4K3/8 w - - 0 1", "e2e3"],
  ["4k3/8/8/3p4/2P5/2P5/8/4K3 w - - 0 1", "c4d5"], ["r1bqkb1r/5ppp/p1np1n2/1p2p3/4P3/N7/PPP2PPP/R2QKB1R b KQkq - 0 1", "d6d5"],
  ["r3k3/8/1n6/2B5/8/8/8/R3K3 w - - 0 1", "c5b6"], ["4k3/8/8/2Pp4/8/8/8/4K3 w - d6 0 1", "c5d6"],
]);

function edgesFor(route: string): readonly { beforeFen: string; moveUci: string; afterFen: string }[] {
  return EDGE_SEEDS.map(([fen, move]) => ({ beforeFen: fen, moveUci: move, afterFen: after(fen, move) }));
}

function firstNonEmpty(route: string, candidates: readonly unknown[]): unknown {
  for (const candidate of candidates) {
    const result = invoke(route, candidate);
    const outcome = outcomeOf(result);
    if (outcome.cardinality > 0) return candidate;
  }
  return candidates[0];
}

interface Profile { readonly valid: unknown; readonly falsify: () => void }

function runFixtures() {
  let run = createRun({ id: "value-authority", packId: "p", packDigest: `sha256:${"a".repeat(64)}`, startFen: "r3k2r/pppq1ppp/2npbn2/4p3/2B1P3/2NP1N2/PPPQ1PPP/R3K2R w KQkq - 0 1", seed: 1, createdAt: at, policyConfig });
  const root = run.activeCursor.nodeId;
  for (const move of ["e1g1", "e8c8", "c4e6", "d7e6", "c3d5", "f6d5", "e4d5"]) run = commitMove(run, move, { at }).run;
  const main = run.activeCursor.branchId;
  run = rewind(run, root, at).run;
  run = fork(run, root, { at }).run;
  for (const move of ["a2a3", "e8g8"]) run = commitMove(run, move, { at }).run;
  const alternative = run.activeCursor.branchId;
  const mainPath = branchPath(run, main);
  run = attachEvidence(run, mainPath[1]!.id, ["engine:a"], { kind: "eval", source: "engine_validated", values: { centipawns: 10, engineId: "sf" } }).run;
  run = attachEvidence(run, mainPath[2]!.id, ["engine:b"], { kind: "eval", source: "engine_validated", values: { centipawns: -400, engineId: "sf" } }).run;
  const seq = run.events.length;
  const recorded = { ...run, events: [...run.events,
    { seq, type: "checkpoint.reached", at, data: { checkpointId: "cp-e6", nodeId: mainPath[3]!.id, branchId: main } },
    { seq: seq + 1, type: "objective.state_changed", at, data: { nodeId: mainPath[3]!.id, from: "active", to: "preserved", evidenceRefs: [] } },
  ] } as unknown as DrillRun;
  const comparison = compareBranches(recorded, [main, alternative]);
  return { run: recorded, main, alternative, comparison };
}

/** Recorded runs with exactly one kind of pivotal marker each (synthetic recorded nodes where needed). */
function pivotalFixtures(): Readonly<Record<"irreversibility" | "phase_change" | "human_divergence" | "option_collapse", { readonly run: DrillRun; readonly branchId: string }>> {
  let queen = createRun({ id: "pivotal-queen", packId: "p", packDigest: `sha256:${"c".repeat(64)}`, startFen: "4k3/4q3/8/8/8/8/4R3/4K3 w - - 0 1", seed: 1, createdAt: at, policyConfig });
  queen = commitMove(queen, "e2e7", { at }).run;
  let trade = createRun({ id: "pivotal-phase", packId: "p", packDigest: `sha256:${"d".repeat(64)}`, startFen: "r2qk2r/8/8/8/8/8/8/R2QK2R w - - 0 1", seed: 1, createdAt: at, policyConfig });
  for (const move of ["d1d8", "e8d8"]) trade = commitMove(trade, move, { at }).run;
  const synthetic = (id: string, fens: readonly string[], events: DrillRun["events"] = []): DrillRun => {
    const nodes = fens.map((fen, index) => Object.freeze({ id: `n${index}`, parentId: index === 0 ? null : `n${index - 1}`, fen, transposeKey: fen.split(" ", 4).join(" "), moveUci: null, moveSan: null, ply: index, actor: index === 0 ? "system" : "user", branchId: "main", checkpointRefs: [], objectiveState: "active", evidenceRefs: [], createdAt: at }));
    const branch = { id: "main", forkNodeId: "n0", label: "Main", seed: 1, origin: "played" } as const;
    const header = { id, sessionKind: "position", packId: null, packDigest: null, sessionDigest: "sha256:test", start: { fen: fens[0]!, side: "white" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common", targetElo: 1500 }, policyConfig } as const;
    const started = { seq: 0, type: "run.started", at, data: { ...header, rootNode: nodes[0]!, branch, activeCursor: { nodeId: nodes[0]!.id, branchId: "main" } } } as const;
    return Object.freeze({ schemaVersion: "0.17", ...header, nodes, branches: [branch], events: [started, ...events], activeCursor: { nodeId: nodes.at(-1)!.id, branchId: "main" } }) as unknown as DrillRun;
  };
  const collapse = synthetic("pivotal-collapse", ["4k3/8/8/8/8/8/8/R3K3 w - - 0 1", "4k3/8/8/8/8/8/4r3/4K3 w - - 0 1", "4k3/8/8/8/8/8/3r4/3K4 w - - 0 1"]);
  const engine = { id: "maia2", name: "Maia", version: "2", seedHonored: true };
  const divergence = synthetic("pivotal-divergence", [INITIAL, "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1"], [{ seq: 1, type: "opponent.move_selected", at, data: { nodeId: "n1", branchId: "main", moveUci: "e7e5", selection: { moveUci: "e7e5", policyModeApplied: "human_common", engine, candidates: [{ moveUci: "e7e5", mass: 0.34, rank: 1 }, { moveUci: "c7c5", mass: 0.33, rank: 2 }, { moveUci: "e7e6", mass: 0.33, rank: 3 }] } } }] as unknown as DrillRun["events"]);
  return {
    irreversibility: { run: queen, branchId: queen.activeCursor.branchId },
    phase_change: { run: trade, branchId: trade.activeCursor.branchId },
    human_divergence: { run: divergence, branchId: "main" },
    option_collapse: { run: collapse, branchId: "main" },
  };
}

function buildProfiles(): ReadonlyMap<string, Profile> {
  const profiles = new Map<string, Profile>();
  const refused = (route: string, inputs: unknown) => () => { expect(() => invoke(route, inputs), `${route} falsifier`).toThrow(); };
  const { run, main, comparison } = runFixtures();
  const mainPath = branchPath(run, main);
  for (const meta of REGISTRY) {
    const arm = meta.arms[0]!;
    const keys = Object.keys(arm).sort().join(",");
    if (keys === "fen") {
      const valid = firstNonEmpty(meta.route, FENS.map((fen) => ({ fen })));
      const payload = outcomeOf(invoke(meta.route, valid));
      profiles.set(meta.route, { valid, falsify: refused(meta.route, { fen: payload.payloadDigests.length > 0 ? { forged: payload.payloadDigests[0] } : 42 }) });
    } else if (keys === "afterFen,beforeFen,moveUci") {
      const valid = firstNonEmpty(meta.route, edgesFor(meta.route));
      profiles.set(meta.route, { valid, falsify: refused(meta.route, { beforeFen: INITIAL, moveUci: "e2e4", afterFen: INITIAL }) });
    } else if (keys === "feature,fen") {
      const kind = meta.route.split(".")[3]!.replace("@1", "");
      const features: Readonly<Record<string, unknown>> = {
        backward_pawn: { kind, color: "white", file: "d" }, bishop_on_shade: { kind, color: "white", shade: "light" }, direct_attack_count: { kind, color: "white", square: "e5", comparison: "equal", count: 1 },
        doubled_pawn: { kind, color: "white", file: "a" }, half_open_file: { kind, color: "white", file: "a" }, isolated_pawn: { kind, color: "white", file: "a" }, king_opposition: { kind, color: "white", form: "direct" },
        king_zone: { kind, color: "white", zone: "edge" }, line_blockers: { kind, from: "a1", to: "a8", comparison: "equal", count: 0 }, named_structure: { kind, id: "carlsbad" }, open_file: { kind, file: "a" },
        outpost: { kind, color: "white", square: "d5" }, passed_pawn: { kind, color: "white", square: "a7" }, pawn_count: { kind, color: "white", basis: "count", comparison: "equal", count: 8 }, pawn_safe_square: { kind, color: "white", square: "d5" },
        piece_count: { kind, color: "white", role: "rook", basis: "count", comparison: "equal", count: 2 }, piece_distance: { kind, color: "white", role: "king", target: { kind: "piece", color: "black", role: "king" }, comparison: "equal", count: 7 }, piece_reach_count: { kind, color: "white", role: "knight", scope: "any", comparison: "atLeast", count: 2 },
      };
      const valid = { fen: INITIAL, feature: features[kind] };
      profiles.set(meta.route, { valid, falsify: refused(meta.route, { fen: INITIAL, feature: { kind: kind === "open_file" ? "half_open_file" : "open_file", file: "a" } }) });
    }
  }
  const edge = (fen: string, move: string) => ({ beforeFen: fen, moveUci: move, afterFen: after(fen, move) });
  const sealedOne = (route: string, inputs: unknown) => { const result = invoke(route, inputs); return (Array.isArray(result) ? result[0] : result) as DeclaredEvidence<unknown>; };
  const identity = (value: DeclaredEvidence<unknown>) => identitySealedEvidenceWithoutValueReceipt(value.producer, value.projection, value.payload);

  // Readings and sealed-input derivations.
  const capture = sealedOne("rules.transition.event.capture@1", edge("4k3/8/4p3/3p4/4P3/8/8/4K3 w - - 0 1", "e4d5"));
  const exchange = sealedOne("rules.exchange.predicate.legal_exchange@1", { fen: "4k3/8/4p3/3p4/4P3/8/8/4K3 w - - 0 1", captureUci: "e4d5" });
  profiles.set("rules.exchange.predicate.legal_exchange@1", { valid: { fen: "4k3/8/4p3/3p4/4P3/8/8/4K3 w - - 0 1", captureUci: "e4d5" }, falsify: refused("rules.exchange.predicate.legal_exchange@1", { fen: "4k3/8/4p3/3p4/4P3/8/8/4K3 w - - 0 1", captureUci: "e4d5", resultUnits: 9 }) });
  profiles.set("derived.exchange.capture_class@1", { valid: { capture, exchange }, falsify: refused("derived.exchange.capture_class@1", { capture, exchange: identity(exchange) }) });
  const mateFen = "7k/5Q2/6K1/8/8/8/8/8 w - - 0 1";
  const breadth = sealedOne("rules.tactic.consequence.reply_breadth@1", edge(mateFen, "f7g7"));
  profiles.set("rules.tactic.consequence.forced_mate_after_move@1", { valid: { beforeFen: mateFen, breadth, maxAttackerMoves: 1 }, falsify: refused("rules.tactic.consequence.forced_mate_after_move@1", { beforeFen: mateFen, breadth: breadth.payload, maxAttackerMoves: 1 }) });
  profiles.set("rules.tactic.consequence.forced_mate_after_move@2", { valid: { beforeFen: mateFen, breadth, maxAttackerMoves: 1 }, falsify: refused("rules.tactic.consequence.forced_mate_after_move@2", { beforeFen: mateFen, breadth: breadth.payload, maxAttackerMoves: 1 }) });
  const doubleAttack = sealedOne("rules.tactic.event.double_attack@1", edge("4k3/8/8/8/1n6/8/8/R3K3 b - - 0 1", "b4c2"));
  const forkBreadth = sealedOne("rules.tactic.consequence.reply_breadth@1", edge("4k3/8/8/8/1n6/8/8/R3K3 b - - 0 1", "b4c2"));
  profiles.set("derived.tactic.fork_survives_reply@1", { valid: { doubleAttack, breadth: forkBreadth }, falsify: refused("derived.tactic.fork_survives_reply@1", { doubleAttack: forkBreadth, breadth: forkBreadth }) });
  const discoveredEdge = edge("7k/8/8/8/4r3/5N2/6B1/7K w - - 0 1", "f3h4");
  const latency = sealedOne("rules.tactic.reading.discovered_latency@1", { fen: discoveredEdge.beforeFen });
  const rays = invoke("rules.transition.event.slider_ray@1", discoveredEdge) as readonly DeclaredEvidence<unknown>[];
  profiles.set("derived.tactic.discovered_executed@1", { valid: { latency, rays }, falsify: refused("derived.tactic.discovered_executed@1", { latency: identity(latency), rays }) });
  const conflictEdge = edge("1B5k/r2pq3/2n5/8/8/8/8/4R1K1 w - - 0 1", "b8a7");
  const conflictCapture = sealedOne("rules.transition.event.capture@1", conflictEdge);
  const duties = sealedOne("rules.tactic.reading.defender_duty_set@1", { fen: conflictEdge.beforeFen });
  profiles.set("derived.tactic.overloaded_defender_response_conflict@1", { valid: { duties, capture: conflictCapture }, falsify: refused("derived.tactic.overloaded_defender_response_conflict@1", { duties: conflictCapture, capture: conflictCapture }) });

  // Recorded path (v1 moves via validated anchors; v2 via exact run edges).
  const anchorsOf = (fen: string, moves: readonly string[]) => { let current = canonicalFen(positionFromFen(fen)); return moves.map((moveUci, index) => { const next = after(current, moveUci); const anchor = { beforeNodeId: `n${index}`, afterNodeId: `n${index + 1}`, beforeFen: current, moveUci, afterFen: next }; current = next; return anchor; }); };
  const movesOf = (anchors: readonly RecordedMoveAnchor[]) => anchors.map((_, offset) => invoke("run.record.move@1", { path: anchors, offset }) as DeclaredEvidence<unknown>);
  const tradeAnchors = anchorsOf("4k3/8/4p3/3p4/4P3/8/8/4K3 w - - 0 1", ["e4d5", "e6d5"]);
  const tradeMoves = movesOf(tradeAnchors);
  const firstCapture = sealedOne("rules.transition.event.capture@1", { beforeFen: tradeAnchors[0]!.beforeFen, moveUci: "e4d5", afterFen: tradeAnchors[0]!.afterFen });
  const secondCapture = sealedOne("rules.transition.event.capture@1", { beforeFen: tradeAnchors[1]!.beforeFen, moveUci: "e6d5", afterFen: tradeAnchors[1]!.afterFen });
  profiles.set("run.record.move@1", { valid: { path: tradeAnchors, offset: 0 }, falsify: refused("run.record.move@1", { path: [{ ...tradeAnchors[0]!, afterFen: tradeAnchors[0]!.beforeFen }], offset: 0 }) });
  profiles.set("derived.exchange.trade_completed@1", { valid: { first: firstCapture, second: secondCapture, firstMove: tradeMoves[0], secondMove: tradeMoves[1] }, falsify: refused("derived.exchange.trade_completed@1", { first: firstCapture, second: secondCapture, firstMove: tradeMoves[1], secondMove: tradeMoves[0] }) });
  const contactAnchors = anchorsOf("4k3/8/8/3p4/8/8/4P3/4K3 w - - 0 1", ["e2e4", "e8f7"]);
  profiles.set("derived.pawn.sequence.contact_timing@1", { valid: { moves: movesOf(contactAnchors) }, falsify: refused("derived.pawn.sequence.contact_timing@1", { moves: movesOf(contactAnchors).reverse() }) });
  const harassAnchors = anchorsOf("4k3/1n6/8/8/8/8/1P6/4K3 w - - 0 1", ["b2b4", "b7c5"]);
  // Immediate harassment pressure after 1.d4 d5 2.Nf3 Nf6 3.e3 Bg4: 4.h3 Bh5.
  const harassFen = "rn1qkb1r/ppp1pppp/5n2/3p4/3P2b1/4PN2/PPP2PPP/RNBQKB1R w KQkq - 1 4";
  const harassLine = anchorsOf(harassFen, ["h2h3", "g4h5"]);
  profiles.set("derived.pawn.sequence.harassment_pressure@1", { valid: { moves: movesOf(harassLine) }, falsify: refused("derived.pawn.sequence.harassment_pressure@1", { moves: movesOf(harassLine).slice(0, 1) }) });
  void harassAnchors;
  const deflection = anchorsOf("1B5k/r3q3/2n5/8/8/8/8/4R1K1 w - - 0 1", ["b8a7", "c6a7", "e1e7"]);
  const deflectionCaptures = deflection.flatMap((anchor) => invoke("rules.transition.event.capture@1", { beforeFen: anchor.beforeFen, moveUci: anchor.moveUci, afterFen: anchor.afterFen }) as readonly DeclaredEvidence<unknown>[]);
  const deflectionExchange = sealedOne("rules.exchange.predicate.legal_exchange@1", { fen: deflection[2]!.beforeFen, captureUci: "e1e7" });
  const deflectionDuty = sealedOne("rules.tactic.reading.defender_duty_set@1", { fen: deflection[0]!.beforeFen });
  profiles.set("derived.tactic.deflection_observed@1", { valid: { moves: movesOf(deflection), duty: deflectionDuty, captures: deflectionCaptures, exchange: deflectionExchange }, falsify: refused("derived.tactic.deflection_observed@1", { moves: movesOf(deflection), duty: deflectionDuty, captures: deflectionCaptures, exchange: exchange }) });
  profiles.set("derived.tactic.sequence.defender_consequence@1", { valid: { moves: movesOf(deflection) }, falsify: refused("derived.tactic.sequence.defender_consequence@1", { moves: movesOf(deflection).slice(1) }) });
  const interference = anchorsOf("r3k3/8/1R6/q7/8/8/8/6K1 w - - 0 1", ["b6a6", "e8d7", "a6a5"]);
  const interferenceDuty = sealedOne("rules.tactic.reading.defender_duty_set@1", { fen: interference[0]!.beforeFen });
  const interferenceExchange = sealedOne("rules.exchange.predicate.legal_exchange@1", { fen: interference[2]!.beforeFen, captureUci: "a6a5" });
  profiles.set("derived.tactic.interference_observed@1", { valid: { moves: movesOf(interference), duty: interferenceDuty, exchange: interferenceExchange }, falsify: refused("derived.tactic.interference_observed@1", { moves: movesOf(interference), duty: identity(interferenceDuty), exchange: interferenceExchange }) });
  const ray = anchorsOf("q3k3/8/8/8/N7/8/8/R3K3 w - - 0 1", ["a4b6", "e8f7", "a1a8"]);
  const rayExchange = sealedOne("rules.exchange.predicate.legal_exchange@1", { fen: ray[2]!.beforeFen, captureUci: "a1a8" });
  profiles.set("derived.tactic.line_blocker_clearance_observed@1", { valid: { moves: movesOf(ray), exchange: rayExchange }, falsify: refused("derived.tactic.line_blocker_clearance_observed@1", { moves: movesOf(ray), exchange: identity(rayExchange) }) });
  const square = anchorsOf("4k3/8/8/8/8/8/8/RN2K3 w - - 0 1", ["b1c3", "e8d7", "a1b1"]);
  profiles.set("derived.tactic.square_clearance_observed@1", { valid: { moves: movesOf(square) }, falsify: refused("derived.tactic.square_clearance_observed@1", { moves: movesOf(square).slice(0, 2) }) });
  const king = anchorsOf("4k3/8/4B3/8/8/8/8/R5K1 w - - 0 1", ["e6d7", "e8d7", "a1d1"]);
  const kingCaptures = king.flatMap((anchor) => invoke("rules.transition.event.capture@1", { beforeFen: anchor.beforeFen, moveUci: anchor.moveUci, afterFen: anchor.afterFen }) as readonly DeclaredEvidence<unknown>[]);
  const kingCheck = sealedOne("rules.tactic.event.check@1", { beforeFen: king[2]!.beforeFen, moveUci: king[2]!.moveUci, afterFen: king[2]!.afterFen });
  profiles.set("derived.tactic.attraction_observed@1", { valid: { moves: movesOf(king), captures: kingCaptures, check: kingCheck }, falsify: refused("derived.tactic.attraction_observed@1", { moves: movesOf(king), captures: kingCaptures }) });
  const overload = anchorsOf("1B5k/r2pq3/2n5/8/8/8/8/4R1K1 w - - 0 1", ["b8a7", "c6a7", "e1e7"]);
  const overloadCaptures = overload.flatMap((anchor) => invoke("rules.transition.event.capture@1", { beforeFen: anchor.beforeFen, moveUci: anchor.moveUci, afterFen: anchor.afterFen }) as readonly DeclaredEvidence<unknown>[]);
  const overloadExchange = sealedOne("rules.exchange.predicate.legal_exchange@1", { fen: overload[2]!.beforeFen, captureUci: "e1e7" });
  profiles.set("derived.tactic.overload_exploitation_observed@1", { valid: { moves: movesOf(overload), duty: sealedOne("rules.tactic.reading.defender_duty_set@1", { fen: overload[0]!.beforeFen }), captures: overloadCaptures, exchange: overloadExchange }, falsify: refused("derived.tactic.overload_exploitation_observed@1", { moves: movesOf(overload), duty: deflectionDuty, captures: overloadCaptures.slice(0, 2), exchange: overloadExchange }) });
  const check = sealedOne("rules.tactic.event.check@1", edge("4k3/8/8/8/8/8/8/R3K3 w - - 0 1", "a1a8"));
  const zc = anchorsOf("4k3/8/8/8/1b6/2N5/1P6/3Q2K1 b - - 0 1", ["b4c3", "d1h5", "e8f8", "b2c3"]);
  const zCapture = sealedOne("rules.transition.event.capture@1", { beforeFen: zc[0]!.beforeFen, moveUci: zc[0]!.moveUci, afterFen: zc[0]!.afterFen });
  const zCheck = sealedOne("rules.tactic.event.check@1", { beforeFen: zc[1]!.beforeFen, moveUci: zc[1]!.moveUci, afterFen: zc[1]!.afterFen });
  const zExchange = sealedOne("rules.exchange.predicate.legal_exchange@1", { fen: zc[3]!.beforeFen, captureUci: zc[3]!.moveUci });
  profiles.set("derived.tactic.check_zwischenzug_observed@1", { valid: { moves: movesOf(zc), capture: zCapture, check: zCheck, exchange: zExchange }, falsify: refused("derived.tactic.check_zwischenzug_observed@1", { moves: movesOf(zc), capture: zCapture, check, exchange: zExchange }) });

  // Exact run edges and the v2 successors.
  const edgeOf = (index: number) => invoke("run.record.edge@1", { run, parent: mainPath[index - 1], child: mainPath[index] }) as DeclaredEvidence<unknown>;
  const edges = [1, 2, 3].map(edgeOf);
  profiles.set("run.record.edge@1", { valid: { run, parent: mainPath[0], child: mainPath[1] }, falsify: refused("run.record.edge@1", { run, parent: mainPath[1], child: mainPath[0] }) });
  // Each v2 successor re-runs its v1 positive line as an actual recorded run and its exact edges.
  const lineEdges = (id: string, fen: string, moves: readonly string[]): readonly DeclaredEvidence<unknown>[] => {
    let line = createRun({ id, packId: "p", packDigest: `sha256:${"b".repeat(64)}`, startFen: fen, seed: 1, createdAt: at, policyConfig });
    for (const move of moves) line = commitMove(line, move, { at }).run;
    const path = branchPath(line, line.activeCursor.branchId);
    return path.slice(1).map((child, index) => invoke("run.record.edge@1", { run: line, parent: path[index], child }) as DeclaredEvidence<unknown>);
  };
  const contactEdges = lineEdges("contact", "4k3/8/8/3p4/8/8/4P3/4K3 w - - 0 1", ["e2e4", "e8f7"]);
  profiles.set("derived.pawn.sequence.contact_timing@2", { valid: { edges: contactEdges }, falsify: refused("derived.pawn.sequence.contact_timing@2", { edges: [contactEdges[1], contactEdges[0]] }) });
  const harassEdges = lineEdges("harass", harassFen, ["h2h3", "g4h5"]);
  profiles.set("derived.pawn.sequence.harassment_pressure@2", { valid: { edges: harassEdges }, falsify: refused("derived.pawn.sequence.harassment_pressure@2", { edges: harassEdges.slice(0, 1) }) });
  const deflectionEdges = lineEdges("deflection", "1B5k/r3q3/2n5/8/8/8/8/4R1K1 w - - 0 1", ["b8a7", "c6a7", "e1e7"]);
  profiles.set("derived.tactic.sequence.defender_consequence@2", { valid: { edges: deflectionEdges }, falsify: refused("derived.tactic.sequence.defender_consequence@2", { edges: [deflectionEdges[1], deflectionEdges[0], deflectionEdges[2]] }) });
  const squareEdges = lineEdges("square", "4k3/8/8/8/8/8/8/RN2K3 w - - 0 1", ["b1c3", "e8d7", "a1b1"]);
  profiles.set("derived.tactic.square_clearance_observed@2", { valid: { edges: squareEdges }, falsify: refused("derived.tactic.square_clearance_observed@2", { edges: [squareEdges[1], squareEdges[0], squareEdges[2]] }) });
  profiles.set("derived.tactic.deflection_observed@2", { valid: { edges: deflectionEdges, duty: deflectionDuty, captures: deflectionCaptures, exchange: deflectionExchange }, falsify: refused("derived.tactic.deflection_observed@2", { edges: deflectionEdges, duty: deflectionDuty, captures: [], exchange: deflectionExchange }) });
  const interferenceEdges = lineEdges("interference", "r3k3/8/1R6/q7/8/8/8/6K1 w - - 0 1", ["b6a6", "e8d7", "a6a5"]);
  profiles.set("derived.tactic.interference_observed@2", { valid: { edges: interferenceEdges, duty: interferenceDuty, exchange: interferenceExchange }, falsify: refused("derived.tactic.interference_observed@2", { edges: interferenceEdges, duty: interferenceExchange, exchange: interferenceExchange }) });
  const rayEdges = lineEdges("ray", "q3k3/8/8/8/N7/8/8/R3K3 w - - 0 1", ["a4b6", "e8f7", "a1a8"]);
  profiles.set("derived.tactic.line_blocker_clearance_observed@2", { valid: { edges: rayEdges, exchange: rayExchange }, falsify: refused("derived.tactic.line_blocker_clearance_observed@2", { edges: rayEdges, exchange: identity(rayExchange) }) });
  const overloadEdges = lineEdges("overload", "1B5k/r2pq3/2n5/8/8/8/8/4R1K1 w - - 0 1", ["b8a7", "c6a7", "e1e7"]);
  const overloadDuty = sealedOne("rules.tactic.reading.defender_duty_set@1", { fen: overload[0]!.beforeFen });
  profiles.set("derived.tactic.overload_exploitation_observed@2", { valid: { edges: overloadEdges, duty: overloadDuty, captures: overloadCaptures, exchange: overloadExchange }, falsify: refused("derived.tactic.overload_exploitation_observed@2", { edges: overloadEdges, duty: overloadDuty, captures: overloadCaptures.slice(0, 2), exchange: overloadExchange }) });
  const kingEdges = lineEdges("attraction", "4k3/8/4B3/8/8/8/8/R5K1 w - - 0 1", ["e6d7", "e8d7", "a1d1"]);
  profiles.set("derived.tactic.attraction_observed@2", { valid: { edges: kingEdges, captures: kingCaptures, check: kingCheck }, falsify: refused("derived.tactic.attraction_observed@2", { edges: kingEdges, captures: kingCaptures }) });
  const zEdges = lineEdges("zwischenzug", "4k3/8/8/8/1b6/2N5/1P6/3Q2K1 b - - 0 1", ["b4c3", "d1h5", "e8f8", "b2c3"]);
  profiles.set("derived.tactic.check_zwischenzug_observed@2", { valid: { edges: zEdges, capture: zCapture, check: zCheck, exchange: zExchange }, falsify: refused("derived.tactic.check_zwischenzug_observed@2", { edges: zEdges.slice(0, 3), capture: zCapture, check: zCheck, exchange: zExchange }) });
  const tradeFirst = sealedOne("rules.transition.event.capture@1", { beforeFen: mainPath[2]!.fen, moveUci: mainPath[3]!.moveUci!, afterFen: mainPath[3]!.fen });
  const tradeSecond = sealedOne("rules.transition.event.capture@1", { beforeFen: mainPath[3]!.fen, moveUci: mainPath[4]!.moveUci!, afterFen: mainPath[4]!.fen });
  profiles.set("derived.exchange.trade_completed@2", { valid: { first: tradeFirst, second: tradeSecond, firstEdge: edgeOf(3), secondEdge: edgeOf(4) }, falsify: refused("derived.exchange.trade_completed@2", { first: tradeFirst, second: tradeSecond, firstEdge: tradeMoves[0], secondEdge: tradeMoves[1] }) });
  const vancuraFen = "R7/6k1/P4r2/8/2K5/8/8/8 w - - 0 1";
  const vancuraSetup = (invoke("theory.endgame.setup_match@1", { fen: vancuraFen, convention: { id: "vancura-setup", version: 1 } }) as { readonly value: DeclaredEvidence<unknown> }).value;
  const vancuraEdges = lineEdges("vancura", vancuraFen, ["a6a7", "f6a6"]);
  profiles.set("theory.endgame.method_stage@1", { valid: { setup: vancuraSetup, edges: vancuraEdges, convention: { id: "vancura-method", version: 1 } }, falsify: refused("theory.endgame.method_stage@1", { setup: identity(capture), edges, convention: { id: "lucena-bridge-method", version: 1 } }) });
  profiles.set("theory.endgame.setup_match@1", { valid: { fen: "1K1k4/1P6/8/8/8/8/r7/2R5 w - - 0 1", convention: { id: "lucena-setup", version: 1 } }, falsify: refused("theory.endgame.setup_match@1", { fen: "4k2r/8/8/8/8/8/RP6/4K3 w - - 0 1", convention: { id: "lucena-setup", version: 1 }, technique: "lucena" }) });

  // Counterfactual absence: complete sealed alternative populations.
  const playedEdges = [edge("r3k2r/pppq1ppp/2npbn2/4p3/2B1P3/2NP1N2/PPPQ1PPP/R3K2R w KQkq - 0 1", "e1g1"), edge("4k3/pp4pp/8/2p5/1pP5/1P6/PP4PP/4K3 w - - 0 1", "e1d2"), edge("r1bqkb1r/5ppp/p1np1n2/1p2p3/4P3/N7/PPP2PPP/R2QKB1R b KQkq - 0 1", "h7h6"), edge("4k3/8/8/8/8/8/P1P5/4K3 w - - 0 1", "e1d1")];
  const alternativesByEdge = playedEdges.map((played) => ({ played, events: legalAlternativeEdges(played.beforeFen, played.moveUci).flatMap((alternative) => [
    ...structuralSemanticEvents(alternative.beforeFen, alternative.moveUci, alternative.afterFen),
    ...pawnIslandSemanticEvents(alternative.beforeFen, alternative.moveUci, alternative.afterFen),
    ...(loosePieceSemanticEvents(alternative.beforeFen, alternative.moveUci, alternative.afterFen) ?? []),
  ]) }));
  for (const meta of REGISTRY.filter((value) => value.route.startsWith("derived.semantic_avoidance."))) {
    const family = meta.route.replace("derived.semantic_avoidance.", "").replace("@1", "");
    const projection = family === "loose_piece" ? "rules.tactic.event.loose_piece" : family === "pawn_islands" ? "rules.structural.event.pawn_islands" : `rules.structural.event.${family}`;
    const found = alternativesByEdge.map(({ played, events }) => ({ played, candidates: events.filter((event) => event.projection.id === projection) })).find((entry) => entry.candidates.length > 0);
    const sign = found?.candidates[0]?.sign;
    const events = found === undefined || sign === undefined ? [] : [...new Map(found.candidates.filter((event) => event.sign === sign).map((event) => [event.anchor.moveUci, event])).values()];
    const played = found?.played ?? playedEdges[0]!;
    profiles.set(meta.route, { valid: events.length === 0 ? undefined : { ...played, sign, events }, falsify: refused(meta.route, { ...played, sign: "gained", events: transitionSemanticEvents(played.beforeFen, played.moveUci, played.afterFen).slice(0, 1) }) });
  }

  // Story, comparison, recorded run and pivotal projections.
  const runInputs = { run, comparison, branchId: main };
  for (const route of ["derived.compare.engine_trajectory@1", "derived.compare.eval_delta@1", "derived.compare.structure_delta@1", "derived.compare.piece_route@1", "run.record.checkpoint_hit@1", "run.record.objective_transition@1"]) {
    profiles.set(route, { valid: runInputs, falsify: refused(route, { ...runInputs, comparison: { ...comparison, forkNodeId: mainPath[3]!.id, evidence: { [main]: [{ nodeId: "forged", plyOffset: 1, evidenceRefs: [], kind: "eval", source: "engine_validated", score: { kind: "cp", value: 999 } }] } } }) });
  }
  profiles.set("run.record.consequence@1", { valid: runInputs, falsify: refused("run.record.consequence@1", { ...runInputs, branchId: "missing" }) });
  profiles.set("run.record.fork@1", { valid: { run, comparison }, falsify: refused("run.record.fork@1", { run, comparison: { ...comparison, forkNodeId: "missing" } }) });
  profiles.set("run.record.position@1", { valid: { run, nodeId: mainPath[2]!.id }, falsify: refused("run.record.position@1", { run, nodeId: "missing" }) });
  profiles.set("run.record.imported_result@1", { valid: { run, branchId: main, recordedResult: "0-1" }, falsify: refused("run.record.imported_result@1", { run, branchId: main, recordedResult: "*" }) });
  // rfc/review-evidence-compiler.md: the typed Review projections over one sealed position delivery.
  const reviewDelivery = (fen: string, raw: string) => sealedOne("live.stockfish.position_eval@1", { delivery: reviewEvaluationDelivery(fen, raw) });
  const reviewPoint = (index: number, raw: string) => invoke("derived.review.eval_point@1", { evaluation: reviewDelivery(mainPath[index]!.fen, raw), position: sealedOne("run.record.position@1", { run, nodeId: mainPath[index]!.id }) }) as { readonly kind: string; readonly value: DeclaredEvidence<unknown> };
  profiles.set("derived.review.eval_point@1", { valid: { evaluation: reviewDelivery(mainPath[1]!.fen, "cp 30"), position: sealedOne("run.record.position@1", { run, nodeId: mainPath[1]!.id }) }, falsify: refused("derived.review.eval_point@1", { evaluation: sealedOne("run.record.position@1", { run, nodeId: mainPath[1]!.id }), position: sealedOne("run.record.position@1", { run, nodeId: mainPath[1]!.id }) }) });
  const reviewBefore = reviewPoint(1, "cp 30").value, reviewAfter = reviewPoint(2, "cp -250").value, reviewMated = reviewPoint(2, "mate 2").value;
  profiles.set("derived.review.eval_delta@1", { valid: { before: reviewBefore, after: reviewAfter }, falsify: refused("derived.review.eval_delta@1", { before: reviewBefore, after: reviewAfter, deltaCp: 5 }) });
  profiles.set("derived.review.mate_transition@1", { valid: { before: reviewBefore, after: reviewMated }, falsify: refused("derived.review.mate_transition@1", { before: reviewBefore, after: reviewDelivery(mainPath[2]!.fen, "mate 2") }) });
  const normalized = sealedOne("derived.review.wdl_white@1", { evaluation: reviewDelivery(mainPath[1]!.fen, "cp 30") });
  profiles.set("derived.review.wdl_white@1", { valid: { evaluation: reviewDelivery(mainPath[1]!.fen, "cp 30") }, falsify: refused("derived.review.wdl_white@1", { evaluation: normalized }) });
  profiles.set("derived.review.wdl_point@1", { valid: { normalized, position: sealedOne("run.record.position@1", { run, nodeId: mainPath[1]!.id }) }, falsify: refused("derived.review.wdl_point@1", { normalized, position: normalized }) });
  profiles.set("derived.story.last_level@1", { valid: { path: mainPath.map((node) => node.id), side: "white", recordedResult: "0-1", points: [reviewBefore, reviewAfter] }, falsify: refused("derived.story.last_level@1", { path: mainPath.map((node) => node.id), side: "white", recordedResult: "white", points: [reviewBefore] }) });
  const pivotalRuns = pivotalFixtures();
  for (const kind of ["irreversibility", "phase_change", "human_divergence", "option_collapse"] as const) {
    const route = `derived.pivotal.${kind}@1`;
    const fixture = pivotalRuns[kind];
    profiles.set(route, { valid: fixture, falsify: refused(route, { ...fixture, detail: {} }) });
  }
  profiles.set("derived.opening.deepest_reached@1", { valid: { run, branchId: main }, falsify: refused("derived.opening.deepest_reached@1", { run, branchId: main, deepest: {} }) });
  const shift = (invoke("derived.review.eval_delta@1", { before: reviewBefore, after: reviewAfter }) as { readonly value: DeclaredEvidence<{ readonly before: DeclaredEvidence<{ readonly evaluation: DeclaredEvidence<{ readonly payload: { readonly score: unknown } }> }>; readonly after: DeclaredEvidence<{ readonly evaluation: DeclaredEvidence<{ readonly payload: { readonly score: unknown } }> }> }> }).value;
  const moment = { nodeId: mainPath[2]!.id, decisionNodeId: mainPath[1]!.id, evidenceNodeId: mainPath[2]!.id, stopNodeId: mainPath[2]!.id, entryNodeId: mainPath[1]!.id, ply: 2, san: null, fen: mainPath[2]!.fen, kinds: ["eval_pivot"], sentences: [], components: [], evidence: [shift], phase: "middlegame", evaluation: { before: shift.payload.before.payload.evaluation.payload.payload.score, after: shift.payload.after.payload.evaluation.payload.payload.score } };
  profiles.set("derived.story.rank@1", { valid: { moments: [moment] }, falsify: refused("derived.story.rank@1", { moments: [{ ...moment, kinds: ["phase_change"] }] }) });
  const rank = invoke("derived.story.rank@1", { moments: [moment] }) as DeclaredEvidence<{ rank: readonly string[] }>;
  const story = { side: "white", outcome: { kind: "unfinished" }, moments: [moment], rank: rank.payload.rank };
  profiles.set("derived.story.title@1", { valid: { story, rank }, falsify: refused("derived.story.title@1", { story: { ...story, rank: ["forged"] }, rank }) });

  // Provider, model, corpus, ledger and authored sources.
  const packet = (kind: string, source = "engine_validated", values: Record<string, unknown> = { centipawns: 20 }) => ({ packet: { kind, source, values } });
  profiles.set("live.stockfish.eval@1", { valid: packet("eval"), falsify: refused("live.stockfish.eval@1", packet("wdl")) });
  profiles.set("live.stockfish.wdl@1", { valid: packet("wdl", "engine_validated", { win: 1, draw: 2, loss: 3 }), falsify: refused("live.stockfish.wdl@1", packet("eval")) });
  profiles.set("live.stockfish.pv@1", { valid: packet("bestline", "engine_validated", { movesUci: ["e2e4"] }), falsify: refused("live.stockfish.pv@1", packet("bestline", "human_model_predicted")) });
  profiles.set("live.syzygy.result@1", { valid: packet("tablebase", "tablebase_exact", { category: "draw" }), falsify: refused("live.syzygy.result@1", packet("eval")) });
  profiles.set("live.syzygy.category@1", { valid: packet("tablebase", "tablebase_exact", { category: "win" }), falsify: refused("live.syzygy.category@1", packet("tablebase", "tablebase_exact", { dtz: 3 })) });
  profiles.set("live.syzygy.distance@1", { valid: packet("tablebase", "tablebase_exact", { category: "win", dtz: 3 }), falsify: refused("live.syzygy.distance@1", packet("eval")) });
  profiles.set("human.maia.event@1", { valid: packet("bestline", "human_model_predicted", { moves: ["e2e4"] }), falsify: refused("human.maia.event@1", packet("bestline")) });
  profiles.set("live.stockfish.uci_response@1", { valid: { lines: ["info depth 1 score cp 10", "bestmove e2e4"] }, falsify: refused("live.stockfish.uci_response@1", { lines: [1, 2] }) });
  profiles.set("human.maia.uci_response@1", { valid: { lines: ["bestmove e2e4"] }, falsify: refused("human.maia.uci_response@1", { lines: "bestmove e2e4" }) });
  profiles.set("live.syzygy.probe_result@1", { valid: { position: { category: "draw", moves: [] } }, falsify: refused("live.syzygy.probe_result@1", { position: { category: "draw" } }) });
  const page = { nodeId: "n1", engine: { id: "maia", name: "Maia", version: "2" }, targetElo: 1500, candidates: [{ moveUci: "e2e4", rank: 1, mass: 0.6, wdl: { win: 1, draw: 2, loss: 3 } }] };
  profiles.set("human.maia.policy@1", { valid: { page }, falsify: refused("human.maia.policy@1", { page: { ...page, grade: "best" } }) });
  profiles.set("human.maia.candidate_wdl@1", { valid: { page }, falsify: refused("human.maia.candidate_wdl@1", { page: { ...page, extra: 1 } }) });
  const corpusResult = { kind: "abstention", reason: "no_data_at_band", detail: "fixture", population: { source: "lichess-explorer", ratings: [1500], speeds: ["rapid"], since: "2024-01", until: "2024-12" } };
  profiles.set("human.explorer.population@1", { valid: { page: { nodeId: "n1", result: corpusResult, committedMoveSan: null } }, falsify: refused("human.explorer.population@1", { page: { nodeId: "n1", result: corpusResult } }) });
  profiles.set("human.explorer.position_stats@1", { valid: { result: corpusResult }, falsify: refused("human.explorer.position_stats@1", { result: { kind: "verdict", population: {} } }) });
  const ledgerRecord = (kind: string, values: Record<string, unknown>, extra: Record<string, unknown> = {}) => ({ record: { kind, anchor: { fen: INITIAL }, sourceId: "fixture-source", retrievedAt: "2026-01-01T00:00:00Z", grounds: "machine_validation", values, supports: [], ...extra } });
  const engineRecord = ledgerRecord("engine_eval", { centipawns: 20, depth: 20, multiPv: 1, perspective: "white", engineId: "sf", engineName: "Stockfish", engineVersion: "17" });
  const tablebaseRecord = ledgerRecord("tablebase_result", { category: "draw", dtz: 0, precise_dtz: 0, dtm: null, pieceCount: 32, checkmate: false, stalemate: false, insufficient_material: false });
  profiles.set("sourcing.ledger.engine_eval@1", { valid: engineRecord, falsify: refused("sourcing.ledger.engine_eval@1", tablebaseRecord) });
  profiles.set("sourcing.ledger.tablebase_result@1", { valid: tablebaseRecord, falsify: refused("sourcing.ledger.tablebase_result@1", engineRecord) });
  profiles.set("sourcing.ledger.explorer_position_census@1", { valid: ledgerRecord("explorer_position_census", { total: 10 }), falsify: refused("sourcing.ledger.explorer_position_census@1", engineRecord) });
  profiles.set("sourcing.ledger.citable_text@1", { valid: ledgerRecord("citable_text", { quote: "fixture" }, { grounds: "citable_source" }), falsify: refused("sourcing.ledger.citable_text@1", { record: (({ supports: _omitted, ...rest }) => rest)(ledgerRecord("citable_text", { quote: "fixture" }).record) }) });
  profiles.set("theory.opening_identity.record@1", { valid: ledgerRecord("opening_identity", { eco: "C20", name: "King's Pawn Game" }), falsify: refused("theory.opening_identity.record@1", engineRecord) });
  const engineLedger = sealedOne("sourcing.ledger.engine_eval@1", engineRecord);
  const tablebaseLedger = sealedOne("sourcing.ledger.tablebase_result@1", tablebaseRecord);
  profiles.set("recorded.engine.eval@1", { valid: { ledger: engineLedger }, falsify: refused("recorded.engine.eval@1", { ledger: tablebaseLedger }) });
  profiles.set("recorded.tablebase.result@1", { valid: { ledger: tablebaseLedger }, falsify: refused("recorded.tablebase.result@1", { ledger: engineLedger }) });
  profiles.set("derived.grade.move_quality@1", { valid: { before: sealedOne("live.stockfish.eval@1", packet("eval", "engine_validated", { centipawns: 20, perspective: "white", engineId: "sf", requestedMovetimeMs: 100 })), after: sealedOne("live.stockfish.eval@1", packet("eval", "engine_validated", { centipawns: -300, perspective: "white", engineId: "sf", requestedMovetimeMs: 100 })), mover: "white", context: "review" }, falsify: refused("derived.grade.move_quality@1", { before: engineLedger, after: engineLedger, mover: "white", context: "review" }) });
  profiles.set("run.record.evidence_ref_resolution@1", { valid: { reference: "rules:checkmate" }, falsify: refused("run.record.evidence_ref_resolution@1", { reference: "rules:checkmate", text: "caller prose" }) });
  const deliveryItem = { kind: "claim", id: "claim#one", revealedBy: { kind: "outcome", eventSeq: 4 }, anchor: { claimId: "one" }, text: "Authored sentence.", evidenceTypes: ["tablebase_exact"], earnedEvidenceTypes: ["tablebase_exact"], binding: "ledger_bound", authorSpans: [], principles: [] };
  profiles.set("pack.authored.claim_delivery@1", { valid: { item: deliveryItem }, falsify: refused("pack.authored.claim_delivery@1", { item: { ...deliveryItem, note: "prose" } }) });
  profiles.set("pack.authored.claim@1", { valid: { item: { kind: "annotation", id: "a1", text: "Watch the d-file.", revealedBy: { kind: "checkpoint", eventSeq: 7 } } }, falsify: refused("pack.authored.claim@1", { item: { kind: "annotation", id: "a1", text: "x" } }) });
  // rfc/concept-registry.md §3: a validated pack, its complete-document digest and the private
  // compiled registry; the falsifier is the same pack under a wrong digest.
  const conceptRevision = conceptRegistryRevisionBytes(null, [{ id: "break-timing", label: "Break timing", status: "active" }]);
  const conceptRegistry = compileConceptRegistry(conceptRegistryHeadBytes(conceptRegistryDigest(conceptRevision)), { [`${conceptRegistryDigest(conceptRevision).slice("sha256:".length)}.json`]: conceptRevision });
  const conceptPack = { id: "fixture-pack", concepts: ["break-timing"] };
  const conceptPackDigest = `sha256:${sha256Hex(canonicalizeJson(conceptPack))}`;
  profiles.set("pack.authored.concept_reference@1", { valid: { pack: conceptPack, packDigest: conceptPackDigest, registry: conceptRegistry }, falsify: refused("pack.authored.concept_reference@1", { pack: conceptPack, packDigest: `sha256:${"0".repeat(64)}`, registry: conceptRegistry }) });
  profiles.set("pack.authored.phase@1", { valid: { pack: { id: "fixture-pack", phase: "endgame" } }, falsify: refused("pack.authored.phase@1", { pack: { id: "fixture-pack", phase: "late" } }) });
  const expression = { kind: "feature", feature: { kind: "open_file", file: "a" } };
  profiles.set("authored.structural_condition.input@1", { valid: { source: "shape", documentId: "shape-a", pointer: "/trigger", expression }, falsify: refused("authored.structural_condition.input@1", { source: "caller", documentId: "shape-a", pointer: "/trigger", expression }) });
  const condition = sealedOne("authored.structural_condition.input@1", { source: "shape", documentId: "shape-a", pointer: "/trigger", expression });
  profiles.set("derived.structural.predicate_result@1", { valid: { condition, fen: "rnbqkbnr/1ppppppp/8/8/8/8/1PPPPPPP/RNBQKBNR w KQkq - 0 1" }, falsify: refused("derived.structural.predicate_result@1", { condition: identity(condition), fen: INITIAL }) });
  profiles.set("theory.shapes.firing@1", { valid: { entries: [{ id: "open-a", trigger: expression }], path: [{ id: "n1", fen: "rnbqkbnr/1ppppppp/8/8/8/8/1PPPPPPP/RNBQKBNR w KQkq - 0 1" }] }, falsify: refused("theory.shapes.firing@1", { entries: [{ id: "open-a", trigger: expression }], path: [{ id: "n1", fen: "not a fen" }] }) });
  const engine = { id: "sf", name: "Stockfish", version: "17", seedHonored: true, searchBound: { kind: "depth", value: 1 } };
  profiles.set("derived.opponent.candidate_feature_vector@1", { valid: { beforeFen: INITIAL, engine, candidates: [{ moveUci: "g1f3", scoreCp: 31 }] }, falsify: refused("derived.opponent.candidate_feature_vector@1", { beforeFen: INITIAL, engine, candidates: [{ moveUci: "e2e5", scoreCp: 0 }] }) });
  // rfc/provider-exchange-and-execution.md §9: the five receipt-bearing provider sources and the
  // Syzygy local-domain adapter. Valid input is a scheduler-sealed delivery; the falsifier is the
  // same delivery's bare payload (stripping the receipt is not representable).
  for (const [route, operation, delivery] of providerDeliveries()) {
    profiles.set(route, { valid: { delivery }, falsify: refused(route, { delivery: (delivery as { readonly payload: unknown }).payload }) });
    void operation;
  }
  const outside = PROVIDER_EXCHANGE_AUTHORITY.makeProviderLocalDomainResult(normalizeProviderRequest("syzygy.position@1", syzygyRequest(INITIAL)), FIXTURE_AT);
  profiles.set("rules.endgame.tablebase_domain@1", { valid: { result: outside }, falsify: refused("rules.endgame.tablebase_domain@1", { result: { ...outside } }) });
  return profiles;
}

const PROFILE_FILE = new URL("fixtures/evidence-value-profiles.json", import.meta.url);
/** Routes whose chosen fixture legitimately emits nothing (recorded-pack or rare-structure events). */
const EXPECTED_EMPTY: readonly string[] = Object.freeze([]);

describe("value authority: one permanent profile per final factory (§7, criterion 13)", () => {
  it("runs a valid authority case and a falsifier for every registry route, pinned by payload digest", () => {
    const profiles = buildProfiles();
    expect([...profiles.keys()].sort()).toEqual([...ROUTES.keys()].sort());
    const observed: Record<string, Outcome> = {};
    for (const [route, profile] of [...profiles].sort(([left], [right]) => left.localeCompare(right))) {
      observed[route] = profile.valid === undefined ? { availability: "unavailable", cardinality: 0, payloadDigests: [], reason: "authority_not_constructible" } : outcomeOf(invoke(route, profile.valid));
      profile.falsify();
    }
    if (process.env.UPDATE_EVIDENCE_VALUE_PROFILES === "1") writeFileSync(PROFILE_FILE, `${JSON.stringify(observed, null, 2)}\n`);
    const pinned = JSON.parse(readFileSync(PROFILE_FILE, "utf8")) as Record<string, Outcome>;
    expect(observed).toEqual(pinned);
    // Honest-unavailable routes are exactly the declared dependency gaps.
    const unavailable = Object.entries(observed).filter(([, outcome]) => outcome.availability === "unavailable").map(([route]) => route).sort();
    expect(unavailable).toEqual(["derived.opening.deepest_reached@1", "theory.opening.catalogue_membership@1", "theory.opening.current_endpoint@1"]);
    // Empty valid populations are pinned too; the positives above prove each family can emit.
    const empty = Object.entries(observed).filter(([, outcome]) => outcome.availability === "empty").map(([route]) => route).sort();
    expect(empty).toEqual(EXPECTED_EMPTY);
    for (const route of unavailable) expect(ROUTES.get(route)!.pending, route).toBeDefined();
  });
});
