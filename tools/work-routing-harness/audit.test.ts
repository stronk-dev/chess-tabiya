// DISPOSABLE routing audit — D641. It detects omission; D487 owns unique/live ownership.
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { ROUTE_GROUPS, ROUTED_IDS } from "./registry.js";

const ROOT_PATH = new URL("../../", import.meta.url).pathname;
const OUT = new URL("./output.md", import.meta.url);
const CLOSED = new Set(["✅", "⛔"]);
function source(path: string): string { return readFileSync(join(ROOT_PATH, path), "utf8"); }
function markdown(path: string): readonly string[] {
  const result: string[] = [];
  for (const name of readdirSync(join(ROOT_PATH, path))) {
    const relative = join(path, name);
    if (name === "archive") continue;
    if (statSync(join(ROOT_PATH, relative)).isDirectory()) result.push(...markdown(relative));
    else if (name.endsWith(".md") && !name.endsWith("log.md")) result.push(relative);
  }
  return result;
}

interface LedgerRow { readonly id: string; readonly status: string; }
function ledgerRows(): readonly LedgerRow[] {
  return [...source("design/BACKLOG.md").matchAll(/^\| (D\d+[a-z]?)(?:\s+([^|]*?))? \|/gimu)]
    .map((match) => ({ id: match[1]!, status: (match[2] ?? "").trim() }));
}

describe("D641 minimum work-routing audit", () => {
  it("pins the ledger population and unique ids after the refresh", () => {
    const rows = ledgerRows();
    expect(rows).toHaveLength(590);
    expect(new Set(rows.map((row) => row.id)).size).toBe(rows.length);
    expect(rows.filter((row) => !CLOSED.has(row.status))).toHaveLength(354);
    expect(rows.find((row) => row.id === "D99")?.status).toBe("✅");
    expect(rows.find((row) => row.id === "D641")?.status).toBe("✅");
  });

  it("routes every open id that previously had no living planning or active-RFC mention", () => {
    const excluded = new Set([
      "planning/platform-alignment/unrouted-defect-refresh.md",
    ]);
    const routeFiles = [
      ...markdown("planning").filter((path) => !excluded.has(path)),
      ...readdirSync(join(ROOT_PATH, "rfc")).filter((name) => name.endsWith(".md") && !["README.md", "template.md", "0000-rfc-process.md"].includes(name)).map((name) => `rfc/${name}`),
    ];
    const texts = routeFiles.map((path) => source(path));
    const unmentioned = ledgerRows()
      .filter((row) => !CLOSED.has(row.status))
      .filter((row) => !texts.some((text) => new RegExp(`\\b${row.id}\\b`, "u").test(text)))
      .map((row) => row.id)
      .sort();
    expect(ROUTED_IDS).toHaveLength(74);
    expect(unmentioned).toEqual(ROUTED_IDS);
  });

  it("assigns each residue exactly one primary destination in this refresh", () => {
    expect(new Set(ROUTED_IDS).size).toBe(ROUTED_IDS.length);
    for (const group of ROUTE_GROUPS) {
      expect(group.action).not.toBe("");
      expect(group.ids.length).toBeGreaterThan(0);
    }
  });

  it("emits the explicit routing refresh", () => {
    const lines = [
      "# D641 unrouted-defect refresh — raw output",
      "",
      "Pre-refresh ledger: 589 ids, 355 open. Seventy-five open ids had no living non-log planning or active-RFC mention.",
      "Intervention: D99 closed as a stale historical hazard; the other 74 receive exactly one primary destination below. Current ledger: 590 ids, 354 open after D641 closeout.",
      "This proves no zero-mention residue remains after the refresh. It does not prove the other 280 open rows have one live, unique, non-stale owner; D487 and the future derived work register retain that stronger job.",
      "",
      "| destination | ids | action |",
      "|---|---|---|",
      ...ROUTE_GROUPS.map((group) => `| ${group.destination} | ${group.ids.join(", ")} | ${group.action} |`),
      "",
    ];
    writeFileSync(OUT, lines.join("\n"));
  });
});
