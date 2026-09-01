// DISPOSABLE author instrument for D2146. This derives the literal migration receipt; it is not
// production evidence code and may not be imported by runtime/server/web packages.
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import ts from "typescript";

import {
  AVOIDANCE_EVENT_PROJECTION_IDS,
  PRIMARY_EVIDENCE_MANIFEST,
  STRUCTURAL_EVENT_PROJECTION_IDS,
  STRUCTURAL_PREDICATE_PROJECTION_IDS,
  STRUCTURAL_READING_PROJECTION_IDS,
  TRANSITION_EVENT_PROJECTION_IDS,
  TRANSITION_READING_PROJECTION_IDS,
} from "@chess-tabiya/runtime";

const ROOT = resolve(process.cwd());
const RECEIPT = "planning/evidence-foundation-ux/evidence-value-authority-route-map.json";
const ADAPTER = "packages/runtime/src/evidence-source-adapters.ts";

type FactoryShape = "computed" | "derived" | "source_receipt" | "authored_authority";

interface CurrentRoute {
  readonly oldOperation: string;
  readonly projection: string;
}

interface ProductionUse {
  readonly site: string;
  readonly operation: string;
}

interface TargetProfile {
  readonly projection: string;
  readonly factoryShape: FactoryShape;
  readonly authorityInputs: readonly string[];
  readonly dependency: string;
}

const SPECIALIZED = Object.freeze([
  { operation: "declarePackPhaseEvidence", projections: ["pack.authored.phase"] },
  { operation: "declareMaiaCandidateWdlEvidence", projections: ["human.maia.candidate_wdl"] },
  { operation: "declareExactLegalMovesEvidence", projections: ["rules.mobility.reading.legal_moves"] },
  { operation: "declarePawnContactsEvidence", projections: ["rules.pawn.reading.contacts"] },
  { operation: "declareStructuralReadingSourceEvidence", projections: STRUCTURAL_READING_PROJECTION_IDS.filter((id) => id !== "rules.structural.reading.pawn_count") },
  { operation: "declareTransitionReadingSourceEvidence", projections: TRANSITION_READING_PROJECTION_IDS },
  { operation: "declareStructuralPredicateFeatureEvidence", projections: STRUCTURAL_PREDICATE_PROJECTION_IDS },
  { operation: "declareOpponentProviderEvidence", projections: ["human.maia.uci_response", "live.stockfish.uci_response", "live.syzygy.probe_result"] },
  { operation: "declareLivePacketEvidence", projections: ["human.maia.event", "live.syzygy.result", "live.stockfish.eval", "live.stockfish.wdl", "live.stockfish.pv"] },
  { operation: "declareSourcingRecordEvidence", projections: ["sourcing.ledger.engine_eval", "sourcing.ledger.tablebase_result", "sourcing.ledger.explorer_position_census", "theory.opening_identity.record"] },
  { operation: "declareCompareDerivedEvidence", projections: ["derived.compare.engine_trajectory", "derived.compare.structure_delta", "derived.compare.piece_route", "derived.compare.eval_delta"] },
  { operation: "declareRunRecordEvidence", projections: ["run.record.fork", "run.record.move", "run.record.checkpoint_hit", "run.record.objective_transition", "run.record.consequence", "run.record.imported_result"] },
  { operation: "declareStoryDerivedEvidence", projections: ["derived.story.eval_shift", "derived.story.last_level", "derived.story.rank", "derived.story.title"] },
  { operation: "declareStructuralSemanticSourceEvidence", projections: STRUCTURAL_EVENT_PROJECTION_IDS },
  { operation: "declareTransitionSemanticSourceEvidence", projections: TRANSITION_EVENT_PROJECTION_IDS },
  { operation: "declareAvoidanceEvidence", projections: [...AVOIDANCE_EVENT_PROJECTION_IDS, "derived.semantic_avoidance.loose_piece", "derived.semantic_avoidance.pawn_islands"] },
] as const);

const CORRECTED_TARGETS: Readonly<Record<string, readonly TargetProfile[]>> = Object.freeze({
  "recorded.engine.eval": [{
    projection: "recorded.engine.eval@1",
    factoryShape: "derived",
    authorityInputs: ["createSourcingLedgerEngineEvalV1Evidence output"],
    dependency: "provider-exchange-and-execution",
  }],
  "recorded.tablebase.result": [{
    projection: "recorded.tablebase.result@1",
    factoryShape: "derived",
    authorityInputs: ["createSourcingLedgerTablebaseResultV1Evidence output"],
    dependency: "provider-exchange-and-execution",
  }],
  "rules.phase.reading": [{ projection: "rules.phase.reading@2", factoryShape: "computed", authorityInputs: ["fen"], dependency: "semantic-convention-provenance:phase-band" }],
  "rules.structural.reading.named_structure": [{ projection: "rules.structural.reading.named_structure@2", factoryShape: "computed", authorityInputs: ["fen", "registered_structure_catalogue"], dependency: "semantic-convention-provenance:named-structure" }],
  "rules.endgame.reading": [
    { projection: "rules.endgame.classification@1", factoryShape: "computed", authorityInputs: ["fen"], dependency: "semantic-convention-provenance:endgame-classification" },
    { projection: "theory.endgame.setup_match@1", factoryShape: "computed", authorityInputs: ["fen", "registered_cited_setup_convention"], dependency: "semantic-convention-provenance:endgame-setup" },
  ],
  "rules.pivotal.marker": [
    { projection: "derived.pivotal.irreversibility@1", factoryShape: "derived", authorityInputs: ["sealed_transition_event", "run_node_identity"], dependency: "semantic-validation-authority" },
    { projection: "derived.pivotal.phase_change@1", factoryShape: "derived", authorityInputs: ["sealed_phase_before", "sealed_phase_after", "run_node_identity"], dependency: "semantic-convention-provenance:phase-band" },
    { projection: "derived.pivotal.human_divergence@1", factoryShape: "derived", authorityInputs: ["sealed_maia_distribution", "run_node_identity"], dependency: "provider-exchange-and-execution" },
    { projection: "derived.pivotal.option_collapse@1", factoryShape: "derived", authorityInputs: ["three_sealed_legal_move_readings", "run_node_identity"], dependency: "semantic-convention-provenance:sustained-collapse" },
  ],
  "rules.structural.predicate.result": [{ projection: "derived.structural.predicate_result@1", factoryShape: "derived", authorityInputs: ["sealed_authored_condition", "retained_fen"], dependency: "semantic-validation-authority" }],
});

function filesUnder(path: string): readonly string[] {
  if (!existsSync(path)) return [];
  return readdirSync(path).flatMap((name) => {
    const child = join(path, name);
    if (statSync(child).isDirectory()) return name === "dist" ? [] : filesUnder(child);
    return /\.(?:ts|svelte)$/u.test(name) && !/\.(?:test|spec)\./u.test(name) ? [child] : [];
  });
}

const productionFiles = ["packages/runtime/src", "apps/server/src", "apps/web/src"]
  .flatMap((path) => filesUnder(join(ROOT, path)))
  .filter((path) => relative(ROOT, path) !== ADAPTER);

function declarationName(name: ts.DeclarationName | undefined): string | undefined {
  if (name === undefined) return undefined;
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) return name.text;
  return undefined;
}

function enclosingOperation(node: ts.Node): string {
  for (let cursor: ts.Node | undefined = node.parent; cursor !== undefined; cursor = cursor.parent) {
    if (ts.isFunctionDeclaration(cursor) && cursor.name !== undefined) return cursor.name.text;
    if (ts.isMethodDeclaration(cursor) || ts.isGetAccessorDeclaration(cursor) || ts.isSetAccessorDeclaration(cursor)) {
      const method = declarationName(cursor.name);
      if (method === undefined) continue;
      const owner = cursor.parent && (ts.isClassDeclaration(cursor.parent) || ts.isClassExpression(cursor.parent))
        ? cursor.parent.name?.text
        : undefined;
      return owner === undefined ? method : `${owner}.${method}`;
    }
    if (ts.isConstructorDeclaration(cursor)) {
      const owner = cursor.parent && (ts.isClassDeclaration(cursor.parent) || ts.isClassExpression(cursor.parent))
        ? cursor.parent.name?.text
        : undefined;
      return owner === undefined ? "constructor" : `${owner}.constructor`;
    }
    if (ts.isArrowFunction(cursor) || ts.isFunctionExpression(cursor)) {
      const parent = cursor.parent;
      if (ts.isVariableDeclaration(parent) && ts.isIdentifier(parent.name)) return parent.name.text;
      if (ts.isPropertyAssignment(parent)) {
        const property = declarationName(parent.name);
        if (property !== undefined) return property;
      }
    }
  }
  return "<module>";
}

function productionUseIndex(operations: ReadonlySet<string>): ReadonlyMap<string, readonly ProductionUse[]> {
  const found = new Map([...operations].map((operation) => [operation, [] as ProductionUse[]]));
  for (const path of productionFiles) {
    const source = readFileSync(path, "utf8");
    const file = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, path.endsWith(".svelte") ? ts.ScriptKind.TS : ts.ScriptKind.TS);
    const locals = new Map<string, string>();
    const namespaces = new Set<string>();
    for (const statement of file.statements) {
      if (!ts.isImportDeclaration(statement) || statement.importClause === undefined) continue;
      const bindings = statement.importClause.namedBindings;
      if (bindings === undefined) continue;
      if (ts.isNamespaceImport(bindings)) namespaces.add(bindings.name.text);
      else for (const element of bindings.elements) {
        const imported = element.propertyName?.text ?? element.name.text;
        if (operations.has(imported)) locals.set(element.name.text, imported);
      }
    }
    const visit = (node: ts.Node): void => {
      if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) return;
      const direct = ts.isIdentifier(node) ? locals.get(node.text) : undefined;
      const namespaced = ts.isPropertyAccessExpression(node)
        && operations.has(node.name.text)
        && ts.isIdentifier(node.expression)
        && namespaces.has(node.expression.text) ? node.name.text : undefined;
      const operation = direct ?? namespaced;
      if (operation !== undefined) {
        const line = file.getLineAndCharacterOfPosition(node.getStart(file)).line + 1;
        const sourcePath = relative(ROOT, path);
        found.get(operation)!.push({
          site: `${sourcePath}:${line}`,
          operation: `${sourcePath}#${enclosingOperation(node)}`,
        });
      }
      ts.forEachChild(node, visit);
    };
    visit(file);
  }
  return new Map([...found].map(([operation, uses]) => [operation, uses.sort((left, right) => left.site.localeCompare(right.site))]));
}

function currentRoutes(): readonly CurrentRoute[] {
  const adapters = readFileSync(join(ROOT, ADAPTER), "utf8");
  const generic = [...adapters.matchAll(/export const (declare[A-Za-z]+) = <T extends object>\(payload: T\) => exactObject\("[^"]+", "([^"]+)"/gu)]
    .map((match) => ({ oldOperation: match[1]!, projection: match[2]! }));
  const specialized = SPECIALIZED.flatMap((route) => route.projections.map((projection) => ({ oldOperation: route.operation, projection })));
  return [...generic, ...specialized].sort((left, right) => left.projection.localeCompare(right.projection) || left.oldOperation.localeCompare(right.oldOperation));
}

function defaultShape(plane: string): FactoryShape {
  if (plane === "derived") return "derived";
  if (plane === "human" || plane === "search" || plane === "record") return "source_receipt";
  if (plane === "authored" || plane === "theory") return "authored_authority";
  return "computed";
}

function dependency(shape: FactoryShape, grounding: string): string {
  if (shape === "source_receipt") return "provider-exchange-and-execution";
  if (shape === "authored_authority") return "registered-authored-provenance";
  if (grounding === "declared_convention") return "semantic-convention-provenance";
  if (shape === "derived") return "semantic-validation-authority";
  return "none";
}

function computedInputs(operation: string, projection: string, operands: readonly string[]): readonly string[] {
  if (operation === "declareStructuralReadingSourceEvidence" || operation === "declareStructuralPredicateFeatureEvidence") return ["fen"];
  if (operation === "declareTransitionReadingSourceEvidence" || operation === "declareStructuralSemanticSourceEvidence" || operation === "declareTransitionSemanticSourceEvidence") return ["validated_edge"];
  if (operation === "declareExactLegalMovesEvidence" || operation === "declarePawnContactsEvidence") return ["fen"];
  if (operands.includes("beforeFen") || operands.includes("before_fen") || operands.includes("moveUci") || operands.includes("move_uci")) return ["validated_edge"];
  if (operands.includes("fen") || operands.includes("afterFen")) return ["fen"];
  if (projection === "rules.castling.reading.legality") return ["fen", "color", "wing"];
  if (projection === "rules.tactic.event.defender_removed" || projection === "rules.tactic.event.defender_duty_relocated") return ["validated_edge", "sealed_defender_duty_readings"];
  if (projection === "rules.tactic.consequence.forced_mate_after_move") return ["fen", "candidate_move", "bounded_mate_parameters"];
  if (projection === "rules.tactic.consequence.reply_breadth") return ["after_fen", "triggering_move"];
  if (projection === "rules.tactic.event.check") return ["validated_edge"];
  if (projection === "rules.tactic.consequence.threat" || projection === "rules.tactic.reading.trapped_piece") return ["fen"];
  return ["producer_authority_parameters"];
}

function defaultTarget(route: CurrentRoute, declaration: (typeof PRIMARY_EVIDENCE_MANIFEST.projections)[number]): readonly TargetProfile[] {
  const shape = route.projection === "pack.authored.phase" ? "authored_authority" : defaultShape(declaration.plane);
  const authorityInputs = shape === "computed"
    ? computedInputs(route.oldOperation, route.projection, declaration.operands)
    : shape === "derived"
      ? ["sealed_declared_inputs", "declared_orientation_parameters"]
      : shape === "source_receipt"
        ? ["sealed_source_receipt", "typed_response_bytes"]
        : ["registered_authority", "document_digest_pointer"];
  return [{ projection: `${route.projection}@${declaration.version}`, factoryShape: shape, authorityInputs, dependency: dependency(shape, declaration.grounding) }];
}

function digest(value: unknown): string {
  return `sha256:${createHash("sha256").update(JSON.stringify(value)).digest("hex")}`;
}

function factorySymbol(projection: string): string {
  const [id, version] = projection.split("@");
  const name = id!.split(/[._-]/u).map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`).join("");
  return `create${name}V${version}Evidence`;
}

function buildReceipt() {
  const declarations = new Map(PRIMARY_EVIDENCE_MANIFEST.projections.map((projection) => [projection.id, projection]));
  const producers = new Map(PRIMARY_EVIDENCE_MANIFEST.producers.map((producer) => [`${producer.id}@${producer.version}`, producer]));
  const current = currentRoutes();
  const uses = productionUseIndex(new Set(current.map((route) => route.oldOperation)));
  const routes = current.map((route) => {
    const declaration = declarations.get(route.projection);
    if (declaration === undefined) throw new TypeError(`undeclared mint projection ${route.projection}`);
    const producer = producers.get(`${declaration.producer.id}@${declaration.producer.version}`);
    if (producer === undefined) throw new TypeError(`missing producer for ${route.projection}`);
    const productionUses = uses.get(route.oldOperation) ?? [];
    const bindings = PRIMARY_EVIDENCE_MANIFEST.bindings
      .filter((binding) => binding.projection.id === route.projection && binding.projection.version === declaration.version)
      .map((binding) => `${binding.consumer.id}@${binding.consumer.version}`)
      .sort();
    const targets = CORRECTED_TARGETS[route.projection] ?? defaultTarget(route, declaration);
    return {
      oldOperation: route.oldOperation,
      currentProjection: `${route.projection}@${declaration.version}`,
      targetProfiles: targets.map((profile) => ({ ...profile, factorySymbol: factorySymbol(profile.projection) })),
      producerImplementation: producer.implementation,
      currentDisposition: declaration.disposition?.kind ?? "ordinary",
      currentBindings: bindings,
      currentProductionUseCount: productionUses.length,
      currentProductionUseSites: productionUses.map((use) => use.site),
      currentProducerOperations: [...new Set(productionUses.map((use) => use.operation))].sort(),
    };
  });
  const projectionCounts = Map.groupBy(routes, (route) => route.currentProjection);
  const duplicateProjections = [...projectionCounts].filter(([, rows]) => rows.length > 1).map(([projection]) => projection).sort();
  const projectionsWithoutProductionUses = [...projectionCounts]
    .filter(([, rows]) => rows.every((row) => row.currentProductionUseCount === 0))
    .map(([projection]) => projection)
    .sort();
  const boundProjectionsWithoutProductionUses = [...projectionCounts]
    .filter(([, rows]) => rows.every((row) => row.currentProductionUseCount === 0) && rows.some((row) => row.currentBindings.length > 0))
    .map(([projection]) => projection)
    .sort();
  const minted = new Set(routes.map((route) => route.currentProjection.split("@")[0]!));
  const noRoute = PRIMARY_EVIDENCE_MANIFEST.projections.filter((projection) => !minted.has(projection.id)).map((projection) => ({
    projection: `${projection.id}@${projection.version}`,
    disposition: projection.disposition?.kind ?? "ordinary",
    requiredAction: projection.disposition?.kind === "retired" ? "remain_factoryless" : "add_factory_and_profile_before_binding",
  })).sort((left, right) => left.projection.localeCompare(right.projection));
  const currentProducerOperations = routes.flatMap((route) => route.currentProducerOperations);
  const body = { schemaVersion: 1, authority: "D2146", routes, noRoute };
  return {
    ...body,
    summary: {
      routeCount: routes.length,
      distinctCurrentProjections: projectionCounts.size,
      duplicateProjections,
      noRouteCount: noRoute.length,
      rowsWithProductionUses: routes.filter((route) => route.currentProductionUseCount > 0).length,
      rowsWithoutProductionUses: routes.filter((route) => route.currentProductionUseCount === 0).length,
      rowsWithResolvedProducerOperations: routes.filter((route) => route.currentProducerOperations.length > 0).length,
      distinctCurrentProducerOperations: new Set(currentProducerOperations).size,
      usedRowsMissingProducerOperations: routes.filter((route) => route.currentProductionUseCount > 0 && route.currentProducerOperations.length === 0).map((route) => route.currentProjection),
      exportOnlyRowsWithProducerOperations: routes.filter((route) => route.currentProductionUseCount === 0 && route.currentProducerOperations.length > 0).map((route) => route.currentProjection),
      moduleOwnedProducerOperations: [...new Set(currentProducerOperations.filter((operation) => operation.endsWith("#<module>")))].sort(),
      boundRowsWithoutProductionUses: routes.filter((route) => route.currentProductionUseCount === 0 && route.currentBindings.length > 0).length,
      projectionsWithoutProductionUses,
      boundProjectionsWithoutProductionUses,
      receiptDigest: digest(body),
    },
  };
}

const receipt = buildReceipt();
const serialized = `${JSON.stringify(receipt, null, 2)}\n`;
const target = join(ROOT, RECEIPT);
if (process.argv.includes("--write")) {
  writeFileSync(target, serialized);
  console.log(`evidence-value-authority-route-map: wrote ${RECEIPT}`);
} else {
  if (!existsSync(target) || readFileSync(target, "utf8") !== serialized) {
    throw new TypeError(`evidence value-authority route receipt is stale; run make evidence-value-authority-route-map-update`);
  }
  if (receipt.summary.routeCount !== 191 || receipt.summary.distinctCurrentProjections !== 187 || receipt.summary.noRouteCount !== 6) {
    throw new TypeError(`evidence value-authority route population drifted: ${JSON.stringify(receipt.summary)}`);
  }
  if (receipt.summary.boundProjectionsWithoutProductionUses.length > 0) {
    throw new TypeError(`bound projections have no production mint use: ${receipt.summary.boundProjectionsWithoutProductionUses.join(", ")}`);
  }
  if (receipt.routes.some((route) => route.targetProfiles.some((profile) => profile.authorityInputs.includes("producer_authority_parameters")))) {
    throw new TypeError("route receipt retains an unresolved producer_authority_parameters placeholder");
  }
  if (receipt.summary.usedRowsMissingProducerOperations.length > 0) {
    throw new TypeError(`used routes lack callable producer operations: ${receipt.summary.usedRowsMissingProducerOperations.join(", ")}`);
  }
  if (receipt.summary.exportOnlyRowsWithProducerOperations.length > 0) {
    throw new TypeError(`export-only routes unexpectedly name producer operations: ${receipt.summary.exportOnlyRowsWithProducerOperations.join(", ")}`);
  }
  if (receipt.summary.moduleOwnedProducerOperations.length > 0) {
    throw new TypeError(`route receipt retains module-only producer operations: ${receipt.summary.moduleOwnedProducerOperations.join(", ")}`);
  }
  console.log(`evidence-value-authority-route-map: ${receipt.summary.routeCount} routes / ${receipt.summary.distinctCurrentProjections} projections / ${receipt.summary.noRouteCount} no-route declarations sealed by ${receipt.summary.receiptDigest}`);
}
