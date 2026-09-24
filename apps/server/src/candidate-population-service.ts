/**
 * The one application-lifetime shared candidate packet service (rfc/shared-candidate-evidence-packet.md
 * §4, rfc/hint-distance.md §10 and criterion 15).
 *
 * `rfc/candidate-population-service.md` is an unwritten stub "deferred until a consumer needs it";
 * Guided Hint is that consumer, so this lands the minimum it needs and nothing speculative: one bounded
 * process-local LRU of complete wide packets keyed by exact canonical before-FEN, with observable
 * hit/miss counts. The compiler is synchronous, so single flight is structural. A request-local cache
 * is refused by construction: consumers receive this instance by injection and never construct one.
 */
import {
  CANDIDATE_WIDE_SCOPE,
  compileCandidatePopulation,
  type CandidatePopulationFailure,
  type CandidatePopulationReceipt,
} from "@chess-tabiya/runtime";

export interface CandidatePopulationServiceStats {
  readonly hits: number;
  readonly misses: number;
  readonly retained: number;
  readonly capacity: number;
}

export type CandidatePopulationLookup =
  | { readonly kind: "ready"; readonly receipt: CandidatePopulationReceipt }
  | { readonly kind: "failed"; readonly error: CandidatePopulationFailure };

export class CandidatePopulationService {
  readonly #capacity: number;
  readonly #entries = new Map<string, CandidatePopulationReceipt>();
  #hits = 0;
  #misses = 0;

  constructor(options: { readonly capacity: number }) {
    if (!Number.isSafeInteger(options.capacity) || options.capacity < 1) throw new TypeError("CandidatePopulationService capacity must be a positive safe integer");
    this.#capacity = options.capacity;
  }

  /** The complete wide (events + readings) packet for one before position, shared by every consumer. */
  wide(beforeFen: string): CandidatePopulationLookup {
    const cached = this.#entries.get(beforeFen);
    if (cached !== undefined) {
      this.#hits += 1;
      this.#entries.delete(beforeFen);
      this.#entries.set(beforeFen, cached);
      return Object.freeze({ kind: "ready", receipt: cached });
    }
    this.#misses += 1;
    const result = compileCandidatePopulation({ beforeFen, ruleset: "standard", scope: CANDIDATE_WIDE_SCOPE });
    if (result.kind !== "ready") return Object.freeze({ kind: "failed", error: result.error });
    this.#entries.set(beforeFen, result.receipt);
    while (this.#entries.size > this.#capacity) this.#entries.delete(this.#entries.keys().next().value!);
    return Object.freeze({ kind: "ready", receipt: result.receipt });
  }

  stats(): CandidatePopulationServiceStats {
    return Object.freeze({ hits: this.#hits, misses: this.#misses, retained: this.#entries.size, capacity: this.#capacity });
  }
}
