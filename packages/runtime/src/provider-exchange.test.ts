import { describe, expect, it } from "vitest";

import { assertDeclaredEvidence, evidenceValueReceipt } from "./evidence-contract.js";
import { providerSourceEvidence, syzygyTablebaseDomainEvidence } from "./evidence-operations.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";
import { providerBase64, providerUtf8 } from "./provider-digest.js";
import {
  PROVIDER_EXCHANGE_AUTHORITY,
  ProviderIdentityMismatch,
  ProviderSealRefused,
  assertProviderAcquisitionReceipt,
  assertProviderDelivery,
  assertProviderLocalDomainResult,
  assertProviderParsedPayloadReceipt,
  cacheIdentityOf,
  normalizedProviderRequestDigest,
  parsePersistedProviderDelivery,
  serializeProviderDelivery,
} from "./provider-exchange.js";
import { ProviderResponseInvalid } from "./provider-parsers.js";
import { normalizeProviderRequest } from "./provider-requests.js";
import {
  FIXTURE_AT,
  FIXTURE_LATER,
  START_FEN,
  allLegalRows,
  evaluationCapture,
  evaluationRequest,
  explorerBody,
  explorerRequest,
  httpCapture,
  legalRootCapture,
  legalRootLines,
  legalRootRequest,
  maiaActual,
  maiaCapture,
  maiaRequest,
  stockfishActual,
  syzygyBody,
  syzygyRequest,
} from "./provider-test-fixtures.js";
import type { ProviderExecutionCapture, ProviderOperationId, ProviderRequestedIdentityMap } from "./provider-types.js";

const { makeProviderAcquisitionReceipt, makeProviderParsedPayload, makeProviderDelivery, makeProviderLocalDomainResult } = PROVIDER_EXCHANGE_AUTHORITY;
const PROMOTION = "8/P7/8/8/8/8/8/k6K w - - 0 1";
const KQK = "8/8/8/8/8/8/3Q4/k1K5 w - - 0 1";
const EXACT = { kind: "exact_fen" as const, fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2" };
const MAIA_LINES = ["info depth 1 multipv 1 policy 0.41 pv g1f3", "info depth 1 multipv 2 policy 0.22 pv b1c3", "bestmove g1f3"];

function deliver<K extends ProviderOperationId>(operation: K, requested: ProviderRequestedIdentityMap[K], capture: ProviderExecutionCapture<K>) {
  const acquisition = makeProviderAcquisitionReceipt({ operation, requestedIdentity: requested, capture, requestedAt: FIXTURE_AT, retrievedAt: FIXTURE_AT });
  const { payload, payloadReceipt } = makeProviderParsedPayload(acquisition);
  return makeProviderDelivery({ kind: "live", acquisition, payload, payloadReceipt, servedAt: FIXTURE_AT });
}

const fixtures = () => {
  const root = normalizeProviderRequest("stockfish.legal_root_table@1", legalRootRequest(PROMOTION));
  const evaluation = normalizeProviderRequest("stockfish.position_evaluation@1", evaluationRequest(START_FEN));
  const maia = normalizeProviderRequest("maia.policy_page@1", maiaRequest(EXACT, { requestedWidth: 2 }));
  const syzygy = normalizeProviderRequest("syzygy.position@1", syzygyRequest(KQK));
  const explorer = normalizeProviderRequest("lichess_explorer.position_page@1", explorerRequest());
  return {
    "stockfish.legal_root_table@1": deliver("stockfish.legal_root_table@1", root, legalRootCapture(root, legalRootLines(PROMOTION, allLegalRows(PROMOTION), 8))),
    "stockfish.position_evaluation@1": deliver("stockfish.position_evaluation@1", evaluation, evaluationCapture(evaluation, ["info depth 12 score cp 20 wdl 300 600 100 pv e2e4", "bestmove e2e4"])),
    "maia.policy_page@1": deliver("maia.policy_page@1", maia, maiaCapture(maia, MAIA_LINES)),
    "syzygy.position@1": deliver("syzygy.position@1", syzygy, httpCapture("syzygy.position@1", syzygyBody(KQK))),
    "lichess_explorer.position_page@1": deliver("lichess_explorer.position_page@1", explorer, httpCapture("lichess_explorer.position_page@1", explorerBody())),
  } as const;
};

describe("§3 same-exchange receipts and seals", () => {
  it("seals acquisition, payload receipt and delivery for all five operations and refuses forgeries at runtime", () => {
    for (const [operation, delivery] of Object.entries(fixtures()) as [ProviderOperationId, ReturnType<typeof fixtures>[ProviderOperationId]][]) {
      expect(() => assertProviderDelivery(operation, delivery)).not.toThrow();
      expect(delivery.payloadReceipt.responseDigest).toBe(delivery.acquisition.responseDigest);
      expect(delivery.acquisition.normalizedRequestDigest).toBe(normalizedProviderRequestDigest(operation, delivery.acquisition.requestedIdentity as never));
      const forgeries: unknown[] = [{ ...delivery }, JSON.parse(JSON.stringify(delivery)), Object.assign(Object.create(null), delivery), delivery.payload];
      for (const forged of forgeries) expect(() => assertProviderDelivery(operation, forged)).toThrow(ProviderSealRefused);
      expect(() => assertProviderAcquisitionReceipt(operation, { ...delivery.acquisition })).toThrow(ProviderSealRefused);
      expect(() => assertProviderParsedPayloadReceipt(operation, delivery.payload as never, { ...delivery.payloadReceipt })).toThrow(ProviderSealRefused);
      // A same-shaped payload that is not the parsed object is refused, even when deep-equal.
      expect(() => assertProviderParsedPayloadReceipt(operation, JSON.parse(JSON.stringify(delivery.payload)) as never, delivery.payloadReceipt)).toThrow(/not the exact value/u);
      const other = operation === "syzygy.position@1" ? "maia.policy_page@1" : "syzygy.position@1";
      expect(() => assertProviderDelivery(other, delivery)).toThrow(/belongs to/u);
    }
  });

  it("refuses crossed endpoint, provider identity, engine/model and generation arms as identity_mismatch", () => {
    const root = normalizeProviderRequest("stockfish.legal_root_table@1", legalRootRequest(PROMOTION));
    const capture = legalRootCapture(root, legalRootLines(PROMOTION, allLegalRows(PROMOTION), 8));
    const make = (patch: Partial<ProviderExecutionCapture<"stockfish.legal_root_table@1">>) => () => makeProviderAcquisitionReceipt({ operation: "stockfish.legal_root_table@1", requestedIdentity: root, capture: { ...capture, ...patch } as never, requestedAt: FIXTURE_AT, retrievedAt: FIXTURE_AT });
    expect(make({ endpoint: { kind: "uci_supervisor", engineId: "maia-5m" } as never })).toThrow(ProviderIdentityMismatch);
    expect(make({ actualIdentity: stockfishActual("18") })).toThrow(/not the requested/u);
    expect(make({ actualIdentity: maiaActual() as never })).toThrow(ProviderIdentityMismatch);
    expect(make({ generation: null })).toThrow(/positive engine generation/u);
    expect(make({ generation: 0 })).toThrow(/positive engine generation/u);
    expect(make({ contentEncoding: "http-body" })).toThrow(ProviderIdentityMismatch);
    // A caller-authored command image is not the normalized requested identity.
    const forged = { ...root, command: { ...root.command, commands: [...root.command.commands.slice(0, 3), "go depth 1"] } };
    expect(() => makeProviderAcquisitionReceipt({ operation: "stockfish.legal_root_table@1", requestedIdentity: forged as never, capture, requestedAt: FIXTURE_AT, retrievedAt: FIXTURE_AT })).toThrow(/not the normalized image/u);
    expect(() => makeProviderAcquisitionReceipt({ operation: "stockfish.legal_root_table@1", requestedIdentity: root, capture, requestedAt: "yesterday", retrievedAt: FIXTURE_AT })).toThrow(/canonical UTC ISO/u);
    const syzygy = normalizeProviderRequest("syzygy.position@1", syzygyRequest(KQK));
    expect(() => makeProviderAcquisitionReceipt({ operation: "syzygy.position@1", requestedIdentity: syzygy, capture: { ...httpCapture("syzygy.position@1", syzygyBody(KQK)), generation: 3 } as never, requestedAt: FIXTURE_AT, retrievedAt: FIXTURE_AT })).toThrow(/generation null/u);
    expect(() => makeProviderAcquisitionReceipt({ operation: "syzygy.position@1", requestedIdentity: syzygy, capture: { ...httpCapture("syzygy.position@1", syzygyBody(KQK)), transport: { statusCode: 404, headers: { etag: null } } } as never, requestedAt: FIXTURE_AT, retrievedAt: FIXTURE_AT })).toThrow(/status 200/u);
  });

  it("binds the parsed payload to the captured bytes: other bytes, same bytes/other payload and invalid bytes fail", () => {
    const evaluation = normalizeProviderRequest("stockfish.position_evaluation@1", evaluationRequest(START_FEN));
    const first = deliver("stockfish.position_evaluation@1", evaluation, evaluationCapture(evaluation, ["info depth 12 score cp 20 wdl 300 600 100 pv e2e4", "bestmove e2e4"]));
    const second = deliver("stockfish.position_evaluation@1", evaluation, evaluationCapture(evaluation, ["info depth 12 score cp 25 wdl 300 600 100 pv e2e4", "bestmove e2e4"]));
    expect(first.acquisition.responseDigest).not.toBe(second.acquisition.responseDigest);
    expect(() => makeProviderDelivery({ kind: "live", acquisition: first.acquisition, payload: second.payload, payloadReceipt: second.payloadReceipt, servedAt: FIXTURE_AT })).toThrow(/other response bytes/u);
    expect(() => makeProviderDelivery({ kind: "live", acquisition: first.acquisition, payload: second.payload, payloadReceipt: first.payloadReceipt, servedAt: FIXTURE_AT })).toThrow(/not the exact value/u);
    const invalid = makeProviderAcquisitionReceipt({ operation: "stockfish.position_evaluation@1", requestedIdentity: evaluation, capture: evaluationCapture(evaluation, ["info depth 3 score cp 20 wdl 300 600 100 pv e2e4", "bestmove e2e4"]), requestedAt: FIXTURE_AT, retrievedAt: FIXTURE_AT });
    expect(() => makeProviderParsedPayload(invalid)).toThrow(ProviderResponseInvalid);
  });

  it("keeps one acquisition across live→retained while delivery/cache identity change", () => {
    const live = fixtures()["syzygy.position@1"];
    expect(live.cacheIdentity).toBeNull();
    expect(live.servedAt).toBe(live.acquisition.retrievedAt);
    const retained = makeProviderDelivery({ kind: "retained_exact", acquisition: live.acquisition, payload: live.payload, payloadReceipt: live.payloadReceipt, servedAt: FIXTURE_LATER });
    expect(retained.acquisition).toBe(live.acquisition);
    expect(retained.acquisition.retrievedAt).toBe(FIXTURE_AT);
    expect(retained.cacheIdentity).toBe(cacheIdentityOf(live.acquisition));
    expect(() => makeProviderDelivery({ kind: "live", acquisition: live.acquisition, payload: live.payload, payloadReceipt: live.payloadReceipt, servedAt: FIXTURE_LATER })).toThrow(/served at its retrieval time/u);
  });

  it("the Syzygy local-domain envelope is sealed, reproducible from its request and carries no provider fields", () => {
    const wide = normalizeProviderRequest("syzygy.position@1", syzygyRequest(START_FEN));
    const result = makeProviderLocalDomainResult(wide, FIXTURE_AT);
    expect(result).toEqual({ kind: "local_domain_result", operation: "syzygy.position@1", normalizedRequestDigest: normalizedProviderRequestDigest("syzygy.position@1", wide), observedAt: FIXTURE_AT, payload: { kind: "outside_domain", reason: "piece_count", pieceCount: 32, maximumPieceCount: 7 } });
    expect(Object.keys(result).sort()).toEqual(["kind", "normalizedRequestDigest", "observedAt", "operation", "payload"]);
    expect(() => makeProviderLocalDomainResult(normalizeProviderRequest("syzygy.position@1", syzygyRequest(KQK)), FIXTURE_AT)).toThrow(/in-domain/u);
    for (const forged of [{ ...result }, JSON.parse(JSON.stringify(result)), result.payload]) expect(() => assertProviderLocalDomainResult("syzygy.position@1", forged)).toThrow(ProviderSealRefused);
    expect(() => assertProviderLocalDomainResult("maia.policy_page@1", result)).toThrow(/belongs to/u);
  });
});

describe("value-authority source factories (evidence-value-authority D2)", () => {
  it("each operation reaches exactly its projection through the sole factory and seals the whole delivery", () => {
    const expected = {
      "stockfish.legal_root_table@1": "live.stockfish.legal_root_table@1",
      "stockfish.position_evaluation@1": "live.stockfish.position_eval@1",
      "maia.policy_page@1": "human.maia.policy_page@1",
      "syzygy.position@1": "live.syzygy.position_result@1",
      "lichess_explorer.position_page@1": "human.explorer.position_page@1",
    } as const;
    for (const [operation, delivery] of Object.entries(fixtures()) as [ProviderOperationId, never][]) {
      const evidence = providerSourceEvidence(operation, delivery);
      assertDeclaredEvidence(evidence);
      expect(`${evidence.projection.id}@${evidence.projection.version}`).toBe(expected[operation]);
      expect(evidence.payload).toBe(delivery);
      expect(() => assertProviderDelivery(operation, evidence.payload)).not.toThrow();
      expect(evidenceValueReceipt(evidence).sourceDigests).toHaveLength(3);
    }
  });

  it("refuses bare payloads, forged/JSON deliveries and another operation's delivery before minting", () => {
    const all = fixtures();
    const delivery = all["maia.policy_page@1"];
    for (const input of [delivery.payload, { ...delivery }, JSON.parse(JSON.stringify(delivery)), all["syzygy.position@1"]]) {
      expect(() => invokeEvidenceValueRoute("human.maia.policy_page@1", { delivery: input } as never)).toThrow(/scheduler-sealed maia\.policy_page@1/u);
    }
    const wide = makeProviderLocalDomainResult(normalizeProviderRequest("syzygy.position@1", syzygyRequest(START_FEN)), FIXTURE_AT);
    expect(syzygyTablebaseDomainEvidence(wide).payload).toBe(wide);
    expect(() => syzygyTablebaseDomainEvidence({ ...wide } as never)).toThrow(/scheduler-sealed/u);
    expect(() => syzygyTablebaseDomainEvidence(wide.payload as never)).toThrow(/scheduler-sealed/u);
  });
});

describe("durable save/reload boundary (D3030)", () => {
  it("round-trips every operation through JSON only via the sole parser, minting fresh seals", () => {
    for (const [operation, delivery] of Object.entries(fixtures()) as [ProviderOperationId, never][]) {
      const stored = JSON.parse(JSON.stringify(serializeProviderDelivery(operation, delivery)));
      const reloaded = parsePersistedProviderDelivery(operation, stored);
      expect(reloaded).not.toBe(delivery);
      expect(() => assertProviderDelivery(operation, reloaded)).not.toThrow();
      expect(JSON.stringify(reloaded)).toBe(JSON.stringify(delivery));
      expect(() => assertProviderDelivery(operation, stored)).toThrow(ProviderSealRefused);
    }
    const live = fixtures()["syzygy.position@1"];
    const retained = makeProviderDelivery({ kind: "retained_exact", acquisition: live.acquisition, payload: live.payload, payloadReceipt: live.payloadReceipt, servedAt: FIXTURE_LATER });
    const reloaded = parsePersistedProviderDelivery("syzygy.position@1", JSON.parse(JSON.stringify(serializeProviderDelivery("syzygy.position@1", retained))));
    expect(reloaded.kind).toBe("retained_exact");
    expect(reloaded.cacheIdentity).toBe(retained.cacheIdentity);
  });

  it("refuses unknown/extra/missing fields, crossed operations/providers, copied receipts, partial rehashes and bare payloads", () => {
    const all = fixtures();
    const stored = () => JSON.parse(JSON.stringify(serializeProviderDelivery("maia.policy_page@1", all["maia.policy_page@1"] as never))) as Record<string, any>;
    const reject = (mutate: (value: Record<string, any>) => unknown, operation: ProviderOperationId = "maia.policy_page@1") => {
      const value = stored();
      const replaced = mutate(value);
      return () => parsePersistedProviderDelivery(operation, replaced === undefined ? value : replaced);
    };
    expect(reject((value) => { value.extra = 1; })).toThrow(/exactly/u);
    expect(reject((value) => { delete value.servedAt; })).toThrow(/exactly/u);
    expect(reject((value) => { value.acquisition.extra = 1; })).toThrow(/exactly/u);
    expect(reject((value) => { value.schema = "tabiya.provider-delivery.v2"; })).toThrow(/unknown schema/u);
    expect(reject(() => undefined, "syzygy.position@1")).toThrow(/not syzygy/u);
    expect(reject((value) => { value.acquisition.provider = "stockfish"; })).toThrow(/crosses providers/u);
    expect(reject((value) => { value.acquisition.operation = "syzygy.position@1"; })).toThrow(/crosses operations/u);
    // Copied receipt: another exchange's payload receipt beside these bytes.
    const other = JSON.parse(JSON.stringify(serializeProviderDelivery("stockfish.position_evaluation@1", all["stockfish.position_evaluation@1"] as never)));
    expect(reject((value) => { value.payloadReceipt = { ...other.payloadReceipt, operation: "maia.policy_page@1", parser: "parse.maia_policy_page@1" }; })).toThrow(/does not re-derive/u);
    // Partial rehash: change the bytes and the stored response digest, keep the old payload digest.
    expect(reject((value) => {
      const bytes = providerUtf8(Buffer.from(value.response.bodyBase64, "base64").toString("utf8").replace("0.41", "0.40"));
      value.response.bodyBase64 = providerBase64(bytes);
    })).toThrow(/does not re-derive/u);
    expect(reject((value) => { value.acquisition.normalizedRequestDigest = `sha256:${"0".repeat(64)}`; })).toThrow(/does not re-derive/u);
    expect(reject((value) => { value.acquisition.generation = null; })).toThrow(/positive engine generation/u);
    expect(reject((value) => { value.acquisition.retrievedAt = FIXTURE_LATER; })).toThrow(/served at its retrieval time/u);
    expect(reject((value) => { value.payloadReceipt.parserImplementationDigest = `sha256:${"f".repeat(64)}`; })).toThrow(/does not re-derive/u);
    expect(reject((value) => { value.cacheIdentity = `sha256:${"a".repeat(64)}`; })).toThrow(/cache identity/u);
    expect(reject((value) => { value.acquisition.requestedIdentity.request.band = 1600; })).toThrow(/does not re-derive|identity/u);
    expect(reject((value) => { value.response.bodyBase64 += "\n"; })).toThrow(/canonical base64/u);
    expect(() => parsePersistedProviderDelivery("maia.policy_page@1", all["maia.policy_page@1"].payload)).toThrow(/exactly/u);
    expect(() => parsePersistedProviderDelivery("maia.policy_page@1", null)).toThrow(ProviderSealRefused);
  });
});

void maiaCapture;
