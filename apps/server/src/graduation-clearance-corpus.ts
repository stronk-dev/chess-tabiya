import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";

import { digestDrillPack, type DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";

import { runExpressionCensus } from "./expression-census.js";
import { GRADUATION_RULING_ANCHOR_ROOTS } from "./graduation-ruling-roots.mjs";
import { evaluateGraduationClearance, type GraduationClearance } from "./sourcing/graduation-clear.js";
import type { EvidenceLedger, SourceManifest } from "./sourcing/types.js";

const FIRST_RUN_EXEMPTIONS = new Set([
  "mate-k-q-technique/the-syzygy-root-assessment-is-declared-but-not-ledger-ve",
  "mate-k-r-technique/the-syzygy-root-assessment-is-declared-but-not-ledger-ve",
  "mate-two-bishops/the-syzygy-root-assessment-is-declared-but-not-ledger-ve",
  "philidor-passive-rook-convert/the-syzygy-root-assessment-is-declared-but-not-ledger-ve",
]);

function packFiles(root: string): readonly string[] {
  if (root.endsWith("/candidates")) return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(resolve(root, entry.name, "pack.json")))
    .map((entry) => resolve(root, entry.name, "pack.json"));
  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json") && !/\.(?:evidence|graduation|job|sources)\.json$/u.test(entry.name))
    .map((entry) => resolve(root, entry.name));
}

function sidecar(file: string, suffix: "evidence" | "sources"): string {
  return basename(file) === "pack.json" ? resolve(dirname(file), `${suffix}.json`) : file.replace(/\.json$/u, `.${suffix}.json`);
}

function value<T>(file: string, fallback: T): T {
  return existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) as T : fallback;
}

export interface GraduationClearanceCorpusAudit {
  readonly documents: number;
  readonly blocking: number;
  readonly resolved: number;
  readonly accepted: number;
  readonly errors: readonly string[];
}

export function auditGraduationRulingLine(
  checkoutRoot: string,
  rulingRef: string,
  ruling: string,
  kind: "owner_ruling" | "permanent_property" | "out_of_scope",
  commitUnderReview: string,
): readonly string[] {
  const match = /^(.*)#L([1-9][0-9]*)$/u.exec(rulingRef);
  if (match === null) return Object.freeze([`GRADUATION_RULING_UNANCHORED ${rulingRef}`]);
  const file = match[1]!;
  const lineText = match[2]!;
  if (!GRADUATION_RULING_ANCHOR_ROOTS.includes(file)) return Object.freeze([`GRADUATION_RULING_UNCITED ${rulingRef}`]);
  const line = Number(lineText);
  const sourceLines = readFileSync(resolve(checkoutRoot, file), "utf8").split(/\r?\n/u);
  const cited = sourceLines[line - 1];
  if (cited === undefined) return Object.freeze([`GRADUATION_RULING_UNCITED ${rulingRef}`]);
  if (kind === "owner_ruling") {
    const date = /20\d\d-\d\d-\d\d/u.exec(ruling)?.[0];
    if (date === undefined || !cited.includes(date)) return Object.freeze([`GRADUATION_RULING_UNCITED ${rulingRef} does not contain ${date ?? "a ruling date"}`]);
  }
  const blame = execFileSync("git", ["blame", "--porcelain", "-L", `${line},${line}`, "--", file], {
    cwd: checkoutRoot,
    encoding: "utf8",
  });
  const blamedCommit = blame.split(/\s/u, 1)[0] ?? "";
  if (/^0{40}$/u.test(blamedCommit) || blamedCommit === commitUnderReview) {
    return Object.freeze([`GRADUATION_RULING_SELF_MINTED ${rulingRef} blames to ${blamedCommit}`]);
  }
  return Object.freeze([]);
}

export async function auditGraduationClearanceCorpus(roots: readonly string[] = ["content/drafts", "content/candidates"]): Promise<GraduationClearanceCorpusAudit> {
  const files = roots.flatMap(packFiles).sort();
  const census = runExpressionCensus({ roots });
  const errors: string[] = [];
  const checkoutRoot = resolve(".");
  const commitUnderReview = execFileSync("git", ["rev-parse", "HEAD"], { cwd: checkoutRoot, encoding: "utf8" }).trim();
  let blocking = 0, resolved = 0, accepted = 0;
  for (const file of files) {
    const pack = value<DrillPackDefinition>(file, undefined as never);
    const packDigest = await digestDrillPack(pack);
    const ledger = value<EvidenceLedger>(sidecar(file, "evidence"), {
      schema: "tabiya.sourcing.evidence.v1", packId: pack.id, packVersion: pack.version, packDigest, sourcedAt: "1970-01-01T00:00:00.000Z", records: [], abstentions: [],
    });
    const manifest = value<SourceManifest>(sidecar(file, "sources"), { schema: "tabiya.sourcing.manifest.v1", entries: [] });
    for (const entry of pack.provenance.graduationBlockers ?? []) {
      if (typeof entry === "string") continue;
      if (entry.state === "accepted") {
        accepted += 1;
        errors.push(...auditGraduationRulingLine(
          checkoutRoot,
          entry.accepted.rulingRef,
          entry.accepted.ruling,
          entry.accepted.kind,
          commitUnderReview,
        ).map((issue) => `${pack.id}/${entry.id}: ${issue}`));
        continue;
      }
      const clearance = (entry.state === "resolved" ? entry.resolved.clearance : entry.clearance) as GraduationClearance;
      const result = evaluateGraduationClearance(pack, packDigest, ledger, manifest, entry.id, clearance, census);
      if (entry.state === "blocking") {
        blocking += 1;
        if (result?.holds === true && !(FIRST_RUN_EXEMPTIONS.has(`${pack.id}/${entry.id}`) && clearance.kind === "assessment_grounded")) {
          errors.push(`${pack.id}/${entry.id}: GRADUATION_CLEARANCE_VACUOUS blocking predicate already holds (${clearance.kind})`);
        }
      } else {
        resolved += 1;
        if (result?.holds !== true) errors.push(`${pack.id}/${entry.id}: GRADUATION_RESOLUTION_STALE resolved predicate does not hold (${clearance.kind})`);
      }
    }
  }
  return Object.freeze({ documents: files.length, blocking, resolved, accepted, errors: Object.freeze(errors) });
}

if (/graduation-clearance-corpus\.(?:js|ts)$/u.test(process.argv[1] ?? "")) {
  const result = await auditGraduationClearanceCorpus();
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (result.errors.length > 0) process.exitCode = 2;
}
