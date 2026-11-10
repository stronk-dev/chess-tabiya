import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { STRUCTURAL_CONVENTION_REFS, type DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
import { digestShapeEntry } from "@chess-tabiya/schema/shape-entry";
import * as valueRoutes from "../../../packages/runtime/src/internal/evidence-value-routes.js";

import { ShapeRegistry } from "./shape-registry.js";
import { ShapeStudio } from "./shape-studio.js";
import { SQLiteRunStorage } from "./storage.js";

const official = JSON.parse(readFileSync(new URL("../../../content/shapes/carlsbad.json", import.meta.url), "utf8"));
const matchingPack = {
  id: "served-carlsbad",
  start: { fen: "r1bqr1k1/pp1nbppp/2p2n2/3p2B1/3P4/2NBP3/PPQ1NPPP/R4RK1 b - - 7 10", side: "white" },
  spine: [],
} as unknown as DrillPackDefinition;
const nonmatchingPack = {
  id: "served-initial",
  start: { fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", side: "white" },
  spine: [],
} as unknown as DrillPackDefinition;
const principal = { learnerId: "shape-author-id", handle: "shape-author" } as const;

describe("Shape Studio", () => {
  const stores: SQLiteRunStorage[]=[];
  afterEach(()=>{stores.splice(0).forEach((store)=>store.close());vi.restoreAllMocks();});
  async function setup(){const storage=new SQLiteRunStorage();stores.push(storage);storage.createLearner({id:principal.learnerId,handle:principal.handle,createdAt:"2026-08-14T00:00:00.000Z",passwordHash:"!"});const registry=await ShapeRegistry.loadDefault();return{storage,registry,studio:new ShapeStudio(storage,registry)};}

  it("stores, lints, updates, registers, and hydrates community entries",async()=>{
    const {storage,registry,studio}=await setup();
    const document=structuredClone(official);document.id="community-shape";document.version="1.0.0";
    const draft=await studio.create(principal,document);
    expect(draft.validation.valid).toBe(true);
    expect(studio.lint(document,"r1bqr1k1/pp1nbppp/2p2n2/3p2B1/3P4/2NBP3/PPQ1NPPP/R4RK1 b - - 7 10").probeMatches).toBe(true);
    const updated=await studio.update(draft.id,principal,draft.digest,{...document,name:"Community Carlsbad"});
    await expect(studio.update(draft.id,principal,draft.digest,document)).rejects.toThrow(/another editor/);
    const registered=await studio.register(updated.id,principal);
    expect(registered.summary).toMatchObject({channel:"community",publisherHandle:principal.handle});
    const fresh=await ShapeRegistry.loadDefault();await new ShapeStudio(storage,fresh).hydrate();
    expect(fresh.required("community-shape").digest).toBe(registered.digest);
    expect(registry.required("community-shape").channel).toBe("community");
  });

  it("previews an unsaved trigger over every served authored position", async () => {
    const { storage, registry } = await setup();
    const studio = new ShapeStudio(storage, registry, () => [
      { document: matchingPack, title: "Carlsbad minority attack" },
      { document: nonmatchingPack, title: "Initial position" },
    ]);
    const result = studio.lint(official);
    expect(result.corpusPreview).toMatchObject({ fires: 1, of: 2 });
    expect(result.corpusPreview?.matches[0]).toMatchObject({ packId: matchingPack.id, packTitle: "Carlsbad minority attack", ply: 0, startSide: "white" });
    expect(result.corpusPreview?.matches.every((match) => match.ply >= 0 && match.fen.split(" ").length === 6)).toBe(true);
  });

  it("previews an explicit successor from the actual unsaved document, including a genuine negative position", async () => {
    const { storage, registry } = await setup();
    const yes = "7k/2p5/8/4N3/3P4/8/8/7K w - - 0 1", no = "7k/5p2/8/4N3/3P4/8/8/7K w - - 0 1";
    const studio = new ShapeStudio(storage, registry, () => [yes, no].map((fen, index) => ({
      document: { ...matchingPack, id: `preview-${index}`, start: { fen, side: "white" } }, title: `Position ${index}`,
    })));
    const document = { ...structuredClone(official), id: "unsaved-explicit-outpost", trigger: { kind: "feature", feature: {
      kind: "outpost", color: "white", square: "e5", conventionRef: STRUCTURAL_CONVENTION_REFS.outpost,
    } } };
    const invoke = valueRoutes.invokeEvidenceValueRoute, origins: unknown[] = [], routes: string[] = [];
    vi.spyOn(valueRoutes, "invokeEvidenceValueRoute").mockImplementation((route, input) => {
      routes.push(route);
      const result = invoke(route, input);
      if (route === "authored.structural_condition.input@2" && result !== null && typeof result === "object" && "payload" in result) origins.push(result.payload);
      return result;
    });
    const result = studio.lint(document);
    expect(result.valid).toBe(true);
    expect(result.corpusPreview).toMatchObject({ fires: 1, of: 2, matches: [{ packId: "preview-0", fen: yes }] });
    expect(origins).toHaveLength(3); // Validator's initial-position check, then both preview positions.
    for (const origin of origins) expect(origin).toMatchObject({ pointer: "/trigger", authoredNode: document.trigger,
      origin: { kind: "shape", stage: "draft_validation", documentId: document.id, digest: await digestShapeEntry(document) } });
    expect(routes.filter(route => route === "rules.structural.predicate.outpost@2")).toHaveLength(3);
    expect(routes).not.toContain("rules.structural.predicate.outpost@1");
    expect(routes).not.toContain("derived.structural.predicate_result@1");
    expect(storage.shapeDrafts(principal.learnerId)).toEqual([]);
    expect(registry.get(document.id)).toBeUndefined();
  });

  it("reports an unavailable preview dependency instead of a false or missing preview", async () => {
    const { storage, registry } = await setup();
    const fen = "7k/2p5/8/4N3/3P4/8/8/7K w - - 0 1";
    const studio = new ShapeStudio(storage, registry, () => [{ document: { ...matchingPack, start: { fen, side: "white" } }, title: "Dependency control" }]);
    const document = { ...structuredClone(official), trigger: { kind: "feature", feature: {
      kind: "outpost", color: "white", square: "e5", conventionRef: STRUCTURAL_CONVENTION_REFS.outpost,
    } } };
    const invoke = valueRoutes.invokeEvidenceValueRoute;
    vi.spyOn(valueRoutes, "invokeEvidenceValueRoute").mockImplementation(((route: string, input: { position?: { payload: { fen: string } } }) =>
      route === "derived.square.reading.future_file_challenge@1" && input.position?.payload.fen === fen
        ? { kind: "unavailable", reason: "source_dependency_unavailable" } : invoke(route as never, input as never)) as typeof invoke);
    const result = studio.lint(document);
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: "STRUCTURAL_SOURCE_UNAVAILABLE", path: "/trigger" }));
    expect(result.corpusPreview).toBeUndefined();
  });

  it("reserves official ids",async()=>{const {studio}=await setup();const draft=await studio.create(principal,official);await expect(studio.register(draft.id,principal)).rejects.toThrow(/official/);});

  it("deletes mutable drafts and retains immutable registered bytes with tombstoned attribution", async () => {
    const { storage, studio } = await setup();
    const draftDocument = { ...structuredClone(official), id: "mutable-shape", version: "1.0.0" };
    const draft = await studio.create(principal, draftDocument);
    const published = await studio.create(principal, { ...draftDocument, id: "published-shape" });
    await studio.register(published.id, principal);
    storage.deleteLearner(principal.learnerId, "2026-08-14T01:00:00.000Z");
    expect(storage.shapeDrafts("__legacy").find((row) => row.id === draft.id)).toBeUndefined();
    expect(storage.registeredShapes().find((row) => row.shapeId === "published-shape")).toMatchObject({ document: { id: "published-shape" }, publisherHandle: "deleted account" });
  });
});
