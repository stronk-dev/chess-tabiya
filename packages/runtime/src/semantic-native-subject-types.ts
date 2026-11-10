// Closed native subject schemas; no collector/source-owner import at runtime.
import type { Color, FileName, SquareName } from "chessops/types";
import type { SliderIdentity } from "./foundation-slider-sources.js";
import type { SubjectDirection } from "./semantic-subject-types.js";

export interface NativeSubjectBySource {
  "rules.structural.event.king_opposition@2": { readonly kind: "king_opposition"; readonly whiteRootSquare: SquareName; readonly blackRootSquare: SquareName };
  "rules.structural.event.backward_pawn@2": { readonly kind: "backward_pawn"; readonly color: Color; readonly rootSquare: SquareName };
  "derived.structural.event.pawn_file_group@1": { readonly kind: "pawn_file_group"; readonly color: Color; readonly file: FileName };
  "rules.transition.event.slider_ray@2": { readonly kind: "physical_slider"; readonly root: SliderIdentity; readonly direction: SubjectDirection };
  "derived.activity.event.file_state@1": { readonly kind: "file_state"; readonly file: FileName };
  "derived.activity.event.file_access_revealed@1": { readonly kind: "file_access"; readonly piece: { readonly color: Color; readonly role: "rook" | "queen"; readonly square: SquareName }; readonly file: FileName };
  "rules.structural.event.pawn_islands@2": { readonly kind: "pawn_islands"; readonly color: Color };
}
export const NATIVE_SUBJECT_SOURCE_REFS = Object.freeze([
  "rules.structural.event.king_opposition@2", "rules.structural.event.backward_pawn@2",
  "derived.structural.event.pawn_file_group@1", "rules.transition.event.slider_ray@2",
  "derived.activity.event.file_state@1", "derived.activity.event.file_access_revealed@1",
  "rules.structural.event.pawn_islands@2",
] as const satisfies readonly (keyof NativeSubjectBySource)[]);
export type NativeSubjectSourceRef = keyof NativeSubjectBySource;
export type NativeEventSubject = { [R in NativeSubjectSourceRef]: Readonly<{
  source: R; subject: NativeSubjectBySource[R]; parameters: Readonly<Record<string, never>>;
  /** Finite source-domain ordering/dedup within ONE original root, never persisted as an ID. */
  ordinal: number;
}> }[NativeSubjectSourceRef];
