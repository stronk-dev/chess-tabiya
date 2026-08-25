import { readFileSync } from "node:fs";

import { afterEach, describe, expect, it } from "vitest";

import { PackRegistry, projectPackDocument } from "./pack-registry.js";
import { PackStudio } from "./pack-studio.js";
import { PrincipleRegistry } from "./principle-registry.js";
import { createRestHandler } from "./rest.js";
import { RunService } from "./service.js";
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
    const principles = await PrincipleRegistry.loadDefault();
    return { storage, registry, principles, studio: new PackStudio(storage, registry, undefined, principles) };
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
    const { storage, studio, principles } = await setup();
    const document = structuredClone(fixture);
    document.id = "restart-pack";
    document.version = "1.0.0";
    document.provenance = { reviewStatus: "draft", sources: ["source"] };
    const registered = studio.register(studio.create(principal, { document }).id, principal);
    const freshRegistry = await PackRegistry.fromDocuments([{ source: "official", value: fixture }]);
    const freshStudio = new PackStudio(storage, freshRegistry, undefined, principles);
    freshStudio.hydrate();
    expect(freshRegistry.byDigest(registered.digest)?.summary).toMatchObject({ id: "restart-pack", channel: "community" });
  });

  it("deletes mutable drafts and playtests while retaining exact registered bytes with tombstoned attribution", async () => {
    const { storage, studio } = await setup();
    const mutableDocument = structuredClone(fixture);
    mutableDocument.id = "mutable-pack";
    mutableDocument.version = "1.0.0";
    mutableDocument.provenance = { reviewStatus: "draft", sources: ["mutable source"] };
    const mutable = studio.create(principal, { document: mutableDocument });
    studio.playtest(mutable.id, principal);
    const publishedDocument = structuredClone(mutableDocument);
    publishedDocument.id = "published-pack";
    const published = studio.register(studio.create(principal, { document: publishedDocument }).id, principal);
    const before = structuredClone(storage.registeredPacks().find((row) => row.packId === "published-pack")!);
    const preview = storage.deletionPreview(principal.learnerId, { kind: "account" }, "2026-08-23T00:00:00.000Z");
    expect(preview.retainedPublished.flatMap((effect) => effect.objectIds)).toContain("published-pack@1.0.0");
    storage.deleteLearner(principal.learnerId, "2026-08-23T00:00:00.000Z", preview.digest);
    expect(storage.packDrafts("__legacy").find((row) => row.id === mutable.id)).toBeUndefined();
    expect(storage.playtestDocuments().some((row) => row.document && (row.document as { id?: string }).id === "mutable-pack")).toBe(false);
    expect(storage.registeredPacks().find((row) => row.packId === "published-pack")).toEqual({ ...before, publisherHandle: "deleted account", publisherLearnerId: "__legacy" });
    expect(storage.registeredPacks().find((row) => row.packId === "published-pack")).toMatchObject({ document: published.document, digest: published.digest });
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
    const { storage, studio, registry, principles } = await setup();
    const document = structuredClone(fixture);
    document.id = "playtest-only";
    document.provenance = { reviewStatus: "draft", sources: [] };
    const draft = studio.create(principal, { document });
    const record = studio.playtest(draft.id, principal);
    expect(registry.get("playtest-only")).toBeUndefined();
    expect(registry.byDigest(record.digest)?.document.id).toBe("playtest-only");

    const fresh = await PackRegistry.fromDocuments([{ source: "official", value: fixture }]);
    new PackStudio(storage, fresh, undefined, principles).hydrate();
    expect(fresh.get("playtest-only")).toBeUndefined();
    expect(fresh.byDigest(record.digest)?.document.id).toBe("playtest-only");
  });

  it("derives playtest run assembly at the HTTP boundary", async () => {
    const storage = new SQLiteRunStorage();
    stores.push(storage);
    storage.createLearner({ id: "__legacy", handle: "legacy-playtest", createdAt: "2026-08-23T00:00:00.000Z", passwordHash: "!" });
    const registry = await PackRegistry.fromDocuments([{ source: "official", value: fixture }]);
    const principles = await PrincipleRegistry.loadDefault();
    const studio = new PackStudio(storage, registry, undefined, principles);
    const document = structuredClone(fixture);
    document.id = "derived-playtest";
    document.provenance = { reviewStatus: "draft", sources: [] };
    const draft = studio.create({ learnerId: "__legacy", handle: "__legacy" }, { document });
    const handler = createRestHandler(new RunService(storage, { packRegistry: registry }), undefined, undefined, undefined, studio);
    const response = await handler(new Request(`http://server.test/packs/drafts/${draft.id}/playtest`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-writer-id": "writer-playtest" },
      body: "{}",
    }));

    expect(response.status).toBe(201);
    const body = await response.json() as { readonly run: { readonly id: string; readonly branches: readonly { readonly seed: number }[]; readonly policyConfig: { readonly seedMode: string } }; readonly url: string };
    expect(body.run.id).toMatch(/^[0-9a-f-]{36}$/u);
    expect(Number.isSafeInteger(body.run.branches[0]?.seed)).toBe(true);
    expect(body.run.policyConfig.seedMode).toBe("per_run");
    expect(body.url).toBe(`/play/run/${body.run.id}`);

    const clientAssembly = await handler(new Request(`http://server.test/packs/drafts/${draft.id}/playtest`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-writer-id": "writer-playtest" },
      body: JSON.stringify({ id: "client-id", seed: 1, policyConfig: {} }),
    }));
    expect(clientAssembly.status).toBe(400);
  });

  it("runs the principle and sibling-pack checks used by pack-check", async () => {
    const { storage, registry, studio } = await setup();
    const unknownPrinciple = structuredClone(fixture);
    unknownPrinciple.feedbackClaims[0].principles = ["not-a-registered-principle"];
    expect(studio.lint(unknownPrinciple).issues).toContainEqual(expect.objectContaining({
      code: "CLAIM_PRINCIPLE_UNKNOWN",
      path: "/feedbackClaims/0/principles/0",
    }));

    const wrongPhaseStudio = new PackStudio(storage, registry, undefined, {
      get: (id: string) => id === fixture.feedbackClaims[0].principles[0]
        ? { document: { phases: ["endgame"] as const } }
        : undefined,
    });
    expect(wrongPhaseStudio.lint(fixture).issues).toContainEqual(expect.objectContaining({
      code: "CLAIM_PRINCIPLE_OFF_PHASE",
      path: "/feedbackClaims/0/principles/0",
    }));

    const unknownSibling = structuredClone(fixture);
    unknownSibling.variantOf = {
      packId: "not-a-registered-pack",
      relation: { kind: "same_root_other_side" },
    };
    expect(studio.lint(unknownSibling).issues).toContainEqual(expect.objectContaining({
      code: "VARIANT_PACK_UNKNOWN",
      path: "/variantOf/packId",
    }));

    const unprovenSibling = structuredClone(fixture);
    unprovenSibling.id = "unproven-sibling-variant";
    unprovenSibling.variantOf = {
      packId: fixture.id,
      relation: { kind: "same_root_other_side" },
    };
    expect(studio.lint(unprovenSibling).issues).toContainEqual(expect.objectContaining({
      code: "VARIANT_RELATION_UNPROVEN",
      path: "/variantOf/relation",
    }));
  });
});
