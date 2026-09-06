// DISPOSABLE positive author contract for D2628-D2630. No production evidence is implemented.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const bounded = readFileSync("rfc/bounded-policy-targets.md", "utf8");
const valueAuthority = readFileSync("rfc/evidence-value-authority.md", "utf8");
const protocolPath = "tools/d2202-bounded-target-third-author-repair/protocol.proposed.ts";
const protocol = readFileSync(protocolPath, "utf8");
const fixture = readFileSync("tools/d2202-bounded-target-third-author-repair/protocol.typecheck.ts", "utf8");
const routeMap = JSON.parse(readFileSync("planning/evidence-foundation-ux/evidence-value-authority-route-map.json", "utf8"));
const source = ts.createSourceFile(protocolPath, protocol, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
const rfcProtocol = [...bounded.matchAll(/```ts\n([\s\S]*?)```/gu)].map((match) => match[1]).join("\n");
const rfcSource = ts.createSourceFile("bounded-policy-targets.rfc.ts", rfcProtocol, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

function exportedName(node) {
  if (!node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)) return null;
  return node.name && ts.isIdentifier(node.name) ? node.name.text : null;
}

function declaration(name, file = source) {
  const node = file.statements.filter((statement) => exportedName(statement) === name).at(-1);
  assert.ok(node, `missing exported declaration ${name}`);
  return node;
}

function memberNames(name, file = source) {
  const node = declaration(name, file);
  assert.ok(ts.isInterfaceDeclaration(node) || ts.isClassDeclaration(node), `${name} is not structured`);
  return node.members.map((member) => member.name?.getText(file)).filter(Boolean).sort();
}

const printer = ts.createPrinter({ removeComments: true });
function declarationImage(name, file = source) {
  return printer.printNode(ts.EmitHint.Unspecified, declaration(name, file), file)
    .replace(/^export declare (function|class) /u, "export $1 ");
}

function literalPropertyValues(typeNode, propertyName, file = source) {
  const members = ts.isUnionTypeNode(typeNode) ? typeNode.types : [typeNode];
  const values = [];
  for (const member of members) {
    if (ts.isTypeReferenceNode(member)) {
      const referenced = declaration(member.typeName.getText(file), file);
      assert.ok(ts.isInterfaceDeclaration(referenced), `referenced ${member.getText(file)} is not an interface`);
      for (const property of referenced.members) {
        if (property.name?.getText(file) === propertyName && property.type && ts.isLiteralTypeNode(property.type)) {
          values.push(property.type.literal.getText(file).replaceAll('"', ""));
        }
      }
      continue;
    }
    if (!ts.isTypeLiteralNode(member)) continue;
    const property = member.members.find((candidate) => candidate.name?.getText(file) === propertyName);
    if (!property?.type) continue;
    const propertyTypes = ts.isUnionTypeNode(property.type) ? property.type.types : [property.type];
    for (const propertyType of propertyTypes) {
      if (ts.isLiteralTypeNode(propertyType)) values.push(propertyType.literal.getText(file).replaceAll('"', ""));
    }
  }
  return [...new Set(values)].sort();
}

test("D2628 complete protocol exports and structural fields are set-equal", () => {
  const expectedExports = [
    "ProjectionEvidence", "ThreatPassAnchor", "ThreatPassAnchorResult", "SourceBoundThreatEvidence",
    "ThreatEvidence", "LegalExchangeEvidence", "SourceLegalMovesEvidence", "TrackedPieceIdentity",
    "ObservedPromotionEdge", "NamedMaterialTarget", "PostCandidateExchangeEvaluation",
    "ImmediateTargetOutcome", "BoundedTargetImmediate", "CandidateLine", "RefutationLine",
    "ReintroductionLine", "BoundedReturnOutcome", "BoundedTargetReturn", "NamedMaterialTargetEvidence",
    "BoundedTargetImmediateEvidence", "BoundedTargetReturnEvidence", "NamedMaterialTargetFactoryResult",
    "BoundedTargetImmediateFactoryResult", "BoundedTargetBatchRequest", "ReturnDerivation",
    "CandidateDerivation", "TargetDerivation", "BoundedTargetInputDigests", "BoundedTargetRequestIdentity",
    "BoundedTargetResultIdentity", "BoundedTargetBatchCompleted", "BoundedTargetBatchAbstentionReason",
    "BoundedTargetBatchAbstained", "BoundedTargetBatchCancellationReason", "BoundedTargetBatchCancelled",
    "BoundedTargetBatchFailureReason", "BoundedTargetBatchFailed", "BoundedTargetBatchRejectionReason",
    "BoundedTargetBatchRejected", "BoundedTargetBatchResult",
    "BoundedTargetServiceLimits", "BoundedTargetServiceOptions", "BoundedTargetBackgroundService",
    "threatPassAnchor", "assertThreatPassAnchor", "threatEvidencePassAnchor",
    "assertNamedMaterialTargetEvidence", "assertBoundedTargetImmediateEvidence",
    "assertBoundedTargetReturnEvidence", "assertBoundedTargetBatchResult",
    "createBoundedTargetBackgroundService",
  ].sort();
  assert.deepEqual(source.statements.map(exportedName).filter(Boolean).sort(), expectedExports);

  const expectedFields = {
    NamedMaterialTarget: ["attacker", "captureUci", "convention", "exchange", "passAnchor", "sourcePosition", "threat", "victim"],
    BoundedTargetImmediate: ["afterFen", "candidateUci", "outcome", "target"],
    BoundedTargetReturn: ["horizonPlies", "immediate", "outcome", "visitedPositions"],
    BoundedTargetBatchRequest: ["exchanges", "kind", "sourcePosition", "threat"],
    TargetDerivation: ["candidates", "target"],
    BoundedTargetInputDigests: ["exchanges", "sourcePosition", "threat"],
    BoundedTargetRequestIdentity: ["domain", "inputs", "manifestDigest", "requestDigest"],
    BoundedTargetResultIdentity: ["resultDigest", "resultDomain"],
    BoundedTargetServiceLimits: ["maxActive", "maxBatchVisitedPositions", "maxPairs", "maxQueued", "maxVisitedPositions", "yieldEveryVisited"],
    BoundedTargetServiceOptions: ["limits"],
    BoundedTargetBackgroundService: ["close", "create", "submit"],
  };
  for (const [name, fields] of Object.entries(expectedFields)) assert.deepEqual(memberNames(name), fields.sort(), name);
});

test("D3042 every exported declaration is canonically AST-equal to the RFC model", () => {
  const internalOnly = new Set([
    "makeNamedMaterialTargetEvidence",
    "makeBoundedTargetImmediateEvidence",
    "makeBoundedTargetReturnEvidence",
    "invokeEvidenceValueRoute",
  ]);
  const rfcExports = rfcSource.statements.map(exportedName).filter((name) => name && !internalOnly.has(name)).sort();
  const moduleExports = source.statements.map(exportedName).filter(Boolean).sort();
  assert.deepEqual(moduleExports, rfcExports);

  for (const name of moduleExports) {
    assert.equal(declarationImage(name, source), declarationImage(name, rfcSource), name);
  }

  for (const [name, property] of [
    ["ThreatPassAnchorResult", "kind"],
    ["ImmediateTargetOutcome", "result"],
    ["ImmediateTargetOutcome", "cause"],
    ["BoundedReturnOutcome", "kind"],
    ["NamedMaterialTargetFactoryResult", "kind"],
    ["BoundedTargetImmediateFactoryResult", "kind"],
    ["ReturnDerivation", "kind"],
    ["CandidateDerivation", "kind"],
    ["BoundedTargetBatchResult", "kind"],
  ]) {
    const moduleAlias = declaration(name, source);
    const rfcAlias = declaration(name, rfcSource);
    assert.ok(ts.isTypeAliasDeclaration(moduleAlias) && ts.isTypeAliasDeclaration(rfcAlias));
    assert.deepEqual(
      literalPropertyValues(moduleAlias.type, property, source),
      literalPropertyValues(rfcAlias.type, property, rfcSource),
      `${name}.${property}`,
    );
  }
});

test("D2628 all nested projections and discriminated arms remain complete", () => {
  const expectedDiscriminants = {
    ImmediateTargetOutcome: { result: ["preserved", "removed"], cause: ["attacker_captured", "capture_illegal", "exchange_neutralized", "preserved", "target_moved"] },
    BoundedReturnOutcome: { kind: ["not_reintroduced", "reintroduced", "survives_every_defence"] },
    NamedMaterialTargetFactoryResult: { kind: ["abstained", "evidence"] },
    BoundedTargetImmediateFactoryResult: { kind: ["abstained", "evidence"] },
    ReturnDerivation: { kind: ["abstained", "evidence"] },
    CandidateDerivation: { kind: ["abstained", "preserved", "removed"] },
    BoundedTargetBatchResult: { kind: ["abstained", "cancelled", "completed", "failed", "rejected"] },
  };
  for (const [name, properties] of Object.entries(expectedDiscriminants)) {
    const alias = declaration(name);
    assert.ok(ts.isTypeAliasDeclaration(alias));
    for (const [property, values] of Object.entries(properties)) {
      assert.deepEqual(literalPropertyValues(alias.type, property), values, `${name}.${property}`);
    }
  }
  for (const projection of [
    "derived.bounded_target.named_material_target",
    "derived.bounded_target.immediate",
    "derived.bounded_target.bounded_return",
  ]) assert.match(protocol, new RegExp(projection.replaceAll(".", "\\."), "u"));
  assert.match(fixture, /^import type \{[\s\S]+\} from "\.\/protocol\.proposed\.js";/u);
  assert.doesNotMatch(fixture, /^type (?:Immediate|Candidate|Result|Target|Return)\b/mu);
});

test("D2629 central typed invoker is the sole service-to-factory path", () => {
  assert.match(bounded, /invokeEvidenceValueRoute/u);
  assert.match(bounded, /BoundedTargetValueRouteInputs/u);
  assert.match(bounded, /BoundedTargetValueRouteResults/u);
  assert.match(valueAuthority, /invokeEvidenceValueRoute/u);
  assert.match(valueAuthority, /EvidenceValueRouteInputs/u);
  assert.match(valueAuthority, /EvidenceValueRouteResults/u);
  assert.match(valueAuthority, /unknown routes?, missing\/extra input keys/u);
  assert.match(bounded, /`bounded-target\.ts` imports only this\s+invoker/u);
  assert.match(bounded, /It never imports a bounded-target factory/u);
  assert.match(bounded, /central\s+registry module is therefore the sole non-test factory importer/u);
  for (const route of [
    "derived.bounded_target.named_material_target@1",
    "derived.bounded_target.immediate@1",
    "derived.bounded_target.bounded_return@1",
  ]) assert.match(bounded, new RegExp(route.replaceAll(".", "\\."), "u"));
});

test("D2630 consumes one exact threat route and rejects the retired alias", () => {
  const routes = routeMap.routes.filter((row) => row.currentProjection === "rules.tactic.consequence.threat@1");
  assert.equal(routes.length, 1);
  assert.deepEqual(routes[0].targetProfiles.map((profile) => profile.factorySymbol), ["createRulesTacticConsequenceThreatV1Evidence"]);
  assert.match(bounded, /createRulesTacticConsequenceThreatV1Evidence\(\{ fen: sourceFen \}\)/u);
  assert.doesNotMatch(bounded, /export function declareThreatEvidence\(/u);
  assert.match(bounded, /`declareThreatEvidence`, any compatibility alias,[\s\S]{0,80}fails/u);
});
