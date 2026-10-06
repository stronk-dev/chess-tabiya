// D3497 / hint-distance §10: disposable observation of the production composition.
// No service outcome, policy ceiling, collector, cache or source is replaced.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { arch, cpus, platform, release, tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { performance } from "node:perf_hooks";
import { pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";
import { compileAssistanceRequest, hintDecisionStamp, parseHintResponse, HINT_COMPILER_VERSION, CANDIDATE_PACKET_COMPILER_VERSION, PRIMARY_EVIDENCE_MANIFEST, type DrillRun, type HintRung } from "@chess-tabiya/runtime";
import { createApplication, GUIDED_HINT_PROFILE, APPLICATION_PROVIDER_BOUNDS } from "../../apps/server/src/application.js";
import { CandidatePopulationService } from "../../apps/server/src/candidate-population-service.js";
import { ProviderExchangeScheduler } from "../../apps/server/src/provider-exchange.js";
import { HintService } from "../../apps/server/src/hint-service.js";
import type { VoiceProvider } from "../../apps/server/src/guidance.js";
import { checkReceipt, summarize } from "./receipt.mjs";

const root = process.cwd(), planPath = "tools/d3497-hint-latency/plan.json";
const plan = JSON.parse(readFileSync(planPath, "utf8"));
assert.match(process.version, /^v24\./u, "use the configured Node 24 Make target");
const samples = Number(process.argv[2] ?? plan.samplesPerCell);
assert(Number.isSafeInteger(samples) && samples >= 1 && samples <= plan.samplesPerCell);
const output = resolve(process.argv[3] ?? ".cache/verification/hint-latency-http.json");
assert(!existsSync(output), `refusing to overwrite a measurement: ${output}`);
const binary = resolve(process.env.BOT_CALIBRATION_SF_CMD ?? process.env.SF_CMD ?? "");
assert(existsSync(binary), "make must supply the pinned actual Stockfish executable");
const digest = (bytes: Buffer | string) => createHash("sha256").update(bytes).digest("hex");
const binaryBytes = readFileSync(binary);
const providerBinaryDigest = `sha256:${createHash("sha256").update("tabiya/engine.binary.v1\0").update(binaryBytes).digest("hex")}`;
const sourcePaths=[planPath,"tools/d3497-hint-latency/capture.ts","tools/d3497-hint-latency/receipt.mjs","apps/server/src/application.ts","apps/server/src/hint-service.ts","apps/server/src/candidate-population-service.ts","apps/server/src/provider-exchange.ts","apps/web/src/lib/GuidedHintSeat.svelte","packages/runtime/src/hint-distance.ts","packages/runtime/src/candidate-population.ts"];
const sourceDigests=Object.fromEntries(sourcePaths.map(path=>[path,digest(readFileSync(path))]));
const now = () => performance.now();
type Trace = { entered: number; deps: number; packets: any[]; sources: any[]; serverRequests: any[] };
let active: Trace | undefined;
const rows: any[] = [], baselines: any[] = [], startups: any[] = [];
const wide = CandidatePopulationService.prototype.wide;
CandidatePopulationService.prototype.wide = function(fen) {
  const trace = active, start = now(), before = this.stats();
  const result = wide.call(this, fen), end = now(), after = this.stats();
  if (trace) { trace.deps = end; trace.packets.push({ fen, ms: end-start, hitsDelta: after.hits-before.hits, missesDelta: after.misses-before.misses, kind: result.kind, ...(result.kind === "ready" ? { id:result.receipt.packet.id, manifestDigest:result.receipt.packet.manifestDigest, compilerVersion:result.receipt.packet.compilerVersion, legalMoves:result.receipt.packet.legalMoves.length, candidates:result.receipt.packet.candidates.length } : {}) }); }
  return result;
};
const get = ProviderExchangeScheduler.prototype.get;
ProviderExchangeScheduler.prototype.get = async function(...args: Parameters<typeof get>) {
  const trace = active, start = now(), result = await get.apply(this, args), end = now();
  if (trace) { trace.deps = end; trace.sources.push({ operation:args[0].operation, ms:end-start, kind:result.kind === "success" ? result.delivery.kind : result.kind, result }); }
  return result;
} as typeof get;
const request = HintService.prototype.request;
HintService.prototype.request = function(...args: Parameters<typeof request>) {
  const start = now(), result = request.apply(this, args);
  active?.serverRequests.push({ runId:args[0].run.id, rung:args[1], ms:now()-start, initialState:result.state });
  return result;
};

async function withApplication(position: any, variant: string, sample: number, body: (api: any) => Promise<void>) {
  const temporary = mkdtempSync(join(tmpdir(), "tabiya-hint-latency-"));
  const voice: VoiceProvider | undefined = variant === "voice_timeout" ? { render: async (_view,_persona,_sentence,_scope,signal) => new Promise((_resolve,reject) => signal!.addEventListener("abort",()=>reject(new Error("deadline")),{once:true})) }
    : variant === "voice_refused" ? { render: async () => "" } : undefined;
  const start = now();
  const application = await createApplication({ databasePath:join(temporary,"probe.sqlite"), development:true, engineMode:"maia", maiaHost:"127.0.0.1", maiaPort:0,
    stockfishCommand:variant === "source_off" ? join(temporary,"intentionally-unavailable-stockfish") : binary,
    tablebaseSource:null, cookieSecure:false, longitudinalWorkerEntry:pathToFileURL(resolve("apps/server/dist/longitudinal-worker-thread.js")), ...(voice ? {voiceProvider:voice} : {}) });
  try {
    await new Promise<void>((resolve,reject)=>{ application.server.once("error",reject); application.server.listen(0,"127.0.0.1",resolve); });
    const origin = `http://127.0.0.1:${(application.server.address() as AddressInfo).port}`;
    startups.push({ position:position.id,variant,sample,ms:now()-start,providerHealth:application.providerHealth.snapshot() });
    const registered = await fetch(`${origin}/auth/register`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({handle:"latency_probe",password:"disposable-local-latency-password"})});
    assert.equal(registered.status,201,await registered.clone().text());
    const headers = {"content-type":"application/json",cookie:registered.headers.get("set-cookie")!.split(";")[0]!,"x-writer-id":"latency-writer"};
    const post = async (path:string,value:unknown) => { const result=await fetch(`${origin}${path}`,{method:"POST",headers,body:JSON.stringify(value)}); assert(result.ok,await result.clone().text()); return result; };
    const createRun = async (id:string,fen:string=position.fen) => {
      await post("/runs",{id,session:{kind:"position",start:{fen,side:fen.split(" ")[1]==="w"?"white":"black"},feedbackPolicy:"attempt_end",opponentPolicy:{mode:"strong_engine"}},policyConfig:{seedMode:"fixed",locus:{executedAt:"server",engineIds:[],modelIds:[]}},seed:3});
      await post(`/runs/${id}/reveal`,{});
      const graph=await (await fetch(`${origin}/runs/${id}/graph`,{headers})).json() as any;
      const events=await (await fetch(`${origin}/runs/${id}/events?sinceSeq=0`,{headers})).json() as any;
      return {id,feedbackPolicy:"attempt_end",...graph.graph,events:events.events} as DrillRun;
    };
    const ask = async (run:DrillRun,arm:string,rung:HintRung,persona=false,baselineSentence?:string) => {
      const assistance=compileAssistanceRequest({contextHint:"position",preference:{kind:"explicit",preset:"support",overrides:persona?{voice:"persona"}:{},moduleOverrides:{include:[],exclude:[]}}});
      const trace:Trace={entered:now(),deps:0,packets:[],sources:[],serverRequests:[]}; trace.deps=trace.entered; active=trace;
      try {
        let response=await post(`/runs/${run.id}/hints`,{nodeId:run.activeCursor.nodeId,rung,decisionDigest:hintDecisionStamp(run).digest,assistance});
        const firstText=await response.text(), postMs=now()-trace.entered;
        let text=firstText, hint=parseHintResponse(JSON.parse(text).hint), polls=0;
        while(hint.state==="pending" && now()-trace.entered<70_000) {
          await new Promise(resolve=>setTimeout(resolve,100));
          response=await fetch(`${origin}/runs/${run.id}/hints/${hint.requestId}`,{headers}); assert.equal(response.status,200);
          text=await response.text(); hint=parseHintResponse(JSON.parse(text).hint); polls++;
        }
        assert.notEqual(hint.state,"pending","unsettled measurement must not become a ready row");
        const end=now();
        const row:any={position:position.id,arm,rung,sample,state:hint.state,postMs,totalHttpMs:end-trace.entered,mandatoryDependenciesToHttpMs:end-trace.deps,dependencyClock:trace.sources.length+trace.packets.length===0?"request_entry_no_observed_acquisition":"last_observed_mandatory_completion",payloadBytes:Buffer.byteLength(text),firstPayloadBytes:Buffer.byteLength(firstText),polls,response:hint,packets:trace.packets,sources:trace.sources,serverRequests:trace.serverRequests,memory:process.memoryUsage()};
        if(hint.state==="available") { row.deterministicSentence=hint.delivery.rendered.sentence; if(baselineSentence!==undefined)row.baselineSentence=baselineSentence; }
        if(arm==="source_off") {
          const moduleRun=await createRun("source-off-modules",plan.sourceOffModules.fen);
          await post(`/runs/${moduleRun.id}/moves`,{uci:plan.sourceOffModules.move});
          await post(`/runs/${moduleRun.id}/reveal`,{});
          const graph=await (await fetch(`${origin}/runs/${moduleRun.id}/graph`,{headers})).json() as any;
          const moduleAssistance=compileAssistanceRequest({contextHint:"position",preference:{kind:"explicit",preset:plan.sourceOffModules.preset,overrides:{},moduleOverrides:{include:[],exclude:[]}}});
          const modules=await post(`/runs/${moduleRun.id}/modules/query`,{assistance:moduleAssistance,query:{timing:plan.sourceOffModules.timing,subjectNodeId:graph.graph.activeCursor.nodeId,requested:["theory_breadcrumb","structure_nudge"]}});
          row.modules={status:modules.status,control:plan.sourceOffModules,body:await modules.json()};
        }
        (arm === "voice_baseline" ? baselines : rows).push(row); console.log(`${position.id}/${arm}/${rung} sample=${sample} state=${hint.state} post=${postMs.toFixed(1)} total=${row.totalHttpMs.toFixed(1)} deps→HTTP=${row.mandatoryDependenciesToHttpMs.toFixed(1)}`);
        return row;
      } finally { active=undefined; }
    };
    await body({createRun,ask});
  } finally { active=undefined; await application.close(); rmSync(temporary,{recursive:true,force:true}); }
}

try {
  for(let sample=0;sample<samples;sample++) {
    for(const position of plan.positions) await withApplication(position,"normal",sample,async({createRun,ask})=>{
      for(const arm of ["cold","warm"]) { const run=await createRun(`${arm}-run`); for(const rung of plan.rungs)await ask(run,arm,rung); }
    });
    const position=plan.positions.find((row:any)=>row.id==="mate");
    for(const arm of plan.arms.filter((row:string)=>!["cold","warm"].includes(row))) await withApplication(position,arm,sample,async({createRun,ask})=>{
      if(arm==="source_off") { await ask(await createRun("source-off"),arm,"pattern"); return; }
      const baseline=await ask(await createRun("voice-baseline"),"voice_baseline","pattern");
      baseline.pairedArm=arm;
      assert.equal(baseline.state,"available","voice control requires a real selected baseline");
      await ask(await createRun("voice-arm"),arm,"pattern",true,baseline.deterministicSentence);
    });
  }
  assert.deepEqual(Object.fromEntries(sourcePaths.map(path=>[path,digest(readFileSync(path))])),sourceDigests,"measured sources changed during capture; keep this population separate");
  const result={version:1,workItem:plan.workItem,scope:plan.scope,measuredAt:new Date().toISOString(),sampleMode:samples===plan.samplesPerCell?"receipt":"smoke",samples,node:process.version,
    machine:{platform:platform(),release:release(),arch:arch(),cpus:cpus().length,cpuModel:cpus()[0]!.model}, engine:{path:binary,sha256:digest(binaryBytes),providerBinaryDigest,identitySource:"each literal actual acquisition in rows; path/hash alone is not a launched identity"},
    revision:execFileSync("git",["rev-parse","HEAD"],{encoding:"utf8"}).trim(), sourceDigests,
    profile:GUIDED_HINT_PROFILE,providerBounds:APPLICATION_PROVIDER_BOUNDS,manifestDigest:PRIMARY_EVIDENCE_MANIFEST.digest,hintCompiler:HINT_COMPILER_VERSION,packetCompiler:CANDIDATE_PACKET_COMPILER_VERSION,
    browserPaint:"not_measured",d7Discharged:false,nodeOnlyMaxRssKiB:process.resourceUsage().maxRSS,startups,baselines,rows,summary:summarize(rows)};
  mkdirSync(dirname(output),{recursive:true}); writeFileSync(output,JSON.stringify(result,null,2)+"\n",{flag:"wx"});
  // Keep the raw population even when its independent checker refuses acceptance.
  const checked=checkReceipt(result,plan);
  console.log(JSON.stringify({output,checked}));
} finally { CandidatePopulationService.prototype.wide=wide; ProviderExchangeScheduler.prototype.get=get; HintService.prototype.request=request; }
