import { createHash } from "node:crypto";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";
import { canonicalFen } from "@chess-tabiya/runtime";
import { parsePgn, startingPosition } from "chessops/pgn";
import { parseSan } from "chessops/san";
import { describe, expect, it } from "vitest";

import { normalizeOpeningPgn } from "./sourcing/openings.js";
import {
  CHESS_OPENINGS_COMMIT,
} from "./sourcing/openings.js";
import {
  compileLoadedOpeningCatalogue,
  deepestOpeningReached,
  deriveDeepestOpeningVisits,
  loadOpeningCatalogue,
  openingIdentityAt,
  recordedOpeningPosition,
  renderCurrentOpeningEndpoint,
  renderDeepestOpeningReached,
  renderOpeningMembership,
  type RuntimeOpeningCatalogue,
} from "./opening-catalogue.js";

const ARTIFACT = new URL("../artifacts/runtime-opening-catalogue.json", import.meta.url).pathname;
const IMPORTED = new URL("../../../tools/r2-selection-harness/imported-sample.pgn", import.meta.url).pathname;
const E4 = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";

describe("runtime opening catalogue", () => {
  it("keeps exact identity separate from path membership at named and unnamed fan-out keys", async () => {
    const loaded = await loadOpeningCatalogue(ARTIFACT);
    expect(loaded.kind).toBe("available");
    if (loaded.kind !== "available") return;
    expect(loaded.catalogue.artifact.namedEndpoints).toHaveLength(3_810);
    expect(loaded.catalogue.artifact.pathMembership).toHaveLength(7_854);
    expect(Math.max(...loaded.catalogue.artifact.pathMembership.map((item) => item.descendantEndpointCount))).toBe(2_023);
    const value = openingIdentityAt(loaded, E4, 1);
    expect(value.currentEndpoint).toMatchObject({ kind: "matched", eco: "B00", name: "King's Pawn Game", observedPly: 1 });
    expect(value.catalogueMembership).toEqual(expect.objectContaining({ kind: "member", descendantEndpointCount: 2_023, observedPly: 1 }));
    expect(value.catalogueMembership).not.toHaveProperty("eco");
    expect(value.catalogueMembership).not.toHaveProperty("name");
    expect(JSON.stringify(value)).not.toMatch(/moves|descendantName/);
    const unnamed = openingIdentityAt(loaded, "rnbqkb1r/pppp1ppp/4pn2/8/2PP4/8/PP2PPPP/RNBQKBNR w KQkq - 0 3", 4);
    expect(unnamed.currentEndpoint).toMatchObject({ kind: "absent", reason: "no_named_endpoint" });
    expect(unnamed.catalogueMembership).toMatchObject({ kind: "member", descendantEndpointCount: 304 });
  });

  it("uses position identity across move-order transpositions and keeps observed ply explicit", async () => {
    const loaded = await loadOpeningCatalogue(ARTIFACT);
    if (loaded.kind !== "available") throw new TypeError("fixture catalogue unavailable");
    const first = normalizeOpeningPgn("1. Nf3 d5 2. d4 Nf6 3. c4 e6 4. Nc3 Be7").at(-1)!.fen;
    const second = normalizeOpeningPgn("1. d4 Nf6 2. c4 e6 3. Nc3 d5 4. Nf3 Be7").at(-1)!.fen;
    const left = openingIdentityAt(loaded, first, 8);
    const right = openingIdentityAt(loaded, second, 12);
    expect(left.currentEndpoint).toEqual({ ...right.currentEndpoint, observedPly: 8 });
    expect(left.catalogueMembership).toEqual({ ...right.catalogueMembership, observedPly: 8 });
  });

  it("keeps live absence separate from the complete deepest-match history", async () => {
    const loaded = await loadOpeningCatalogue(ARTIFACT);
    if (loaded.kind !== "available") throw new TypeError("fixture catalogue unavailable");
    const imported = parsePgn(await readFile(IMPORTED, "utf8"));
    expect(imported[0]?.headers.get("Site")).toBe("https://lichess.org/ZoaIX0pA");
    const position = startingPosition(imported[0]!.headers).unwrap();
    const fens: string[] = [];
    for (const node of [...imported[0]!.moves.mainline()].slice(0, 4)) {
      const move = parseSan(position, node.san);
      if (move === undefined || !position.isLegal(move)) throw new TypeError(`Illegal fixture move ${node.san}`);
      position.play(move);
      fens.push(canonicalFen(position));
    }
    const named = fens[2]!;
    const absent = fens[3]!;
    expect(loaded.catalogue.currentEndpoint(named, 3)).toMatchObject({ kind: "matched" });
    expect(loaded.catalogue.currentEndpoint(absent, 4)).toMatchObject({ kind: "absent" });
    const history = deepestOpeningReached(loaded, [
      { projectionId: "run.record.position@1", nodeId: "n3", ply: 3, fen: named },
      { projectionId: "run.record.position@1", nodeId: "n4", ply: 4, fen: absent },
      { projectionId: "run.record.position@1", nodeId: "n5", ply: 5, fen: named },
    ]);
    expect(history).toMatchObject({ kind: "matched", deepest: { observedPly: 5 }, visits: [{ nodeId: "n3" }, { nodeId: "n5" }] });
    expect(renderDeepestOpeningReached(history)).toContain("at ply 5");
  });

  it("refuses mixed artifact identities and distinguishes all unavailable states", async () => {
    const loaded = await loadOpeningCatalogue(ARTIFACT);
    if (loaded.kind !== "available") throw new TypeError("fixture catalogue unavailable");
    const endpoint = loaded.catalogue.currentEndpoint(normalizeOpeningPgn("1. Nh3").at(-1)!.fen, 1);
    if (endpoint.kind !== "matched") throw new TypeError("named fixture did not match");
    expect(() => deriveDeepestOpeningVisits([{ nodeId: "n1", ply: 1, endpoint: { ...endpoint, catalogue: { ...endpoint.catalogue, artifactDigest: "sha256:other" } } }], loaded.catalogue.ref)).toThrow(/mixes catalogue artifact identities/);

    const directory = await mkdtemp(join(tmpdir(), "tabiya-opening-catalogue-"));
    const missing = await loadOpeningCatalogue(join(directory, "missing.json"));
    expect(missing).toEqual({ kind: "unavailable", reason: "artifact_missing" });
    await writeFile(join(directory, "invalid.json"), "{}\n");
    expect(await loadOpeningCatalogue(join(directory, "invalid.json"))).toEqual({ kind: "unavailable", reason: "artifact_invalid" });
    const artifact = JSON.parse(await readFile(ARTIFACT, "utf8")) as RuntimeOpeningCatalogue;
    await writeFile(join(directory, "mismatch.json"), `${JSON.stringify({ ...artifact, digest: `sha256:${"0".repeat(64)}` })}\n`);
    const mismatch = await loadOpeningCatalogue(join(directory, "mismatch.json"));
    expect(mismatch).toEqual({ kind: "unavailable", reason: "digest_mismatch" });
    if (missing.kind === "unavailable") expect(openingIdentityAt(missing, E4, 1)).toEqual({
      currentEndpoint: { kind: "abstained", projectionId: "theory.opening.current_endpoint@1", reason: "artifact_missing" },
      catalogueMembership: { kind: "abstained", projectionId: "theory.opening.catalogue_membership@1", reason: "artifact_missing" },
    });
  });

  it("validates the digest and keeps deterministic renderers inside their evidence ceiling", async () => {
    const raw = JSON.parse(await readFile(ARTIFACT, "utf8")) as RuntimeOpeningCatalogue;
    const { digest, ...material } = raw;
    expect(digest).toBe(`sha256:${createHash("sha256").update(canonicalizeJson(material)).digest("hex")}`);
    const widenedMaterial = { ...material, workstationPath: "/tmp/private" };
    expect(() => compileLoadedOpeningCatalogue({ ...widenedMaterial, digest: `sha256:${createHash("sha256").update(canonicalizeJson(widenedMaterial)).digest("hex")}` })).toThrow(/shape is invalid/);
    const loaded = compileLoadedOpeningCatalogue(raw);
    const endpoint = loaded.currentEndpoint(normalizeOpeningPgn("1. Nh3").at(-1)!.fen, 1);
    const membership = loaded.catalogueMembership(E4, 1);
    expect(renderCurrentOpeningEndpoint(endpoint)).toBe(`Current position: A00 Amar Opening. Source: Lichess chess-openings ${CHESS_OPENINGS_COMMIT.slice(0, 7)}.`);
    expect(renderOpeningMembership(membership)).toBe("This position occurs on 2023 named catalogue paths.");
    const prose = [renderCurrentOpeningEndpoint(endpoint), renderOpeningMembership(membership)].join(" ").toLowerCase();
    expect(prose).not.toMatch(/\b(?:book|book move|theory says|best|accuracy|mistake|style|you should)\b/);
    expect(recordedOpeningPosition("node-1", 1, normalizeOpeningPgn("1. Nh3").at(-1)!.fen)).toMatchObject({ projectionId: "run.record.position@1", nodeId: "node-1", ply: 1 });
    expect(() => recordedOpeningPosition("", 1, E4)).toThrow(/nodeId/);
  });
});
