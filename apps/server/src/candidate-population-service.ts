/**
 * The one application-lifetime shared candidate packet service (rfc/shared-candidate-evidence-packet.md
 * §4, rfc/hint-distance.md §10 and criterion 15).
 *
 * subject-safe-semantic-selection §6.4: one bounded process-local LRU counts partial and
 * completed construction owners together. Every full/foundation stage reuses that owner;
 * pure source retention never stores a run permission. The legacy synchronous wide call
 * drains the same steps that run-facing loops can yield and reauthorize between.
 */
import {
  beginCandidateConstruction,
  advanceCandidateConstruction,
  readCandidateConstruction,
  type CandidateConstruction,
  type CandidateAcquisitionScope,
  type CandidateAcquisitionResult,
  type CandidatePopulationFailure,
  type CandidatePopulationReceipt,
  type CandidateWideScope,
} from "@chess-tabiya/runtime";

export interface CandidatePopulationServiceStats {
  readonly hits: number;
  readonly misses: number;
  readonly retained: number;
  readonly capacity: number;
}

export type CandidatePopulationLookup =
  | { readonly kind: "ready"; readonly receipt: CandidatePopulationReceipt<CandidateWideScope> }
  | { readonly kind: "failed"; readonly error: CandidatePopulationFailure };

export interface CandidatePopulationEntry { readonly kind: "candidate_service_entry" }
interface Entry {
  readonly beforeFen: string;
  readonly token: CandidatePopulationEntry;
  readonly construction: CandidateConstruction;
}
export type CandidatePopulationStep<S extends CandidateAcquisitionScope> = CandidateAcquisitionResult<S> | { readonly kind: "retired" };

export class CandidatePopulationService {
  readonly #capacity: number;
  readonly #entries = new Map<string, Entry>();
  readonly #tokens = new WeakMap<CandidatePopulationEntry, Entry | null>();
  #hits = 0;
  #misses = 0;

  constructor(options: { readonly capacity: number }) {
    if (!Number.isSafeInteger(options.capacity) || options.capacity < 1) throw new TypeError("CandidatePopulationService capacity must be a positive safe integer");
    this.#capacity = options.capacity;
  }

  /** Count partial and completed owners together, before their first producer invocation. */
  begin(beforeFen: string): { readonly kind: "started"; readonly entry: CandidatePopulationEntry } | { readonly kind: "failed"; readonly error: CandidatePopulationFailure } {
    const cached = this.#entries.get(beforeFen);
    if (cached !== undefined) {
      this.#hits += 1;
      this.#entries.delete(beforeFen);
      this.#entries.set(beforeFen, cached);
      return Object.freeze({ kind: "started", entry: cached.token });
    }
    const result = beginCandidateConstruction({ beforeFen, ruleset: "standard" });
    if (result.kind === "failed") return result;
    this.#misses += 1;
    const token: CandidatePopulationEntry = Object.freeze({ kind: "candidate_service_entry" });
    const entry = Object.freeze({ beforeFen, token, construction: result.construction });
    this.#entries.set(beforeFen, entry); this.#tokens.set(token, entry);
    while (this.#entries.size > this.#capacity) this.#retire(this.#entries.values().next().value!);
    return Object.freeze({ kind: "started", entry: token });
  }

  #entry(token: CandidatePopulationEntry): Entry | undefined {
    const entry = this.#tokens.get(token);
    if (entry === undefined) throw new TypeError("Candidate service entry must be an original token of this service");
    if (entry === null) return undefined;
    if (this.#entries.get(entry.beforeFen) !== entry) { this.#retire(entry); return undefined; }
    return entry;
  }

  #retire(entry: Entry): void {
    // A held token remains recognizable without keeping its construction/graph reachable.
    this.#tokens.set(entry.token, null);
    if (this.#entries.get(entry.beforeFen) === entry) this.#entries.delete(entry.beforeFen);
  }

  read<S extends CandidateAcquisitionScope>(token: CandidatePopulationEntry, scope: S): CandidatePopulationStep<S> {
    const entry = this.#entry(token); if (entry === undefined) return Object.freeze({ kind: "retired" });
    return readCandidateConstruction(entry.construction, scope);
  }

  /** One fixed step, with no background continuation. The run-facing loop reauthorizes each step. */
  advance<S extends CandidateAcquisitionScope>(token: CandidatePopulationEntry, scope: S): CandidatePopulationStep<S> {
    const entry = this.#entry(token); if (entry === undefined) return Object.freeze({ kind: "retired" });
    const result = advanceCandidateConstruction(entry.construction, scope);
    if (result.kind === "failed" && result.error.code === "invalid_fen") this.#retire(entry);
    return result;
  }

  /** The existing synchronous API drains exactly the same retained construction. */
  wide(beforeFen: string): CandidatePopulationLookup {
    const begun = this.begin(beforeFen); if (begun.kind === "failed") return begun;
    for (;;) {
      const result = this.advance(begun.entry, "events_and_readings");
      if (result.kind === "pending") continue;
      if (result.kind === "retired") return Object.freeze({ kind: "failed", error: Object.freeze({ code: "invariant_failed", invariant: "receipt" }) });
      return result;
    }
  }

  stats(): CandidatePopulationServiceStats {
    return Object.freeze({ hits: this.#hits, misses: this.#misses, retained: this.#entries.size, capacity: this.#capacity });
  }
}
