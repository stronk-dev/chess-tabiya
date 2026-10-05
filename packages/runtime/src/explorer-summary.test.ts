import { describe, expect, it } from "vitest";
import { deriveExplorerPopulationSummary, deriveExplorerPositionFrequency, deriveExplorerInspectorPopulation, providerSourceEvidence } from "./evidence-operations.js";
import { assertDeclaredEvidence, evidenceForConsumer, evidenceValueReceipt } from "./evidence-contract.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { explorerPopulationSummaryWire, renderedProviderItems } from "./explorer-summary.js";
import { CORPUS_GUARD } from "./population-guard.js";
import { PROVIDER_EXCHANGE_AUTHORITY } from "./provider-exchange.js";
import { normalizeProviderRequest } from "./provider-requests.js";
import { FIXTURE_AT, FIXTURE_LATER, explorerBody, explorerRequest, httpCapture } from "./provider-test-fixtures.js";
import { parsePresentationReceipt, presentEvidenceItems, presentedSentence, renderPresentedEvidenceView, serializePresentedEvidence } from "./presentation-contract.js";
import { voiceCheck } from "./voice.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";
import { compileProjectionExecution } from "./evidence-execution.js";

const SENTINEL = "MOVE_ROW_SENTINEL_DO_NOT_DISCLOSE";
function source(total: number, history: boolean, retained = false) {
  const requested = normalizeProviderRequest("lichess_explorer.position_page@1", explorerRequest({ history: { kind: history ? "requested" : "disabled" } }));
  const body = explorerBody({ white: total, draws: 0, black: 0, averageRating: total === 0 ? null : 1700,
    moves: total === 0 ? [] : [{ uci: "e2e4", san: SENTINEL, white: Math.min(20, total), draws: 0, black: 0, averageRating: 1700 }],
    opening: { eco: "A00", name: "Fixture opening" }, ...(history ? { history: [{ month: "2025-01", white: total, draws: 0, black: 0 }] } : {}),
  });
  const acquisition = PROVIDER_EXCHANGE_AUTHORITY.makeProviderAcquisitionReceipt({ operation: "lichess_explorer.position_page@1", requestedIdentity: requested, capture: httpCapture("lichess_explorer.position_page@1", body), requestedAt: FIXTURE_AT, retrievedAt: FIXTURE_AT });
  const parsed = PROVIDER_EXCHANGE_AUTHORITY.makeProviderParsedPayload(acquisition);
  return providerSourceEvidence("lichess_explorer.position_page@1", PROVIDER_EXCHANGE_AUTHORITY.makeProviderDelivery({ kind: retained ? "retained_exact" : "live", acquisition, ...parsed, servedAt: retained ? FIXTURE_LATER : FIXTURE_AT }));
}

describe("Explorer move-free population summary", () => {
  it.each([0, 99, 100, 70000])("keeps Inspector's canonical population %i separate from provider-only fields", total => {
    const page = source(total, true, true);
    const population = deriveExplorerInspectorPopulation(page);
    expect(population.payload.page).toBe(page);
    expect(population.payload.totals.total).toBe(total);
    expect(population.payload.moves.reduce((sum, row) => sum + row.playedCount, population.payload.unlisted)).toBe(total);
    expect(population.payload.lastPlayedMonth).toBe(total === 0 ? null : "2025-01");
    expect(evidenceValueReceipt(population).sourceDigests).toEqual([evidenceValueReceipt(page).payloadDigest]);
    expect(compileProjectionExecution(PRIMARY_EVIDENCE_MANIFEST, population.projection).paths.map(path => path.sourceRequirements.map(row => row.providerOperation))).toEqual([["lichess_explorer.position_page@1"]]);
    const view = evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "inspector.corpus", version: 1 }, [population]);
    expect(view.items).toEqual([population]);
    if (total >= 100) {
      const wire = serializePresentedEvidence(presentEvidenceItems(view));
      expect(JSON.stringify(wire)).not.toMatch(/MOVE_ROW_SENTINEL|providerSan|acquisition|payloadReceipt|requestedIdentity/u);
      expect(parsePresentationReceipt(wire).map(presentedSentence).join(" ")).toContain("e4");
    }
    for (const consumer of ["module.theory_breadcrumb", "guidance.voice", "runtime.return_frequency", "runtime.repertoire_scan"]) expect(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: consumer, version: 1 }, [population]).items).toEqual([]);
    for (const candidate of [{ ...page }, page.payload, JSON.parse(JSON.stringify(page)), deriveExplorerPopulationSummary(page)]) expect(() => invokeEvidenceValueRoute("derived.explorer.inspector_population@1", { page: candidate } as never)).toThrow();
    expect(() => invokeEvidenceValueRoute("derived.explorer.inspector_population@1", { page, moves: [] } as never)).toThrow(/extra/u);
  });
  it.each([0, 99, 100, 70000])("retains literal frequency %i without a source-owned floor or learner move rows", total => {
    const page = source(total, true, true);
    const frequency = deriveExplorerPositionFrequency(page);
    assertDeclaredEvidence(frequency);
    expect(frequency.payload).toEqual({ page, request: page.payload.payload.request, total });
    expect(Object.keys(frequency.payload).sort()).toEqual(["page", "request", "total"]);
    expect(evidenceValueReceipt(frequency).sourceDigests).toEqual([evidenceValueReceipt(page).payloadDigest]);
    expect(compileProjectionExecution(PRIMARY_EVIDENCE_MANIFEST, frequency.projection).paths.map(path => path.sourceRequirements.map(row => row.providerOperation))).toEqual([["lichess_explorer.position_page@1"]]);
    expect(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "runtime.return_frequency", version: 1 }, [frequency]).items).toEqual([frequency]);
    for (const consumer of ["module.theory_breadcrumb", "guidance.voice", "runtime.repertoire_scan"]) expect(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: consumer, version: 1 }, [frequency]).items).toEqual([]);
    for (const candidate of [{ ...page }, page.payload, JSON.parse(JSON.stringify(page)), deriveExplorerPopulationSummary(page)]) expect(() => invokeEvidenceValueRoute("derived.explorer.position_frequency@1", { page: candidate } as never)).toThrow();
    expect(() => invokeEvidenceValueRoute("derived.explorer.position_frequency@1", { page, total: 999999 } as never)).toThrow(/extra/u);
  });

  it.each([0, 37, 100])("retains source population %i without inventing suitability", (total) => {
    const page = source(total, true);
    const summary = deriveExplorerPopulationSummary(page);
    assertDeclaredEvidence(summary);
    expect(summary.payload.page).toBe(page);
    expect(evidenceValueReceipt(summary).sourceDigests).toEqual([evidenceValueReceipt(page).payloadDigest]);
    const wire = explorerPopulationSummaryWire(summary);
    expect(wire.totals.total).toBe(total);
    expect(wire.listed + wire.unlisted).toBe(total);
    expect(wire.history.kind).toBe("reported");
    expect(wire.disclosure).toEqual({ guard: "CORPUS_GUARD", statement: CORPUS_GUARD });
    expect(Object.keys(wire).sort()).toEqual(["averageRating", "disclosure", "history", "listed", "opening", "position", "source", "totals", "unlisted"]);
    expect(Object.keys(wire.source).sort()).toEqual(["delivery", "normalizedRequestDigest", "provider", "responseDigest"]);
    expect(JSON.stringify(wire)).not.toMatch(/MOVE_ROW_SENTINEL|canonicalUci|canonicalSan|providerSan|moves|suitable|accepted|threshold/u);
  });
  it("keeps disabled history and retained delivery exact while rendering only registered move-free operands", () => {
    const page = source(37, false, true);
    const summary = deriveExplorerPopulationSummary(page);
    const wire = explorerPopulationSummaryWire(summary);
    expect(wire.history).toEqual({ kind: "not_requested" });
    expect(wire.source.delivery).toBe("retained_exact");
    expect(wire.source.responseDigest).toBe(page.payload.acquisition.responseDigest);
    expect(JSON.stringify(summary.payload.page)).toContain(SENTINEL);
    const view = evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "module.theory_breadcrumb", version: 1 }, [summary]);
    const presented = presentEvidenceItems(view);
    expect(presented.map(presentedSentence).join(" ")).toContain(CORPUS_GUARD);
    expect(presented.map(presentedSentence).join(" ")).toContain("37 games");
    const receipt = serializePresentedEvidence(presented);
    expect(JSON.stringify(receipt)).not.toMatch(/MOVE_ROW_SENTINEL|e2e4|canonicalUci|providerSan/u);
    expect(parsePresentationReceipt(receipt).map(presentedSentence)).toEqual(presented.map(presentedSentence));
    const voice = renderPresentedEvidenceView(view);
    expect(JSON.stringify(renderedProviderItems(voice))).not.toMatch(/MOVE_ROW_SENTINEL|e2e4|canonicalUci|providerSan/u);
    expect(voiceCheck(voice, "Play e4").valid).toBe(false);
  });
  it("refuses unsealed, crossed and caller-edited authority before derivation or transport", () => {
    const page = source(37, false);
    const summary = deriveExplorerPopulationSummary(page);
    for (const candidate of [{ ...page }, page.payload, JSON.parse(JSON.stringify(page)), summary]) expect(() => invokeEvidenceValueRoute("derived.explorer.population_summary@1", { page: candidate } as never)).toThrow();
    expect(() => invokeEvidenceValueRoute("derived.explorer.population_summary@1", { page, disclosure: "invented" } as never)).toThrow(/extra/u);
    for (const candidate of [{ ...summary }, JSON.parse(JSON.stringify(summary)), page]) expect(() => explorerPopulationSummaryWire(candidate as never)).toThrow();
    expect(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "module.theory_breadcrumb", version: 1 }, [page]).items).toEqual([]);
  });
});
