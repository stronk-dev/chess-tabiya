// rfc/evidence-presentation.md criteria 3 (registry total by type) and the §6b registry contract.
import {
  EXPLORER_SPEEDS,
  LABEL_VOCABULARIES,
  LIVE_SESSION_KINDS,
  MARK_BRUSHES,
  MODULE_IDS,
  MODULE_LABELS,
  OBJECTIVE_STATE_LABELS as RUNTIME_OBJECTIVE_STATE_LABELS,
  PIVOTAL_MARKER_ROUTES,
  RUN_OPPONENT_MODES,
  assertPresentationText,
  type LabelVocabulary,
  type ObjectiveState,
} from "@chess-tabiya/runtime";
import { OBJECTIVE_TYPES, PACK_PHASES, STRUCTURAL_FEATURE_KINDS } from "@chess-tabiya/schema/drill-pack";
import { describe, expect, it } from "vitest";

import { evidenceKindLabel } from "../api.js";
import {
  LABEL_REGISTRY,
  LIVE_SESSION_CREATE_ACTIONS,
  OBJECTIVE_STATE_LABELS,
  UNRECORDED_LABEL,
  isVocabularyMember,
  labelFor,
  labelOrFallback,
  learnerProse,
  type LabelVocabularyId,
} from "./index.js";

const keys = (vocabulary: LabelVocabulary<string>): readonly string[] => Object.keys(vocabulary).sort();

/** Vocabularies whose union the code also ships as a runtime member list: set-equality is checkable. */
const RUNTIME_MEMBER_LISTS: Partial<Record<LabelVocabularyId, readonly string[]>> = {
  opponent_mode: RUN_OPPONENT_MODES,
  mark_brush: MARK_BRUSHES,
  live_session_kind: LIVE_SESSION_KINDS,
  module_id: MODULE_IDS,
  explorer_speed: EXPLORER_SPEEDS,
  pivotal_marker_kind: Object.keys(PIVOTAL_MARKER_ROUTES),
  pack_phase: PACK_PHASES,
  objective_type: OBJECTIVE_TYPES,
  structural_feature_kind: STRUCTURAL_FEATURE_KINDS,
  evidence_kind: ["eval", "wdl", "bestline", "tablebase"],
};

describe("label registry (rfc/evidence-presentation.md §6b)", () => {
  const entries = Object.entries(LABEL_REGISTRY) as [LabelVocabularyId, LabelVocabulary<string>][];

  it("is a frozen index of frozen, non-empty vocabularies", () => {
    expect(Object.isFrozen(LABEL_REGISTRY)).toBe(true);
    expect(entries.length).toBeGreaterThanOrEqual(40);
    for (const [id, vocabulary] of entries) {
      expect(Object.isFrozen(vocabulary), id).toBe(true);
      expect(keys(vocabulary).length, id).toBeGreaterThan(0);
    }
  });

  it("is total over every union the code ships as a member list", () => {
    for (const [id, members] of Object.entries(RUNTIME_MEMBER_LISTS)) {
      expect(keys(LABEL_REGISTRY[id as LabelVocabularyId]), id).toEqual([...members!].sort());
    }
  });

  it("registers every vocabulary the runtime enum_state component admits, with the runtime's own table", () => {
    for (const [id, vocabulary] of Object.entries(LABEL_VOCABULARIES)) {
      expect(LABEL_REGISTRY[id as LabelVocabularyId], id).toBe(vocabulary);
    }
    expect(OBJECTIVE_STATE_LABELS).toBe(RUNTIME_OBJECTIVE_STATE_LABELS);
    for (const id of MODULE_IDS) expect(LABEL_REGISTRY.module_id[id]!.label).toBe(MODULE_LABELS[id]);
  });

  it("carries plain learner text: no empty label, no raw id, no underscore, no producer vocabulary", () => {
    for (const [id, vocabulary] of entries) {
      for (const [member, entry] of Object.entries(vocabulary)) {
        const where = `${id}.${member}`;
        expect(entry.label.trim(), where).not.toBe("");
        expect(() => assertPresentationText(entry.label), where).not.toThrow();
        expect(entry.label, where).not.toMatch(/_|@\d|Tabiya's|detector/u);
        if (entry.gloss !== undefined) expect(() => assertPresentationText(entry.gloss!), where).not.toThrow();
      }
    }
    for (const action of Object.values(LIVE_SESSION_CREATE_ACTIONS)) expect(() => assertPresentationText(action)).not.toThrow();
  });

  it("declares valence only on rules or outcome vocabularies, never on one describing a move (§3.9, law 8)", () => {
    const valenced = entries.filter(([, vocabulary]) => Object.values(vocabulary).some((entry) => entry.valence !== undefined)).map(([id]) => id).sort();
    expect(valenced).toEqual(["objective_state", "run_outcome"]);
  });

  it("labels every evidence kind, not one of four (rule 6c)", () => {
    expect(evidenceKindLabel("wdl")).toBe("win, draw and loss chances");
    expect(evidenceKindLabel("eval")).not.toBe("eval");
    expect(evidenceKindLabel("tablebase")).not.toBe("tablebase");
    expect(evidenceKindLabel("bestline")).toBe("best line");
  });

  it("looks up typed members and never returns a raw wire value", () => {
    expect(labelFor("objective_state", "degraded")).toBe(OBJECTIVE_STATE_LABELS.degraded.label);
    expect(labelOrFallback("pack_review_status", "schema_example")).toBe("example content");
    expect(labelOrFallback("pack_review_status", "under_review")).toBe(UNRECORDED_LABEL);
    expect(labelOrFallback("objective_state", undefined, "unknown")).toBe("unknown");
    expect(isVocabularyMember("deviation_class", "tactical_error")).toBe(true);
    expect(isVocabularyMember("deviation_class", "toString")).toBe(false);
    expect(learnerProse("There is not enough room.")).toBe("There is not enough room.");
    expect(learnerProse("The catalogue is unavailable (missing_catalogue).")).not.toContain("missing_catalogue");
  });

  it("makes a union member without a label a type error, not a test failure", () => {
    type Grown = ObjectiveState | "abandoned";
    // @ts-expect-error — `abandoned` has no label: a registry typed by its own union cannot be partial.
    const grown: LabelVocabulary<Grown> = OBJECTIVE_STATE_LABELS;
    // @ts-expect-error — dropping a member from a vocabulary literal is equally a compile error.
    const shrunk: LabelVocabulary<"white" | "black"> = { white: { label: "White" } };
    expect([grown, shrunk]).toHaveLength(2);
  });
});
