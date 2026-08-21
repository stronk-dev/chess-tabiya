// DISPOSABLE research harness — platform-alignment R8. Not production code.
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = new URL("../../", import.meta.url).pathname;
const DRAFTS = join(ROOT, "content/drafts");
const SHAPES = join(ROOT, "content/shapes");
const CANDIDATES = join(ROOT, "content/candidates");
const OUTPUT = join(ROOT, "tools/r8-theory-drill-harness/audit-output.md");

interface ShapeReference { readonly shape: string; readonly relation: "present" | "prospective" }
interface Pack {
  readonly id: string;
  readonly phase?: string;
  readonly shapes?: readonly (string | ShapeReference)[];
  readonly feedbackClaims?: readonly { readonly principles?: readonly string[] }[];
}

function source(path: string): string { return readFileSync(join(ROOT, path), "utf8"); }
function packFiles(): readonly string[] {
  return readdirSync(DRAFTS).filter((name) => name.endsWith(".json") && !name.includes(".browser.") && !name.includes(".evidence.") && !name.includes(".sources.") && !name.includes(".job.")).sort();
}
function normalized(reference: string | ShapeReference): ShapeReference {
  return typeof reference === "string" ? { shape: reference, relation: "present" } : reference;
}

describe("R8 current theory-to-drill topology", () => {
  it("measures authored identity reach and emits the join report", () => {
    const packs = packFiles().map((file) => JSON.parse(readFileSync(join(DRAFTS, file), "utf8")) as Pack);
    const shapes = readdirSync(SHAPES).filter((name) => name.endsWith(".json")).map((file) => JSON.parse(readFileSync(join(SHAPES, file), "utf8")) as { readonly id: string }).sort((a, b) => a.id.localeCompare(b.id));
    const references = packs.flatMap((pack) => (pack.shapes ?? []).map(normalized).map((reference) => ({ pack: pack.id, ...reference })));
    const referenced = new Set(references.map((reference) => reference.shape));
    const unreferenced = shapes.map((shape) => shape.id).filter((id) => !referenced.has(id));
    const principleReferences = packs.flatMap((pack) => (pack.feedbackClaims ?? []).flatMap((claim) => claim.principles ?? []).map((principle) => ({ pack: pack.id, principle })));
    const openingRecords = packFiles().flatMap((file) => {
      const path = join(DRAFTS, file.replace(/\.json$/u, ".evidence.json"));
      try {
        const ledger = JSON.parse(readFileSync(path, "utf8")) as { readonly records?: readonly { readonly kind?: string }[] };
        return (ledger.records ?? []).filter((record) => record.kind === "opening_identity").map(() => file);
      } catch { return []; }
    });
    const openingPacks = new Set(openingRecords);
    const candidateOpeningRecords = readdirSync(CANDIDATES, { withFileTypes: true }).filter((entry) => entry.isDirectory()).flatMap((entry) => {
      try {
        const ledger = JSON.parse(readFileSync(join(CANDIDATES, entry.name, "evidence.json"), "utf8")) as { readonly records?: readonly { readonly kind?: string }[] };
        return (ledger.records ?? []).filter((record) => record.kind === "opening_identity").map(() => entry.name);
      } catch { return []; }
    });
    const candidateOpeningPacks = new Set(candidateOpeningRecords);

    expect(packs.length).toBeGreaterThan(0);
    expect(shapes.length).toBeGreaterThan(0);
    expect(references.length).toBeGreaterThan(0);
    expect(principleReferences.length).toBeGreaterThan(0);
    expect(candidateOpeningRecords.length).toBeGreaterThan(0);

    const app = source("apps/web/src/App.svelte");
    const panel = source("apps/web/src/lib/ShapePanel.svelte");
    const story = source("packages/runtime/src/evidence-catalog.ts");
    const service = source("apps/server/src/service.ts");

    const topology = {
      packToShapeValidated: source("apps/server/src/pack-validation.ts").includes("SHAPE_REFERENCE_UNKNOWN"),
      shapeRecommendationCarriesPackIds: service.includes("kind: \"shape_encounter\"") && service.includes("packIds:"),
      shapeRecommendationExcludesProspective: service.includes("shape.relation === \"present\"") || service.includes("shape.relation !== \"prospective\""),
      shapeRecommendationPreservesPackSelection: app.includes("enterShapePack") || app.includes("onSelectPack(item.packIds[0])"),
      shapePanelHasDrillDoor: panel.includes("onSelectPack") || panel.includes("packIds"),
      libraryHasPackOpenAction: /route\.name === "library"[\s\S]*?route\.name === "settings"/u.exec(app)?.[0].includes("onSelectPack") ?? false,
      libraryHasTheoryCatalogue: /route\.name === "library"[\s\S]*?route\.name === "settings"/u.exec(app)?.[0].includes("Shape") ?? false,
      reviewAcceptsOpeningIdentity: /id: "review\.story"[\s\S]*?projections: \[([^\]]+)/u.exec(story)?.[1]?.includes("theory.opening_identity") ?? false,
      reviewAcceptsSemanticEvents: /id: "review\.story"[\s\S]*?projections: \[([^\]]+)/u.exec(story)?.[1]?.includes("rules.transition.event") ?? false,
      reviewDeclaresTheoryOrDrillForm: /id: "review\.story"[\s\S]*?forms: \[([^\]]+)/u.exec(story)?.[1]?.includes("link") ?? false,
    };

    expect(topology.packToShapeValidated).toBe(true);
    expect(topology.shapeRecommendationCarriesPackIds).toBe(true);
    expect(topology.shapeRecommendationExcludesProspective).toBe(false);
    expect(topology.shapeRecommendationPreservesPackSelection).toBe(false);
    expect(topology.shapePanelHasDrillDoor).toBe(false);
    expect(topology.libraryHasPackOpenAction).toBe(false);
    expect(topology.libraryHasTheoryCatalogue).toBe(false);
    expect(topology.reviewAcceptsOpeningIdentity).toBe(false);
    expect(topology.reviewAcceptsSemanticEvents).toBe(false);
    expect(topology.reviewDeclaresTheoryOrDrillForm).toBe(false);

    const byPhase = [...new Set(packs.map((pack) => pack.phase ?? "unset"))].sort().map((phase) => {
      const rows = packs.filter((pack) => (pack.phase ?? "unset") === phase);
      return { phase, packs: rows.length, shapePacks: rows.filter((pack) => (pack.shapes?.length ?? 0) > 0).length };
    });
    const report = [
      "# R8 current theory↔drill join census",
      "",
      "Disposable output over the current authored corpus and learner surfaces; no product authority.",
      "",
      "## Authored identity reach",
      "",
      `- Packs: **${packs.length}**`,
      `- Shape entries: **${shapes.length}**`,
      `- Packs naming ≥1 shape: **${packs.filter((pack) => (pack.shapes?.length ?? 0) > 0).length}**`,
      `- Pack→shape references: **${references.length}** (${references.filter((row) => row.relation === "present").length} present; ${references.filter((row) => row.relation === "prospective").length} prospective)`,
      `- Referenced shape identities: **${referenced.size}/${shapes.length}**; unreferenced: **${unreferenced.length}**`,
      `- Pack→principle references: **${principleReferences.length}** across **${new Set(principleReferences.map((row) => row.principle)).size}** identities`,
      `- Authored-draft opening-identity records: **${openingRecords.length}** across **${openingPacks.size}** packs`,
      `- Candidate-only opening-identity records: **${candidateOpeningRecords.length}** across **${candidateOpeningPacks.size}** candidates`,
      "",
      "| Phase | Packs | Packs naming shapes |",
      "|---|---:|---:|",
      ...byPhase.map((row) => `| ${row.phase} | ${row.packs} | ${row.shapePacks} |`),
      "",
      "## Learner join closure",
      "",
      "| Edge | Current result |",
      "|---|---|",
      `| Pack → validated shape identity | ${topology.packToShapeValidated ? "present" : "absent"} |`,
      `| Detected shape recommendation → matching pack IDs | ${topology.shapeRecommendationCarriesPackIds ? "present in service" : "absent"} |`,
      `| Recommendation excludes prospective-only pack references | ${topology.shapeRecommendationExcludesProspective ? "present" : "absent; prospective references are offered as practice"} |`,
      `| Recommendation action → exact matching pack | ${topology.shapeRecommendationPreservesPackSelection ? "present" : "absent; navigates to /play and discards pack ID"} |`,
      `| Shape theory panel → drill action | ${topology.shapePanelHasDrillDoor ? "present" : "absent"} |`,
      `| Library pack row → open action | ${topology.libraryHasPackOpenAction ? "present" : "absent"} |`,
      `| Library → theory/shape catalogue | ${topology.libraryHasTheoryCatalogue ? "present" : "absent"} |`,
      `| Review → opening identity | ${topology.reviewAcceptsOpeningIdentity ? "present" : "absent"} |`,
      `| Review → F2 semantic events | ${topology.reviewAcceptsSemanticEvents ? "present" : "absent"} |`,
      `| Review → declared theory/drill link form | ${topology.reviewDeclaresTheoryOrDrillForm ? "present" : "absent"} |`,
      "",
      unreferenced.length === 0 ? "Every shape is named by at least one pack." : `Shapes named by no pack: ${unreferenced.join(", ")}.`,
      "",
    ];
    writeFileSync(OUTPUT, report.join("\n"));
  });
});
