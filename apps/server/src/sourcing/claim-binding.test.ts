import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
import { describe, expect, it } from "vitest";

import { sha256 } from "./canonical.js";
import { consumeClaimBindingRecords, validateClaimBindings } from "./claim-binding.js";
import { evidenceSupports } from "./check.js";
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
  describe("D3774 whole percentage spans", () => {
    const assertions = ["explorer.moveSharePct@v1", "explorer.scorePct@v1"] as const;
    function percentage(span: string, kind: typeof assertions[number], value: unknown = 31.4) {
      const document = pack(`Recorded percentage ${span}.`);
      const claim = binding(document.feedbackClaims![0]!.text, { spans: [{ span, assertion: { kind, args: { fen: START, san: "e4", side: "white" } } }] });
      const evidence = ledger([claim]);
      const record = evidence.records[0]!;
      const values = kind === "explorer.scorePct@v1" ? { ...record.values, whitePct: value }
        : { ...record.values, topMoves: [{ san: "e4", uci: "e2e4", playedCount: 314, sharePct: value }] };
      return { document, evidence: { ...evidence, records: [{ ...record, values }] } };
    }

    for (const kind of assertions) {
      it.each([
        "31.4% so Black is better here", "31.4% and a winning attack", "31.4%garbage",
        "31.4 percent", "31.4e0%", "031.4%", "31.40%", "31.4%%", "31.4.%",
      ])("%s is not an instrument span for " + kind, span => {
        // Unsupported chess prose is a deliberately false attribution fixture, not instruction.
        const { document, evidence } = percentage(span, kind);
        const issues: SourcingIssue[] = [];
        expect(validateClaimBindings(document, evidence, issues)).toEqual([]);
        expect(issues.map(item => item.code)).toContain("CLAIM_SPAN_CONTRADICTED");
        const supportIssues: SourcingIssue[] = [];
        evidenceSupports(document, evidence, undefined, supportIssues);
        expect(supportIssues.map(item => item.code)).toContain("EVIDENCE_TYPE_UNBACKED");
      });

      it.each([
        ["31.4", "31.4%"], [null, "0.0%"], [false, "0.0%"], [true, "1.0%"],
        ["", "0.0%"], [[31.4], "31.4%"], [[], "0.0%"], [-1, "-1.0%"],
        [100.1, "100.1%"], [31.45, "31.45%"],
      ] as const)("does not coerce source %j into a percentage for " + kind, (value, span) => {
        const { document, evidence } = percentage(span, kind, value);
        const issues: SourcingIssue[] = [];
        expect(validateClaimBindings(document, evidence, issues)).toEqual([]);
        expect(issues.map(item => item.code)).toContain("CLAIM_SPAN_CONTRADICTED");
      });

      it.each([0, 0.1, 31.4, 50, 99.9, 100])("retains canonical %s-percent scalar and display for " + kind, value => {
        for (const span of [value.toFixed(1), `${value.toFixed(1)}%`, ` ${value.toFixed(1)}% `]) {
          const { document, evidence } = percentage(span, kind, value);
          const before = structuredClone({ document, evidence });
          const issues: SourcingIssue[] = [];
          const admitted = validateClaimBindings(document, evidence, issues);
          expect(issues).toEqual([]);
          expect(admitted).toHaveLength(1);
          expect(admitted[0]).toMatchObject({ disposition: "ledger_bound", instrumentKinds: ["explorer_position_census"] });
          expect({ document, evidence }).toEqual(before);
        }
      });
    }

    it("keeps separately declared author prose attributed rather than forbidding it", () => {
      const text = "The recorded share is 31.4%. This is an author-only fixture statement.";
      const document = pack(text, ["corpus_observed", "author_principle"]);
      const evidence = ledger([binding(text, { spans: [
        { span: "31.4%", assertion: { kind: "explorer.moveSharePct@v1", args: { fen: START, san: "e4" } } },
        { span: "This is an author-only fixture statement.", authored: true },
      ] })]);
      const issues: SourcingIssue[] = [];
      expect(validateClaimBindings(document, evidence, issues)).toEqual([expect.objectContaining({
        disposition: "author_attributed", authorSpans: ["This is an author-only fixture statement."],
      })]);
      expect(issues).toEqual([]);
      expect(codes({ ...document, feedbackClaims: [{ ...document.feedbackClaims![0]!, evidenceTypes: ["corpus_observed"] }] }, evidence))
        .toContain("CLAIM_AUTHOR_LABEL_REQUIRED");
    });
  });

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
    const repeatedDocument = pack(repeated);
    const repeatedEvidence = ledger([binding(repeated)]);
    const repeatedIssues: SourcingIssue[] = [];
    expect(validateClaimBindings(repeatedDocument, repeatedEvidence, repeatedIssues)).toEqual([]);
    // D445's feared repeated-prose range cannot reach authorSegments: the
    // earlier unique-occurrence guard rejects the binding first.
    expect(repeatedIssues.map((issue) => issue.code)).toContain("CLAIM_SPAN_AMBIGUOUS");
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
