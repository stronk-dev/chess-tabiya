// DISPOSABLE research harness — platform-alignment R8. Not production code.
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { commitMove, createRun, transposeKey } from "@chess-tabiya/runtime";

const ROOT = new URL("../../", import.meta.url).pathname;
const DRAFTS = join(ROOT, "content/drafts");
const SHAPES = join(ROOT, "content/shapes");
const PRINCIPLES = join(ROOT, "content/principles");
const CANDIDATES = join(ROOT, "content/candidates");
const OUTPUT = join(ROOT, "tools/r8-theory-drill-harness/prototype-output.md");
const digest = `sha256:${"7".repeat(64)}`;
const at = "2026-08-21T23:00:00.000Z";

interface ShapeReference { readonly shape: string; readonly relation: "present" | "prospective" }
interface Claim { readonly id: string; readonly principles?: readonly string[] }
interface SpineNode { readonly id: string; readonly moveUci: string; readonly children?: readonly SpineNode[] }
interface Pack {
  readonly id: string;
  readonly start: { readonly fen: string; readonly side: "white" | "black" };
  readonly spine: readonly SpineNode[];
  readonly shapes?: readonly (string | ShapeReference)[];
  readonly feedbackClaims?: readonly Claim[];
}
interface SourceContext { readonly runId: string; readonly nodeId: string }

function packFiles(): readonly string[] {
  return readdirSync(DRAFTS).filter((name) => name.endsWith(".json") && !name.includes(".browser.") && !name.includes(".evidence.") && !name.includes(".sources.") && !name.includes(".job.")).sort();
}
function packs(): readonly Pack[] { return packFiles().map((file) => JSON.parse(readFileSync(join(DRAFTS, file), "utf8")) as Pack); }
function normalized(reference: string | ShapeReference): ShapeReference { return typeof reference === "string" ? { shape: reference, relation: "present" } : reference; }
function mainline(nodes: readonly SpineNode[]): readonly SpineNode[] { const values: SpineNode[] = []; let current = nodes[0]; while (current) { values.push(current); current = current.children?.[0]; } return values; }

function shapeJoin(shapeId: string, context: SourceContext) {
  const shapePath = join(SHAPES, `${shapeId}.json`);
  let theory: { readonly id: string; readonly version: string; readonly name: string } | null = null;
  try { const entry = JSON.parse(readFileSync(shapePath, "utf8")) as { readonly id: string; readonly version: string; readonly name: string }; theory = { id: entry.id, version: entry.version, name: entry.name }; } catch { /* honest absence */ }
  const targets = packs().filter((pack) => (pack.shapes ?? []).map(normalized).some((reference) => reference.shape === shapeId && reference.relation === "present")).map((pack) => pack.id).sort();
  return Object.freeze({ source: context, kind: "shape" as const, identity: shapeId, theory, packIds: Object.freeze(targets) });
}

function claimJoin(packId: string, claimId: string, context: SourceContext) {
  const pack = packs().find((candidate) => candidate.id === packId);
  const claim = pack?.feedbackClaims?.find((candidate) => candidate.id === claimId);
  const principles = (claim?.principles ?? []).flatMap((id) => {
    try { const entry = JSON.parse(readFileSync(join(PRINCIPLES, `${id}.json`), "utf8")) as { readonly id: string; readonly name: string }; return [{ id: entry.id, name: entry.name }]; } catch { return []; }
  });
  return Object.freeze({ source: context, kind: "claim" as const, identity: `${packId}#${claimId}`, principles: Object.freeze(principles), packIds: Object.freeze(claim === undefined ? [] : [packId]) });
}

function openingIndex() {
  const values: Array<{ key: string; eco: string; name: string; candidateId: string }> = [];
  for (const entry of readdirSync(CANDIDATES, { withFileTypes: true }).filter((item) => item.isDirectory())) {
    try {
      const pack = JSON.parse(readFileSync(join(CANDIDATES, entry.name, "pack.json"), "utf8")) as Pack;
      const ledger = JSON.parse(readFileSync(join(CANDIDATES, entry.name, "evidence.json"), "utf8")) as { readonly records?: readonly { readonly kind: string; readonly anchor: { readonly spineNodeId?: string }; readonly values: { readonly eco?: string; readonly name?: string } }[] };
      const records = new Map((ledger.records ?? []).filter((record) => record.kind === "opening_identity" && record.anchor.spineNodeId).map((record) => [record.anchor.spineNodeId!, record]));
      let run = createRun({ id: `r8-${pack.id}`, session: { kind: "position", start: pack.start, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } }, sessionDigest: digest, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 7, createdAt: at });
      for (const node of mainline(pack.spine)) {
        run = commitMove(run, node.moveUci, { actor: "system", at }).run;
        const record = records.get(node.id);
        if (record?.values.eco && record.values.name) values.push({ key: transposeKey(run.nodes.at(-1)!.fen), eco: record.values.eco, name: record.values.name, candidateId: pack.id });
      }
    } catch { /* non-opening or incomplete candidate */ }
  }
  return Object.freeze(values.sort((a, b) => a.key.localeCompare(b.key) || a.candidateId.localeCompare(b.candidateId)));
}

function openingJoin(key: string, context: SourceContext) {
  const matches = openingIndex().filter((entry) => entry.key === key);
  const served = new Set(packs().map((pack) => pack.id));
  return Object.freeze({
    source: context,
    kind: "opening" as const,
    identity: key,
    theory: Object.freeze(matches.map(({ eco, name, candidateId }) => Object.freeze({ eco, name, candidateId }))),
    packIds: Object.freeze(matches.filter((match) => served.has(match.candidateId)).map((match) => match.candidateId)),
    candidateOnly: Object.freeze(matches.filter((match) => !served.has(match.candidateId)).map((match) => match.candidateId)),
  });
}

describe("R8 exact applicability prototype", () => {
  it("preserves source identity, present-reference semantics and honest empty shape targets", () => {
    const source = { runId: "source-run", nodeId: "source-node" } as const;
    const attached = shapeJoin("carlsbad", source);
    expect(attached.source).toEqual(source);
    expect(attached.theory?.id).toBe("carlsbad");
    expect(attached.packIds.length).toBeGreaterThan(0);

    const unreferenced = shapeJoin("hanging-pawns", source);
    expect(unreferenced.theory?.id).toBe("hanging-pawns");
    expect(unreferenced.packIds).toEqual([]);

    const prospective = shapeJoin("opposite-castling-race", source);
    expect(prospective.packIds).not.toEqual(expect.arrayContaining(["anti-sicilian-najdorf-english-attack", "najdorf-english-attack-black"]));
  });

  it("keeps principle lookup anchored to the exact claim instead of treating a general principle as applicability", () => {
    const candidate = packs().find((pack) => pack.feedbackClaims?.some((claim) => (claim.principles?.length ?? 0) > 0));
    const claim = candidate?.feedbackClaims?.find((item) => (item.principles?.length ?? 0) > 0);
    expect(candidate).toBeDefined(); expect(claim).toBeDefined();
    const result = claimJoin(candidate!.id, claim!.id, { runId: "claim-run", nodeId: "claim-node" });
    expect(result.packIds).toEqual([candidate!.id]);
    expect(result.principles.length).toBeGreaterThan(0);
    expect(claimJoin(candidate!.id, "missing", result.source).packIds).toEqual([]);
  });

  it("keys opening identity by transposition and reports candidate-only reach without inventing a launch", () => {
    const index = openingIndex();
    expect(index.length).toBe(52);
    const sample = index[0]!;
    const result = openingJoin(sample.key, { runId: "opening-run", nodeId: "opening-node" });
    expect(result.theory.length).toBeGreaterThan(0);
    expect(result.packIds).toEqual([]);
    expect(result.candidateOnly.length).toBeGreaterThan(0);
    const fields = sample.key.split(" ");
    expect(transposeKey(`${fields.join(" ")} 99 200`)).toBe(sample.key);
  });

  it("emits the fixed-position handoff report", () => {
    const source = { runId: "source-run", nodeId: "source-node" } as const;
    const carlsbad = shapeJoin("carlsbad", source);
    const noPack = shapeJoin("hanging-pawns", source);
    const openings = openingIndex();
    const opening = openingJoin(openings[0]!.key, source);
    const openingKeys = new Map<string, typeof openings>();
    for (const item of openings) openingKeys.set(item.key, Object.freeze([...(openingKeys.get(item.key) ?? []), item]));
    const collisions = [...openingKeys.values()].filter((items) => items.length > 1);
    const report = [
      "# R8 exact applicability prototype",
      "",
      "Disposable output; exact registered identities only, no semantic search and no product authority.",
      "",
      "| Input | Theory result | Launchable packs | Honest residue | Source preserved |",
      "|---|---|---:|---|---|",
      `| shape:carlsbad | ${carlsbad.theory?.id}@${carlsbad.theory?.version} | ${carlsbad.packIds.length} | — | ${carlsbad.source.runId}#${carlsbad.source.nodeId} |`,
      `| shape:hanging-pawns | ${noPack.theory?.id}@${noPack.theory?.version} | ${noPack.packIds.length} | no relevant pack | ${noPack.source.runId}#${noPack.source.nodeId} |`,
      `| opening:${opening.theory[0]?.eco ?? "unknown"} | ${opening.theory.length} exact candidate record(s) | ${opening.packIds.length} | ${opening.candidateOnly.length} candidate-only | ${opening.source.runId}#${opening.source.nodeId} |`,
      "",
      `Opening candidate index: ${openings.length} records, ${openingKeys.size} transposition keys, ${collisions.length} keys with multiple records, maximum ${Math.max(...[...openingKeys.values()].map((items) => items.length))} records/key.`,
      "",
      ...collisions.map((items) => `- Shared key: ${items.map((item) => `${item.eco} ${item.name} [${item.candidateId}]`).join(" | ")}`),
      ...(collisions.length === 0 ? [] : [""]),
      "Claim/principle lookup is accepted only with exact pack+claim identity and returns that source pack; a principle ID alone is not position applicability.",
      "",
    ];
    writeFileSync(OUTPUT, report.join("\n"));
  });
});
