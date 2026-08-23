// DISPOSABLE research harness — D1162. No production policy, engine, or network calls.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { candidateFeatureVector, type CandidateFeatureRow } from "../../apps/server/src/candidate-evidence.js";

const INPUT = process.env.TABIYA_R11_INPUT_DIR;
const WRITE = process.env.TABIYA_D1162_WRITE === "1";
const RESULT = new URL("../../planning/platform-alignment/bot-policy/d1162-evidence-head-results.json", import.meta.url);
const REPORT = new URL("../../planning/platform-alignment/bot-policy/d1162-evidence-head-results.md", import.meta.url);
const BANDS = [1400, 1600, 1800] as const;
const LAMBDAS = [0.01, 0.1, 1, 10] as const;
const EXPECTED_DIGESTS = Object.freeze({
  maia: "sha256:61b4e12a4fa6e728ad5cc7bc44276c9cc676ae4be1d29f7c8e4b66d9fc466400",
  sf: "sha256:890c60150f28c7f930a07553b2df4d80cf4fd903ebca33837e7aefe42219844e",
  probes: "sha256:fe081f45d95b6115ee649831882e45561ff7b0d960b6759242ac335654e9cfed",
  san: "sha256:4e88eae51cc0df0a5cb4882a2a33679de73c41e3c8f26dfab4def80df3103473",
});

type Band = (typeof BANDS)[number];
type Sparse = ReadonlyMap<string, number>;
interface SfRow { readonly fen:string; readonly entries:readonly {readonly uci:string;readonly cp:number|null;readonly mate:number|null}[] }
interface Probe { readonly fen:string; readonly bands:Readonly<Record<string,{readonly total:number;readonly moves:readonly {readonly san:string;readonly n:number}[]}>> }
interface Candidate { readonly moveUci:string; readonly scoreCp:number; readonly raw:Sparse }
interface Position { readonly fen:string; readonly fold:number; readonly candidates:readonly Candidate[]; readonly human:ReadonlyMap<Band,ReadonlyMap<string,number>> }
interface Prepared { readonly rows:readonly {readonly position:Position;readonly candidates:readonly Sparse[]}[]; readonly names:readonly string[] }

function lines<T>(text:string):readonly T[]{return text.trim().split("\n").filter(Boolean).map((line)=>JSON.parse(line) as T);}
function digest(text:string):string{return `sha256:${createHash("sha256").update(text).digest("hex")}`;}
function rounded(value:number):number{return Number(value.toFixed(6));}
function add(map:Map<string,number>,key:string,value:number):void{map.set(key,(map.get(key)??0)+value);}
function identityValue(key:string,value:string):boolean{
  return /id$/iu.test(key)||/fen$/iu.test(key)||/(?:move)?uci$/iu.test(key)||/san$/iu.test(key)||/square$/iu.test(key)||/^(?:from|to|orig|dest)$/iu.test(key)||value.split("/").length===8||/^[a-h][1-8]$/u.test(value)||/^[a-h][1-8][a-h][1-8][qrbn]?$/u.test(value);
}
function flatten(value:unknown,path:string,map:Map<string,number>):void{
  if(typeof value==="number"&&Number.isFinite(value)){add(map,`num:${path}`,value);return;}
  if(typeof value==="boolean"){add(map,`bool:${path}`,value?1:0);return;}
  if(typeof value==="string"){const key=path.split(".").at(-1)??path;if(!identityValue(key,value))add(map,`cat:${path}=${value}`,1);return;}
  if(Array.isArray(value)){add(map,`num:${path}.length`,value.length);for(const item of value)flatten(item,`${path}[]`,map);return;}
  if(value!==null&&typeof value==="object")for(const[key,child]of Object.entries(value as Record<string,unknown>))flatten(child,path?`${path}.${key}`:key,map);
}
function evidenceFeatures(row:CandidateFeatureRow):Sparse{
  const map=new Map<string,number>();
  for(const result of row.results){const root=`${result.source.id}@${result.source.version}`;add(map,`presence:${root}`,1);flatten(result.payload,root,map);}
  return map;
}
function foldFor(fen:string):number{return createHash("sha256").update(fen).digest().readUInt32BE(0)%5;}
function xorshift(seed:number):()=>number{let state=seed>>>0;return()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return(state>>>0)/0x100000000;};}
function interval(values:readonly number[]):readonly[number,number]{const random=xorshift(0x1162);const means:number[]=[];for(let sample=0;sample<10_000;sample+=1){let sum=0;for(let index=0;index<values.length;index+=1)sum+=values[Math.floor(random()*values.length)]!;means.push(sum/values.length);}means.sort((a,b)=>a-b);return[rounded(means[Math.floor(means.length*.025)]!),rounded(means[Math.floor(means.length*.975)]!)];}

function build(directory:string):{readonly positions:readonly Position[];readonly inputs:Readonly<Record<string,string>>;readonly excluded:number}{
  const texts={maia:readFileSync(`${directory}/armA-history.jsonl`,"utf8"),sf:readFileSync(`${directory}/sf-d12.jsonl`,"utf8"),probes:readFileSync(`${directory}/probe-set.json`,"utf8"),san:readFileSync(`${directory}/san-map.json`,"utf8")};
  const inputs=Object.fromEntries(Object.entries(texts).map(([key,text])=>[key,digest(text)]));
  expect(inputs).toEqual(EXPECTED_DIGESTS);
  const sf=lines<SfRow>(texts.sf),probes=(JSON.parse(texts.probes) as {positions:Probe[]}).positions,san=JSON.parse(texts.san) as Readonly<Record<string,Readonly<Record<string,string>>>>;
  const probeByFen=new Map(probes.map((row)=>[row.fen,row]));const positions:Position[]=[];let excluded=0;
  for(const row of sf){
    if(row.entries.some((entry)=>entry.mate!==null)||row.entries.some((entry)=>entry.cp===null)){excluded+=1;continue;}
    const probe=probeByFen.get(row.fen);if(probe===undefined){excluded+=1;continue;}
    const vector=candidateFeatureVector({beforeFen:row.fen,engine:{id:"stockfish-analysis",name:"Stockfish",version:"18",seedHonored:false,searchBound:{kind:"depth",value:12}},candidates:row.entries.map((entry)=>({moveUci:entry.uci,scoreCp:entry.cp!}))});
    if(vector.candidates.length!==row.entries.length)throw new Error(`legal-set coverage changed at ${row.fen}`);
    const human=new Map<Band,ReadonlyMap<string,number>>();
    for(const band of BANDS){const source=probe.bands[String(band)];if(source===undefined)throw new Error(`missing band ${band}`);human.set(band,new Map(source.moves.flatMap((move)=>{const uci=san[row.fen]?.[move.san];return uci===undefined?[]:[[uci,move.n/source.total] as const];})));}
    positions.push({fen:row.fen,fold:foldFor(row.fen),candidates:vector.candidates.map((candidate)=>({moveUci:candidate.moveUci,scoreCp:candidate.scoreCp,raw:evidenceFeatures(candidate)})),human});
  }
  return {positions,inputs,excluded};
}

function prepare(positions:readonly Position[],training:ReadonlySet<number>,arm:"engine"|"evidence"|"combined"):Prepared{
  const train=positions.filter((position)=>training.has(position.fold));const categoricalPositions=new Map<string,Set<string>>();const names=new Set<string>();
  for(const position of train)for(const candidate of position.candidates)for(const name of candidate.raw.keys()){if(name.startsWith("cat:")){const set=categoricalPositions.get(name)??new Set<string>();set.add(position.fen);categoricalPositions.set(name,set);}else names.add(name);}
  const minimum=Math.ceil(train.length*.05);for(const[name,fens]of categoricalPositions)if(fens.size>=minimum)names.add(name);
  if(arm!=="evidence")names.add("num:engine.loss_cp");if(arm==="engine")for(const name of [...names])if(name!=="num:engine.loss_cp")names.delete(name);
  const ordered=[...names].sort();const means=new Map<string,number>(),deviations=new Map<string,number>();
  const rawValue=(position:Position,candidate:Candidate,name:string):number=>name==="num:engine.loss_cp"?Math.max(...position.candidates.map((row)=>row.scoreCp))-candidate.scoreCp:(candidate.raw.get(name)??0);
  const trainRows=train.flatMap((position)=>position.candidates.map((candidate)=>({position,candidate})));
  for(const name of ordered.filter((item)=>item.startsWith("num:"))){const values=trainRows.map(({position,candidate})=>rawValue(position,candidate,name));const mean=values.reduce((sum,value)=>sum+value,0)/values.length;const sd=Math.sqrt(values.reduce((sum,value)=>sum+(value-mean)**2,0)/Math.max(1,values.length-1));means.set(name,mean);deviations.set(name,sd||1);}
  return {names:ordered,rows:positions.map((position)=>({position,candidates:position.candidates.map((candidate)=>new Map(ordered.flatMap((name)=>{let value=rawValue(position,candidate,name);if(name.startsWith("num:"))value=Math.max(-8,Math.min(8,(value-means.get(name)!)/deviations.get(name)!));return value===0?[]:[[name,value] as const];})))}))};
}

function fit(prepared:Prepared,folds:ReadonlySet<number>,band:Band,lambda:number):ReadonlyMap<string,number>{
  const deltas=new Map<string,number>(),counts=new Map<string,number>(),sums=new Map<string,number>(),squares=new Map<string,number>(),candidateCount=new Map<string,number>();
  for(const row of prepared.rows.filter((item)=>folds.has(item.position.fold))){const human=row.position.human.get(band)!;const listed=[...human].filter(([move])=>row.position.candidates.some((candidate)=>candidate.moveUci===move));const total=listed.reduce((sum,[,mass])=>sum+mass,0);if(total===0)continue;
    for(const name of prepared.names){let uniform=0,weighted=0;for(let index=0;index<row.candidates.length;index+=1){const value=row.candidates[index]!.get(name)??0;uniform+=value/row.candidates.length;weighted+=value*(human.get(row.position.candidates[index]!.moveUci)??0)/total;sums.set(name,(sums.get(name)??0)+value);squares.set(name,(squares.get(name)??0)+value*value);candidateCount.set(name,(candidateCount.get(name)??0)+1);}deltas.set(name,(deltas.get(name)??0)+weighted-uniform);counts.set(name,(counts.get(name)??0)+1);}}
  return new Map(prepared.names.map((name)=>{const meanDelta=(deltas.get(name)??0)/Math.max(1,counts.get(name)??0);const n=Math.max(1,candidateCount.get(name)??0);const mean=(sums.get(name)??0)/n;const variance=Math.max(0,(squares.get(name)??0)/n-mean*mean);return[name,meanDelta/(variance+lambda)] as const;}));
}
function distribution(candidates:readonly Sparse[],weights:ReadonlyMap<string,number>):readonly number[]{const scores=candidates.map((candidate)=>{let score=0;for(const[name,value]of candidate)score+=(weights.get(name)??0)*value;return score;});const maximum=Math.max(...scores);const masses=scores.map((score)=>Math.exp(score-maximum));const total=masses.reduce((sum,value)=>sum+value,0);return masses.map((mass)=>mass/total);}
function crossEntropy(prepared:Prepared,weights:ReadonlyMap<string,number>,fold:number,band:Band):number{let sum=0,count=0;for(const row of prepared.rows.filter((item)=>item.position.fold===fold)){const predicted=distribution(row.candidates,weights),human=row.position.human.get(band)!;const listed=human.values().reduce((a,b)=>a+b,0);if(listed===0)continue;for(let index=0;index<predicted.length;index+=1){const mass=(human.get(row.position.candidates[index]!.moveUci)??0)/listed;if(mass>0)sum-=mass*Math.log(Math.max(1e-12,predicted[index]!));}count+=1;}return sum/Math.max(1,count);}
function uniform(count:number):readonly number[]{return Array.from({length:count},()=>1/count);}
interface PositionMeasure{readonly match:number;readonly crossEntropy:number;readonly top:number;readonly listedMass:number;readonly expectedLossCp:number;readonly severe250:number}
function measure(row:Prepared["rows"][number],predicted:readonly number[],band:Band):PositionMeasure{const human=row.position.human.get(band)!;const listedMass=[...human.values()].reduce((a,b)=>a+b,0);let match=0,ce=0,loss=0,severe=0;const best=Math.max(...row.position.candidates.map((candidate)=>candidate.scoreCp));for(let index=0;index<predicted.length;index+=1){const move=row.position.candidates[index]!.moveUci,humanMass=human.get(move)??0,p=predicted[index]!,candidateLoss=best-row.position.candidates[index]!.scoreCp;match+=p*humanMass;if(humanMass>0)ce-=humanMass/listedMass*Math.log(Math.max(1e-12,p));loss+=p*candidateLoss;if(candidateLoss>250)severe+=p;}const topPred=predicted.indexOf(Math.max(...predicted)),topHuman=row.position.candidates.map((candidate)=>human.get(candidate.moveUci)??0).indexOf(Math.max(...row.position.candidates.map((candidate)=>human.get(candidate.moveUci)??0)));return{match,crossEntropy:ce,top:topPred===topHuman?1:0,listedMass,expectedLossCp:loss,severe250:severe};}
function average(rows:readonly PositionMeasure[]){return Object.fromEntries((Object.keys(rows[0]!) as (keyof PositionMeasure)[]).map((key)=>[key,rounded(rows.reduce((sum,row)=>sum+row[key],0)/rows.length)]));}

function run(directory:string){
  const built=build(directory);const measures:Record<string,Record<string,PositionMeasure[]>>={uniform:{},engine:{},evidence:{},combined:{}};const choices:Record<string,Record<string,number>>={engine:{},evidence:{},combined:{}};for(const arm of ["engine","evidence","combined"] as const)for(const band of BANDS){for(const outer of [0,1,2,3,4]){const allTrain=new Set([0,1,2,3,4].filter((fold)=>fold!==outer)),inner=(outer+1)%5,innerTrain=new Set([...allTrain].filter((fold)=>fold!==inner));const prepared=prepare(built.positions,allTrain,arm);const ranked=LAMBDAS.map((lambda)=>({lambda,loss:crossEntropy(prepared,fit(prepared,innerTrain,band,lambda),inner,band)})).sort((a,b)=>a.loss-b.loss||b.lambda-a.lambda);const chosen=ranked[0]!.lambda;choices[arm]![`${band}:${outer}`]=chosen;const weights=fit(prepared,allTrain,band,chosen);for(const row of prepared.rows.filter((item)=>item.position.fold===outer)){const predicted=distribution(row.candidates,weights);(measures[arm]![String(band)]??=[]).push(measure(row,predicted,band));if(arm==="engine")(measures.uniform[String(band)]??=[]).push(measure(row,uniform(row.candidates.length),band));}}}
  const summary=Object.fromEntries(Object.entries(measures).map(([arm,bands])=>[arm,Object.fromEntries(BANDS.map((band)=>[band,average(bands[String(band)]!)]))]));const contrast=(left:string,right:string)=>Object.fromEntries(BANDS.map((band)=>{const values=measures[left]![String(band)]!.map((row,index)=>row.match-measures[right]![String(band)]![index]!.match);return[band,{mean:rounded(values.reduce((a,b)=>a+b,0)/values.length),ci95:interval(values)}];}));const evidenceVsUniform=contrast("evidence","uniform"),combinedVsEngine=contrast("combined","engine");const pooled=(contrastRows:Record<string,{mean:number;ci95:readonly[number,number]}>,left:string,right:string)=>{const count=measures[left]![String(BANDS[0])]!.length;const values=Array.from({length:count},(_,index)=>BANDS.reduce((sum,band)=>sum+measures[left]![String(band)]![index]!.match-measures[right]![String(band)]![index]!.match,0)/BANDS.length);return{mean:rounded(values.reduce((a,b)=>a+b,0)/values.length),ci95:interval(values),bands:contrastRows};};const primary={evidenceVsUniform:pooled(evidenceVsUniform,"evidence","uniform"),combinedVsEngine:pooled(combinedVsEngine,"combined","engine")};const pass=primary.evidenceVsUniform.ci95[0]>0&&Object.values(evidenceVsUniform).every((value)=>value.mean>=0)&&primary.combinedVsEngine.ci95[0]>0;const refuted=primary.evidenceVsUniform.mean<=0||primary.combinedVsEngine.mean<=0;return{measuredAt:new Date().toISOString(),inputs:built.inputs,population:{positions:built.positions.length,excludedMixedScore:built.excluded,legalCandidates:built.positions.reduce((sum,row)=>sum+row.candidates.length,0),coverage:1,folds:Object.fromEntries([0,1,2,3,4].map((fold)=>[fold,built.positions.filter((row)=>row.fold===fold).length]))},parameters:{bands:BANDS,lambdas:LAMBDAS,fold:"sha256(fen)[0..3] mod 5",categoricalFloor:.05,bootstrapSamples:10_000,bootstrapSeed:"0x1162",bootstrapUnit:"position"},choices,summary,primary,verdict:pass?"pass":refuted?"refuted":"inconclusive"};
}
function markdown(result:ReturnType<typeof run>):string{return `# D1162 evidence-to-move head result\n\nVerdict: **${result.verdict}**. Positions: **${result.population.positions}**; legal candidates: **${result.population.legalCandidates}**; coverage: **${(result.population.coverage*100).toFixed(0)}%**. No engine or network calls.\n\n| contrast | mean expected-match delta | paired bootstrap 95% CI |\n|---|---:|---:|\n| evidence-only − uniform | ${result.primary.evidenceVsUniform.mean.toFixed(6)} | [${result.primary.evidenceVsUniform.ci95.join(", ")}] |\n| evidence + engine − engine-only | ${result.primary.combinedVsEngine.mean.toFixed(6)} | [${result.primary.combinedVsEngine.ci95.join(", ")}] |\n\nThis is a held-out representation screen. It licenses no human-like, personality, Elo, or production claim.\n`;}

describe("D1162 evidence-to-move head",()=>{
  it("pins identity exclusion, fold assignment, variance normalization and bootstrap",()=>{expect(identityValue("square","e4")).toBe(true);expect(identityValue("role","knight")).toBe(false);expect(new Set([foldFor("a"),foldFor("b"),foldFor("c")]).size).toBeGreaterThan(1);expect(distribution([new Map(),new Map()],new Map())).toEqual([.5,.5]);const position={fen:"variance-control",fold:0,candidates:[{moveUci:"a",scoreCp:0,raw:new Map()},{moveUci:"b",scoreCp:0,raw:new Map()}],human:new Map([[1400,new Map([["a",1]])]])} as Position;const weights=fit({names:["bool:x"],rows:[{position,candidates:[new Map([["bool:x",1]]),new Map()]}]},new Set([0]),1400,0);expect(weights.get("bool:x")).toBe(2);expect(interval([1,1,1])).toEqual([1,1]);});
  it.skipIf(INPUT===undefined)("runs the preregistered fixed-population screen",()=>{const result=run(INPUT!);expect(result.population).toMatchObject({positions:268,excludedMixedScore:11,coverage:1});expect(result.inputs).toEqual(EXPECTED_DIGESTS);expect(["pass","refuted","inconclusive"]).toContain(result.verdict);if(WRITE){writeFileSync(RESULT,`${JSON.stringify(result,null,2)}\n`);writeFileSync(REPORT,markdown(result));}});
});
