import { access } from "node:fs/promises";
import { resolve, sep } from "node:path";

import { digestDrillPack } from "@chess-tabiya/schema/drill-pack";
import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { parseUci } from "chessops/util";

import { validatePackDocument } from "../pack-validation.js";
import { readJson } from "./canonical.js";
import { EXPLORER_TEMPLATE_ID, renderExplorerFrequency, RATING_GROUPS, SPEEDS, type ExplorerTemplateValues } from "./explorer.js";
import {
  type EvidenceLedger,
  type EvidenceRecord,
  type SourceEntry,
  type SourceManifest,
  type SourcingIssue,
} from "./types.js";
import {
  assessmentGrounding,
  exactKeys,
  issue,
  linkage,
  nonEmpty,
  object,
  validateLedger,
  validateManifest,
  validIso,
} from "./ledger-validation.js";
const PROSE_POINTERS = [
  /^\/objective\/summary$/,
  /^\/planClasses\/\d+\/description$/,
  /^\/spine(?:\/\d+|\/children)*\/annotations\/\d+$/,
  /^\/deviations\/\d+\/note$/,
  /^\/feedbackClaims\/\d+\/text$/,
];

export interface SourcingCheckResult {
  readonly valid: boolean;
  readonly strict: boolean;
  readonly issues: readonly SourcingIssue[];
}

function resolvePointer(document: unknown, pointer: string): { found: boolean; value?: unknown } {
  if (pointer === "") return { found: true, value: document };
  if (!pointer.startsWith("/")) return { found: false };
  let current: unknown = document;
  for (const rawToken of pointer.slice(1).split("/")) {
    const token = rawToken.replaceAll("~1", "/").replaceAll("~0", "~");
    if (Array.isArray(current) && /^\d+$/.test(token)) current = current[Number(token)];
    else if (object(current) && Object.prototype.hasOwnProperty.call(current, token)) current = current[token];
    else return { found: false };
  }
  return { found: true, value: current };
}

function priorityLinkage(manifest: SourceManifest, value: unknown, issues: SourcingIssue[]): void {
  if (!object(value) || value.schema !== "tabiya.sourcing.priority.v1" || !["available", "unavailable"].includes(String(value.status)) || !validIso(value.sourcedAt) || !Array.isArray(value.rows) || !Array.isArray(value.abstentions) || !object(value.input)) {
    issues.push(issue("PRIORITY_INVALID", "/priority.json", "expected tabiya.sourcing.priority.v1 with input, sourcedAt, rows and abstentions"));
    return;
  }
  const references = [value.input, ...value.rows, ...value.abstentions].filter(object);
  const used = new Set<number>();
  for (const [index, reference] of references.entries()) {
    if (!nonEmpty(reference.sourceId) || !validIso(reference.retrievedAt)) {
      issues.push(issue("EVIDENCE_SOURCE_UNLINKED", `/priority/references/${index}`, "priority reference requires sourceId and retrievedAt"));
      continue;
    }
    const candidates = manifest.entries.map((entry, entryIndex) => ({ entry, entryIndex })).filter(({ entry }) => entry.sourceId === reference.sourceId);
    if (candidates.length === 0) {
      issues.push(issue("EVIDENCE_SOURCE_UNLINKED", `/priority/references/${index}/sourceId`, `no manifest entry has sourceId ${reference.sourceId}`));
      continue;
    }
    const exact = candidates.find(({ entry }) => entry.retrievedAt === reference.retrievedAt);
    if (!exact) {
      issues.push(issue("EVIDENCE_RETRIEVED_AT_MISMATCH", `/priority/references/${index}/retrievedAt`, `retrievedAt does not match the ${reference.sourceId} manifest entry`));
      continue;
    }
    used.add(exact.entryIndex);
  }
  manifest.entries.forEach((_entry, index) => { if (!used.has(index)) issues.push(issue("MANIFEST_ENTRY_UNUSED", `/entries/${index}`, "manifest entry is not referenced by priority data")); });
  const maximum = manifest.entries.map((entry) => entry.retrievedAt).sort().at(-1);
  if (value.sourcedAt !== maximum) issues.push(issue("EVIDENCE_TIMESTAMP_DERIVED", "/sourcedAt", `sourcedAt must equal maximum consumed retrievedAt ${String(maximum)}`));
}

function explorerTemplate(record: EvidenceRecord, pack: unknown, manifest: SourceManifest | undefined, recordIndex: number, issues: SourcingIssue[]): boolean {
  if (record.kind !== "explorer_frequency") return false;
  const path = `/records/${recordIndex}`;
  const keys = ["moveSan", "playedCount", "total", "sharePct", "ratings", "speeds", "since", "until"];
  const values = record.values;
  const validKeys = exactKeys(values as Record<string, unknown>, keys) && keys.every((key) => values[key] !== undefined);
  const ratings = values.ratings;
  const speeds = values.speeds;
  const valid = record.templateId === EXPLORER_TEMPLATE_ID && validKeys && nonEmpty(values.moveSan) && Number.isSafeInteger(values.playedCount) && Number(values.playedCount) >= 0 && Number.isSafeInteger(values.total) && Number(values.total) >= 100 && typeof values.sharePct === "number" && values.sharePct >= 0 && values.sharePct <= 100 && Array.isArray(ratings) && ratings.length > 0 && ratings.every((value) => RATING_GROUPS.includes(value as never)) && Array.isArray(speeds) && speeds.length > 0 && speeds.every((value) => SPEEDS.includes(value as never)) && /^\d{4}-(0[1-9]|1[0-2])$/.test(String(values.since)) && /^\d{4}-(0[1-9]|1[0-2])$/.test(String(values.until)) && Number(values.sharePct) === Math.round(Number(values.playedCount) / Number(values.total) * 1000) / 10;
  if (!valid) issues.push(issue("EVIDENCE_VALUES_INVALID", `${path}/values`, "explorer-move-share/v1 requires exactly the typed and derived frequency values"));
  const sourceEntry = manifest?.entries.find((entry) => entry.sourceId === record.sourceId && entry.retrievedAt === record.retrievedAt && entry.origin.kind === "http");
  if (sourceEntry?.origin.kind === "http") {
    const url = new URL(sourceEntry.origin.url);
    if (url.searchParams.get("ratings") !== (Array.isArray(ratings) ? ratings.join(",") : "") || url.searchParams.get("speeds") !== (Array.isArray(speeds) ? speeds.join(",") : "") || url.searchParams.get("since") !== values.since || url.searchParams.get("until") !== values.until) issues.push(issue("EVIDENCE_VALUES_INVALID", `${path}/values`, "record band/window differs from the explorer request URL"));
  }
  const pointer = record.supports[0];
  if (record.supports.length !== 1 || !/^\/feedbackClaims\/\d+\/text$/.test(pointer ?? "")) {
    issues.push(issue("EVIDENCE_OVERREACH", `${path}/supports`, "explorer frequency may support exactly one feedbackClaims text"));
  } else if (valid) {
    const target = resolvePointer(pack, pointer!);
    const rendered = renderExplorerFrequency(values as unknown as ExplorerTemplateValues);
    if (!target.found || target.value !== rendered) issues.push(issue("EVIDENCE_OVERREACH", `${path}/supports/0`, "supported explorer sentence is not the byte-exact generated template"));
  }
  return true;
}

function evidenceSupports(pack: unknown, ledger: EvidenceLedger, manifest: SourceManifest | undefined, issues: SourcingIssue[]): void {
  ledger.records.forEach((record: EvidenceRecord, recordIndex) => {
    const isExplorerTemplate = explorerTemplate(record, pack, manifest, recordIndex, issues);
    record.supports.forEach((pointer, supportIndex) => {
      const path = `/records/${recordIndex}/supports/${supportIndex}`;
      const resolved = resolvePointer(pack, pointer);
      if (!resolved.found) issues.push(issue("EVIDENCE_ANCHOR_BROKEN", path, `JSON pointer does not resolve: ${pointer}`));
      if (record.kind === "puzzle_provenance" && pointer === "/start/fen" && resolved.value !== record.anchor.fen) {
        issues.push(issue("EVIDENCE_VALUES_INVALID", path, "puzzle_provenance replay anchor must equal pack /start/fen"));
      }
      if ((!isExplorerTemplate && PROSE_POINTERS.some((pattern) => pattern.test(pointer))) || /^\/deviations\/\d+\/class$/.test(pointer) || (record.kind === "explorer_frequency" && (/^\/difficulty(?:\/|$)/.test(pointer) || /^\/spine(?:\/|$)/.test(pointer)))) {
        issues.push(issue("EVIDENCE_OVERREACH", path, `B6a has no registered template or grading contract for ${pointer}`));
      }
      if (record.templateId !== undefined && !isExplorerTemplate) issues.push(issue("EVIDENCE_OVERREACH", `/records/${recordIndex}/templateId`, "template is not registered for this evidence kind"));
    });
  });
}

function evidenceSemantics(ledger: EvidenceLedger, issues: SourcingIssue[]): void {
  const tablebaseFens = new Set(
    ledger.records
      .filter((record) => record.kind === "tablebase_result" && typeof record.values.fen === "string")
      .map((record) => String(record.values.fen)),
  );
  ledger.records.forEach((record, index) => {
    if (record.kind === "puzzle_provenance") {
      const values = record.values;
      const required = ["puzzleId", "gameUrl", "rating", "ratingDeviation", "popularity", "nbPlays", "themes", "csvFen", "solutionUci", "solutionSan", "solutionPlies"];
      let valid = exactKeys(values as Record<string, unknown>, required) && required.every((key) => values[key] !== undefined) && nonEmpty(values.puzzleId) && nonEmpty(values.gameUrl) && nonEmpty(values.csvFen) && Array.isArray(values.solutionUci) && Array.isArray(values.solutionSan) && values.solutionUci.length === values.solutionSan.length && values.solutionPlies === values.solutionUci.length;
      if (valid) {
        try {
          const position = Chess.fromSetup(parseFen(String(values.csvFen)).unwrap()).unwrap();
          for (const raw of values.solutionUci as unknown[]) {
            const move = typeof raw === "string" ? parseUci(raw) : undefined;
            if (move === undefined || !position.isLegal(move)) { valid = false; break; }
            position.play(move);
          }
          if (valid && makeFen(position.toSetup()) !== record.anchor.fen) valid = false;
        } catch { valid = false; }
      }
      if (!valid) issues.push(issue("EVIDENCE_VALUES_INVALID", `/records/${index}/values`, "puzzle_provenance must replay its complete solutionUci from csvFen to the anchored start FEN"));
      if (record.supports.length !== 1 || record.supports[0] !== "/start/fen") issues.push(issue("EVIDENCE_OVERREACH", `/records/${index}/supports`, "puzzle_provenance may support only /start/fen"));
    }
    if (record.kind === "tablebase_result") {
      if (!Number.isInteger(record.values.pieceCount) || Number(record.values.pieceCount) > 7) {
        issues.push(issue("EVIDENCE_KIND_MISMATCH", `/records/${index}/values/pieceCount`, "tablebase_result requires a mechanically counted position with at most 7 pieces"));
      }
    }
    if (record.kind === "engine_eval") {
      const required = ["depth", "threads", "hashMb", "multiPv", "timeoutMs", "engineId", "engineName", "engineVersion"];
      if (required.some((key) => record.values[key] === undefined) || record.values.movetimeMs !== undefined || record.values.requestedMovetimeMs !== undefined) {
        issues.push(issue("EVIDENCE_VALUES_INVALID", `/records/${index}/values`, "authoring engine evidence requires identity, depth, threads, hashMb, multiPv and timeoutMs; movetime is forbidden"));
      }
      const fen = typeof record.values.fen === "string" ? record.values.fen : typeof record.anchor.fen === "string" ? record.anchor.fen : undefined;
      if (fen !== undefined && tablebaseFens.has(fen)) {
        issues.push(issue("EVIDENCE_KIND_MISMATCH", `/records/${index}`, "engine_eval cannot substitute for tablebase_result on the same <=7-piece position"));
      }
    }
  });
}

function licenceObligations(pack: Record<string, unknown>, manifest: SourceManifest, ledger: EvidenceLedger, issues: SourcingIssue[]): void {
  const provenance = object(pack.provenance) ? pack.provenance : {};
  if (provenance.licence !== undefined && provenance.licence !== "CC-BY-SA-4.0") issues.push(issue("LICENCE_MIXED", "/provenance/licence", "emitted candidates use CC-BY-SA-4.0 wholesale"));
  const attributions = Array.isArray(provenance.attribution) ? provenance.attribution : [];
  for (const entry of manifest.entries) {
    if (entry.licence.basis !== "spdx" || entry.licence.spdx !== "CC-BY-SA-4.0") continue;
    const contributesProse = ledger.records.some((record) => record.sourceId === entry.sourceId && record.retrievedAt === entry.retrievedAt && record.supports.some((pointer) => PROSE_POINTERS.some((pattern) => pattern.test(pointer))));
    if (!contributesProse) continue;
    const matching = attributions.some((raw) => object(raw) && raw.sourceId === entry.sourceId && raw.licence === "CC-BY-SA-4.0" && raw.noticeText === entry.licence.noticeText);
    if (!matching) issues.push(issue("ATTRIBUTION_MISSING", "/provenance/attribution", `missing CC-BY-SA-4.0 attribution for ${entry.sourceId}`));
  }
  for (const [index, raw] of attributions.entries()) {
    if (!object(raw) || raw.licence !== "CC-BY-SA-4.0") issues.push(issue("LICENCE_MIXED", `/provenance/attribution/${index}`, "candidate attribution licences must be CC-BY-SA-4.0"));
  }
}

async function exists(path: string): Promise<boolean> {
  try { await access(path); return true; } catch { return false; }
}

export async function checkSourcingDirectory(directory: string, options: { readonly strict?: boolean } = {}): Promise<SourcingCheckResult> {
  const absolute = resolve(directory);
  const candidatesRoot = resolve("content/candidates");
  const strict = options.strict ?? (absolute === candidatesRoot || absolute.startsWith(`${candidatesRoot}${sep}`));
  const issues: SourcingIssue[] = [];
  let manifest: SourceManifest | undefined;
  let ledger: EvidenceLedger | undefined;
  let pack: unknown;
  let job: unknown;
  try { job = await readJson(resolve(absolute, "job.json")); } catch { /* job is auxiliary and optional for legacy candidates */ }
  try { manifest = validateManifest(await readJson(resolve(absolute, "sources.json")), issues); }
  catch (error) { issues.push(issue("MANIFEST_READ_ERROR", "/sources.json", error instanceof Error ? error.message : String(error))); }
  try { ledger = validateLedger(await readJson(resolve(absolute, "evidence.json")), issues); }
  catch (error) {
    if (!(await exists(resolve(absolute, "priority.json")))) issues.push(issue("EVIDENCE_READ_ERROR", "/evidence.json", error instanceof Error ? error.message : String(error)));
  }
  if (await exists(resolve(absolute, "pack.json"))) {
    try {
      pack = await readJson(resolve(absolute, "pack.json"));
      const result = validatePackDocument(pack);
      issues.push(...result.issues.map((value) => issue(`PACK_${value.code}`, value.path, value.message, value.severity)));
      if (object(pack)) {
        const provenance = object(pack.provenance) ? pack.provenance : {};
        if (strict && provenance.reviewStatus !== "draft") issues.push(issue("CANDIDATE_ALREADY_PROMOTED", "/provenance/reviewStatus", "sourcing candidates must remain draft"));
        if (strict && Array.isArray(provenance.reviewers) && provenance.reviewers.length > 0) issues.push(issue("CANDIDATE_ALREADY_REVIEWED", "/provenance/reviewers", "sourcing candidates cannot arrive reviewed"));
      }
    } catch (error) { issues.push(issue("PACK_READ_ERROR", "/pack.json", error instanceof Error ? error.message : String(error))); }
  }
  if (manifest && ledger) linkage(manifest, ledger, issues);
  if (manifest && !ledger && await exists(resolve(absolute, "priority.json"))) {
    try {
      priorityLinkage(manifest, await readJson(resolve(absolute, "priority.json")), issues);
    } catch (error) { issues.push(issue("PRIORITY_READ_ERROR", "/priority.json", error instanceof Error ? error.message : String(error))); }
  }
  if (ledger) evidenceSemantics(ledger, issues);
  if (ledger && object(job) && job.pipeline === "position-seeds" && object(job.args) && job.args.engineEval !== true && ledger.records.some((record) => record.kind === "engine_eval")) {
    issues.push(issue("EVIDENCE_KIND_UNEXPECTED", "/records", "position-seeds may contain engine_eval only when the recorded job has engineEval: true"));
  }
  if (pack && ledger) {
    evidenceSupports(pack, ledger, manifest, issues);
    if (manifest && object(pack)) licenceObligations(pack, manifest, ledger, issues);
    if (object(pack) && typeof ledger.packId === "string" && ledger.packId !== pack.id) issues.push(issue("EVIDENCE_PACK_MISMATCH", "/packId", "ledger packId does not match pack"));
    if (object(pack) && typeof ledger.packVersion === "string" && ledger.packVersion !== pack.version) issues.push(issue("EVIDENCE_PACK_MISMATCH", "/packVersion", "ledger packVersion does not match pack"));
    if (typeof ledger.packDigest === "string") {
      const digest = await digestDrillPack(pack);
      if (digest !== ledger.packDigest) issues.push(issue("EVIDENCE_DIGEST_STALE", "/packDigest", `stored ${ledger.packDigest}; current ${digest}; re-confirm evidence`, "warning"));
    }
  }
  if (
    strict &&
    object(pack) &&
    object(pack.objective) &&
    object(pack.objective.grading) &&
    object(pack.objective.grading.assessedBy) &&
    pack.objective.grading.assessedBy.kind === "syzygy" &&
    assessmentGrounding({
      document: pack as unknown as import("@chess-tabiya/schema/drill-pack").DrillPackDefinition,
      ledger,
      manifest,
    }) === "unverified"
  ) {
    issues.push(
      issue(
        "SYZYGY_ASSESSMENT_UNGROUNDED",
        "/objective/grading/assessedBy",
        "Syzygy assessment has no valid, manifest-linked tablebase evidence record",
      ),
    );
  }
  const effective = strict ? issues : issues.map((value) => ({ ...value, severity: "warning" as const }));
  return Object.freeze({ strict, issues: Object.freeze(effective), valid: !effective.some((value) => value.severity === "error") });
}
