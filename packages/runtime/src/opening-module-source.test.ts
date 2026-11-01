import { readFile } from "node:fs/promises";
import { afterEach, describe, expect, it, vi } from "vitest";
import { compileAssistanceRequest, compileAuthoritativeAssistance, finalizeAssistanceEffects, MODULE_SOURCE_AUTHORITY, serverAvailabilityFromProviders } from "./assistance-exchange.js";
import { MODULE_IDS } from "./module-contract.js";
import { queryModules } from "./module-query.js";
import { admitInstalledOpeningCatalogue } from "./opening-catalogue.js";
import { parsePresentationReceipt, presentedSentence } from "./presentation-contract.js";
import { commitMove, revealFeedback } from "./runtime.js";
import * as routes from "./internal/evidence-value-routes.js";
import { recordedLastLevelFixture } from "./testing/recorded-last-level-fixture.js";

const artifact = JSON.parse(await readFile(new URL("../../../apps/server/artifacts/runtime-opening-catalogue.json", import.meta.url), "utf8"));
const opening = admitInstalledOpeningCatalogue(artifact);
if (opening.kind !== "available") throw new Error(opening.reason);
const availability = serverAvailabilityFromProviders({ opponent: "external", judge: "external", llm: "external", corpus: "external", tts: "external", tablebase: "external" });
const assistance = finalizeAssistanceEffects(compileAuthoritativeAssistance(
  compileAssistanceRequest({ contextHint: "imported", preference: { kind: "explicit", preset: "theory_only", overrides: {}, moduleOverrides: { include: [], exclude: MODULE_IDS.filter(id => id !== "rules_floor" && id !== "theory_breadcrumb") } } }),
  { origin: { kind: "run", sessionKind: "imported", feedbackPolicy: "attempt_end" }, access: { deliveryOpen: true, role: "solo", seatedInContest: false, reviewing: false }, availability },
), { authority: MODULE_SOURCE_AUTHORITY, availability });
const originalRoute = routes.invokeEvidenceValueRoute;
function fixture(moves = ["e2e4"], id = "opening-module") {
  let run = recordedLastLevelFixture(moves.length % 2 === 0 ? "black" : "white", "*", id, []).run;
  for (const [index, move] of moves.entries()) run = commitMove(run, move, { actor: index % 2 === (moves.length - 1) % 2 ? "user" : "system", at: "2026-11-01T00:00:00.000Z" }).run;
  return revealFeedback(run, "2026-11-01T00:00:00.000Z").run;
}
function query(run = fixture(), source: Parameters<typeof queryModules>[0]["sources"] = { opening }) {
  const before = JSON.stringify(run);
  try {
    return queryModules({ run, assistance, role: "learner", session: "imported", request: { timing: "post_commit", subjectNodeId: run.activeCursor.nodeId, requested: ["theory_breadcrumb"] }, sources: source }).page.packets.find(packet => packet.module === "theory_breadcrumb")!;
  } finally { expect(JSON.stringify(run)).toBe(before); }
}
const sentences = (packet: ReturnType<typeof query>) => parsePresentationReceipt(packet.receipt).map(presentedSentence);
afterEach(() => vi.restoreAllMocks());

describe("actual installed opening source in Theory module queries", () => {
  it("renders the current sealed endpoint, then removes it at an unnamed member without leaking the membership fact", () => {
    const named = query();
    expect(sentences(named).join(" ")).toContain("King's Pawn Game");
    expect(named.receipt.items.filter(item => item.evidenceRef?.projection.id === "theory.opening.current_endpoint")).toHaveLength(1);
    expect(named.receipt.items.some(item => item.evidenceRef?.projection.id === "theory.opening.catalogue_membership")).toBe(false);
    const unnamed = query(fixture(["d2d4", "g8f6", "c2c4", "e7e6"]));
    expect(sentences(unnamed).join(" ")).not.toMatch(/King's Pawn Game|Opening in the cited catalogue/u);
    expect(unnamed.unavailable.some(row => row.projection === "theory.opening.current_endpoint@1")).toBe(false);
    expect(unnamed.empty?.kind).toBe("stated_absence");
    expect(sentences(query()).join(" ")).toContain("King's Pawn Game");
  });
  it.each(["artifact_missing", "artifact_invalid", "digest_mismatch"] as const)("preserves the exact %s installation state rather than reporting a successful negative", reason => {
    const packet = query(fixture(), { opening: { kind: "unavailable", reason } });
    expect(packet.unavailable).toContainEqual({ projection: "theory.opening.current_endpoint@1", reason });
    expect(sentences(packet).join(" ")).not.toContain("King's Pawn Game");
  });
  it("refuses a copied installed handle at the real module boundary", () => {
    expect(() => query(fixture(), { opening: { ...opening, source: { ...opening.source } } })).toThrow(TypeError);
  });
  it("refuses a genuine same-FEN position from a different run before either opening lookup", () => {
    const foreign = fixture(["e2e4"], "other-opening-run");
    const position = originalRoute("run.record.position@1", { run: foreign, nodeId: foreign.activeCursor.nodeId });
    const collect = vi.spyOn(routes, "invokeEvidenceValueRoute").mockImplementation((...args) => args[0] === "run.record.position@1" ? position as never : originalRoute(...args));
    expect(() => query()).toThrow(TypeError);
    expect(collect.mock.calls.some(([ref]) => ref.startsWith("theory.opening."))).toBe(false);
  });
  it("refuses a genuine empty membership array from another recorded position instead of publishing the endpoint", () => {
    const negative = recordedLastLevelFixture("white", "*", "different-opening-position", [], "4k3/7p/8/8/8/8/P7/4K3 w - - 0 1").run;
    const position = originalRoute("run.record.position@1", { run: negative, nodeId: negative.activeCursor.nodeId });
    const member = originalRoute("theory.opening.catalogue_membership@1", { source: opening.source, position });
    expect(member).toEqual({ kind: "available", value: [] });
    vi.spyOn(routes, "invokeEvidenceValueRoute").mockImplementation((...args) => args[0] === "theory.opening.catalogue_membership@1" ? member as never : originalRoute(...args));
    expect(() => query()).toThrow(TypeError);
  });
});
