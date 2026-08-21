// DISPOSABLE research harness — D637/D638. It audits records; it does not implement an RFC.
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { ACTIVE_TRUTH } from "./registry.js";

const ROOT = new URL("../../", import.meta.url);
const OUT = new URL("./output.md", import.meta.url);

function source(path: string): string { return readFileSync(new URL(path, ROOT), "utf8"); }
function section(text: string, heading: string, nextHeading: string): string {
  const start = text.indexOf(heading);
  const end = text.indexOf(nextHeading, start + heading.length);
  if (start < 0 || end < 0) throw new Error(`cannot locate ${heading}..${nextHeading}`);
  return text.slice(start, end);
}
function rowNames(text: string, prefix = ""): readonly string[] {
  return [...text.matchAll(/^\| `([^`]+\.md)` \|/gmu)]
    .map((match) => match[1]!)
    .filter((name) => name.startsWith(prefix))
    .map((name) => prefix.length > 0 ? name.slice(prefix.length) : name)
    .sort();
}
function files(path: string): readonly string[] {
  return readdirSync(new URL(path, ROOT)).filter((name) => name.endsWith(".md")).sort();
}

const readme = source("rfc/README.md");
const activeSection = section(readme, "## Active", "## Pack-schema-version register");
const archiveSection = section(readme, "## Archive", "## The archive sketches");
const activeRows = rowNames(activeSection);
const archiveRows = rowNames(archiveSection, "archive/");
const archiveFiles = files("rfc/archive/");
const rootRfcFiles = files("rfc/").filter((name) => !["README.md", "template.md"].includes(name));

describe("D637/D638 RFC completion truth", () => {
  it("keeps root RFC files, Active rows, archive files and Archive rows set-equal", () => {
    expect(activeRows).toEqual(rootRfcFiles);
    expect(ACTIVE_TRUTH.map((row) => row.rfc).sort()).toEqual(activeRows);
    expect(archiveRows).toEqual(archiveFiles);
    expect(new Set(archiveRows).size).toBe(64);
  });

  it("proves every archived body calls itself implemented and every canonical docs link resolves", () => {
    for (const name of archiveFiles) {
      const body = source(`rfc/archive/${name}`);
      expect(body).toMatch(/^- \*\*Status:\*\*.*implemented/imu);
      expect(body).toMatch(/Acceptance criteria/iu);
    }
    const links = [...archiveSection.matchAll(/`((?:docs|workers)\/[^`]+\.md)`/gmu)].map((match) => match[1]!);
    expect(links.length).toBeGreaterThan(160);
    for (const link of links) expect(existsSync(new URL(link, ROOT)), link).toBe(true);
  });

  it("pins a planning record for every archive without pretending that it re-verifies the implementation", () => {
    const globalLog = source("planning/exploration/log.md");
    const globalCloseouts = new Set(["dead-vocabulary.md", "engine-leverage.md", "live-marker-quality.md", "vocabulary-wiring.md"]);
    for (const name of archiveFiles) {
      const stem = name.slice(0, -3);
      const dedicated = existsSync(new URL(`planning/archive/${stem}/log.md`, ROOT));
      const global = globalCloseouts.has(name) && globalLog.includes(stem);
      expect(dedicated || global, name).toBe(true);
    }
  });

  it("distinguishes accepted work from shipped code and dirty Stage 1 from HEAD", () => {
    const application = ["apps/", "packages/", "tools/", "Makefile"]
      .flatMap((path) => path === "Makefile" ? [source(path)] : [])
      .join("\n");
    expect(source("Makefile")).not.toContain("graduation-clear:");
    expect(source("Makefile")).not.toContain("register-check:");
    expect(source("Makefile")).not.toContain("status-parity:");
    expect(source("apps/server/src/storage.ts")).not.toContain("granted_via");
    expect(source("packages/schema/src/index.ts")).not.toContain("citable_text");
    expect(source("apps/web/src/lib/run-state.ts")).not.toMatch(/\breveal\s*\(/u);
    expect(application).not.toContain("this sentinel exists only to keep the source list explicit");

    const status = execFileSync("git", ["status", "--porcelain", "--untracked-files=all"], {
      cwd: new URL("../../", import.meta.url), encoding: "utf8",
    });
    expect(status).toContain("apps/server/src/authored-feedback.ts");
    expect(status).toContain("tools/feedback-delivery-harness/");
    const committedFeedback = execFileSync("git", ["show", "HEAD:apps/server/src/authored-feedback.ts"], {
      cwd: new URL("../../", import.meta.url), encoding: "utf8",
    });
    expect(committedFeedback).not.toContain("admittedFeedbackClaimIds");
    expect(source("apps/server/src/authored-feedback.ts")).toContain("admittedFeedbackClaimIds");
  });

  it("emits the dated three-level completion report", () => {
    const rows = ACTIVE_TRUTH.filter((row) => row.reality !== "process");
    const counts = Object.fromEntries([...new Set(rows.map((row) => row.reality))].map((reality) => [reality, rows.filter((row) => row.reality === reality).length]));
    const lines = [
      "# D637/D638 RFC completion truth — raw output",
      "",
      `Archive files: ${archiveFiles.length}; Archive-table rows: ${archiveRows.length}; self-declared implemented: ${archiveFiles.length}.`,
      "Canonical documentation links: all resolve. Planning record: 60 dedicated archived logs + 4 A0 global closeouts.",
      "Independent current per-RFC clean-tree re-verification: 4 (live-marker-quality, dead-vocabulary, engine-leverage, vocabulary-wiring).",
      "Current 1.0 capability proof: not implied by archive state; A1 proves only the drill loop and native human match as integrated journeys.",
      "",
      "## Active product RFC truth",
      "",
      "| RFC | register | audited reality | legal next action |",
      "|---|---|---|---|",
      ...rows.map((row) => `| \`${row.rfc}\` | ${row.registerState} | \`${row.reality}\` | ${row.nextAction} |`),
      "",
      `Reality counts: ${Object.entries(counts).map(([key, value]) => `${key}=${value}`).join(", ")}.`,
      "",
      "## Completion levels",
      "",
      "1. Lifecycle-closed: 64/64 archive files are now registered, label themselves implemented, link to existing canonical docs and carry a planning record.",
      "2. Independently reverified against current code: four RFCs have a named A0 clean-tree per-RFC trace. Aggregate verification of HEAD is not a substitute for re-deriving all historical criteria.",
      "3. Current 1.0 outcome-complete: archive membership says nothing about this level; capability/workflow audits own it and currently reject the shared evidence pool, guided defaults, Review Map, theory bundle, bot personality, player identity, campaign and release appliance as complete.",
      "",
      "## Dirty feedback-delivery boundary",
      "",
      "The worktree contains Stage-1 code and corrected CR1 instruments, while the committed RFC remains accepted and unimplemented. D645's foundation repair moved C1 reach from 42/50 to 50/50; criterion 20's author conflict and the landing-time gate edit remain. Do not archive feedback-delivery until the separate authored Stage 2 obligation is discharged.",
      "",
    ];
    writeFileSync(OUT, lines.join("\n"));
  });
});
