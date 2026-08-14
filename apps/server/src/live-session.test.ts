import { createHash } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";

import { feedbackDeliveryOpen } from "@chess-tabiya/runtime";
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
  function setup(){const storage=new SQLiteRunStorage(":memory:",{onMigration:()=>{}});stores.push(storage);const identity=new IdentityService(storage,{cookieSecure:false,derive});const queue=new EvidenceJobQueue(executor);const service=new RunService(storage,{evidenceQueue:queue,progressStorage:storage});const live=new LiveSessionService(storage,{now:()=>"2026-08-13T12:00:00.000Z",runService:service});return {storage,queue,live,handler:createRestHandler(service,undefined,undefined,identity,undefined,live)};}
  async function register(handler:ReturnType<typeof createRestHandler>,handle:string){const response=await request(handler,"POST","/auth/register",{body:{handle,password:PASSWORD}});return {cookie:cookie(response),learner:(await response.json() as any).learner as {id:string;handle:string}};}

  it("migrates to the live schema and enforces board control, proposals, and namespaced advisory votes",async()=>{
    const {storage,queue,handler}=setup();expect(STORAGE_VERSION).toBe(17);
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
    expect(()=>live.importLeg(session.id,1,principal,"writer-a",'[SetUp "1"]\n[FEN "8/8/8/8/8/8/K6k/R7 w - - 0 1"]\n\n1. Rb1 *')).toThrow("differs");
    expect(JSON.stringify(storage.read("arena-run")!.run.events)).toBe(unchanged);
    const leg1=live.importLeg(session.id,1,principal,"writer-a","1. e4 e5 2. Nf3 Nc6 *");
    const leg2=live.importLeg(session.id,2,principal,"writer-a","1. d4 d5 2. c4 e6 *");
    const run=storage.read("arena-run")!.run;const root=run.nodes.find((node)=>node.parentId===null)!;
    expect(new Set([leg1.branchId,leg2.branchId]).size).toBe(2);
    expect(run.branches.filter((branch)=>branch.id===leg1.branchId||branch.id===leg2.branchId).every((branch)=>branch.forkNodeId===root.id)).toBe(true);
    expect(run.events.some((event)=>event.type==="opponent.move_selected")).toBe(false);
  });

  it("alternates a native match, gates live rehearsal, and seats a friend through one-use public tokens",async()=>{
    const {storage,live,handler}=setup();const coach=await register(handler,"coach");const white=await register(handler,"white");const black=await register(handler,"black");
    await request(handler,"POST","/runs",{cookie:coach.cookie,writerId:"writer-c",body:{id:"native-match",session:{kind:"position",start:{fen:FEN,side:"white"},feedbackPolicy:"attempt_end",opponentPolicy:{mode:"human_common"}},policyConfig:{seedMode:"fixed",locus:{executedAt:"server",engineIds:[],modelIds:[]}},seed:3}});
    const created=await request(handler,"POST","/sessions",{cookie:coach.cookie,body:{runId:"native-match",kind:"match",title:"Student board",boardControl:"match",matchPlayers:{white:"white",black:"black"}}});expect(created.status).toBe(201);const sid=(await created.json() as any).session.id as string;
    expect((await request(handler,"POST","/runs/native-match/lease",{cookie:coach.cookie,writerId:"coach-live",body:{expectedHolderLearnerId:coach.learner.id}})).status).toBe(409);
    expect((await request(handler,"POST","/runs/native-match/lease",{cookie:white.cookie,writerId:"writer-w",body:{expectedHolderLearnerId:coach.learner.id}})).status).toBe(200);
    const labelled=await request(handler,"POST","/runs/native-match/moves",{cookie:white.cookie,writerId:"writer-w",body:{uci:"e2e4",actor:"user"}});expect(labelled.status).toBe(400);
    expect((await request(handler,"POST","/runs/native-match/moves",{cookie:white.cookie,writerId:"writer-w",body:{uci:"e2e4"}})).status).toBe(200);
    const stolen=await request(handler,"POST","/runs/native-match/lease",{cookie:white.cookie,writerId:"writer-w2",body:{expectedHolderLearnerId:white.learner.id}});expect(stolen.status).toBe(409);expect((await stolen.json() as any).error.code).toBe("BOARD_HELD");
    expect((await request(handler,"POST","/runs/native-match/lease",{cookie:black.cookie,writerId:"writer-b",body:{expectedHolderLearnerId:white.learner.id}})).status).toBe(200);
    expect((await request(handler,"POST","/runs/native-match/moves",{cookie:black.cookie,writerId:"writer-b",body:{uci:"e7e5"}})).status).toBe(200);
    const authors=deriveMoveAuthorship(storage.read("native-match")!.run,storage.sessionJournal(sid,0),coach.learner.id);expect(authors.map((item)=>item.learnerId)).toEqual([white.learner.id,black.learner.id]);
    const beforePause=await request(handler,"POST","/runs/native-match/rewind",{cookie:black.cookie,writerId:"writer-b",body:{nodeId:storage.read("native-match")!.run.nodes[0]!.id}});expect(beforePause.status).toBe(409);expect((await beforePause.json() as any).error.code).toBe("MATCH_LIVE");
    const liveDuplicate=await request(handler,"POST","/runs/native-match/duplicate",{cookie:black.cookie,writerId:"writer-b",body:{id:"escaped-copy",seed:31}});expect(liveDuplicate.status).toBe(409);expect((await liveDuplicate.json() as any).error.code).toBe("MATCH_LIVE");
    const liveFlip=await request(handler,"POST","/runs/native-match/flip",{cookie:black.cookie,body:{nodeId:storage.read("native-match")!.run.activeCursor.nodeId}});expect(liveFlip.status).toBe(409);expect((await liveFlip.json() as any).error.code).toBe("MATCH_LIVE");
    await request(handler,"POST",`/sessions/${sid}/match`,{cookie:white.cookie,body:{op:"propose_pause"}});
    expect((await request(handler,"POST",`/sessions/${sid}/match`,{cookie:white.cookie,body:{op:"accept_pause"}})).status).toBe(400);
    expect((await request(handler,"POST",`/sessions/${sid}/match`,{cookie:black.cookie,body:{op:"accept_pause"}})).status).toBe(200);
    expect((await request(handler,"POST","/runs/native-match/lease",{cookie:white.cookie,writerId:"writer-w",body:{expectedHolderLearnerId:black.learner.id}})).status).toBe(200);
    const locked=await request(handler,"POST","/runs/native-match/moves",{cookie:white.cookie,writerId:"writer-w",body:{uci:"g1f3"}});expect(locked.status).toBe(409);expect((await locked.json() as any).error.code).toBe("MATCH_MAINLINE_LOCKED");
    const root=storage.read("native-match")!.run.nodes[0]!.id;
    expect((await request(handler,"POST","/runs/native-match/rewind",{cookie:white.cookie,writerId:"writer-w",body:{nodeId:root}})).status).toBe(200);
    const alternative=await request(handler,"POST","/runs/native-match/moves",{cookie:white.cookie,writerId:"writer-w",body:{uci:"d2d4"}});expect(alternative.status).toBe(200);expect(storage.read("native-match")!.run.branches).toHaveLength(2);
    expect((await request(handler,"POST","/runs/native-match/reveal",{cookie:white.cookie,writerId:"writer-w",body:{}})).status).toBe(200);
    const branchIds=storage.read("native-match")!.run.branches.map((branch)=>branch.id);expect((await request(handler,"POST","/runs/native-match/compare",{cookie:white.cookie,body:{branchIds}})).status).toBe(200);
    expect((await request(handler,"POST","/runs/native-match/duplicate",{cookie:white.cookie,writerId:"writer-w",body:{id:"paused-copy",seed:32}})).status).toBe(201);
    expect((await request(handler,"POST","/runs/native-match/flip",{cookie:white.cookie,body:{nodeId:root}})).status).toBe(201);
    expect(()=>live.importLeg(sid,1,{learnerId:coach.learner.id,handle:"coach"},"writer-w","1. e4 *")).toThrow("imported Arena");
    expect((await request(handler,"POST",`/sessions/${sid}/match`,{cookie:white.cookie,writerId:"writer-w",body:{op:"resume"}})).status).toBe(200);
    expect(storage.read("native-match")!.run.activeCursor.branchId).toBe(storage.read("native-match")!.run.branches[0]!.id);
    expect((await request(handler,"POST","/runs/native-match/moves",{cookie:white.cookie,writerId:"writer-w",body:{uci:"g1f3"}})).status).toBe(200);expect(feedbackDeliveryOpen(storage.read("native-match")!.run)).toBe(false);
    expect(storage.progress(coach.learner.id).find((item)=>item.runId==="native-match"&&item.branchId===storage.read("native-match")!.run.branches[0]!.id)).toMatchObject({countable:false});
    expect(storage.progress(white.learner.id).filter((item)=>item.runId==="native-match")).toEqual(expect.arrayContaining([expect.objectContaining({countable:true})]));
    const summaries=await (await request(handler,"GET","/sessions",{cookie:coach.cookie})).json() as any;expect(summaries.sessions[0].board).toMatchObject({sideToMove:"black",plyCount:3,pausedAt:null,players:{white:{handle:"white"},black:{handle:"black"}}});

    await request(handler,"POST","/runs",{cookie:coach.cookie,writerId:"writer-invite",body:{id:"invite-match",session:{kind:"position",start:{fen:FEN,side:"white"},feedbackPolicy:"attempt_end",opponentPolicy:{mode:"human_common"}},policyConfig:{seedMode:"fixed",locus:{executedAt:"server",engineIds:[],modelIds:[]}},seed:4}});
    const inviteSession=await request(handler,"POST","/sessions",{cookie:coach.cookie,body:{runId:"invite-match",kind:"match",title:"Friend board",boardControl:"match",matchPlayers:{white:"coach"}}});const inviteSid=(await inviteSession.json() as any).session.id as string;
    const bad=await request(handler,"POST",`/sessions/${inviteSid}/links`,{cookie:coach.cookie,body:{matchSlot:"black",invitedRole:"spectator"}});expect(bad.status).toBe(400);
    const minted=await request(handler,"POST",`/sessions/${inviteSid}/links`,{cookie:coach.cookie,body:{matchSlot:"black",invitedRole:"participant",invitedHandle:"black"}});expect(minted.status).toBe(201);const token=(await minted.json() as any).token as string;
    const page=await request(handler,"GET",`/shared/${token}`);expect(page.status).toBe(200);const html=await page.text();expect(html).toContain("Friend board");expect(html).not.toContain(FEN);
    const wrongRedeemer=await request(handler,"POST",`/api/shared/${token}/join`,{cookie:white.cookie});expect(wrongRedeemer.status).toBe(404);const notFoundBody=await wrongRedeemer.text();
    expect((await request(handler,"POST",`/api/shared/${token}/join`,{cookie:black.cookie})).status).toBe(200);
    const exhausted=await request(handler,"POST",`/api/shared/${token}/join`,{cookie:black.cookie});expect(exhausted.status).toBe(404);expect(await exhausted.text()).toBe(notFoundBody);
    expect(storage.matchState(inviteSid)?.blackLearnerId).toBe(black.learner.id);
    const branchId=storage.read("invite-match")!.run.branches[0]!.id;storage.createPublicToken({id:"story-scope",tokenHash:createHash("sha256").update("story-scope-token").digest("hex"),scope:"story_read",runId:"invite-match",branchId,createdBy:coach.learner.id,createdAt:"2026-08-13T12:00:00.000Z",revokedAt:null});
    const scopeMismatch=await request(handler,"POST","/api/shared/story-scope-token/join",{cookie:black.cookie});expect(scopeMismatch.status).toBe(404);expect(await scopeMismatch.text()).toBe(notFoundBody);
    const unknown=await request(handler,"POST","/api/shared/unknown-token/join",{cookie:black.cookie});expect(unknown.status).toBe(404);expect(await unknown.text()).toBe(notFoundBody);
  });
});
