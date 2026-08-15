import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";

import {
  ABSTENTION_REASONS,
  EVIDENCE_KINDS,
  type EvidenceLedger,
  type SourceManifest,
  type SourcingIssue,
} from "./types.js";

const DENIED_HOSTS = new Set([
  "theweekinchess.com",
  "www.theweekinchess.com",
  "pgnmentor.com",
  "www.pgnmentor.com",
]);
const DENIED_SOURCE_IDS = new Set(["ecochessopeningcodes"]);

export function issue(
  code: string,
  path: string,
  message: string,
  severity: "error" | "warning" = "error",
): SourcingIssue {
  return Object.freeze({ code, path, message, severity });
}

export function object(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function exactKeys(
  value: Record<string, unknown>,
  allowed: readonly string[],
): boolean {
  return Object.keys(value).every((key) => allowed.includes(key));
}

export function validIso(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function validateLicence(
  value: unknown,
  path: string,
  issues: SourcingIssue[],
): void {
  if (
    !object(value) ||
    !exactKeys(value, ["basis", "spdx", "noticeText", "rationale"])
  ) {
    issues.push(
      issue(
        "LICENCE_FIELD_INVALID",
        path,
        "licence must contain exactly basis, spdx, noticeText and rationale",
      ),
    );
    return;
  }
  const { basis, spdx, noticeText, rationale } = value;
  const cc0 =
    basis === "spdx" &&
    spdx === "CC0-1.0" &&
    noticeText === null &&
    rationale === null;
  const shareAlike =
    basis === "spdx" &&
    spdx === "CC-BY-SA-4.0" &&
    nonEmpty(noticeText) &&
    rationale === null;
  const noRights =
    basis === "no-rights-asserted" &&
    spdx === null &&
    noticeText === null &&
    nonEmpty(rationale);
  if (!cc0 && !shareAlike && !noRights) {
    issues.push(
      issue(
        "LICENCE_FIELD_INVALID",
        path,
        "licence does not match a permitted SPDX/no-rights-asserted row",
      ),
    );
  }
}

function validateOrigin(
  entry: Record<string, unknown>,
  path: string,
  issues: SourcingIssue[],
): void {
  const origin = entry.origin;
  if (!object(origin) || typeof origin.kind !== "string") {
    issues.push(
      issue(
        "MANIFEST_ORIGIN_INVALID",
        `${path}/origin`,
        "origin must be a tagged object",
      ),
    );
    return;
  }
  let valid = false;
  if (origin.kind === "http") {
    const headersOnly = origin.sha256 === null && origin.bytes === null;
    valid =
      exactKeys(origin, ["kind", "url", "status", "sha256", "bytes", "etag"]) &&
      nonEmpty(origin.url) &&
      Number.isInteger(origin.status) &&
      (headersOnly ||
        (nonEmpty(origin.sha256) &&
          Number.isInteger(origin.bytes) &&
          Number(origin.bytes) >= 0)) &&
      (origin.etag === null || typeof origin.etag === "string");
    if (valid) {
      try {
        const host = new URL(origin.url as string).hostname.toLowerCase();
        if (DENIED_HOSTS.has(host)) {
          issues.push(
            issue(
              "SOURCE_DENIED",
              `${path}/origin/url`,
              `source is denied by design/research/theory-sourcing.md:134-143: ${host}`,
            ),
          );
        }
      } catch {
        valid = false;
      }
    }
  } else if (origin.kind === "local-file") {
    valid =
      exactKeys(origin, ["kind", "path", "sha256", "bytes"]) &&
      nonEmpty(origin.path) &&
      nonEmpty(origin.sha256) &&
      Number.isInteger(origin.bytes) &&
      Number(origin.bytes) >= 0;
  } else if (origin.kind === "engine") {
    const profile = origin.profile;
    const budget = origin.budget;
    const validProfile =
      object(profile) &&
      exactKeys(profile, ["threads", "hashMb", "multiPv"]) &&
      [profile.threads, profile.hashMb, profile.multiPv].every(
        (value) => Number.isInteger(value) && Number(value) > 0,
      );
    const validBudget =
      object(budget) &&
      ((exactKeys(budget, ["depth"]) &&
        Number.isInteger(budget.depth) &&
        Number(budget.depth) > 0) ||
        (exactKeys(budget, ["movetimeMs"]) &&
          Number.isInteger(budget.movetimeMs) &&
          Number(budget.movetimeMs) > 0));
    valid =
      exactKeys(origin, [
        "kind",
        "engineId",
        "engineName",
        "engineVersion",
        "profile",
        "budget",
        "fen",
        "evidenceKind",
      ]) &&
      nonEmpty(origin.engineId) &&
      (origin.engineName === null || nonEmpty(origin.engineName)) &&
      nonEmpty(origin.engineVersion) &&
      validProfile &&
      validBudget &&
      nonEmpty(origin.fen) &&
      nonEmpty(origin.evidenceKind);
  }
  if (!valid) {
    issues.push(
      issue(
        "MANIFEST_ORIGIN_INVALID",
        `${path}/origin`,
        `invalid ${String(origin.kind)} origin`,
      ),
    );
  }
}

export function validateManifest(
  value: unknown,
  issues: SourcingIssue[],
): SourceManifest | undefined {
  if (
    !object(value) ||
    value.schema !== "tabiya.sourcing.manifest.v1" ||
    !Array.isArray(value.entries)
  ) {
    issues.push(
      issue(
        "MANIFEST_INVALID",
        "/sources.json",
        "expected tabiya.sourcing.manifest.v1 with entries[]",
      ),
    );
    return;
  }
  if (value.entries.length === 0) {
    issues.push(
      issue(
        "MANIFEST_EMPTY",
        "/entries",
        "a sourcing artifact must name at least one consumed input",
      ),
    );
  }
  const seen = new Set<string>();
  value.entries.forEach((raw, index) => {
    const path = `/entries/${index}`;
    if (!object(raw) || !nonEmpty(raw.sourceId) || !validIso(raw.retrievedAt)) {
      issues.push(
        issue(
          "MANIFEST_INVALID",
          path,
          "entry requires sourceId and an ISO retrievedAt",
        ),
      );
      return;
    }
    if (DENIED_SOURCE_IDS.has(raw.sourceId)) {
      issues.push(
        issue(
          "SOURCE_DENIED",
          `${path}/sourceId`,
          `source is denied by design/research/theory-sourcing.md:134-143: ${raw.sourceId}`,
        ),
      );
    }
    const key = `${raw.sourceId}\u0000${raw.retrievedAt}`;
    if (seen.has(key)) {
      issues.push(
        issue(
          "MANIFEST_DUPLICATE_ENTRY",
          path,
          "sourceId + retrievedAt must be unique",
        ),
      );
    }
    seen.add(key);
    validateOrigin(raw, path, issues);
    validateLicence(raw.licence, `${path}/licence`, issues);
  });
  return value as unknown as SourceManifest;
}

export function validateLedger(
  value: unknown,
  issues: SourcingIssue[],
): EvidenceLedger | undefined {
  const issueCount = issues.length;
  if (
    !object(value) ||
    value.schema !== "tabiya.sourcing.evidence.v1" ||
    !validIso(value.sourcedAt) ||
    !Array.isArray(value.records) ||
    !Array.isArray(value.abstentions)
  ) {
    issues.push(
      issue(
        "EVIDENCE_INVALID",
        "/evidence.json",
        "expected tabiya.sourcing.evidence.v1 with sourcedAt, records[] and abstentions[]",
      ),
    );
    return;
  }
  for (const [index, raw] of value.records.entries()) {
    if (
      !object(raw) ||
      !EVIDENCE_KINDS.includes(raw.kind as never) ||
      !object(raw.anchor) ||
      !nonEmpty(raw.sourceId) ||
      !validIso(raw.retrievedAt) ||
      !["citable_source", "machine_validation"].includes(String(raw.grounds)) ||
      !object(raw.values) ||
      !Array.isArray(raw.supports) ||
      raw.supports.some((pointer) => !nonEmpty(pointer))
    ) {
      issues.push(
        issue("EVIDENCE_INVALID", `/records/${index}`, "invalid evidence record"),
      );
    }
  }
  for (const [index, raw] of value.abstentions.entries()) {
    if (
      !object(raw) ||
      !EVIDENCE_KINDS.includes(raw.kind as never) ||
      !object(raw.anchor) ||
      !nonEmpty(raw.sourceId) ||
      !validIso(raw.retrievedAt) ||
      !ABSTENTION_REASONS.includes(raw.reason as never) ||
      !nonEmpty(raw.detail)
    ) {
      issues.push(
        issue(
          "EVIDENCE_INVALID",
          `/abstentions/${index}`,
          "invalid evidence abstention",
        ),
      );
    }
  }
  return issues.length === issueCount
    ? (value as unknown as EvidenceLedger)
    : undefined;
}

export function linkage(
  manifest: SourceManifest,
  ledger: EvidenceLedger,
  issues: SourcingIssue[],
): void {
  const used = new Set<number>();
  const evidence = [...ledger.records, ...ledger.abstentions];
  evidence.forEach((record, index) => {
    const matches = manifest.entries
      .map((entry, entryIndex) => ({ entry, entryIndex }))
      .filter(({ entry }) => entry.sourceId === record.sourceId);
    if (matches.length === 0) {
      issues.push(
        issue(
          "EVIDENCE_SOURCE_UNLINKED",
          `/evidence/${index}/sourceId`,
          `no manifest entry has sourceId ${record.sourceId}`,
        ),
      );
      return;
    }
    const exact = matches.find(
      ({ entry }) => entry.retrievedAt === record.retrievedAt,
    );
    if (!exact) {
      issues.push(
        issue(
          "EVIDENCE_RETRIEVED_AT_MISMATCH",
          `/evidence/${index}/retrievedAt`,
          `retrievedAt does not match the ${record.sourceId} manifest entry`,
        ),
      );
      return;
    }
    used.add(exact.entryIndex);
  });
  manifest.entries.forEach((_entry, index) => {
    if (!used.has(index)) {
      issues.push(
        issue(
          "MANIFEST_ENTRY_UNUSED",
          `/entries/${index}`,
          "manifest entry is not referenced by evidence or an abstention",
        ),
      );
    }
  });
  const maximum = manifest.entries
    .map((entry) => entry.retrievedAt)
    .sort()
    .at(-1);
  if (maximum !== undefined && ledger.sourcedAt !== maximum) {
    issues.push(
      issue(
        "EVIDENCE_TIMESTAMP_DERIVED",
        "/sourcedAt",
        `sourcedAt must equal maximum consumed retrievedAt ${maximum}`,
      ),
    );
  }
}

export function assessmentGrounding(input: {
  readonly document: DrillPackDefinition;
  readonly ledger?: unknown;
  readonly manifest?: unknown;
}): "ledger_verified" | "unverified" {
  const assessedBy = input.document.objective.grading?.assessedBy;
  if (assessedBy?.kind !== "syzygy" && assessedBy?.kind !== "engine") return "unverified";

  const issues: SourcingIssue[] = [];
  const ledger = validateLedger(input.ledger, issues);
  const manifest = validateManifest(input.manifest, issues);
  if (ledger === undefined || manifest === undefined) return "unverified";
  linkage(manifest, ledger, issues);
  if (issues.length > 0) return "unverified";

  const matches = ledger.records.filter((record) => {
    if (record.grounds !== "machine_validation" || record.values.fen !== input.document.start.fen || record.sourceId !== assessedBy.sourceId || record.retrievedAt !== assessedBy.retrievedAt || !record.supports.includes("/start/fen") || ledger.packId !== input.document.id) return false;
    if (assessedBy.kind === "syzygy") return record.kind === "tablebase_result" && record.values.category === assessedBy.category && record.values.pieceCount === assessedBy.pieceCount;
    const scoreMatches = assessedBy.score.kind === "cp"
      ? record.values.centipawns === assessedBy.score.centipawns && record.values.mateIn === undefined
      : record.values.mateIn === assessedBy.score.movesToMate && record.values.centipawns === undefined;
    if (record.kind !== "engine_eval" || !scoreMatches || record.values.perspective !== "white" || record.values.depth !== assessedBy.depth || record.values.multiPv !== 1 || record.values.engineId !== assessedBy.engineId || record.values.engineVersion !== assessedBy.engineVersion) return false;
    const entry = manifest.entries.find((candidate) => candidate.sourceId === record.sourceId && candidate.retrievedAt === record.retrievedAt);
    if (entry?.origin.kind !== "engine") return false;
    return entry.origin.fen === input.document.start.fen && "depth" in entry.origin.budget && entry.origin.budget.depth === assessedBy.depth && entry.origin.engineVersion === assessedBy.engineVersion && entry.origin.profile.multiPv === 1;
  });
  return matches.length === 1 ? "ledger_verified" : "unverified";
}
