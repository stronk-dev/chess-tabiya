import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { makeSan } from "chessops/san";
import { makeUci, parseUci } from "chessops/util";
import { assertConsumerEvidenceView, declareSourcingRecordEvidence, evidenceForConsumer, type ConsumerEvidenceView } from "@chess-tabiya/runtime";

import type { TablebaseCategory } from "../tablebase.js";
import { EVIDENCE_MANIFEST } from "../evidence-manifest.js";
import { learnerCategory } from "./tablebase-category.js";
import { sha256 } from "./canonical.js";
import { issue, object } from "./ledger-validation.js";
import type { ClaimAssertion, ClaimBinding, EvidenceLedger, EvidenceRecord, SourcingIssue } from "./types.js";

export const CLAIM_ASSERTION_KINDS = Object.freeze([
  "tablebase.category@v1", "tablebase.dtm@v1", "tablebase.dtz@v1", "tablebase.pieceCount@v1",
  "tablebase.moveCategory@v1", "tablebase.lineUniformCategory@v1", "tablebase.moveCensus@v1",
  "tablebase.uniqueMoveOfCategory@v1", "engine.centipawns@v1", "engine.depth@v1",
  "explorer.total@v1", "explorer.scorePct@v1", "explorer.moveSharePct@v1",
  "explorer.window@v1", "explorer.ratingBand@v1",
] as const);

export interface ValidatedClaimBinding {
  readonly binding: ClaimBinding;
  readonly pointer: string;
  readonly claimId: string;
  readonly instrumentKinds: readonly EvidenceRecord["kind"][];
  readonly rendered: readonly string[];
  readonly authorSpans: readonly string[];
  readonly disposition: "ledger_bound" | "author_attributed";
}

type AssertionResult = { readonly value: unknown; readonly recordKind: EvidenceRecord["kind"]; readonly rendered: string };

function positions(pack: DrillPackDefinition): { readonly reached: ReadonlySet<string>; readonly pathSets: readonly ReadonlySet<string>[] } {
  const reached = new Set<string>([pack.start.fen]);
  const paths: Set<string>[] = [];
  const root = Chess.fromSetup(parseFen(pack.start.fen).unwrap()).unwrap();
  const walk = (nodes: DrillPackDefinition["spine"], board: Chess, path: readonly string[]): void => {
    if (nodes === undefined || nodes.length === 0) { paths.push(new Set(path)); return; }
    for (const node of nodes) {
      const next = board.clone();
      const move = parseUci(node.moveUci);
      if (move === undefined || !next.isLegal(move)) continue;
      next.play(move);
      const fen = makeFen(next.toSetup());
      reached.add(fen);
      walk(node.children, next, [...path, fen]);
    }
  };
  walk(pack.spine ?? [], root, [pack.start.fen]);
  for (const fen of [...reached]) {
    const board = Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
    for (const [from, destinations] of board.allDests()) for (const to of destinations) {
      const next = board.clone(); next.play({ from, to }); reached.add(makeFen(next.toSetup()));
    }
  }
  return { reached, pathSets: paths };
}

function uniqueRecord(records: readonly EvidenceRecord[], kind: EvidenceRecord["kind"], fen: string): EvidenceRecord | undefined {
  const found = records.filter((record) => record.kind === kind && (record.values.fen === fen || record.anchor.fen === fen));
  return found.length === 1 ? found[0] : undefined;
}

function categoryFor(pack: DrillPackDefinition, fen: string, record: EvidenceRecord): TablebaseCategory | undefined {
  const category = record.values.category;
  if (typeof category !== "string") return;
  const side = fen.split(" ")[1] === "b" ? "black" : "white";
  return learnerCategory(side, category as TablebaseCategory, pack.start.side);
}

function legalSuccessors(fen: string): readonly { readonly fen: string; readonly san: string; readonly uci: string }[] {
  const board = Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
  const result: { fen: string; san: string; uci: string }[] = [];
  for (const [from, destinations] of board.allDests()) for (const to of destinations) {
    const move = { from, to };
    const san = makeSan(board, move), uci = makeUci(move), next = board.clone();
    next.play(move); result.push({ fen: makeFen(next.toSetup()), san, uci });
  }
  return result;
}

function requiredFen(assertion: ClaimAssertion): string | undefined {
  return typeof assertion.args.fen === "string" ? assertion.args.fen : undefined;
}

function evaluate(pack: DrillPackDefinition, ledger: EvidenceLedger, assertion: ClaimAssertion, reached: ReadonlySet<string>, pathSets: readonly ReadonlySet<string>[], path: string, issues: SourcingIssue[]): AssertionResult | undefined {
  if (!(CLAIM_ASSERTION_KINDS as readonly string[]).includes(assertion.kind)) { issues.push(issue("CLAIM_ASSERTION_UNRECORDED", path, `unknown assertion ${assertion.kind}`)); return; }
  const fen = requiredFen(assertion);
  const fens = Array.isArray(assertion.args.fens) && assertion.args.fens.every((value) => typeof value === "string") ? assertion.args.fens as string[] : undefined;
  for (const candidate of [...(fen === undefined ? [] : [fen]), ...(fens ?? [])]) if (!reached.has(candidate)) { issues.push(issue("CLAIM_FEN_OFF_PACK", path, `assertion FEN is not reachable from this pack: ${candidate}`)); return; }
  const tablebase = (target: string): EvidenceRecord | undefined => uniqueRecord(ledger.records, "tablebase_result", target);
  const engine = (target: string): EvidenceRecord | undefined => uniqueRecord(ledger.records, "engine_eval", target);
  const explorer = (target: string): EvidenceRecord | undefined => uniqueRecord(ledger.records, "explorer_position_census", target);
  const unrecorded = (): undefined => { issues.push(issue("CLAIM_ASSERTION_UNRECORDED", path, `${assertion.kind} has no unique matching record`)); return; };

  if (assertion.kind.startsWith("tablebase.") && assertion.kind !== "tablebase.lineUniformCategory@v1" && fen === undefined) return unrecorded();
  if (assertion.kind === "tablebase.category@v1" || assertion.kind === "tablebase.dtm@v1" || assertion.kind === "tablebase.dtz@v1" || assertion.kind === "tablebase.pieceCount@v1") {
    const record = tablebase(fen!); if (record === undefined) return unrecorded();
    const key = assertion.kind.split(".")[1]!.split("@")[0]!;
    const value = key === "category" ? categoryFor(pack, fen!, record) : record.values[key];
    if (value === undefined) return unrecorded();
    return { value, recordKind: "tablebase_result", rendered: `Syzygy at ${fen}: ${key} ${String(value)}.` };
  }
  if (assertion.kind === "tablebase.moveCategory@v1") {
    const uci = assertion.args.uci; if (typeof uci !== "string") return unrecorded();
    const board = Chess.fromSetup(parseFen(fen!).unwrap()).unwrap(), move = parseUci(uci);
    if (move === undefined || !board.isLegal(move)) return unrecorded(); board.play(move);
    const successor = makeFen(board.toSetup()), record = tablebase(successor); if (record === undefined) return unrecorded();
    const value = categoryFor(pack, successor, record); if (value === undefined) return unrecorded();
    return { value, recordKind: "tablebase_result", rendered: `Syzygy after ${uci}: category ${value}.` };
  }
  if (assertion.kind === "tablebase.lineUniformCategory@v1") {
    if (fens === undefined || !pathSets.some((set) => set.size === fens.length && fens.every((value) => set.has(value)))) { issues.push(issue("CLAIM_ASSERTION_UNRECORDED", path, "fens must equal one authored spine line")); return; }
    const values = fens.map((value) => { const record = tablebase(value); return record === undefined ? undefined : categoryFor(pack, value, record); });
    if (values.some((value) => value === undefined) || new Set(values).size !== 1) return unrecorded();
    return { value: values[0], recordKind: "tablebase_result", rendered: `Syzygy: all ${fens.length} authored positions have category ${String(values[0])}.` };
  }
  if (assertion.kind === "tablebase.moveCensus@v1" || assertion.kind === "tablebase.uniqueMoveOfCategory@v1") {
    const successors = legalSuccessors(fen!);
    const rows = successors.map((successor) => { const record = tablebase(successor.fen); return record === undefined ? undefined : { ...successor, category: categoryFor(pack, successor.fen, record), record }; });
    if (rows.some((row) => row === undefined || row.category === undefined)) { issues.push(issue("CLAIM_CENSUS_INCOMPLETE", path, `recorded ${rows.filter(Boolean).length} of ${successors.length} legal successors`)); return; }
    if (assertion.kind === "tablebase.uniqueMoveOfCategory@v1") {
      const category = assertion.args.category;
      const matching = rows.filter((row) => row!.category === category);
      if (matching.length !== 1) return unrecorded();
      return { value: matching[0]!.san, recordKind: "tablebase_result", rendered: `Syzygy at ${fen}: ${matching[0]!.san} is the unique ${String(category)} move.` };
    }
    const select = assertion.select ?? "total";
    const value = select === "total" ? rows.length : rows.filter((row) => select === "stalemate" || select === "checkmate" ? row!.record.values[select] === true : row!.category === select).length;
    return { value, recordKind: "tablebase_result", rendered: `Syzygy at ${fen}: ${value} of ${rows.length} legal moves match ${select}.` };
  }
  if (assertion.kind === "engine.centipawns@v1" || assertion.kind === "engine.depth@v1") {
    const record = engine(fen!); if (record === undefined) return unrecorded();
    const key = assertion.kind.includes("centipawns") ? "centipawns" : "depth", value = record.values[key]; if (!Number.isInteger(value)) return unrecorded();
    return { value, recordKind: "engine_eval", rendered: `Engine at ${fen}: ${key} ${String(value)}.` };
  }
  if (fen === undefined) return unrecorded();
  const record = explorer(fen); if (record === undefined) return unrecorded();
  let value: unknown;
  if (assertion.kind === "explorer.total@v1") value = record.values.total;
  else if (assertion.kind === "explorer.scorePct@v1") {
    const side = assertion.args.side; value = side === "white" ? record.values.whitePct : side === "black" ? record.values.blackPct : side === "draw" ? record.values.drawPct : undefined;
  } else if (assertion.kind === "explorer.moveSharePct@v1") {
    const san = assertion.args.san; const row = Array.isArray(record.values.topMoves) ? record.values.topMoves.find((raw) => object(raw) && raw.san === san) : undefined; value = object(row) ? row.sharePct : undefined;
  } else if (assertion.kind === "explorer.window@v1") value = record.values[assertion.select ?? "since"];
  else if (assertion.kind === "explorer.ratingBand@v1") {
    const ratings = record.values.ratings; value = Array.isArray(ratings) ? `${Math.min(...ratings.map(Number))}-${Math.max(...ratings.map(Number))}` : undefined;
  }
  if (value === undefined) return unrecorded();
  return { value, recordKind: "explorer_position_census", rendered: `Lichess explorer at ${fen}: ${assertion.kind.replace("@v1", "")} ${String(value)}.` };
}

const CARDINALS: Readonly<Record<string, number>> = Object.freeze({ zero:0, one:1, two:2, three:3, four:4, five:5, six:6, seven:7, eight:8, nine:9, ten:10, eleven:11, twelve:12, thirteen:13, fourteen:14, fifteen:15, sixteen:16, seventeen:17, eighteen:18, nineteen:19, twenty:20, thirty:30, forty:40, fifty:50, sixty:60, seventy:70, eighty:80, ninety:90, first:1, second:2, third:3, fourth:4, fifth:5, sixth:6, seventh:7, eighth:8, ninth:9, tenth:10, eleventh:11, twelfth:12, thirteenth:13, fourteenth:14, fifteenth:15, sixteenth:16, seventeenth:17, eighteenth:18, nineteenth:19, twentieth:20 });
function wordNumber(raw: string): number | undefined { const parts = raw.toLowerCase().split("-"); if (parts.length === 1) return CARDINALS[parts[0]!]; const values = parts.map((part) => CARDINALS[part]); return values.every((value) => value !== undefined) ? values.reduce((sum, value) => sum + value!, 0) : undefined; }
function normalizes(span: string, assertion: ClaimAssertion, value: unknown): boolean {
  const raw = span.trim();
  if (assertion.kind === "engine.centipawns@v1") return raw.replace("+", "") === (Number(value) / 100).toFixed(2);
  if (assertion.kind.includes("Pct@v1")) return Number.parseFloat(raw.replace("%", "")) === Number(value);
  if (typeof value === "number") return Number(raw.replaceAll(",", "")) === value || wordNumber(raw) === value;
  if (assertion.kind.includes("Category") || assertion.kind === "tablebase.category@v1" || assertion.kind === "tablebase.lineUniformCategory@v1") {
    const forms: Readonly<Record<string,string>> = { drawn:"draw", lost:"loss", won:"win" }; return (forms[raw.toLowerCase()] ?? raw.toLowerCase()) === String(value).toLowerCase();
  }
  return raw === String(value);
}

const MACHINE_TOKEN = /(?:\b\d+(?:[,.]\d+)*(?:%|st|nd|rd|th)?\b|\b(?:zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth|thirteenth|fourteenth|fifteenth|sixteenth|seventeenth|eighteenth|nineteenth|twentieth)(?:-[a-z]+)?\b|\b(?:[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](?:=[QRBN])?[+#]?|[a-h][1-8])\b|\b(?:win|won|draw|drawn|loss|lost|stalemate|checkmate)\b)/gi;
const RATE_TOKEN = /(?:[+-]?\d+\.\d+%?)/;
export const MACHINE_LABEL_EVIDENCE_KINDS: Readonly<Record<string, readonly EvidenceRecord["kind"][]>> = Object.freeze({ corpus_observed:["explorer_frequency","explorer_position_census"], engine_validated:["engine_eval"], tablebase_exact:["tablebase_result"] });

const CLAIM_RECORD_PROJECTION: Partial<Record<EvidenceRecord["kind"], string>> = Object.freeze({
  engine_eval: "sourcing.ledger.engine_eval",
  tablebase_result: "sourcing.ledger.tablebase_result",
  explorer_position_census: "sourcing.ledger.explorer_position_census",
  opening_identity: "theory.opening_identity.record",
});

export function consumeClaimBindingRecords(view: ConsumerEvidenceView<EvidenceRecord>): readonly EvidenceRecord[] {
  assertConsumerEvidenceView(view);
  if (view.consumer.id !== "authoring.claim_binding" || view.consumer.version !== 1) throw new TypeError("Expected authoring.claim_binding@1 consumer view");
  return Object.freeze(view.items.map((item) => item.payload));
}

function claimBindingLedger(ledger: EvidenceLedger): EvidenceLedger {
  const declared = ledger.records.flatMap((record) => {
    const projection = CLAIM_RECORD_PROJECTION[record.kind];
    const declared = projection === undefined ? undefined : declareSourcingRecordEvidence(record);
    return declared === undefined ? [] : [declared];
  });
  const records = consumeClaimBindingRecords(evidenceForConsumer(
    EVIDENCE_MANIFEST,
    { id: "authoring.claim_binding", version: 1 },
    declared,
  ));
  return Object.freeze({ ...ledger, records });
}

function segments(text: string): readonly string[] {
  return text.split(/(?<=[.?!])\s+(?=[A-Z"'“(])|(?<=[;:])\s+|\s+[—–]\s+|\s+-\s+|,?\s+(?=(?:so|therefore|thus|hence|which means|because|since)\b)/i).map((part) => part.trim()).filter(Boolean);
}

export function validateClaimBindings(pack: DrillPackDefinition, ledger: EvidenceLedger, issues: SourcingIssue[]): readonly ValidatedClaimBinding[] {
  ledger = claimBindingLedger(ledger);
  const result: ValidatedClaimBinding[] = [], seen = new Set<string>(), positionSets = positions(pack);
  for (const [bindingIndex, binding] of (ledger.claimBindings ?? []).entries()) {
    const base = `/claimBindings/${bindingIndex}`, before = issues.length;
    if (!/^\/feedbackClaims\/\d+\/text$/.test(binding.pointer)) issues.push(issue("CLAIM_POINTER_INVALID", `${base}/pointer`, "pointer must address feedbackClaims/<i>/text"));
    const index = Number(binding.pointer.split("/")[2]), claim = pack.feedbackClaims?.[index];
    if (claim === undefined || claim.id !== binding.claimId) issues.push(issue("CLAIM_POINTER_REBOUND", `${base}/pointer`, "pointer no longer resolves to the declared claim id"));
    else if (sha256(claim.text) !== binding.textSha256) issues.push(issue("CLAIM_TEXT_DRIFTED", `${base}/textSha256`, "claim text differs from the bound digest"));
    if (seen.has(binding.claimId)) issues.push(issue("CLAIM_BINDING_DUPLICATE", `${base}/claimId`, `duplicate binding for ${binding.claimId}`));
    seen.add(binding.claimId);
    if (claim === undefined) continue;
    const kinds: EvidenceRecord["kind"][] = [], rendered: string[] = [], authored: string[] = [];
    let remainder = claim.text;
    const instrumentRanges: { start:number; end:number }[] = [];
    for (const [spanIndex, span] of binding.spans.entries()) {
      const spanPath = `${base}/spans/${spanIndex}`, escaped = span.span.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), occurrences = [...claim.text.matchAll(new RegExp(/^\w[\w-]*$/.test(span.span) ? `\\b${escaped}\\b` : escaped, "g"))];
      if (occurrences.length === 0) { issues.push(issue("CLAIM_SPAN_ABSENT", `${spanPath}/span`, "span is absent from claim text")); continue; }
      if (occurrences.length > 1) { issues.push(issue("CLAIM_SPAN_AMBIGUOUS", `${spanPath}/span`, "span occurs more than once")); continue; }
      remainder = remainder.replace(span.span, " ");
      if ("authored" in span) authored.push(span.span);
      else {
        const evaluated = evaluate(pack, ledger, span.assertion, positionSets.reached, positionSets.pathSets, `${spanPath}/assertion`, issues);
        if (evaluated !== undefined) {
          if (!normalizes(span.span, span.assertion, evaluated.value)) issues.push(issue("CLAIM_SPAN_CONTRADICTED", `${spanPath}/span`, `span does not equal assertion result ${String(evaluated.value)}`));
          else { kinds.push(evaluated.recordKind); rendered.push(evaluated.rendered); const start=occurrences[0]!.index!; instrumentRanges.push({start,end:start+span.span.length}); }
        }
      }
    }
    const residue = remainder.match(MACHINE_TOKEN);
    if (residue !== null) issues.push(issue("CLAIM_ASSERTION_UNDECLARED", base, `undeclared machine-shaped token ${residue[0]}`));
    const authorSegments = segments(claim.text).filter((segment) => { const start=claim.text.indexOf(segment), end=start+segment.length; return !instrumentRanges.some((range) => range.start >= start && range.end <= end); });
    if (authorSegments.length > 0 && !claim.evidenceTypes.includes("author_principle")) issues.push(issue("CLAIM_AUTHOR_LABEL_REQUIRED", `/feedbackClaims/${index}/evidenceTypes`, "this claim contains authored assertion; add author_principle and name the principle it rests on"));
    for (const label of claim.evidenceTypes) if (MACHINE_LABEL_EVIDENCE_KINDS[label] !== undefined && !kinds.some((kind) => MACHINE_LABEL_EVIDENCE_KINDS[label]!.includes(kind))) issues.push(issue("CLAIM_LABEL_UNEARNED", `/feedbackClaims/${index}/evidenceTypes`, `${label} has no instrument-attributed segment`));
    if (authorSegments.some((segment) => RATE_TOKEN.test(segment))) issues.push(issue("CLAIM_READING_UNATTRIBUTED", `/feedbackClaims/${index}/text`, "a rate cannot be routed as authored judgement"));
    if (issues.length === before) result.push(Object.freeze({ binding, pointer: binding.pointer, claimId: binding.claimId, instrumentKinds: Object.freeze(kinds), rendered: Object.freeze(rendered), authorSpans: Object.freeze(authorSegments), disposition: authorSegments.length === 0 ? "ledger_bound" : "author_attributed" }));
  }
  return Object.freeze(result);
}

export function claimBindingForPointer(bindings: readonly ValidatedClaimBinding[], pointer: string): ValidatedClaimBinding | undefined {
  return bindings.find((binding) => binding.pointer === pointer);
}
