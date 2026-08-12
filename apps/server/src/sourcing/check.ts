import { access } from "node:fs/promises";
import { resolve, sep } from "node:path";

import { digestDrillPack } from "@chess-tabiya/schema/drill-pack";

import { validatePackDocument } from "../pack-validation.js";
import { readJson } from "./canonical.js";
import { EXPLORER_TEMPLATE_ID, renderExplorerFrequency, RATING_GROUPS, SPEEDS, type ExplorerTemplateValues } from "./explorer.js";
import {
  ABSTENTION_REASONS,
  EVIDENCE_KINDS,
  type EvidenceLedger,
  type EvidenceRecord,
  type SourceEntry,
  type SourceManifest,
  type SourcingIssue,
} from "./types.js";

const DENIED_HOSTS = new Set(["theweekinchess.com", "www.theweekinchess.com", "pgnmentor.com", "www.pgnmentor.com"]);
const DENIED_SOURCE_IDS = new Set(["ecochessopeningcodes"]);
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

function issue(code: string, path: string, message: string, severity: "error" | "warning" = "error"): SourcingIssue {
  return Object.freeze({ code, path, message, severity });
}

function object(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function exactKeys(value: Record<string, unknown>, allowed: readonly string[]): boolean {
  return Object.keys(value).every((key) => allowed.includes(key));
}

function validIso(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function validateLicence(value: unknown, path: string, issues: SourcingIssue[]): void {
  if (!object(value) || !exactKeys(value, ["basis", "spdx", "noticeText", "rationale"])) {
    issues.push(issue("LICENCE_FIELD_INVALID", path, "licence must contain exactly basis, spdx, noticeText and rationale"));
    return;
  }
  const { basis, spdx, noticeText, rationale } = value;
  const cc0 = basis === "spdx" && spdx === "CC0-1.0" && noticeText === null && rationale === null;
  const shareAlike = basis === "spdx" && spdx === "CC-BY-SA-4.0" && nonEmpty(noticeText) && rationale === null;
  const noRights = basis === "no-rights-asserted" && spdx === null && noticeText === null && nonEmpty(rationale);
  if (!cc0 && !shareAlike && !noRights) {
    issues.push(issue("LICENCE_FIELD_INVALID", path, "licence does not match a permitted SPDX/no-rights-asserted row"));
  }
}

function validateOrigin(entry: Record<string, unknown>, path: string, issues: SourcingIssue[]): void {
  const origin = entry.origin;
  if (!object(origin) || typeof origin.kind !== "string") {
    issues.push(issue("MANIFEST_ORIGIN_INVALID", `${path}/origin`, "origin must be a tagged object"));
    return;
  }
  let valid = false;
  if (origin.kind === "http") {
    const headersOnly = origin.sha256 === null && origin.bytes === null;
    valid = exactKeys(origin, ["kind", "url", "status", "sha256", "bytes", "etag"]) &&
      nonEmpty(origin.url) && Number.isInteger(origin.status) &&
      ((headersOnly) || (nonEmpty(origin.sha256) && Number.isInteger(origin.bytes) && Number(origin.bytes) >= 0)) &&
      (origin.etag === null || typeof origin.etag === "string");
    if (valid) {
      try {
        const host = new URL(origin.url as string).hostname.toLowerCase();
        if (DENIED_HOSTS.has(host)) issues.push(issue("SOURCE_DENIED", `${path}/origin/url`, `source is denied by design/research/theory-sourcing.md:134-143: ${host}`));
      } catch {
        valid = false;
      }
    }
  } else if (origin.kind === "local-file") {
    valid = exactKeys(origin, ["kind", "path", "sha256", "bytes"]) && nonEmpty(origin.path) && nonEmpty(origin.sha256) && Number.isInteger(origin.bytes) && Number(origin.bytes) >= 0;
  } else if (origin.kind === "engine") {
    const profile = origin.profile;
    const budget = origin.budget;
    const validProfile = object(profile) && exactKeys(profile, ["threads", "hashMb", "multiPv"]) && [profile.threads, profile.hashMb, profile.multiPv].every((v) => Number.isInteger(v) && Number(v) > 0);
    const validBudget = object(budget) && ((exactKeys(budget, ["depth"]) && Number.isInteger(budget.depth) && Number(budget.depth) > 0) || (exactKeys(budget, ["movetimeMs"]) && Number.isInteger(budget.movetimeMs) && Number(budget.movetimeMs) > 0));
    valid = exactKeys(origin, ["kind", "engineId", "engineName", "engineVersion", "profile", "budget", "fen", "evidenceKind"]) && nonEmpty(origin.engineId) && (origin.engineName === null || nonEmpty(origin.engineName)) && nonEmpty(origin.engineVersion) && validProfile && validBudget && nonEmpty(origin.fen) && nonEmpty(origin.evidenceKind);
  }
  if (!valid) issues.push(issue("MANIFEST_ORIGIN_INVALID", `${path}/origin`, `invalid ${String(origin.kind)} origin`));
}

function validateManifest(value: unknown, issues: SourcingIssue[]): SourceManifest | undefined {
  if (!object(value) || value.schema !== "tabiya.sourcing.manifest.v1" || !Array.isArray(value.entries)) {
    issues.push(issue("MANIFEST_INVALID", "/sources.json", "expected tabiya.sourcing.manifest.v1 with entries[]"));
    return;
  }
  if (value.entries.length === 0) issues.push(issue("MANIFEST_EMPTY", "/entries", "a sourcing artifact must name at least one consumed input"));
  const seen = new Set<string>();
  value.entries.forEach((raw, index) => {
    const path = `/entries/${index}`;
    if (!object(raw) || !nonEmpty(raw.sourceId) || !validIso(raw.retrievedAt)) {
      issues.push(issue("MANIFEST_INVALID", path, "entry requires sourceId and an ISO retrievedAt"));
      return;
    }
    if (DENIED_SOURCE_IDS.has(raw.sourceId)) issues.push(issue("SOURCE_DENIED", `${path}/sourceId`, `source is denied by design/research/theory-sourcing.md:134-143: ${raw.sourceId}`));
    const key = `${raw.sourceId}\u0000${raw.retrievedAt}`;
    if (seen.has(key)) issues.push(issue("MANIFEST_DUPLICATE_ENTRY", path, "sourceId + retrievedAt must be unique"));
    seen.add(key);
    validateOrigin(raw, path, issues);
    validateLicence(raw.licence, `${path}/licence`, issues);
  });
  return value as unknown as SourceManifest;
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

function validateLedger(value: unknown, issues: SourcingIssue[]): EvidenceLedger | undefined {
  if (!object(value) || value.schema !== "tabiya.sourcing.evidence.v1" || !validIso(value.sourcedAt) || !Array.isArray(value.records) || !Array.isArray(value.abstentions)) {
    issues.push(issue("EVIDENCE_INVALID", "/evidence.json", "expected tabiya.sourcing.evidence.v1 with sourcedAt, records[] and abstentions[]"));
    return;
  }
  for (const [index, raw] of value.records.entries()) {
    if (!object(raw) || !EVIDENCE_KINDS.includes(raw.kind as never) || !object(raw.anchor) || !nonEmpty(raw.sourceId) || !validIso(raw.retrievedAt) || !["citable_source", "machine_validation"].includes(String(raw.grounds)) || !object(raw.values) || !Array.isArray(raw.supports) || raw.supports.some((p) => !nonEmpty(p))) {
      issues.push(issue("EVIDENCE_INVALID", `/records/${index}`, "invalid evidence record"));
    }
  }
  for (const [index, raw] of value.abstentions.entries()) {
    if (!object(raw) || !EVIDENCE_KINDS.includes(raw.kind as never) || !object(raw.anchor) || !nonEmpty(raw.sourceId) || !validIso(raw.retrievedAt) || !ABSTENTION_REASONS.includes(raw.reason as never) || !nonEmpty(raw.detail)) {
      issues.push(issue("EVIDENCE_INVALID", `/abstentions/${index}`, "invalid evidence abstention"));
    }
  }
  return value as unknown as EvidenceLedger;
}

function linkage(manifest: SourceManifest, ledger: EvidenceLedger, issues: SourcingIssue[]): void {
  const used = new Set<number>();
  const evidence = [...ledger.records, ...ledger.abstentions];
  evidence.forEach((record, index) => {
    const matches = manifest.entries.map((entry, entryIndex) => ({ entry, entryIndex })).filter(({ entry }) => entry.sourceId === record.sourceId);
    if (matches.length === 0) {
      issues.push(issue("EVIDENCE_SOURCE_UNLINKED", `/evidence/${index}/sourceId`, `no manifest entry has sourceId ${record.sourceId}`));
      return;
    }
    const exact = matches.find(({ entry }) => entry.retrievedAt === record.retrievedAt);
    if (!exact) {
      issues.push(issue("EVIDENCE_RETRIEVED_AT_MISMATCH", `/evidence/${index}/retrievedAt`, `retrievedAt does not match the ${record.sourceId} manifest entry`));
      return;
    }
    used.add(exact.entryIndex);
  });
  manifest.entries.forEach((_entry, index) => {
    if (!used.has(index)) issues.push(issue("MANIFEST_ENTRY_UNUSED", `/entries/${index}`, "manifest entry is not referenced by evidence or an abstention"));
  });
  const maximum = manifest.entries.map((entry) => entry.retrievedAt).sort().at(-1);
  if (maximum !== undefined && ledger.sourcedAt !== maximum) issues.push(issue("EVIDENCE_TIMESTAMP_DERIVED", "/sourcedAt", `sourcedAt must equal maximum consumed retrievedAt ${maximum}`));
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
      if (!resolvePointer(pack, pointer).found) issues.push(issue("EVIDENCE_ANCHOR_BROKEN", path, `JSON pointer does not resolve: ${pointer}`));
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
  const effective = strict ? issues : issues.map((value) => ({ ...value, severity: "warning" as const }));
  return Object.freeze({ strict, issues: Object.freeze(effective), valid: !effective.some((value) => value.severity === "error") });
}
