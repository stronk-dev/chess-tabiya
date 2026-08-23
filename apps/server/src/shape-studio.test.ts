import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";

import { ShapeRegistry } from "./shape-registry.js";
import { ShapeStudio } from "./shape-studio.js";
import { SQLiteRunStorage } from "./storage.js";

const official = JSON.parse(readFileSync(new URL("../../../content/shapes/carlsbad.json", import.meta.url), "utf8"));
const principal = { learnerId: "shape-author-id", handle: "shape-author" } as const;

describe("Shape Studio", () => {
  const stores: SQLiteRunStorage[]=[];
  afterEach(()=>stores.splice(0).forEach((store)=>store.close()));
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
