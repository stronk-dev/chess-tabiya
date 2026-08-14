import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { appendEvents, groupsFromEvents, projectRun } from "./events.js";
import { commitMove, createRun, fork, rewind } from "./runtime.js";
import type { DrillRun, EventDraft, GroupSource, OpponentSelection } from "./types.js";

const FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const at = "2026-08-14T12:00:00.000Z";
const seeds = ["g1f3", "b1c3", "f2f4", "d2d4", "c2c3", "h2h3", "a2a3", "b2b3"] as const;

function started(id = "groups"): DrillRun {
  return createRun({
    id,
    packId: "fixture",
    packDigest: `sha256:${"a".repeat(64)}`,
    policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } },
    startFen: FEN,
    seed: 7,
    createdAt: at,
  });
}

function candidatePosition(id = "groups"): { run: DrillRun; sourceNodeId: string } {
  let run = started(id);
  run = commitMove(run, "e2e4", { actor: "system", at }).run;
  run = commitMove(run, "e7e5", { actor: "system", at }).run;
  return { run, sourceNodeId: run.activeCursor.nodeId };
}

function withMembers(count: number, id = `groups-${count}`): { run: DrillRun; sourceNodeId: string; members: { branchId: string; seedMoveUci: string }[] } {
  const base = candidatePosition(id);
  let run = base.run;
  const members: { branchId: string; seedMoveUci: string }[] = [];
  for (const [index, moveUci] of seeds.slice(0, count).entries()) {
    if (index > 0) run = fork(run, base.sourceNodeId, { at }).run;
    run = commitMove(run, moveUci, { actor: "system", at }).run;
    members.push({ branchId: run.activeCursor.branchId, seedMoveUci: moveUci });
  }
  run = rewind(run, run.nodes.find((node) => node.parentId === base.sourceNodeId && node.branchId === members[0]!.branchId)!.id, at).run;
  return { run, sourceNodeId: base.sourceNodeId, members };
}

function distribution(mode: "human_common" | "strong_engine", moves: readonly string[]): OpponentSelection {
  return Object.freeze({
    moveUci: moves[0]!,
    policyModeApplied: mode,
    candidates: Object.freeze(moves.map((moveUci, index) => Object.freeze({ moveUci, rank: index + 1 }))),
    engine: Object.freeze({ id: mode === "human_common" ? "maia" : "stockfish", name: mode, version: "1", seedHonored: false }),
  });
}

function groupDraft(input: ReturnType<typeof withMembers>, source: GroupSource = "hand_picked", sourceDistribution?: OpponentSelection): Extract<EventDraft, { type: "group.created" }> {
  return {
    type: "group.created",
    at,
    data: {
      groupId: `${input.run.id}:group:1`,
      sourceNodeId: input.sourceNodeId,
      source,
      resistance: "fixed",
      members: input.members,
      ...(sourceDistribution === undefined ? {} : { distribution: sourceDistribution }),
    },
  };
}

describe("branch group projection", () => {
  it("accepts an adopted main branch whose own fork predates the source node", () => {
    const input = withMembers(2);
    expect(input.run.branches[0]!.forkNodeId).not.toBe(input.sourceNodeId);
    const run = appendEvents(input.run, [groupDraft(input)]);
    expect(groupsFromEvents(run)).toEqual([
      expect.objectContaining({
        groupId: `${run.id}:group:1`,
        sourceNodeId: input.sourceNodeId,
        members: input.members,
        createdAtSeq: run.events.length,
      }),
    ]);
  });

  it("rejects missing seed children, duplicate membership, and group events before their seed", () => {
    const input = withMembers(2, "invalid-groups");
    expect(() => appendEvents(input.run, [{
      ...groupDraft(input),
      data: { ...groupDraft(input).data, members: [{ ...input.members[0]!, seedMoveUci: "g1h3" }, input.members[1]!] },
    }])).toThrow(/matching seed child/);

    const grouped = appendEvents(input.run, [groupDraft(input)]);
    expect(() => appendEvents(grouped, [{
      ...groupDraft(input),
      data: { ...groupDraft(input).data, groupId: `${input.run.id}:group:2` },
    }])).toThrow(/already belongs/);

    const group = grouped.events.at(-1)!;
    const seedIndex = grouped.events.findIndex((event) => event.type === "move.committed" && event.data.node.moveUci === input.members[1]!.seedMoveUci);
    const reordered = [...grouped.events];
    reordered.splice(reordered.length - 1, 1);
    reordered.splice(seedIndex, 0, group);
    const resequenced = reordered.map((event, index) => ({ ...event, seq: index + 1 }));
    expect(() => projectRun(resequenced)).toThrow(/matching seed child/);
  });

  it("requires grounded machine distributions and forbids them on authored sources", () => {
    const input = withMembers(2, "machine-groups");
    expect(() => appendEvents(input.run, [groupDraft(input, "human_replies")])).toThrow(/human_common distribution/);
    expect(() => appendEvents(input.run, [groupDraft(input, "human_replies", distribution("strong_engine", seeds.slice(0, 2)))])).toThrow(/human_common distribution/);
    expect(() => appendEvents(input.run, [groupDraft(input, "human_replies", distribution("human_common", [seeds[0]!]))])).toThrow(/cover every seed/);
    expect(() => appendEvents(input.run, [groupDraft(input, "authored", distribution("human_common", seeds.slice(0, 2)))])).toThrow(/cannot carry/);
    expect(groupsFromEvents(appendEvents(input.run, [groupDraft(input, "human_replies", distribution("human_common", seeds.slice(0, 2)))]))[0]!.distribution?.engine.id).toBe("maia");
  });

  it("projects pairwise-distinct direct-child members for every supported size", () => {
    fc.assert(fc.property(fc.integer({ min: 2, max: 8 }), (count) => {
      const input = withMembers(count, `property-${count}`);
      const group = groupsFromEvents(appendEvents(input.run, [groupDraft(input)]))[0]!;
      expect(new Set(group.members.map((member) => member.branchId)).size).toBe(count);
      for (const member of group.members) {
        expect(input.run.nodes.some((node) => node.parentId === group.sourceNodeId && node.branchId === member.branchId && node.moveUci === member.seedMoveUci)).toBe(true);
      }
    }), { numRuns: 20 });
  });
});
