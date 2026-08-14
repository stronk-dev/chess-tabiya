import { INITIAL_FEN } from "chessops/fen";
import { commitMove, createRun, fork, rewind } from "@chess-tabiya/runtime";
import { describe, expect, it } from "vitest";
import { distillRun } from "./distill.js";
import { validatePackDocument } from "./pack-validation.js";

const at="2026-08-14T12:00:00.000Z";
function run(){let value=createRun({id:"source",packId:"source-pack",packDigest:`sha256:${"a".repeat(64)}`,policyConfig:{seedMode:"per_branch",locus:{executedAt:"server",engineIds:[],modelIds:[]}},startFen:INITIAL_FEN,seed:1,createdAt:at});value=commitMove(value,"e2e4",{at}).run;const forkId=value.activeCursor.nodeId;value=commitMove(value,"e7e5",{at,actor:"system"}).run;value=rewind(value,forkId,at).run;value=fork(value,forkId,{label:"Other",intent:"Try the Sicilian",at}).run;return commitMove(value,"c7c5",{at,actor:"system"}).run;}

describe("run distillation",()=>{
  it("creates a validation-clean blocked seed and classless fork proposal deterministically",()=>{const source=run(),first=distillRun(source,undefined,{packId:"distilled-source",title:"Distilled source"}),second=distillRun(source,undefined,{packId:"distilled-source",title:"Distilled source"});expect(first).toEqual(second);expect(first.proposals).toHaveLength(1);expect(first.proposals[0]).not.toHaveProperty("class");expect(first.document).not.toHaveProperty("deviations");expect((first.document.provenance as any).graduationBlockers.length).toBeGreaterThan(0);const validation=validatePackDocument(first.document);expect(validation.issues).toEqual([]);expect(validation.valid).toBe(true);});
});
