// Actual SQLite/source owners execute in Node; only their ordinary JSON transport crosses into DOM tests.
import type { ComponentProps } from "svelte";
import type { DrillRun, FinalizedAssistanceV1, RequestedAssistanceV1 } from "@chess-tabiya/runtime";
import type { ShapeEntryDefinition } from "@chess-tabiya/schema/shape-entry";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { Worker } from "node:worker_threads";
import { build } from "esbuild";
import type InspectorSourceBrowser from "./InspectorSourceBrowser.svelte";
import type { InspectorAssistanceRequest } from "./historical-inspector.js";
import { DrillApi, type GuidedHintClient } from "./api.js";
export type Props = ComponentProps<typeof InspectorSourceBrowser>;
export type Query = Props["onQuery"];
export type Options = { run?: DrillRun; id?: string; reports?: number; corpusTotal?: number; mate?: boolean; liveHealth?: boolean; preserveRun?: boolean; historical?: boolean; side?: "white" | "black"; authenticatedRest?: boolean; recommendations?: boolean; hints?: boolean; holdHintSource?: boolean; sharedViewer?: boolean; clockPgn?: string;
  shapes?: readonly ShapeEntryDefinition[];
  repertoires?: boolean;
  offlineGrade?: { black: boolean; before: string; after: string; bound: { kind: "depth"; requestedDepth: number } | { kind: "movetime"; requestedMs: number } } };
// Real server modules run in a normal Node worker, not Vite's browser asset transformer.
// Build is memory-only. Original per-module import.meta.url values preserve the genuine
// filesystem loaders; no source, registry, grant, parser or evidence issuer is replaced.
const nodeSource = String.raw`
import { parentPort } from "node:worker_threads";
import { attachEvidence, branchPath, commitMove, fork, rewind, compileAssistanceRequest, compileAuthoritativeAssistance, finalizeAssistanceEffects, MODULE_SOURCE_AUTHORITY, createRun, moduleDecisionStamp, revealFeedback, serverAvailabilityFromProviders, serverAvailabilityFromProviderHealth } from "./packages/runtime/src/index.ts";
import { recordedComparisonFixture } from "./packages/runtime/src/testing/recorded-comparison-fixture.ts";
import { RunService } from "./apps/server/src/service.ts";
import { parseModuleQueryRequest } from "./packages/runtime/src/module-query.ts";
import { SQLiteRunStorage } from "./apps/server/src/storage.ts";
import { composeProviderTraversalApplication } from "./apps/server/src/provider-traversal.ts";
import { ExchangeCorpusSource } from "./apps/server/src/provider-corpus.ts";
import { ManualClock } from "./apps/server/src/provider-exchange.test-support.ts";
import { ProviderRegistry } from "./apps/server/src/provider-health.ts";
import { IdentityService } from "./apps/server/src/identity.ts";
import { createRestHandler } from "./apps/server/src/rest.ts";
import { createHash } from "node:crypto";
import { HintService } from "./apps/server/src/hint-service.ts";
import { CandidatePopulationService } from "./apps/server/src/candidate-population-service.ts";
import { MockProviderEngineClient } from "./apps/server/src/mock-provider-engine.ts";
import { offlineGradeFixture } from "./apps/server/src/offline-grade.test-support.ts";
import { ShapeRegistry } from "./apps/server/src/shape-registry.ts";
import { PackRegistry } from "./apps/server/src/pack-registry.ts";
import { RepertoireService } from "./apps/server/src/repertoire.ts";
import { OpponentSelector } from "./apps/server/src/opponent-selector.ts";
import { invokeEvidenceValueRoute } from "./packages/runtime/src/internal/evidence-value-routes.ts";
import { PRIMARY_EVIDENCE_MANIFEST, evidenceForConsumer, presentEvidenceItems, serializePresentedEvidence } from "./packages/runtime/src/index.ts";
const at="2026-11-03T00:00:00.000Z", owner={learnerId:"browser-owner",handle:"browser-owner"};
const fixtures=new Map(), controllers=new Map();
let sequence=0;
async function create(options) {
  const base=recordedComparisonFixture(false,options.id??"source-browser-run");
  const offline=options.offlineGrade?await offlineGradeFixture(options.offlineGrade):undefined;
  const packRegistry=offline?.registry??(options.recommendations?await PackRegistry.fromDocuments([]):undefined);
  let initial=offline?.run??options.run??base.run;
  offline?.storage.close(); // The browser fixture issues its own actual storage/principal source.
  if(options.mate) {
    initial=createRun({id:options.id??"source-browser-mate",session:{kind:"position",start:{fen:"7k/8/5K2/6Q1/8/8/8/8 w - - 0 1",side:"white"},feedbackPolicy:"attempt_end",opponentPolicy:{mode:"human_common"}},
      sessionDigest:"sha256:"+"a".repeat(64),policyConfig:{seedMode:"fixed",locus:{executedAt:"server",engineIds:[],modelIds:[]}},seed:1,createdAt:at});
    initial=commitMove(initial,"g5g7",{at}).run;
  }
  for(let i=0;i<(options.reports??0);i++) initial=attachEvidence(initial,initial.activeCursor.nodeId,["synthetic:identical-report"],{kind:"eval",source:"engine_validated",values:{centipawns:20}},at).run;
  let run=options.preserveRun===true?initial:revealFeedback(initial,at).run;
  const storage=new SQLiteRunStorage(":memory:",{onMigration:()=>{}});
  const providerCalls=[],acquisitions=[],clock=new ManualClock();
  const health=options.liveHealth?new ProviderRegistry({configured:[{instanceId:"explorer-primary",implementation:"lichess_http",endpoint:"https://explorer.lichess.ovh/lichess",identity:"mechanical-ui-http"}],monotonicNowMs:clock.now,wallNow:clock.wall}):undefined;
  const transport={fail:false};
  const shapeRegistry=options.shapes===undefined?undefined:new ShapeRegistry();
  for(const document of options.shapes??[])await shapeRegistry.add(document,"community","mechanical-author");
  const providers=composeProviderTraversalApplication({engines:options.hints?new MockProviderEngineClient():null,tablebaseFetch:null,explorerToken:"mechanical-token",
    ...(health===undefined?{}:{explorerHealth:health}),
    explorerFetch:options.corpusTotal===undefined?null:async url=>{
      providerCalls.push(String(url));
      if(transport.fail)return new Response("mechanical authentication failure",{status:401});
      return new Response(JSON.stringify({white:options.corpusTotal,draws:0,black:0,moves:[],opening:null,history:[{month:"2026-10",white:options.corpusTotal,draws:0,black:0}]}),{headers:{etag:'"browser-fixture"'}});
    },monotonicNowMs:clock.now,wallNow:clock.wall});
  const repertoireEngine=options.repertoires?new MockProviderEngineClient():undefined;
  const repertoireSelector=repertoireEngine===undefined?undefined:new OpponentSelector({health:id=>repertoireEngine.health(id),execute:async()=>{throw Error("No opponent engine request is permitted in this repertoire source control");}},{maiaEngineId:"maia-5m",strongEngineId:"stockfish-analysis"});
  const service=new RunService(storage,{...(repertoireSelector===undefined?{}:{opponentSelector:repertoireSelector}),...(options.recommendations?{progressStorage:storage}:{}),...(shapeRegistry===undefined?{}:{shapeRegistry}),...(packRegistry===undefined?{}:{packRegistry}),...(options.corpusTotal===undefined?{}:{corpusSource:new ExchangeCorpusSource({scheduler:providers.scheduler,monotonicNowMs:clock.now})})});
  const repertoires=options.repertoires?new RepertoireService(storage,service,new ExchangeCorpusSource({scheduler:providers.scheduler,monotonicNowMs:clock.now})):undefined;
  const hintGate={blocked:options.holdHintSource===true,waiters:new Set()},hintCounts={searches:0};
  const hints=options.hints?new HintService({scheduler:{get:async(request,scope,signal)=>{
    hintCounts.searches++;
    const result=await providers.scheduler.get(request,scope,signal);
    if(hintGate.blocked)await new Promise((resolve,reject)=>{
      const resume=()=>{hintGate.waiters.delete(resume);signal?.removeEventListener("abort",abort);resolve();};
      const abort=()=>{hintGate.waiters.delete(resume);reject(signal.reason);};
      hintGate.waiters.add(resume);signal?.addEventListener("abort",abort,{once:true});if(signal?.aborted)abort();
    });
    return result;
  }},requestedEngine:async()=>({id:"stockfish-analysis",version:"mock-1"}),populations:new CandidatePopulationService({capacity:8}),depth:12,timeoutMs:5000,maxOperations:8}):undefined;
  let principal=owner,handler,cookie;
  if(options.authenticatedRest||options.hints||options.sharedViewer) {
    const identity=new IdentityService(storage,{cookieSecure:false,derive:async(secret,salt)=>createHash("sha256").update(salt).update(secret).digest()});
    const args:Parameters<typeof createRestHandler>=[service,undefined,undefined,identity];
    args[11]=repertoires;
    args[20]=hints; // HintService is the existing REST composition's optional parameter.
    handler=createRestHandler(...args);
    const registration=await handler(new Request("http://tabiya.test/auth/register",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({handle:"motif-browser-owner",password:"motif-browser-password"})}));
    if(registration.status!==201)throw Error("Actual registration failed: "+registration.status);
    const learner=(await registration.json()).learner;principal={learnerId:learner.id,handle:learner.handle};
    cookie=registration.headers.get("set-cookie").split(";",1)[0];
  } else storage.createLearner({id:owner.learnerId,handle:owner.handle,passwordHash:"!",createdAt:at});
  storage.create(run,{learnerId:principal.learnerId,writerId:"browser-writer"});
  if(options.historical) {
    const imported=await service.importGame({id:(options.id??"historical-browser")+"-imported",side:options.side??"white",opponentPolicy:{mode:"human_common"},
      policyConfig:{seedMode:"fixed",locus:{executedAt:"server",engineIds:[],modelIds:[]}},seed:3,
      source:{kind:"pgn",pgn:'[Result "1-0"]\n\n1. e4 e5 2. Nf3 Nc6 1-0'},createdAt:at},{writerId:"browser-writer",learnerId:principal.learnerId});
    const source=revealFeedback(imported.run,at).run, main=source.branches[0].id, path=branchPath(source,main);
    run=commitMove(fork(rewind(source,path[2].id,at,undefined,main).run,path[2].id,{at}).run,"f1c4",{at}).run;
    storage.save(run,{writerId:"browser-writer",learnerId:principal.learnerId});
  }
  if(options.clockPgn!==undefined) {
    const imported=await service.importGame({id:(options.id??"clock-browser")+"-imported",side:options.side??"black",opponentPolicy:{mode:"human_common"},
      policyConfig:{seedMode:"fixed",locus:{executedAt:"server",engineIds:[],modelIds:[]}},seed:3,
      source:{kind:"pgn",pgn:options.clockPgn},createdAt:at},{writerId:"browser-writer",learnerId:principal.learnerId});
    run=imported.run;
    if(options.sharedViewer)run=service.reveal(run.id,principal,"browser-writer",at).run;
  }
  const grantOwner=principal;
  if(options.sharedViewer) {
    const registration=await handler(new Request("http://tabiya.test/auth/register",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({handle:"recorded-browser-viewer",password:"recorded-browser-password"})}));
    if(registration.status!==201)throw Error("Actual viewer registration failed: "+registration.status);
    const learner=(await registration.json()).learner;principal={learnerId:learner.id,handle:learner.handle};
    cookie=registration.headers.get("set-cookie").split(";",1)[0];
    service.updateGrant(run.id,grantOwner,"browser-writer",{op:"grant",handle:principal.handle,role:"host"},at);
  }
  const acquire=service.acquireInspectorQuerySource.bind(service);
  service.acquireInspectorQuerySource=(...args)=>{acquisitions.push(args[1]);return acquire(...args);};
  const availability=health===undefined?serverAvailabilityFromProviders({opponent:"none",judge:"none",llm:"none",corpus:options.corpusTotal===undefined?"none":"external",tts:"none",tablebase:"none"}):serverAvailabilityFromProviderHealth(health.snapshot());
  const key=++sequence; fixtures.set(key,{run,storage,service,shapeRegistry,repertoires,hints,hintGate,hintCounts,httpLog:[],owner:principal,grantOwner,handler,cookie,httpStatuses:[],availability,providerCalls,acquisitions,health,transport,preserveRun:options.preserveRun===true});
  return {key,run};
}
async function props(f,input={}) {
  const nodeId=input.nodeId??f.run.activeCursor.nodeId;
  const assistance=input.assistance??compileAssistanceRequest({contextHint:f.preserveRun?(f.run.sessionKind==="imported"?"imported":f.run.sessionKind==="pack"?"pack":"position"):"position",preference:{kind:"explicit",preset:"analysis",overrides:{},moduleOverrides:{include:[],exclude:[]}}});
  const request={protocol:"inspector.query_page@1",assistance,query:{branchId:f.run.activeCursor.branchId,nodeId,decisionDigest:moduleDecisionStamp(f.run).digest,view:{kind:"inventory",start:0}}};
  const metadata=await f.service.queryInspectorSources(f.run.id,f.owner,request,f.availability,new AbortController().signal);
  if(metadata.kind!=="page")throw Error("Actual inventory refused: "+metadata.code);
  return {runId:f.run.id,branchId:f.run.activeCursor.branchId,nodeId,decisionDigest:moduleDecisionStamp(f.run).digest,fen:f.run.nodes.find(n=>n.id===nodeId).fen,
    assistance,requestedDigest:metadata.requestedConfigDigest,finalDigest:metadata.effectiveConfigDigest,
    peers:f.run.branches.map(branch=>({branchId:branch.id,nodeId:f.run.nodes.findLast(n=>n.branchId===branch.id).id,label:branch.label}))};
}
parentPort.on("message",async message=>{
  const {id,kind,key,input}=message;
  try {
    let value;
    if(kind==="create")value=await create(input);
    else if(kind==="abort"){controllers.get(input)?.abort();return;}
    else if(kind==="dispose"){for(const f of fixtures.values()){await f.hints?.close();f.health?.shutdown();f.storage.close();}fixtures.clear();value=null;}
    else {
      const f=fixtures.get(key);if(!f)throw Error("Unknown actual fixture");
      if(kind==="props")value=await props(f,input);
      else if(kind==="setRun"){f.storage.save(input,{writerId:"browser-writer",learnerId:f.grantOwner.learnerId});f.run=input;value=null;}
      else if(kind==="review")value=await f.service.review(f.run.id,f.owner,f.run.activeCursor.branchId);
      else if(kind==="savedRun")value=f.storage.read(f.run.id).run;
      else if(kind==="failExplorer"){
        if(f.health===undefined)throw Error("Actual provider-health fixture required");
        f.transport.fail=true;
        const request=input.protocol==="inspector.query_page@1"?input:{protocol:"inspector.query_page@1",assistance:input,query:{branchId:f.run.activeCursor.branchId,nodeId:f.run.activeCursor.nodeId,decisionDigest:moduleDecisionStamp(f.run).digest,
          view:{kind:"source",projection:"derived.explorer.inspector_population@1",context:{kind:"position"},start:0,collectionKey:null}}};
        const actual=await f.service.queryInspectorSources(f.run.id,f.owner,request,f.availability,new AbortController().signal);
        f.availability=serverAvailabilityFromProviderHealth(f.health.snapshot());
        value={actual,health:f.health.snapshot(),availability:f.availability};
      }
      else if(kind==="authority")value=finalizeAssistanceEffects(compileAuthoritativeAssistance(input,{...f.service.assistanceAuthority(f.run.id,f.owner),availability:f.availability}),{authority:MODULE_SOURCE_AUTHORITY,availability:f.availability});
      else if(kind==="providerHealth")value=f.health?.snapshot()??null;
      else if(kind==="viewerAccess"){
        if(input!==undefined){
          if(f.owner.learnerId===f.grantOwner.learnerId)throw Error("A real shared viewer is required");
          f.service.updateGrant(f.run.id,f.grantOwner,"browser-writer",input?{op:"grant",handle:f.owner.handle,role:"host"}:{op:"revoke",handle:f.owner.handle},at);
        }
        try{value={kind:"allowed",authority:f.service.assistanceAuthority(f.run.id,f.owner)};}
        catch(error){value={kind:"refused",code:error.code};}
      }
      else if(kind==="replaceRegisteredShape"){
        f.shapeRegistry.required(input.id);
        await f.shapeRegistry.add(input,"community","mechanical-author");value=null;
      }
      else if(kind==="waitForRepertoireScan"){await f.repertoires.waitForScan(input);value=null;}
      else if(kind==="seedRepertoireFirstMove"){
        // Fixture setup uses the genuine runtime/store, not a claim of HTTP move/engine coverage.
        const stored=f.storage.read(input.runId);if(stored===undefined)throw Error("Actual gap run required");
        const next=commitMove(stored.run,input.uci,{at}).run;
        f.storage.save(next,{writerId:input.writerId,learnerId:f.owner.learnerId});value=null;
      }
      else if(kind==="shapeComponentReceipt"){
        // Component-only actual source/adapter control, not module selection or API authority.
        if(input!=="module.structure_nudge"&&input!=="module.theory_breadcrumb")throw Error("Unknown point consumer");
        const node=f.run.nodes.find(node=>node.id===f.run.activeCursor.nodeId);
        const builder=await f.shapeRegistry.beginCurrentShapeScan([{id:node.id,fen:node.fen}],new AbortController().signal);
        for(;;){const step=f.shapeRegistry.advanceCurrentShapeScan(builder);if(step.kind==="complete"){
          const evidence=invokeEvidenceValueRoute("theory.shapes.firing@3",{scan:step.scan});
          value=serializePresentedEvidence(presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST,{id:input,version:2},evidence)));break;
        }await new Promise(resolve=>setTimeout(resolve,0));}
      }
      else if(kind==="modules"){
        const assistance=finalizeAssistanceEffects(compileAuthoritativeAssistance(input.assistance,{...f.service.assistanceAuthority(f.run.id,f.owner),availability:f.availability}),{authority:MODULE_SOURCE_AUTHORITY,availability:f.availability});
        value={page:await f.service.queryModules(f.run.id,f.owner,assistance,parseModuleQueryRequest(input.query))};
      }
      else if(kind==="reviewAuthority"){
        const controller=new AbortController();controllers.set(id,controller);
        try{value=f.service.confirmRecordedAnalyzeAssistance(f.run.id,f.owner,input,f.availability,controller.signal);}
        finally{controllers.delete(id);}
      }
      else if(kind==="inspectorAuthority"){
        const controller=new AbortController();controllers.set(id,controller);
        try{value=f.service.confirmRecordedInspectorAssistance(f.run.id,f.owner,input,f.availability,controller.signal);}
        finally{controllers.delete(id);}
      }
      else if(kind==="stats")value={acquisitions:f.acquisitions,providerCalls:f.providerCalls};
      else if(kind==="httpStatuses")value=f.httpStatuses;
      else if(kind==="httpCalls")value=f.httpLog;
      else if(kind==="hintStats")value={searches:f.hintCounts.searches,operations:f.hints?.operationCount??0,http:f.httpLog};
      else if(kind==="releaseHintSource"){f.hintGate.blocked=false;for(const resume of f.hintGate.waiters)resume();value=null;}
      else if(kind==="http"){
        if(!f.handler)throw Error("Actual authenticated HTTP fixture required");
        const controller=new AbortController();controllers.set(id,controller);
        try{
          const response=await f.handler(new Request("http://tabiya.test"+input.path,{method:input.method,headers:{...input.headers,cookie:f.cookie},...(input.body===undefined?{}:{body:input.body}),signal:controller.signal}));
          const nextCookie=response.headers.get("set-cookie");
          if(nextCookie!==null)f.cookie=nextCookie.split(";",1)[0];
          f.httpLog.push({method:input.method,path:input.path,status:response.status});
          value={status:response.status,body:await response.json()};
        }finally{controllers.delete(id);}
      }
      else if(kind==="query"||kind==="anonymousQuery"){
        const controller=new AbortController();controllers.set(id,controller);
        try{
          if(f.handler) {
            const response=await f.handler(new Request("http://tabiya.test/runs/"+f.run.id+"/inspector/query",{method:"POST",headers:{"content-type":"application/json",...(kind==="query"?{cookie:f.cookie}:{})},body:JSON.stringify(input),signal:controller.signal}));
            f.httpStatuses.push(response.status);value=await response.json();
          } else value=await f.service.queryInspectorSources(f.run.id,f.owner,input,f.availability,controller.signal);
        }
        finally{controllers.delete(id);}
      }else throw Error("Unknown fixture command");
    }
    parentPort.postMessage({id,value:JSON.parse(JSON.stringify(value))});
  }catch(error){parentPort.postMessage({id,error:String(error.stack??error)});}
});
`;
const bundled = await build({ stdin: { contents: nodeSource, resolveDir: process.cwd(), sourcefile: "inspector-browser-node-fixture.ts", loader: "ts" },
  bundle: true, platform: "node", format: "cjs", write: false, logLevel: "silent",
  plugins: [{ name: "original-node-module-paths", setup(builder) {
    builder.onLoad({ filter: /\.ts$/ }, async ({ path }) => ({
      contents: (await readFile(path, "utf8")).replace(/\bimport\.meta\.url\b/gu, JSON.stringify(pathToFileURL(path).href)), loader: "ts",
    }));
  } }],
});
const backend = new Worker(bundled.outputFiles[0]!.text, { eval: true });
let requestId=0;
const replies = new Map<number,{resolve:(value:unknown)=>void;reject:(error:Error)=>void}>();
backend.on("message", (message:{id:number;value?:unknown;error?:string}) => {
  const pending=replies.get(message.id);if(pending===undefined)return;replies.delete(message.id);
  if(message.error!==undefined)pending.reject(new Error(message.error));else pending.resolve(message.value);
});
backend.on("error", error=>{for(const pending of replies.values())pending.reject(error);replies.clear();});
function rpc<T>(kind:string,key?:number,input?:unknown,signal?:AbortSignal):Promise<T> {
  const id=++requestId;
  return new Promise<T>((resolve,reject)=>{
    replies.set(id,{resolve:value=>resolve(value as T),reject});
    const abort=()=>backend.postMessage({kind:"abort",input:id});
    signal?.addEventListener("abort",abort,{once:true});
    backend.postMessage({id,kind,key,input});
  });
}

export const disposeInspectorBrowserFixtures=()=>rpc("dispose");
export const terminateInspectorBrowserFixture=()=>backend.terminate();
export async function historicalInspectorFixture(options: Options = {}) {
  const { key, run } = await rpc<{ key: number; run: DrillRun }>("create", undefined, options);
  // Use the ordinary API parser over actual authenticated REST replies, not manufactured hints.
  const api=options.hints||options.authenticatedRest||options.sharedViewer?new DrillApi("http://tabiya.test",async(input,init)=>{
    const url=new URL(String(input));
    const response=await rpc<{status:number;body:unknown}>("http",key,{path:url.pathname+url.search,method:init?.method??"GET",headers:Object.fromEntries(new Headers(init?.headers).entries()),body:init?.body},init?.signal??undefined);
    return new Response(JSON.stringify(response.body),{status:response.status,headers:{"content-type":"application/json"}});
  }):undefined;
  const hints:GuidedHintClient|undefined=api===undefined||!options.hints?undefined:{request:body=>api.hint(run.id,body,"browser-writer"),poll:id=>api.hintPoll(run.id,id),cancel:id=>api.hintCancel(run.id,id)};
  return { run, api, shapeFirings: api === undefined ? undefined : (body: import("../../../../packages/runtime/src/guided-shape-query.js").GuidedShapeQuery, expected: import("./guided-shape-response.js").GuidedShapeExpectation, signal: AbortSignal) => api.shapeFirings(run.id, body, expected, signal),
    postShapes: (body: unknown) => rpc<{status:number;body:unknown}>("http", key, {path:`/runs/${run.id}/shape-firings/query`,method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)}),
    send: (body: Parameters<Query>[0], signal: AbortSignal) => rpc("query", key, body, signal),
    hints,hintStats:()=>rpc<{searches:number;operations:number;http:readonly {method:string;path:string;status:number}[]}>("hintStats",key),releaseHintSource:()=>rpc("releaseHintSource",key),
    postHint:(body:unknown)=>rpc<{status:number;body:unknown}>("http",key,{path:`/runs/${run.id}/hints`,method:"POST",headers:{"content-type":"application/json","x-writer-id":"browser-writer"},body:JSON.stringify(body)}),
    savedRun: () => rpc<DrillRun>("savedRun", key),
    confirm: (body: InspectorAssistanceRequest, signal: AbortSignal) => api===undefined?rpc("inspectorAuthority", key, body, signal):api.inspectorAssistance(run.id,body,signal),
    viewerAccess:(allowed?:boolean)=>rpc<{kind:"allowed";authority:{access:{role:string}}}|{kind:"refused";code:string}>("viewerAccess",key,allowed),
    providerHealth:()=>rpc<unknown>("providerHealth",key),
    failExplorer:(request:RequestedAssistanceV1|Parameters<Query>[0])=>rpc<{actual:unknown;health:unknown;availability:{explorer:{state:string;reason:string}}}>("failExplorer",key,request),
    httpStatuses:()=>rpc<readonly number[]>("httpStatuses",key),
    httpCalls:()=>rpc<readonly {method:string;path:string;status:number}[]>("httpCalls",key),
    authority: (request: RequestedAssistanceV1) => rpc<FinalizedAssistanceV1>("authority", key, request),
    // Match the ordinary API's JSON boundary: Svelte request proxies cannot cross structured clone.
    modules: (body: { readonly assistance: RequestedAssistanceV1; readonly query: unknown }) => rpc<unknown>("modules", key, JSON.parse(JSON.stringify(body))),
    replaceRegisteredShape: (document: ShapeEntryDefinition) => rpc("replaceRegisteredShape",key,document),
    waitForRepertoireScan: (id: string) => rpc("waitForRepertoireScan",key,id),
    seedRepertoireFirstMove: (runId: string, writerId: string, uci: string) => rpc("seedRepertoireFirstMove",key,{runId,writerId,uci}),
    shapeComponentReceipt: (consumer: "module.structure_nudge" | "module.theory_breadcrumb") => rpc<unknown>("shapeComponentReceipt",key,consumer),
    modulesRest: async (body: { readonly assistance: RequestedAssistanceV1; readonly query: unknown }) => {
      if (!options.authenticatedRest) throw Error("The real authenticated REST fixture is required");
      const response = await rpc<{status:number;body:unknown}>("http",key,{path:`/runs/${run.id}/modules/query`,method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});
      if (response.status !== 200) throw Error(`Actual module REST refused: ${response.status} ${JSON.stringify(response.body)}`);
      return response.body;
    },
    stats: () => rpc<{ acquisitions: readonly unknown[]; providerCalls: readonly string[] }>("stats", key),
    publish: (next: DrillRun) => rpc("setRun", key, next) };
}
export async function inspectorBrowserFixture(options:Options={}) {
  const {key,run}=await rpc<{key:number;run:DrillRun}>("create",undefined,options);
  const send:Query=(body,signal)=>rpc("query",key,body,signal);
  const propsFor=async(input:{nodeId?:string;assistance?:RequestedAssistanceV1}={}):Promise<Props>=>({
    ...await rpc<Omit<Props,"onQuery">>("props",key,input),onQuery:send,
  });
  const stats=()=>rpc<{acquisitions:readonly Record<string,unknown>[];providerCalls:readonly string[]}>("stats",key);
  return {run,send,propsFor,props:await propsFor(),stats, publish:(next:DrillRun)=>rpc("setRun",key,next), authority:(request:RequestedAssistanceV1)=>rpc<FinalizedAssistanceV1>("authority",key,request),
    sendAnonymous:(body:Parameters<Query>[0])=>rpc<unknown>("anonymousQuery",key,body),httpStatuses:()=>rpc<readonly number[]>("httpStatuses",key),
    review:()=>rpc<unknown>("review",key), savedRun:()=>rpc<DrillRun>("savedRun",key),
    reviewConfirm:(input:unknown,signal?:AbortSignal)=>rpc<unknown>("reviewAuthority",key,input,signal),
    failExplorer:(request:RequestedAssistanceV1)=>rpc<{actual:unknown;health:unknown;availability:{explorer:{state:string;reason:string}}}>("failExplorer",key,request)};
}
