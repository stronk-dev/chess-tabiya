// DISPOSABLE content-wave instrument — D1007 exact span/assertion audit. Never writes content.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { makeUci, parseUci } from "chessops/util";
import type { DrillPackDefinition, FeedbackClaim, SpineNode } from "@chess-tabiya/schema/drill-pack";
import { describe, expect, it } from "vitest";

import { validateClaimBindings } from "../../apps/server/src/sourcing/claim-binding.js";
import { sha256 } from "../../apps/server/src/sourcing/canonical.js";
import type { ClaimAssertion, ClaimBinding, EvidenceLedger, SourcingIssue } from "../../apps/server/src/sourcing/types.js";

const DRAFTS = resolve(new URL("../../content/drafts/", import.meta.url).pathname);
const MACHINE_TOKEN = /(?:\b\d+(?:[,.]\d+)*(?:%|st|nd|rd|th)?\b|\b(?:zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth|thirteenth|fourteenth|fifteenth|sixteenth|seventeenth|eighteenth|nineteenth|twentieth)(?:-[a-z]+)?\b|\b(?:[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](?:=[QRBN])?[+#]?|[a-h][1-8])\b|\b(?:win|won|draw|drawn|loss|lost|stalemate|checkmate)\b)/giu;
const ASSERTION_FAILURES = new Set(["CLAIM_SPAN_CONTRADICTED", "CLAIM_ASSERTION_UNRECORDED", "CLAIM_FEN_OFF_PACK", "CLAIM_CENSUS_INCOMPLETE"]);

interface PositionGraph { readonly reached: readonly string[]; readonly paths: readonly (readonly string[])[]; readonly moves: readonly { from: string; uci: string }[] }
interface Candidate { readonly span: string; readonly assertion: ClaimAssertion }

function graph(pack: DrillPackDefinition): PositionGraph {
  const reached = new Set<string>([pack.start.fen]);
  const paths: string[][] = [];
  const moves: { from: string; uci: string }[] = [];
  const root = Chess.fromSetup(parseFen(pack.start.fen).unwrap()).unwrap();
  const walk = (nodes: readonly SpineNode[], board: Chess, path: readonly string[]): void => {
    if (nodes.length === 0) { paths.push([...path]); return; }
    for (const node of nodes) {
      const next = board.clone(), move = parseUci(node.moveUci);
      if (move === undefined || !next.isLegal(move)) continue;
      moves.push({ from: makeFen(board.toSetup()), uci: node.moveUci });
      next.play(move);
      const fen = makeFen(next.toSetup()); reached.add(fen);
      walk(node.children, next, [...path, fen]);
    }
  };
  walk(pack.spine ?? [], root, [pack.start.fen]);
  return { reached: [...reached], paths, moves };
}

function assertions(pack: DrillPackDefinition, ledger: EvidenceLedger): readonly ClaimAssertion[] {
  const result: ClaimAssertion[] = [];
  const positions = graph(pack);
  const recorded = new Set(ledger.records.map((record) => `${record.kind}:${String(record.values.fen ?? record.anchor.fen)}`));
  for (const fen of positions.reached) {
    if (recorded.has(`tablebase_result:${fen}`)) {
      for (const key of ["category", "dtm", "dtz", "pieceCount"] as const) result.push({ kind: `tablebase.${key}@v1`, args: { fen } });
      for (const select of ["total", "win", "draw", "loss", "stalemate", "checkmate"] as const) result.push({ kind: "tablebase.moveCensus@v1", args: { fen }, select });
      for (const category of ["win", "draw", "loss"] as const) result.push({ kind: "tablebase.uniqueMoveOfCategory@v1", args: { fen, category } });
    }
    if (recorded.has(`engine_eval:${fen}`)) for (const key of ["centipawns", "depth"] as const) result.push({ kind: `engine.${key}@v1`, args: { fen } });
  }
  for (const move of positions.moves) result.push({ kind: "tablebase.moveCategory@v1", args: { fen: move.from, uci: move.uci } });
  for (const fens of positions.paths) result.push({ kind: "tablebase.lineUniformCategory@v1", args: { fens } });
  return result;
}

function tokens(claim: FeedbackClaim): readonly string[] {
  const matches = [...claim.text.matchAll(MACHINE_TOKEN)].map((match) => match[0]);
  return [...new Set(matches)].filter((span) => matches.filter((candidate) => candidate === span).length === 1);
}

function segments(text: string): readonly string[] {
  return text.split(/(?<=[.?!])\s+(?=[A-Z"'“(])|(?<=[;:])\s+|\s+[—–]\s+|\s+-\s+|,?\s+(?=(?:so|therefore|thus|hence|which means|because|since)\b)/iu).map((part) => part.trim()).filter(Boolean);
}

function binding(claim: FeedbackClaim, index: number, spans: ClaimBinding["spans"]): ClaimBinding {
  return { claimId: claim.id, pointer: `/feedbackClaims/${index}/text`, textSha256: sha256(claim.text), spans };
}

function assertionWorks(pack: DrillPackDefinition, ledger: EvidenceLedger, claim: FeedbackClaim, index: number, candidate: Candidate): boolean {
  const issues: SourcingIssue[] = [];
  validateClaimBindings(pack, { ...ledger, claimBindings: [binding(claim, index, [{ span: candidate.span, assertion: candidate.assertion }])] }, issues);
  return !issues.some((issue) => ASSERTION_FAILURES.has(issue.code));
}

function bestCandidate(span: string, candidates: readonly Candidate[], claim: FeedbackClaim): Candidate | undefined {
  const context = claim.text.slice(Math.max(0, claim.text.indexOf(span) - 45), claim.text.indexOf(span) + span.length + 45).toLowerCase();
  const score = (candidate: Candidate): number => {
    const kind = candidate.assertion.kind;
    let value = kind.includes("category") || kind.includes("Category") ? 5 : kind.includes("centipawns") ? 4 : kind.includes("pieceCount") ? 3 : kind.includes("dtm") || kind.includes("dtz") ? 2 : 0;
    if (/pieces?/u.test(context) && kind.includes("pieceCount")) value += 20;
    if (/depth/u.test(context) && kind.includes("depth")) value += 20;
    if (/(?:root|exact position)/u.test(context) && candidate.assertion.args.fen === (claim as any).__rootFen) value += 15;
    if (/(?:every position|authored line|along the)/u.test(context) && kind.includes("lineUniform")) value += 20;
    return value;
  };
  return [...candidates].sort((left, right) => score(right) - score(left))[0];
}

function candidateBinding(pack: DrillPackDefinition, ledger: EvidenceLedger, claim: FeedbackClaim, index: number): { readonly binding?: ClaimBinding; readonly issues: readonly string[]; readonly candidates: number } {
  Object.defineProperty(claim, "__rootFen", { value: pack.start.fen, configurable: true });
  const possible = assertions(pack, ledger);
  const chosen: Candidate[] = [];
  for (const span of tokens(claim)) {
    const matching = possible.map((assertion) => ({ span, assertion })).filter((candidate) => assertionWorks(pack, ledger, claim, index, candidate));
    const selected = bestCandidate(span, matching, claim);
    if (selected !== undefined) chosen.push(selected);
  }
  delete (claim as any).__rootFen;
  const authored = claim.evidenceTypes.includes("author_principle") ? segments(claim.text).filter((segment) => {
    const start = claim.text.indexOf(segment), end = start + segment.length;
    const hasInstrument = chosen.some((candidate) => { const at = claim.text.indexOf(candidate.span); return at >= start && at + candidate.span.length <= end; });
    return !hasInstrument && [...segment.matchAll(MACHINE_TOKEN)].length > 0 && claim.text.indexOf(segment) === claim.text.lastIndexOf(segment);
  }) : [];
  const value = binding(claim, index, [
    ...authored.map((span) => ({ span, authored: true as const })),
    ...chosen.map(({ span, assertion }) => ({ span, assertion })),
  ]);
  const issues: SourcingIssue[] = [];
  const valid = validateClaimBindings(pack, { ...ledger, claimBindings: [value] }, issues);
  return { ...(valid.length === 1 ? { binding: value } : {}), issues: [...new Set(issues.map((issue) => issue.code))].sort(), candidates: chosen.length };
}

describe("D1007/D1008 pure-join audit", () => {
  it("distinguishes record-kind co-presence and exposes a validator-green semantic false join", () => {
    const rows: { packId: string; claimId: string; result: ReturnType<typeof candidateBinding> }[] = [];
    for (const name of readdirSync(DRAFTS).filter((entry) => entry.endsWith(".json") && !entry.endsWith(".browser.json") && !/\.(?:evidence|graduation|job|sources)\.json$/u.test(entry)).sort()) {
      const file = resolve(DRAFTS, name), evidence = file.replace(/\.json$/u, ".evidence.json");
      if (!existsSync(evidence)) continue;
      const pack = JSON.parse(readFileSync(file, "utf8")) as DrillPackDefinition;
      const ledger = JSON.parse(readFileSync(evidence, "utf8")) as EvidenceLedger;
      for (const [index, claim] of (pack.feedbackClaims ?? []).entries()) {
        if (ledger.claimBindings?.some((entry) => entry.claimId === claim.id)) continue;
        const mapped = claim.evidenceTypes.flatMap((label) => label === "tablebase_exact" ? ["tablebase_result"] : label === "engine_validated" ? ["engine_eval"] : []);
        if (!mapped.some((kind) => ledger.records.some((record) => record.kind === kind))) continue;
        rows.push({ packId: pack.id, claimId: claim.id, result: candidateBinding(pack, ledger, claim, index) });
      }
    }
    const valid = rows.filter((row) => row.result.binding !== undefined);
    expect(rows).toHaveLength(43);
    expect(valid).toHaveLength(1);
    expect(rows.some((row) => row.result.issues.includes("CLAIM_LABEL_UNEARNED"))).toBe(true);
    expect(valid[0]).toMatchObject({
      packId: "mate-two-bishops",
      claimId: "result-not-moves",
      result: { binding: { spans: expect.arrayContaining([
        { span: "one", assertion: { kind: "tablebase.dtm@v1", args: { fen: "7k/8/6K1/2B5/8/8/B7/8 w - - 16 9" } } },
      ]) } },
    });
  }, 60_000);
});
