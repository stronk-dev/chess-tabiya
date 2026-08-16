import { readFileSync } from "node:fs";

import { afterEach, describe, expect, it } from "vitest";

import { PackRegistry, projectPackDocument } from "./pack-registry.js";
import { PackStudio } from "./pack-studio.js";
import { SQLiteRunStorage } from "./storage.js";

const fixture = JSON.parse(readFileSync(new URL("../../../schemas/drill_pack.example.json", import.meta.url), "utf8")) as any;
const principal = { learnerId: "learner-studio", handle: "author" } as const;

describe("Pack Studio", () => {
  const stores: SQLiteRunStorage[] = [];
  afterEach(() => stores.splice(0).forEach((store) => store.close()));

  async function setup() {
    const storage = new SQLiteRunStorage();
    stores.push(storage);
    storage.createLearner({ id: principal.learnerId, handle: principal.handle, createdAt: "2026-08-13T14:00:00.000Z", passwordHash: "!" });
    const registry = await PackRegistry.fromDocuments([{ source: "official", value: fixture }]);
    return { storage, registry, studio: new PackStudio(storage, registry) };
  }

  it("stores invalid drafts, enforces optimistic concurrency, and publishes an immutable community version", async () => {
    const { studio, registry } = await setup();
    const invalid = structuredClone(fixture);
    invalid.id = "community-pack";
    invalid.version = "1.0.0";
    invalid.provenance = { reviewStatus: "draft", sources: ["author supplied source"] };
    delete invalid.start.side;
    const draft = studio.create(principal, { document: invalid });
    expect(draft.validation.valid).toBe(false);

    const valid = structuredClone(invalid);
    valid.start.side = "white";
    const saved = studio.update(draft.id, principal, draft.digest, valid);
    expect(saved.validation.valid).toBe(true);
    expect(() => studio.update(draft.id, principal, draft.digest, valid)).toThrow(/another editor/);

    const registered = studio.register(draft.id, principal);
    expect(registered.channel).toBe("community");
    expect(registered.document.provenance).toMatchObject({ reviewStatus: "published" });
    expect(registry.required("community-pack").digest).toBe(registered.digest);
    expect(registry.byDigest(registered.digest)).toBe(registered);
  });

  it("keeps the official source authoritative and strips forged trust metadata from projection", async () => {
    const { studio, registry } = await setup();
    const forged = structuredClone(fixture);
    forged.provenance.channel = "official";
    forged.provenance.reviewedBy = "World champion";
    const projected = projectPackDocument(forged, "unverified", "community", "author") as any;
    expect(projected.channel).toBe("community");
    expect(projected.provenance.channel).toBeUndefined();
    expect(projected.provenance.reviewedBy).toBeUndefined();

    const officialCollision = structuredClone(fixture);
    officialCollision.provenance.reviewStatus = "draft";
    officialCollision.provenance.sources = ["source"];
    const draft = studio.create(principal, { document: officialCollision });
    expect(() => studio.register(draft.id, principal)).toThrow(/reserved/);
    expect(registry.required(fixture.id).channel).toBe("official");
  });

  it("hydrates registered versions after restart", async () => {
    const { storage, studio } = await setup();
    const document = structuredClone(fixture);
    document.id = "restart-pack";
    document.version = "1.0.0";
    document.provenance = { reviewStatus: "draft", sources: ["source"] };
    const registered = studio.register(studio.create(principal, { document }).id, principal);
    const freshRegistry = await PackRegistry.fromDocuments([{ source: "official", value: fixture }]);
    const freshStudio = new PackStudio(storage, freshRegistry);
    freshStudio.hydrate();
    expect(freshRegistry.byDigest(registered.digest)?.summary).toMatchObject({ id: "restart-pack", channel: "community" });
  });

  it("blocks only outstanding graduation entries and admits resolved history", async () => {
    const { studio } = await setup();
    const document = structuredClone(fixture);
    document.id = "graduation-state-pack";
    document.version = "1.0.0";
    document.provenance = { reviewStatus: "draft", sources: ["source"], graduationBlockers: [{ id: "grounding", state: "blocking", statement: "Grounding remains." }] };
    const draft = studio.create(principal, { document });
    expect(() => studio.register(draft.id, principal)).toThrow(/graduation blockers/i);
    document.provenance.graduationBlockers = [{ id: "grounding", state: "resolved", statement: "Grounding was absent.", resolved: { at: "2026-08-16", by: "Evidence is recorded." } }];
    const saved = studio.update(draft.id, principal, draft.digest, document);
    expect(studio.register(saved.id, principal).document.provenance).toMatchObject({ reviewStatus: "published" });
  });

  it("keeps playtest bytes digest-resolvable without publishing the draft", async () => {
    const { storage, studio, registry } = await setup();
    const document = structuredClone(fixture);
    document.id = "playtest-only";
    document.provenance = { reviewStatus: "draft", sources: [] };
    const draft = studio.create(principal, { document });
    const record = studio.playtest(draft.id, principal);
    expect(registry.get("playtest-only")).toBeUndefined();
    expect(registry.byDigest(record.digest)?.document.id).toBe("playtest-only");

    const fresh = await PackRegistry.fromDocuments([{ source: "official", value: fixture }]);
    new PackStudio(storage, fresh).hydrate();
    expect(fresh.get("playtest-only")).toBeUndefined();
    expect(fresh.byDigest(record.digest)?.document.id).toBe("playtest-only");
  });
});
