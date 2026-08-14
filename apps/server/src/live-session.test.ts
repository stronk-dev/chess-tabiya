import { createHash } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";

import { EvidenceJobQueue, type EvidenceExecutor } from "./evidence-queue.js";
import { IdentityService } from "./identity.js";
import { LiveSessionService, deriveMoveAuthorship } from "./live-session.js";
import { createRestHandler } from "./rest.js";
import { RunService } from "./service.js";
import { SQLiteRunStorage, STORAGE_VERSION } from "./storage.js";

const FEN="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const PASSWORD="correct horse battery staple";
const executor:EvidenceExecutor={async execute(){return {kind:"eval",source:"engine_validated",values:{centipawns:0}};}};
const derive=(password:string,salt:Buffer)=>Promise.resolve(createHash("sha256").update(salt).update(password).digest());

function request(handler:ReturnType<typeof createRestHandler>,method:string,path:string,options:{cookie?:string;writerId?:string;body?:unknown}={}){
  return handler(new Request(`http://tabiya.test${path}`,{method,headers:{...(options.cookie?{cookie:options.cookie}:{}),...(options.writerId?{"x-writer-id":options.writerId}:{}),...(options.body===undefined?{}:{"content-type":"application/json"})},...(options.body===undefined?{}:{body:JSON.stringify(options.body)})}));
}
const cookie=(response:Response)=>response.headers.get("set-cookie")!.split(";",1)[0]!;

describe("live session platform",()=>{
  const stores:SQLiteRunStorage[]=[];
  afterEach(()=>{for(const store of stores.splice(0))store.close();});
  function setup(){const storage=new SQLiteRunStorage(":memory:",{onMigration:()=>{}});stores.push(storage);const identity=new IdentityService(storage,{cookieSecure:false,derive});const queue=new EvidenceJobQueue(executor);const service=new RunService(storage,{evidenceQueue:queue});const live=new LiveSessionService(storage,{now:()=>"2026-08-13T12:00:00.000Z",runService:service});return {storage,queue,live,handler:createRestHandler(service,undefined,undefined,identity,undefined,live)};}
  async function register(handler:ReturnType<typeof createRestHandler>,handle:string){const response=await request(handler,"POST","/auth/register",{body:{handle,password:PASSWORD}});return {cookie:cookie(response),learner:(await response.json() as any).learner as {id:string;handle:string}};}

  it("migrates to the live schema and enforces board control, proposals, and namespaced advisory votes",async()=>{
    const {storage,queue,handler}=setup();expect(STORAGE_VERSION).toBe(10);
    const alice=await register(handler,"alice");const bob=await register(handler,"bob");const chat=await register(handler,"chatbridge");
    const run={id:"live-run",session:{kind:"position",start:{fen:FEN,side:"white"},feedbackPolicy:"attempt_end",opponentPolicy:{mode:"human_common"}},policyConfig:{seedMode:"fixed",locus:{executedAt:"server",engineIds:[],modelIds:[]}},seed:7};
    expect((await request(handler,"POST","/runs",{cookie:alice.cookie,writerId:"writer-a",body:run})).status).toBe(201);
    for(const [handle,role] of [["bob","participant"],["chatbridge","spectator"]] as const){expect((await request(handler,"POST","/runs/live-run/grants",{cookie:alice.cookie,writerId:"writer-a",body:{op:"grant",handle,role}})).status).toBe(200);}
    const created=await request(handler,"POST","/sessions",{cookie:alice.cookie,body:{runId:"live-run",kind:"academy",title:"Thursday class",boardControl:"host_directed",voteAdapterHandle:"chatbridge"}});expect(created.status).toBe(201);const session=(await created.json() as any).session as {id:string};
    const held=await request(handler,"POST","/runs/live-run/lease",{cookie:bob.cookie,writerId:"writer-b",body:{expectedHolderLearnerId:alice.learner.id}});expect(held.status).toBe(409);expect((await held.json() as any).error.code).toBe("BOARD_HELD");
    const graph=await request(handler,"GET","/runs/live-run/graph",{cookie:bob.cookie});const root=(await graph.json() as any).graph.nodes[0].id as string;
    const proposed=await request(handler,"POST",`/sessions/${session.id}/proposals`,{cookie:bob.cookie,body:{nodeId:root,moveUci:"e2e4"}});expect(proposed.status).toBe(201);const proposal=(await proposed.json() as any).proposal as {id:string};
    const opened=await request(handler,"POST",`/sessions/${session.id}/votes`,{cookie:alice.cookie,body:{op:"open",nodeId:root,prompt:"Which plan?",options:[{moveUci:"e2e4",label:"King pawn"},{moveUci:"d2d4",label:"Queen pawn"}],durationSeconds:60}});expect(opened.status).toBe(201);const window=(await opened.json() as any).window as {id:string};
    const before=JSON.stringify(storage.read("live-run")!.run.events);
    await request(handler,"POST",`/sessions/${session.id}/votes`,{cookie:alice.cookie,body:{op:"cast",windowId:window.id,choiceUci:"e2e4"}});
    const relay=await request(handler,"POST",`/sessions/${session.id}/votes`,{cookie:chat.cookie,body:{op:"cast",windowId:window.id,choiceUci:"d2d4",voterKey:alice.learner.id}});expect(relay.status).toBe(200);const tally=await relay.json() as any;expect(tally.total).toBe(2);expect(tally.tally.map((item:any)=>item.count)).toEqual([1,1]);expect(JSON.stringify(storage.read("live-run")!.run.events)).toBe(before);
    expect((await request(handler,"POST",`/sessions/${session.id}/proposals/${proposal.id}`,{cookie:alice.cookie,writerId:"writer-a",body:{op:"apply"}})).status).toBe(200);
    await queue.whenIdle();expect(queue.page("live-run",0).results).toHaveLength(1);
    await request(handler,"POST",`/sessions/${session.id}/board`,{cookie:alice.cookie,writerId:"writer-a",body:{op:"offer",handle:"bob"}});
    expect((await request(handler,"POST","/runs/live-run/lease",{cookie:bob.cookie,writerId:"writer-b",body:{expectedHolderLearnerId:alice.learner.id}})).status).toBe(200);
    expect((await request(handler,"POST","/runs/live-run/moves",{cookie:bob.cookie,writerId:"writer-b",body:{uci:"e7e5"}})).status).toBe(200);
    const journal=await (await request(handler,"GET",`/sessions/${session.id}/journal?sinceSeq=0`,{cookie:bob.cookie})).json() as any;
    expect(journal.entries.map((entry:any)=>entry.kind)).toContain("board.granted");
    const authors=deriveMoveAuthorship(storage.read("live-run")!.run,journal.entries,alice.learner.id);
    expect(authors.map((entry)=>entry.learnerId)).toEqual([alice.learner.id,bob.learner.id]);
  });

  it("rejects adapter keys from ordinary learners and reports declared statuses",async()=>{
    const {handler}=setup();const alice=await register(handler,"alice");const bob=await register(handler,"bob");
    await request(handler,"POST","/runs",{cookie:alice.cookie,writerId:"writer-a",body:{id:"r",session:{kind:"position",start:{fen:FEN,side:"white"},feedbackPolicy:"attempt_end",opponentPolicy:{mode:"human_common"}},policyConfig:{seedMode:"fixed",locus:{executedAt:"server",engineIds:[],modelIds:[]}},seed:1}});
    await request(handler,"POST","/runs/r/grants",{cookie:alice.cookie,writerId:"writer-a",body:{op:"grant",handle:"bob",role:"spectator"}});
    const made=await request(handler,"POST","/sessions",{cookie:alice.cookie,body:{runId:"r",kind:"stream",title:"Stream"}});const sid=(await made.json() as any).session.id;
    const graph=await (await request(handler,"GET","/runs/r/graph",{cookie:alice.cookie})).json() as any;const opened=await request(handler,"POST",`/sessions/${sid}/votes`,{cookie:alice.cookie,body:{op:"open",nodeId:graph.graph.nodes[0].id,prompt:"Move",options:[{moveUci:"e2e4",label:"e4"},{moveUci:"d2d4",label:"d4"}],durationSeconds:60}});const wid=(await opened.json() as any).window.id;
    const response=await request(handler,"POST",`/sessions/${sid}/votes`,{cookie:bob.cookie,body:{op:"cast",windowId:wid,choiceUci:"e2e4",voterKey:"forged"}});expect(response.status).toBe(400);expect((await response.json() as any).error.code).toBe("INVALID_REQUEST");
  });

  it("uses the current-holder witness so only one competing free claim wins",async()=>{
    const {handler}=setup();const alice=await register(handler,"alice");const bob=await register(handler,"bob");const carol=await register(handler,"carol");
    await request(handler,"POST","/runs",{cookie:alice.cookie,writerId:"writer-a",body:{id:"race",session:{kind:"position",start:{fen:FEN,side:"white"},feedbackPolicy:"attempt_end",opponentPolicy:{mode:"human_common"}},policyConfig:{seedMode:"fixed",locus:{executedAt:"server",engineIds:[],modelIds:[]}},seed:9}});
    for(const handle of ["bob","carol"])await request(handler,"POST","/runs/race/grants",{cookie:alice.cookie,writerId:"writer-a",body:{op:"grant",handle,role:"participant"}});
    await request(handler,"POST","/sessions",{cookie:alice.cookie,body:{runId:"race",kind:"academy",title:"Race",boardControl:"free_claim"}});
    const bobClaim=await request(handler,"POST","/runs/race/lease",{cookie:bob.cookie,writerId:"writer-b",body:{expectedHolderLearnerId:alice.learner.id}});
    const carolClaim=await request(handler,"POST","/runs/race/lease",{cookie:carol.cookie,writerId:"writer-c",body:{expectedHolderLearnerId:alice.learner.id}});
    expect(bobClaim.status).toBe(200);expect(carolClaim.status).toBe(409);expect((await carolClaim.json() as any).error.code).toBe("LEASE_MOVED");
  });

  it("imports two arena mainlines into root-forked branches without inventing opponent selections",async()=>{
    const {storage,live,handler}=setup();const alice=await register(handler,"alice");
    await request(handler,"POST","/runs",{cookie:alice.cookie,writerId:"writer-a",body:{id:"arena-run",session:{kind:"position",start:{fen:FEN,side:"white"},feedbackPolicy:"attempt_end",opponentPolicy:{mode:"human_common"}},policyConfig:{seedMode:"fixed",locus:{executedAt:"server",engineIds:[],modelIds:[]}},seed:2}});
    const principal={learnerId:alice.learner.id,handle:"alice"};const session=live.create(principal,{runId:"arena-run",kind:"match",title:"Position Arena"});
    const unchanged=JSON.stringify(storage.read("arena-run")!.run.events);
    expect(()=>live.importLeg(session.id,1,principal,"writer-a","1. e4 (1. d4) e5 *")).toThrow("variations");
    expect(JSON.stringify(storage.read("arena-run")!.run.events)).toBe(unchanged);
    expect(()=>live.importLeg(session.id,1,principal,"writer-a",'[SetUp "1"]\n[FEN "8/8/8/8/8/8/K6k/R7 w - - 0 1"]\n\n1. Ra2 *')).toThrow("differs");
    expect(JSON.stringify(storage.read("arena-run")!.run.events)).toBe(unchanged);
    const leg1=live.importLeg(session.id,1,principal,"writer-a","1. e4 e5 2. Nf3 Nc6 *");
    const leg2=live.importLeg(session.id,2,principal,"writer-a","1. d4 d5 2. c4 e6 *");
    const run=storage.read("arena-run")!.run;const root=run.nodes.find((node)=>node.parentId===null)!;
    expect(new Set([leg1.branchId,leg2.branchId]).size).toBe(2);
    expect(run.branches.filter((branch)=>branch.id===leg1.branchId||branch.id===leg2.branchId).every((branch)=>branch.forkNodeId===root.id)).toBe(true);
    expect(run.events.some((event)=>event.type==="opponent.move_selected")).toBe(false);
  });
});
