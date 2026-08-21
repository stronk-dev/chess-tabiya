// DISPOSABLE research harness — platform-alignment R15/R16. Not production code.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { permittedAssistance } from "@chess-tabiya/runtime";
import { ASSISTANCE_PROFILES, assistanceProfile } from "../../apps/web/src/lib/assistance-preference.js";

const ROOT = new URL("../../", import.meta.url).pathname;
const OUTPUT = join(ROOT, "tools/r15-r16-professional-workflow-harness/conformance-output.md");
const kinds = ["stream", "academy", "match"] as const;
const roles = ["solo", "host", "participant", "spectator"] as const;

function source(path: string): string { return readFileSync(join(ROOT, path), "utf8"); }
function between(value: string, startMarker: string, endMarker: string): string {
  const start = value.indexOf(startMarker);
  if (start < 0) return "";
  const end = value.indexOf(endMarker, start + startMarker.length);
  return end < 0 ? "" : value.slice(start, end);
}

describe("R15/R16 professional workflow conformance", () => {
  it("measures explicit profiles and the role/disclosure ceiling", () => {
    const profiles = Object.fromEntries(kinds.map((kind) => [kind, assistanceProfile({ sessionKind: "position", feedbackPolicy: "attempt_end", liveKind: kind })]));
    expect(profiles).toEqual({ stream: "stream", academy: "position", match: "match" });
    expect(ASSISTANCE_PROFILES).not.toContain("academy");

    const rows = kinds.flatMap((kind) => roles.flatMap((role) => [false, true].map((deliveryOpen) => ({
      kind, role, deliveryOpen,
      permission: permittedAssistance({ sessionKind: "position", role, deliveryOpen }),
    }))));
    for (const kind of kinds) {
      const baseline = rows.filter((row) => row.kind === kind);
      const stream = rows.filter((row) => row.kind === "stream");
      expect(baseline.map((row) => row.permission)).toEqual(stream.map((row) => row.permission));
    }
    for (const row of rows.filter((item) => item.role === "participant" || item.role === "spectator")) {
      expect(row.permission.humanSplit).toBe("locked_off");
      expect(row.permission.corpus).toBe("locked_off");
      expect(row.permission.boardLighting).toBe("sight");
      expect(row.permission.arrows).toBe("sight");
    }
    const openHost = rows.find((row) => row.kind === "match" && row.role === "host" && row.deliveryOpen)!;
    const openParticipant = rows.find((row) => row.kind === "match" && row.role === "participant" && row.deliveryOpen)!;
    expect(openHost.permission.humanSplit).toBe("free");
    expect(openParticipant.permission.humanSplit).toBe("locked_off");
  });

  it("audits overlay, voting, adapter, delay and accepted-RFC ownership", () => {
    const app = source("apps/web/src/App.svelte");
    const overlay = between(app, '{:else if route.name === "live-overlay"}', '{:else if route.name === "library"}');
    const service = source("apps/server/src/live-session.ts");
    const docs = source("docs/live-sessions.md");
    const register = source("rfc/README.md");
    const queue = source("planning/platform-alignment/execution-queue.md");

    const topology = {
      overlayUsesSharedRunState: overlay.includes("session.runState") && overlay.includes("activeLiveDetail"),
      overlayQueriesEvidenceProvider: /humanSplit|corpus|evidence\(|voice|speech|analysis/iu.test(overlay),
      overlayStatesWithholding: overlay.includes("evidence is withheld"),
      overlayAttributesRelayedVotes: overlay.includes("voteAttribution(activeLiveDetail)"),
      uiSupportsTwoToEightOptions: app.includes("MAX_LIVE_VOTE_OPTIONS") && app.includes("Add option") && app.includes("Two to eight legal UCI moves"),
      serviceSupportsTwoToEightOptions: service.includes("input.options.length<2||input.options.length>8"),
      adapterIdentityQualified: /only as trustworthy\s+as (the|its) adapter/iu.test(docs),
      externalProviderAdapterImplemented: /twitch|youtube|oauth/iu.test(service),
      editorialAudienceDelayImplemented: /broadcastDelay|audienceDelay|delaySeconds/iu.test(service + app),
      transportPollingDocumented: docs.includes("polling") && docs.includes("two seconds"),
      teacherAccepted: /teacher-surface\.md[^\n]*\| \*\*accepted/iu.test(register),
      queueStillWaitsOnR15O11: queue.includes("Teacher waits on R15/O11 or amendment"),
    };
    expect(topology.overlayUsesSharedRunState).toBe(true);
    expect(topology.overlayQueriesEvidenceProvider).toBe(false);
    expect(topology.overlayStatesWithholding).toBe(true);
    expect(topology.overlayAttributesRelayedVotes).toBe(true);
    expect(topology.uiSupportsTwoToEightOptions).toBe(true);
    expect(topology.serviceSupportsTwoToEightOptions).toBe(true);
    expect(topology.adapterIdentityQualified).toBe(true);
    expect(topology.externalProviderAdapterImplemented).toBe(false);
    expect(topology.editorialAudienceDelayImplemented).toBe(false);
    expect(topology.transportPollingDocumented).toBe(true);
    expect(topology.teacherAccepted).toBe(true);
    expect(topology.queueStillWaitsOnR15O11).toBe(true);

    const report = [
      "# R15/R16 professional workflow conformance",
      "",
      "Disposable current-tree result; no product authority.",
      "",
      "## Live-kind preference profiles",
      "",
      ...kinds.map((kind) => `- ${kind}: ${assistanceProfile({ sessionKind: "position", feedbackPolicy: "attempt_end", liveKind: kind })}`),
      "",
      "Academy collapses to the generic position profile; Stream and Match are explicit.",
      "",
      "## Assistance ceiling",
      "",
      "Session kind changes no permission byte. After disclosure, solo/host may request human/corpus evidence; participant/spectator remain locked and sight-capped. A host-seated match player therefore outranks a participant-seated opponent.",
      "",
      "## Surface/ownership",
      "",
      ...Object.entries(topology).map(([key, value]) => `- ${key}: ${value}`),
      "",
    ];
    writeFileSync(OUTPUT, report.join("\n"));
  });
});
