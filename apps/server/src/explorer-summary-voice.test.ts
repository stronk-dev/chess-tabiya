import { describe, expect, it, vi } from "vitest";
import { deriveExplorerPopulationSummary, providerSourceEvidence, evidenceForConsumer, renderPresentedEvidenceView, PRIMARY_EVIDENCE_MANIFEST } from "@chess-tabiya/runtime";
import { PROVIDER_EXCHANGE_AUTHORITY } from "../../../packages/runtime/src/provider-exchange.js";
import { normalizeProviderRequest } from "../../../packages/runtime/src/provider-requests.js";
import { explorerRequest, explorerBody, httpCapture, FIXTURE_AT } from "../../../packages/runtime/src/provider-test-fixtures.js";
import { ExternalHttpVoiceProvider } from "./external-voice.js";

describe("external voice Explorer transport", () => {
  it("sends the registered sentences and exact move-free receipt, not the internal raw page", async () => {
    const operation = "lichess_explorer.position_page@1";
    const acquisition = PROVIDER_EXCHANGE_AUTHORITY.makeProviderAcquisitionReceipt({ operation, requestedIdentity: normalizeProviderRequest(operation, explorerRequest()), capture: httpCapture(operation, explorerBody({ moves: [{ uci: "e2e4", san: "MOVE_ROW_SENTINEL_DO_NOT_DISCLOSE", white: 20, draws: 0, black: 0 }] })), requestedAt: FIXTURE_AT, retrievedAt: FIXTURE_AT });
    const parsed = PROVIDER_EXCHANGE_AUTHORITY.makeProviderParsedPayload(acquisition);
    const page = providerSourceEvidence(operation, PROVIDER_EXCHANGE_AUTHORITY.makeProviderDelivery({ kind: "live", acquisition, ...parsed, servedAt: FIXTURE_AT }));
    const summary = deriveExplorerPopulationSummary(page);
    const rendered = renderPresentedEvidenceView(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "module.theory_breadcrumb", version: 1 }, [summary]));
    expect(JSON.stringify(rendered)).toContain("MOVE_ROW_SENTINEL"); // Negative control: the source is genuinely present internally.
    const outbound = vi.fn<typeof fetch>(async (_input, init) => {
      const bytes = String(init?.body);
      expect(bytes).not.toMatch(/MOVE_ROW_SENTINEL|e2e4|canonicalUci|providerSan/u);
      const body = JSON.parse(bytes);
      expect(body.items).toHaveLength(1);
      expect(body.items[0].evidence.payload.source).toEqual({ provider: "lichess_explorer", normalizedRequestDigest: acquisition.normalizedRequestDigest, responseDigest: acquisition.responseDigest, delivery: "live" });
      expect(body.items[0].sentences).toEqual(rendered.items[0]!.sentences);
      return Response.json({ text: rendered.items[0]!.sentences.join(" ") });
    });
    const provider = new ExternalHttpVoiceProvider({ url: "https://voice.test", fetch: outbound });
    expect(await provider.render({ scope: "reading", rendered }, "grounded", "", "reading")).toContain("games");
    expect(outbound).toHaveBeenCalledOnce();
  });
});
