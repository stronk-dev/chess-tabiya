import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, resolve } from "node:path";

import { digestDrillPack } from "@chess-tabiya/schema/drill-pack";

interface Clearance {
  readonly kind: "assessment_grounded" | "ledger_record" | "claim_bound" | "shape_firing" | "pointer_authored" | "unbuilt" | "unreachable" | "referent_removed";
  readonly subject: string;
  readonly recordKind?: string;
}

type Entry = string | {
  readonly id: string;
  readonly state: "blocking" | "resolved" | "accepted";
  readonly statement: string;
  readonly clearedBy?: string;
  readonly clearance?: Clearance;
  readonly resolved?: { readonly clearance?: Clearance };
  readonly accepted?: { readonly kind: string; readonly ruling: string; readonly rulingRef: string; readonly unreachableBecause?: string };
};

const CLEARABLE_KINDS = new Set<Clearance["kind"]>([
  "assessment_grounded",
  "ledger_record",
  "claim_bound",
  "shape_firing",
  "pointer_authored",
]);
const UNCLEARABLE_KINDS = new Set<Clearance["kind"]>(["unbuilt", "unreachable"]);

function clearanceLabel(clearance: Clearance | undefined): string {
  if (clearance === undefined) return "(unspecified)";
  const kind = clearance.recordKind === undefined ? clearance.kind : `${clearance.kind}:${clearance.recordKind}`;
  return `${kind} ${clearance.subject}`;
}

function files(root: string): readonly string[] {
  if (root === "content/candidates") return readdirSync(root, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => resolve(root, entry.name, "pack.json")).filter((file) => { try { readFileSync(file); return true; } catch { return false; } }).sort();
  return readdirSync(root, { withFileTypes: true }).filter((entry) => entry.isFile() && entry.name.endsWith(".json") && !/\.(?:evidence|graduation|job|sources)\.json$/u.test(entry.name)).map((entry) => resolve(root, entry.name)).sort();
}

export interface GraduationReport {
  readonly text: string;
  readonly acceptedPage: string;
  readonly legacy: number;
  readonly graduable: readonly string[];
  readonly evidenceDigests: Readonly<{
    paired: number;
    fresh: number;
    stale: number;
    invalid: number;
    withheld: readonly string[];
  }>;
}

export interface GraduationReportCommandOptions {
  readonly roots?: readonly string[];
  readonly updateAcceptedPage?: boolean;
  readonly acceptedPagePath?: string;
}

function evidencePath(packFile: string): string {
  const name = basename(packFile);
  if (name === "pack.json") return resolve(dirname(packFile), "evidence.json");
  return resolve(dirname(packFile), `${name.slice(0, -extname(name).length)}.evidence.json`);
}

function evidenceDigest(packFile: string): { readonly state: "missing" | "invalid" | "present"; readonly digest?: string } {
  const path = evidencePath(packFile);
  if (!existsSync(path)) return { state: "missing" };
  try {
    const ledger = JSON.parse(readFileSync(path, "utf8")) as { packDigest?: unknown };
    return typeof ledger.packDigest === "string" ? { state: "present", digest: ledger.packDigest } : { state: "invalid" };
  } catch {
    return { state: "invalid" };
  }
}

export async function graduationReport(roots: readonly string[] = ["content/drafts", "content/candidates", "content/packs"]): Promise<GraduationReport> {
  const accepted: Array<{ packId: string; entry: Exclude<Entry, string> }> = [];
  const graduable: string[] = [];
  const withheld: string[] = [];
  let paired = 0;
  let fresh = 0;
  let stale = 0;
  let invalid = 0;
  let legacy = 0;
  const sections: string[] = [];
  for (const root of roots) {
    const documents = files(root).map((file) => ({ file, document: JSON.parse(readFileSync(file, "utf8")) as { id: string; provenance?: { graduationBlockers?: Entry[] } } }));
    const counts = { blocking: 0, resolved: 0, accepted: 0, legacy: 0, clearable: 0, unclearable: 0, unspecified: 0 };
    const documentLines: string[] = [];
    for (const { file, document } of documents) {
      const entries = document.provenance?.graduationBlockers ?? [];
      const blocking = entries.filter((entry) => typeof entry === "string" || entry.state === "blocking");
      const storedDigest = evidenceDigest(file);
      const digestFresh = storedDigest.state === "present" ? storedDigest.digest === await digestDrillPack(document) : undefined;
      if (storedDigest.state !== "missing") {
        paired += 1;
        if (storedDigest.state === "invalid") invalid += 1;
        else if (digestFresh) fresh += 1;
        else stale += 1;
      }
      const otherwiseGraduable = root !== "content/candidates" && !file.endsWith(".browser.json") && blocking.length === 0;
      if (otherwiseGraduable && digestFresh !== false && storedDigest.state !== "invalid") graduable.push(document.id);
      if (otherwiseGraduable && (digestFresh === false || storedDigest.state === "invalid")) withheld.push(document.id);
      for (const entry of entries) {
        if (typeof entry === "string") { counts.legacy += 1; legacy += 1; continue; }
        counts[entry.state] += 1;
        if (entry.state === "blocking") {
          if (entry.clearance === undefined) counts.unspecified += 1;
          else if (CLEARABLE_KINDS.has(entry.clearance.kind)) counts.clearable += 1;
          else if (UNCLEARABLE_KINDS.has(entry.clearance.kind)) counts.unclearable += 1;
        }
        if (entry.state === "accepted") accepted.push({ packId: document.id, entry });
      }
      const stateCounts = {
        blocking: blocking.length,
        resolved: entries.filter((entry) => typeof entry !== "string" && entry.state === "resolved").length,
        accepted: entries.filter((entry) => typeof entry !== "string" && entry.state === "accepted").length,
      };
      const digestState = storedDigest.state === "missing" ? "no evidence ledger" : storedDigest.state === "invalid" ? "evidence ledger INVALID" : digestFresh ? "evidence digest fresh" : "evidence digest STALE";
      documentLines.push(`- **${document.id}** — blocking ${stateCounts.blocking}; resolved ${stateCounts.resolved}; accepted ${stateCounts.accepted}; ${digestState}`);
      for (const entry of blocking) {
        if (typeof entry === "string") documentLines.push(`  - **legacy** — ${entry}`);
        else documentLines.push(`  - **${entry.id}** — ${entry.statement}; clears via ${clearanceLabel(entry.clearance)}`);
      }
    }
    sections.push(`## ${root}\n\ndocuments: ${documents.length}; legacy: ${counts.legacy}; blocking: ${counts.blocking}; resolved: ${counts.resolved}; accepted: ${counts.accepted}\nclearable: ${counts.clearable}; unclearable: ${counts.unclearable}; unspecified: ${counts.unspecified}\n\n${documentLines.join("\n") || "(none)"}`);
  }
  const acceptedLines: string[] = [];
  for (const kind of [...new Set(accepted.map(({ entry }) => entry.accepted!.kind))].sort()) {
    acceptedLines.push(`## ${kind}`, "");
    for (const { packId, entry } of accepted.filter((row) => row.entry.accepted!.kind === kind).sort((a,b) => a.packId.localeCompare(b.packId) || a.entry.id.localeCompare(b.entry.id))) {
      acceptedLines.push(`- **${packId}/${entry.id}** — ${entry.statement}\n  Ruling: ${entry.accepted!.ruling} ([source](${entry.accepted!.rulingRef}))`);
    }
    acceptedLines.push("");
  }
  const page = ["# Accepted graduation conditions", "", "Generated by `make graduation-report`; edit the pack records, not this page.", "", ...acceptedLines].join("\n");
  const digestSummary = `## Evidence-ledger digest freshness\n\npaired: ${paired}; fresh: ${fresh}; stale: ${stale}; invalid: ${invalid}; otherwise-graduable packs withheld: ${withheld.length}\n\n${withheld.sort().join("\n") || "(none)"}`;
  return Object.freeze({
    text: [...sections, digestSummary, `## Graduable drafts and packs\n\n${graduable.sort().join("\n") || "(none)"}`, ""].join("\n\n"),
    acceptedPage: page,
    legacy,
    graduable: Object.freeze(graduable),
    evidenceDigests: Object.freeze({ paired, fresh, stale, invalid, withheld: Object.freeze(withheld) }),
  });
}

export async function writeAcceptedConditions(path = "content/accepted-conditions.md"): Promise<GraduationReport> {
  const report = await graduationReport();
  writeFileSync(path, report.acceptedPage);
  return report;
}

export async function runGraduationReport(options: GraduationReportCommandOptions = {}): Promise<GraduationReport> {
  const report = await graduationReport(options.roots);
  if (options.updateAcceptedPage === true) {
    writeFileSync(options.acceptedPagePath ?? "content/accepted-conditions.md", report.acceptedPage);
  }
  return report;
}

if (/graduation-report\.(?:js|ts)$/u.test(process.argv[1] ?? "")) {
  const report = await runGraduationReport({ updateAcceptedPage: process.env.UPDATE_ACCEPTED === "1" });
  process.stdout.write(`${report.text}\n`);
  if (report.legacy > 0 || report.evidenceDigests.withheld.length > 0) process.exitCode = 2;
}
