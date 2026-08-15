import { describe, expect, it } from "vitest";

import { corpusPopulation, type CorpusSource } from "./corpus.js";
import { parseRepertoirePgn } from "./repertoire-pgn.js";
import { repertoireDigest, scanRepertoire } from "./repertoire.js";
import type { RepertoireMoveRecord, RepertoireRecord } from "./storage.js";

const START="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const AT="2026-08-14T12:00:00.000Z";

function record(moves:readonly RepertoireMoveRecord[]):RepertoireRecord{return {id:"rep",ownerLearnerId:"learner",name:"Black choices",side:"black",rootFen:START,targetElo:1600,coverageDenominator:10,sourceKind:"pgn_paste",sourceUrl:null,originalPgn:"",licenceNote:"test",digest:repertoireDigest("black",START,moves),createdAt:AT,updatedAt:AT};}

describe("repertoire import and gap scan",()=>{
  it("walks every variation and chapter while recording learner-side answers by position",()=>{
    const parsed=parseRepertoirePgn(`[Event "One"]\n\n1. d4 d5 (1... Nf6) 2. c4 *\n\n[Event "Two"]\n\n1. e4 c5 *`,`black`);
    expect(parsed.games).toBe(2);
    expect(parsed.moves.map((move)=>move.moveUci).sort()).toEqual(["c7c5","d7d5","g8f6"]);
    expect(new Set(parsed.moves.map((move)=>move.positionKey)).size).toBe(2);
    expect(parsed.moves.filter((move)=>move.positionKey.includes("3P4")).map((move)=>move.rank)).toEqual([0,1]);
  });

  it("multiplies ranked gaps and stops honestly at corpus abstention",async()=>{
    const parsed=parseRepertoirePgn("1. d4 d5 *","black"),moves=parsed.moves.map((move)=>({...move,repertoireId:"rep",origin:"imported" as const,createdAt:AT}));
    let inFlight=0,maxInFlight=0;
    const source:CorpusSource={async stats(query){inFlight++;maxInFlight=Math.max(maxInFlight,inFlight);await Promise.resolve();inFlight--;const population={...corpusPopulation(1600,new Date(AT)),...query};if(query.fen.startsWith("rnbqkbnr/pppppppp"))return {kind:"stats",total:1000,white:400,draws:200,black:400,moves:[{san:"e4",uci:"e2e4",playedCount:600,sharePct:60,white:300,draws:100,black:200},{san:"d4",uci:"d2d4",playedCount:400,sharePct:40,white:100,draws:100,black:200}],recency:{kind:"absent"},population};return {kind:"abstention",reason:"no_data_at_band",detail:"total 37 < 100",population};}};
    const scan=await scanRepertoire(record(moves),moves,source,new Date(AT));
    expect(scan.gaps).toEqual([expect.objectContaining({replySan:"e4",mass:.6,gamesUntilSeen:2})]);
    expect(scan.unknown).toEqual([expect.objectContaining({reason:"no_data_at_band",pathMass:.4,gamesUntilPosition:3})]);
    expect(scan.uncoveredMass).toBe(.6);expect(maxInFlight).toBe(1);
  });

  it("returns the root as the only gap when the learner has no first move",async()=>{
    const empty:readonly RepertoireMoveRecord[]=[],white={...record(empty),side:"white" as const,digest:repertoireDigest("white",START,empty)};
    const source:CorpusSource={stats:async()=>{throw new Error("must not query")}};
    await expect(scanRepertoire(white,empty,source,new Date(AT))).resolves.toMatchObject({queriesUsed:0,uncoveredMass:1,gaps:[{mass:1,gamesUntilSeen:1}]});
  });
});
