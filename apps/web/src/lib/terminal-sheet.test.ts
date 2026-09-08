// @vitest-environment happy-dom

import { createRun } from "@chess-tabiya/runtime";
import { mount, unmount } from "svelte";
import { describe, expect, it, vi } from "vitest";

import TerminalSheet from "./TerminalSheet.svelte";

function target(): HTMLElement {
  document.body.innerHTML = "";
  return document.body;
}

describe("terminal assignment hand-in", () => {
  it("keeps the post-outcome offer inside the terminal ritual and confirms consent", async () => {
    const onSubmitAssignment = vi.fn(async () => undefined);
    const component = mount(TerminalSheet, {
      target: target(),
      props: {
        outcome: "loss",
        authoredItems: [],
        evidence: [],
        canRewind: false,
        onRewind: () => undefined,
        onStop: () => undefined,
        run: createRun({
          id: "terminal-assignment-run",
          packId: "assigned-pack",
          packDigest: `sha256:${"1".repeat(64)}`,
          startFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
          seed: 1,
          createdAt: "2026-08-27T12:00:00.000Z",
          policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } },
        }),
        assignmentOffers: [{
          id: "assignment-one",
          classroomName: "Endgame study",
          assignedByHandle: "coach",
          teacherHandles: ["coach", "assistant"],
          note: "Compare both plans",
        }],
        onSubmitAssignment,
      },
    });

    expect(document.body.textContent).toContain("Hand in this attempt");
    expect(document.body.textContent).toContain("Endgame study · assigned by @coach");
    expect(document.body.textContent).toContain("Teacher note: Compare both plans");
    const review = [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "Review sharing")!;
    review.click();
    expect(onSubmitAssignment).not.toHaveBeenCalled();
    await vi.waitFor(() => expect(document.body.textContent).toContain("Share this completed attempt?"));
    expect(document.body.textContent).toContain("@coach, @assistant will be able to read this run for up to 90 days");
    expect(document.body.textContent).toContain("evidence or reveals you opened during it");
    expect(document.body.textContent).toContain("cannot undo what a teacher already saw");
    [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "Cancel")!.click();
    await vi.waitFor(() => expect(document.body.textContent).not.toContain("Share this completed attempt?"));
    expect(onSubmitAssignment).not.toHaveBeenCalled();
    [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "Review sharing")!.click();
    const confirm = await vi.waitFor(() => {
      const candidate = [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "Confirm sharing");
      expect(candidate).toBeDefined();
      return candidate!;
    });
    confirm.click();
    await vi.waitFor(() => expect(onSubmitAssignment).toHaveBeenCalledWith("assignment-one"));
    await unmount(component);
  });

  it("keeps repertoire adoption explicit on the completed attempt", async () => {
    const onChooseRepertoireAnswer = vi.fn(async () => undefined);
    const component = mount(TerminalSheet, {
      target: target(),
      props: {
        outcome: "win",
        authoredItems: [],
        evidence: [],
        canRewind: false,
        onRewind: () => undefined,
        onStop: () => undefined,
        run: createRun({
          id: "gap-run",
          session: {kind:"position",start:{fen:"8/8/8/8/8/4k3/6P1/4K3 w - - 0 1",side:"white"},feedbackPolicy:"attempt_end",opponentPolicy:{mode:"strong_engine"}},
          sessionDigest: `sha256:${"2".repeat(64)}`,
          seed: 2,
          createdAt: "2026-09-08T12:00:00.000Z",
          policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } },
        }),
        repertoireAnswerOffer: {
          repertoireId: "rep-one",
          repertoireName: "My Black repertoire",
          repertoireDigest: `sha256:${"3".repeat(64)}`,
          gap: {key:"gap-key",representativeFen:"",replySan:"e4",replyUci:"e2e4",line:["e4"],mass:.5,gamesUntilSeen:2,state:"addressed",runId:"gap-run",firstMoves:[{moveUci:"c7c5",moveSan:"c5"},{moveUci:"e7e5",moveSan:"e5"}],answer:null},
        },
        onChooseRepertoireAnswer,
      },
    });
    expect(document.body.textContent).toContain("Tabiya never adopts a move automatically");
    expect(onChooseRepertoireAnswer).not.toHaveBeenCalled();
    [...document.querySelectorAll<HTMLButtonElement>("button")].find((button)=>button.textContent==="Use c5 as my repertoire answer")!.click();
    await vi.waitFor(()=>expect(onChooseRepertoireAnswer).toHaveBeenCalledWith("rep-one","gap-key","c7c5",`sha256:${"3".repeat(64)}`));
    await unmount(component);
  });
});
