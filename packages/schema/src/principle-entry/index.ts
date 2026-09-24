import { digestCanonicalJson } from "../drill-pack/digest.js";

export type PrinciplePhase = "opening" | "middlegame" | "endgame";
/**
 * `cited_source` (principle-entry lane 0.2, rfc/theory-knowledge-pipeline.md §10) is admitted
 * biconditionally: it is the basis exactly when at least one structured citation is present.
 */
export type PrincipleBasis = "chess_tradition" | "authors_practice" | "instrument_pattern" | "cited_source";

/**
 * A revision-pinned citation of one accepted theory-source register row. The attribution
 * (publisher, authors, licence, notice) is never copied here: it is derived from the joined
 * register row so a principle cannot validate with a mismatched attribution ([[D1898]]).
 */
export interface PrincipleCitation {
  readonly sourceId: string;
  readonly revisionUrl: string;
  readonly sha256: string;
  readonly sectionRef: string;
  readonly quotedText: string;
}

export type PrincipleSource = string | PrincipleCitation;

export interface PrincipleEntryDefinition {
  readonly id: string;
  readonly version: string;
  readonly name: string;
  readonly statement: string;
  readonly phases: readonly PrinciplePhase[];
  readonly standsOn: PrincipleBasis;
  readonly counterCase: string;
  readonly provenance: {
    readonly licence: string;
    readonly sources: readonly PrincipleSource[];
    readonly attribution: readonly {
      readonly title: string;
      readonly author: string;
      readonly url?: string;
      readonly licence: string;
    }[];
  };
}

export function isPrincipleCitation(source: PrincipleSource): source is PrincipleCitation {
  return typeof source === "object" && source !== null;
}

export function digestPrincipleEntry(entry: unknown): Promise<string> {
  return digestCanonicalJson(entry);
}
