import { createHash, randomUUID } from "node:crypto";

import { Chess } from "chessops/chess";
import { parseFen } from "chessops/fen";
import { makeSan } from "chessops/san";
import { parseUci } from "chessops/util";

import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";
import { canonicalFen, transposeKey } from "@chess-tabiya/runtime";

import { corpusPopulation, type CorpusPopulation, type CorpusSource } from "./corpus.js";
import { ServerError } from "./errors.js";
import { resolveStudySource } from "./import-source.js";
import { parseRepertoirePgn, RepertoirePgnError } from "./repertoire-pgn.js";
import type { RunService } from "./service.js";
import type {
  RepertoireMoveRecord,
  RepertoireRecord,
  RepertoireScanRecord,
  RunStorage,
} from "./storage.js";
import type { Principal } from "./authorization.js";

export const REPERTOIRE_CORPUS_GUARD="These counts say what this population played, not what is good";

export interface GapRow {
  readonly key:string;
  readonly representativeFen:string;
  readonly replySan:string;
  readonly replyUci:string;
  readonly line:readonly string[];
  readonly mass:number;
  readonly gamesUntilSeen:number;
}
export interface AlternateGapRow extends Omit<GapRow,"mass"|"gamesUntilSeen">{readonly behindAlternate:true}
export interface UnknownGapRow {readonly key:string;readonly representativeFen:string;readonly line:readonly string[];readonly reason:"no_data_at_band"|"source_unavailable";readonly detail:string;readonly pathMass:number;readonly gamesUntilPosition:number}

interface Frontier {readonly fen:string;readonly key:string;readonly mass:number;readonly line:readonly string[];readonly ply:number;readonly alternate:boolean}

function position(fen:string):Chess{return Chess.fromSetup(parseFen(fen).unwrap()).unwrap();}
function seedFen(chess:Chess):string{return `${transposeKey(canonicalFen(chess))} 0 1`;}
function play(fen:string,uci:string):{fen:string;san:string}{const chess=position(fen),move=parseUci(uci);if(move===undefined||!chess.isLegal(move))throw new ServerError("INVALID_REQUEST",`Illegal repertoire move ${uci}`);const san=makeSan(chess,move);chess.play(move);return {fen:seedFen(chess),san};}

export function repertoireDigest(side:"white"|"black",rootFen:string,moves:readonly RepertoireMoveRecord[]):string{
  return `sha256:${createHash("sha256").update(canonicalizeJson({side,rootKey:transposeKey(rootFen),answers:[...moves].sort((a,b)=>a.positionKey.localeCompare(b.positionKey)||a.rank-b.rank||a.moveUci.localeCompare(b.moveUci)).map((move)=>({key:move.positionKey,uci:move.moveUci,rank:move.rank}))})).digest("hex")}`;
}

export async function scanRepertoire(record:RepertoireRecord,moves:readonly RepertoireMoveRecord[],source:CorpusSource,now=new Date()):Promise<RepertoireScanRecord>{
  const population=corpusPopulation(record.targetElo,now),answers=new Map<string,readonly RepertoireMoveRecord[]>();for(const move of moves){const list=answers.get(move.positionKey)??[];answers.set(move.positionKey,Object.freeze([...list,move].sort((a,b)=>a.rank-b.rank||a.moveUci.localeCompare(b.moveUci))));}
  const reached=new Set<string>(),gaps=new Map<string,GapRow>(),alternateGaps=new Map<string,AlternateGapRow>(),unknown:UnknownGapRow[]=[];let frontier:Frontier[]=[{fen:record.rootFen,key:transposeKey(record.rootFen),mass:1,line:[],ply:0,alternate:false}],queries=0,truncated=false,sourceFailures=0,unqueried=0;const expanded=new Set<string>(),bound=1/record.coverageDenominator;
  const root=position(record.rootFen);if(root.turn===record.side&&!answers.has(transposeKey(record.rootFen))){const scan:RepertoireScanRecord={repertoireId:record.id,scannedAt:now.toISOString(),repertoireDigest:record.digest,population,gaps:[{key:transposeKey(record.rootFen),representativeFen:record.rootFen,replySan:"",replyUci:"",line:[],mass:1,gamesUntilSeen:1}],alternateGaps:[],unknown:[],uncoveredMass:1,truncated:false,sourceFailures:0,queriesUsed:0,unreachedKeys:moves.length};return Object.freeze(scan);}
  while(frontier.length>0){const nextByKey=new Map<string,Frontier>();for(const item of frontier){reached.add(item.key);if(item.ply>=60){truncated=true;unqueried++;continue;}if(expanded.has(`${item.alternate?"a":"m"}:${item.key}`))continue;const chess=position(item.fen);
      if(chess.isEnd())continue;
      if(chess.turn===record.side){const choices=answers.get(item.key)??[];for(const answer of choices){const child=play(item.fen,answer.moveUci),alternate=item.alternate||answer.rank!==0;mergeFrontier(nextByKey,{fen:child.fen,key:transposeKey(child.fen),mass:item.mass,line:Object.freeze([...item.line,answer.moveSan]),ply:item.ply+1,alternate});}continue;}
      if(queries>=300){truncated=true;unqueried++;continue;}queries++;const stats=await source.stats({...population,fen:item.fen});if(stats.kind==="abstention"){if(stats.reason==="source_unavailable")sourceFailures++;unknown.push(Object.freeze({key:item.key,representativeFen:item.fen,line:item.line,reason:stats.reason,detail:stats.detail,pathMass:item.mass,gamesUntilPosition:Math.max(1,Math.round(1/item.mass))}));continue;}
      for(const reply of stats.moves){const mass=item.mass*(reply.playedCount/stats.total);if(mass<bound)continue;let child;try{child=play(item.fen,reply.uci);}catch{continue;}const key=transposeKey(child.fen),line=Object.freeze([...item.line,reply.san]),covered=answers.has(key);if(!covered){if(item.alternate){alternateGaps.set(key,Object.freeze({key,representativeFen:child.fen,replySan:reply.san,replyUci:reply.uci,line,behindAlternate:true}));}else{const prior=gaps.get(key),combined=(prior?.mass??0)+mass;gaps.set(key,Object.freeze({key,representativeFen:child.fen,replySan:reply.san,replyUci:reply.uci,line:prior!==undefined&&prior.line.length<=line.length?prior.line:line,mass:combined,gamesUntilSeen:Math.max(1,Math.round(1/combined))}));}continue;}mergeFrontier(nextByKey,{fen:child.fen,key,mass,line,ply:item.ply+1,alternate:item.alternate});}
      expanded.add(`${item.alternate?"a":"m"}:${item.key}`);
    }frontier=[...nextByKey.values()];}
  const ranked=[...gaps.values()].sort((a,b)=>b.mass-a.mass||a.key.localeCompare(b.key)),alternates=[...alternateGaps.values()].sort((a,b)=>a.key.localeCompare(b.key)),unreached=[...answers.keys()].filter((key)=>!reached.has(key)).length;
  return Object.freeze({repertoireId:record.id,scannedAt:now.toISOString(),repertoireDigest:record.digest,population,gaps:Object.freeze(ranked),alternateGaps:Object.freeze(alternates),unknown:Object.freeze(unknown),uncoveredMass:ranked.reduce((sum,gap)=>sum+gap.mass,0),truncated,sourceFailures,queriesUsed:queries,unreachedKeys:unreached+(truncated?unqueried:0)});
}

function mergeFrontier(map:Map<string,Frontier>,item:Frontier):void{const id=`${item.alternate?"a":"m"}:${item.key}`,prior=map.get(id);map.set(id,prior===undefined?item:Object.freeze({...item,mass:prior.mass+item.mass,line:prior.line.length<=item.line.length?prior.line:item.line}));}

export class RepertoireService{
  readonly #jobs=new Map<string,Promise<void>>();
  constructor(private readonly storage:RunStorage,private readonly runs:RunService,private readonly corpus?:CorpusSource,private readonly fetchImpl:typeof fetch=fetch){}
  async create(principal:Principal,input:{readonly name:string;readonly side:"white"|"black";readonly targetElo:number;readonly coverageDenominator:number;readonly source:{readonly kind:"pgn";readonly pgn:string}|{readonly kind:"lichess_study";readonly url:string}},at=new Date().toISOString()){
    this.runs.validateOpponentPolicy({mode:"human_common",targetElo:input.targetElo});const resolved=input.source.kind==="pgn"?{pgn:input.source.pgn,sourceKind:"pgn_paste" as const,sourceUrl:null,licenceNote:"no-rights-asserted: learner-supplied bytes"}:await resolveStudySource(input.source.url,this.fetchImpl);let parsed;try{parsed=parseRepertoirePgn(resolved.pgn,input.side);}catch(error){if(error instanceof RepertoirePgnError)throw new ServerError(error.kind==="invalid"?"IMPORT_INVALID_PGN":"REPERTOIRE_IMPORT_LIMIT",error.message);throw error;}
    const id=`repertoire-${randomUUID()}`,moves=parsed.moves.map((move)=>Object.freeze({...move,repertoireId:id,origin:"imported" as const,createdAt:at}));const digest=repertoireDigest(input.side,parsed.rootFen,moves),record:RepertoireRecord=Object.freeze({id,ownerLearnerId:principal.learnerId,name:input.name,side:input.side,rootFen:parsed.rootFen,targetElo:input.targetElo,coverageDenominator:input.coverageDenominator,sourceKind:resolved.sourceKind,sourceUrl:resolved.sourceUrl,originalPgn:resolved.pgn,licenceNote:resolved.licenceNote,digest,createdAt:at,updatedAt:at});this.#required("createRepertoire")(record,moves);return this.view(record);
  }
  list(principal:Principal){return Object.freeze(this.#required("repertoires")(principal.learnerId).map((record)=>this.summary(record)));}
  get(id:string,principal:Principal){return this.view(this.#owned(id,principal));}
  remove(id:string,principal:Principal):void{this.#owned(id,principal);this.#required("deleteRepertoire")(id,principal.learnerId);}
  queueScan(id:string,principal:Principal):{queued:true}{const record=this.#owned(id,principal);if(this.corpus===undefined)throw new ServerError("REPERTOIRE_SCAN_UNAVAILABLE","Corpus source is unavailable");if(!this.#jobs.has(id)){const job=scanRepertoire(record,this.#required("repertoireMoves")(id),this.corpus).then((scan)=>this.#required("saveRepertoireScan")(scan)).finally(()=>this.#jobs.delete(id));this.#jobs.set(id,job);}return {queued:true};}
  async waitForScan(id:string):Promise<void>{await this.#jobs.get(id);}
  gaps(id:string,principal:Principal){const record=this.#owned(id,principal),scan=this.#required("repertoireScan")(id);if(scan===undefined)return Object.freeze({status:this.#jobs.has(id)?"pending":"never_scanned",repertoire:this.summary(record),scan:null});const enrich=(raw:unknown)=>Array.isArray(raw)?raw.map((item)=>{const gap=item as GapRow;const link=this.#required("repertoireGapRun")(id,gap.key),answered=this.#required("repertoireMoves")(id).some((move)=>move.positionKey===gap.key);return Object.freeze({...gap,state:answered?"answered":link!==undefined&&this.#required("repertoireGapAttemptCount")(link.runId)>0?"addressed":"open",runId:link?.runId??null});}):[];return Object.freeze({status:"ready",stale:scan.repertoireDigest!==record.digest,repertoire:this.summary(record),scan:Object.freeze({...scan,gaps:Object.freeze(enrich(scan.gaps)),alternateGaps:Object.freeze(enrich(scan.alternateGaps)),guard:REPERTOIRE_CORPUS_GUARD,partiality:scan.truncated?`Scan stopped after ${scan.queriesUsed} corpus queries; ${scan.unreachedKeys} positions unexplored`:scan.sourceFailures>0?`${scan.sourceFailures} corpus positions were unavailable`:null})});}
  async enter(id:string,principal:Principal,gapKey:string,resistance:"human_common"|"strong_engine"="human_common"){const record=this.#owned(id,principal),scan=this.#required("repertoireScan")(id);if(scan===undefined)throw new ServerError("REPERTOIRE_SCAN_UNAVAILABLE","Scan the repertoire before entering a gap");const all=[...(scan.gaps as GapRow[]),...(scan.alternateGaps as AlternateGapRow[])],gap=all.find((item)=>item.key===gapKey);if(gap===undefined)throw new ServerError("REPERTOIRE_NOT_FOUND","Gap not found");const prior=this.#required("repertoireGapRun")(id,gapKey);if(prior!==undefined)return Object.freeze({runId:prior.runId,writerId:null,alreadyEntered:true});const result=await this.runs.createRepertoireGapRun({repertoireId:id,gapKey,fen:gap.representativeFen,side:record.side,targetElo:record.targetElo,resistance,learnerId:principal.learnerId});return Object.freeze({...result,alreadyEntered:false});}
  chooseAnswer(id:string,principal:Principal,input:{positionKey:string;moveUci:string;ifMatch:string},at=new Date().toISOString()){const record=this.#owned(id,principal),scan=this.#required("repertoireScan")(id),all=scan===undefined?[]:[...(scan.gaps as GapRow[]),...(scan.alternateGaps as AlternateGapRow[])],gap=all.find((item)=>item.key===input.positionKey);if(gap===undefined)throw new ServerError("REPERTOIRE_NOT_FOUND","Gap position not found");const validated=play(gap.representativeFen,input.moveUci),current=this.#required("repertoireMoves")(id),nextMoves=[...current.map((move)=>move.positionKey===input.positionKey?Object.freeze({...move,rank:move.rank+1}):move),Object.freeze({repertoireId:id,positionKey:input.positionKey,moveUci:input.moveUci,moveSan:validated.san,representativeFen:gap.representativeFen,rank:0,origin:"chosen_from_attempt" as const,createdAt:at})],nextDigest=repertoireDigest(record.side,record.rootFen,nextMoves);this.#required("addRepertoireAnswer")(nextMoves.at(-1)!,input.ifMatch,nextDigest,at);return this.get(id,principal);}
  summary(record:RepertoireRecord){const scan=this.#required("repertoireScan")(record.id);return Object.freeze({id:record.id,name:record.name,side:record.side,targetElo:record.targetElo,coverageDenominator:record.coverageDenominator,digest:record.digest,updatedAt:record.updatedAt,scan:scan===undefined?null:{scannedAt:scan.scannedAt,stale:scan.repertoireDigest!==record.digest,truncated:scan.truncated,gapCount:Array.isArray(scan.gaps)?scan.gaps.length:0}});}
  view(record:RepertoireRecord){return Object.freeze({...this.summary(record),rootFen:record.rootFen,sourceKind:record.sourceKind,sourceUrl:record.sourceUrl,licenceNote:record.licenceNote,moves:this.#required("repertoireMoves")(record.id)});}
  recommendations(principal:Principal){const rows=[] as Array<Record<string,unknown>>;for(const record of this.#required("repertoires")(principal.learnerId)){const scan=this.#required("repertoireScan")(record.id);if(scan===undefined||!Array.isArray(scan.gaps))continue;for(const gap of scan.gaps as GapRow[]){if(this.#required("repertoireGapRun")(record.id,gap.key)!==undefined)continue;rows.push(Object.freeze({kind:"repertoire_gap",repertoireId:record.id,repertoireName:record.name,gapKey:gap.key,replySan:gap.replySan,line:gap.line,mass:gap.mass,gamesUntilSeen:gap.gamesUntilSeen,sentence:`Your repertoire ${record.name} has no answer to ${gap.replySan} after ${gap.line.join(" ")}; this population reached it about once every ${gap.gamesUntilSeen} games. ${REPERTOIRE_CORPUS_GUARD}`}));}}return Object.freeze(rows.sort((left,right)=>Number(right.mass)-Number(left.mass)||String(left.gapKey).localeCompare(String(right.gapKey))).slice(0,10));}
  #owned(id:string,principal:Principal):RepertoireRecord{const record=this.#required("repertoire")(id);if(record===undefined||record.ownerLearnerId!==principal.learnerId)throw new ServerError("REPERTOIRE_NOT_FOUND","Repertoire not found");return record;}
  #required<K extends keyof RunStorage>(key:K):NonNullable<RunStorage[K]>{const value=this.storage[key];if(typeof value!=="function")throw new ServerError("STORAGE_FAILURE","Repertoire storage is unavailable");return value.bind(this.storage) as NonNullable<RunStorage[K]>;}
}
