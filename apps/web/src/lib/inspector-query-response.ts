// Closed Full Inspector2 receiver. Wire digests establish correlation, not source issuance;
// only the server's actual source owners and registered constructors establish evidence.
import {
  INSPECTOR_SOURCE_TOPICS, INSPECTOR_DETAIL_SOURCES, parseInspectorQueryRequest,
  parsePresentationReceipt, presentationAdapter, presentationDigest, normalizeExplorerPositionPageRequest,
  isInspectorWholeReading, inspectorWholeReadingGeometryRequired, parseInspectorDetailPayload, inspectorDetailSquares,
  modulePresentationBundleCost, MODULE_POLICIES,
  parseMaiaNodeDistributionOperands, parseMaiaNodeWdlOperands, exactLegalMoves,
  type InspectorQueryRequest, type InspectorQueryPage, type InspectorPageBody,
  type InspectorPageRange, type InspectorRecordedCoverage, type InspectorDetailRef,
  type InspectorDetailKind, type PresentedEvidenceItem,
} from "@chess-tabiya/runtime/client";

type Row = Record<string, unknown>;
type Page = Extract<InspectorQueryPage, { kind: "page" }>;
export type ParsedInspectorPage = Exclude<InspectorQueryPage, Page> | (Page & { readonly items: readonly PresentedEvidenceItem[] });
const fail = (why: string): never => { throw new TypeError(`Inspector response: ${why}`); };
const equal = (a: unknown, b: unknown): boolean => presentationDigest("inspector.response.equal@1", a) === presentationDigest("inspector.response.equal@1", b);
const need = (condition: boolean, why: string): void => { if (!condition) fail(why); };
function snapshot(value: unknown, ancestors = new Set<object>()): unknown {
  if (value === null || typeof value === "string" || typeof value === "boolean" || typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "object" || ancestors.has(value)) return fail("ordinary acyclic JSON required");
  const array = Array.isArray(value);
  if (Object.getPrototypeOf(value) !== (array ? Array.prototype : Object.prototype)) return fail("plain JSON records required");
  ancestors.add(value);
  try {
    if (array) {
      if (Reflect.ownKeys(value).length !== value.length + 1) return fail("dense data array required");
      return Object.freeze(Array.from({ length: value.length }, (_, i) => {
        const field = Object.getOwnPropertyDescriptor(value, i);
        return field !== undefined && field.enumerable && "value" in field ? snapshot(field.value, ancestors) : fail("array data field required");
      }));
    }
    const result: Row = {};
    for (const key of Reflect.ownKeys(value)) {
      const field = Object.getOwnPropertyDescriptor(value, key)!;
      if (typeof key !== "string" || !field.enumerable || !("value" in field)) return fail("record data field required");
      Object.defineProperty(result, key, { value: snapshot(field.value, ancestors), enumerable: true });
    }
    return Object.freeze(result);
  } finally { ancestors.delete(value); }
}
function row(value: unknown, fields: readonly string[]): Row {
  if (value === null || typeof value !== "object" || Object.getPrototypeOf(value) !== Object.prototype
    || Reflect.ownKeys(value).length !== fields.length || fields.some(key => !Object.hasOwn(value, key))) return fail("closed record fields");
  for (const key of fields) { const field = Object.getOwnPropertyDescriptor(value, key); if (field === undefined || !field.enumerable || !("value" in field)) return fail("record must contain data fields"); }
  return value as Row;
}
function record(value: unknown): Row {
  if (value === null || typeof value !== "object" || Object.getPrototypeOf(value) !== Object.prototype) return fail("record expected");
  return value as Row;
}
function list(value: unknown): readonly unknown[] { return Array.isArray(value) ? value : fail("array expected"); }
function nat(value: unknown): number { return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : fail("safe natural expected"); }
function text(value: unknown): string { return typeof value === "string" && value.trim() !== "" ? value : fail("nonempty text expected"); }
function digest(value: unknown): string { const result = text(value); need(/^sha256:[a-f0-9]{64}$/u.test(result), "digest shape"); return result; }
function range(value: unknown): InspectorPageRange {
  const r = row(value, ["start", "count", "total", "next"]), start = nat(r.start), count = nat(r.count), total = nat(r.total);
  need(count <= 8 && Number.isSafeInteger(start + count) && start + count <= total, "range bounds");
  need(total === 0 ? start === 0 && count === 0 : count > 0, "range must progress");
  need(r.next === (start + count < total ? start + count : null), "range continuation");
  return { start, count, total, next: r.next as number | null };
}
function dimensions(value: unknown, nonempty: boolean): readonly string[] {
  const values = list(value); need(values.length <= 4 && (!nonempty || values.length > 0) && new Set(values).size === values.length
    && values.every(item => ["facts", "words", "marks", "arrows"].includes(String(item))), "exceeded dimensions");
  return values as readonly string[];
}
const detailFor = (projection: string): InspectorDetailRef | null => {
  const kind = (Object.keys(INSPECTOR_DETAIL_SOURCES) as InspectorDetailKind[]).find(kind => INSPECTOR_DETAIL_SOURCES[kind] === projection);
  return kind === undefined ? null : `derived.inspector.detail.${kind}@1`;
};
const ledger = (projection: string) => projection === "recorded.engine.eval@1" || projection === "recorded.tablebase.result@1";
const opening = (projection: string) => ["theory.opening.current_endpoint@1", "theory.opening.catalogue_membership@1", "derived.opening.deepest_reached@2"].includes(projection);
function coverage(value: unknown, projection: string, kind: string, reason: unknown, collected?: number): InspectorRecordedCoverage | null {
  if (value === null) { need(!ledger(projection) || !["available", "no_witness"].includes(kind) && reason !== "recorded_measurement_unavailable", "ledger coverage missing"); return null; }
  need(ledger(projection) && (["available", "no_witness"].includes(kind) || kind === "unavailable" && reason === "recorded_measurement_unavailable"), "coverage wrong topic/outcome");
  const r = row(value, ["sourceKey", "matchedRecords", "admittedRecords", "notAdmittedRecords", "abstentions"]);
  digest(r.sourceKey); const matched = nat(r.matchedRecords), admitted = nat(r.admittedRecords), refused = nat(r.notAdmittedRecords);
  need(Number.isSafeInteger(admitted + refused) && matched === admitted + refused, "ledger record totals");
  const a = row(r.abstentions, ["out_of_range", "source_unavailable", "no_data_at_band", "licence_withheld"]);
  const abstentions = Object.values(a).map(nat), sum = abstentions.reduce((total, n) => total + n, 0);
  need(Number.isSafeInteger(sum) && Number.isSafeInteger(matched + sum), "ledger count overflow");
  need(kind === "available" ? admitted > 0 && collected === admitted : kind === "no_witness" ? matched + sum === 0 : admitted === 0 && refused + sum > 0, "ledger outcome counts");
  return r as unknown as InspectorRecordedCoverage;
}
function sourceStatus(value: unknown, projection: string, fen: string): void {
  const s = record(value);
  if (s.kind === "no_witness") { row(s, ["kind"]); return; }
  if (s.kind === "below_floor") {
    row(s, ["kind", "sourceKey", "total", "population"]); digest(s.sourceKey);
    need(projection === "derived.explorer.inspector_population@1" && nat(s.total) < 100, "sparse Explorer topic/floor");
    const p = row(s.population, ["ratingBuckets", "speeds", "since", "until"]), fen4 = fen.split(" ").slice(0, 4).join(" ");
    // Reuse the existing canonical population parser, not a looser UI bucket/date grammar.
    normalizeExplorerPositionPageRequest({ rules: "chess", setupFamily: fen4 === "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -" ? "standard_start" : "from_position",
      variant: "standard", positionFen4: fen4, requestFen6: `${fen4} 0 1`, ...p,
      moveWidth: 1, history: { kind: "disabled" }, topWidth: 0, recentWidth: 0, timeoutMs: 1 } as Parameters<typeof normalizeExplorerPositionPageRequest>[0]);
    return;
  }
  row(s, ["kind", "reason"]);
  if (s.kind === "missing_context") need(["no_incoming_edge", "no_recorded_window", "no_second_attempt", "no_recorded_review"].includes(text(s.reason)), "missing context reason");
  else if (s.kind === "failed") {
    need(["source_contract_invalid", "provider_failed", "source_lookup_failed", "artifact_invalid", "digest_mismatch"].includes(text(s.reason)), "failed reason");
    if (s.reason === "artifact_invalid" || s.reason === "digest_mismatch") need(opening(projection), "artifact failure topic");
  } else if (s.kind === "unavailable") {
    // D3992: no current65 source owner establishes a version hold. Arbitrary slugs and
    // pending metadata are not an owner join; a future real held source requires one here.
    need(["source_absent", "analyze_variant_not_selected", "provider_unavailable", "authored_source_absent", "source_dependency_unavailable", "invalid_turn_clone", "no_legal_recapture", "recorded_measurement_unavailable", "artifact_missing"].includes(text(s.reason)), "unavailable reason");
    if (s.reason === "analyze_variant_not_selected") need(["derived.review.analysis_typed_pv@1", "derived.review.analysis_recorded_pv@1", "derived.review.analysis_recorded_first@1"].includes(projection), "Analyze variant topic");
    if (s.reason === "no_legal_recapture") need(projection === "rules.tactic.predicate.overload_conflict@1", "overload absence topic");
    if (s.reason === "recorded_measurement_unavailable") need(ledger(projection), "ledger absence topic");
    if (s.reason === "artifact_missing") need(opening(projection), "artifact absence topic");
    if (s.reason === "source_dependency_unavailable") need(projection === "theory.shapes.firing@3", "shape dependency absence topic");
  } else fail("unknown source outcome");
}
function presented(value: unknown, projection: string): readonly PresentedEvidenceItem[] {
  const items = parsePresentationReceipt(value);
  for (const item of items) need(item.adapter.consumer.id === "module.full_inspector" && item.adapter.consumer.version === 2
    && `${item.adapter.projection.id}@${item.adapter.projection.version}` === projection && item.evidenceRef !== null, "foreign presentation tuple");
  return items;
}

/** Exact request and final assistance are supplied by this still-current screen, never the wire. */
export function parseInspectorQueryPage(value: unknown, expected: {
  readonly runId: string; readonly request: InspectorQueryRequest; readonly requestedDigest: string; readonly finalDigest: string; readonly fen: string;
}): ParsedInspectorPage {
  const raw = record(snapshot(value));
  if (raw.kind === "refused") {
    row(raw, ["protocol", "kind", "code"]); need(raw.protocol === "inspector.query_page@1" && ["invalid_request", "not_found", "withheld", "stale", "unsupported_version"].includes(text(raw.code)), "refusal protocol/code");
    return Object.freeze({ ...raw }) as unknown as ParsedInspectorPage;
  }
  row(raw, ["protocol", "kind", "runId", "branchId", "nodeId", "decision", "requestedConfigDigest", "effectiveConfigDigest", "disclosure", "body"]);
  const request = parseInspectorQueryRequest(expected.request), query = request.query, view = query.view;
  need(raw.protocol === "inspector.query_page@1" && raw.kind === "page" && raw.runId === expected.runId
    && raw.branchId === query.branchId && raw.nodeId === query.nodeId && raw.requestedConfigDigest === expected.requestedDigest && raw.effectiveConfigDigest === expected.finalDigest, "request/assistance correlation");
  const decision = row(raw.decision, ["eventHeadSeq", "cursor", "disclosureBoundarySeq", "digest"]), cursor = row(decision.cursor, ["branchId", "nodeId"]);
  text(cursor.branchId); text(cursor.nodeId); const head = nat(decision.eventHeadSeq);
  need(decision.disclosureBoundarySeq === null || nat(decision.disclosureBoundarySeq) <= head, "decision boundary");
  const { digest: decisionDigest, ...decisionBody } = decision;
  need(decisionDigest === query.decisionDigest && presentationDigest("module.decision_stamp@1", decisionBody) === decisionDigest, "decision digest");
  const body = record(raw.body);
  let pageRange: InspectorPageRange | null = null, collectionKey: string | null = null, sourceKeys: readonly string[] = [], ordinals: readonly number[] = [];
  let detailProjection: InspectorDetailRef | null = null, sourceOutcome: unknown = null, recordedCoverage: InspectorRecordedCoverage | null = null;
  let items: readonly PresentedEvidenceItem[] = [];
  const bundles: (readonly PresentedEvidenceItem[])[] = [];
  if (body.kind === "inventory") {
    row(body, ["kind", "range", "topics"]); need(view.kind === "inventory", "inventory request");
    pageRange = range(body.range);
    need(view.kind === "inventory" && pageRange.start === view.start && pageRange.total === INSPECTOR_SOURCE_TOPICS.length && pageRange.count === Math.min(8, pageRange.total - pageRange.start), "inventory range");
    const topics = list(body.topics); need(topics.length === pageRange.count, "inventory count");
    topics.forEach((value, i) => { const topic = row(value, ["projection", "family", "state"]), declared = INSPECTOR_SOURCE_TOPICS[pageRange!.start + i]!;
      need(topic.projection === declared.projection && topic.family === declared.family && topic.state === "not_requested", "inventory source order/state"); });
  } else if (body.kind === "source") {
    need(view.kind === "source", "source request"); if (view.kind !== "source") return fail("source request");
    row(body, ["kind", "projection", "context", "outcome", "recordedCoverage", ...("parameters" in view ? ["parameters"] : [])]);
    need(body.projection === view.projection && equal(body.context, view.context) && (!("parameters" in view) || equal(body.parameters, view.parameters)), "source context/parameters");
    const outcome = record(body.outcome);
    if (outcome.kind === "available") {
      row(outcome, ["kind", "collectionKey", "range", "collected", "displayed", "deferred", "facts", "presentation"]);
      collectionKey = digest(outcome.collectionKey); pageRange = range(outcome.range);
      need(pageRange.start === view.start && nat(outcome.collected) === pageRange.total && nat(outcome.collected) > 0 && pageRange.count === Math.min(8, pageRange.total - pageRange.start), "source total/range");
      if (view.start > 0) need(collectionKey === view.collectionKey, "collection continuation");
      const facts = list(outcome.facts); need(facts.length === pageRange.count, "fact count");
      let displayed = 0;
      sourceKeys = facts.map(value => { const fact = row(value, ["sourceKey", "disposition", "exceeded", "detail"]);
        need(fact.detail === detailFor(view.projection), "source detail door");
        if (fact.disposition === "presented") { displayed++; need(dimensions(fact.exceeded, false).length === 0, "presented exceeded"); }
        else { need(fact.disposition === "deferred", "fact disposition"); dimensions(fact.exceeded, true); }
        return digest(fact.sourceKey); });
      need(new Set(sourceKeys).size === sourceKeys.length && nat(outcome.displayed) === displayed && nat(outcome.deferred) === pageRange.count - displayed, "fact occurrence totals");
      items = presented(outcome.presentation, view.projection);
      if (view.projection === "derived.maia.node_distribution@1" || view.projection === "derived.maia.node_candidate_wdl@1") {
        need(items.length === 1 && items[0]!.component.id === "fact_statement", "model source statement");
        const component = items[0]!.component;
        if (component.id !== "fact_statement") return fail("model source statement");
        const distribution = view.projection === "derived.maia.node_distribution@1";
        need(component.operand.rendererId === (distribution ? "consumer.maia_node_distribution@1" : "consumer.maia_node_candidate_wdl@1"), "model source renderer");
        const operands = distribution ? parseMaiaNodeDistributionOperands(component.operand.operands, "Inspector model distribution")
          : parseMaiaNodeWdlOperands(component.operand.operands, "Inspector model candidate measurements");
        need(operands.nodeId === query.nodeId, "model source node");
        const legal = new Set(exactLegalMoves(expected.fen).map(move => move.uci));
        need(operands.candidates.every(candidate => legal.has(candidate.moveUci)), "model source legal moves");
      }
      const split = view.projection.lastIndexOf("@"), adapter = presentationAdapter({ id: "module.full_inspector", version: 2 }, { id: view.projection.slice(0, split), version: Number(view.projection.slice(split + 1)) });
      if (adapter === undefined) return fail("unregistered source adapter");
      const members = adapter.composition?.members ?? [{ component: adapter.component, when: undefined }];
      let offset = 0;
      for (const fact of facts) if (record(fact).disposition === "presented") {
        const begin = offset, first = items[offset];
        const whole = isInspectorWholeReading(view.projection);
        const geometry = whole && first?.component.id === "fact_statement"
          ? inspectorWholeReadingGeometryRequired(view.projection as Parameters<typeof inspectorWholeReadingGeometryRequired>[0], first.component.operand) : false;
        if (whole) need(first?.component.id === "fact_statement", "whole statement missing");
        const owner = items[offset]?.evidenceRef?.evidenceDigest;
        for (const member of members) {
          const item = items[offset];
          if (member.when === "inspector_whole_reading_has_geometry" && !geometry) continue;
          if (member.when !== undefined && member.when !== "inspector_whole_reading_has_geometry") return fail("unexpected source conditional");
          need(item !== undefined && item.component.id === member.component && item.evidenceRef?.evidenceDigest === owner, "whole occurrence composition/owner"); offset++;
          if (item?.component.id === "square_set" || item?.component.id === "relation_overlay") {
            need(item.component.operand.owner.factRef === owner, "board component owner");
            if (whole && item.component.id === "square_set" && first?.component.id === "fact_statement") need(equal(item.component.operand.caption, first.component.operand), "whole board caption");
          }
        }
        bundles.push(items.slice(begin, offset));
      }
      need(offset === items.length, "extra/unowned components");
      sourceOutcome = { kind: "available" };
    } else {
      need(view.start === 0 && view.collectionKey === null, "nonavailable continuation"); sourceStatus(outcome, view.projection, expected.fen); sourceOutcome = outcome;
    }
    recordedCoverage = coverage(body.recordedCoverage, view.projection, String(outcome.kind), outcome.reason, outcome.kind === "available" ? nat(outcome.collected) : undefined);
  } else {
    need(view.kind === "detail", "detail request"); if (view.kind !== "detail") return fail("detail request");
    need(body.kind === "detail" || body.kind === "detail_limited", "unknown body kind");
    const common = ["kind", "projection", "context", "sourceKey", "scope"];
    row(body, [...common, ...(body.kind === "detail" ? ["range", "fullSourceTotal", "sourceOrdinals", "presentation"] : ["ordinal", "sourceOrdinal", "selectedTotal", "fullSourceTotal", "exceeded"])]);
    need(body.projection === view.projection && equal(body.context, view.context) && body.sourceKey === view.sourceKey && equal(body.scope, view.scope), "detail correlation");
    sourceKeys = [digest(body.sourceKey)]; detailProjection = detailFor(view.projection); if (detailProjection === null) return fail("unsupported detail");
    const full = nat(body.fullSourceTotal);
    if (body.kind === "detail") {
      pageRange = range(body.range); need(pageRange.start === view.start && pageRange.total <= full, "detail range/source total");
      ordinals = list(body.sourceOrdinals).map(nat);
      need(ordinals.length === pageRange.count && ordinals.every((n, i) => n < full && (i === 0 || n > ordinals[i - 1]!)), "detail original ordinals");
      items = presented(body.presentation, detailProjection);
      need(items.length >= 1 && items.length <= 2 && items[0]!.component.id === "fact_statement", "complete detail statement");
      const statement = items[0]!.component;
      if (statement.id === "fact_statement") {
        const detailKind = detailProjection.slice("derived.inspector.detail.".length, -2) as InspectorDetailKind;
        need(statement.operand.rendererId === `inspector.detail.${detailKind}@1`, "detail renderer");
        const payload = parseInspectorDetailPayload(detailKind, statement.operand.operands), squares = inspectorDetailSquares(payload);
        need(payload.sourceProjection === body.projection && equal(payload.scope, body.scope) && equal(payload.range, body.range)
          && payload.fullSourceTotal === full && equal(list(payload.members).map(member => record(member).sourceOrdinal), ordinals), "detail typed operands");
        need(items.length === (squares.length === 0 ? 1 : 2), "complete detail geometry");
        const board = items[1]?.component;
        if (squares.length !== 0) need(board?.id === "square_set" && board.operand.brush === "blue" && board.operand.ordered === false
          && board.operand.owner.factRef === items[0]!.evidenceRef?.evidenceDigest && equal(board.operand.squares, squares)
          && equal(board.operand.caption, statement.operand), "detail exact geometry/owner/caption");
      }
      if (items.length === 2) need(items[1]!.component.id === "square_set" && items[1]!.evidenceRef?.evidenceDigest === items[0]!.evidenceRef?.evidenceDigest, "detail geometry owner");
      bundles.push(items);
    } else {
      need(nat(body.ordinal) === view.start && nat(body.ordinal) < nat(body.selectedTotal) && nat(body.selectedTotal) <= full && nat(body.sourceOrdinal) < full, "limited detail bounds");
      dimensions(body.exceeded, true); ordinals = [nat(body.sourceOrdinal)];
    }
  }
  const ceiling = MODULE_POLICIES.find(policy => policy.id === "full_inspector")!.budgets;
  const costs = bundles.map(modulePresentationBundleCost), total = costs.reduce((sum, cost) => ({ facts: sum.facts + cost.facts, words: sum.words + cost.words, marks: sum.marks + cost.marks, arrows: sum.arrows + cost.arrows }), { facts: 0, words: 0, marks: 0, arrows: 0 });
  need(total.facts <= ceiling.maxFacts && total.words <= ceiling.maxWords && (ceiling.maxMarks === null || total.marks <= ceiling.maxMarks) && total.arrows <= ceiling.maxArrows, "page display budget");
  const disclosure = row(raw.disclosure, ["protocol", "runId", "branchId", "nodeId", "decisionDigest", "requestedConfigDigest", "effectiveConfigDigest", "view", "range", "collectionKey", "sourceKeys", "sourceOrdinals", "detailProjection", "componentDigests", "sourceOutcome", "recordedCoverage", "digest"]);
  // Original source ordinals are private-source facts, not dense page indices. The receiver
  // can validate/bind their wire shape/order; it cannot recreate them from a payload digest.
  if (body.kind === "source" && record(body.outcome).kind === "available") {
    ordinals = list(disclosure.sourceOrdinals).map(nat);
    need(ordinals.length === sourceKeys.length && ordinals.every((n, i) => i === 0 || n > ordinals[i - 1]!), "source original ordinals");
  }
  const expectedDisclosure = { protocol: "inspector.disclosure_receipt@1", runId: raw.runId, branchId: raw.branchId, nodeId: raw.nodeId,
    decisionDigest: query.decisionDigest, requestedConfigDigest: expected.requestedDigest, effectiveConfigDigest: expected.finalDigest,
    view, range: pageRange, collectionKey, sourceKeys, sourceOrdinals: ordinals, detailProjection,
    componentDigests: items.map(item => item.componentDigest), sourceOutcome, recordedCoverage };
  const { digest: supplied, ...receiptBody } = disclosure;
  need(equal(receiptBody, expectedDisclosure) && digest(supplied) === presentationDigest("inspector.disclosure_receipt@1", expectedDisclosure), "body/disclosure binding");
  // Detach transport objects before storing them; presentation items retain client-local seals.
  return Object.freeze({ ...raw, items }) as unknown as ParsedInspectorPage;
}
