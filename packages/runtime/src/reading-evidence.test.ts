import { describe, expect, it } from "vitest";

import { evidenceForConsumer } from "./evidence-contract.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import {
  consumeMoveTransition,
  consumePositionStructure,
  consumeSelectedSquareSight,
  declareStructuralReadingEvidence,
  declareTransitionReadingEvidence,
} from "./reading-evidence.js";
import { structuralReading } from "./structure.js";
import { transitionReading } from "./transition.js";

const initial = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const afterE4 = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";

describe("reading consumer boundaries", () => {
  it("admits structural readings independently for inspector and board sight", () => {
    const declared = declareStructuralReadingEvidence(structuralReading(initial));
    const inspector = evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "inspector.position_structure", version: 1 }, declared);
    const sight = evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "board.selected_square_sight", version: 1 }, declared);
    expect(consumePositionStructure(inspector)).toHaveLength(declared.length);
    expect(consumeSelectedSquareSight(sight)).toHaveLength(declared.length);
    if (false) {
      // @ts-expect-error Inspector rejects a bare structural observation list.
      consumePositionStructure(structuralReading(initial).features);
      // @ts-expect-error Board sight rejects a bare structural observation list.
      consumeSelectedSquareSight(structuralReading(initial).features);
    }
  });

  it("admits the played-edge transition reading at its inspector boundary", () => {
    const reading = transitionReading(initial, "e2e4", afterE4)!;
    const declared = declareTransitionReadingEvidence(reading);
    const view = evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "inspector.move_transition", version: 1 }, declared);
    expect(consumeMoveTransition(view)).toHaveLength(declared.length);
    if (false) {
      // @ts-expect-error Transition inspector rejects bare observations.
      consumeMoveTransition(reading.observations);
    }
  });
});
