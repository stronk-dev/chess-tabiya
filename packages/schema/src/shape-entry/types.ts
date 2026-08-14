import type { StructuralExpression } from "../drill-pack/types.js";

export type ShapePhase = "opening" | "middlegame" | "endgame";

export interface ShapePlan {
  readonly id: string;
  readonly side: "white" | "black";
  readonly label: string;
  readonly description: string;
  readonly success: {
    readonly note: string;
    readonly signature: StructuralExpression | null;
  };
}

export interface ShapeEntryDefinition {
  readonly id: string;
  readonly version: string;
  readonly name: string;
  readonly phases: readonly ShapePhase[];
  readonly trigger: StructuralExpression;
  readonly plans: readonly ShapePlan[];
  readonly watch: readonly string[];
  readonly typicalMistakes: readonly string[];
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
