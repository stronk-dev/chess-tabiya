// @vitest-environment happy-dom

import { createRun } from "@chess-tabiya/runtime";
import { mount, unmount } from "svelte";
import { describe, expect, it, vi } from "vitest";

import TerminalSheet from "./TerminalSheet.svelte";

function deferred<T>(): { readonly promise: Promise<T>; readonly resolve: (value: T) => void; readonly reject: (reason?: unknown) => void } {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => { resolve = resolvePromise; reject = rejectPromise; });
  return { promise, resolve, reject };
}

function terminalRun(id: string) {
  return createRun({
    id,
    packId: "assigned-pack",
    packDigest: `sha256:${"1".repeat(64)}`,
    startFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    seed: 1,
    createdAt: "2026-08-27T12:00:00.000Z",
    policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } },
  });
}

function target(): HTMLElement {
  document.body.innerHTML = "";
  return document.body;
}

describe("terminal assignment hand-in", () => {
  it("keeps opposite-side replay single-flight and presents a bounded retry", async () => {
    let rejectFlip!: (reason?: unknown) => void;
    const onFlip = vi.fn(() => new Promise<void>((_resolve, reject) => { rejectFlip = reject; }));
    const component = mount(TerminalSheet, {
      target: target(),
      props: {
        outcome: "win",
        authoredItems: [],
        evidence: [],
        canRewind: true,
        onRewind: () => undefined,
        onStop: () => undefined,
        run: createRun({
          id: "terminal-flip-run",
          packId: "flip-pack",
          packDigest: `sha256:${"0".repeat(64)}`,
          startFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
          seed: 7,
          createdAt: "2026-09-13T11:00:00.000Z",
          policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } },
        }),
        onFlip,
      },
    });

    const replay = [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "Replay this as Black")!;
    replay.click();
    replay.click();
    await vi.waitFor(() => expect(onFlip).toHaveBeenCalledTimes(1));
    expect(replay.disabled).toBe(true);
    expect(document.body.textContent).toContain("The completed game stays unchanged.");
    rejectFlip(new Error("private flip failure"));
    await vi.waitFor(() => expect(document.body.textContent).toContain("The opposite-side replay could not be opened."));
    expect(document.body.textContent).not.toContain("private flip failure");
    expect(replay.disabled).toBe(false);
    await unmount(component);
  });

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
    expect(document.body.textContent).toContain("any help you opened during it");
    expect(document.body.textContent).not.toContain("evidence or reveals");
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

  it("keeps failed return and sharing intents visible with bounded, single-flight outcomes", async () => {
    const schedule = deferred<boolean>();
    const share = deferred<boolean>();
    const onScheduleReturn = vi.fn(() => schedule.promise);
    const onSubmitAssignment = vi.fn(() => share.promise);
    const component = mount(TerminalSheet, {
      target: target(),
      props: {
        outcome: "loss", authoredItems: [], evidence: [], canRewind: false,
        onRewind: () => undefined, onStop: () => undefined, run: terminalRun("terminal-failure-run"),
        canScheduleReturn: true, onScheduleReturn,
        assignmentOffers: [{ id: "assignment-one", classroomName: "Endgame study", assignedByHandle: "coach", teacherHandles: ["coach"], note: null }],
        onSubmitAssignment,
      },
    });
    const retry = [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "Schedule a retry from here")!;
    retry.click(); retry.click();
    expect(onScheduleReturn).toHaveBeenCalledTimes(1);
    schedule.resolve(false);
    await vi.waitFor(() => expect(document.body.textContent).toContain("retry could not be added"));
    expect(document.body.textContent).toContain("Schedule a retry from here");

    [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "Review sharing")!.click();
    const confirm = await vi.waitFor(() => {
      const candidate = [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "Confirm sharing");
      expect(candidate).toBeDefined();
      return candidate!;
    });
    confirm.click(); confirm.click();
    expect(onSubmitAssignment).toHaveBeenCalledTimes(1);
    await vi.waitFor(() => expect(document.body.textContent).toContain("Sharing this completed attempt"));
    share.resolve(false);
    await vi.waitFor(() => expect(document.body.textContent).toContain("run could not be shared"));
    expect(document.body.textContent).toContain("Share this completed attempt?");
    expect(document.body.textContent).not.toContain("private");
    await unmount(component);
  });

  it("contains thrown and departed terminal-action settlements", async () => {
    const late = deferred<boolean>();
    const onSubmitAssignment = vi.fn()
      .mockRejectedValueOnce(new Error("private classroom storage trace"))
      .mockImplementationOnce(() => late.promise);
    const props = {
      outcome: "loss" as const, authoredItems: [], evidence: [], canRewind: false,
      onRewind: () => undefined, onStop: () => undefined, run: terminalRun("terminal-departed-run"),
      assignmentOffers: [{ id: "assignment-one", classroomName: "Endgame study", assignedByHandle: "coach", teacherHandles: ["coach"], note: null }],
      onSubmitAssignment,
    };
    const component = mount(TerminalSheet, { target: target(), props });
    [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "Review sharing")!.click();
    (await vi.waitFor(() => {
      const candidate = [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "Confirm sharing");
      expect(candidate).toBeDefined();
      return candidate!;
    })).click();
    await vi.waitFor(() => expect(document.body.textContent).toContain("run could not be shared"));
    expect(document.body.textContent).not.toContain("private classroom storage trace");
    await unmount(component);

    const departedComponent = mount(TerminalSheet, { target: target(), props });
    [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "Review sharing")!.click();
    (await vi.waitFor(() => {
      const candidate = [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "Confirm sharing");
      expect(candidate).toBeDefined();
      return candidate!;
    })).click();
    await vi.waitFor(() => expect(onSubmitAssignment).toHaveBeenCalledTimes(2));
    await unmount(departedComponent);
    late.reject(new Error("private late settlement"));
    await Promise.resolve();
    expect(document.body.textContent).not.toContain("private late settlement");
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
