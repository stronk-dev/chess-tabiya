// @vitest-environment happy-dom

import type { Api } from "@lichess-org/chessground/api";
import type { Config } from "@lichess-org/chessground/config";
import { appendEvents, commitMove, createRun, fork, groupsFromEvents, rewind } from "@chess-tabiya/runtime";
import { mount, tick, unmount } from "svelte";
import { afterEach, describe, expect, it, vi } from "vitest";

const chessground = vi.hoisted(() => ({ destroy: vi.fn<() => void>() }));
vi.mock("@lichess-org/chessground", () => ({
  Chessground: (_element: HTMLElement, _config: Config) => ({ destroy: chessground.destroy, set() {} }) as unknown as Api,
}));

import GroupPanel from "./GroupPanel.svelte";

const at = "2026-08-14T12:00:00.000Z";

function groupedRun() {
  let run = createRun({
    id: "group-view", packId: "pack", packDigest: `sha256:${"1".repeat(64)}`,
    policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } },
    startFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", seed: 9, createdAt: at,
  });
  const root = run.activeCursor.nodeId;
  run = commitMove(run, "e2e4", { at }).run;
  const main = run.activeCursor.branchId;
  run = rewind(run, root, at).run;
  run = fork(run, root, { label: "d4", at }).run;
  run = commitMove(run, "d2d4", { at }).run;
  const alternative = run.activeCursor.branchId;
  run = appendEvents(run, [{
    type: "group.created", at,
    data: {
      groupId: "group-view:group:1", sourceNodeId: root, source: "hand_picked", resistance: "fixed",
      members: [{ branchId: main, seedMoveUci: "e2e4" }, { branchId: alternative, seedMoveUci: "d2d4" }],
    },
  }]);
  return run;
}

describe("GroupPanel", () => {
  let component: ReturnType<typeof mount> | undefined;
  afterEach(async () => { if (component !== undefined) await unmount(component); document.body.innerHTML = ""; });

  it("uses semantic zoom, states missing evidence, and never ranks members", async () => {
    const run = groupedRun();
    const host = document.createElement("div"); document.body.append(host);
    component = mount(GroupPanel, {
      target: host,
      props: {
        run, group: groupsFromEvents(run)[0]!, startSide: "white", advanceMode: "sequential",
        onAdvanceMode() {}, onEnter() {}, onCompare() {}, onAnalyze() {},
      },
    });

    (Array.from(host.querySelectorAll("button")).find((button) => button.textContent === "Overview") as HTMLButtonElement).click(); await tick();
    expect(host.querySelector("[aria-label='Chessboard']")).toBeNull();
    expect(host.textContent).not.toContain("No recorded engine evidence");

    (Array.from(host.querySelectorAll("button")).find((button) => button.textContent === "Boards") as HTMLButtonElement).click(); await tick();
    expect(host.querySelector(".canvas")?.getAttribute("data-zoom"), host.innerHTML).toBe("near");
    expect(host.querySelectorAll("[aria-label='Chessboard']"), host.innerHTML).toHaveLength(2);
    expect(host.textContent).toContain("No recorded engine evidence for this branch leaf.");
    expect(host.textContent).toContain("same position always receives the same reply");
    expect(host.textContent?.toLowerCase()).not.toMatch(/\b(rank|score|better|worse|best|worst)\b/);
  });
});
