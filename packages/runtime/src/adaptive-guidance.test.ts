import { resolvePackPath } from "@chess-tabiya/schema/pack-path";

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  LIVE_SESSION_KINDS,
  BANNED_JUDGEMENTS,
  SILENT_ASSISTANCE,
  classifyPhase,
  commitMove,
  createRun,
  endgameReading,
  liveAdmitted,
  liveMarkers,
  permittedAssistance,
  pivotalMarkers,
  renderEndgameReading,
  renderPhaseReading,
  renderPivotalMarker,
  retrospectivePivot,
  voiceCheck,
  type BranchComparison,
  type DrillRun,
  type EvidencePacket,
  type Node,
  type PivotalMarker,
} from "./index.js";

const at = "2026-08-14T00:00:00.000Z";
const start = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const developed = "r3k2r/ppppqppp/2nbbn2/8/8/2NBBN2/PPPPQPPP/R3K2R w KQkq - 0 1";
const earlyQueenTrade = "rnb1kbnr/pppp1ppp/8/8/8/8/PPPP1PPP/RNB1KBNR w KQkq - 0 1";

function node(id: string, fen: string, ply: number): Node {
  return Object.freeze({ id, parentId: ply === 0 ? null : `n${ply - 1}`, fen, transposeKey: fen.split(" ", 4).join(" "), moveUci: null, moveSan: null, ply, actor: ply === 0 ? "system" : "user", branchId: "main", checkpointRefs: [], objectiveState: "active", evidenceRefs: [], createdAt: at });
}

function run(fens: readonly string[], events: DrillRun["events"] = []): DrillRun {
  const nodes = fens.map((fen, index) => node(`n${index}`, fen, index));
  return Object.freeze({ schemaVersion: "0.16", id: "adaptive", sessionKind: "position", packId: null, packDigest: null, sessionDigest: "sha256:test", start: { fen: fens[0]!, side: "white" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common", targetElo: 1500 }, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, nodes, branches: [{ id: "main", forkNodeId: "n0", label: "Main", seed: 1, origin: "played" }], events, activeCursor: { nodeId: nodes.at(-1)!.id, branchId: "main" } } satisfies DrillRun);
}

describe("adaptive guidance runtime", () => {
  it("publishes one shared live-session vocabulary for server and client", () => {
    expect(LIVE_SESSION_KINDS).toEqual(["stream", "academy", "match"]);
  });

  it("pins phase bands, abstention, and the two declared counter-intuitive fixtures", () => {
    expect(classifyPhase(start).phase).toBe("opening");
    expect(classifyPhase(developed).phase).toBe("middlegame");
    expect(classifyPhase(earlyQueenTrade).phase).toBe("opening");
    expect(classifyPhase("4k2r/8/8/8/8/8/RP6/4K3 w - - 0 1").phase).toBe("endgame");
    expect(classifyPhase("3qk2r/8/8/8/8/8/3Q3R/4K3 w - - 0 1").phase).toBe("unclear");
    expect(renderPhaseReading(classifyPhase("3qk2r/8/8/8/8/8/3Q3R/4K3 w - - 0 1"))).toContain("Tabiya's phase bands");
  });

  it("marks only definite-to-definite phase changes across abstention", () => {
    const unclear = "3qk2r/8/8/8/8/8/3Q3R/4K3 w - - 0 1";
    const end = "4k2r/8/8/8/8/8/RP6/4K3 w - - 0 1";
    const markers = pivotalMarkers(run([developed, unclear, unclear, end]), "main").filter((item) => item.kind === "phase_change");
    expect(markers).toHaveLength(1);
    expect(markers[0]).toMatchObject({ nodeId: "n3", detail: { from: "middlegame", to: "endgame" } });
    expect(renderPivotalMarker(markers[0]!)[0]).toContain("Tabiya's phase bands");
    expect(pivotalMarkers(run([end]), "main").filter((item) => item.kind === "phase_change")).toEqual([]);
  });

  it("marks castling, last-of-role captures, and pawn contact but not quiet moves", () => {
    const created = (id: string, fen: string) => createRun({ id, packId: "p", packDigest: `sha256:${"a".repeat(64)}`, startFen: fen, seed: 1, createdAt: at, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } } });
    let castle = created("castle", start);
    for (const move of ["e2e4", "e7e5", "g1f3", "b8c6", "f1e2", "g8f6", "e1g1"]) castle = commitMove(castle, move, { at }).run;
    expect(pivotalMarkers(castle, castle.activeCursor.branchId).some((item) => item.kind === "irreversibility" && (item.detail as { subkind?: string }).subkind === "castled")).toBe(true);
    const queen = commitMove(created("queen", "4k3/4q3/8/8/8/8/4R3/4K3 w - - 0 1"), "e2e7", { at }).run;
    expect(pivotalMarkers(queen, queen.activeCursor.branchId).some((item) => item.kind === "irreversibility" && (item.detail as { subkind?: string }).subkind === "last_of_role")).toBe(true);
    const pawn = commitMove(created("pawn", "4k3/p7/8/4p3/3P4/8/8/4K3 w - - 0 1"), "d4e5", { at }).run;
    expect(pivotalMarkers(pawn, pawn.activeCursor.branchId).some((item) => item.kind === "irreversibility" && (item.detail as { subkind?: string }).subkind === "pawn_break")).toBe(true);
    const quiet = commitMove(created("quiet", start), "g1f3", { at }).run;
    expect(pivotalMarkers(quiet, quiet.activeCursor.branchId).filter((item) => item.kind === "irreversibility")).toEqual([]);

    const free = { sessionKind: "position" as const, deliveryOpen: true, role: "solo" as const };
    expect(liveMarkers(castle, castle.activeCursor.branchId, free).filter((item) => item.kind === "irreversibility")).toEqual([]);
    expect(liveMarkers(pawn, pawn.activeCursor.branchId, free).filter((item) => item.kind === "irreversibility")).toEqual([]);
    expect(liveMarkers(queen, queen.activeCursor.branchId, free).filter((item) => item.kind === "irreversibility")).toHaveLength(1);
  });

  it("requires sustained same-side legal-option collapse and suppresses a one-check release", () => {
    const broad = "4k3/8/8/8/8/8/8/R3K3 w - - 0 1";
    const checkE = "4k3/8/8/8/8/8/4r3/4K3 w - - 0 1";
    const checkD = "4k3/8/8/8/8/8/3r4/3K4 w - - 0 1";
    const sustained = pivotalMarkers(run([broad, checkE, checkD]), "main").filter((item) => item.kind === "option_collapse");
    expect(sustained).toHaveLength(1);
    expect(sustained[0]!.nodeId).toBe("n1");
    expect(pivotalMarkers(run([broad, checkE, broad]), "main").filter((item) => item.kind === "option_collapse")).toEqual([]);
  });

  it("derives divergence only from persisted human-common mass", () => {
    const selection = { moveUci: "e7e5", policyModeApplied: "human_common" as const, candidates: [{ moveUci: "e7e5", mass: .31, rank: 1 }, { moveUci: "c7c5", mass: .24, rank: 2 }, { moveUci: "e7e6", mass: .19, rank: 3 }, { moveUci: "c7c6", mass: .16, rank: 4 }, { moveUci: "d7d5", mass: .1, rank: 5 }], engine: { id: "maia", name: "Maia-1500", version: "1", seedHonored: false } };
    const event = { seq: 1, type: "opponent.move_selected" as const, at, data: { nodeId: "n0", branchId: "main", moveUci: "e7e5", selection } };
    const markers = pivotalMarkers(run([start], [event]), "main").filter((item) => item.kind === "human_divergence");
    expect(markers).toHaveLength(1);
    expect(renderPivotalMarker(markers[0]!)[0]).toMatch(/Maia-1500.*31%.*24%.*19%.*recorded mass/);
    expect(liveMarkers(run([start], [event]), "main", { sessionKind: "position", deliveryOpen: false, role: "solo" }).filter((item) => item.kind === "human_divergence")).toEqual([]);
    expect(liveMarkers(run([start], [event]), "main", { sessionKind: "position", deliveryOpen: true, role: "host" }).filter((item) => item.kind === "human_divergence")).toHaveLength(1);
    expect(liveMarkers(run([start], [event]), "main", { sessionKind: "position", deliveryOpen: true, role: "participant" }).filter((item) => item.kind === "human_divergence")).toEqual([]);
    expect(liveMarkers(run([start], [event]), "main", { sessionKind: "position", deliveryOpen: true, role: "spectator" }).filter((item) => item.kind === "human_divergence")).toEqual([]);
    expect(pivotalMarkers(run([start], [{ ...event, data: { ...event.data, selection: { ...selection, policyModeApplied: "strong_engine" as const } } }]), "main").filter((item) => item.kind === "human_divergence")).toEqual([]);
  });

  it("pins every pivotal sentence and keeps live admission exhaustive", () => {
    const marker = (kind: PivotalMarker["kind"], detail: PivotalMarker["detail"]): PivotalMarker => ({ nodeId: "n0", kind, detail, provenanceNote: "fixture" });
    const engine = { id: "maia", name: "Maia-1500", version: "1", seedHonored: false };
    const fixtures = [
      [marker("phase_change", { from: "opening", to: "middlegame" }), "opening → middlegame, detected by Tabiya's phase bands."],
      [marker("human_divergence", { engine, masses: [.4, .3, .2] }), "Maia-1500's recorded policy split: 40% / 30% / 20% of recorded mass."],
      [marker("option_collapse", { color: "white", priorCount: 8, count: 1, nextCount: 1 }), "One legal move is available: forced under Tabiya's count convention."],
      [marker("option_collapse", { color: "white", priorCount: 8, count: 2, nextCount: 2 }), "2 legal moves are available under Tabiya's count convention."],
      [marker("irreversibility", { subkind: "castled", color: "white" }), "white castled."],
      [marker("irreversibility", { subkind: "last_of_role", color: "black", role: "rook", queensOff: false }), "black has no rooks remaining."],
      [marker("irreversibility", { subkind: "last_of_role", color: "black", role: "queen", queensOff: true }), "The queens have left the board."],
      [marker("irreversibility", { subkind: "pawn_break", color: "white" }), "white created or resolved pawn contact."],
    ] as const;
    expect(fixtures.map(([item]) => renderPivotalMarker(item)[0])).toEqual(fixtures.map(([, sentence]) => sentence));
    for (const [item] of fixtures) for (const banned of BANNED_JUDGEMENTS) {
      expect(renderPivotalMarker(item).join(" ").toLowerCase()).not.toMatch(new RegExp(`\\b${banned}\\b`, "u"));
    }
    const free = permittedAssistance({ sessionKind: "position", deliveryOpen: true, role: "solo" });
    const locked = permittedAssistance({ sessionKind: "position", deliveryOpen: false, role: "solo" });
    expect(fixtures.filter(([item]) => liveAdmitted(item, free)).map(([item]) => item.kind)).toEqual([
      "phase_change", "human_divergence", "option_collapse", "option_collapse", "irreversibility", "irreversibility",
    ]);
    expect(fixtures.filter(([item]) => liveAdmitted(item, locked)).map(([item]) => item.kind)).toEqual([
      "phase_change", "option_collapse", "option_collapse", "irreversibility", "irreversibility",
    ]);
  });

  it("narrows only the unasked client projection", () => {
    const sources = {
      story: readFileSync(new URL("./story.ts", import.meta.url), "utf8"),
      comparison: readFileSync(new URL("./compare-strips.ts", import.meta.url), "utf8"),
      evidence: readFileSync(new URL("../../../apps/server/src/guidance.ts", import.meta.url), "utf8"),
      client: readFileSync(new URL("../../../apps/web/src/lib/DrillScreen.svelte", import.meta.url), "utf8"),
    };
    expect(sources.story).toContain("pivotalMarkers(run, branchId)");
    expect(sources.comparison).toContain("pivotalMarkers(run, column.branchId)");
    expect(sources.evidence).toContain("pivotalMarkers(input.run, input.node.branchId)");
    expect(sources.story).not.toContain("liveMarkers");
    expect(sources.comparison).not.toContain("liveMarkers");
    expect(sources.evidence).not.toContain("liveMarkers");
    expect(sources.client.match(/liveMarkers\(/gu)).toHaveLength(1);
  });

  it("implements the assistance table with silence as the universal default", () => {
    expect(SILENT_ASSISTANCE).toEqual({ version: 4, markers: "off", guided: "off", humanSplit: "off", corpus: "off", voice: "authored", spoken: "off", boardLighting: "off", arrows: "off", ambient: "off" });
    expect(permittedAssistance({ sessionKind: "pack", deliveryOpen: false, role: "solo" }).humanSplit).toBe("locked_off");
    expect(permittedAssistance({ sessionKind: "position", deliveryOpen: true, role: "host" }).humanSplit).toBe("free");
    expect(permittedAssistance({ sessionKind: "position", deliveryOpen: true, role: "participant" }).humanSplit).toBe("locked_off");
    expect(permittedAssistance({ sessionKind: "position", deliveryOpen: true, role: "spectator" }).markers).toBe("free");
    for (const role of ["solo", "host", "participant", "spectator"] as const) for (const deliveryOpen of [false, true]) {
      expect(permittedAssistance({ sessionKind: "position", deliveryOpen, role }).corpus).toBe(deliveryOpen && (role === "solo" || role === "host") ? "free" : "locked_off");
    }
  });

  it("recognizes exact endgame census families and honest missing technique entries", () => {
    const center = endgameReading("4k2r/8/8/8/8/8/RP6/4K3 w - - 0 1");
    expect(center?.type?.id).toBe("rook-and-pawn-vs-rook");
    expect(center?.techniques.map((item) => item.id)).toEqual(["lucena", "philidor"]);
    const edge = endgameReading("4k2r/8/8/8/8/8/P7/R3K3 w - - 0 1");
    expect(edge?.techniques.map((item) => item.id)).toEqual(["lucena", "philidor", "vancura"]);
    const fourThree = endgameReading("6k1/5ppp/8/8/8/8/4RPPP/6K1 w - - 0 1");
    expect(fourThree?.type).toBeNull();
    expect(renderEndgameReading(fourThree).join(" ")).toContain("outside Tabiya's material-census convention");
  });

  it("selects the largest recorded centipawn swing and abstains with one point", () => {
    const comparison = { evidence: { main: [{ nodeId: "a", plyOffset: 1, evidenceRefs: [], kind: "eval", source: "engine_validated", score: { kind: "cp", value: 20 } }, { nodeId: "b", plyOffset: 2, evidenceRefs: [], kind: "eval", source: "engine_validated", score: { kind: "cp", value: -80 } }, { nodeId: "c", plyOffset: 3, evidenceRefs: [], kind: "eval", source: "engine_validated", score: { kind: "cp", value: -60 } }] } } as unknown as BranchComparison;
    expect(retrospectivePivot(comparison, "main")).toEqual({ nodeId: "b", plyOffset: 2, delta: -100 });
    expect(retrospectivePivot({ evidence: { main: comparison.evidence.main!.slice(0, 1) } } as unknown as BranchComparison, "main")).toBeNull();
  });

  it("checks voice introductions while pinning the known plain-English leak", () => {
    const packet: EvidencePacket = { fen: start, phase: { source: "detector", value: "opening" }, structures: [], observations: [], markers: [], endgame: null, plans: [], authored: [], readings: [], sentences: ["A backward pawn is recorded."] };
    expect(voiceCheck(packet, "A weak pawn is recorded.").violations).toContain("judgement:weak");
    expect(voiceCheck(packet, "A brilliant practical choice.").violations).toContain("judgement:brilliant");
    expect(voiceCheck(packet, "Push the tall one two squares.").violations).toContain("prescription:push");
    expect(voiceCheck(packet, "The c4 square matters.").valid).toBe(false);
    expect(voiceCheck(packet, "The tall one wants a friend beside it.").valid).toBe(true);
    expect(BANNED_JUDGEMENTS).toContain("blunder");
  });

  it("records the combined guidance envelope over Pack B and a 60-ply position run without gating it", () => {
    const pack = JSON.parse(readFileSync(new URL(resolvePackPath("carlsbad-minority-attack"), import.meta.url), "utf8")) as { id: string; start: { fen: string }; spine: readonly { moveUci: string; children?: readonly unknown[] }[] };
    const root = createRun({ id: "adaptive-pack-envelope", packId: pack.id, packDigest: `sha256:${"a".repeat(64)}`, startFen: pack.start.fen, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 1, createdAt: at });
    const packRuns: DrillRun[] = [root];
    const walk = (nodes: readonly { moveUci: string; children?: readonly unknown[] }[], parent: DrillRun): void => {
      for (const entry of nodes) {
        const next = commitMove(parent, entry.moveUci, { at }).run;
        packRuns.push(next);
        walk((entry.children ?? []) as readonly { moveUci: string; children?: readonly unknown[] }[], next);
      }
    };
    walk(pack.spine, root);
    const sixty = run(Array.from({ length: 61 }, (_, index) => index % 2 === 0 ? start : start.replace(" w ", " b ")));
    const durations: number[] = [];
    for (let sample = 0; sample < 20; sample += 1) {
      const started = performance.now();
      for (const candidate of packRuns) {
        const active = candidate.nodes.find((item) => item.id === candidate.activeCursor.nodeId)!;
        classifyPhase(active.fen);
        pivotalMarkers(candidate, candidate.activeCursor.branchId);
        endgameReading(active.fen);
      }
      classifyPhase(sixty.nodes.at(-1)!.fen);
      pivotalMarkers(sixty, "main");
      endgameReading(sixty.nodes.at(-1)!.fen);
      durations.push(performance.now() - started);
    }
    durations.sort((left, right) => left - right);
    const medianMs = durations[Math.floor(durations.length / 2)]!;
    const maxMs = durations.at(-1)!;
    console.log(`ADAPTIVE_GUIDANCE_LATENCY ${JSON.stringify({ packBSpineRuns: packRuns.length, justPlayPlies: sixty.nodes.length - 1, samples: durations.length, medianMs: Number(medianMs.toFixed(3)), maxMs: Number(maxMs.toFixed(3)) })}`);
    expect(packRuns.length).toBeGreaterThan(1);
    expect(sixty.nodes).toHaveLength(61);
    expect(Number.isFinite(maxMs)).toBe(true);
  });
});
