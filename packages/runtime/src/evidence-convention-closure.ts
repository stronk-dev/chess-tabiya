/**
 * Direct convention closure per mintable projection, and the value-level receipt the sole mint
 * seals with every value (rfc/semantic-convention-provenance.md §2 and §4; [[D1921]]).
 *
 * A projection's DIRECT refs are derived mechanically from reviewed sources, never guessed:
 *
 * 1. **witnessed** — every registered declaration whose `landed_contract` witnesses name the exact
 *    projection ref;
 * 2. **retained by a successor** — `X@n` keeps the witnessed refs of `X@(n-1)`; a successor that
 *    retains the predecessor's operands keeps its convention meaning (rfc/recorded-semantic-path.md
 *    §3 for the eleven `@2` sequences, the `@2` mate proof);
 * 3. **named in the catalogue** — every registered `id@version` token written literally in the
 *    projection's catalogue semantics or limitations (`defence-duty@1: …`, `legal-exchange@1`); and
 * 4. **declared inheritance** — the one explicit row set rfc/evidence-value-authority.md §3.2 names
 *    whose catalogue text carries the convention without its ref; and
 * 5. **instance** — for a projection whose payload selects one convention (setup/method), only the
 *    selected ref, supplied by the factory at mint time; the alternatives its text lists are not
 *    direct refs.
 *
 * A derived value's closure is the union of its direct refs and the closures of the exact sealed
 * inputs it was minted from; an unused alternative contributes nothing. The receipt is created
 * atomically with the value by the mint and never attached after freeze.
 */
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import type { CompiledEvidenceManifest, ProjectionDeclaration } from "./evidence-contract.js";
import {
  CONVENTION_REGISTRY,
  compareConventionRefs,
  conventionRefKey,
  type CompiledConventionRegistry,
  type ConventionRef,
} from "./evidence-conventions.js";

const projectionKey = (projection: { readonly id: string; readonly version: number }): string => `${projection.id}@${projection.version}`;

/**
 * rfc/evidence-value-authority.md §3.2: the square-control event carries its reading's convention,
 * but its catalogue text states the convention without naming `square-control@1`.
 */
export const DECLARED_CONVENTION_INHERITANCE: Readonly<Record<string, readonly string[]>> = Object.freeze({
  "rules.square.event.control@1": Object.freeze(["square-control@1"]),
});

interface ConventionReplacement { readonly from: string; readonly to: string; readonly source?: string }

/** Replaces only automatic predecessor inheritance, never actual sealed-input conventions. */
const DECLARED_CONVENTION_REPLACEMENTS: Readonly<Record<string, readonly ConventionReplacement[]>> = Object.freeze({
  "derived.grade.move_quality@2": Object.freeze([Object.freeze({ from: "grade-convention@1", to: "grade-convention@2" })]),
  "rules.structural.event.king_opposition@2": Object.freeze([Object.freeze({ from: "king-opposition-blocker-blind@1", to: "king-opposition-unobstructed@1", source: "rules.structural.reading.king_opposition@3" })]),
  "rules.structural.event.backward_pawn@2": Object.freeze([Object.freeze({ from: "backward-pawn-legacy@1", to: "backward-pawn@1", source: "rules.structural.reading.backward_pawn@3" })]),
  "rules.structural.predicate.king_opposition@2": Object.freeze([Object.freeze({ from: "king-opposition-blocker-blind@1", to: "king-opposition-unobstructed@1", source: "rules.structural.reading.king_opposition@3" })]),
  "rules.structural.predicate.backward_pawn@2": Object.freeze([Object.freeze({ from: "backward-pawn-legacy@1", to: "backward-pawn@1", source: "rules.structural.reading.backward_pawn@3" })]),
  "rules.structural.predicate.outpost@2": Object.freeze([Object.freeze({ from: "maximal_pawn_reach@1", to: "outpost-candidate@1", source: "derived.structural.reading.outpost_candidate@1" })]),
});

/** Only the five exact foundation §2.1 tuples may replace a different convention base. */
function foundationReplacement(route: string, pair: ConventionReplacement): { readonly source: string; readonly implementation: string } | undefined {
  const match = /^rules\.structural\.(event|predicate)\.(king_opposition|backward_pawn|outpost)@2$/u.exec(route);
  if (match === null || match[2] === "outpost" && match[1] !== "predicate") return undefined;
  const kind = match[2]!;
  const from = kind === "king_opposition" ? "king-opposition-blocker-blind@1" : kind === "backward_pawn" ? "backward-pawn-legacy@1" : "maximal_pawn_reach@1";
  const to = kind === "king_opposition" ? "king-opposition-unobstructed@1" : kind === "backward_pawn" ? "backward-pawn@1" : "outpost-candidate@1";
  const source = kind === "outpost" ? "derived.structural.reading.outpost_candidate@1" : `rules.structural.reading.${kind}@3`;
  const implementation = `packages/runtime/src/foundation-position-sources.ts#${kind === "king_opposition" ? "readUnobstructedOpposition" : kind === "backward_pawn" ? "readBackwardPawns" : "readOutpostCandidates"}`;
  return pair.from === from && pair.to === to && pair.source === source ? { source, implementation } : undefined;
}

/** Package-internal sole-mint guard: a declaration alone is never a source-value authority. */
export function conventionReplacementSource(route: string): string | undefined {
  return DECLARED_CONVENTION_REPLACEMENTS[route]?.find(pair => pair.source !== undefined)?.source;
}

/**
 * Projections whose payload instance selects one registered convention (a setup or method
 * convention ref passed to the factory). Their catalogue text lists every alternative, so it is not
 * a direct closure: only the instance the value was computed under enters its receipt, and an
 * alternative that did not run contributes nothing (rfc/semantic-convention-provenance.md §2).
 */
export const INSTANCE_CONVENTION_PROJECTIONS: ReadonlySet<string> = new Set(["theory.endgame.setup_match@1", "theory.endgame.method_stage@1"]);

export type ConventionClosureOrigin = "witnessed" | "successor" | "catalogue_text" | "declared_inheritance";

export interface ProjectionConventionRow {
  readonly projection: string;
  readonly refs: readonly ConventionRef[];
  /** Why each ref is present, keyed by `id@version`; diagnostic for the closure report. */
  readonly origins: Readonly<Record<string, readonly ConventionClosureOrigin[]>>;
}

function mentions(text: string, key: string): boolean {
  let index = text.indexOf(key);
  while (index >= 0) {
    const before = index === 0 ? "" : text[index - 1]!;
    const after = text[index + key.length] ?? "";
    if (!/[a-z0-9_-]/u.test(before) && !/[0-9]/u.test(after)) return true;
    index = text.indexOf(key, index + 1);
  }
  return false;
}

/**
 * Derives the direct closure of every non-retired projection in `manifest`. Pure over its inputs so
 * fixtures can prove a removed witness, a renamed catalogue token or an unregistered inherited ref
 * changes or fails the table.
 */
export function deriveProjectionConventionTable(manifest: CompiledEvidenceManifest, registry: CompiledConventionRegistry = CONVENTION_REGISTRY, inheritance: Readonly<Record<string, readonly string[]>> = DECLARED_CONVENTION_INHERITANCE,
  replacements: Readonly<Record<string, readonly ConventionReplacement[]>> = DECLARED_CONVENTION_REPLACEMENTS): ReadonlyMap<string, ProjectionConventionRow> {
  const registered = new Map(registry.declarations.map((declaration) => [conventionRefKey(declaration.ref), declaration.ref]));
  const witnessed = new Map<string, Set<string>>();
  for (const declaration of registry.declarations) {
    for (const authority of declaration.authority) {
      if (authority.kind !== "landed_contract") continue;
      for (const witness of authority.witnesses) {
        if (!/^[a-z][a-z0-9_.]*@[1-9][0-9]*$/u.test(witness)) continue;
        const set = witnessed.get(witness) ?? new Set<string>();
        set.add(conventionRefKey(declaration.ref));
        witnessed.set(witness, set);
      }
    }
  }
  const projections = new Map(manifest.projections.map((projection) => [projectionKey(projection), projection]));
  for (const [route, pairs] of Object.entries(replacements)) {
    const successor = projections.get(route);
    if (successor === undefined || successor.disposition?.kind === "retired" || successor.version < 2) throw new TypeError(`Convention replacement names unknown or inactive successor ${route}`);
    const prior = projections.get(`${successor.id}@${successor.version - 1}`), seen = new Set<string>();
    const text = [successor.semantics, ...successor.limitations].join("\n");
    if (prior === undefined || pairs.length === 0) throw new TypeError(`Convention replacement lacks its immediate predecessor or pair for ${route}`);
    for (const pair of pairs) {
      const fields = pair !== null && typeof pair === "object" && Object.hasOwn(pair, "source") ? ["from", "to", "source"] : ["from", "to"];
      if (pair === null || typeof pair !== "object" || Reflect.ownKeys(pair).length !== fields.length
        || !fields.every(field => { const entry = Object.getOwnPropertyDescriptor(pair, field); return entry?.enumerable && "value" in entry; })) throw new TypeError(`Invalid convention replacement for ${route}`);
      const from = registered.get(pair.from), to = registered.get(pair.to);
      if (from === undefined || to === undefined) throw new TypeError(`Unregistered convention replacement for ${route}`);
      if (from.id === to.id) {
        if (from.version + 1 !== to.version || fields.length !== 2) throw new TypeError(`Non-successor convention replacement for ${route}`);
      } else {
        const required = foundationReplacement(route, pair), source = required === undefined ? undefined : projections.get(required.source);
        const declaration = registry.declarations.find(item => conventionRefKey(item.ref) === pair.to);
        const sourceText = source === undefined ? "" : [source.semantics, ...source.limitations].join("\n");
        const producer = source === undefined ? undefined : manifest.producers.find(item => projectionKey(item) === projectionKey(source.producer));
        if (required === undefined || source === undefined || source.role !== "reading" || source.disposition?.kind === "retired"
          || !successor.dependsOn.some(input => projectionKey(input) === required.source) || !mentions(sourceText, pair.to)
          || !declaration?.authority.some(authority => authority.kind === "position_rules" && authority.implementation === required.implementation)
          || !producer?.implementation.split(";").some(path => path.trim() === required.implementation.split("#")[0])) {
          throw new TypeError(`Convention replacement lacks its exact installed source/helper authority for ${route}`);
        }
      }
      if (seen.has(pair.from) || seen.has(pair.to)) throw new TypeError(`Duplicate or conflicting convention replacement for ${route}`);
      seen.add(pair.from); seen.add(pair.to);
      if (!witnessed.get(projectionKey(prior))?.has(pair.from) || !mentions(text, pair.to) || mentions(text, pair.from)) throw new TypeError(`Convention replacement lacks exact predecessor witness or successor catalogue meaning for ${route}`);
    }
  }
  for (const [route, refs] of Object.entries(inheritance)) {
    if (!projections.has(route)) throw new TypeError(`Convention inheritance names unknown projection ${route}`);
    for (const ref of refs) if (!registered.has(ref)) throw new TypeError(`Convention inheritance for ${route} names unregistered ${ref}`);
  }
  const table = new Map<string, ProjectionConventionRow>();
  for (const projection of manifest.projections) {
    if (projection.disposition?.kind === "retired") continue;
    const key = projectionKey(projection);
    const origins = new Map<string, ConventionClosureOrigin[]>();
    const add = (ref: string, origin: ConventionClosureOrigin): void => {
      const list = origins.get(ref) ?? [];
      if (!list.includes(origin)) list.push(origin);
      origins.set(ref, list);
    };
    for (const ref of witnessed.get(key) ?? []) add(ref, "witnessed");
    if (projection.version > 1) for (const ref of witnessed.get(`${projection.id}@${projection.version - 1}`) ?? []) add(replacements[key]?.find(pair => pair.from === ref)?.to ?? ref, "successor");
    const text = [projection.semantics, ...projection.limitations].join("\n");
    if (!INSTANCE_CONVENTION_PROJECTIONS.has(key)) for (const ref of registered.keys()) if (mentions(text, ref)) add(ref, "catalogue_text");
    for (const ref of inheritance[key] ?? []) add(ref, "declared_inheritance");
    const refs = [...origins.keys()].map((ref) => registered.get(ref)!).sort(compareConventionRefs);
    table.set(key, Object.freeze({
      projection: key,
      refs: Object.freeze(refs),
      origins: Object.freeze(Object.fromEntries([...origins].sort(([left], [right]) => left < right ? -1 : 1).map(([ref, list]) => [ref, Object.freeze([...list])]))),
    }));
  }
  return table;
}

export const PROJECTION_CONVENTION_TABLE: ReadonlyMap<string, ProjectionConventionRow> = deriveProjectionConventionTable(PRIMARY_EVIDENCE_MANIFEST);

const EMPTY: readonly ConventionRef[] = Object.freeze([]);

/** Direct convention refs of one mintable projection route (`id@version`). */
export function directProjectionConventions(route: string): readonly ConventionRef[] {
  return PROJECTION_CONVENTION_TABLE.get(route)?.refs ?? EMPTY;
}

/** Declared derivation members of a projection as canonical `+`-joined exact-ref identities. */
export function declaredDerivationMembers(projection: ProjectionDeclaration): readonly string[] {
  const derivation = projection.derivation;
  if (derivation === undefined) return [];
  if (derivation.reduction !== undefined) throw new TypeError("A reduction has no literal convention member; use its authenticated reduction receipt");
  const members = derivation.inputs !== undefined ? [derivation.inputs] : derivation.anyOf ?? [];
  return members.map((member) => [...new Set(member.map(projectionKey))].sort().join("+"));
}
