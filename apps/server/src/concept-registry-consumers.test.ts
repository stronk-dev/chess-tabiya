// rfc/concept-registry.md — the landed consumers over real storage and the real pack validator
// (criteria 5, 6, 8, 9, 10) and rfc/skills.md criteria 4–7 on /profile's skills section.
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

import {
  PRIMARY_EVIDENCE_MANIFEST,
  commitMove,
  compileConceptRegistry,
  conceptRegistryDigest,
  conceptRegistryHeadBytes,
  conceptRegistryRevisionBytes,
  createRun,
  packConceptReferenceEvidence,
  parseConceptCatalogueView,
  type CompiledConceptRegistry,
  type DrillRun,
} from "@chess-tabiya/runtime";
import { digestDrillPack, type DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
import { afterEach, describe, expect, it } from "vitest";

import { validateAccountBundleV1 } from "./account-data.js";
import { installedConceptRegistry } from "./concept-registry-loader.js";
import { createInMemoryTestApplication } from "./in-memory-test-application.js";
import { LearnerProfileService } from "./learner-profile.js";
import { loadOpeningCatalogue } from "./opening-catalogue.js";
import { PackRegistry } from "./pack-registry.js";
import { PackStudio } from "./pack-studio.js";
import { validatePackDocument } from "./pack-validation.js";
import { PrincipleRegistry } from "./principle-registry.js";
import { projectAttempts, RegisteredConceptResolver } from "./progress.js";
import { SQLiteRunStorage } from "./storage.js";

const AT = "2026-09-24T10:00:00.000Z";
const example = JSON.parse(readFileSync(new URL("../../../schemas/drill_pack.example.json", import.meta.url), "utf8")) as DrillPackDefinition & Record<string, unknown>;
const principal = { learnerId: "owner", handle: "owner" } as const;

function packWith(id: string, concepts: readonly string[]): DrillPackDefinition {
  return { ...structuredClone(example), id, concepts: [...concepts] } as DrillPackDefinition;
}

function registryOf(entries: readonly { readonly id: string; readonly label: string; readonly status: "active" | "retired" }[], previous?: readonly { readonly id: string; readonly label: string; readonly status: "active" | "retired" }[]): CompiledConceptRegistry {
  const files: Record<string, string> = {};
  let digest: `sha256:${string}` | null = null;
  for (const revision of previous === undefined ? [entries] : [previous, entries]) {
    const bytes = conceptRegistryRevisionBytes(digest, revision);
    digest = conceptRegistryDigest(bytes);
    files[`${digest.slice("sha256:".length)}.json`] = bytes;
  }
  return compileConceptRegistry(conceptRegistryHeadBytes(digest!), files);
}

const stores: SQLiteRunStorage[] = [];
const directories: string[] = [];
afterEach(() => {
  for (const store of stores.splice(0)) { try { store.close(); } catch { /* closed */ } }
  for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

function storage(path = ":memory:"): SQLiteRunStorage {
  const store = new SQLiteRunStorage(path, { onMigration: () => {} });
  stores.push(store);
  store.createLearner({ id: principal.learnerId, handle: principal.handle, passwordHash: "!", createdAt: AT });
  return store;
}

async function playedRun(id: string, pack: DrillPackDefinition): Promise<DrillRun> {
  const run = createRun({
    id, packId: pack.id, packDigest: await digestDrillPack(pack),
    policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } },
    startFen: pack.start.fen, seed: 5, createdAt: AT,
  });
  return commitMove(run, "c1e3", { at: AT }).run;
}

describe("criterion 5 — pack.authored.concept_reference@1 is identity only", () => {
  it("emits one sealed reference per concept with the pack digest and exact registry identity", async () => {
    const registry = installedConceptRegistry();
    const pack = packWith("reference-pack", ["break-timing", "outside-passer"]);
    const digest = await digestDrillPack(pack);
    const references = packConceptReferenceEvidence({ pack, packDigest: digest, registry });
    expect(references.map((reference) => reference.payload)).toEqual([
      { packId: "reference-pack", packDigest: digest, concept: { id: "break-timing", registrySchemaVersion: 1, registryDigest: registry.digest } },
      { packId: "reference-pack", packDigest: digest, concept: { id: "outside-passer", registrySchemaVersion: 1, registryDigest: registry.digest } },
    ]);
    const projection = PRIMARY_EVIDENCE_MANIFEST.projections.find((candidate) => candidate.id === "pack.authored.concept_reference")!;
    expect(projection).toMatchObject({ grounding: "authored_claim", exactness: "authored", answerContent: ["fact"], operands: ["packId", "packDigest", "concept"] });
    expect(projection.limitations.join(" ")).toMatch(/not a sighting/u);
    // Refusals: a wrong digest, a registry lookalike and an unregistered id.
    expect(() => packConceptReferenceEvidence({ pack, packDigest: `sha256:${"0".repeat(64)}`, registry })).toThrow(/complete-document digest/u);
    expect(() => packConceptReferenceEvidence({ pack, packDigest: digest, registry: { ...registry } })).toThrow(/refused its authority inputs/u);
    const unknown = packWith("unknown-pack", ["not-registered-anywhere"]);
    // A pack that declares no concepts is an empty population, not a refusal (browser-smoke regression:
    // the profile composed references over every served pack and one pack without `concepts` failed it).
    const bare = packWith("bare-pack", []);
    delete (bare as { concepts?: unknown }).concepts;
    expect(packConceptReferenceEvidence({ pack: bare, packDigest: await digestDrillPack(bare), registry })).toEqual([]);
    const unknownDigest = await digestDrillPack(unknown);
    expect(() => packConceptReferenceEvidence({ pack: unknown, packDigest: unknownDigest, registry })).toThrow(/CONCEPT_UNREGISTERED/u);
  });
});

describe("criterion 6 and rfc/skills.md criterion 5 — one global key across packs", () => {
  it("resolves the same id in two packs to one key with two exact pack occurrences; different ids never merge", async () => {
    const registry = installedConceptRegistry();
    const resolver = new RegisteredConceptResolver(registry);
    const first = packWith("first-pack", ["break-timing", "outside-passer"]);
    const second = packWith("second-pack", ["break-timing"]);
    const one = projectAttempts({ run: await playedRun("run-1", first), pack: first, learnerId: "owner", concepts: resolver });
    const two = projectAttempts({ run: await playedRun("run-2", second), pack: second, learnerId: "owner", concepts: resolver });
    const keys = [...one.conceptTags, ...two.conceptTags].map((tag) => tag.kind === "registered" ? `${tag.packId}:${tag.conceptKey}:${tag.packDigest.slice(0, 13)}` : "unverified");
    expect(keys).toEqual([
      `first-pack:concept:break-timing@1:${(await digestDrillPack(first)).slice(0, 13)}`,
      `first-pack:concept:outside-passer@1:${(await digestDrillPack(first)).slice(0, 13)}`,
      `second-pack:concept:break-timing@1:${(await digestDrillPack(second)).slice(0, 13)}`,
    ]);
    expect(resolver.resolve("second-pack", "outside-passer")!.key).not.toBe(resolver.resolve("second-pack", "break-timing")!.key);
    // An unregistered id in a stored pre-registry pack is quarantined, never keyed.
    const legacy = packWith("legacy-pack", ["break-timing"]);
    (legacy as unknown as { concepts: string[] }).concepts.push("author-private-idea");
    const tags = projectAttempts({ run: await playedRun("run-3", legacy), pack: legacy, learnerId: "owner", concepts: resolver }).conceptTags;
    expect(tags.map((tag) => tag.kind)).toEqual(["registered", "unverified"]);
  });
});

describe("criterion 8 and rfc/skills.md criterion 6 — same_concept is cross-pack", () => {
  it("returns another pack's attempt that shares the registered concept, labelled from its exact revision, and never a quarantined row", async () => {
    const store = storage();
    const resolver = new RegisteredConceptResolver(installedConceptRegistry());
    const first = packWith("first-pack", ["break-timing"]);
    const second = packWith("second-pack", ["break-timing"]);
    const third = packWith("third-pack", ["outside-passer"]);
    const runs: [DrillRun, DrillPackDefinition][] = [[await playedRun("run-1", first), first], [await playedRun("run-2", second), second], [await playedRun("run-3", third), third]];
    for (const [run, pack] of runs) {
      store.create(run, { writerId: "writer", learnerId: "owner" }, run.id);
      const projection = projectAttempts({ run, pack, learnerId: "owner", concepts: resolver });
      store.upsertAttempts(projection.attempts, projection.conceptTags);
    }
    const related = store.related("owner", "run-1", "no-shared-position");
    expect(related.map((row) => [row.relation, row.runId])).toEqual([["same_concept", "run-2"]]);
    expect(related[0]!.concept).toEqual({ id: "break-timing", label: "Break timing", status: "active", registryDigest: installedConceptRegistry().digest, revision: "resolved" });
    // rfc/return-scheduling.md's voluntary concept return joins on the global key: the second pack's
    // attempt is a return to the first pack's concept, and carries the registry label.
    expect(store.metrics("owner").voluntaryConceptReturns).toEqual([{ conceptKey: "concept:break-timing@1", conceptId: "break-timing", label: "Break timing", count: 1 }]);
  });
});

describe("criterion 9 and rfc/skills.md criterion 7 — publication and Pack Studio use the compiled registry", () => {
  it("errors on unregistered, malformed and retired-new references in the shipped validator", () => {
    const retired = registryOf([
      { id: "break-timing", label: "Break timing", status: "active" },
      { id: "outside-passer", label: "Outside passer", status: "retired" },
    ], [
      { id: "break-timing", label: "Break timing", status: "active" },
      { id: "outside-passer", label: "Outside passer", status: "active" },
    ]);
    const issues = (concepts: readonly string[]) => validatePackDocument(packWith("lint-pack", concepts), { concepts: retired }).issues.filter((issue) => issue.path.startsWith("/concepts"));
    expect(issues(["break-timing"])).toEqual([]);
    expect(issues(["unknown-idea"]).map((issue) => [issue.severity, issue.code])).toEqual([["error", "CONCEPT_UNREGISTERED"]]);
    expect(issues(["outside-passer"]).map((issue) => [issue.severity, issue.code])).toEqual([["error", "CONCEPT_RETIRED"]]);
    expect(issues(["Not A Slug"]).map((issue) => [issue.severity, issue.code])).toEqual([["error", "CONCEPT_KEY_NOT_SLUG"]]);
    // The default is the installed registry: pack-check refuses an id it does not carry.
    expect(validatePackDocument(packWith("lint-pack", ["unknown-idea"])).valid).toBe(false);
  });

  it("serves the picker catalogue from the registry and refuses to register an arbitrary string", async () => {
    const store = storage();
    const registry = await PackRegistry.fromDocuments([{ source: "official", value: example }]);
    const studio = new PackStudio(store, registry, undefined, await PrincipleRegistry.loadDefault());
    const catalogue = studio.conceptCatalogue();
    expect(catalogue.registryDigest).toBe(installedConceptRegistry().digest);
    expect(catalogue.entries.map((entry) => entry.id)).toEqual(installedConceptRegistry().entries.map((entry) => entry.id));
    const draftDocument = { ...structuredClone(example), id: "community-pack", version: "1.0.0", concepts: ["typed-by-hand"], provenance: { reviewStatus: "draft", sources: ["author supplied source"], corpusEvidence: { state: "abstained", reason: "source_unavailable", detail: "No corpus source was available for this authored fixture." } } };
    const draft = studio.create(principal, { document: draftDocument });
    expect(draft.conceptRegistryDigest).toBe(installedConceptRegistry().digest);
    expect(draft.validation.issues.find((issue) => issue.code === "CONCEPT_UNREGISTERED")).toMatchObject({ severity: "error", path: "/concepts/0" });
    expect(() => studio.register(draft.id, principal)).toThrow(/validation errors remain/u);
    // Pack summaries carry registry labels, never raw strings.
    expect(registry.required(example.id).summary.concepts).toEqual([
      { id: "move-order-discipline", label: "Move order discipline", status: "active" },
      { id: "plan-continuity-across-phases", label: "Plan continuity across phases", status: "active" },
    ]);
  });
});

describe("criterion 10 — account export and deletion", () => {
  it("exports exact refs and quarantined rows without promotion, then deletes both with the attempt and keeps the registry", async () => {
    const directory = mkdtempSync(join(tmpdir(), "tabiya-concept-account-"));
    directories.push(directory);
    const path = join(directory, "store.sqlite");
    const store = storage(path);
    const resolver = new RegisteredConceptResolver(installedConceptRegistry());
    const legacy = packWith("legacy-pack", ["break-timing"]);
    (legacy as unknown as { concepts: string[] }).concepts.push("author-private-idea");
    const run = await playedRun("run-1", legacy);
    store.create(run, { writerId: "writer", learnerId: "owner" }, "Run");
    const projection = projectAttempts({ run, pack: legacy, learnerId: "owner", concepts: resolver });
    store.upsertAttempts(projection.attempts, projection.conceptTags);
    const bundle = store.accountBundle("owner");
    validateAccountBundleV1(bundle);
    const rows = bundle.progress.value.filter((row) => row.table === "attempt_concepts" || row.table === "attempt_concept_legacy");
    expect(rows).toEqual([
      { table: "attempt_concepts", record: { run_id: "run-1", branch_id: run.branches[0]!.id, pack_id: "legacy-pack", pack_digest: run.packDigest, concept_key: "concept:break-timing@1", concept: { id: "break-timing", registrySchemaVersion: 1, registryDigest: installedConceptRegistry().digest }, label: "Break timing" } },
      { table: "attempt_concept_legacy", record: { run_id: "run-1", branch_id: run.branches[0]!.id, pack_id: "legacy-pack", raw_key: "pack:legacy-pack#author-private-idea", label: "author-private-idea", reason: "unregistered_at_projection" } },
    ]);
    // Export validation refuses a forged ref or a key that disagrees with its ref.
    const forged = structuredClone(bundle) as unknown as { progress: { value: { table: string; record: Record<string, unknown> }[] } };
    forged.progress.value.find((row) => row.table === "attempt_concepts")!.record.concept_key = "concept:outside-passer@1";
    expect(() => validateAccountBundleV1(forged)).toThrow(/does not match its concept ref/u);
    forged.progress.value.find((row) => row.table === "attempt_concepts")!.record.concept = { id: "break-timing", registrySchemaVersion: 1 };
    expect(() => validateAccountBundleV1(forged)).toThrow(/not an exact concept ref/u);

    const preview = store.deletionPreview("owner", { kind: "account" }, AT);
    expect([...preview.hardDelete, ...preview.tombstone, ...preview.revoke].flatMap((effect) => effect.objectIds).filter((id) => id.startsWith("concept")).sort()).toEqual([
      "concept-legacy:run-1:" + run.branches[0]!.id + ":pack:legacy-pack#author-private-idea",
      "concept:run-1:" + run.branches[0]!.id + ":concept:break-timing@1",
    ]);
    const before = installedConceptRegistry().revisions;
    store.deleteLearner("owner", AT, preview.digest);
    const inspection = new DatabaseSync(path);
    expect(inspection.prepare("SELECT (SELECT count(*) FROM attempt_concepts) AS registered, (SELECT count(*) FROM attempt_concept_legacy) AS quarantined, (SELECT count(*) FROM concept_registry_migration) AS receipts").get()).toEqual({ registered: 0, quarantined: 0, receipts: 1 });
    inspection.close();
    expect(installedConceptRegistry().revisions).toEqual(before);
  });
});

describe("rfc/skills.md criterion 4 — the leaf set is exactly registered shapes plus registered cross-pack concepts", () => {
  it("lists a concept leaf only when at least two packs reference it, labelled from the registry, with no concept-identity blocker", async () => {
    const registry = installedConceptRegistry();
    const packs = [packWith("p1", ["break-timing", "outside-passer"]), packWith("p2", ["break-timing"]), packWith("p3", ["direct-opposition"])];
    const references = (await Promise.all(packs.map(async (pack) => packConceptReferenceEvidence({ pack, packDigest: await digestDrillPack(pack), registry })))).flat();
    const store = storage();
    const service = new LearnerProfileService({
      storage: store,
      longitudinalStatus: () => "disabled_test",
      openingCatalogue: await loadOpeningCatalogue(join(process.cwd(), "apps", "server", "artifacts", "runtime-opening-catalogue.json")),
      shapes: () => [{ id: "carlsbad", name: "Carlsbad structure" }],
      conceptReferences: () => ({ registry, references, abstainedPacks: ["unverifiable-pack"] }),
    });
    const skills = service.profile(principal).skills;
    expect(skills.candidateLeaves.map((leaf) => [leaf.leafId, leaf.label, leaf.source])).toEqual([
      ["concept:break-timing", "Break timing", "pack_concept"],
      ["shape:carlsbad", "Carlsbad structure", "registered_shape"],
    ]);
    for (const leaf of skills.candidateLeaves) {
      const [kind, id] = leaf.leafId.split(":");
      expect(kind === "shape" ? id === "carlsbad" : registry.has(id!)).toBe(true);
      expect(leaf.blockers).toEqual(["category_unassigned", "valence_unruled", "opportunity_definition_missing"]);
    }
    expect(skills.conceptIdentity).toMatch(/concept registry/u);
    expect(skills.conceptIdentity).toMatch(/could not be verified: unverifiable-pack\./u);
    expect(JSON.stringify(skills)).not.toMatch(/%|\bscore\b|\bstreak\b|\branking\b|\d+\s*\/\s*\d+/iu);
  });
});

describe("the composed application serves the registry to Pack Studio and the profile", { timeout: 120_000 }, () => {
  it("serves GET /packs/concepts and lists profile concept leaves only for registered ids at least two served packs name", async () => {
    const application = await createInMemoryTestApplication();
    try {
      await new Promise<void>((resolveListen, reject) => { application.server.once("error", reject); application.server.listen(0, "127.0.0.1", resolveListen); });
      const origin = `http://127.0.0.1:${(application.server.address() as AddressInfo).port}`;
      const registered = await fetch(`${origin}/auth/register`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ handle: "author", password: "author-password-long" }) });
      const cookie = registered.headers.get("set-cookie")!.split(";", 1)[0]!;
      const concepts = await fetch(`${origin}/packs/concepts`, { headers: { cookie } });
      expect(concepts.status).toBe(200);
      const catalogue = parseConceptCatalogueView(((await concepts.json()) as { concepts: unknown }).concepts);
      expect(catalogue.registryDigest).toBe(installedConceptRegistry().digest);
      const packs = (await (await fetch(`${origin}/packs`)).json()) as readonly { readonly id: string; readonly concepts: readonly { readonly id: string; readonly status: string }[] }[];
      expect(packs.flatMap((pack) => pack.concepts).every((concept) => concept.status === "active" && catalogue.entries.some((entry) => entry.id === concept.id))).toBe(true);
      const naming = new Map<string, Set<string>>();
      for (const pack of packs) for (const concept of pack.concepts) naming.set(concept.id, (naming.get(concept.id) ?? new Set()).add(pack.id));
      const expected = [...naming].filter(([, ids]) => ids.size >= 2).map(([id]) => `concept:${id}`).sort();
      const profile = (await (await fetch(`${origin}/learner-profile`, { headers: { cookie } })).json()) as { readonly profile: { readonly skills: { readonly candidateLeaves: readonly { readonly leafId: string }[] } } };
      expect(profile.profile.skills.candidateLeaves.map((leaf) => leaf.leafId).filter((id) => id.startsWith("concept:")).sort()).toEqual(expected);
    } finally {
      await application.close();
    }
  });
});
