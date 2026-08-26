import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
import { describe, expect, it } from "vitest";

import { sha256 } from "./canonical.js";
import { consumeClaimBindingRecords, validateClaimBindings } from "./claim-binding.js";
import { legalSuccessors } from "./legal-moves.js";
import type { ClaimBinding, EvidenceLedger, SourcingIssue } from "./types.js";

const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

if (false) {
  // @ts-expect-error claim validation accepts only a compiled consumer view, never a bare ledger record array.
  consumeClaimBindingRecords([]);
}

function pack(text = "The move appears in 31.4% of games.", evidenceTypes = ["corpus_observed"]): DrillPackDefinition {
  return { id:"claim-fixture",version:"0.1.0",title:"Claim fixture",mode:"outcome",phase:"opening",start:{fen:START,side:"white"},objective:{type:"win",summary:"Win"},difficulty:{branchLengthTarget:2},feedbackPolicy:"attempt_end",opponentPolicy:{mode:"human_common"},spine:[],checkpoints:[],feedbackClaims:[{id:"claim",text,evidenceTypes}],provenance:{reviewStatus:"draft"} } as unknown as DrillPackDefinition;
}

function binding(text: string, overrides: Partial<ClaimBinding> = {}): ClaimBinding {
  return { claimId:"claim",pointer:"/feedbackClaims/0/text",textSha256:sha256(text),spans:[{span:"31.4%",assertion:{kind:"explorer.moveSharePct@v1",args:{fen:START,san:"e4"}}}],...overrides };
}

function ledger(claimBindings: readonly ClaimBinding[]): EvidenceLedger {
  return { schema:"tabiya.sourcing.evidence.v1",sourcedAt:"2026-08-16T00:00:00.000Z",records:[{kind:"explorer_position_census",anchor:{fen:START},sourceId:"fixture",retrievedAt:"2026-08-16T00:00:00.000Z",grounds:"machine_validation",values:{fen:START,total:1000,whitePct:50,drawPct:20,blackPct:30,topMoves:[{san:"e4",uci:"e2e4",playedCount:314,sharePct:31.4}],ratings:[1400],speeds:["rapid"],since:"2024-01",until:"2026-07"},supports:["/start/fen"]}],abstentions:[],claimBindings };
}

function codes(document: DrillPackDefinition, evidence: EvidenceLedger): readonly string[] {
  const issues: SourcingIssue[]=[]; validateClaimBindings(document,evidence,issues); return issues.map((issue)=>issue.code);
}

describe("claim bindings",()=>{
  it("backs an authored sentence without replacing it",()=>{
    const document=pack(), evidence=ledger([binding(document.feedbackClaims![0]!.text)]), issues:SourcingIssue[]=[];
    const result=validateClaimBindings(document,evidence,issues);
    expect(issues).toEqual([]); expect(result[0]).toMatchObject({claimId:"claim",disposition:"ledger_bound",instrumentKinds:["explorer_position_census"]});
  });

  it("pins pointer, identity, digest, uniqueness, and span refusals",()=>{
    const text=pack().feedbackClaims![0]!.text;
    expect(codes(pack(),ledger([binding(text,{pointer:"claim"})]))).toContain("CLAIM_POINTER_INVALID");
    expect(codes(pack(),ledger([binding(text,{claimId:"other"})]))).toContain("CLAIM_POINTER_REBOUND");
    expect(codes(pack(),ledger([binding(text,{textSha256:"0".repeat(64)})]))).toContain("CLAIM_TEXT_DRIFTED");
    expect(codes(pack(),ledger([binding(text),binding(text)]))).toContain("CLAIM_BINDING_DUPLICATE");
    expect(codes(pack(),ledger([binding(text,{spans:[{span:"missing",authored:true}]})]))).toContain("CLAIM_SPAN_ABSENT");
    const repeated="31.4% then 31.4%";
    expect(codes(pack(repeated),ledger([binding(repeated)]))).toContain("CLAIM_SPAN_AMBIGUOUS");
    expect(codes(pack(),ledger([binding(text,{spans:[{span:"31.4%",assertion:{kind:"explorer.moveSharePct@v1",args:{fen:START,san:"d4"}}}]})]))).toContain("CLAIM_ASSERTION_UNRECORDED");
    const contradictory=structuredClone(ledger([binding(text)])) as any; contradictory.records[0].values.topMoves[0].sharePct=30;
    expect(codes(pack(),contradictory)).toContain("CLAIM_SPAN_CONTRADICTED");
  });

  it("refuses off-pack assertions, incomplete censuses, undeclared tokens, and dishonest routing",()=>{
    const text=pack().feedbackClaims![0]!.text;
    expect(codes(pack(),ledger([binding(text,{spans:[{span:"31.4%",assertion:{kind:"explorer.moveSharePct@v1",args:{fen:"8/8/8/8/8/8/8/K6k w - - 0 1",san:"Ka2"}}}]})]))).toContain("CLAIM_FEN_OFF_PACK");
    expect(codes(pack("There are 20 legal moves.",["tablebase_exact"]),ledger([binding("There are 20 legal moves.",{textSha256:sha256("There are 20 legal moves."),spans:[{span:"20",assertion:{kind:"tablebase.moveCensus@v1",args:{fen:START},select:"total"}}]})]))).toContain("CLAIM_CENSUS_INCOMPLETE");
    expect(codes(pack("The move appears in 31.4% over 100 games."),ledger([binding("The move appears in 31.4% over 100 games.",{textSha256:sha256("The move appears in 31.4% over 100 games.")})]))).toContain("CLAIM_ASSERTION_UNDECLARED");
    const judgement="Black is better here";
    const authored=binding(judgement,{textSha256:sha256(judgement),spans:[{span:judgement,authored:true}]});
    expect(codes(pack(judgement,["corpus_observed"]),ledger([authored]))).toEqual(expect.arrayContaining(["CLAIM_AUTHOR_LABEL_REQUIRED","CLAIM_LABEL_UNEARNED"]));
    expect(codes(pack(judgement,["corpus_observed","author_principle"]),ledger([authored]))).toContain("CLAIM_LABEL_UNEARNED");
    for (const rate of [
      "f5 scores 90.9% for White",
      "f5 scores 91% for White",
      "f5 scores 91 percent for White",
      "f5 scores ninety-one percent for White",
    ]) {
      expect(codes(pack(rate,["author_principle"]),ledger([binding(rate,{textSha256:sha256(rate),spans:[{span:rate,authored:true}]})]))).toContain("CLAIM_READING_UNATTRIBUTED");
    }

    // Counts carry their denominator and remain author-attributable; the rate
    // refusal must not turn into a blanket ban on authored integers.
    for (const count of ["The sample contains 91 games", "The move appeared 44,467,486 times"]) {
      expect(codes(pack(count,["author_principle"]),ledger([binding(count,{textSha256:sha256(count),spans:[{span:count,authored:true}]})]))).not.toContain("CLAIM_READING_UNATTRIBUTED");
    }
  });

  it("admits a complete tablebase census with all four promotion roles", () => {
    const fen = "7k/P7/8/8/8/8/8/7K w - - 0 1";
    const successors = legalSuccessors(fen);
    expect(successors.filter((row) => row.uci.startsWith("a7a8")).map((row) => row.uci)).toEqual([
      "a7a8b", "a7a8n", "a7a8q", "a7a8r",
    ]);
    expect(new Set(successors.map((row) => row.fen)).size).toBe(successors.length);

    const text = `There are ${successors.length} legal moves.`;
    const document = {
      ...pack(text, ["tablebase_exact"]),
      start: { fen, side: "white" },
    } as DrillPackDefinition;
    const claimBinding = binding(text, {
      textSha256: sha256(text),
      spans: [{ span: String(successors.length), assertion: { kind: "tablebase.moveCensus@v1", args: { fen }, select: "total" } }],
    });
    const evidence: EvidenceLedger = {
      schema: "tabiya.sourcing.evidence.v1",
      sourcedAt: "2026-08-16T00:00:00.000Z",
      records: successors.map((successor) => ({
        kind: "tablebase_result",
        anchor: { fen: successor.fen },
        sourceId: "fixture",
        retrievedAt: "2026-08-16T00:00:00.000Z",
        grounds: "machine_validation",
        values: { fen: successor.fen, category: "draw" },
        supports: ["/start/fen"],
      })),
      abstentions: [],
      claimBindings: [claimBinding],
    };
    const issues: SourcingIssue[] = [];

    expect(validateClaimBindings(document, evidence, issues)).toHaveLength(1);
    expect(issues).toEqual([]);
  });
});
