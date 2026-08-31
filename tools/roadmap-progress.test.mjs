import assert from "node:assert/strict";
import test from "node:test";

import { formatRoadmapProgress } from "./roadmap-progress.mjs";

test("reports checkpoints separately from strict completion gates", () => {
  const report = formatRoadmapProgress({
    milestones: [{
      id: "stable-board-and-presets",
      state: "active",
      latestCheckpoint: { at: "2026-08-31", impact: "advanced", summary: "stable shell shipped" },
    }],
    summary: {
      dimensionStates: { proven: 1, partial: 1 },
      activeRfcLifecycle: { draft: 2, accepted: 1 },
      workItems: { queued: 3, completed: 4 },
    },
  });
  assert.match(report, /stable-board-and-presets: active.*stable shell shipped/u);
  assert.match(report, /Active RFCs \(3\): draft=2, accepted=1/u);
  assert.match(report, /strict 1\.0 release gates/u);
});
