// DISPOSABLE research harness — D634. Not production code or product authority.
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { RULES_EVIDENCE_FACTS, SILENT_ASSISTANCE } from "@chess-tabiya/runtime";
import { CAPABILITY_DISPOSITIONS, SURFACE_IDS } from "../../apps/server/src/capabilities.js";
import { RECORDED_READING_DISPOSITIONS } from "../../apps/server/src/position-evidence.js";
import { EVIDENCE_KINDS } from "../../apps/server/src/sourcing/types.js";
import { MODULES } from "../r3-presentation-harness/module-contract.js";
import { PRESETS, WORKFLOWS } from "../r3-presentation-harness/workflow-contract.js";
import { PRODUCER_TOPOLOGY, RUNTIME_EVENT_KINDS } from "./registry.js";

const ROOT = new URL("../../", import.meta.url);
const OUT = new URL("./output.md", import.meta.url);

function source(path: string): string {
  return readFileSync(new URL(path, ROOT), "utf8");
}

function sourceFiles(url: URL): readonly URL[] {
  return readdirSync(url, { withFileTypes: true }).flatMap((entry) => {
    const child = new URL(entry.name + (entry.isDirectory() ? "/" : ""), url);
    if (entry.isDirectory()) return sourceFiles(child);
    return entry.isFile() && /\.(?:ts|svelte)$/u.test(entry.name) && !/\.test\.ts$/u.test(entry.name) ? [child] : [];
  });
}

function intersection(left: readonly string[], right: readonly string[]): readonly string[] {
  const rightSet = new Set(right);
  return left.filter((item) => rightSet.has(item));
}

describe("D634 evidence contract topology", () => {
  it("pins the independently evolved namespaces and their zero joins", () => {
    expect(source("packages/runtime/src/types.ts")).toContain('export type EvidenceKind = "eval" | "wdl" | "bestline" | "tablebase";');
    expect(RUNTIME_EVENT_KINDS).toHaveLength(4);
    expect(EVIDENCE_KINDS).toHaveLength(7);
    expect(intersection(RUNTIME_EVENT_KINDS, EVIDENCE_KINDS)).toEqual([]);
    expect(RULES_EVIDENCE_FACTS).toHaveLength(34);
    expect(RECORDED_READING_DISPOSITIONS.filter((row) => row.disposition === "admitted").map((row) => row.kind)).toEqual(["tablebase_result", "engine_eval"]);
    expect(CAPABILITY_DISPOSITIONS).toHaveLength(39);
    expect(intersection(
      [...new Set(CAPABILITY_DISPOSITIONS.flatMap((row) => row.surface === undefined ? [] : [row.surface]))],
      SURFACE_IDS,
    )).toEqual([]);
    expect(Object.keys(SILENT_ASSISTANCE).filter((key) => key !== "version")).toHaveLength(9);
    expect(MODULES).toHaveLength(9);
    expect(PRESETS).toHaveLength(5);
    expect(WORKFLOWS).toHaveLength(6);
  });

  it("pins every audited producer path and proves research modules have no production join", () => {
    expect(PRODUCER_TOPOLOGY).toHaveLength(14);
    for (const row of PRODUCER_TOPOLOGY) {
      expect(row.sourceAnchors.length, row.id).toBeGreaterThan(0);
      for (const anchor of row.sourceAnchors) expect(source(anchor.path), `${row.id}: ${anchor.path}`).toContain(anchor.needle);
    }

    const production = ["apps/server/src/", "apps/web/src/", "packages/runtime/src/"]
      .flatMap((path) => sourceFiles(new URL(path, ROOT)))
      .map((url) => readFileSync(url, "utf8"))
      .join("\n");
    for (const module of MODULES) expect(production, module.id).not.toContain(`\"${module.id}\"`);
    for (const workflow of WORKFLOWS) expect(production, workflow.id).not.toContain(`\"${workflow.id}\"`);
  });

  it("pins the packet/client omissions and emits the reproducible report", () => {
    const guidance = source("apps/server/src/guidance.ts");
    const voice = source("packages/runtime/src/voice.ts");
    const webApi = source("apps/web/src/lib/api.ts");
    const queue = source("apps/server/src/evidence-queue.ts");
    const capabilities = source("apps/server/src/capabilities.ts");

    expect(guidance).not.toContain("transitionReading(");
    expect(guidance).not.toContain("opening_identity");
    expect(guidance).not.toContain("HumanSplitPage");
    expect(guidance).not.toContain("CorpusPage");
    expect(guidance).toContain("observations: reading.features");
    expect(guidance).toContain("plans: Object.freeze(plans)");
    expect(guidance).not.toContain("...reading.features.map");
    expect(guidance).not.toContain("...plans.map");
    expect(voice).toContain('const source = packet.sentences.join("\\n")');
    expect(webApi.slice(webApi.indexOf("export interface Capabilities"), webApi.indexOf("export interface HumanSplitPage"))).not.toContain("capabilityDispositions");
    expect(capabilities).toContain('capability: "bestmove / MultiPV rank / bestline", disposition: "refused"');
    expect(queue).toContain("bestMoveUci: bestMove");
    expect(source("apps/server/src/rest.ts")).toContain("analysis kind must be bestline, eval, or wdl");

    const statusCounts = new Map<string, number>();
    for (const row of PRODUCER_TOPOLOGY) statusCounts.set(row.status, (statusCounts.get(row.status) ?? 0) + 1);
    const capabilitySurfaces = [...new Set(CAPABILITY_DISPOSITIONS.flatMap((row) => row.surface === undefined ? [] : [row.surface]))].sort();
    const lines = [
      "# D634 evidence topology — raw output",
      "",
      "## Namespace census",
      "",
      "| namespace / contract | members | compiled join |",
      "|---|---:|---|",
      `| runtime event payload kinds | ${RUNTIME_EVENT_KINDS.length} | 0/${RUNTIME_EVENT_KINDS.length} names match the sourcing ledger |`,
      `| sourcing ledger evidence kinds | ${EVIDENCE_KINDS.length} | 2/${EVIDENCE_KINDS.length} admitted to recorded readings |`,
      `| rules evidence facts | ${RULES_EVIDENCE_FACTS.length} | family-name refs only; no subject/object/square operands |`,
      `| capability dispositions | ${CAPABILITY_DISPOSITIONS.length} | 0/${capabilitySurfaces.length} free-text surface names match ${SURFACE_IDS.length} canonical surface IDs |`,
      `| production assistance axes | ${Object.keys(SILENT_ASSISTANCE).length - 1} | 0 compiled joins to research module IDs |`,
      `| research modules / presets / workflows | ${MODULES.length} / ${PRESETS.length} / ${WORKFLOWS.length} | 0 module IDs and 0 workflow IDs occur in production source |`,
      "",
      "## Producer paths",
      "",
      "| producer id | output | current consumer | status | retained semantics |",
      "|---|---|---|---|---|",
      ...PRODUCER_TOPOLOGY.map((row) => `| \`${row.id}\` | ${row.output} | ${row.currentConsumer} | ${row.status} | ${row.retainedSemantics} |`),
      "",
      "## Status totals",
      "",
      ...[...statusCounts].sort().map(([status, count]) => `- ${status}: ${count}`),
      "",
      "## Pinned contradictions and omissions",
      "",
      "- The EvidencePacket has typed structural observations and plans, but neither contributes to the normative sentence allow-list.",
      "- Transition readings, Maia human splits, Lichess corpus results and opening identity never enter the packet.",
      "- Recorded engine/tablebase readings enter a typed field but are appended only after LLM validation; the LLM cannot select or translate them.",
      "- The server publishes 39 capability dispositions, while the web Capabilities interface omits the field.",
      "- Stockfish bestmove/bestline is globally labelled refused, but the analysis route accepts bestline and eval payloads carry bestMoveUci. The missing dimension is consumer/timing, not a universal capability verdict.",
      "",
    ];
    writeFileSync(OUT, lines.join("\n"));
  });
});

