// D3774: synthetic recorded percentages through the real startup registry and authenticated HTTP.
// No engine/Explorer result or claim-delivery response is mocked; these are attribution controls,
// not observed chess frequencies, lessons, corpus graduation or longitudinal-worker proof.
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
import type { ChessTabiyaApplication } from "./application.js";
import { applicationFixture } from "./application-fixture.test-support.js";
import { createInMemoryTestApplication } from "./in-memory-test-application.js";
import { withDerivedRequires } from "./capability/pack-capabilities.js";
import { sha256 } from "./sourcing/canonical.js";
import type { EvidenceLedger } from "./sourcing/types.js";

const FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const AT = "2026-10-13T00:00:00.000Z";
const cases = ["share", "score"].flatMap(kind => ["valid", "prose", "coerced", "precision"].map(fault => ({ kind, fault, id: `claim-${kind}-${fault}` })));

function fixture(id: string, kind: string, fault: string): { document: DrillPackDefinition; ledger: EvidenceLedger } {
  const span = fault === "prose" ? "31.4% and a winning attack" : fault === "precision" ? "31.40%" : "31.4%";
  const text = `Recorded percentage ${span}.`;
  const value = fault === "coerced" ? "31.4" : 31.4;
  const document = withDerivedRequires({
    id, version: "0.1.0", title: "Synthetic attribution control", mode: "plan", phase: "opening",
    start: { fen: FEN, side: "white" },
    objective: { type: "play_until_checkpoint", summary: "Exercise source attribution without grading chess." },
    checkpoints: [{ id: "ready", trigger: { atStart: true } }],
    opponentPolicy: { mode: "human_common", seedMode: "fixed" }, feedbackPolicy: "delayed_checkpoint",
    feedbackClaims: [{ id: "percentage", text, evidenceTypes: ["corpus_observed"] }],
    provenance: { reviewStatus: "draft", sources: [], reviewers: [] }, requires: [],
  } as DrillPackDefinition);
  const ledger: EvidenceLedger = {
    schema: "tabiya.sourcing.evidence.v1", packId: id, packVersion: document.version, sourcedAt: AT,
    records: [{ kind: "explorer_position_census", anchor: { fen: FEN }, sourceId: "synthetic-attribution-control",
      retrievedAt: AT, grounds: "machine_validation", supports: ["/start/fen"],
      values: { fen: FEN, total: 1000, whitePct: kind === "score" ? value : 50, drawPct: 20, blackPct: 30,
        topMoves: [{ san: "e4", uci: "e2e4", playedCount: 314, sharePct: kind === "share" ? value : 31.4 }],
        ratings: [1400], speeds: ["rapid"], since: "2024-01", until: "2026-07" },
    }], abstentions: [], claimBindings: [{ claimId: "percentage", pointer: "/feedbackClaims/0/text", textSha256: sha256(text),
      spans: [{ span, assertion: { kind: kind === "share" ? "explorer.moveSharePct@v1" : "explorer.scorePct@v1", args: { fen: FEN, san: "e4", side: "white" } } }],
    }],
  };
  return { document, ledger };
}

describe("D3774 startup-to-learner claim attribution", () => {
  let directory: string | undefined;
  let owned: ReturnType<typeof applicationFixture<ChessTabiyaApplication>> | undefined;
  let origin: string;
  let ownerCookie: string;
  let otherCookie: string;
  beforeAll(async () => {
    directory = await mkdtemp(join(tmpdir(), "tabiya-claim-attribution-"));
    const files: string[] = [];
    for (const row of cases) {
      const { document, ledger } = fixture(row.id, row.kind, row.fault);
      const file = join(directory, `${row.id}.json`);
      await writeFile(file, JSON.stringify(document));
      await writeFile(join(directory, `${row.id}.evidence.json`), JSON.stringify(ledger));
      files.push(file);
    }
    owned = applicationFixture(createInMemoryTestApplication({ development: true, draftPackFiles: files, engineMode: "mock", cookieSecure: false }));
    await owned.ready;
    const app = owned.current()!;
    await new Promise<void>((resolve, reject) => { app.server.once("error", reject); app.server.listen(0, "127.0.0.1", resolve); });
    origin = `http://127.0.0.1:${(app.server.address() as AddressInfo).port}`;
    const register = async (handle: string) => {
      const response = await fetch(`${origin}/auth/register`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ handle, password: "claim-attribution-password" }) });
      expect(response.status).toBe(201);
      return response.headers.get("set-cookie")!.split(";", 1)[0]!;
    };
    ownerCookie = await register("claim_owner");
    otherCookie = await register("claim_other");
  });
  afterAll(async () => {
    try { await owned?.close(); }
    finally { if (directory !== undefined) await rm(directory, { recursive: true, force: true }); }
  });

  it.each(cases)("$kind / $fault retains exact source attribution through authenticated feedback", async ({ id, fault }) => {
    const created = await fetch(`${origin}/runs`, { method: "POST", headers: { "content-type": "application/json", cookie: ownerCookie, "x-writer-id": id },
      body: JSON.stringify({ id, seed: 7, session: { kind: "pack", packId: id }, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } } }),
    });
    expect(created.status, await created.text()).toBe(201);
    const recorded = async () => {
      const pages = await Promise.all(["graph", "events"].map(async action => {
        const response = await fetch(`${origin}/runs/${id}/${action}`, { headers: { cookie: ownerCookie, "x-writer-id": id } });
        expect(response.status).toBe(200);
        return response.json();
      }));
      return JSON.stringify(pages);
    };
    const before = await recorded();
    const response = await fetch(`${origin}/runs/${id}/authored-feedback`, { headers: { cookie: ownerCookie } });
    expect(response.status).toBe(200);
    const page = await response.json();
    const claims = page.items.filter((item: { kind: string }) => item.kind === "claim");
    if (fault === "valid") {
      expect(claims).toHaveLength(1);
      expect(claims[0]).toMatchObject({ binding: "ledger_bound", earnedEvidenceTypes: ["corpus_observed"], authorSpans: [] });
    } else {
      expect(claims).toEqual([]);
      expect(JSON.stringify(page)).not.toContain("winning attack");
    }
    expect((await fetch(`${origin}/runs/${id}/authored-feedback`, { headers: { cookie: otherCookie } })).status).toBe(404);
    expect((await fetch(`${origin}/runs/${id}/authored-feedback`)).status).toBe(401);
    expect(await recorded()).toBe(before);
  });
});
