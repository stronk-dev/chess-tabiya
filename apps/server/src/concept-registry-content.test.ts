// rfc/concept-registry.md criterion 3 — the one real-corpus assertion for the concept registry, in
// the content tier (criterion 12): every official (content/packs/) and community (content/drafts/)
// pack reference is a registered id, the registry carries no id outside that set except retired
// history, and no reference names a retired id. `make concept-registry-census` prints the counts.
import { describe, expect, it } from "vitest";

import { installedConceptRegistry, packConceptCensus } from "./concept-registry-loader.js";

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
