// DISPOSABLE research harness — R2, planning/campaign-research-queue.md.
import { writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { pawnSafety } from "../../packages/runtime/src/index.js";
import { transitions, type Transition } from "./corpus.js";
import { distanceToSet, pos } from "./primitives.js";
import type { Chess } from "chessops/chess";
import { SquareSet } from "chessops/squareSet";
import type { Color, Role, Square } from "chessops/types";
import { makeSquare, opposite, parseSquare, parseUci } from "chessops/util";

// ---------------------------------------------------------------------------
// Ground truth: author-declared repositions. Every row is quoted from a spine
// annotation in content/drafts/. `targets` are the arrival squares the AUTHOR
// names. Nothing here is my judgment about chess (law 8) — it is a transcription.
// ---------------------------------------------------------------------------
interface Label {
  pack: string;
  nodeId: string;
  targets: string[]; // author-named arrival squares; [] = author names no arrival square
  quote: string;
  reasonKind: "arrival" | "vacation" | "attack_set" | "safety" | "unspecified";
}

const LABELS: Label[] = [
  { pack: "anti-french-advance-white", nodeId: "nbd2-reroute", targets: ["f1", "g3"], reasonKind: "arrival",
    quote: "the buried knight finally moves — toward f1-g3 and the kingside" },
  { pack: "anti-kid-classical-white", nodeId: "p17-ne1", targets: ["d3"], reasonKind: "arrival",
    quote: "The knight clears f3's square for the pawn and heads for d3" },
  { pack: "anti-kid-classical-white", nodeId: "p16-ne7", targets: ["g6", "f5"], reasonKind: "arrival",
    quote: "Black reroutes for ...f5" },
  { pack: "kid-classical-black", nodeId: "p16-ne7", targets: ["g6"], reasonKind: "arrival",
    quote: "from e7 the knight supports ...f5 and can reroute to g6" },
  { pack: "carlsbad-minority-attack", nodeId: "nf8-regroup", targets: ["e6", "g6"], reasonKind: "arrival",
    quote: "the knight leaves d7 for f8, where it covers h7 and d7 and can go on to e6 or g6" },
  { pack: "carlsbad-minority-attack", nodeId: "ng3-kingside", targets: ["f5"], reasonKind: "arrival",
    quote: "The knight heads for f5 or supports h4-h5" },
  { pack: "french-advance-black", nodeId: "nh6-knight", targets: ["f5"], reasonKind: "arrival",
    quote: "the knight heads for f5, the only square from which it joins the siege" },
  { pack: "italian-center-attack-white", nodeId: "p15-nbxd2", targets: ["b3", "f1"], reasonKind: "arrival",
    quote: "from d2 it re-routes via b3 or f1 into the isolani game" },
  { pack: "mate-two-bishops", nodeId: "w-bb1", targets: ["a2"], reasonKind: "arrival",
    quote: "from b1 the bishop is ready to swing to a2 and seal g8" },
  { pack: "mate-bishop-knight", nodeId: "p23-nf5", targets: ["d6", "e7", "g7"], reasonKind: "attack_set",
    quote: "From f5 it covers d6, e7 and g7 - the squares behind the king's line of retreat" },
  { pack: "trajectory-mate-bishop-knight", nodeId: "p23-nf5", targets: ["d6", "e7", "g7"], reasonKind: "attack_set",
    quote: "From f5 it covers d6, e7 and g7" },
  { pack: "anti-sicilian-najdorf-english-attack", nodeId: "p13-nb3", targets: [], reasonKind: "vacation",
    quote: "The retreat that keeps f3 available for the pawn. From b3 the knight eyes a5 and c5" },
  { pack: "najdorf-english-attack-black", nodeId: "p13-nb3", targets: [], reasonKind: "vacation",
    quote: "The main retreat, keeping f3 free for the pawn." },
  { pack: "caro-kann-advance-black", nodeId: "bg6-retreat", targets: [], reasonKind: "safety",
    quote: "Step back and let the pawns overextend. On g6 the bishop still watches the b1-h7 diagonal" },
  { pack: "carlsbad-minority-attack", nodeId: "bh4-retreat", targets: [], reasonKind: "safety",
    quote: "Keeping the bishop is the consistent choice" },
  { pack: "kid-classical-black", nodeId: "p14-nc6", targets: [], reasonKind: "unspecified",
    quote: "When it comes, the knight re-routes to e7" },
  { pack: "leningrad-dutch-black", nodeId: "nc6-matulovic", targets: [], reasonKind: "unspecified",
    quote: "after which it reroutes and the closed centre gives you the classic kingside clamp" },
];

// ---------------------------------------------------------------------------
// Autonomous target-square census: squares no enemy pawn can ever attack,
// on the enemy's half, unoccupied by the mover's own pieces. Same arithmetic as
// the shipped `pawn_safe_square` leaf (structure.ts:140), inlined to avoid 64
// FEN re-parses; equality with the shipped function is asserted below.
// ---------------------------------------------------------------------------
function pawnSafeSet(p: Chess, color: Color): SquareSet {
  const enemy = opposite(color);
  const enemyForward = enemy === "white" ? 1 : -1;
  const enemyPawns = [...p.board.pieces(enemy, "pawn")];
  let out = SquareSet.empty();
  for (let sq = 0; sq < 64; sq += 1) {
    const file = sq % 8;
    const standRank = (sq >> 3) - enemyForward;
    let attacked = false;
    for (const pawn of enemyPawns) {
      if (Math.abs((pawn % 8) - file) !== 1) continue;
      if ((standRank - (pawn >> 3)) * enemyForward >= 0) { attacked = true; break; }
    }
    if (!attacked) out = out.with(sq as Square);
  }
  return out;
}

function enemyHalf(color: Color): SquareSet {
  let out = SquareSet.empty();
  for (let r = 4; r < 8; r += 1) out = out.union(SquareSet.fromRank(color === "white" ? r : 7 - r));
  return out;
}

const START_HOME: Record<string, string[]> = {
  "white knight": ["b1", "g1"], "black knight": ["b8", "g8"],
  "white bishop": ["c1", "f1"], "black bishop": ["c8", "f8"],
  "white rook": ["a1", "h1"], "black rook": ["a8", "h8"],
  "white queen": ["d1"], "black queen": ["d8"],
  "white king": ["e1"], "black king": ["e8"],
};

interface Row {
  t: Transition;
  role: Role;
  color: Color;
  from: Square;
  to: Square;
  isPawn: boolean;
  isCapture: boolean;
  isCheck: boolean;
  isForced: boolean;
  fromHome: boolean;
  advancing: boolean;
  quiet: boolean;
  dAuto: number; // distance reduction toward the autonomous pawn-safe target set
  dCenter: number;
  labeled: Label | undefined;
}

describe("R2 — does distance-to-target-square capture the reposition case?", () => {
  it("measures recall on authored repositions and the firing rate on everything else", () => {
    const all = transitions();

    // fidelity check: inlined pawn-safety == shipped pawnSafety on a sample
    for (const t of all.filter((_, i) => i % 37 === 0)) {
      const set = pawnSafeSet(pos(t.parentFen), "white");
      for (let sq = 0; sq < 64; sq += 4) {
        expect(set.has(sq as Square)).toBe(pawnSafety(t.parentFen, "white", makeSquare(sq as Square)).safe);
      }
    }

    const rows: Row[] = [];
    for (const t of all) {
      const before = pos(t.parentFen);
      const after = pos(t.fen);
      const move = parseUci(t.uci)!;
      if (!("from" in move)) continue;
      const piece = before.board.get(move.from)!;
      const color = piece.color;
      const forward = color === "white" ? 1 : -1;
      const auto = pawnSafeSet(before, color).intersect(enemyHalf(color)).diff(before.board[color]);
      const dAuto = distanceToSet(piece.role, move.from, auto) - distanceToSet(piece.role, move.to, auto);
      const dCenter = distanceToSet(piece.role, move.from, SquareSet.center()) - distanceToSet(piece.role, move.to, SquareSet.center());
      let legal = 0;
      for (const [, dests] of before.allDests()) legal += dests.size();
      const isCapture = before.board.get(move.to) !== undefined
        || (piece.role === "pawn" && move.from % 8 !== move.to % 8);
      rows.push({
        t, role: piece.role, color, from: move.from, to: move.to,
        isPawn: piece.role === "pawn",
        isCapture,
        isCheck: after.isCheck(),
        isForced: legal <= 1,
        fromHome: (START_HOME[`${color} ${piece.role}`] ?? []).includes(makeSquare(move.from)),
        advancing: ((move.to >> 3) - (move.from >> 3)) * forward > 0,
        quiet: piece.role !== "pawn" && !isCapture && !after.isCheck(),
        dAuto: Number.isFinite(dAuto) ? dAuto : 0,
        dCenter,
        labeled: LABELS.find((l) => l.pack === t.pack && l.nodeId === t.nodeId),
      });
    }

    // ---- A. Authored-target recall -----------------------------------------
    const authoredLines: string[] = [];
    let recallHits = 0;
    let recallTotal = 0;
    for (const label of LABELS.filter((l) => l.targets.length > 0)) {
      const row = rows.find((r) => r.t.pack === label.pack && r.t.nodeId === label.nodeId);
      if (row === undefined) { authoredLines.push(`| ${label.pack} | ${label.nodeId} | NOT FOUND | | | |`); continue; }
      let targets = SquareSet.empty();
      for (const name of label.targets) targets = targets.with(parseSquare(name)!);
      const dFrom = distanceToSet(row.role, row.from, targets);
      const dTo = distanceToSet(row.role, row.to, targets);
      recallTotal += 1;
      if (dTo < dFrom) recallHits += 1;
      authoredLines.push(`| ${label.pack} | ${label.nodeId} | ${row.t.san} (${row.t.uci}) | ${row.role} | {${label.targets.join(",")}} | ${dFrom} → ${dTo} | ${dTo < dFrom ? "**fires**" : dTo === dFrom ? "flat" : "away"} | ${row.advancing ? "advancing" : (row.to >> 3) === (row.from >> 3) ? "lateral" : "backward"} |`);
    }

    // ---- B. Autonomous firing rate -----------------------------------------
    const quiet = rows.filter((r) => r.quiet);
    const quietNonDev = quiet.filter((r) => !r.fromHome);
    const quietRetreat = quietNonDev.filter((r) => !r.advancing);
    const fires = (set: Row[], key: "dAuto" | "dCenter"): number => set.filter((r) => r[key] > 0).length;
    const labeledArrival = rows.filter((r) => r.labeled !== undefined && r.labeled.targets.length > 0 && r.labeled.reasonKind === "arrival");

    const firedAuto = rows.filter((r) => r.dAuto > 0);
    const firedAutoQuiet = quiet.filter((r) => r.dAuto > 0);
    const firedRetreat = quietRetreat.filter((r) => r.dAuto > 0);
    const labeledFiredAuto = labeledArrival.filter((r) => r.dAuto > 0).length;

    const pct = (a: number, b: number): string => `${((a / b) * 100).toFixed(1)}%`;

    // ---- C. distribution of the delta over quiet piece moves ---------------
    const hist = new Map<number, number>();
    for (const r of quiet) hist.set(r.dAuto, (hist.get(r.dAuto) ?? 0) + 1);

    // ---- D. base rates ------------------------------------------------------
    const backwardOrLateral = rows.filter((r) => !r.advancing && !r.isPawn).length;

    // ---- F. discriminating power: how many LEGAL ALTERNATIVES at the same
    // position also reduce distance to the author's own named target set?
    const competitionLines: string[] = [];
    let compSamePieceSum = 0;
    let compAllSum = 0;
    let compRows = 0;
    for (const label of LABELS.filter((l) => l.targets.length > 0 && l.reasonKind === "arrival")) {
      const row = rows.find((r) => r.t.pack === label.pack && r.t.nodeId === label.nodeId);
      if (row === undefined) continue;
      let targets = SquareSet.empty();
      for (const name of label.targets) targets = targets.with(parseSquare(name)!);
      const before = pos(row.t.parentFen);
      const dFrom = distanceToSet(row.role, row.from, targets);
      let samePiece = 0;
      let samePieceTotal = 0;
      let allMoves = 0;
      let allTotal = 0;
      for (const [from, dests] of before.allDests()) {
        const piece = before.board.get(from)!;
        for (const to of dests) {
          allTotal += 1;
          const d0 = distanceToSet(piece.role, from, targets);
          const d1 = distanceToSet(piece.role, to, targets);
          if (d1 < d0) allMoves += 1;
          if (from === row.from) {
            samePieceTotal += 1;
            if (d1 < dFrom) samePiece += 1;
          }
        }
      }
      compSamePieceSum += samePiece / samePieceTotal;
      compAllSum += allMoves / allTotal;
      compRows += 1;
      competitionLines.push(`| ${label.pack} | ${label.nodeId} | ${row.t.san} | {${label.targets.join(",")}} | ${samePiece}/${samePieceTotal} | ${allMoves}/${allTotal} |`);
    }

    // ---- G. firings by role and phase --------------------------------------
    const byRole = new Map<string, [number, number]>();
    for (const r of rows) {
      const cur = byRole.get(r.role) ?? [0, 0];
      cur[1] += 1;
      if (r.dAuto > 0) cur[0] += 1;
      byRole.set(r.role, cur);
    }
    const byPhase = new Map<string, [number, number]>();
    for (const r of rows) {
      const cur = byPhase.get(r.t.phase) ?? [0, 0];
      cur[1] += 1;
      if (r.dAuto > 0) cur[0] += 1;
      byPhase.set(r.t.phase, cur);
    }

    const report = [
      `# R2 raw output — ${rows.length} spine transitions, 35 packs`,
      "",
      "## A. Recall against author-declared arrival squares",
      "",
      "| Pack | Node | Move | Role | Author's named target(s) | Empty-board graph distance | Delta | Direction |",
      "|---|---|---|---|---|---|---|---|",
      ...authoredLines,
      "",
      `Recall: **${recallHits}/${recallTotal}** author-declared repositions register a strictly reduced graph distance to the author's own named square set.`,
      "",
      "## A2. Author-labeled retreats/reroutes that name NO arrival square",
      "",
      "| Pack | Node | Author's stated reason | Primitive that would carry it |",
      "|---|---|---|---|",
      ...LABELS.filter((l) => l.targets.length === 0 || l.reasonKind !== "arrival").map((l) => `| ${l.pack} | ${l.nodeId} | ${l.reasonKind} — "${l.quote}" | ${l.reasonKind === "vacation" ? "vacationReading (square freed for another piece)" : l.reasonKind === "attack_set" ? "attacks created (P1)" : l.reasonKind === "safety" ? "escape/safety census (P5)" : "none — no arrival named"} |`),
      "",
      "## B. Autonomous firing rate (target set computed, not authored)",
      "",
      "Target set = squares no enemy pawn can ever attack (shipped `pawn_safe_square` arithmetic),",
      "restricted to the enemy half, minus squares the mover's own pieces occupy.",
      "",
      `- All transitions: **${firedAuto.length}/${rows.length} = ${pct(firedAuto.length, rows.length)}** fire ("this move reduces distance to a good square").`,
      `- Quiet piece moves (non-pawn, non-capture, non-check): **${firedAutoQuiet.length}/${quiet.length} = ${pct(firedAutoQuiet.length, quiet.length)}**.`,
      `- Quiet, non-developing (piece not on its game-start square), backward or lateral only: **${firedRetreat.length}/${quietRetreat.length} = ${pct(firedRetreat.length, quietRetreat.length)}**.`,
      `- Naive centre target set, all transitions: **${fires(rows, "dCenter")}/${rows.length} = ${pct(fires(rows, "dCenter"), rows.length)}**.`,
      "",
      `Author-declared arrival repositions among the firings: **${labeledFiredAuto}** of ${firedAuto.length}.`,
      `Precision against the authored label set: **${pct(labeledFiredAuto, firedAuto.length)}** — false-positive rate **${pct(firedAuto.length - labeledFiredAuto, firedAuto.length)}**.`,
      `Restricted to the sharpest filter (quiet, non-developing, backward/lateral): precision **${pct(labeledArrival.filter((r) => r.dAuto > 0 && r.quiet && !r.fromHome && !r.advancing).length, Math.max(firedRetreat.length, 1))}**, false-positive rate **${pct(firedRetreat.length - labeledArrival.filter((r) => r.dAuto > 0 && r.quiet && !r.fromHome && !r.advancing).length, Math.max(firedRetreat.length, 1))}**.`,
      "",
      "## C. Distribution of the distance delta over quiet piece moves",
      "",
      "| delta (squares closer) | count |",
      "|---|---|",
      ...[...hist].sort((a, b) => b[0] - a[0]).map(([d, c]) => `| ${d > 0 ? `+${d}` : d} | ${c} |`),
      "",
      "## D. Base rates",
      "",
      `- Backward or lateral non-pawn moves in the corpus: ${backwardOrLateral}/${rows.length} = ${pct(backwardOrLateral, rows.length)}`,
      `- Quiet piece moves: ${quiet.length}/${rows.length} = ${pct(quiet.length, rows.length)}`,
      `- Quiet, non-developing, backward/lateral: ${quietRetreat.length}/${rows.length} = ${pct(quietRetreat.length, rows.length)}`,
      `- Corpus-wide author-labeled repositions with a named arrival square: ${LABELS.filter((l) => l.targets.length > 0 && l.reasonKind === "arrival").length}`,
      "",
      "## E. Sample of the firings on quiet, non-developing, backward/lateral moves",
      "",
      "| Pack | Node | Move | delta | author-labeled? |",
      "|---|---|---|---|---|",
      ...firedRetreat.slice(0, 40).map((r) => `| ${r.t.pack} | ${r.t.nodeId} | ${r.t.san} | +${r.dAuto} | ${r.labeled ? r.labeled.reasonKind : "no"} |`),
      "",
      "## F. Discriminating power — legal alternatives that also reduce distance to the SAME authored target",
      "",
      "| Pack | Node | Move played | Author's target | Same piece's own moves that also close | All legal moves that close |",
      "|---|---|---|---|---|---|",
      ...competitionLines,
      "",
      `Mean share of the moved piece's own legal moves that also reduce distance to the authored target: **${((compSamePieceSum / compRows) * 100).toFixed(1)}%**.`,
      `Mean share of ALL legal moves in the position that reduce distance to the authored target: **${((compAllSum / compRows) * 100).toFixed(1)}%**.`,
      "",
      "## G. Autonomous firing rate by role and by phase",
      "",
      "| Role | fires / moves | rate |",
      "|---|---|---|",
      ...[...byRole].sort((a, b) => b[1][0] - a[1][0]).map(([role, [f, n]]) => `| ${role} | ${f}/${n} | ${pct(f, n)} |`),
      "",
      "| Pack phase | fires / moves | rate |",
      "|---|---|---|",
      ...[...byPhase].map(([phase, [f, n]]) => `| ${phase} | ${f}/${n} | ${pct(f, n)} |`),
      "",
    ].join("\n");
    writeFileSync(new URL("./r2-output.md", import.meta.url).pathname, report);
    console.log(report);
  });
});
