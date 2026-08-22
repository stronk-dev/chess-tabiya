// DISPOSABLE research harness — feedback-delivery criteria 21(b), 23, and Stage-2 job-1 split probe.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, resolve } from "node:path";

import type { DrillPackDefinition, FeedbackClaim } from "@chess-tabiya/schema/drill-pack";
import { describe, expect, it } from "vitest";

import { MACHINE_LABEL_EVIDENCE_KINDS, validateClaimBindings } from "../../apps/server/src/sourcing/claim-binding.js";
import { EXPLORER_RATIONALE } from "../../apps/server/src/sourcing/explorer.js";
import type { EvidenceLedger, SourcingIssue } from "../../apps/server/src/sourcing/types.js";

const ROOT = resolve(new URL("../../", import.meta.url).pathname);
const DRAFTS = resolve(ROOT, "content/drafts");
const BASELINE = "a64e6c5";
const MACHINE_TOKEN = /(?:\b\d+(?:[,.]\d+)*(?:%|st|nd|rd|th)?\b|\b(?:zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourth|fifth|sixth|seventh|eighth|ninth|tenth|first|second|third)(?:-[a-z]+)?\b|\b(?:[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](?:=[QRBN])?[+#]?|[a-h][1-8])\b|\b(?:win|won|draw|drawn|loss|lost|stalemate|checkmate)\b)/iu;

type WorkKind = "instrument_run" | "pack_edit" | "prose_fix";
interface WithheldReason {
  readonly packId: string;
  readonly claimId: string;
  readonly characters: number;
  readonly form: "binding_refused" | "no_binding_declared";
  readonly issueCodes: readonly string[];
  readonly work: readonly WorkKind[];
  readonly disposition: "deferred" | "permanent";
  readonly holder: string;
}

function draftFiles(): readonly string[] {
  return readdirSync(DRAFTS)
    .filter((name) => name.endsWith(".json") && !name.endsWith(".browser.json") && !/\.(?:evidence|graduation|job|sources)\.json$/u.test(name))
    .map((name) => resolve(DRAFTS, name))
    .sort();
}

function ledgerFor(file: string, pack: DrillPackDefinition): EvidenceLedger {
  const path = file.replace(/\.json$/u, ".evidence.json");
  if (existsSync(path)) return JSON.parse(readFileSync(path, "utf8")) as EvidenceLedger;
  return { schema: "tabiya.sourcing.evidence.v1", packId: pack.id, packVersion: pack.version, sourcedAt: "1970-01-01T00:00:00.000Z", records: [], abstentions: [] };
}

function machineLabels(claim: FeedbackClaim): readonly string[] {
  return claim.evidenceTypes.filter((label) => MACHINE_LABEL_EVIDENCE_KINDS[label] !== undefined);
}

function likelyNeedsPrinciple(claim: FeedbackClaim): boolean {
  if (claim.evidenceTypes.includes("author_principle")) return false;
  return claim.text
    .split(/(?<=[.?!;:])\s+|\s+[—–]\s+|,?\s+(?=(?:so|therefore|thus|hence|which means|because|since)\b)/iu)
    .some((segment) => segment.trim().length > 0 && !MACHINE_TOKEN.test(segment));
}

function bindingIssueCodes(pack: DrillPackDefinition, ledger: EvidenceLedger, claimId: string): readonly string[] {
  const binding = ledger.claimBindings?.find((candidate) => candidate.claimId === claimId);
  if (binding === undefined) return [];
  const issues: SourcingIssue[] = [];
  validateClaimBindings(pack, { ...ledger, claimBindings: [binding] }, issues);
  return [...new Set(issues.map((issue) => issue.code))].sort();
}

function workFor(pack: DrillPackDefinition, claim: FeedbackClaim): readonly WorkKind[] {
  const result = new Set<WorkKind>();
  const labels = machineLabels(claim);
  if (labels.length > 0) result.add("instrument_run");
  if (likelyNeedsPrinciple(claim)) result.add("pack_edit");
  if (labels.includes("corpus_observed") && !(pack.provenance.sources ?? []).some((source) => source.includes(EXPLORER_RATIONALE))) result.add("prose_fix");
  return [...result].sort();
}

function accounting(): { reasons: readonly WithheldReason[]; claims: number; admitted: number; characters: number; admittedCharacters: number; explorer: { claims: number; packs: number; rationaleReadyClaims: number; rationaleReadyPacks: number } } {
  const reasons: WithheldReason[] = [];
  let claims = 0, admitted = 0, characters = 0, admittedCharacters = 0;
  const explorerPacks = new Set<string>(), rationalePacks = new Set<string>();
  let explorerClaims = 0, rationaleReadyClaims = 0;
  for (const file of draftFiles()) {
    const pack = JSON.parse(readFileSync(file, "utf8")) as DrillPackDefinition;
    const ledger = ledgerFor(file, pack);
    const issues: SourcingIssue[] = [];
    const valid = validateClaimBindings(pack, ledger, issues);
    const validIds = new Set(valid.map((binding) => binding.claimId));
    const declaredIds = new Set((ledger.claimBindings ?? []).map((binding) => binding.claimId));
    const rationaleReady = (pack.provenance.sources ?? []).some((source) => source.includes(EXPLORER_RATIONALE));
    for (const claim of pack.feedbackClaims ?? []) {
      claims += 1; characters += claim.text.length;
      const labels = machineLabels(claim);
      const delivered = labels.length === 0 || validIds.has(claim.id);
      if (delivered) { admitted += 1; admittedCharacters += claim.text.length; }
      else {
        const issueCodes = bindingIssueCodes(pack, ledger, claim.id);
        const work = workFor(pack, claim);
        reasons.push({ packId: pack.id, claimId: claim.id, characters: claim.text.length, form: declaredIds.has(claim.id) ? "binding_refused" : "no_binding_declared", issueCodes, work, disposition: "deferred", holder: work.includes("pack_edit") || work.includes("prose_fix") ? "content binding wave" : "codex mechanical binding arm" });
      }
      if (labels.includes("corpus_observed") && !delivered) {
        explorerClaims += 1; explorerPacks.add(pack.id);
        if (rationaleReady) { rationaleReadyClaims += 1; rationalePacks.add(pack.id); }
      }
    }
  }
  return { reasons, claims, admitted, characters, admittedCharacters, explorer: { claims: explorerClaims, packs: explorerPacks.size, rationaleReadyClaims, rationaleReadyPacks: rationalePacks.size } };
}

function appendedSinceBaseline(path: string): string {
  const current = readFileSync(resolve(ROOT, path), "utf8");
  const baseline = execFileSync("git", ["show", `${BASELINE}:${path}`], { cwd: ROOT, encoding: "utf8" });
  if (!current.startsWith(baseline)) throw new Error(`${path} is not append-only relative to ${BASELINE}`);
  return current.slice(baseline.length);
}

describe("feedback-delivery Stage 2 accounting instruments", () => {
  it("names a refusal or supplying work for every withheld claim and measures the explorer-rationale split", () => {
    const result = accounting();
    expect(result).toMatchObject({ claims: 196, admitted: 98, characters: 61_531, admittedCharacters: 26_735 });
    expect(result.reasons).toHaveLength(result.claims - result.admitted);
    expect(result.reasons.every((reason) => reason.form === "binding_refused" ? reason.issueCodes.length > 0 : reason.work.length > 0)).toBe(true);
    expect(result.reasons.filter((reason) => reason.work.includes("pack_edit"))).toHaveLength(63);
    expect(result.explorer).toEqual({ claims: 60, packs: 31, rationaleReadyClaims: 0, rationaleReadyPacks: 0 });
  });

  it("trips if either append-only log records post-Stage-1 owner use on a claim-bearing pack", () => {
    const claimBearingIds = draftFiles().flatMap((file) => {
      const pack = JSON.parse(readFileSync(file, "utf8")) as DrillPackDefinition;
      return (pack.feedbackClaims?.length ?? 0) > 0 ? [pack.id] : [];
    });
    const appended = ["planning/exploration/log.md", "planning/content-era/log.md"].map(appendedSinceBaseline).join("\n");
    const useLanguage = /(?:play(?:ed| session)|walkthrough|owner run)/iu.test(appended);
    const namesClaimPack = claimBearingIds.some((id) => appended.includes(id));
    expect(useLanguage && namesClaimPack, "criterion 23 tripped: escalate to the owner; do not fix in code").toBe(false);
  });
});
