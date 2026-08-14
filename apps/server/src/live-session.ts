import { randomUUID } from "node:crypto";

import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { parseUci } from "chessops/util";
import { canonicalRunStart, commitMove, fork, type DrillRun } from "@chess-tabiya/runtime";

import { mayControlSession, mayPropose, mayVote, requireRead, requireWrite, type Principal } from "./authorization.js";
import { ServerError } from "./errors.js";
import type { ArenaLeg, BoardControl, LiveSession, LiveSessionDetail, SessionKind, SessionProposal, VoteOption, VoteTally } from "./live-types.js";
import type { LeaseHolder, LiveSessionStorage, RunStorage } from "./storage.js";
import type { RunService } from "./service.js";
import { parsePgnMainline, PgnImportError } from "./pgn-import.js";

type Storage = RunStorage & LiveSessionStorage;

export interface MoveAuthorship { readonly eventSeq:number;readonly nodeId:string;readonly learnerId:string|null }
export function deriveMoveAuthorship(run:DrillRun,journal:readonly import("./live-types.js").SessionJournalEntry[],ownerLearnerId:string):readonly MoveAuthorship[]{
  const grants=journal.filter((entry)=>entry.kind==="board.granted").sort((a,b)=>(a.runSeq??-1)-(b.runSeq??-1)||a.seq-b.seq);
  const openedAt=journal.find((entry)=>entry.kind==="session.opened")?.runSeq??0;
  return Object.freeze(run.events.filter((event)=>event.type==="move.committed").map((event)=>{
    const holder=[...grants].reverse().find((entry)=>(entry.runSeq??-1)<event.seq);
    return Object.freeze({eventSeq:event.seq,nodeId:event.data.node.id,learnerId:event.seq<=openedAt?ownerLearnerId:holder?.actorLearnerId??ownerLearnerId});
  }));
}

function canonicalFen(fen: string): string {
  return makeFen(Chess.fromSetup(parseFen(fen).unwrap()).unwrap().toSetup());
}

function legalAt(run: DrillRun, nodeId: string, moveUci: string): void {
  const node = run.nodes.find((candidate) => candidate.id === nodeId);
  if (node === undefined) throw new ServerError("INVALID_REQUEST", `Unknown node: ${nodeId}`);
  const position = Chess.fromSetup(parseFen(node.fen).unwrap()).unwrap();
  const move = parseUci(moveUci);
  if (move === undefined || !position.isLegal(move)) {
    throw new ServerError("INVALID_REQUEST", `Illegal move ${moveUci} at ${nodeId}`);
  }
}

export class LiveSessionService {
  readonly #storage: Storage;
  readonly #runs: RunService | undefined;
  readonly #now: () => string;

  constructor(storage: Storage, options: { readonly now?: () => string; readonly runService?: RunService } = {}) {
    this.#storage = storage;
    this.#runs = options.runService;
    this.#now = options.now ?? (() => new Date().toISOString());
  }

  create(principal: Principal, input: {
    readonly runId: string; readonly kind: SessionKind; readonly title: string;
    readonly boardControl?: BoardControl; readonly scheduledFor?: string;
    readonly voteAdapterHandle?: string; readonly rotationHandles?: readonly string[];
  }): LiveSession {
    const { role } = requireRead(this.#storage,input.runId,principal);
    if (!mayControlSession(role)) throw new ServerError("FORBIDDEN","Only a host may create a live session");
    const adapter = input.voteAdapterHandle === undefined ? undefined : this.#storage.learnerByHandle(input.voteAdapterHandle.toLowerCase());
    if (input.voteAdapterHandle !== undefined && adapter === undefined) throw new ServerError("INVALID_REQUEST","Unknown vote adapter handle");
    if (adapter !== undefined && this.#storage.runRole(input.runId,adapter.id) === undefined) throw new ServerError("INVALID_REQUEST","Vote adapter needs a run grant");
    const rotation = input.rotationHandles?.map((handle) => {
      const learner=this.#storage.learnerByHandle(handle.toLowerCase());
      if(learner===undefined)throw new ServerError("INVALID_REQUEST",`Unknown rotation learner: ${handle}`);
      const role=this.#storage.runRole(input.runId,learner.id);
      if(role!=="host"&&role!=="participant")throw new ServerError("INVALID_REQUEST",`Rotation learner ${handle} needs write access`);
      return learner.id;
    });
    const boardControl=input.boardControl??"host_directed";
    if(boardControl==="rotation"&&(!rotation||rotation.length===0))throw new ServerError("INVALID_REQUEST","rotation board control requires rotationHandles");
    return this.#storage.createLiveSession({id:randomUUID(),runId:input.runId,kind:input.kind,title:input.title,boardControl,
      ...(input.scheduledFor===undefined?{}:{scheduledFor:input.scheduledFor}),...(adapter===undefined?{}:{voteAdapterLearnerId:adapter.id}),
      ...(rotation===undefined?{}:{rotation:Object.freeze(rotation)}),createdBy:principal.learnerId,at:this.#now()});
  }

  list(principal: Principal): readonly LiveSession[] { return this.#storage.listLiveSessions(principal.learnerId); }

  detail(sessionId:string,principal:Principal):LiveSessionDetail {
    const session=this.#required(sessionId,principal);
    const stored=requireRead(this.#storage,session.runId,principal).stored;
    const holder=this.#storage.learnerById(stored.activeWriterLearnerId);if(holder===undefined)throw new ServerError("STORAGE_FAILURE","Run lease holder is missing");
    const proposals=this.#storage.proposals(sessionId);
    const latest=this.#storage.voteWindow(sessionId);
    return Object.freeze({session,role:this.#storage.runRole(session.runId,principal.learnerId)!,activeNodeId:stored.run.activeCursor.nodeId,leaseHeldBy:{learnerId:holder.id,handle:holder.handle},grants:this.#storage.grants(session.runId),proposals,
      ...(latest===undefined?{}:{vote:this.#tallyWithDerivedState(session,latest.id)}),invitations:this.#storage.invitations(sessionId),legs:this.#storage.arenaLegs(sessionId)});
  }

  close(sessionId:string,principal:Principal):LiveSession { const session=this.#requiredControl(sessionId,principal);return this.#storage.closeLiveSession(session.id,principal.learnerId,this.#now()); }

  journal(sessionId:string,principal:Principal,sinceSeq:number){this.#required(sessionId,principal);const entries=this.#storage.sessionJournal(sessionId,sinceSeq);return Object.freeze({entries,nextSeq:entries.at(-1)?.seq??sinceSeq});}

  board(sessionId:string,principal:Principal,writerId:string,operation:{readonly op:"offer"|"withdraw"|"advance"|"reclaim";readonly handle?:string}):LiveSession {
    const session=this.#requiredControl(sessionId,principal);
    const learner=operation.handle===undefined?undefined:this.#storage.learnerByHandle(operation.handle.toLowerCase());
    if(operation.op==="offer"&&learner===undefined)throw new ServerError("INVALID_REQUEST","offer requires a known handle");
    return this.#storage.boardOperation(session.id,principal.learnerId,{op:operation.op,...(learner===undefined?{}:{learnerId:learner.id}),...(operation.op==="reclaim"?{writerId}:{})},this.#now());
  }

  propose(sessionId:string,principal:Principal,nodeId:string,moveUci:string):SessionProposal {
    const session=this.#requiredOpen(sessionId,principal);const role=this.#storage.runRole(session.runId,principal.learnerId)!;
    if(!mayPropose(role))throw new ServerError("FORBIDDEN","Spectators may not propose moves");
    const run=requireRead(this.#storage,session.runId,principal).stored.run;legalAt(run,nodeId,moveUci);
    return this.#storage.createProposal({id:randomUUID(),sessionId,nodeId,moveUci,proposedBy:principal.learnerId,at:this.#now()});
  }

  proposals(sessionId:string,principal:Principal):readonly SessionProposal[]{this.#required(sessionId,principal);return this.#storage.proposals(sessionId);}

  resolveProposal(sessionId:string,proposalId:string,principal:Principal,writerId:string,op:"apply"|"decline"):SessionProposal {
    const session=this.#requiredControl(sessionId,principal);if(session.closedAt!==undefined)throw new ServerError("INVALID_REQUEST","The live session is closed");const proposal=this.#storage.proposals(sessionId).find((item)=>item.id===proposalId);
    if(proposal===undefined)throw new ServerError("INVALID_REQUEST","Unknown proposal");
    let seq=requireRead(this.#storage,session.runId,principal).stored.run.events.at(-1)?.seq??0;
    if(op==="apply"){
      const access=requireWrite(this.#storage,session.runId,principal,writerId);
      if(access.stored.run.activeCursor.nodeId!==proposal.nodeId)throw new ServerError("INVALID_REQUEST","Proposal is stale");
      const result=this.#runs===undefined
        ? (()=>{const committed=commitMove(access.stored.run,proposal.moveUci,{actor:"user",at:this.#now()});this.#storage.save(committed.run,access.lease);return committed;})()
        : this.#runs.move(session.runId,principal,writerId,proposal.moveUci,{actor:"user",at:this.#now()});
      seq=result.run.events.at(-1)?.seq??seq;
    }
    return this.#storage.resolveProposal(proposalId,op==="apply"?"applied":"declined",seq,principal.learnerId,this.#now());
  }

  openVote(sessionId:string,principal:Principal,input:{readonly nodeId:string;readonly prompt:string;readonly options:readonly VoteOption[];readonly durationSeconds:number}):VoteTally {
    const session=this.#requiredControl(sessionId,principal);if(session.closedAt!==undefined)throw new ServerError("INVALID_REQUEST","The live session is closed");const run=requireRead(this.#storage,session.runId,principal).stored.run;
    if(input.options.length<2||input.options.length>8)throw new ServerError("INVALID_REQUEST","A vote needs 2–8 options");
    if(!Number.isSafeInteger(input.durationSeconds)||input.durationSeconds<15||input.durationSeconds>600)throw new ServerError("INVALID_REQUEST","durationSeconds must be 15–600");
    for(const option of input.options)legalAt(run,input.nodeId,option.moveUci);
    const opensAt=this.#now();const closesAt=new Date(Date.parse(opensAt)+input.durationSeconds*1000).toISOString();
    const window=this.#storage.createVoteWindow({id:randomUUID(),sessionId,nodeId:input.nodeId,prompt:input.prompt,options:Object.freeze([...input.options]),opensAt,closesAt},principal.learnerId);
    return this.#storage.voteTally(sessionId,window.id);
  }

  castVote(sessionId:string,principal:Principal,input:{readonly windowId:string;readonly choiceUci:string;readonly voterKey?:string}):VoteTally {
    const session=this.#requiredOpen(sessionId,principal);const role=this.#storage.runRole(session.runId,principal.learnerId)!;if(!mayVote(role))throw new ServerError("FORBIDDEN","This role may not vote");
    const window=this.#storage.voteWindow(sessionId,input.windowId);if(window===undefined)throw new ServerError("INVALID_REQUEST","Unknown vote window");
    const derived=this.#derivedVoteState(session,window);if(derived!=="open"){if(window.state==="open")this.#storage.transitionVoteWindow(sessionId,input.windowId,derived,this.#now());throw new ServerError("VOTE_WINDOW_CLOSED","The vote window is closed");}
    if(!window.options.some((option)=>option.moveUci===input.choiceUci))throw new ServerError("INVALID_REQUEST","choiceUci is not a vote option");
    let voterKey=`learner:${principal.learnerId}`;
    if(input.voterKey!==undefined){
      if(session.voteAdapterLearnerId===undefined||session.voteAdapterLearnerId!==principal.learnerId)throw new ServerError("INVALID_REQUEST","Only the configured adapter may supply voterKey");
      if(input.voterKey.length>128)throw new ServerError("INVALID_REQUEST","voterKey cannot exceed 128 characters");
      voterKey=`chat:${principal.learnerId}:${input.voterKey}`;
    }
    const capacity=this.#storage.voteCapacity(sessionId,input.windowId,voterKey);
    if(!capacity.exists&&capacity.total>=50_000)throw new ServerError("VOTE_INTAKE_FULL","The vote window intake is full");
    this.#storage.castVote({sessionId,windowId:input.windowId,voterKey,choiceUci:input.choiceUci,castByLearnerId:principal.learnerId,at:this.#now()});
    return this.#storage.voteTally(sessionId,input.windowId);
  }

  closeVote(sessionId:string,principal:Principal,windowId:string,appliedOptionUci?:string):VoteTally {
    const session=this.#requiredControl(sessionId,principal);if(session.closedAt!==undefined)throw new ServerError("INVALID_REQUEST","The live session is closed");const window=this.#storage.voteWindow(sessionId,windowId);if(window===undefined)throw new ServerError("INVALID_REQUEST","Unknown vote window");
    if(appliedOptionUci!==undefined&&!window.options.some((item)=>item.moveUci===appliedOptionUci))throw new ServerError("INVALID_REQUEST","Applied move is not a vote option");
    this.#storage.closeVoteWindow(sessionId,windowId,principal.learnerId,this.#now(),appliedOptionUci);return this.#storage.voteTally(sessionId,windowId);
  }

  tally(sessionId:string,windowId:string,principal:Principal):VoteTally {const session=this.#required(sessionId,principal);return this.#tallyWithDerivedState(session,windowId);}

  invite(sessionId:string,principal:Principal,input:{readonly leg?:1|2;readonly handle?:string;readonly externalChallengeUrl?:string}) {
    const session=this.#requiredControl(sessionId,principal);if(session.closedAt!==undefined)throw new ServerError("INVALID_REQUEST","The live session is closed");
    if(input.externalChallengeUrl!==undefined){let url:URL;try{url=new URL(input.externalChallengeUrl);}catch{throw new ServerError("INVALID_REQUEST","externalChallengeUrl must be an https URL");}if(url.protocol!=="https:")throw new ServerError("INVALID_REQUEST","externalChallengeUrl must be an https URL");}
    if(input.handle!==undefined){const learner=this.#storage.learnerByHandle(input.handle.toLowerCase());if(learner===undefined)throw new ServerError("INVALID_REQUEST","Unknown invited handle");this.#storage.grantRole(session.runId,learner.id,"participant",{writerId:requireRead(this.#storage,session.runId,principal).stored.activeWriterId,learnerId:principal.learnerId},this.#now());}
    return this.#storage.createInvitation({sessionId,leg:input.leg??null,invitedHandle:input.handle??null,invitedRole:"participant",externalChallengeUrl:input.externalChallengeUrl??null,at:this.#now()});
  }

  importLeg(sessionId:string,legNo:1|2,principal:Principal,writerId:string,pgn:string,result?:ArenaLeg["result"]):ArenaLeg {
    const session=this.#requiredOpen(sessionId,principal);if(session.kind!=="match")throw new ServerError("INVALID_REQUEST","PGN legs require a match session");
    const role=this.#storage.runRole(session.runId,principal.learnerId)!;const invitation=this.#storage.invitations(sessionId).find((item)=>item.leg===legNo&&item.invitedHandle===principal.handle);
    if(!mayControlSession(role)&&invitation===undefined)throw new ServerError("FORBIDDEN","Only the host or invited learner may import this leg");
    let parsed;try{parsed=parsePgnMainline(pgn);}catch(error){if(error instanceof PgnImportError)throw new ServerError("INVALID_REQUEST",error.message);throw error;}
    const access=requireWrite(this.#storage,session.runId,principal,writerId);const root=access.stored.run.nodes.find((node)=>node.parentId===null)!;
    if(parsed.rootFen!==canonicalRunStart({fen:root.fen,side:access.stored.run.start.side}).fen)throw new ServerError("ARENA_ROOT_MISMATCH","PGN start position differs from the arena root");
    let next=access.stored.run;
    if(legNo===2)next=fork(next,root.id,{label:"Leg 2",origin:"played",at:this.#now()}).run;
    else if(next.activeCursor.nodeId!==root.id||next.nodes.length>1)throw new ServerError("INVALID_REQUEST","Leg 1 requires an untouched arena run");
    for(const data of parsed.moves){const actor=next.nodes.find((node)=>node.id===next.activeCursor.nodeId)!.fen.split(" ")[1]===next.start.side[0]?"user":"system";next=commitMove(next,data.uci,{actor,at:this.#now()}).run;}
    const existing=this.#storage.arenaLegs(sessionId).find((item)=>item.leg===legNo)!;if(existing.branchId!==null)throw new ServerError("INVALID_REQUEST","Arena leg was already imported");
    const branchId=next.activeCursor.branchId;const leg:Object & ArenaLeg=Object.freeze({...existing,pgn,result:result??parsed.result,branchId,importedAt:this.#now(),referencePlayerHandle:principal.handle});
    this.#storage.saveArenaImport(next,access.lease,leg,principal.learnerId,this.#now());return leg;
  }

  sessionForRun(runId:string,principal:Principal):LiveSession|undefined {const session=this.#storage.liveSessionByRun(runId);if(session===undefined)return undefined;requireRead(this.#storage,runId,principal);return session;}

  #required(sessionId:string,principal:Principal):LiveSession {const session=this.#storage.liveSession(sessionId);if(session===undefined)throw new ServerError("RUN_NOT_FOUND",`Unknown session: ${sessionId}`);requireRead(this.#storage,session.runId,principal);return session;}
  #requiredOpen(sessionId:string,principal:Principal):LiveSession {const session=this.#required(sessionId,principal);if(session.closedAt!==undefined)throw new ServerError("INVALID_REQUEST","The live session is closed");return session;}
  #requiredControl(sessionId:string,principal:Principal):LiveSession {const session=this.#required(sessionId,principal);const role=this.#storage.runRole(session.runId,principal.learnerId)!;if(!mayControlSession(role))throw new ServerError("FORBIDDEN","Only a host may control the session");return session;}
  #derivedVoteState(session:LiveSession,window:{readonly state:string;readonly nodeId:string;readonly closesAt:string}):"open"|"closed"|"stale" {if(window.state!=="open")return window.state as "closed"|"stale";if(Date.parse(window.closesAt)<=Date.parse(this.#now()))return "closed";const run=this.#storage.read(session.runId)?.run;return run?.activeCursor.nodeId===window.nodeId?"open":"stale";}
  #tallyWithDerivedState(session:LiveSession,windowId:string):VoteTally {let tally=this.#storage.voteTally(session.id,windowId);const state=this.#derivedVoteState(session,tally.window);if(state!==tally.window.state&&state!=="open"){this.#storage.transitionVoteWindow(session.id,windowId,state,this.#now());tally=this.#storage.voteTally(session.id,windowId);}return tally;}
}
