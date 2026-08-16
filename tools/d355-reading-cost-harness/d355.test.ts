// DISPOSABLE research harness — D355/D356 (design/BACKLOG.md). Not production code.
// Not referenced by apps/ or packages/, not part of `pnpm test`.
//
// Measures the READING COST of the assistance this product ships today, grouped by the
// distance-to-answer axis landed in design/research/coaching-versus-cheating-and-the-band-curve.md
// (kind / fact / ranking / move). Every string counted is produced by a SHIPPED renderer over
// SHIPPED content; nothing here invents copy.
//
// Population, named before the instrument: the 37 committed packs in content/drafts/ (the same
// corpus R1/R2/R3/Q8 used) — 634 spine transitions, 515 distinct positions — plus the 25 shape
// entries in content/shapes/, plus the 43 cached real Lichess explorer responses in
// content/sources/lichess-explorer/, plus the recorded Maia candidate-count distribution from
// tools/r5-maia-stability-harness/out/stability-summary.json.
import { readFileSync, readdirSync, writeFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  classifyPhase,
  endgameReading,
  irreversibility,
  renderEndgameReading,
  renderPhaseReading,
  structuralReading,
  transitionReading,
} from "@chess-tabiya/runtime";

import { renderStructuralObservation } from "../../apps/web/src/lib/structural-sentences.js";
import { renderTransitionObservation } from "../../apps/web/src/lib/transition-sentences.js";
import { renderCorpusPage } from "../../apps/web/src/lib/corpus-sentences.js";

import { transitions } from "../r1r2-primitives-harness/corpus.js";

const OUT = new URL("./d355-output.md", import.meta.url).pathname;
const SHAPES = new URL("../../content/shapes/", import.meta.url).pathname;
const EXPLORER = new URL("../../content/sources/lichess-explorer/", import.meta.url).pathname;
const DRAFTS = new URL("../../content/drafts/", import.meta.url).pathname;
const CANDIDATES = new URL("../../content/candidates/", import.meta.url).pathname;
const PACKS = new URL("../../content/packs/", import.meta.url).pathname;

/** Brysbaert (2019), meta-analysis of 190 studies: adult silent reading of NON-FICTION English. */
const WPM = 238;

type Distance = "kind" | "fact" | "ranking" | "move";
const DISTANCE_RANK: Readonly<Record<Distance, number>> = { kind: 1, fact: 2, ranking: 3, move: 4 };

interface Item {
  readonly family: string;
  readonly distance: Distance;
  readonly words: number;
  readonly text: string;
}

/** Whitespace tokens. A SAN, a square name and a percentage each count as one word. */
function words(text: string): number {
  return text.trim().split(/\s+/).filter((token) => token !== "").length;
}

function stats(values: readonly number[]): { n: number; min: number; median: number; mean: number; p95: number; max: number } {
  const sorted = [...values].sort((a, b) => a - b);
  const at = (q: number): number => sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))] ?? 0;
  return {
    n: sorted.length,
    min: sorted[0] ?? 0,
    median: at(0.5),
    mean: sorted.reduce((sum, value) => sum + value, 0) / (sorted.length || 1),
    p95: at(0.95),
    max: sorted.at(-1) ?? 0,
  };
}

function seconds(wordCount: number): number {
  return (wordCount / WPM) * 60;
}

function spearman(x: readonly number[], y: readonly number[]): number {
  const rank = (values: readonly number[]): number[] => {
    const order = values.map((value, index) => ({ value, index })).sort((a, b) => a.value - b.value);
    const out = new Array<number>(values.length);
    let index = 0;
    while (index < order.length) {
      let end = index;
      while (end + 1 < order.length && order[end + 1]!.value === order[index]!.value) end += 1;
      const average = (index + end) / 2 + 1;
      for (let k = index; k <= end; k += 1) out[order[k]!.index] = average;
      index = end + 1;
    }
    return out;
  };
  const rx = rank(x), ry = rank(y), n = x.length;
  const mx = rx.reduce((s, v) => s + v, 0) / n, my = ry.reduce((s, v) => s + v, 0) / n;
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i += 1) {
    num += (rx[i]! - mx) * (ry[i]! - my);
    dx += (rx[i]! - mx) ** 2;
    dy += (ry[i]! - my) ** 2;
  }
  return num / Math.sqrt(dx * dy);
}

function packShapedDocuments(): { id: string; doc: any }[] {
  const out: { id: string; doc: any }[] = [];
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) { walk(`${dir}${entry.name}/`); continue; }
      if (!entry.name.endsWith(".json")) continue;
      let doc: any;
      try { doc = JSON.parse(readFileSync(`${dir}${entry.name}`, "utf8")); } catch { continue; }
      if (doc === null || typeof doc !== "object") continue;
      if (typeof doc.id !== "string" || typeof doc.phase !== "string" || doc.opponentPolicy === undefined) continue;
      out.push({ id: doc.id, doc });
    }
  };
  for (const root of [DRAFTS, CANDIDATES, PACKS]) { try { walk(root); } catch { /* absent */ } }
  return out;
}

describe("D355 — reading cost of the shipped assistance surface", () => {
  it("measures words and seconds per rendered item, by distance to the answer", () => {
    const lines: string[] = [];
    const items: Item[] = [];
    const push = (family: string, distance: Distance, text: string): void => {
      items.push({ family, distance, words: words(text), text });
    };

    const corpus = transitions();
    const positions = [...new Set([...corpus.map((t) => t.parentFen), ...corpus.map((t) => t.fen)])];

    lines.push("# D355 raw output — reading cost of the shipped assistance surface");
    lines.push("");
    lines.push(`Reading rate: **${WPM} wpm** (Brysbaert 2019 meta-analysis, adult silent reading, non-fiction English).`);
    lines.push(`Corpus: ${new Set(corpus.map((t) => t.pack)).size} packs, ${corpus.length} spine transitions, ${positions.length} distinct positions.`);
    lines.push("");

    // ---------------------------------------------------------------- fact: structural reading
    const perPositionFactWords: number[] = [];
    const perPositionFactCount: number[] = [];
    const byKindWords = new Map<string, number[]>();
    for (const fen of positions) {
      const reading = structuralReading(fen);
      let total = 0;
      for (const observation of reading.features) {
        const text = renderStructuralObservation(observation);
        const distance: Distance = observation.kind === "named_structure" ? "kind" : "fact";
        push(`structural:${observation.kind}`, distance, text);
        const bucket = byKindWords.get(observation.kind) ?? [];
        bucket.push(words(text));
        byKindWords.set(observation.kind, bucket);
        if (distance === "fact") total += words(text);
      }
      perPositionFactWords.push(total);
      perPositionFactCount.push(reading.features.length);
    }

    // ---------------------------------------------------------------- fact: transition reading
    const perTransitionWords: number[] = [];
    const irreversibilitySubkinds = new Map<string, number>();
    for (const transition of corpus) {
      const reading = transitionReading(transition.parentFen, transition.uci, transition.fen);
      let total = 0;
      for (const observation of reading?.observations ?? []) {
        const text = renderTransitionObservation(observation);
        push(`transition:${observation.kind}`, "fact", text);
        total += words(text);
      }
      const irreversible = irreversibility(transition.parentFen, transition.uci, transition.fen);
      if (irreversible !== undefined) {
        const text = renderTransitionObservation({ kind: "move_irreversibility", subkind: irreversible.subkind, color: irreversible.color } as any);
        push("transition:move_irreversibility", "fact", text);
        irreversibilitySubkinds.set(irreversible.subkind, (irreversibilitySubkinds.get(irreversible.subkind) ?? 0) + 1);
        total += words(text);
      }
      perTransitionWords.push(total);
    }

    // ---------------------------------------------------------------- fact: compare strip entries
    // The shipped strip sentence (compare-strips.ts:32) plus the CompareView.svelte:129 attribution.
    const stripKinds = new Set<string>();
    for (const fen of positions) for (const observation of structuralReading(fen).features) stripKinds.add(observation.kind);
    for (const kind of stripKinds) {
      push("compare-strip", "fact", `A recorded structural observation changed: ${kind}. Tabiya structural detector.`);
    }

    // ---------------------------------------------------------------- kind: phase reading
    for (const fen of positions) push("phase-reading", "kind", renderPhaseReading(classifyPhase(fen)));

    // ---------------------------------------------------------------- kind: endgame reading
    const perPositionEndgameWords: number[] = [];
    for (const fen of positions) {
      const rendered = renderEndgameReading(endgameReading(fen));
      if (rendered.length === 0) continue;
      let total = 0;
      for (const sentence of rendered) { push("endgame-reading", "kind", sentence); total += words(sentence); }
      perPositionEndgameWords.push(total);
    }

    // ---------------------------------------------------------------- kind: guided shape block
    // DrillScreen.svelte:1028 — the shipped guided-mode block: name, standing disclaimer, plan labels.
    const shapeBlockWords: number[] = [];
    const shapePanelWords: number[] = [];
    for (const file of readdirSync(SHAPES).filter((name) => name.endsWith(".json"))) {
      const entry = JSON.parse(readFileSync(`${SHAPES}${file}`, "utf8"));
      const block = [
        entry.name,
        "Named plans for this structure — general to the kind of position, not advice for this one.",
        ...(entry.plans ?? []).map((plan: any) => plan.label),
      ].join(" ");
      push("guided-shape-block", "kind", block);
      shapeBlockWords.push(words(block));
      // ShapePanel.svelte — the full opened panel.
      const panel = [
        entry.name,
        `Tabiya's shape trigger for ${entry.name} matches this position.`,
        ...(entry.plans ?? []).flatMap((plan: any) => [plan.label, plan.description]),
        "Watch", ...(entry.watch ?? []),
        "Typical mistakes", ...(entry.typicalMistakes ?? []),
      ].join(" ");
      push("shape-panel", "kind", panel);
      shapePanelWords.push(words(panel));
    }

    // ---------------------------------------------------------------- ranking: corpus page
    // 43 cached REAL explorer responses, replayed through the shipped parser and renderer.
    const corpusPageWords: number[] = [];
    const corpusMoveCounts: number[] = [];
    for (const file of readdirSync(EXPLORER).filter((name) => name.endsWith(".json"))) {
      const record = JSON.parse(readFileSync(`${EXPLORER}${file}`, "utf8"));
      const body = JSON.parse(Buffer.from(record.body, "base64").toString("utf8"));
      const url = new URL(record.url);
      const total = Number(body.white) + Number(body.draws) + Number(body.black);
      const moves = (body.moves ?? []).map((move: any) => {
        const played = Number(move.white) + Number(move.draws) + Number(move.black);
        return { san: move.san, uci: move.uci, playedCount: played, sharePct: Math.round(played / total * 1000) / 10, white: Number(move.white), draws: Number(move.draws), black: Number(move.black) };
      }).sort((a: any, b: any) => b.playedCount - a.playedCount);
      corpusMoveCounts.push(moves.length);
      const result = {
        kind: "stats" as const, total, white: Number(body.white), draws: Number(body.draws), black: Number(body.black),
        moves, recency: { kind: "absent" as const },
        population: {
          source: "lichess-explorer" as const,
          ratings: (url.searchParams.get("ratings") ?? "").split(",").map(Number) as any,
          speeds: (url.searchParams.get("speeds") ?? "").split(",") as any,
          since: url.searchParams.get("since") ?? "", until: url.searchParams.get("until") ?? "",
        },
      };
      const page = renderCorpusPage({ nodeId: "n", result: result as any, committedMoveSan: moves[0]?.san ?? null });
      const text = page.join(" ");
      push("corpus-page", "ranking", text);
      corpusPageWords.push(words(text));
    }

    // ---------------------------------------------------------------- ranking: human split
    // DrillScreen.svelte:1032 renders every non-offWindow candidate. Candidate counts are the
    // RECORDED distribution from tools/r5-maia-stability-harness (armA, 105 keys).
    const recordedCandidateCounts: Readonly<Record<string, number>> =
      JSON.parse(readFileSync(new URL("../r5-maia-stability-harness/out/stability-summary.json", import.meta.url).pathname, "utf8"))
        .armA.summary.candidateCountDistribution;
    const humanSplitWords: number[] = [];
    for (const [countText, occurrences] of Object.entries(recordedCandidateCounts)) {
      const candidateCount = Number(countText);
      const rendered = `Maia3, rating target 1800: ${Array.from({ length: candidateCount }, () => "a5a6 86%").join(" · ")}`;
      for (let i = 0; i < occurrences; i += 1) { push("human-split", "ranking", rendered); humanSplitWords.push(words(rendered)); }
    }
    // The compact form: the human_divergence pivotal marker (pivotal.ts:107) shows three masses.
    push("pivotal:human_divergence", "ranking", "Maia3's recorded policy split: 41% / 22% / 14% of recorded mass.");

    // ---------------------------------------------------------------- move
    // Refused product-wide today (capabilities.ts:96); measured for what it WOULD cost to read.
    for (const transition of corpus) push("move:bestmove", "move", transition.san);
    // A bestline PV as the engine emits it: the pack's own authored continuation, 6 plies.
    const spineByPack = new Map<string, string[]>();
    for (const transition of corpus) {
      const bucket = spineByPack.get(transition.pack) ?? [];
      if (bucket.length < 6) bucket.push(transition.san);
      spineByPack.set(transition.pack, bucket);
    }
    for (const [, sans] of spineByPack) push("move:bestline-6ply", "move", sans.join(" "));

    // ---------------------------------------------------------------- report
    lines.push("## 1. Per-item reading cost by distance to the answer");
    lines.push("");
    lines.push("| distance | items | median words | mean words | p95 words | median seconds @238wpm |");
    lines.push("|---|---|---|---|---|---|");
    for (const distance of ["kind", "fact", "ranking", "move"] as const) {
      const bucket = items.filter((item) => item.distance === distance).map((item) => item.words);
      const s = stats(bucket);
      lines.push(`| \`${distance}\` | ${s.n} | ${s.median} | ${s.mean.toFixed(1)} | ${s.p95} | ${seconds(s.median).toFixed(1)} s |`);
    }
    lines.push("");

    lines.push("## 2. Per-item cost by rendered family (the unweighted view)");
    lines.push("");
    lines.push("| family | distance | items | median words | median seconds |");
    lines.push("|---|---|---|---|---|");
    const families = [...new Set(items.map((item) => item.family))].sort();
    const familyRows: { family: string; distance: Distance; median: number }[] = [];
    for (const family of families) {
      const bucket = items.filter((item) => item.family === family);
      const s = stats(bucket.map((item) => item.words));
      familyRows.push({ family, distance: bucket[0]!.distance, median: s.median });
      lines.push(`| \`${family}\` | \`${bucket[0]!.distance}\` | ${s.n} | ${s.median} | ${seconds(s.median).toFixed(1)} s |`);
    }
    lines.push("");

    const rhoItems = spearman(items.map((item) => DISTANCE_RANK[item.distance]), items.map((item) => item.words));
    const rhoFamilies = spearman(familyRows.map((row) => DISTANCE_RANK[row.distance]), familyRows.map((row) => row.median));
    const shippableItems = items.filter((item) => item.distance !== "move");
    const shippableFamilies = familyRows.filter((row) => row.distance !== "move");
    const rhoItemsShippable = spearman(shippableItems.map((item) => DISTANCE_RANK[item.distance]), shippableItems.map((item) => item.words));
    const rhoFamiliesShippable = spearman(shippableFamilies.map((row) => DISTANCE_RANK[row.distance]), shippableFamilies.map((row) => row.median));

    lines.push("## 3. Does reading cost track distance to the answer?");
    lines.push("");
    lines.push(`Spearman rho(distance rank, words), all ${items.length} rendered items: **${rhoItems.toFixed(3)}**`);
    lines.push(`Spearman rho(distance rank, median words), ${familyRows.length} rendered families: **${rhoFamilies.toFixed(3)}**`);
    lines.push(`Same, excluding \`move\` (refused product-wide today), items: **${rhoItemsShippable.toFixed(3)}**`);
    lines.push(`Same, excluding \`move\`, families: **${rhoFamiliesShippable.toFixed(3)}**`);
    lines.push("");

    // Variance decomposition: how much of the spread in reading cost does the distance class explain?
    const etaSquared = (groups: readonly (readonly number[])[]): number => {
      const all = groups.flat();
      const grand = all.reduce((s, v) => s + v, 0) / all.length;
      const between = groups.reduce((sum, group) => sum + group.length * ((group.reduce((s, v) => s + v, 0) / group.length - grand) ** 2), 0);
      const total = all.reduce((sum, value) => sum + (value - grand) ** 2, 0);
      return between / total;
    };
    const logWords = (bucket: readonly Item[]): number[] => bucket.map((item) => Math.log(item.words));
    const classGroups = (["kind", "fact", "ranking", "move"] as const).map((distance) => logWords(items.filter((item) => item.distance === distance)));
    const shippableGroups = (["kind", "fact", "ranking"] as const).map((distance) => logWords(items.filter((item) => item.distance === distance)));
    const familyGroups = families.map((family) => logWords(items.filter((item) => item.family === family)));
    lines.push(`Variance in log(words) explained by DISTANCE CLASS (eta-squared, 4 classes): **${etaSquared(classGroups).toFixed(3)}**`);
    lines.push(`Same, excluding \`move\` (3 classes): **${etaSquared(shippableGroups).toFixed(3)}**`);
    lines.push(`Variance in log(words) explained by RENDERED FAMILY (${families.length} families): **${etaSquared(familyGroups).toFixed(3)}**`);
    lines.push("");
    lines.push("Within-class spread of family medians (words):");
    for (const distance of ["kind", "fact", "ranking", "move"] as const) {
      const rows = familyRows.filter((row) => row.distance === distance).sort((a, b) => a.median - b.median);
      lines.push(`- \`${distance}\`: ${rows[0]!.median} (\`${rows[0]!.family}\`) … ${rows.at(-1)!.median} (\`${rows.at(-1)!.family}\`) — a ${(rows.at(-1)!.median / Math.max(1, rows[0]!.median)).toFixed(0)}× range`);
    }
    lines.push("");

    lines.push("## 4. Per-node aggregate volume (the all-on state)");
    lines.push("");
    const factPerPosition = stats(perPositionFactWords);
    const countPerPosition = stats(perPositionFactCount);
    lines.push(`Structural observations per position: min ${countPerPosition.min} / median ${countPerPosition.median} / mean ${countPerPosition.mean.toFixed(2)} / p95 ${countPerPosition.p95} / max ${countPerPosition.max}`);
    lines.push(`Structural reading WORDS per position: min ${factPerPosition.min} / median ${factPerPosition.median} / mean ${factPerPosition.mean.toFixed(1)} / p95 ${factPerPosition.p95} / max ${factPerPosition.max}`);
    lines.push(`Structural reading SECONDS per position @${WPM}wpm: median **${seconds(factPerPosition.median).toFixed(0)} s** / p95 ${seconds(factPerPosition.p95).toFixed(0)} s / max ${seconds(factPerPosition.max).toFixed(0)} s`);
    const deciles = (values: readonly number[]): string => {
      const sorted = [...values].sort((a, b) => a - b);
      return Array.from({ length: 9 }, (_, i) => sorted[Math.floor(((i + 1) / 10) * sorted.length)] ?? 0).join(" · ");
    };
    lines.push(`Observation-count deciles (d1…d9): ${deciles(perPositionFactCount)}`);
    lines.push(`Word-count deciles (d1…d9): ${deciles(perPositionFactWords)}`);
    const phaseOfFen = new Map<string, string>();
    for (const transition of corpus) { phaseOfFen.set(transition.parentFen, transition.phase); phaseOfFen.set(transition.fen, transition.phase); }
    const byPhase = new Map<string, number[]>();
    positions.forEach((fen, index) => {
      const phase = phaseOfFen.get(fen) ?? "unknown";
      const bucket = byPhase.get(phase) ?? [];
      bucket.push(perPositionFactWords[index] ?? 0);
      byPhase.set(phase, bucket);
    });
    for (const [phase, bucket] of [...byPhase].sort()) {
      const s = stats(bucket);
      lines.push(`- declared phase \`${phase}\` (${s.n} positions): median ${s.median} words = ${seconds(s.median).toFixed(0)} s`);
    }
    const transitionPer = stats(perTransitionWords);
    lines.push(`Transition reading WORDS per ply: median ${transitionPer.median} / mean ${transitionPer.mean.toFixed(1)} / p95 ${transitionPer.p95} / max ${transitionPer.max} (median **${seconds(transitionPer.median).toFixed(0)} s**)`);
    lines.push(`Irreversibility subkinds actually emitted over ${corpus.length} transitions: ${[...irreversibilitySubkinds].map(([k, v]) => `${k} ${v}`).join(", ") || "none"} (the type also declares \`clock_zeroed\`, the HALFMOVE counter — never emitted).`);
    const endgamePer = stats(perPositionEndgameWords);
    lines.push(`Endgame reading WORDS per position where present (${endgamePer.n} positions): median ${endgamePer.median} / max ${endgamePer.max}`);
    const shapeBlock = stats(shapeBlockWords), shapePanel = stats(shapePanelWords);
    lines.push(`Guided shape block WORDS: median ${shapeBlock.median} / max ${shapeBlock.max} (median ${seconds(shapeBlock.median).toFixed(1)} s)`);
    lines.push(`Full shape panel WORDS: median ${shapePanel.median} / max ${shapePanel.max} (median ${seconds(shapePanel.median).toFixed(0)} s)`);
    const corpusPage = stats(corpusPageWords), corpusMoves = stats(corpusMoveCounts);
    lines.push(`Corpus page moves listed (43 real cached responses): median ${corpusMoves.median} / min ${corpusMoves.min} / max ${corpusMoves.max}`);
    lines.push(`Corpus page WORDS: median ${corpusPage.median} / min ${corpusPage.min} / max ${corpusPage.max} (median **${seconds(corpusPage.median).toFixed(0)} s**)`);
    const humanSplit = stats(humanSplitWords);
    lines.push(`Human split WORDS (recorded candidate-count distribution): median ${humanSplit.median} / min ${humanSplit.min} / max ${humanSplit.max} (median **${seconds(humanSplit.median).toFixed(0)} s**)`);
    lines.push("");

    // ---------------------------------------------------------------- horizon census + 10+0
    const documents = packShapedDocuments();
    const horizons = documents
      .map((entry) => entry.doc.authoredBoundary?.plyHorizon)
      .filter((value: unknown): value is number => typeof value === "number");
    const horizon = stats(horizons);
    lines.push("## 5. Encounter horizon and the 10+0 arithmetic");
    lines.push("");
    lines.push(`Pack-shaped documents (declare id + phase + opponentPolicy): **${documents.length}**`);
    lines.push(`Declaring \`authoredBoundary.plyHorizon\`: **${horizons.length}** — min ${horizon.min} / median ${horizon.median} / mean ${horizon.mean.toFixed(1)} / p95 ${horizon.p95} / max ${horizon.max}`);
    lines.push("");
    const budgets = [
      { label: "uniform 10+0, 40-move reference game", perMove: 600 / 40 },
      { label: "whole 600 s given to a median-horizon encounter (10 ply = 5 learner moves)", perMove: 600 / (horizon.median / 2) },
      { label: "whole 600 s given to a max-horizon encounter (40 ply = 20 learner moves)", perMove: 600 / (horizon.max / 2) },
      { label: "3+0 blitz, 40-move reference game", perMove: 180 / 40 },
      { label: "15+0 rapid, 40-move reference game", perMove: 900 / 40 },
    ];
    lines.push("| clock allocation | seconds per learner move | words readable @238wpm | fact items readable | ranking items readable |");
    lines.push("|---|---|---|---|---|");
    const factMedian = stats(items.filter((item) => item.distance === "fact").map((item) => item.words)).median;
    const rankingMedian = stats(items.filter((item) => item.distance === "ranking").map((item) => item.words)).median;
    for (const budget of budgets) {
      const readable = (budget.perMove / 60) * WPM;
      lines.push(`| ${budget.label} | ${budget.perMove.toFixed(1)} s | ${readable.toFixed(0)} | ${(readable / factMedian).toFixed(1)} | ${(readable / rankingMedian).toFixed(2)} |`);
    }
    lines.push("");
    lines.push(`Break-even loadout at the uniform 10+0 budget (${(600 / 40).toFixed(0)} s/move → ${((600 / 40 / 60) * WPM).toFixed(0)} words):`);
    lines.push(`- all-\`fact\` loadout: **${(((600 / 40) / 60) * WPM / factMedian).toFixed(1)}** items`);
    lines.push(`- all-\`ranking\` loadout: **${(((600 / 40) / 60) * WPM / rankingMedian).toFixed(2)}** items`);
    lines.push(`- the all-on rung-0 state costs **${(seconds(factPerPosition.median) / (600 / 40)).toFixed(1)}×** the whole per-move budget at median.`);
    lines.push("");

    writeFileSync(OUT, `${lines.join("\n")}\n`);
    expect(items.length).toBeGreaterThan(0);
  });
});
