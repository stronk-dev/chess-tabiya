import { randomUUID } from "node:crypto";
import type { AddressInfo } from "node:net";
import { fileURLToPath } from "node:url";

import { runEventHeadDigest, type DrillRun } from "@chess-tabiya/runtime";
import { afterEach, describe, expect, it } from "vitest";

import { createInMemoryTestApplication } from "./in-memory-test-application.js";
import type { ChessTabiyaApplication } from "./application.js";

// rfc/campaign-core.md criteria 2, 3, 8, 20, 21, 24(API half), 26, 27, 28, 32 and
// rfc/campaign-boss-games.md criteria 4, 8, 10 — exercised through createApplication's /campaign family.

const FIXTURE_CAMPAIGN = fileURLToPath(new URL("../../../tests/browser/fixtures/campaign.browser.json", import.meta.url));
const BOSS_PACK = fileURLToPath(new URL("../../../schemas/fixtures/drill-pack/campaign-boss.browser.json", import.meta.url));
const LINE_PACK = fileURLToPath(new URL("../../../content/drafts/line-boundary.browser.json", import.meta.url));
const WRITER = "writer-campaign-test";

const cleanups: (() => Promise<void>)[] = [];
afterEach(async () => { while (cleanups.length > 0) await cleanups.pop()!(); });

interface Client {
  call(method: string, path: string, body?: unknown): Promise<{ status: number; body: Record<string, any> }>;
}

async function boot(): Promise<{ application: ChessTabiyaApplication; learner: (handle: string) => Promise<Client> }> {
  const application = await createInMemoryTestApplication({ engineMode: "mock", cookieSecure: false, development: true, draftPackFiles: [BOSS_PACK, LINE_PACK], draftCampaignFiles: [FIXTURE_CAMPAIGN] });
  cleanups.push(() => application.close());
  await new Promise<void>((resolve, reject) => { application.server.once("error", reject); application.server.listen(0, "127.0.0.1", resolve); });
  const origin = `http://127.0.0.1:${(application.server.address() as AddressInfo).port}`;
  const learner = async (handle: string): Promise<Client> => {
    const registered = await fetch(`${origin}/auth/register`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ handle, password: `${handle}-password-long` }) });
    const cookie = registered.headers.get("set-cookie")!.split(";", 1)[0]!;
    return {
      async call(method, path, body) {
        const response = await fetch(`${origin}${path}`, { method, headers: { cookie, "x-writer-id": WRITER, ...(body === undefined ? {} : { "content-type": "application/json" }) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
        return { status: response.status, body: await response.json() as Record<string, any> };
      },
    };
  };
  return { application, learner };
}

const commandId = () => `cmd-${randomUUID()}`;

async function run(client: Client, runId: string): Promise<DrillRun> {
  const events = (await client.call("GET", `/runs/${runId}/events`)).body.events;
  const { projectRun } = await import("@chess-tabiya/runtime");
  return projectRun(events);
}

/** Plays the two-ply line-boundary fixture to its authored boundary (learner Be3, system e6). */
async function playToBoundary(client: Client, runId: string): Promise<void> {
  expect((await client.call("POST", `/runs/${runId}/moves`, { uci: "c1e3" })).status).toBe(200);
  const reply = await client.call("POST", `/runs/${runId}/moves`, { uci: "e7e6", actor: "system" });
  expect(reply.status, JSON.stringify(reply.body)).toBe(200);
}

async function startNode(client: Client, campaignRunId: string, nodeId: string, revision: number) {
  const started = await client.call("POST", `/campaign-runs/${campaignRunId}/nodes/${nodeId}/start`, { expectedRevision: revision, commandId: commandId() });
  expect(started.status, JSON.stringify(started.body)).toBe(201);
  return started.body;
}

async function sealPackNode(client: Client, campaignRunId: string, nodeId: string): Promise<Record<string, any>> {
  let campaign = (await client.call("GET", `/campaign-runs/${campaignRunId}`)).body;
  const started = await startNode(client, campaignRunId, nodeId, campaign.campaignRun.revision);
  const playRunId = started.result.response.playRunId as string;
  await playToBoundary(client, playRunId);
  campaign = (await client.call("GET", `/campaign-runs/${campaignRunId}`)).body;
  const submitted = await client.call("POST", `/campaign-runs/${campaignRunId}/nodes/${nodeId}/submit`, { runId: playRunId, expectedRevision: campaign.campaignRun.revision, commandId: commandId() });
  expect(submitted.status, JSON.stringify(submitted.body)).toBe(200);
  return submitted.body;
}

describe("campaign core through the application (rfc/campaign-core.md)", () => {
  it("lists the installed campaigns, including the draft pilot, without locking the library", async () => {
    const { learner } = await boot();
    const alice = await learner("campaign_alice");
    const catalogue = await alice.call("GET", "/campaigns");
    expect(catalogue.status).toBe(200);
    const ids = catalogue.body.campaigns.map((entry: { id: string }) => entry.id);
    expect(ids).toEqual(expect.arrayContaining(["browser-fixture-campaign", "draft-pilot-three-phases"]));
    const pilot = catalogue.body.campaigns.find((entry: { id: string }) => entry.id === "draft-pilot-three-phases");
    expect(pilot).toMatchObject({ channel: "community", available: true, nodeCount: 21 });
    // The open library is unchanged by campaign state.
    expect((await alice.call("GET", "/packs")).status).toBe(200);
  }, 60_000);

  it("creates exactly once, charges rewinds atomically, seals by participation and completes with awards", async () => {
    const { learner } = await boot();
    const alice = await learner("campaign_alice2");
    const bob = await learner("campaign_bob");
    const createCommand = commandId();
    const created = await alice.call("POST", "/campaigns/browser-fixture-campaign/runs", { campaignVersion: 1, commandId: createCommand });
    expect(created.status, JSON.stringify(created.body)).toBe(201);
    const campaignRunId = created.body.result.campaignRunId as string;
    // Criterion 26: create replay exists before the run id; changed operands and a second run refuse.
    const replay = await alice.call("POST", "/campaigns/browser-fixture-campaign/runs", { campaignVersion: 1, commandId: createCommand });
    expect(replay.body.result).toEqual(created.body.result);
    expect((await alice.call("POST", "/campaigns/browser-fixture-campaign/runs", { campaignVersion: 2, commandId: createCommand })).body.error.code).toBe("CAMPAIGN_COMMAND_REUSED");
    expect((await alice.call("POST", "/campaigns/browser-fixture-campaign/runs", { campaignVersion: 1, commandId: commandId() })).body.error.code).toBe("CAMPAIGN_RUN_ACTIVE_EXISTS");
    // Another learner sees the same not-found envelope as an absent id.
    const foreign = await bob.call("GET", `/campaign-runs/${campaignRunId}`);
    expect([foreign.status, foreign.body.error.code]).toEqual([404, "CAMPAIGN_NOT_FOUND"]);

    let campaign = created.body.campaign;
    expect(campaign.charges.balance).toBe(1);
    expect(campaign.acts[0].layers[0].state).toBe("current");

    // Criterion 27: one cross-aggregate start with replay; stale and out-of-layer starts refuse.
    const startCommand = commandId();
    const started = await alice.call("POST", `/campaign-runs/${campaignRunId}/nodes/f1-a/start`, { expectedRevision: 1, commandId: startCommand });
    expect(started.status, JSON.stringify(started.body)).toBe(201);
    const playRunId = started.body.result.response.playRunId as string;
    const again = await alice.call("POST", `/campaign-runs/${campaignRunId}/nodes/f1-a/start`, { expectedRevision: 1, commandId: startCommand });
    expect(again.body.result.response.playRunId).toBe(playRunId);
    expect(again.body.replayed).toBe(true);
    expect((await alice.call("POST", `/campaign-runs/${campaignRunId}/nodes/f1-b/start`, { expectedRevision: 1, commandId: commandId() })).body.error.code).toBe("CAMPAIGN_REVISION_STALE");
    expect((await alice.call("POST", `/campaign-runs/${campaignRunId}/nodes/f1-b/start`, { expectedRevision: 2, commandId: commandId() })).body.error.code).toBe("CAMPAIGN_ACTIVE_ENCOUNTER_MISMATCH");
    const graph = await alice.call("GET", `/runs/${playRunId}/graph`);
    expect(graph.body.graph.campaignOrigin).toEqual({ campaignRunId, nodeId: "f1-a", campaignDocumentDigest: campaign.campaignRun.documentDigest });

    // Criterion 8: the untouched root cannot seal.
    const untouched = await alice.call("POST", `/campaign-runs/${campaignRunId}/nodes/f1-a/submit`, { runId: playRunId, expectedRevision: 2, commandId: commandId() });
    expect([untouched.status, untouched.body.error.code, untouched.body.error.reason]).toEqual([422, "CAMPAIGN_PARTICIPATION_REQUIRED", "untouched_root"]);

    // Criterion 28: the active encounter cannot be deleted.
    const preview = await alice.call("POST", `/runs/${playRunId}/deletion-preview`, {});
    const refusedDelete = await alice.call("POST", `/runs/${playRunId}/delete`, { previewDigest: preview.body.digest ?? "sha256:x" });
    expect(refusedDelete.body.error.code).toBe("CAMPAIGN_ACTIVE_ENCOUNTER_DELETE");

    await playToBoundary(alice, playRunId);
    // Criterion 32 / [[D2986]]: a charged rewind needs the envelope, performs the play mutation and spends.
    let played = await run(alice, playRunId);
    const learnerNode = played.nodes.find((node) => node.actor === "user")!;
    expect((await alice.call("POST", `/runs/${playRunId}/rewind`, { nodeId: learnerNode.id })).body.error.code).toBe("CAMPAIGN_ACTIVE_ENCOUNTER_MISMATCH");
    const rewindCommand = { commandId: commandId(), expectedCampaignRevision: 2, expectedPlayRevision: played.events.at(-1)!.seq };
    const rewound = await alice.call("POST", `/runs/${playRunId}/rewind`, { nodeId: learnerNode.id, campaignCommand: rewindCommand });
    expect(rewound.status, JSON.stringify(rewound.body)).toBe(200);
    expect(rewound.body.campaign).toMatchObject({ kind: "committed", campaignRevision: 3, chargeBalance: 0 });
    expect(rewound.body.run.activeCursor.nodeId).toBe(learnerNode.id);
    campaign = (await alice.call("GET", `/campaign-runs/${campaignRunId}`)).body;
    expect(campaign.charges).toMatchObject({ balance: 0, spent: 1 });
    // Response-loss replay returns the stored result without a second mutation or spend.
    const replayedRewind = await alice.call("POST", `/runs/${playRunId}/rewind`, { nodeId: learnerNode.id, campaignCommand: rewindCommand });
    expect(replayedRewind.body.campaign).toEqual(rewound.body.campaign);
    expect((await alice.call("GET", `/campaign-runs/${campaignRunId}`)).body.campaignRun.revision).toBe(3);
    expect((await alice.call("POST", `/runs/${playRunId}/rewind`, { nodeId: played.nodes[0]!.id, campaignCommand: rewindCommand })).body.error.code).toBe("CAMPAIGN_COMMAND_REUSED");
    // Exhausted: the typed 409 with the verbatim message; the play run is unchanged.
    played = await run(alice, playRunId);
    const exhausted = await alice.call("POST", `/runs/${playRunId}/fork`, { nodeId: played.nodes[0]!.id, campaignCommand: { commandId: commandId(), expectedCampaignRevision: 3, expectedPlayRevision: played.events.at(-1)!.seq } });
    expect([exhausted.status, exhausted.body.error.code]).toEqual([409, "CAMPAIGN_REWIND_EXHAUSTED"]);
    expect((await run(alice, playRunId)).events.length).toBe(played.events.length);

    // Criterion 3: a plain pack run is untouched by the guard and refuses the envelope.
    const plain = await alice.call("POST", "/runs", { id: "plain-run", session: { kind: "pack", packId: "line-boundary-browser" }, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 3 });
    expect(plain.status, JSON.stringify(plain.body)).toBe(201);
    await alice.call("POST", "/runs/plain-run/moves", { uci: "c1e3" });
    const plainRun = await run(alice, "plain-run");
    expect((await alice.call("POST", "/runs/plain-run/rewind", { nodeId: plainRun.nodes[0]!.id })).status).toBe(200);
    expect((await alice.call("POST", "/runs/plain-run/fork", { nodeId: plainRun.nodes[0]!.id, campaignCommand: { commandId: commandId(), expectedCampaignRevision: 1, expectedPlayRevision: 1 } })).body.error.code).toBe("CAMPAIGN_ACTIVE_ENCOUNTER_MISMATCH");

    // Re-play to the boundary after the rewind (the rewind kept Be3; add the reply again).
    const reply = await alice.call("POST", `/runs/${playRunId}/moves`, { uci: "e7e6", actor: "system" });
    expect(reply.status, JSON.stringify(reply.body)).toBe(200);
    const submitCommand = commandId();
    const sealed = await alice.call("POST", `/campaign-runs/${campaignRunId}/nodes/f1-a/submit`, { runId: playRunId, expectedRevision: 3, commandId: submitCommand });
    expect(sealed.status, JSON.stringify(sealed.body)).toBe(200);
    expect(sealed.body.result.response).toMatchObject({ nodeId: "f1-a", kind: "pack", verdict: "open", reward: { kind: "module_unlock", moduleId: "postcommit_nudge" }, terminal: "continue" });
    expect(sealed.body.campaign.kit.owned).toEqual(["postcommit_nudge"]);
    expect(sealed.body.campaign.charges.balance).toBe(1);
    const sealedReplay = await alice.call("POST", `/campaign-runs/${campaignRunId}/nodes/f1-a/submit`, { runId: playRunId, expectedRevision: 3, commandId: submitCommand });
    expect(sealedReplay.body.result).toEqual(sealed.body.result);

    // Assistance: the Campaign context is executable for the encounter's run (Discharge D6).
    // The kit preset narrows to the kit folded at the encounter's node_entered cut — which was empty.
    const { compileAssistanceRequest } = await import("@chess-tabiya/runtime");
    const assistance = await alice.call("POST", `/runs/${playRunId}/assistance`, compileAssistanceRequest({ contextHint: "campaign", preference: { kind: "unset" } }));
    expect(assistance.status, JSON.stringify(assistance.body)).toBe(200);
    expect(assistance.body.assistance).toMatchObject({ context: "campaign", preset: "campaign_kit", modules: ["rules_floor"] });

    // Loadout (§4.5): family refusal, unowned refusal, equip/unequip.
    expect((await alice.call("PUT", `/campaign-runs/${campaignRunId}/loadout`, { equippedModuleIds: ["campaign_rewind_charge"], expectedRevision: 4, commandId: commandId() })).body.error.code).toBe("CAMPAIGN_LOADOUT_FAMILY_INVALID");
    expect((await alice.call("PUT", `/campaign-runs/${campaignRunId}/loadout`, { equippedModuleIds: ["full_inspector"], expectedRevision: 4, commandId: commandId() })).body.error.code).toBe("CAMPAIGN_LOADOUT_INVALID");
    const unequipped = await alice.call("PUT", `/campaign-runs/${campaignRunId}/loadout`, { equippedModuleIds: [], expectedRevision: 4, commandId: commandId() });
    expect(unequipped.body.campaign.kit).toMatchObject({ owned: ["postcommit_nudge"], equipped: [] });

    // Sealed-run deletion keeps progression and projects the explicit unavailable Review.
    const sealedPreview = await alice.call("POST", `/runs/${playRunId}/deletion-preview`, {});
    expect((await alice.call("POST", `/runs/${playRunId}/delete`, { previewDigest: sealedPreview.body.digest })).status).toBe(200);
    const review = await alice.call("GET", `/campaign-runs/${campaignRunId}/nodes/f1-a/review`);
    expect(review.body).toMatchObject({ kind: "unavailable", reason: "campaign_encounter_run_deleted", nodeId: "f1-a" });
    expect((await alice.call("GET", `/campaign-runs/${campaignRunId}`)).body.kit.owned).toEqual(["postcommit_nudge"]);

    // Play on through Act I and the Act-II pack layers.
    for (const nodeId of ["f2-a", "f3-boss", "f4-a", "f5-b"]) await sealPackNode(alice, campaignRunId, nodeId);

    // rfc/campaign-boss-games.md: the Act-II boss is a full position game against the registered bot.
    campaign = (await alice.call("GET", `/campaign-runs/${campaignRunId}`)).body;
    const bossCard = campaign.acts[1].layers[2].choices[0];
    expect(bossCard).toMatchObject({ kind: "boss_game", opponent: { profileId: "human-baseline.1400@1" }, rating: "unrated" });
    let boss: Record<string, any> | undefined;
    for (let attempt = 0; attempt < 100 && boss === undefined; attempt += 1) {
      const attemptStart = await alice.call("POST", `/campaign-runs/${campaignRunId}/nodes/f6-boss/start`, { expectedRevision: campaign.campaignRun.revision, commandId: commandId() });
      if (attemptStart.status === 201) boss = attemptStart.body;
      else await new Promise((resolve) => setTimeout(resolve, 20));
    }
    expect(boss).toBeDefined();
    const bossRunId = boss!.result.response.playRunId as string;
    const bossRun = await run(alice, bossRunId);
    expect(bossRun.sessionKind).toBe("position");
    expect(bossRun.opponentPolicy.profile?.id).toBe("human-baseline.1400@1");
    const early = await alice.call("POST", `/campaign-runs/${campaignRunId}/nodes/f6-boss/submit`, { runId: bossRunId, expectedRevision: boss!.campaign.campaignRun.revision, commandId: commandId() });
    expect(early.body.error.code).toBe("CAMPAIGN_SUBMIT_INVALID");
    expect((await alice.call("POST", `/runs/${bossRunId}/moves`, { uci: "h1g1" })).status).toBe(200);
    const afterCheck = await run(alice, bossRunId);
    const botReply = await alice.call("POST", `/runs/${bossRunId}/opponent-ply`, { requestId: `botreq_${randomUUID().replaceAll("-", "")}`, expectedNodeId: afterCheck.activeCursor.nodeId, expectedBranchId: afterCheck.activeCursor.branchId, expectedEventHeadDigest: runEventHeadDigest(afterCheck) });
    expect(botReply.status, JSON.stringify(botReply.body)).toBe(200);
    expect((await alice.call("POST", `/runs/${bossRunId}/moves`, { uci: "e1e8" })).status).toBe(200);
    const bossSealed = await alice.call("POST", `/campaign-runs/${campaignRunId}/nodes/f6-boss/submit`, { runId: bossRunId, expectedRevision: boss!.campaign.campaignRun.revision, commandId: commandId() });
    expect(bossSealed.status, JSON.stringify(bossSealed.body)).toBe(200);
    expect(bossSealed.body.result.response).toMatchObject({ kind: "boss_game", outcome: "win", reason: "checkmate" });

    for (const nodeId of ["f7-a", "f8-a"]) await sealPackNode(alice, campaignRunId, nodeId);
    const final = await sealPackNode(alice, campaignRunId, "f9-boss");
    // Criteria 20/21: the terminal seal completes the run and inserts the awards in the same commit.
    expect(final.result.response.terminal).toBe("completed");
    expect(final.campaign.campaignRun.status).toBe("completed");
    expect(final.result.response.awards).toEqual(["completion_mark:browser-fixture-campaign@1"]);
    const result = await alice.call("GET", `/campaign-runs/${campaignRunId}/result`);
    expect(result.body).toMatchObject({ prestigeEligible: false, awards: [{ durableRewardId: "completion_mark:browser-fixture-campaign@1" }] });
    expect(result.body.path).toHaveLength(9);
    expect((await alice.call("GET", "/campaign-rewards")).body.awards).toHaveLength(1);
    expect((await alice.call("POST", `/campaign-runs/${campaignRunId}/abandon`, { expectedRevision: final.campaign.campaignRun.revision, commandId: commandId() })).body.error.code).toBe("CAMPAIGN_RUN_TERMINAL");

    // Account export carries the campaign history (§6.2).
    const exported = await alice.call("POST", "/auth/export", { password: "campaign_alice2-password-long" });
    expect(exported.status).toBe(200);
    const tables = new Set((exported.body.progress.value as { table: string }[]).map((record) => record.table));
    expect([...tables]).toEqual(expect.arrayContaining(["campaign_runs", "campaign_events", "campaign_run_creations", "campaign_mutation_commands", "campaign_reward_awards"]));
  }, 120_000);

  it("abandons with the exact active encounter and then starts a new run", async () => {
    const { learner } = await boot();
    const alice = await learner("campaign_alice3");
    const created = await alice.call("POST", "/campaigns/browser-fixture-campaign/runs", { campaignVersion: 1, commandId: commandId() });
    const campaignRunId = created.body.result.campaignRunId as string;
    const started = await startNode(alice, campaignRunId, "f1-b", 1);
    const abandonCommand = commandId();
    const abandoned = await alice.call("POST", `/campaign-runs/${campaignRunId}/abandon`, { expectedRevision: 2, commandId: abandonCommand });
    expect(abandoned.status, JSON.stringify(abandoned.body)).toBe(200);
    expect(abandoned.body.campaign).toMatchObject({ cursor: { kind: "abandoned" }, abandonedEncounter: { nodeId: "f1-b", playRunId: started.result.response.playRunId }, awards: [] });
    expect((await alice.call("POST", `/campaign-runs/${campaignRunId}/abandon`, { expectedRevision: 2, commandId: abandonCommand })).body.replayed).toBe(true);
    const review = await alice.call("GET", `/campaign-runs/${campaignRunId}/nodes/f1-b/review`);
    expect(review.body).toMatchObject({ kind: "abandoned", reason: "campaign_encounter_abandoned" });
    // The abandoned run is no longer charged: an ordinary rewind passes the guard.
    expect((await alice.call("POST", "/campaigns/browser-fixture-campaign/runs", { campaignVersion: 1, commandId: commandId() })).status).toBe(201);
    expect((await alice.call("GET", "/campaigns/active")).body.runs).toHaveLength(1);
  }, 60_000);
});
