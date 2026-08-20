// DISPOSABLE research harness — D635. Not production code or UX validation.
import { readFileSync, writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { SILENT_ASSISTANCE, permittedAssistance, type RunSessionKind } from "@chess-tabiya/runtime";
import {
  ASSISTANCE_PROFILES,
  assistanceProfile,
  loadAssistance,
} from "../../apps/web/src/lib/assistance-preference.js";
import { WORKFLOWS } from "../r3-presentation-harness/workflow-contract.js";
import { WORKFLOW_BINDINGS } from "./registry.js";

const ROOT = new URL("../../", import.meta.url);
const OUT = new URL("./output.md", import.meta.url);
const AXES = Object.freeze(Object.keys(SILENT_ASSISTANCE).filter((key) => key !== "version").sort());

function source(path: string): string { return readFileSync(new URL(path, ROOT), "utf8"); }
function matches(text: string, pattern: RegExp): readonly string[] { return [...text.matchAll(pattern)].map((match) => match[1]!).sort(); }

describe("D635 workflow/default conformance", () => {
  it("proves all six technical profiles have one byte-identical unnamed default", () => {
    expect(ASSISTANCE_PROFILES).toHaveLength(6);
    const defaults = ASSISTANCE_PROFILES.map((profile) => loadAssistance(profile, { getItem: () => null, setItem() {} }));
    for (const value of defaults) expect(value).toEqual(SILENT_ASSISTANCE);
    expect(new Set(defaults.map((value) => JSON.stringify(value))).size).toBe(1);
    expect(AXES).toHaveLength(9);
  });

  it("proves the shipped permission ceiling ignores session kind and misses academy addressing", () => {
    const sessionKinds: readonly RunSessionKind[] = ["pack", "position", "imported"];
    for (const deliveryOpen of [false, true]) {
      for (const role of ["solo", "host", "participant", "spectator"] as const) {
        const rows = sessionKinds.map((sessionKind) => permittedAssistance({ sessionKind, deliveryOpen, role }));
        expect(rows[1]).toEqual(rows[0]);
        expect(rows[2]).toEqual(rows[0]);
      }
    }
    expect(assistanceProfile({ sessionKind: "pack", feedbackPolicy: "attempt_end", liveKind: "stream" })).toBe("stream");
    expect(assistanceProfile({ sessionKind: "pack", feedbackPolicy: "attempt_end", liveKind: "match" })).toBe("match");
    expect(assistanceProfile({ sessionKind: "pack", feedbackPolicy: "attempt_end", liveKind: "academy" })).toBe("pack");
    expect(ASSISTANCE_PROFILES).not.toContain("academy");
  });

  it("pins workflow aliasing, settings/in-run axes and route-level bypasses", () => {
    expect(WORKFLOW_BINDINGS.map((row) => row.workflow)).toEqual(WORKFLOWS.map((row) => row.id));
    expect(WORKFLOW_BINDINGS.filter((row) => ASSISTANCE_PROFILES.includes(row.currentBinding as never))).toHaveLength(2);

    const settings = source("apps/web/src/lib/AssistanceSettings.svelte");
    const drill = source("apps/web/src/lib/DrillScreen.svelte");
    const app = source("apps/web/src/App.svelte");
    const configured = [...new Set(matches(settings, /configs\[kind\]\.(\w+)/gu))].sort();
    const inRun = [...new Set(matches(drill, /setAssistance\("(\w+)"/gu))].sort();
    expect(configured).toEqual(AXES);
    expect(inRun).toEqual(["corpus", "guided", "humanSplit", "markers", "spoken", "voice"]);
    expect(drill).not.toContain("assistance.arrows");
    expect(drill.match(/loadAssistance\(/gu)?.length).toBe(1);
    const ambientLine = drill.split("\n").find((line) => line.includes('class="ambient"'))!;
    expect(ambientLine).toContain('aria-label="Open assistance"');
    expect(ambientLine).not.toContain("onclick");
    expect(app).toContain('onVoice={capabilities?.providers.llm === "external"');
    expect(app).not.toContain("loadAssistance(");
    expect(app).not.toContain('name: "campaign"');
  });

  it("emits a reproducible workflow/default report", () => {
    const settings = source("apps/web/src/lib/AssistanceSettings.svelte");
    const drill = source("apps/web/src/lib/DrillScreen.svelte");
    const configured = [...new Set(matches(settings, /configs\[kind\]\.(\w+)/gu))].sort();
    const inRun = [...new Set(matches(drill, /setAssistance\("(\w+)"/gu))].sort();
    const lines = [
      "# D635 workflow/default conformance — raw output",
      "",
      `Technical profiles: ${ASSISTANCE_PROFILES.length}; assistance axes: ${AXES.length}; settings controls: ${ASSISTANCE_PROFILES.length * configured.length}.`,
      `Distinct unset defaults: 1. Default: ${JSON.stringify(SILENT_ASSISTANCE)}.`,
      `In-run configurable axes: ${inRun.length}/${AXES.length} (${inRun.join(", ")}).`,
      `Settings-only axes: ${AXES.filter((axis) => !inRun.includes(axis)).join(", ")}.`,
      "Session-kind permission variants across pack/position/imported: 1 (byte-identical for every role/disclosure cell).",
      "Academy profile: absent; academy live sessions fall through to their source run's pack/position/imported profile.",
      "",
      "## Workflow binding",
      "",
      "| workflow | product entry | current binding | current reality |",
      "|---|---|---|---|",
      ...WORKFLOW_BINDINGS.map((row) => `| \`${row.workflow}\` | ${row.productEntry} | \`${row.currentBinding}\` | ${row.currentReality} |`),
      "",
      "## Conformance result",
      "",
      "- Only Just Play and the generic pack path map directly to one technical preference profile; four of six intended workflows are mixed, inherited or absent.",
      "- No persisted workflow ID or preset ID exists in production, so a different default cannot be attached to Review, Analyze or Campaign.",
      "- Story narration is provider-gated but does not consult the imported profile's voice preference.",
      "- The settings surface now does configure all nine axes; the older 36-control/three-overlap ledger claim is stale.",
      "- Arrows have no DrillScreen reader; Ambient is labelled as an opening button but has no click action; a mounted run reads its profile only once.",
      "",
    ];
    writeFileSync(OUT, lines.join("\n"));
  });
});

