// DISPOSABLE research harness — D1703-D1706. Not production code.
import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  EVIDENCE_CONTRACT_DECLARATIONS,
  compileEvidenceManifest,
  declareExplorerPopulationEvidence,
  declareExplorerPositionEvidence,
  normalizeInboundMove,
  type EvidenceContractDeclarations,
  type ProducerDeclaration,
  type ProjectionDeclaration,
} from "@chess-tabiya/runtime";

import {
  LichessCorpusSource,
  corpusPopulation,
  corpusUrl,
  normalizedCorpusQuery,
  parseCorpusResponse,
  type CorpusQuery,
  type CorpusResult,
} from "../../apps/server/src/corpus.js";

const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const AFTER_E4 = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";

const validBody = Object.freeze({
  white: 60,
  draws: 20,
  black: 40,
  moves: Object.freeze([
    Object.freeze({ san: "e4", uci: "e2e4", averageRating: 1512, white: 30, draws: 10, black: 20 }),
    Object.freeze({ san: "d4", uci: "d2d4", averageRating: 1498, white: 20, draws: 5, black: 15 }),
  ]),
  history: Object.freeze([
    Object.freeze({ month: "2026-07", white: 4, draws: 1, black: 3 }),
    Object.freeze({ month: "2026-08", white: 1, draws: 0, black: 0 }),
  ]),
  opening: Object.freeze({ eco: "A00", name: "Starting Position" }),
});

function query(fen = START, since = "2024-01"): CorpusQuery {
  return Object.freeze({ ...corpusPopulation(1400, new Date("2026-08-26T00:00:00Z")), fen, since, until: "2026-08" });
}

interface ExplorerPositionReceipt {
  readonly request: ReturnType<typeof normalizedCorpusQuery>;
  readonly receipt: {
    readonly sourceId: "lichess-explorer";
    readonly endpoint: string;
    readonly retrievedAt: string;
    readonly requestDigest: string;
    readonly responseDigest: string;
  };
  readonly result: CorpusResult;
}

function sha256(value: string): string {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function receipt(rawQuery: CorpusQuery, raw: unknown): ExplorerPositionReceipt {
  const request = normalizedCorpusQuery(rawQuery);
  const endpoint = corpusUrl(request);
  const response = JSON.stringify(raw);
  return Object.freeze({
    request,
    receipt: Object.freeze({
      sourceId: "lichess-explorer",
      endpoint,
      retrievedAt: "2026-08-26T00:00:00.000Z",
      requestDigest: sha256(endpoint),
      responseDigest: sha256(response),
    }),
    result: parseCorpusResponse(raw, request),
  });
}

function repairedMoveRows(raw: unknown, rawQuery: CorpusQuery): CorpusResult {
  const request = normalizedCorpusQuery(rawQuery);
  const result = parseCorpusResponse(raw, request);
  if (result.kind !== "stats") return result;
  const seen = new Set<string>();
  for (const move of result.moves) {
    const identity = normalizeInboundMove(request.fen, move.uci, "lichess_explorer").moveUci;
    if (seen.has(identity)) throw new TypeError(`duplicate Explorer move ${identity}`);
    seen.add(identity);
    if (move.playedCount > result.total) throw new TypeError(`Explorer move count exceeds position total for ${identity}`);
  }
  return result;
}

function prospectiveProjection(): ProjectionDeclaration {
  return Object.freeze({
    id: "human.explorer.position_page", version: 1,
    producer: Object.freeze({ id: "human.explorer", version: 1 }),
    role: "source_record", plane: "human", payloadType: "ExplorerPositionReceipt",
    semantics: "One normalized position/population request joined to its exact Explorer response receipt and validated result.",
    operands: Object.freeze(["request", "receipt", "result"]), signs: Object.freeze(["state"]),
    grounding: "human_corpus", exactness: "measured", confidence: "reported",
    abstention: Object.freeze({ possible: true, reasons: Object.freeze([
      "provider_unavailable", "deadline_exceeded", "queue_full", "cancelled", "invalid_response", "identity_mismatch",
    ]) }),
    answerContent: Object.freeze(["fact", "candidate_moves"]),
    forms: Object.freeze(["list", "panel", "machine_condition"]), dependsOn: Object.freeze([]),
    limitations: Object.freeze([
      "Returned moves are a bounded population sample, not a complete legal set, rank, recommendation, grade or intent claim.",
      "Population, time window, requested width and listed/unlisted mass remain part of every interpretation.",
    ]),
    disposition: Object.freeze({ kind: "operator_only", reason: "Generic source lands before inspector, module, Review and bot migrations." }),
  });
}

function prospectiveDeclarations(): EvidenceContractDeclarations {
  return Object.freeze({
    ...EVIDENCE_CONTRACT_DECLARATIONS,
    producers: Object.freeze(EVIDENCE_CONTRACT_DECLARATIONS.producers.map((producer): ProducerDeclaration => producer.id === "human.explorer"
      ? Object.freeze({ ...producer, outputs: Object.freeze([...producer.outputs, prospectiveProjection()]) })
      : producer)),
  });
}

describe("D1703 Explorer request/source identity", () => {
  it("reproduces cross-position relabelling and caller-owned node identity", () => {
    const atStart = parseCorpusResponse(validBody, query(START));
    const afterE4 = parseCorpusResponse(validBody, query(AFTER_E4));
    expect(atStart).toEqual(afterE4);
    expect(sha256(JSON.stringify(declareExplorerPositionEvidence(atStart)))).toBe(sha256(JSON.stringify(declareExplorerPositionEvidence(afterE4))));

    expect(() => declareExplorerPopulationEvidence({ nodeId: "unrelated-node", result: atStart, committedMoveSan: "Qh7#" })).not.toThrow();

    const startReceipt = receipt(query(START), validBody);
    const e4Receipt = receipt(query(AFTER_E4), validBody);
    expect(startReceipt.request.fen).not.toBe(e4Receipt.request.fen);
    expect(sha256(JSON.stringify(startReceipt))).not.toBe(sha256(JSON.stringify(e4Receipt)));
    expect(startReceipt.receipt.responseDigest).toBe(e4Receipt.receipt.responseDigest);
  });

  it("preserves the existing exact cache identity and compiles a node-free generic source", () => {
    expect(corpusUrl(query(START))).toBe(corpusUrl(query("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 72 99")));
    expect(corpusUrl(query(START))).not.toBe(corpusUrl(query(AFTER_E4)));
    expect(corpusUrl(query(START, "2024-01"))).not.toBe(corpusUrl(query(START, "2025-01")));
    expect(() => compileEvidenceManifest(prospectiveDeclarations())).not.toThrow();
  });
});

describe("D1704 Explorer move integrity", () => {
  it("reproduces illegal, duplicate and impossible-count acceptance, then refuses each", () => {
    const illegal = { ...validBody, moves: [{ san: "e5", uci: "e2e5", white: 1, draws: 0, black: 0 }] };
    const duplicate = { ...validBody, moves: [validBody.moves[0], validBody.moves[0]] };
    const impossible = { ...validBody, moves: [{ san: "e4", uci: "e2e4", white: 121, draws: 0, black: 0 }] };
    expect(parseCorpusResponse(illegal, query()).kind).toBe("stats");
    expect(parseCorpusResponse(duplicate, query()).kind).toBe("stats");
    expect(parseCorpusResponse(impossible, query()).kind).toBe("stats");
    expect(() => repairedMoveRows(illegal, query())).toThrow(/illegal move uci/i);
    expect(() => repairedMoveRows(duplicate, query())).toThrow(/duplicate Explorer move/i);
    expect(() => repairedMoveRows(impossible, query())).toThrow(/exceeds position total/i);
    expect(repairedMoveRows(validBody, query()).kind).toBe("stats");
  });

  it("shows the live parser discards admitted upstream fields before declaration", () => {
    const result = parseCorpusResponse(validBody, query());
    expect(result.kind).toBe("stats");
    if (result.kind !== "stats") throw new TypeError("fixture unexpectedly abstained");
    expect(result.recency).toEqual({ kind: "month", lastPlayedMonth: "2026-08" });
    expect("history" in result).toBe(false);
    expect("opening" in result).toBe(false);
    expect("averageRating" in result.moves[0]!).toBe(false);
  });

  it("shows a consumer sample floor currently destroys a valid source page", () => {
    const sparse = {
      white: 16, draws: 5, black: 16,
      moves: [{ san: "e4", uci: "e2e4", averageRating: 1500, white: 8, draws: 2, black: 7 }],
      history: [],
    };
    expect(parseCorpusResponse(sparse, query())).toMatchObject({ kind: "abstention", reason: "no_data_at_band", detail: "total 37 < 100" });
    const total = sparse.white + sparse.draws + sparse.black;
    expect(total).toBe(37);
    expect(() => normalizeInboundMove(START, sparse.moves[0]!.uci, "lichess_explorer")).not.toThrow();
  });
});

describe("D1705/D1706 availability contract", () => {
  it("shows the fifth accepted request waits behind four dispatches while the sixth is refused", async () => {
    const releases: Array<() => void> = [];
    const source = new LichessCorpusSource({
      token: "fixture",
      fetcher: async () => await new Promise<Response>((resolve) => releases.push(() => resolve(new Response(JSON.stringify(validBody), { status: 200 })))),
      timeoutMs: 4_000,
    });
    const requests = ["2024-01", "2024-02", "2024-03", "2024-04", "2024-05", "2024-06"].map((since) => source.stats(query(START, since)));
    await Promise.resolve();
    expect(releases).toHaveLength(1);
    await expect(requests[5]).resolves.toMatchObject({ kind: "abstention", reason: "source_unavailable", detail: "interactive budget exceeded" });

    let fifthSettled = false;
    void requests[4]!.then(() => { fifthSettled = true; });
    for (let index = 0; index < 4; index += 1) {
      releases[index]!();
      await requests[index];
      await Promise.resolve();
      expect(releases).toHaveLength(index + 2);
      expect(fifthSettled).toBe(false);
    }
    releases[4]!();
    await requests[4];
    expect(fifthSettled).toBe(true);
  });

  it("proves runtime and manifest abstention vocabularies are not set-equal", () => {
    const explorer = EVIDENCE_CONTRACT_DECLARATIONS.producers.find((producer) => producer.id === "human.explorer")!;
    const declared = new Set(explorer.outputs.flatMap((projection) => projection.abstention.reasons));
    const runtime = new Set(["no_data_at_band", "source_unavailable"]);
    expect(declared).toEqual(new Set(["empty_population", "source_unavailable"]));
    expect(declared).not.toEqual(runtime);
  });
});
