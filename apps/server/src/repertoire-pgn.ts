import { parsePgn, startingPosition, type ChildNode, type PgnNodeData } from "chessops/pgn";
import { parseSan } from "chessops/san";
import { makeUci } from "chessops/util";
import type { Position } from "chessops/chess";

import { canonicalFen, transposeKey } from "@chess-tabiya/runtime";

export interface ParsedRepertoireMove {
  readonly positionKey:string;
  readonly moveUci:string;
  readonly moveSan:string;
  readonly representativeFen:string;
  readonly rank:number;
}

export interface ParsedRepertoirePgn {
  readonly rootFen:string;
  readonly moves:readonly ParsedRepertoireMove[];
  readonly games:number;
  readonly plies:number;
}

export class RepertoirePgnError extends Error {
  constructor(readonly kind:"invalid"|"games"|"plies"|"keys",message:string){super(message);this.name="RepertoirePgnError";}
}

function seedFen(position:Position):string{return `${transposeKey(canonicalFen(position))} 0 1`;}

export function parseRepertoirePgn(pgn:string,side:"white"|"black"):ParsedRepertoirePgn{
  let games;try{games=parsePgn(pgn);}catch{throw new RepertoirePgnError("invalid","PGN could not be parsed");}
  if(games.length===0)throw new RepertoirePgnError("invalid","PGN must contain at least one game");
  if(games.length>64)throw new RepertoirePgnError("games","Repertoire PGN exceeds 64 games or chapters");
  let rootFen:string|undefined,totalPlies=0;
  const byKey=new Map<string,Map<string,ParsedRepertoireMove>>();
  const visit=(node:ChildNode<PgnNodeData>,position:Position,gameIndex:number,ply:number):void=>{
    totalPlies+=1;if(totalPlies>10_000)throw new RepertoirePgnError("plies","Repertoire PGN exceeds 10,000 total plies");
    const before=seedFen(position),move=parseSan(position,node.data.san);
    if(move===undefined||!position.isLegal(move))throw new RepertoirePgnError("invalid",`Illegal PGN move in game ${gameIndex+1} at ply ${ply}: ${node.data.san}`);
    if(position.turn===side){const key=transposeKey(before),uci=makeUci(move),answers=byKey.get(key)??new Map<string,ParsedRepertoireMove>();if(!answers.has(uci)){answers.set(uci,Object.freeze({positionKey:key,moveUci:uci,moveSan:node.data.san,representativeFen:before,rank:answers.size}));byKey.set(key,answers);if(byKey.size>3_000)throw new RepertoirePgnError("keys","Repertoire PGN exceeds 3,000 learner-side answer keys");}}
    const next=position.clone();next.play(move);for(const child of node.children)visit(child,next.clone(),gameIndex,ply+1);
  };
  games.forEach((game,gameIndex)=>{const variant=game.headers.get("Variant");if(variant!==undefined&&variant!=="Standard"&&variant!=="From Position")throw new RepertoirePgnError("invalid",`Unsupported PGN variant in game ${gameIndex+1}: ${variant}`);let position:Position;try{position=startingPosition(game.headers).unwrap();}catch{throw new RepertoirePgnError("invalid",`Game ${gameIndex+1} has an invalid starting position`);}if(rootFen===undefined)rootFen=seedFen(position);for(const child of game.moves.children)visit(child,position.clone(),gameIndex,1);});
  return Object.freeze({rootFen:rootFen!,moves:Object.freeze([...byKey.values()].flatMap((answers)=>[...answers.values()])),games:games.length,plies:totalPlies});
}
