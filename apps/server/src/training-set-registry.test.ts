import { readFileSync } from "node:fs";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressInfo } from "node:net";

import { digestDrillPack, type DrillPackDefinition, type TrainingSetDefinition } from "@chess-tabiya/schema/drill-pack";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { createInMemoryTestApplication } from "./in-memory-test-application.js";
import type { ChessTabiyaApplication } from "./application.js";
import type { PackRegistry, PackSummary } from "./pack-registry.js";
import { TrainingSetRegistry, type TrainingSetPackLookup } from "./training-set-registry.js";

const example = JSON.parse(readFileSync(new URL("../../../schemas/drill_pack.example.json", import.meta.url), "utf8")) as DrillPackDefinition;
const document = (overrides: Partial<TrainingSetDefinition> = {}): TrainingSetDefinition => ({
  id: "chapter", formatVersion: "0.1", title: "An authored chapter", provenance: { reviewStatus: "draft", sources: ["fixture"] },
  members: [{ packId: "second", ordinal: 2 }, { packId: "first", ordinal: 1 }],
  passMark: { require: 1, of: "all", onFail: "repeat_set" }, ...overrides,
});
const member = (id: string, channel: "official" | "community" = "official", windows = true) => ({
  document: { ...example, id, timingWindows: windows ? [{ id: "window", opens: { fromStart: true }, closes: [{ kind: "deadline", afterLearnerMoves: 4 }], readiness: { mode: "all", of: [{ moveUci: "e2e4" }] }, luxuryMoveBudget: 4 }] : undefined } as DrillPackDefinition,
  summary: { id, title: id, channel, reviewStatus: channel === "official" ? "published" : "draft" } as PackSummary,
});
const members = new Map(["first", "second"].map(id => [id, member(id)]));
const packs: TrainingSetPackLookup = { get: id => members.get(id) };
const installed = (value: unknown = document(), lookup = packs) => TrainingSetRegistry.fromDocuments([{ source: "chapter.json", value }], lookup);
afterEach(() => vi.restoreAllMocks());

describe("installed training sets", () => {
  it("orders members by ordinal and publishes the authored threshold without a score", async () => {
    const registry = await installed();
    const set = registry.get("chapter")!;
    expect(set.members.map(member => member.pack.id)).toEqual(["first", "second"]);
    expect(set.passMark).toEqual({ require: 1, of: "all", onFail: "repeat_set" });
    expect(set.channel).toBe("community");
    expect(registry.list()).toEqual([expect.objectContaining({ id: "chapter", memberCount: 2 })]);
    expect(registry.list()[0]).not.toHaveProperty("members");
    expect(set).not.toHaveProperty("score");
    expect(set.members[0]).not.toHaveProperty("verdict");
    expect(registry.get("absent")).toBeUndefined();
  });

  it("a published set inherits its weakest member, including a later withdrawal", async () => {
    const live = new Map(members);
    const registry = await installed(document({ provenance: { reviewStatus: "published", sources: ["fixture"] } }), { get: id => live.get(id) });
    expect(registry.get("chapter")?.channel).toBe("official");
    live.set("second", { ...member("second"), summary: { ...member("second").summary, reviewStatus: "draft" } });
    expect(registry.get("chapter")?.channel).toBe("community");
    expect(registry.get("chapter")?.reviewStatus).toBe("draft");
    live.set("second", member("second", "community"));
    expect(registry.get("chapter")?.channel).toBe("community");
    live.delete("first");
    expect(() => registry.get("chapter")).toThrow(/unavailable member first/u);
  });

  it("refuses missing members, malformed ordinals, duplicate documents and ungrounded tempo at installation", async () => {
    await expect(installed(document({ members: [{ packId: "missing", ordinal: 1 }] }))).rejects.toThrow(/TRAINING_SET_PACK_UNREGISTERED.*missing/u);
    await expect(installed(document({ members: [{ packId: "first", ordinal: 2 }] }))).rejects.toThrow(/TRAINING_SET_ORDINAL_MISSING/u);
    await expect(TrainingSetRegistry.fromDocuments([{ source: "one", value: document() }, { source: "two", value: document() }], packs)).rejects.toThrow(/Duplicate training set chapter/u);
    const tempo = document({ tempo: { cycles: [{ ordinal: 1, budgetScale: 0.5 }] } });
    await expect(installed(tempo, { get: id => member(id, "official", false) })).rejects.toThrow(/TRAINING_SET_TEMPO_WITHOUT_WINDOWS.*first/u);
    expect((await installed(tempo)).get("chapter")?.tempo).toEqual(tempo.tempo);
  });

  it("owns immutable set bytes separately from unchanged member pack bytes", async () => {
    const before = await digestDrillPack(example);
    const original = structuredClone(document());
    const registry = await installed(original);
    const digest = registry.get("chapter")!.digest;
    (original as { title: string }).title = "caller mutation";
    expect(registry.get("chapter")!.title).toBe("An authored chapter");
    expect(registry.get("chapter")!.digest).toBe(digest);
    expect(await digestDrillPack(example)).toBe(before);
    expect(Object.isFrozen(registry.get("chapter")!.members)).toBe(true);
    expect((await installed(document({ title: "An intentional edit" }))).get("chapter")!.digest).not.toBe(digest);
  });

  it("loads only regular JSON documents and treats an absent directory as an empty catalogue", async () => {
    const directory = await mkdtemp(join(tmpdir(), "tabiya-training-sets-"));
    try {
      expect((await TrainingSetRegistry.loadDefault(packs, join(directory, "absent"))).list()).toEqual([]);
      await writeFile(join(directory, "chapter.json"), JSON.stringify(document()));
      await writeFile(join(directory, "README.md"), "not a set");
      await mkdir(join(directory, "directory.json"));
      expect((await TrainingSetRegistry.loadDefault(packs, directory)).list()).toHaveLength(1);
      await writeFile(join(directory, "bad.json"), "{");
      await expect(TrainingSetRegistry.loadDefault(packs, directory)).rejects.toThrow(SyntaxError);
    } finally { await rm(directory, { recursive: true, force: true }); }
  });

  describe("production HTTP catalogue", () => {
    let servedMemberId = "";
    let application: ChessTabiyaApplication | undefined;
    let origin = "";
    beforeAll(async () => {
      vi.spyOn(TrainingSetRegistry, "loadDefault").mockImplementation(lookup => {
        servedMemberId = (lookup as PackRegistry).list()[0]!.id;
        return installed(document({ members: [{ packId: servedMemberId, ordinal: 1 }] }), lookup);
      });
      application = await createInMemoryTestApplication({ engineMode: "mock", cookieSecure: false });
      await new Promise<void>((resolve, reject) => { application!.server.once("error", reject); application!.server.listen(0, "127.0.0.1", resolve); });
      origin = `http://127.0.0.1:${(application.server.address() as AddressInfo).port}`;
    });
    afterAll(async () => { await application?.close(); });
    it("serves installed ordered members, separate pack access and typed route refusals", async () => {
      const read = async (path: string, method = "GET") => {
        const response = await fetch(`${origin}${path}`, { method, headers: { accept: "text/html" } });
        return { status: response.status, contentType: response.headers.get("content-type"), body: await response.json() };
      };
      const catalogue = await read("/training-sets");
      expect(catalogue.status).toBe(200);
      expect(catalogue.contentType).toContain("application/json");
      expect(catalogue.body).toEqual([expect.objectContaining({ id: "chapter", memberCount: 1, channel: "community" })]);
      const set = await read("/training-sets/chapter");
      expect(set.status).toBe(200);
      expect(set.body.members).toEqual([expect.objectContaining({ ordinal: 1, pack: expect.objectContaining({ id: servedMemberId }) })]);
      expect(set.body.digest).toBe(catalogue.body[0].digest);
      const directMember = await read(`/packs/${encodeURIComponent(servedMemberId)}`);
      expect(directMember.status).toBe(200);
      expect(directMember.body).not.toHaveProperty("setId");
      expect((await read("/training-sets/absent")).status).toBe(404);
      expect((await read("/training-sets/chapter/extra")).status).toBe(404);
      expect((await read("/training-sets/%zz")).status).toBe(400);
      expect((await read("/training-sets", "POST")).status).toBe(405);
    });
  });
});
