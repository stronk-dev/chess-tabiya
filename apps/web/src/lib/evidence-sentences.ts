import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
import {
  RULES_EVIDENCE_FACTS,
  THEORY_EVIDENCE_FACTS,
  packEvidenceRef,
  packAbsentEvidenceRef,
  rulesEvidenceRef,
  type EvidencePayload,
  type RulesEvidenceFact,
  type TheoryEvidenceFact,
} from "@chess-tabiya/runtime";

import { evidenceKindLabel, type StagedEvidence } from "./api.js";

export interface EvidenceSentence {
  readonly reference: string;
  readonly text: string;
  readonly sourceLabel: "Rules" | "Pack" | "Engine" | "Human model" | "Recorded";
  readonly payload?: EvidencePayload;
}

const RULES_SENTENCES: Readonly<Record<RulesEvidenceFact, string>> = Object.freeze({
  checkmate: "The position is checkmate.",
  stalemate: "The position is stalemate.",
  "draw-threefold": "Draw available: threefold repetition on this path.",
  "draw-50move": "Draw available: the 50-move rule applies on this path.",
  "draw-insufficient": "Draw: neither side has sufficient mating material.",
  material: "The material balance changed on this path.",
  "result-win": "The learner won the game.",
  "result-loss": "The learner lost the game.",
  "result-draw": "The game ended in a draw.",
});

const THEORY_SENTENCES: Readonly<Record<TheoryEvidenceFact, string>> = Object.freeze({
  "off-objective-deviation": "The pack's author marked this move as off-objective.",
});

function checkpointLabel(checkpoint: DrillPackDefinition["checkpoints"][number]): string {
  const label = checkpoint.label;
  return typeof label === "string" && label.trim() !== "" ? label : checkpoint.id;
}

export function evidenceSentenceTable(
  pack: DrillPackDefinition,
): ReadonlyMap<string, EvidenceSentence> {
  const table = new Map<string, EvidenceSentence>();
  for (const fact of RULES_EVIDENCE_FACTS) {
    const reference = rulesEvidenceRef(fact);
    table.set(
      reference,
      Object.freeze({ reference, text: RULES_SENTENCES[fact], sourceLabel: "Rules" }),
    );
  }
  for (const checkpoint of pack.checkpoints) {
    const reference = packEvidenceRef(checkpoint.id);
    table.set(
      reference,
      Object.freeze({
        reference,
        text: `Checkpoint reached: ${checkpointLabel(checkpoint)}.`,
        sourceLabel: "Pack",
      }),
    );
    const absent = packAbsentEvidenceRef(checkpoint.id);
    table.set(absent, Object.freeze({
      reference: absent,
      text: `Checkpoint not reached on this branch: ${checkpointLabel(checkpoint)}.`,
      sourceLabel: "Pack",
    }));
  }
  for (const fact of THEORY_EVIDENCE_FACTS) {
    const reference = `theory:${fact}`;
    table.set(reference, Object.freeze({
      reference,
      text: THEORY_SENTENCES[fact],
      sourceLabel: "Pack",
    }));
  }
  return table;
}

export function evidencePayloadTable(
  results: readonly StagedEvidence[],
): ReadonlyMap<string, EvidencePayload> {
  const table = new Map<string, EvidencePayload>();
  for (const result of results) {
    for (const reference of result.evidenceRefs) {
      if (table.has(reference)) {
        throw new TypeError(`Evidence reference has more than one payload: ${reference}`);
      }
      table.set(reference, result.payload);
    }
  }
  return table;
}

export function renderEvidenceRef(
  reference: string,
  pack: DrillPackDefinition,
  payloads: ReadonlyMap<string, EvidencePayload> = new Map(),
): EvidenceSentence {
  const authored = evidenceSentenceTable(pack).get(reference);
  if (authored !== undefined) return authored;

  if (reference.startsWith("engine:")) {
    const payload = payloads.get(reference);
    if (payload === undefined) {
      return Object.freeze({
        reference,
        text: "Engine evidence recorded; details are pending.",
        sourceLabel: "Engine",
      });
    }
    return Object.freeze({
      reference,
      text: `${evidenceKindLabel(payload.kind)} evidence recorded.`,
      sourceLabel:
        payload.source === "engine_validated" ? "Engine" : "Human model",
      payload,
    });
  }

  return Object.freeze({
    reference,
    text: "Evidence recorded.",
    sourceLabel: "Recorded",
  });
}
