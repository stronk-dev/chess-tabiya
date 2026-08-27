import { createHash, randomBytes, randomUUID } from "node:crypto";

import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { parseUci } from "chessops/util";
import { canonicalRunStart, commitMove, fork, type DrillRun } from "@chess-tabiya/runtime";

import { mayControlSession, mayPropose, mayVote, requireRead, requireWrite, type Principal } from "./authorization.js";
import { ServerError } from "./errors.js";
import type { ArenaLeg, BoardControl, LiveSession, LiveSessionDetail, LiveSessionSummary, MatchState, SessionKind, SessionProposal, VoteOption, VoteTally } from "./live-types.js";
import type { ClassroomStorage, LeaseHolder, LiveSessionStorage, PublicTokenRecord, RunRole, RunStorage } from "./storage.js";
import type { RunService } from "./service.js";
import { parsePgnMainline, PgnImportError } from "./pgn-import.js";

type Storage = RunStorage & LiveSessionStorage & ClassroomStorage;

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

  #classroomIdentity(session: LiveSession, principal: Principal): { readonly id: string; readonly name: string } | undefined {
    if (session.classroomId === undefined) return undefined;
    const membership = this.#storage.classroomMember(session.classroomId, principal.learnerId);
    if (membership?.state !== "active") return undefined;
    const classroom = this.#storage.classroom(session.classroomId);
    return classroom === undefined ? undefined : Object.freeze({ id: classroom.id, name: classroom.name });
  }

  create(principal: Principal, input: {
    readonly runId: string; readonly kind: SessionKind; readonly title: string;
    readonly boardControl?: BoardControl; readonly scheduledFor?: string;
    readonly voteAdapterHandle?: string; readonly rotationHandles?: readonly string[];
    readonly matchPlayers?: { readonly white?: string; readonly black?: string };
    readonly classroomId?: string;
  }): LiveSession {
    const { role } = requireRead(this.#storage,input.runId,principal);
    if (!mayControlSession(role)) throw new ServerError("FORBIDDEN","Only a host may create a live session");
    if (input.classroomId !== undefined) {
      const member = this.#storage.classroomMember(input.classroomId, principal.learnerId);
      const classroom = this.#storage.classroom(input.classroomId);
      if (classroom === undefined || classroom.archivedAt !== null || member?.state !== "active" || member.memberRole !== "teacher") {
        throw new ServerError("INVALID_REQUEST", "Classroom is unavailable");
      }
    }
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
    let matchPlayers:{readonly whiteLearnerId:string|null;readonly blackLearnerId:string|null}|undefined;
    if(boardControl==="match"){
      if(input.kind!=="match")throw new ServerError("INVALID_REQUEST","match board control requires match session kind");
      const stored=requireRead(this.#storage,input.runId,principal).stored.run;
      if(stored.sessionKind!=="position"||stored.events.some((event)=>event.type==="move.committed"))throw new ServerError("INVALID_REQUEST","A native match requires an untouched position run");
      const resolve=(handle:string|undefined)=>{if(handle===undefined)return null;const learner=this.#storage.learnerByHandle(handle.toLowerCase());if(learner===undefined)throw new ServerError("INVALID_REQUEST",`Unknown match player: ${handle}`);return learner.id;};
      matchPlayers=Object.freeze({whiteLearnerId:resolve(input.matchPlayers?.white),blackLearnerId:resolve(input.matchPlayers?.black)});
      if(matchPlayers.whiteLearnerId===null&&matchPlayers.blackLearnerId===null)throw new ServerError("INVALID_REQUEST","A native match needs at least one named player");
      if(matchPlayers.whiteLearnerId!==null&&matchPlayers.whiteLearnerId===matchPlayers.blackLearnerId)throw new ServerError("INVALID_REQUEST","Match players must be distinct");
    }else if(input.matchPlayers!==undefined)throw new ServerError("INVALID_REQUEST","matchPlayers requires match board control");
    return this.#storage.createLiveSession({id:randomUUID(),runId:input.runId,kind:input.kind,title:input.title,boardControl,
      ...(input.scheduledFor===undefined?{}:{scheduledFor:input.scheduledFor}),...(adapter===undefined?{}:{voteAdapterLearnerId:adapter.id}),
      ...(rotation===undefined?{}:{rotation:Object.freeze(rotation)}),...(matchPlayers===undefined?{}:{matchPlayers}),
      ...(input.classroomId===undefined?{}:{classroomId:input.classroomId}),createdBy:principal.learnerId,at:this.#now()});
  }

  list(principal: Principal): readonly LiveSessionSummary[] { return Object.freeze(this.#storage.listLiveSessions(principal.learnerId).map((session)=>{
    const stored=this.#storage.read(session.runId);if(stored===undefined)throw new ServerError("STORAGE_FAILURE","Session run is missing");
    const node=stored.run.nodes.find((candidate)=>candidate.id===stored.run.activeCursor.nodeId);if(node===undefined)throw new ServerError("STORAGE_FAILURE","Session cursor is missing");
    const holder=this.#storage.learnerById(stored.activeWriterLearnerId);if(holder===undefined)throw new ServerError("STORAGE_FAILURE","Run lease holder is missing");
    const main=stored.run.branches[0]!,plies=stored.run.nodes.filter((candidate)=>candidate.branchId===main.id&&candidate.parentId!==null);
    const match=this.#storage.matchState(session.id);
    const player=(learnerId:string|null)=>{if(learnerId===null)return null;const learner=this.#storage.learnerById(learnerId);if(learner===undefined)throw new ServerError("STORAGE_FAILURE","Match player is missing");return Object.freeze({learnerId:learner.id,handle:learner.handle});};
    const classroom=this.#classroomIdentity(session,principal);
    return Object.freeze({...session,...(classroom===undefined?{}:{classroom}),board:Object.freeze({activeFen:node.fen,objectiveState:node.objectiveState,sideToMove:node.fen.split(" ")[1]==="w"?"white" as const:"black" as const,plyCount:plies.length,pausedAt:match?.pausedAt??null,leaseHeldBy:Object.freeze({learnerId:holder.id,handle:holder.handle}),lastMoveAt:plies.at(-1)?.createdAt??null,...(match===undefined?{}:{players:Object.freeze({white:player(match.whiteLearnerId),black:player(match.blackLearnerId)})})}),...(match===undefined?{}:{match})});
  })); }

  detail(sessionId:string,principal:Principal):LiveSessionDetail {
    const session=this.#required(sessionId,principal);
    const stored=requireRead(this.#storage,session.runId,principal).stored;
    const holder=this.#storage.learnerById(stored.activeWriterLearnerId);if(holder===undefined)throw new ServerError("STORAGE_FAILURE","Run lease holder is missing");
    const proposals=this.#storage.proposals(sessionId);
    const latest=this.#storage.voteWindow(sessionId);
    const match=this.#storage.matchState(sessionId);
    const voteAdapter=session.voteAdapterLearnerId===undefined?undefined:this.#storage.learnerById(session.voteAdapterLearnerId);
    const moveAuthorship=deriveMoveAuthorship(stored.run,this.#storage.sessionJournal(sessionId,0),session.createdBy);
    const activeNode=stored.run.nodes.find((node)=>node.id===stored.run.activeCursor.nodeId);if(activeNode===undefined)throw new ServerError("STORAGE_FAILURE","Session cursor is missing");
    const storedMarks=this.#storage.relayedRunMarks(session.runId,activeNode.transposeKey,`${stored.run.activeCursor.branchId}:${activeNode.id}`);
    const marks=Object.freeze(storedMarks.slice(0,128).map((mark)=>{const author=this.#storage.learnerById(mark.authorLearnerId);return Object.freeze({scope:mark.scope,brush:mark.brush,orig:mark.orig,...(mark.dest===undefined?{}:{dest:mark.dest}),...(author===undefined?{}:{drawnBy:Object.freeze({learnerId:author.id,handle:author.handle})}),at:mark.at});}));
    const classroom=this.#classroomIdentity(session,principal);
    return Object.freeze({session,...(classroom===undefined?{}:{classroom}),role:this.#storage.runRole(session.runId,principal.learnerId)!,activeNodeId:stored.run.activeCursor.nodeId,leaseHeldBy:{learnerId:holder.id,handle:holder.handle},...(voteAdapter===undefined?{}:{voteAdapter:{learnerId:voteAdapter.id,handle:voteAdapter.handle}}),grants:this.#storage.grants(session.runId),moveAuthorship,proposals,
      ...(latest===undefined?{}:{vote:this.#tallyWithDerivedState(session,latest.id)}),invitations:this.#storage.invitations(sessionId),legs:this.#storage.arenaLegs(sessionId),...(match===undefined?{}:{match}),marks,...(storedMarks.length>128?{marksTruncated:true as const}:{})});
  }

  close(sessionId:string,principal:Principal):LiveSession { const session=this.#requiredControl(sessionId,principal);return this.#storage.closeLiveSession(session.id,principal.learnerId,this.#now()); }

  journal(sessionId:string,principal:Principal,sinceSeq:number){this.#required(sessionId,principal);const entries=this.#storage.sessionJournal(sessionId,sinceSeq);return Object.freeze({entries,nextSeq:entries.at(-1)?.seq??sinceSeq});}

  board(sessionId:string,principal:Principal,writerId:string,operation:{readonly op:"offer"|"withdraw"|"advance"|"reclaim";readonly handle?:string}):LiveSession {
    const session=this.#requiredControl(sessionId,principal);
    const learner=operation.handle===undefined?undefined:this.#storage.learnerByHandle(operation.handle.toLowerCase());
    if(operation.op==="offer"&&learner===undefined)throw new ServerError("INVALID_REQUEST","offer requires a known handle");
    return this.#storage.boardOperation(session.id,principal.learnerId,{op:operation.op,...(learner===undefined?{}:{learnerId:learner.id}),...(operation.op==="reclaim"?{writerId}:{})},this.#now());
  }

  matchOperation(sessionId:string,principal:Principal,writerId:string|undefined,op:"propose_pause"|"accept_pause"|"withdraw_pause"|"pause"|"resume"):MatchState{
    const session=this.#requiredOpen(sessionId,principal);
    if(session.boardControl!=="match")throw new ServerError("INVALID_REQUEST","Operation requires a native match");
    if(op==="resume"){
      if(writerId===undefined)throw new ServerError("INVALID_REQUEST","resume requires x-writer-id");
      const access=requireWrite(this.#storage,session.runId,principal,writerId);
      const primary=access.stored.run.branches[0]!;
      const tip=access.stored.run.nodes.filter((node)=>node.branchId===primary.id).sort((a,b)=>b.ply-a.ply)[0]!;
      if(access.stored.run.activeCursor.nodeId!==tip.id){
        if(this.#runs===undefined)throw new ServerError("STORAGE_FAILURE","Run service is required to resume a match");
        this.#runs.rewind(session.runId,principal,writerId,{nodeId:tip.id},this.#now());
      }
    }
    return this.#storage.updateMatchState(sessionId,principal.learnerId,op,this.#now());
  }

  mintLink(sessionId:string,principal:Principal,input:{readonly matchSlot?:"white"|"black";readonly invitedRole:RunRole;readonly invitedHandle?:string;readonly expiresInDays?:number}){
    const session=this.#requiredControl(sessionId,principal);
    if(session.closedAt!==undefined)throw new ServerError("INVALID_REQUEST","The live session is closed");
    if(input.matchSlot!==undefined&&input.invitedRole!=="participant")throw new ServerError("INVALID_REQUEST","A match seat requires participant role");
    if(input.matchSlot!==undefined){const state=this.#storage.matchState(sessionId);if(state===undefined)throw new ServerError("INVALID_REQUEST","A match seat requires a native match");if((input.matchSlot==="white"?state.whiteLearnerId:state.blackLearnerId)!==null)throw new ServerError("INVALID_REQUEST","The requested match seat is occupied");}
    if(input.invitedHandle!==undefined&&this.#storage.learnerByHandle(input.invitedHandle.toLowerCase())===undefined)throw new ServerError("INVALID_REQUEST","Unknown invited handle");
    const days=input.expiresInDays??14;if(!Number.isSafeInteger(days)||days<1||days>90)throw new ServerError("INVALID_REQUEST","expiresInDays must be 1–90");
    if(this.#storage.sessionJoinTokens(sessionId,principal.learnerId).filter((item)=>item.revokedAt===null&&item.expiresAt>this.#now()&&item.usesRemaining>0).length>=50)throw new ServerError("INVALID_REQUEST","A session may have at most 50 active links");
    const token=randomBytes(32).toString("base64url"),at=this.#now();
    const record:Extract<PublicTokenRecord,{scope:"session_join"}>={id:`join-${randomUUID()}`,tokenHash:createHash("sha256").update(token).digest("hex"),scope:"session_join",sessionId,matchSlot:input.matchSlot??null,invitedRole:input.invitedRole,invitedHandle:input.invitedHandle?.toLowerCase()??null,expiresAt:new Date(Date.parse(at)+days*86_400_000).toISOString(),usesRemaining:1,createdBy:principal.learnerId,createdAt:at,revokedAt:null};
    this.#storage.createSessionJoinToken(record);
    return Object.freeze({id:record.id,token,url:`/shared/${token}`});
  }

  links(sessionId:string,principal:Principal){const session=this.#requiredControl(sessionId,principal);return Object.freeze(this.#storage.sessionJoinTokens(session.id,principal.learnerId).map(({tokenHash,...record})=>record));}

  revokeLink(sessionId:string,linkId:string,principal:Principal):void{const session=this.#requiredControl(sessionId,principal);this.#storage.revokeSessionJoinToken(session.id,linkId,principal.learnerId,this.#now());}

  publicJoin(token:string){const record=this.#storage.publicTokenByHash?.(createHash("sha256").update(token).digest("hex"));if(record?.scope!=="session_join")throw new ServerError("RUN_NOT_FOUND","Shared link not found");const session=this.#storage.liveSession(record.sessionId),host=session===undefined?undefined:this.#storage.learnerById(session.createdBy);if(session===undefined||host===undefined||session.closedAt!==undefined)throw new ServerError("RUN_NOT_FOUND","Shared link not found");return Object.freeze({title:session.title,hostHandle:host.handle});}

  join(token:string,principal:Principal){const redeemed=this.#storage.redeemSessionJoinToken(createHash("sha256").update(token).digest("hex"),principal.learnerId,principal.handle,this.#now());if(redeemed===undefined)throw new ServerError("RUN_NOT_FOUND","Shared link not found");return Object.freeze({session:redeemed.session,runId:redeemed.session.runId});}

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
    const session=this.#requiredOpen(sessionId,principal);if(session.kind!=="match"||session.boardControl==="match")throw new ServerError("INVALID_REQUEST","PGN legs require an imported Arena match session");
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
