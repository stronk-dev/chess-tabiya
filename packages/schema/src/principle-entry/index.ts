import { digestCanonicalJson } from "../drill-pack/digest.js";

export type PrinciplePhase = "opening" | "middlegame" | "endgame";
export type PrincipleBasis = "chess_tradition" | "authors_practice" | "instrument_pattern";

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
    readonly sources: readonly string[];
    readonly attribution: readonly {
      readonly title: string;
      readonly author: string;
      readonly url?: string;
      readonly licence: string;
    }[];
  };
}

export function digestPrincipleEntry(entry: unknown): Promise<string> {
  return digestCanonicalJson(entry);
}
