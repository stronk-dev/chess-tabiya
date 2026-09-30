import { readFileSync } from "node:fs";

import { afterEach, describe, expect, it } from "vitest";

import { PackRegistry, projectPackDocument } from "./pack-registry.js";
import { PackStudio } from "./pack-studio.js";
import { PrincipleRegistry } from "./principle-registry.js";
import { createRestHandler } from "./rest.js";
import { RunService } from "./service.js";
import { SQLiteRunStorage } from "./storage.js";
import { withDerivedRequires } from "./capability/pack-capabilities.js";
import { ALL_PROVIDERS_CONFIGURED, runtimeSupportedCapabilities } from "./capability/pack-capabilities.js";
import { digestDrillPack } from "@chess-tabiya/schema/drill-pack";

const fixture = JSON.parse(readFileSync(new URL("../../../schemas/drill_pack.example.json", import.meta.url), "utf8")) as any;
const principal = { learnerId: "learner-studio", handle: "author" } as const;

describe("Pack Studio", () => {
  const stores: SQLiteRunStorage[] = [];
  afterEach(() => stores.splice(0).forEach((store) => store.close()));

  async function setup() {
    const storage = new SQLiteRunStorage();
    stores.push(storage);
    storage.createLearner({ id: principal.learnerId, handle: principal.handle, createdAt: "2026-08-13T14:00:00.000Z", passwordHash: "!" });
    const registry = await PackRegistry.fromDocuments([{ source: "official", value: withDerivedRequires(fixture) }]);
    const principles = await PrincipleRegistry.loadDefault();
    return { storage, registry, principles, studio: new PackStudio(storage, registry, undefined, principles) };
  }

  it("refuses unstamped and unsupported stored packs without rewriting bytes or hiding healthy peers", async () => {
    const { storage, registry, principles, studio } = await setup();
    const legacy = structuredClone(fixture);
    legacy.id = "old-stored-playtest";
    delete legacy.requires;
    const legacyDigest = await digestDrillPack(legacy);
    const legacyDraft = studio.create(principal, { document: { ...legacy, provenance: { ...legacy.provenance, reviewStatus: "draft" } } });
    storage.storePlaytestDocument(legacyDigest, legacyDraft.id, legacy, "2026-09-30T00:00:00.000Z");
    const providerPack = withDerivedRequires({ ...fixture, id: "provider-stored-playtest", feedbackPolicy: "immediate_guard", guard: { conditions: [{ kind: "engine_eval_swing", cp: 150 }] } });
    const providerDigest = await digestDrillPack(providerPack as any);
    const providerDraft = studio.create(principal, { document: { ...providerPack, provenance: { ...providerPack.provenance, reviewStatus: "draft" } } });
    storage.storePlaytestDocument(providerDigest, providerDraft.id, providerPack, "2026-09-30T00:00:01.000Z");
    const healthy = withDerivedRequires({ ...fixture, id: "healthy-stored-playtest" });
    const healthyDigest = await digestDrillPack(healthy as any);
    const healthyDraft = studio.create(principal, { document: { ...healthy, provenance: { ...healthy.provenance, reviewStatus: "draft" } } });
    storage.storePlaytestDocument(healthyDigest, healthyDraft.id, healthy, "2026-09-30T00:00:02.000Z");
    const malformedDigest = `sha256:${"f".repeat(64)}`;
    storage.storePlaytestDocument(malformedDigest, healthyDraft.id, null, "2026-09-30T00:00:02.500Z");
    const before = structuredClone(storage.playtestDocuments());
    const oldCommunity = { ...legacy, id: "old-community", version: "1.0.0", provenance: { ...legacy.provenance, reviewStatus: "published" } };
    const communityDigest = await digestDrillPack(oldCommunity);
    storage.registerPackDraft({ packId: oldCommunity.id, version: oldCommunity.version, digest: communityDigest,
      document: oldCommunity, publisherHandle: principal.handle, publisherLearnerId: principal.learnerId,
      draftId: legacyDraft.id, registeredAt: "2026-09-30T00:00:03.000Z" });
    const registeredBefore = structuredClone(storage.registeredPacks());
    const unavailable = await PackRegistry.fromDocuments([{ source: "official", value: fixture }], {
      capabilities: runtimeSupportedCapabilities({ providers: { ...ALL_PROVIDERS_CONFIGURED, analysis: false } }),
    });
    const report = new PackStudio(storage, unavailable, undefined, principles).hydrate();
    expect(report).toEqual([
      expect.objectContaining({ digest: legacyDigest, code: "PACK_INVALID" }),
      expect.objectContaining({ digest: providerDigest, code: "PACK_CAPABILITY_UNSUPPORTED" }),
      expect.objectContaining({ digest: malformedDigest, code: "PACK_INVALID" }),
      expect.objectContaining({ source: "community", digest: communityDigest, code: "PACK_INVALID" }),
    ]);
    expect(unavailable.byDigest(legacyDigest)).toBeUndefined();
    expect(unavailable.byDigest(providerDigest)).toBeUndefined();
    expect(unavailable.byDigest(healthyDigest)?.document.id).toBe("healthy-stored-playtest");
    expect(storage.playtestDocuments()).toEqual(before);
    expect(unavailable.byDigest(communityDigest)).toBeUndefined();
    expect(unavailable.get("old-community")).toBeUndefined();
    expect(storage.registeredPacks()).toEqual(registeredBefore);
    const recovered = new PackStudio(storage, registry, undefined, principles).hydrate();
    expect(recovered).toEqual([
      expect.objectContaining({ digest: legacyDigest, code: "PACK_INVALID" }),
      expect.objectContaining({ digest: malformedDigest, code: "PACK_INVALID" }),
      expect.objectContaining({ digest: communityDigest, code: "PACK_INVALID" }),
    ]);
    expect(registry.byDigest(providerDigest)?.document.id).toBe("provider-stored-playtest");
    expect(storage.playtestDocuments()).toEqual(before);
    expect(storage.registeredPacks()).toEqual(registeredBefore);
  });

  it("checks the single-reader and support authority at both dynamic registry insertion doors", async () => {
    const { registry } = await setup();
    const unstamped = structuredClone(fixture);
    delete unstamped.requires;
    const stale = structuredClone(fixture);
    stale.requires.pop();
    for (const document of [unstamped, stale, null, {}, 42]) {
      const digest = await digestDrillPack(document);
      expect(() => registry.addPlaytest(document, digest)).toThrow(/PACK_INVALID/);
      expect(() => registry.addCommunity(document, digest, "author")).toThrow(/PACK_INVALID/);
      expect(registry.byDigest(digest)).toBeUndefined();
    }
    const unsupported = await PackRegistry.fromDocuments([], { capabilities: runtimeSupportedCapabilities({ providers: { ...ALL_PROVIDERS_CONFIGURED, analysis: false } }) });
    const providerPack = withDerivedRequires({ ...fixture, feedbackPolicy: "immediate_guard", guard: { conditions: [{ kind: "engine_eval_swing", cp: 150 }] } });
    const digest = await digestDrillPack(providerPack as any);
    for (const insert of [() => unsupported.addPlaytest(providerPack as any, digest), () => unsupported.addCommunity(providerPack as any, digest, "author")]) {
      try { insert(); throw new Error("insertion must refuse"); } catch (error) { expect(error).toMatchObject({ code: "PACK_CAPABILITY_UNSUPPORTED" }); }
    }
    expect(unsupported.byDigest(digest)).toBeUndefined();
  });

  it("publishes catalogue summaries in deterministic identity order", async () => {
    const later = structuredClone(fixture);
    later.id = "z-pack";
    const earlier = structuredClone(fixture);
    earlier.id = "a-pack";
    const registry = await PackRegistry.fromDocuments([
      { source: "later", value: withDerivedRequires(later) },
      { source: "earlier", value: withDerivedRequires(earlier) },
    ]);
    expect(registry.list().map((pack) => pack.id)).toEqual(["a-pack", "z-pack"]);
  });

  it("stores invalid drafts, enforces optimistic concurrency, and publishes an immutable community version", async () => {
    const { studio, registry } = await setup();
    const invalid = structuredClone(fixture);
    invalid.id = "community-pack";
    invalid.version = "1.0.0";
    invalid.provenance = { reviewStatus: "draft", sources: ["author supplied source"], corpusEvidence: { state: "abstained", reason: "source_unavailable", detail: "No corpus source was available for this authored fixture." } };
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
    forged.provenance.graduationBlockers = [{ state: "blocking", statement: "Server-only authoring state" }];
    const projected = projectPackDocument(forged, "unverified", "community", "author") as any;
    expect(projected.channel).toBe("community");
    expect(projected.provenance.channel).toBeUndefined();
    expect(projected.provenance.reviewedBy).toBeUndefined();
    expect(projected.provenance.graduationBlockers).toBeUndefined();
    forged.variantOf = null;
    expect(projectPackDocument(forged, "unverified", "community", "author")).not.toHaveProperty("variantOf");

    const officialCollision = structuredClone(fixture);
    officialCollision.provenance.reviewStatus = "draft";
    officialCollision.provenance.sources = ["source"];
    officialCollision.provenance.corpusEvidence = { state: "abstained", reason: "source_unavailable", detail: "No corpus source was available for this authored fixture." };
    const draft = studio.create(principal, { document: officialCollision });
    expect(() => studio.register(draft.id, principal)).toThrow(/reserved/);
    expect(registry.required(fixture.id).channel).toBe("official");
    expect(studio.export(fixture.id, principal)).toMatchObject({ document: { id: fixture.id }, digest: registry.required(fixture.id).digest });
  });

  it("hydrates registered versions after restart", async () => {
    const { storage, studio, principles } = await setup();
    const document = structuredClone(fixture);
    document.id = "restart-pack";
    document.version = "1.0.0";
    document.provenance = { reviewStatus: "draft", sources: ["source"], corpusEvidence: { state: "abstained", reason: "source_unavailable", detail: "No corpus source was available for this authored fixture." } };
    const registered = studio.register(studio.create(principal, { document }).id, principal);
    const freshRegistry = await PackRegistry.fromDocuments([{ source: "official", value: withDerivedRequires(fixture) }]);
    const freshStudio = new PackStudio(storage, freshRegistry, undefined, principles);
    freshStudio.hydrate();
    expect(freshRegistry.byDigest(registered.digest)?.summary).toMatchObject({ id: "restart-pack", channel: "community" });
  });

  it("deletes mutable drafts and playtests while retaining exact registered bytes with tombstoned attribution", async () => {
    const { storage, studio } = await setup();
    const mutableDocument = structuredClone(fixture);
    mutableDocument.id = "mutable-pack";
    mutableDocument.version = "1.0.0";
    mutableDocument.provenance = { reviewStatus: "draft", sources: ["mutable source"], corpusEvidence: { state: "abstained", reason: "source_unavailable", detail: "No corpus source was available for this authored fixture." } };
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
    const clearance = { kind: "pointer_authored", subject: "/objective/summary", placeholder: fixture.objective.summary, instrument: "pack-studio test" };
    document.provenance = { reviewStatus: "draft", sources: ["source"], corpusEvidence: { state: "abstained", reason: "source_unavailable", detail: "No corpus source was available for this authored fixture." }, graduationBlockers: [{ id: "grounding", state: "blocking", statement: "Grounding remains.", clearance }] };
    const draft = studio.create(principal, { document });
    expect(() => studio.register(draft.id, principal)).toThrow(/graduation blockers/i);
    document.provenance.graduationBlockers = [{ id: "grounding", state: "resolved", statement: "Grounding was absent.", resolved: { at: "2026-08-16", by: "Evidence is recorded.", clearance } }];
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

    const fresh = await PackRegistry.fromDocuments([{ source: "official", value: withDerivedRequires(fixture) }]);
    new PackStudio(storage, fresh, undefined, principles).hydrate();
    expect(fresh.get("playtest-only")).toBeUndefined();
    expect(fresh.byDigest(record.digest)?.document.id).toBe("playtest-only");
  });

  it("derives playtest run assembly at the HTTP boundary", async () => {
    const storage = new SQLiteRunStorage();
    stores.push(storage);
    storage.createLearner({ id: "__legacy", handle: "legacy-playtest", createdAt: "2026-08-23T00:00:00.000Z", passwordHash: "!" });
    const registry = await PackRegistry.fromDocuments([{ source: "official", value: withDerivedRequires(fixture) }]);
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
