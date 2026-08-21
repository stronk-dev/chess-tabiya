import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
import {
  PRIMARY_EVIDENCE_MANIFEST,
  RULES_EVIDENCE_FACTS,
  THEORY_EVIDENCE_FACTS,
  assertConsumerEvidenceView,
  declareEvidenceReferenceResolution,
  declareLivePacketEvidence,
  evidenceForConsumer,
  packEvidenceRef,
  packAbsentEvidenceRef,
  rulesEvidenceRef,
  tempoEvidenceRef,
  type EvidencePayload,
  type ConsumerEvidenceView,
  type DeclaredEvidence,
  type RulesEvidenceFact,
  type TheoryEvidenceFact,
} from "@chess-tabiya/runtime";

import { evidenceKindLabel, type StagedEvidence } from "./api.js";

export interface EvidenceSentence {
  readonly reference: string;
  readonly text: string;
  readonly sourceLabel: "Rules" | "Pack" | "Engine" | "Human model" | "Tablebase" | "Recorded";
  readonly payload?: EvidencePayload;
}

const RULES_SENTENCES: Readonly<Record<RulesEvidenceFact, string>> = Object.freeze({
  checkmate: "The position is checkmate.",
  stalemate: "The position is stalemate.",
  draw: "A draw is available under the rules at this position.",
  "draw-threefold": "Draw available: threefold repetition on this path.",
  "draw-50move": "Draw available: the 50-move rule applies on this path.",
  "draw-insufficient": "Draw: neither side has sufficient mating material.",
  material: "The material balance changed on this path.",
  "result-win": "The learner won the game.",
  "result-loss": "The learner lost the game.",
  "result-draw": "The game ended in a draw.",
  "structure-pawn-safe-square": "Tabiya's current-pawn-file safety condition holds at this position.",
  "structure-outpost": "Tabiya's strict outpost detector condition holds at this position.",
  "structure-backward-pawn": "Tabiya's backward-pawn condition holds at this position.",
  "structure-isolated-pawn": "Tabiya's isolated-pawn condition holds at this position.",
  "structure-doubled-pawn": "Tabiya's doubled-pawn condition holds at this position.",
  "structure-passed-pawn": "Tabiya's passed-pawn condition holds at this position.",
  "structure-open-file": "The authored open-file condition holds at this position.",
  "structure-half-open-file": "The authored half-open-file condition holds at this position.",
  "structure-line-blockers": "The authored exact blocker-count condition holds at this position.",
  "structure-direct-attack-count": "The authored per-colour direct-attack count holds at this position; opposing counts are not combined.",
  "structure-piece-reach-count": "The authored attack-reach count holds at this position; legal mobility is not evaluated.",
  "structure-named-structure": "A Tabiya catalogue structure condition holds at this position.",
  "structure-bishop-on-shade": "The authored bishop-square-shade condition holds at this position.",
  "structure-pawn-count": "The authored pawn-count condition holds at this position.",
  "structure-king-opposition": "The authored king-opposition geometry and mover condition holds at this position.",
  "structure-piece-count": "The authored piece-count condition holds at this position.",
  "structure-king-zone": "The authored king-zone condition holds at this position.",
  "structure-piece-distance": "The authored piece-distance condition holds at this position.",
  "transition-attacked-squares-changed": "Tabiya's attacked-piece-square condition holds at this transition.",
  "transition-defended-squares-changed": "Tabiya's defended-piece-square condition holds at this transition.",
  "transition-slider-lines-changed": "Tabiya's slider-line blocker condition holds at this transition.",
  "transition-escape-squares-changed": "Tabiya's geometric destination-square condition holds at this transition.",
  "transition-defended-duties-changed": "Tabiya's defended-duty count condition holds at this transition.",
  "transition-move-irreversibility": "Tabiya's rules-derived irreversibility condition holds at this transition.",
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
  for (const window of pack.timingWindows ?? []) {
    const label = window.label ?? window.id;
    const sentences = {
      in_time: `Timing window "${label}": the plan was complete before the window closed, within the declared budget of ${window.luxuryMoveBudget} luxury ${window.luxuryMoveBudget === 1 ? "move" : "moves"}.`,
      over_budget: `Timing window "${label}": the plan was complete, but the declared luxury-move budget was exceeded.`,
      too_slow: `Timing window "${label}": the window closed before the authored readiness set was complete.`,
      premature: `Timing window "${label}": the authored release move arrived before the readiness set was complete.`,
      outpaced: `Timing window "${label}": the window closed before enough learner moves were available for the authored readiness set.`,
    } as const;
    for (const [verdict, text] of Object.entries(sentences)) {
      const reference = tempoEvidenceRef(window.id, verdict);
      table.set(reference, Object.freeze({ reference, text, sourceLabel: "Pack" }));
    }
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

function resolveEvidenceSentence(
  reference: string,
  pack?: DrillPackDefinition,
  payloads: ReadonlyMap<string, EvidencePayload> = new Map(),
): EvidenceSentence {
  const authored = pack === undefined ? undefined : evidenceSentenceTable(pack).get(reference);
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

  if (reference.startsWith("tablebase:")) {
    const payload = payloads.get(reference);
    if (payload === undefined) {
      return Object.freeze({
        reference,
        text: "Tablebase evidence recorded; details are pending.",
        sourceLabel: "Tablebase",
      });
    }
    const category = typeof payload.values.category === "string" ? payload.values.category : undefined;
    const pieceCount = Number.isSafeInteger(payload.values.pieceCount) ? payload.values.pieceCount as number : undefined;
    const dtz = typeof payload.values.preciseDtz === "number"
      ? payload.values.preciseDtz
      : typeof payload.values.dtz === "number" ? payload.values.dtz : undefined;
    const sourceId = typeof payload.values.sourceId === "string" ? payload.values.sourceId : undefined;
    const details = [
      category === undefined ? undefined : `category ${category} for the side to move`,
      pieceCount === undefined ? undefined : `${pieceCount} pieces`,
      dtz === undefined ? undefined : `DTZ ${dtz}`,
      sourceId === undefined ? undefined : `source ${sourceId}`,
    ].filter((value): value is string => value !== undefined);
    return Object.freeze({
      reference,
      text: details.length === 0
        ? "Exact tablebase evidence recorded."
        : `Exact tablebase evidence recorded: ${details.join("; ")}.`,
      sourceLabel: "Tablebase",
      payload,
    });
  }

  if (reference.startsWith("tempo:")) {
    return Object.freeze({
      reference,
      text: "A declared timing-window result was recorded.",
      sourceLabel: "Pack",
    });
  }

  return Object.freeze({
    reference,
    text: "Evidence recorded.",
    sourceLabel: "Recorded",
  });
}

export interface EvidenceReferenceResolution {
  readonly reference: string;
  readonly text: string;
  readonly sourceLabel: EvidenceSentence["sourceLabel"];
}

type EvidenceReferencePayload = EvidenceReferenceResolution | EvidencePayload;

function declaredSource(payload: EvidencePayload): DeclaredEvidence<EvidencePayload> {
  return declareLivePacketEvidence(payload);
}

export function renderDeclaredEvidenceRef(
  view: ConsumerEvidenceView<EvidenceReferencePayload>,
): EvidenceSentence {
  assertConsumerEvidenceView(view);
  if (view.consumer.id !== "runtime.evidence_ref" || view.consumer.version !== 1) {
    throw new TypeError("Expected runtime.evidence_ref@1 consumer view");
  }
  const resolution = view.items.find((item) => item.projection.id === "run.record.evidence_ref_resolution")?.payload;
  if (resolution === undefined || !("reference" in resolution)) {
    throw new TypeError("Evidence-reference consumer requires a declared resolution");
  }
  const source = view.items.find((item) => item.projection.id !== "run.record.evidence_ref_resolution")?.payload;
  return Object.freeze({
    reference: resolution.reference,
    text: resolution.text,
    sourceLabel: resolution.sourceLabel,
    ...(source === undefined || !("kind" in source) ? {} : { payload: source }),
  });
}

export function renderEvidenceRef(
  reference: string,
  pack?: DrillPackDefinition,
  payloads: ReadonlyMap<string, EvidencePayload> = new Map(),
): EvidenceSentence {
  const resolved = resolveEvidenceSentence(reference, pack, payloads);
  const resolution = declareEvidenceReferenceResolution<EvidenceReferencePayload>(Object.freeze({ reference: resolved.reference, text: resolved.text, sourceLabel: resolved.sourceLabel }));
  const declared: DeclaredEvidence<EvidenceReferencePayload>[] = [resolution];
  if (resolved.payload !== undefined) declared.push(declaredSource(resolved.payload));
  return renderDeclaredEvidenceRef(evidenceForConsumer(
    PRIMARY_EVIDENCE_MANIFEST,
    { id: "runtime.evidence_ref", version: 1 },
    declared,
  ));
}
