// @vitest-environment happy-dom
// rfc/evidence-presentation.md §8.3 / criteria 6, 7, 8, 11, 12, 15, 16, 17: the fourteen client
// components over zero / one / many / withheld / provider-unavailable operands. Every fixture goes
// through the runtime's strict component parser; every rendered text is the equivalent sentence.
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  COMPONENT_IDS,
  PRESENTATION_ADAPTERS,
  componentValueSentence,
  factStatementOperand,
  parseComponentValue,
  presentationDigest,
  type ComponentId,
  type ComponentValue,
  type ConventionReceipt,
} from "@chess-tabiya/runtime";
import { mount, unmount, type Component } from "svelte";
import { describe, expect, it } from "vitest";

import AbstentionView from "./components/AbstentionView.svelte";
import CitationView from "./components/CitationView.svelte";
import CountView from "./components/CountView.svelte";
import DistributionView from "./components/DistributionView.svelte";
import EnumStateView from "./components/EnumStateView.svelte";
import MagnitudeTrailView from "./components/MagnitudeTrailView.svelte";
import MagnitudeView from "./components/MagnitudeView.svelte";
import MovePathView from "./components/MovePathView.svelte";
import OutcomeSplitView from "./components/OutcomeSplitView.svelte";
import RelationOverlayView from "./components/RelationOverlayView.svelte";
import SquareSetView from "./components/SquareSetView.svelte";
import StructuredDocumentView from "./components/StructuredDocumentView.svelte";
import TextStatementView from "./components/TextStatementView.svelte";
import { trailGeometry } from "./presented-view.js";

const D = (seed: string): string => `sha256:${seed.repeat(64).slice(0, 64)}`;
const population = { source: "lichess-explorer" as const, ratings: [1600, 1800], speeds: ["blitz", "rapid"], since: "2023-01", until: "2026-09" };
const corpus = (sampleSize: number): ConventionReceipt => ({ producer: { id: "human.explorer", version: 1 }, sourceProjection: { id: "human.explorer.population", version: 1 }, sourceEvidenceDigest: D("a"), perspective: "white", basis: { kind: "human_population", population, sampleSize } });
const recorded: ConventionReceipt = { producer: { id: "derived.compare_narrative", version: 1 }, sourceProjection: { id: "derived.compare.eval_delta", version: 1 }, sourceEvidenceDigest: D("b"), perspective: "white", basis: { kind: "recorded_search", engine: { name: "Stockfish", version: "17" }, depth: 18 } };
const caption = factStatementOperand("play.structural_observation@1", "declared_convention", "board-rules@1", { kind: "open_file", squares: ["d1", "d8"], file: "d" } as never);
const settled = (reason: "provider_unavailable" | "floor_not_met" | "no_observation", absence: "unavailable" | "withheld" | "empty") => ({ kind: "settled_abstention", question: "review.human_corpus", projection: { id: "human.explorer.population", version: 1 }, producer: { id: "human.explorer", version: 1 }, requestId: "request-1", decision: { eventHeadSeq: 3, cursor: { branchId: "main", nodeId: "n3" }, disclosureBoundarySeq: null, digest: D("c") }, absence, reason, sourceReceipt: { producer: { id: "human.explorer", version: 1 }, projection: { id: "human.explorer.population", version: 1 }, receiptDigest: D("d") } });
const document = (fields: Record<string, unknown>) => { const canonicalBytes = JSON.stringify(Object.fromEntries(Object.entries(fields).sort(([a], [b]) => a.localeCompare(b)))); return { schemaId: "runtime.source_record@1", document: fields, canonicalBytes, digest: presentationDigest("presentation.structured_document@1", { schemaId: "runtime.source_record@1", canonicalBytes }) }; };

type State = "zero" | "one" | "many" | "withheld" | "unavailable";
type Fixture = Readonly<Record<string, unknown>> | "not_applicable";
/** The explicit state matrix: every component × every state, `not_applicable` stated, never skipped. */
const MATRIX: Readonly<Record<ComponentId, Readonly<Record<State, Fixture>>>> = {
  distribution: {
    zero: { rows: [{ move: { san: "e4", uci: "e2e4" }, share: 0, count: 0 }], residual: { share: 1, label: "other_moves" }, convention: corpus(40), highlight: null },
    one: { rows: [{ move: { san: "e4", uci: "e2e4" }, share: 1, count: 40 }], residual: null, convention: corpus(40), highlight: { uci: "e2e4", why: "learner_committed" } },
    many: { rows: [{ move: { san: "e4", uci: "e2e4" }, share: 0.5, count: 20 }, { move: { san: "d4", uci: "d2d4" }, share: 0.3, count: 12 }], residual: { share: 0.2, label: "other_moves" }, convention: corpus(40), highlight: null },
    withheld: { rows: [{ move: { san: "e4", uci: "e2e4" }, share: 0.5, count: 20, withheld: "below_outcome_floor" }], residual: null, convention: corpus(40), highlight: null },
    unavailable: "not_applicable",
  },
  outcome_split: {
    zero: { white: 0, draws: 0, black: 0, total: 0, perspective: "white", convention: corpus(0), floor: { threshold: 100, met: false } },
    one: { white: 1, draws: 0, black: 0, total: 1, perspective: "white", convention: corpus(1), floor: { threshold: 1, met: true } },
    many: { white: 60, draws: 25, black: 15, total: 100, perspective: "white", convention: corpus(100), floor: { threshold: 100, met: true } },
    withheld: { white: 20, draws: 10, black: 7, total: 37, perspective: "white", convention: corpus(37), floor: { threshold: 100, met: false } },
    unavailable: "not_applicable",
  },
  magnitude: {
    zero: { value: 0, unit: { kind: "centipawn" }, convention: recorded, saturated: false },
    one: { value: 45, unit: { kind: "centipawn" }, convention: recorded, saturated: false },
    many: "not_applicable",
    withheld: "not_applicable",
    unavailable: "not_applicable",
  },
  magnitude_trail: {
    zero: "not_applicable",
    one: "not_applicable",
    many: { points: [{ plyOffset: 1, magnitude: { value: 30, unit: { kind: "centipawn" }, convention: recorded, saturated: false } }, { plyOffset: 3, magnitude: { value: -210, unit: { kind: "centipawn" }, convention: recorded, saturated: false } }], convention: recorded, scalePolicy: "centipawn-clamp-800@1" },
    withheld: "not_applicable",
    unavailable: "not_applicable",
  },
  square_set: {
    zero: "not_applicable",
    one: { squares: ["d1"], brush: "blue", owner: { factRef: D("e") }, ordered: false, caption },
    many: { squares: ["d1", "d8"], brush: "blue", owner: { factRef: D("e") }, ordered: false, caption },
    withheld: "not_applicable",
    unavailable: "not_applicable",
  },
  move_path: {
    zero: "not_applicable",
    one: { plies: [{ ply: 1, san: "e4", uci: "e2e4" }], answerDistance: "fact", origin: "learner_played" },
    many: { plies: [{ ply: 1, san: "e4", uci: "e2e4" }, { ply: 2, san: "e5", uci: "e7e5" }], answerDistance: "fact", origin: "learner_played" },
    withheld: "not_applicable",
    unavailable: "not_applicable",
  },
  relation_overlay: {
    zero: "not_applicable",
    one: { nodes: [{ square: "f3", role: "knight", color: "white", emphasis: "source" }, { square: "e5", role: "pawn", color: "black", emphasis: "target" }], edges: [{ from: "f3", to: "e5", relation: "attacks", sign: "state" }], owner: { factRef: D("f") }, answerDistance: "fact" },
    many: { nodes: [{ square: "b4", role: "bishop", color: "black", emphasis: "source" }, { square: "c3", role: "knight", color: "white", emphasis: "target" }, { square: "d2", role: "queen", color: "white", emphasis: "context" }], edges: [{ from: "b4", to: "c3", relation: "pins", sign: "gained" }, { from: "c3", to: "d2", relation: "screens", sign: "state" }], owner: { factRef: D("f") }, answerDistance: "pattern" },
    withheld: "not_applicable",
    unavailable: "not_applicable",
  },
  count_with_denominator: {
    zero: { numerator: 0, denominator: 25, denominatorMeaning: "legal_moves" },
    one: { numerator: 2, denominator: 25, denominatorMeaning: "legal_moves" },
    many: { numerator: 20, denominator: 25, denominatorMeaning: "legal_moves" },
    withheld: { numerator: 3, denominator: 37, denominatorMeaning: "games_in_population", floor: { threshold: 100, met: false } },
    unavailable: "not_applicable",
  },
  citation: {
    zero: "not_applicable",
    one: { content: { kind: "quoted_passage", text: "Exact tablebase result: a win.", binding: { projection: { id: "run.record.evidence_ref_resolution", version: 1 }, field: "text", evidenceDigest: D("1"), valueDigest: presentationDigest("presentation.citation.value@1", "Exact tablebase result: a win.") } }, source: { source: { id: "live.syzygy.result", version: 1 }, title: "Syzygy tablebase result", locator: "the Lichess tablebase endpoint", licence: "computed chess facts", revision: "endpoint contract 1" } },
    many: "not_applicable",
    withheld: "not_applicable",
    unavailable: "not_applicable",
  },
  enum_state: { zero: "not_applicable", one: { vocabulary: "objective_state", value: "preserved" }, many: "not_applicable", withheld: "not_applicable", unavailable: "not_applicable" },
  claim: { zero: "not_applicable", one: { text: "Keep the knight on d5.", binding: "self_declared", evidenceTypes: ["author_principle"], earnedEvidenceTypes: [], principles: [] }, many: "not_applicable", withheld: "not_applicable", unavailable: "not_applicable" },
  fact_statement: { zero: "not_applicable", one: caption as unknown as Fixture, many: "not_applicable", withheld: "not_applicable", unavailable: "not_applicable" },
  abstention: {
    zero: settled("no_observation", "empty"),
    one: "not_applicable",
    many: "not_applicable",
    withheld: settled("floor_not_met", "withheld"),
    unavailable: settled("provider_unavailable", "unavailable"),
  },
  structured_document: { zero: "not_applicable", one: document({ producer: "live.syzygy", projection: "live.syzygy.result", payload: { category: "win" } }), many: "not_applicable", withheld: "not_applicable", unavailable: "not_applicable" },
};

const VIEWS: Readonly<Record<ComponentId, Component<{ component: never; sentence: string }>>> = {
  distribution: DistributionView as never, outcome_split: OutcomeSplitView as never, magnitude: MagnitudeView as never, magnitude_trail: MagnitudeTrailView as never,
  square_set: SquareSetView as never, move_path: MovePathView as never, relation_overlay: RelationOverlayView as never, count_with_denominator: CountView as never,
  citation: CitationView as never, enum_state: EnumStateView as never, claim: TextStatementView as never, fact_statement: TextStatementView as never,
  abstention: AbstentionView as never, structured_document: StructuredDocumentView as never,
};

function render(id: ComponentId, operand: Fixture): { readonly root: HTMLElement; readonly sentence: string; readonly done: () => void } {
  const component = parseComponentValue({ id, operand }) as ComponentValue;
  const sentence = componentValueSentence(component);
  const target = globalThis.document.createElement("div");
  globalThis.document.body.append(target);
  const instance = mount(VIEWS[id], { target, props: { component: component as never, sentence } });
  return { root: target, sentence, done: () => { void unmount(instance); target.remove(); } };
}

describe("criterion 17: every component has an explicit zero / one / many / withheld / unavailable declaration", () => {
  it("the matrix is set-equal to COMPONENT_DECLARATIONS and every applicable cell renders its own sentence", () => {
    expect(Object.keys(MATRIX).sort()).toEqual([...COMPONENT_IDS].sort());
    for (const id of COMPONENT_IDS) {
      const states = MATRIX[id];
      expect(Object.keys(states).sort()).toEqual(["many", "one", "unavailable", "withheld", "zero"]);
      expect(Object.values(states).some((fixture) => fixture !== "not_applicable"), id).toBe(true);
      for (const [state, fixture] of Object.entries(states)) {
        if (fixture === "not_applicable") continue;
        const { root, sentence, done } = render(id, fixture);
        expect(root.textContent?.replace(/\s+/gu, " ") ?? "", `${id} ${state}`).not.toMatch(/[a-z]+_[a-z]+|@\d/u);
        expect(root.innerHTML.length, `${id} ${state}`).toBeGreaterThan(0);
        expect(sentence.length).toBeGreaterThan(0);
        done();
      }
    }
  });
});

describe("criterion 6: a real zero, a withheld value and an absent producer render differently at the DOM", () => {
  it("distribution and outcome split: zero has a value node and no data-abstention; withheld draws no bar", () => {
    const zero = render("outcome_split", MATRIX.outcome_split.many);
    expect(zero.root.querySelector("[data-abstention]")).toBeNull();
    expect(zero.root.querySelectorAll(".segment")).toHaveLength(3);
    zero.done();
    const withheld = render("outcome_split", MATRIX.outcome_split.withheld);
    expect(withheld.root.querySelector("[data-abstention='floor_not_met']")).not.toBeNull();
    expect(withheld.root.querySelector(".bar, .segment")).toBeNull();
    withheld.done();
    const zeroRow = render("distribution", MATRIX.distribution.zero);
    expect(zeroRow.root.querySelector("[data-abstention]")).toBeNull();
    expect(zeroRow.root.querySelector(".share")?.textContent).toBe("0%");
    zeroRow.done();
    const floor = render("abstention", MATRIX.abstention.withheld);
    expect(floor.root.querySelector("[data-abstention='floor_not_met']")).not.toBeNull();
    floor.done();
    const absent = render("abstention", MATRIX.abstention.unavailable);
    expect(absent.root.querySelector("[data-abstention='provider_unavailable']")?.textContent).toMatch(/Human game corpus/u);
    absent.done();
  });
});

describe("criterion 7: a convention-requiring component cannot exist without its convention, which renders inside the root", () => {
  it("refuses a distribution with no convention and draws the attribution inside the figure", () => {
    const { convention: _omitted, ...naked } = MATRIX.distribution.many as Record<string, unknown>;
    expect(() => parseComponentValue({ id: "distribution", operand: naked })).toThrow(/omits convention/u);
    const { root, done } = render("distribution", MATRIX.distribution.many);
    expect(root.querySelector("figure[data-component='distribution'] figcaption")?.textContent).toMatch(/40 games from Lichess opening-explorer games/u);
    done();
  });
});

describe("criterion 8: no component renders a percentage it did not compute from a numerator and a denominator", () => {
  it("renders both terms of a count and declares no pre-computed percentage operand", () => {
    const { root, done } = render("count_with_denominator", MATRIX.count_with_denominator.one);
    expect(root.textContent).toContain("2 of 25 legal moves");
    done();
    const source = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../../../../../packages/runtime/src/presentation-contract.ts"), "utf8");
    expect(source).not.toMatch(/readonly \w*(?:Pct|Percent)\s*[:?]/u);
    const zeroDenominator = parseComponentValue({ id: "count_with_denominator", operand: { numerator: 0, denominator: 0, denominatorMeaning: "legal_moves" } });
    expect(componentValueSentence(zeroDenominator)).toMatch(/nothing to count against/u);
  });
});

describe("criterion 15: magnitude_trail is a real plot whose geometry comes only from the registered policy", () => {
  it("renders an svg with distinct coordinates for distinct values and a keyboard-reachable point list", () => {
    const { root, done } = render("magnitude_trail", MATRIX.magnitude_trail.many);
    const circles = [...root.querySelectorAll("svg circle")];
    expect(circles).toHaveLength(2);
    expect(circles[0]!.getAttribute("cy")).not.toBe(circles[1]!.getAttribute("cy"));
    expect(root.querySelectorAll("ol.points li[tabindex='0']")).toHaveLength(2);
    expect(root.querySelector("svg")?.getAttribute("data-extent")).toMatch(/±8 pawns/u);
    expect(root.querySelector("[title]")).toBeNull();
    done();
    const component = parseComponentValue({ id: "magnitude_trail", operand: MATRIX.magnitude_trail.many }) as Extract<ComponentValue, { id: "magnitude_trail" }>;
    expect(JSON.stringify(trailGeometry(component))).toBe(JSON.stringify(trailGeometry(parseComponentValue({ id: "magnitude_trail", operand: MATRIX.magnitude_trail.many }) as never)));
    expect(() => parseComponentValue({ id: "magnitude_trail", operand: { ...MATRIX.magnitude_trail.many as object, range: [-100, 100] } })).toThrow(/unknown key range/u);
  });
});

describe("criterion 12: a square set renders exactly one fact, deduplicated", () => {
  it("refuses duplicate squares and renders one caption per fact", () => {
    expect(() => parseComponentValue({ id: "square_set", operand: { ...MATRIX.square_set.many as object, squares: ["d1", "d1"] } })).toThrow(/deduplicated/u);
    const { root, done } = render("square_set", MATRIX.square_set.many);
    expect(root.querySelectorAll(".caption")).toHaveLength(1);
    expect(root.querySelectorAll(".chip")).toHaveLength(2);
    done();
  });
});

describe("criterion 13a: a relation overlay joins only retained endpoints", () => {
  it("refuses an invented edge endpoint", () => {
    expect(() => parseComponentValue({ id: "relation_overlay", operand: { ...MATRIX.relation_overlay.one as object, edges: [{ from: "f3", to: "g5", relation: "attacks", sign: "state" }] } })).toThrow(/two distinct retained nodes/u);
  });
});

describe("criterion 11: component-theme-sweep over the component tree", () => {
  const NAMED = ["white", "black", "red", "green", "blue", "yellow", "gray", "grey", "orange", "purple", "silver", "transparent"];
  const SYSTEM = ["Canvas", "CanvasText", "ButtonFace", "ButtonText", "Field", "FieldText", "Highlight", "HighlightText", "GrayText", "LinkText", "Mark", "MarkText"];
  it("keyword lists are non-empty and contain the measured sites' own keywords", () => {
    expect(NAMED).toContain("white");
    expect(SYSTEM).toContain("CanvasText");
  });
  it("names no literal colour, named colour, system colour or color-mix literal in any component style", () => {
    const directory = dirname(fileURLToPath(import.meta.url));
    const files = [join(directory, "PresentedEvidence.svelte"), ...readdirSync(join(directory, "components")).map((name) => join(directory, "components", name)), join(directory, "..", "ModuleSeats.svelte")];
    const pattern = new RegExp(`#[0-9a-f]{3,8}\\b|rgba?\\(|hsla?\\(|color-mix\\([^)]*,\\s*(?:${[...NAMED, ...SYSTEM].join("|")})\\b|:\\s*(?:${[...NAMED, ...SYSTEM].join("|")})\\s*[;}]`, "iu");
    for (const file of files) {
      const style = readFileSync(file, "utf8").match(/<style>([\s\S]*?)<\/style>/u)?.[1] ?? "";
      expect(pattern.test(style), file).toBe(false);
    }
    // Negative arm: the sweep sees exactly the hole the theming criterion missed.
    expect(pattern.test(".x{background: white;}")).toBe(true);
    expect(pattern.test(".x{color:CanvasText}")).toBe(true);
  });
});

describe("criterion 14: no ordinary or module consumer adapter constructs structured_document", () => {
  it("structured documents belong to author/operator consumers only", () => {
    for (const entry of PRESENTATION_ADAPTERS) {
      const components = entry.composition === undefined ? [entry.component] : entry.composition.members.map((member) => member.component);
      if (!components.includes("structured_document")) continue;
      expect(entry.consumer.id.startsWith("module.") || ["guidance.", "board.", "review.", "compare.", "theory."].some((prefix) => entry.consumer.id.startsWith(prefix)), entry.key).toBe(false);
    }
  });
});
