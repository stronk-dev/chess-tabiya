import { Buffer } from "node:buffer";

import {
  assertLegalPopulationOwned,
  compileLegalPopulation,
  createExactLegalEvidenceFactory,
} from "../d2428-candidate-packet-sixth-author-repair/model.mjs";

const EVENT_COLLECTORS = Object.freeze([
  "event.structural",
  "event.pawn_island",
  "event.transition",
  "event.tactical",
  "event.loose_piece",
  "event.castling",
  "event.exchange",
  "event.discovered",
  "event.breadth",
  "event.duty",
]);

const READING_COLLECTORS = Object.freeze([
  "reading.child",
  "reading.legal_exchange",
  "reading.fork_survival",
]);

const DEPENDENCIES = Object.freeze({
  "event.structural": Object.freeze([]),
  "event.pawn_island": Object.freeze([]),
  "event.transition": Object.freeze([]),
  "event.tactical": Object.freeze([]),
  "event.loose_piece": Object.freeze([]),
  "event.castling": Object.freeze([]),
  "event.exchange": Object.freeze(["event.transition"]),
  "event.discovered": Object.freeze(["event.transition"]),
  "event.breadth": Object.freeze(["event.transition"]),
  "event.duty": Object.freeze(["event.transition"]),
  "reading.child": Object.freeze([]),
  "reading.legal_exchange": Object.freeze(["event.transition"]),
  "reading.fork_survival": Object.freeze(["event.tactical", "reading.legal_exchange"]),
});

function freezeValue(value) {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) freezeValue(child);
  return Object.freeze(value);
}

function collectAvailable(collectorId, context) {
  const projection = `${collectorId}@1`;
  const dependencies = Object.freeze(Object.fromEntries(
    Object.entries(context.memo).map(([id, entry]) => [id, entry.outcomes.map((outcome) => outcome.projection)]),
  ));
  const value = freezeValue({
    projection,
    basis: Object.freeze({
      beforeFen: context.beforeFen,
      moveUci: context.moveUci,
      afterFen: context.afterFen,
      dependencies,
    }),
  });
  return Object.freeze({ kind: "available", projection, values: Object.freeze([value]) });
}

function collectLoosePiece(collectorId, context) {
  if (context.moveUci.endsWith("4")) {
    return Object.freeze({ kind: "unavailable", projection: `${collectorId}@1`, reason: "fixture_unavailable" });
  }
  return collectAvailable(collectorId, context);
}

export const CANDIDATE_COLLECTOR_EXECUTION = Object.freeze(Object.fromEntries(
  [...EVENT_COLLECTORS, ...READING_COLLECTORS].map((collectorId) => [
    collectorId,
    Object.freeze({
      scope: collectorId.startsWith("event.") ? "events" : "readings",
      outputs: Object.freeze([`${collectorId}@1`]),
      dependencies: DEPENDENCIES[collectorId],
      maxInvocationsPerCandidate: 1,
      collect: collectorId === "event.loose_piece" ? collectLoosePiece : collectAvailable,
    }),
  ]),
));

const SCOPES = Object.freeze({
  events: Object.freeze({ events: true, readings: false }),
  readings: Object.freeze({ events: false, readings: true }),
  events_and_readings: Object.freeze({ events: true, readings: true }),
});

function requestedCollectors(scope) {
  const descriptor = SCOPES[scope];
  if (!descriptor) throw new TypeError(`UNKNOWN_SCOPE:${scope}`);
  return new Set([
    ...(descriptor.events ? EVENT_COLLECTORS : []),
    ...(descriptor.readings ? READING_COLLECTORS : []),
  ]);
}

export function planCandidateCollectors(scope) {
  const retained = requestedCollectors(scope);
  const required = new Set(retained);
  const visit = (collectorId) => {
    const declaration = CANDIDATE_COLLECTOR_EXECUTION[collectorId];
    if (!declaration) throw new TypeError(`UNKNOWN_COLLECTOR:${collectorId}`);
    for (const dependency of declaration.dependencies) {
      required.add(dependency);
      visit(dependency);
    }
  };
  for (const collectorId of retained) visit(collectorId);

  const ordered = [];
  const complete = new Set();
  const active = new Set();
  const append = (collectorId) => {
    if (complete.has(collectorId)) return;
    if (active.has(collectorId)) throw new TypeError(`CYCLIC_COLLECTOR:${collectorId}`);
    active.add(collectorId);
    for (const dependency of CANDIDATE_COLLECTOR_EXECUTION[collectorId].dependencies) append(dependency);
    active.delete(collectorId);
    complete.add(collectorId);
    ordered.push(Object.freeze({ collectorId, retain: retained.has(collectorId) }));
  };
  for (const collectorId of Object.keys(CANDIDATE_COLLECTOR_EXECUTION)) {
    if (required.has(collectorId)) append(collectorId);
  }
  return Object.freeze({ scope, collectors: Object.freeze(ordered) });
}

function executeCandidate(beforeFen, move, plan, observation) {
  const executionOutcomes = [];
  const retainedOutcomes = [];
  const events = [];
  const readings = [];
  const abstentions = [];
  const memo = new Map();
  const afterFen = `${beforeFen} after ${move.uci}`;

  for (const planned of plan.collectors) {
    const declaration = CANDIDATE_COLLECTOR_EXECUTION[planned.collectorId];
    const dependencyMemo = Object.freeze(Object.fromEntries(declaration.dependencies.map((dependency) => {
      const outcomes = memo.get(dependency);
      if (!outcomes) throw new TypeError(`MISSING_DEPENDENCY:${planned.collectorId}:${dependency}`);
      return [dependency, Object.freeze({ collectorId: dependency, outcomes })];
    })));
    observation.push(Object.freeze({
      collectorId: planned.collectorId,
      memoKeys: Object.freeze(Object.keys(dependencyMemo)),
      retained: planned.retain,
    }));
    const context = Object.freeze({ beforeFen, moveUci: move.uci, afterFen, memo: dependencyMemo });
    const result = declaration.collect(planned.collectorId, context);
    const outcome = freezeValue({ collectorId: planned.collectorId, moveUci: move.uci, projection: result.projection, result });
    const outcomes = Object.freeze([outcome]);
    memo.set(planned.collectorId, outcomes);
    executionOutcomes.push(outcome);

    if (!planned.retain) continue;
    retainedOutcomes.push(outcome);
    if (result.kind === "unavailable") {
      abstentions.push(Object.freeze({ projection: result.projection, reason: result.reason }));
    } else if (declaration.scope === "events") {
      events.push(...result.values);
    } else {
      readings.push(...result.values);
    }
  }

  const row = freezeValue({
    moveUci: move.uci,
    afterFen,
    events: Object.freeze(events),
    readings: Object.freeze(readings),
    abstentions: Object.freeze(abstentions),
  });
  const retainedInput = freezeValue({
    row,
    events: row.events,
    readings: row.readings,
    abstentions: row.abstentions,
    collectorOutcomes: Object.freeze(retainedOutcomes),
    executionOutcomes: Object.freeze(executionOutcomes),
  });
  return retainedInput;
}

const RETAINED_ROOT_DESCRIPTOR = Object.freeze([
  Object.freeze({ referenceField: "packet", category: "packet", select: (references) => [references.packet] }),
  Object.freeze({ referenceField: "legalMovesInput", category: "legal_moves_input", select: (references) => [references.legalMovesInput] }),
  Object.freeze({ referenceField: "packet", category: "legal_move", select: (references) => references.packet.legalMoves }),
  Object.freeze({ referenceField: "candidateInputs", category: "candidate_row", select: (references) => references.candidateInputs.map((input) => input.row) }),
  Object.freeze({ referenceField: "candidateInputs", category: "event", select: (references) => references.candidateInputs.flatMap((input) => input.events) }),
  Object.freeze({ referenceField: "candidateInputs", category: "reading", select: (references) => references.candidateInputs.flatMap((input) => input.readings) }),
  Object.freeze({ referenceField: "candidateInputs", category: "abstention", select: (references) => references.candidateInputs.flatMap((input) => input.abstentions) }),
  Object.freeze({ referenceField: "candidateInputs", category: "retained_collector_outcome", select: (references) => references.candidateInputs.flatMap((input) => input.collectorOutcomes) }),
  Object.freeze({ referenceField: "candidateInputs", category: "execution_collector_outcome", select: (references) => references.candidateInputs.flatMap((input) => input.executionOutcomes) }),
]);

export const RETAINED_CATEGORIES = Object.freeze([...new Set(RETAINED_ROOT_DESCRIPTOR.map((row) => row.category))]);
const RETAINED_REFERENCE_FIELDS = Object.freeze([...new Set(RETAINED_ROOT_DESCRIPTOR.map((row) => row.referenceField))].sort());

function scalarBytes(value) {
  if (value === null) return Buffer.byteLength("null");
  if (typeof value === "string") return Buffer.byteLength(value);
  if (typeof value === "boolean") return Buffer.byteLength(value ? "true" : "false");
  if (typeof value === "number" && Number.isFinite(value)) return Buffer.byteLength(String(value));
  throw new TypeError(`UNSUPPORTED_RETAINED_VALUE:${typeof value}`);
}

function assertExactOwnDataProperties(value, keys) {
  const ownKeys = Reflect.ownKeys(value);
  if (ownKeys.some((key) => typeof key === "symbol")) throw new TypeError("SYMBOL_RETAINED_KEY");
  const expected = new Set(keys);
  for (const key of ownKeys) {
    if (key === "length" && Array.isArray(value)) continue;
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !("value" in descriptor)) throw new TypeError(`ACCESSOR_RETAINED_KEY:${key}`);
    if (!descriptor.enumerable) throw new TypeError(`NON_ENUMERABLE_RETAINED_KEY:${key}`);
    if (!expected.has(key)) throw new TypeError(`UNDECLARED_RETAINED_KEY:${key}`);
  }
  if (ownKeys.filter((key) => key !== "length").length !== keys.length) {
    throw new TypeError("RETAINED_KEY_SET_MISMATCH");
  }
}

function visitRetained(value, state) {
  if (value === null || typeof value !== "object") {
    state.logicalUtf8Bytes += scalarBytes(value);
    return;
  }
  if (state.seen.has(value)) return;
  const prototype = Object.getPrototypeOf(value);
  if (!Array.isArray(value) && prototype !== Object.prototype && prototype !== null) {
    throw new TypeError("NON_PLAIN_RETAINED_OBJECT");
  }
  state.seen.add(value);
  state.uniqueObjects += 1;
  if (Array.isArray(value)) {
    const keys = Array.from({ length: value.length }, (_, index) => String(index));
    assertExactOwnDataProperties(value, keys);
    for (const key of keys) visitRetained(value[Number(key)], state);
    return;
  }
  const keys = Object.keys(value).sort();
  assertExactOwnDataProperties(value, keys);
  for (const key of keys) {
    state.logicalUtf8Bytes += Buffer.byteLength(key);
    visitRetained(value[key], state);
  }
}

export function measureRetainedGraph(references) {
  const referenceKeys = Reflect.ownKeys(references);
  if (referenceKeys.some((key) => typeof key === "symbol")) throw new TypeError("SYMBOL_RETAINED_ROOT");
  const measuredFields = referenceKeys.filter((key) => key !== "manifest").sort();
  if (measuredFields.join("\0") !== RETAINED_REFERENCE_FIELDS.join("\0")) {
    throw new TypeError("RETAINED_ROOT_SET_MISMATCH");
  }
  assertExactOwnDataProperties(references, ["manifest", ...RETAINED_REFERENCE_FIELDS].sort());

  const aggregate = Object.freeze(Object.fromEntries(
    RETAINED_REFERENCE_FIELDS.map((field) => [field, references[field]]),
  ));
  const counts = Object.fromEntries(RETAINED_CATEGORIES.map((category) => [category, 0]));
  for (const descriptor of RETAINED_ROOT_DESCRIPTOR) {
    counts[descriptor.category] += descriptor.select(references).length;
  }
  const state = { logicalUtf8Bytes: 0, uniqueObjects: 0, seen: new WeakSet() };
  visitRetained(aggregate, state);
  return Object.freeze({
    logicalUtf8Bytes: state.logicalUtf8Bytes,
    uniqueObjects: state.uniqueObjects,
    categoryCounts: Object.freeze(counts),
  });
}

function makePacket(beforeFen, scope, legalPopulation, candidateInputs) {
  const packet = freezeValue({
    id: `${beforeFen}:${scope}`,
    beforeFen,
    ruleset: "standard",
    scope,
    legalMoves: legalPopulation.legalMoves,
    candidates: Object.freeze(candidateInputs.map((input) => input.row)),
  });
  const references = freezeValue({
    manifest: Object.freeze({ digest: "fixture-primary-manifest" }),
    packet,
    legalMovesInput: legalPopulation.legalMovesInput,
    candidateInputs: Object.freeze(candidateInputs),
  });
  return Object.freeze({ packet, references, observation: Object.freeze([]) });
}

function compileCandidateOperation(request, createRulesMobilityReadingLegalMovesV1Evidence) {
  if (request.ruleset !== "standard") throw new TypeError("UNSUPPORTED_RULESET");
  const plan = planCandidateCollectors(request.scope);
  const legalPopulation = compileLegalPopulation(
    request.beforeFen,
    createRulesMobilityReadingLegalMovesV1Evidence,
  );
  assertLegalPopulationOwned(legalPopulation);
  const observation = [];
  const candidateInputs = legalPopulation.legalMoves.map((move) => executeCandidate(
    request.beforeFen,
    move,
    plan,
    observation,
  ));
  const compiled = makePacket(request.beforeFen, request.scope, legalPopulation, candidateInputs);
  return Object.freeze({ ...compiled, observation: Object.freeze(observation) });
}

export function createCandidateCompilerForAuthor(exactLegalMoveMap) {
  const createRulesMobilityReadingLegalMovesV1Evidence = createExactLegalEvidenceFactory(exactLegalMoveMap);
  return Object.freeze({
    compile(request) {
      return compileCandidateOperation(request, createRulesMobilityReadingLegalMovesV1Evidence);
    },
  });
}

export function projectWide(compiled, targetScope) {
  if (compiled.packet.scope !== "events_and_readings") throw new TypeError("SOURCE_NOT_WIDE");
  if (targetScope !== "events" && targetScope !== "readings") throw new TypeError("INVALID_TARGET_SCOPE");
  const candidateInputs = compiled.references.candidateInputs.map((input) => {
    const retainedOutcomes = input.collectorOutcomes.filter((outcome) => {
      const declaration = CANDIDATE_COLLECTOR_EXECUTION[outcome.collectorId];
      return declaration.scope === targetScope;
    });
    const allowed = new Set(retainedOutcomes.map((outcome) => outcome.projection));
    const events = targetScope === "events" ? input.events : Object.freeze([]);
    const readings = targetScope === "readings" ? input.readings : Object.freeze([]);
    const abstentions = Object.freeze(input.abstentions.filter((item) => allowed.has(item.projection)));
    const row = freezeValue({ moveUci: input.row.moveUci, afterFen: input.row.afterFen, events, readings, abstentions });
    return freezeValue({
      row,
      events,
      readings,
      abstentions,
      collectorOutcomes: Object.freeze(retainedOutcomes),
      executionOutcomes: input.executionOutcomes,
    });
  });
  const legalPopulation = Object.freeze({
    legalMovesInput: compiled.references.legalMovesInput,
    legalMoves: compiled.packet.legalMoves,
  });
  return makePacket(compiled.packet.beforeFen, targetScope, legalPopulation, candidateInputs);
}

function positiveSafeInteger(value, name) {
  if (!Number.isSafeInteger(value) || value <= 0) throw new TypeError(`INVALID_LIMIT:${name}`);
  return value;
}

export class CandidateReceiptCache {
  #limits;
  #entries = new Map();
  #logicalUtf8Bytes = 0;
  #uniqueObjects = 0;
  #evictions = 0;
  #oversizeNotCached = 0;

  constructor(limits) {
    this.#limits = Object.freeze({
      maxEntries: positiveSafeInteger(limits.maxEntries, "maxEntries"),
      maxRetainedLogicalBytes: positiveSafeInteger(limits.maxRetainedLogicalBytes, "maxRetainedLogicalBytes"),
      maxRetainedObjects: positiveSafeInteger(limits.maxRetainedObjects, "maxRetainedObjects"),
    });
  }

  admit(key, compiled) {
    const measure = measureRetainedGraph(compiled.references);
    if (
      measure.logicalUtf8Bytes > this.#limits.maxRetainedLogicalBytes
      || measure.uniqueObjects > this.#limits.maxRetainedObjects
    ) {
      this.#oversizeNotCached += 1;
      return Object.freeze({ cache: "oversize_not_cached", measure });
    }
    const prior = this.#entries.get(key);
    if (prior) this.#delete(key, prior, false);
    this.#entries.set(key, Object.freeze({ compiled, measure }));
    this.#logicalUtf8Bytes += measure.logicalUtf8Bytes;
    this.#uniqueObjects += measure.uniqueObjects;
    while (
      this.#entries.size > this.#limits.maxEntries
      || this.#logicalUtf8Bytes > this.#limits.maxRetainedLogicalBytes
      || this.#uniqueObjects > this.#limits.maxRetainedObjects
    ) {
      const oldestKey = this.#entries.keys().next().value;
      this.#delete(oldestKey, this.#entries.get(oldestKey), true);
    }
    return Object.freeze({ cache: "miss", measure });
  }

  get(key) {
    const entry = this.#entries.get(key);
    if (!entry) return undefined;
    this.#entries.delete(key);
    this.#entries.set(key, entry);
    return entry.compiled;
  }

  #delete(key, entry, eviction) {
    this.#entries.delete(key);
    this.#logicalUtf8Bytes -= entry.measure.logicalUtf8Bytes;
    this.#uniqueObjects -= entry.measure.uniqueObjects;
    if (eviction) this.#evictions += 1;
  }

  stats() {
    return Object.freeze({
      entries: this.#entries.size,
      retainedLogicalBytes: this.#logicalUtf8Bytes,
      retainedObjects: this.#uniqueObjects,
      evictions: this.#evictions,
      oversizeNotCached: this.#oversizeNotCached,
    });
  }
}
