// DISPOSABLE research harness — D1163. No production code and no engine/network calls.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const INPUT = process.env.TABIYA_R11_INPUT_DIR;
const WRITE = process.env.TABIYA_D1163_WRITE === "1";
const RESULT = new URL("../../planning/platform-alignment/bot-policy/d1163-engine-composed-results.json", import.meta.url);
const REPORT = new URL("../../planning/platform-alignment/bot-policy/d1163-engine-composed-results.md", import.meta.url);
const BANDS = [1400, 1600, 1800] as const;
const TEMPERATURES = [20, 40, 80, 160] as const;
const INTENDED: Readonly<Record<string, number>> = Object.freeze({ boltzmann_20: 1800, boltzmann_40: 1600, boltzmann_80: 1400 });
type Distribution = ReadonlyMap<string, number>;
interface MaiaRow { readonly fen:string; readonly elo:number; readonly candidates:readonly {readonly uci:string;readonly policy:number|null}[] }
interface SfRow { readonly fen:string; readonly entries:readonly {readonly uci:string;readonly cp:number|null;readonly mate:number|null}[] }
interface Probe { readonly fen:string; readonly bands:Readonly<Record<string,{readonly total:number;readonly moves:readonly {readonly san:string;readonly n:number}[]}>> }

function lines<T>(text:string):readonly T[]{return text.trim().split("\n").filter(Boolean).map((line)=>JSON.parse(line) as T);}
function normalize(rows:Iterable<readonly [string,number]>):Distribution{const kept=[...rows].filter(([,mass])=>Number.isFinite(mass)&&mass>0);const total=kept.reduce((sum,[,mass])=>sum+mass,0);return total===0?new Map():new Map(kept.map(([move,mass])=>[move,mass/total]));}
function sampler(raw:Distribution):Distribution{const ordered=[...normalize([...raw].map(([move,mass])=>[move,Math.pow(mass,1/0.8)] as const))].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));let cumulative=0;const kept:Array<readonly[string,number]>=[];for(const row of ordered){cumulative+=row[1];if(cumulative<=0.92||kept.length===0)kept.push(row);}return normalize(kept);}
function boltzmann(loss:ReadonlyMap<string,number>,temperature:number):Distribution{return normalize([...loss].filter(([,cp])=>cp<=250).map(([move,cp])=>[move,Math.exp(-cp/temperature)] as const));}
function dot(left:Distribution,right:Distribution):number{let value=0;for(const[move,mass]of left)value+=mass*(right.get(move)??0);return value;}
function digest(text:string):string{return `sha256:${createHash("sha256").update(text).digest("hex")}`;}
function rounded(value:number):number{return Number(value.toFixed(6));}
function xorshift(seed:number):()=>number{let state=seed>>>0;return()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return(state>>>0)/0x100000000;};}
function interval(values:readonly number[]):readonly[number,number]{const random=xorshift(0x1163);const means:number[]=[];for(let sample=0;sample<10_000;sample+=1){let sum=0;for(let index=0;index<values.length;index+=1)sum+=values[Math.floor(random()*values.length)]!;means.push(sum/values.length);}means.sort((a,b)=>a-b);return[rounded(means[Math.floor(means.length*.025)]!),rounded(means[Math.floor(means.length*.975)]!)];}

function run(directory:string){
  const texts={maia:readFileSync(`${directory}/armA-history.jsonl`,"utf8"),sf:readFileSync(`${directory}/sf-d12.jsonl`,"utf8"),probes:readFileSync(`${directory}/probe-set.json`,"utf8"),san:readFileSync(`${directory}/san-map.json`,"utf8")};
  const maia=lines<MaiaRow>(texts.maia),sf=lines<SfRow>(texts.sf),probes=(JSON.parse(texts.probes) as {positions:Probe[]}).positions,san=JSON.parse(texts.san) as Readonly<Record<string,Readonly<Record<string,string>>>>;
  const sfByFen=new Map(sf.map((row)=>[row.fen,row])),probeByFen=new Map(probes.map((row)=>[row.fen,row]));
  const maiaByFenBand=new Map(maia.map((row)=>[`${row.fen}:${row.elo}`,row]));
  const cells:{fen:string;human:Map<number,Distribution>;maia:Map<number,Distribution>;engine:Map<string,Distribution>}[]=[];
  for(const row of sf){
    if(row.entries.some((entry)=>entry.mate!==null)||row.entries.some((entry)=>entry.cp===null))continue;
    const probe=probeByFen.get(row.fen);if(probe===undefined)continue;
    const scores=new Map(row.entries.map((entry)=>[entry.uci,entry.cp!]));const best=Math.max(...scores.values());const loss=new Map([...scores].map(([move,score])=>[move,Math.max(0,best-score)]));
    const human=new Map<number,Distribution>(),models=new Map<number,Distribution>();
    for(const band of BANDS){const source=probe.bands[String(band)];if(source===undefined)continue;human.set(band,new Map(source.moves.flatMap((move)=>{const uci=san[row.fen]?.[move.san];return uci===undefined?[]:[[uci,move.n/source.total] as const];})));const model=maiaByFenBand.get(`${row.fen}:${band}`);if(model!==undefined)models.set(band,sampler(normalize(model.candidates.flatMap((candidate)=>candidate.policy===null?[]:[[candidate.uci,candidate.policy] as const]))));}
    if(human.size!==3||models.size!==3)continue;
    const argmax=[...scores].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))[0]![0];
    cells.push({fen:row.fen,human,maia:models,engine:new Map([["stockfish_argmax",new Map([[argmax,1]])],...TEMPERATURES.map((temperature)=>[`boltzmann_${temperature}`,boltzmann(loss,temperature)] as const)])});
  }
  const matrix=(profiles:readonly string[],distribution:(cell:typeof cells[number],profile:string)=>Distribution)=>Object.fromEntries(profiles.map((profile)=>[profile,Object.fromEntries(BANDS.map((band)=>[band,rounded(cells.reduce((sum,cell)=>sum+dot(distribution(cell,profile),cell.human.get(band)!),0)/cells.length)]))]));
  const maiaProfiles=BANDS.map(String),engineProfiles=["stockfish_argmax",...TEMPERATURES.map((value)=>`boltzmann_${value}`)];
  const maiaMatrix=matrix(maiaProfiles,(cell,profile)=>cell.maia.get(Number(profile))!);const engineMatrix=matrix(engineProfiles,(cell,profile)=>cell.engine.get(profile)!);
  const peak=(row:Readonly<Record<string,number>>)=>Number(Object.entries(row).sort((a,b)=>b[1]-a[1]||Number(a[0])-Number(b[0]))[0]![0]);
  const differences=Object.fromEntries(Object.entries(INTENDED).map(([profile,intended])=>[profile,Object.fromEntries(BANDS.filter((band)=>band!==intended).map((other)=>{const values=cells.map((cell)=>dot(cell.engine.get(profile)!,cell.human.get(intended)!)-dot(cell.engine.get(profile)!,cell.human.get(other)!));return[other,{mean:rounded(values.reduce((a,b)=>a+b,0)/values.length),ci95:interval(values)}];}))]));
  const maiaPeaks=Object.fromEntries(maiaProfiles.map((profile)=>[profile,peak(maiaMatrix[profile] as Record<string,number>)]));const enginePeaks=Object.fromEntries(engineProfiles.map((profile)=>[profile,peak(engineMatrix[profile] as Record<string,number>)]));
  const positiveControl=maiaProfiles.filter((profile)=>maiaPeaks[profile]===Number(profile)).length>=2;
  const intendedProfiles=Object.keys(INTENDED);const strongPeaks=intendedProfiles.filter((profile)=>enginePeaks[profile]===1800).length;
  const pass=positiveControl&&intendedProfiles.every((profile)=>enginePeaks[profile]===INTENDED[profile]&&Object.values(differences[profile] as Record<string,{ci95:readonly[number,number]}>).every((value)=>value.ci95[0]>0));
  const verdict=!positiveControl?"abstain":strongPeaks>=2?"refuted":pass?"pass":"inconclusive";
  return {measuredAt:new Date().toISOString(),inputs:Object.fromEntries(Object.entries(texts).map(([key,text])=>[key,digest(text)])),population:{maiaRows:maia.length,sfRows:sf.length,probePositions:probes.length,cells:cells.length,excludedMixedScore:sf.length-cells.length},parameters:{productionTemperature:.8,productionTopP:.92,guardCp:250,boltzmannTemperaturesCp:TEMPERATURES,bootstrapSamples:10_000,bootstrapSeed:"0x1163",intended:INTENDED},maiaMatrix,engineMatrix,maiaPeaks,enginePeaks,differences,positiveControl,verdict};
}

function markdown(result:ReturnType<typeof run>):string{const rows=(matrix:Record<string,Record<string,number>>)=>Object.entries(matrix).map(([profile,value])=>`| ${profile} | ${(value[1400]!*100).toFixed(2)}% | ${(value[1600]!*100).toFixed(2)}% | ${(value[1800]!*100).toFixed(2)}% |`).join("\n");return `# D1163 engine-composed bot result\n\nVerdict: **${result.verdict}**. Cells: **${result.population.cells}**. No engine or network calls.\n\n## Maia positive control\n\n| profile | human 1400 | human 1600 | human 1800 |\n|---|---:|---:|---:|\n${rows(result.maiaMatrix as Record<string,Record<string,number>>)}\n\n## Engine-derived profiles\n\n| profile | human 1400 | human 1600 | human 1800 |\n|---|---:|---:|---:|\n${rows(result.engineMatrix as Record<string,Record<string,number>>)}\n\nPeaks: \`${JSON.stringify(result.enginePeaks)}\`. This screen measures band-specific move-distribution resemblance only; it licenses no human-like/persona/Elo claim.\n`;}

describe("D1163 engine-composed discriminator",()=>{
  it("pins normalization, guard and deterministic bootstrap arithmetic",()=>{expect([...boltzmann(new Map([["a",0],["b",100],["c",300]]),50).keys()]).toEqual(["a","b"]);expect([...normalize([["a",2],["b",2]]).values()]).toEqual([.5,.5]);expect(interval([1,1,1])).toEqual([1,1]);});
  it.skipIf(INPUT===undefined)("runs the preregistered fixed-population screen",()=>{const result=run(INPUT!);expect(result.population).toEqual({maiaRows:837,sfRows:279,probePositions:279,cells:268,excludedMixedScore:11});expect(result.inputs).toMatchObject({maia:"sha256:61b4e12a4fa6e728ad5cc7bc44276c9cc676ae4be1d29f7c8e4b66d9fc466400",sf:"sha256:890c60150f28c7f930a07553b2df4d80cf4fd903ebca33837e7aefe42219844e",probes:"sha256:fe081f45d95b6115ee649831882e45561ff7b0d960b6759242ac335654e9cfed",san:"sha256:4e88eae51cc0df0a5cb4882a2a33679de73c41e3c8f26dfab4def80df3103473"});if(WRITE){writeFileSync(RESULT,`${JSON.stringify(result,null,2)}\n`);writeFileSync(REPORT,markdown(result));}expect(["pass","refuted","inconclusive","abstain"]).toContain(result.verdict);});
});
