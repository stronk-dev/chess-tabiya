import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const sourceRoot = new URL("./", import.meta.url);

function hasAwaitBetweenAppends(source:string):boolean{
  const calls=[...source.matchAll(/appendEvents\s*\(/gu)].map((match)=>match.index);
  return calls.some((start,index)=>index>0&&/\bawait\b/u.test(source.slice(calls[index-1],start)));
}

describe("board annotation isolation",()=>{
  it("keeps RunMark out of every runtime path except types and PGN export",()=>{
    const files=readdirSync(sourceRoot).filter((name)=>name.endsWith(".ts")&&!name.endsWith(".test.ts"));
    const mentions=files.filter((name)=>readFileSync(new URL(name,sourceRoot),"utf8").includes("RunMark")).sort();
    expect(mentions).toEqual(["index.ts","pack-pgn.ts","pgn.ts","types.ts"]);
  });

  it("pins synchronous bracketing between repeated appendEvents calls",()=>{
    const source=readFileSync(new URL("runtime.ts",sourceRoot),"utf8");
    const start=source.indexOf("export function reachCheckpoint");
    const end=source.indexOf("\nexport function",start+1);
    const reach=source.slice(start,end<0?undefined:end);
    expect((reach.match(/appendEvents\s*\(/gu)??[]).length).toBeGreaterThan(1);
    expect(hasAwaitBetweenAppends(reach)).toBe(false);
    expect(hasAwaitBetweenAppends("appendEvents(run, []); await later(); appendEvents(run, []);")).toBe(true);
  });
});
