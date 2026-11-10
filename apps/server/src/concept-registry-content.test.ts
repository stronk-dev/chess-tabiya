// rfc/concept-registry.md criterion 3 — the one real-corpus assertion for the concept registry, in
// the content tier (criterion 12): every official (content/packs/) and community (content/drafts/)
// pack reference is a registered id, the registry carries no id outside that set except retired
// history, and no reference names a retired id. `make concept-registry-census` prints the counts.
import type { AddressInfo } from "node:net";
import { parseConceptCatalogueView } from "@chess-tabiya/runtime";
import { describe, expect, it } from "vitest";

import { installedConceptRegistry, packConceptCensus } from "./concept-registry-loader.js";
import { createInMemoryTestApplication } from "./in-memory-test-application.js";

describe("criterion 3 — pack references and the installed registry are set-equal", () => {
  it("registers every referenced id, keeps only retired history beyond them, and references nothing retired", () => {
    const registry = installedConceptRegistry();
    const census = packConceptCensus();
    const referenced = new Set(census.references.map((reference) => reference.conceptId));
    const active = new Set(registry.active().map((entry) => entry.id as string));
    const retired = new Set(registry.retired().map((entry) => entry.id as string));
    expect([...referenced].filter((id) => !active.has(id) && !retired.has(id)).sort()).toEqual([]);
    expect(census.references.filter((reference) => retired.has(reference.conceptId))).toEqual([]);
    expect([...active].filter((id) => !referenced.has(id)).sort()).toEqual([]);
    expect(census.packsWithConcepts).toBeGreaterThan(0);
    expect(referenced.size).toBe(active.size);
  });
});

// This API assertion derives its expected skills from the actual served packs;
// unlike source-free consumer controls it must retain default content admission.
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
