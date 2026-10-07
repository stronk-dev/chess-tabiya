// Hand-authored transport fixtures, not chess lessons or successful service results.
export const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const policyConfig = { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } };
const selection = { moveUci: "e7e5", policyModeApplied: "human_common", engine: { id: "fixture", name: "Fixture", version: "1", seedHonored: true } };
const selectBody = { startFen: START, historyUci: [], policy: { mode: "human_common", policyConfigDigest: `sha256:${"a".repeat(64)}` }, seed: 1 };
const createBody = { id: "fixture", session: { kind: "position", start: { fen: START, side: "white" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } }, policyConfig, seed: 1 };
export function fixture(row) {
  const id = row.id, suffix = id.slice(id.lastIndexOf(".") + 1);
  let body = {}, target;
  if (id.startsWith("auth.")) {
    body = id === "auth.import_preview" ? { bundle: {} } : id === "auth.import" ? { password: "fixture", bundle: {} }
      : id === "auth.deletion_preview" || id === "auth.logout" ? {}
        : id === "auth.delete" ? { password: "fixture", previewDigest: "fixture" }
          : id === "auth.export" ? { password: "fixture" } : { handle: "fixture", password: "fixture" };
    target = `identity.${({ export: "exportAccount", deletion_preview: "deletionPreview", delete: "deleteAccount", import_preview: "previewAccountImport", import: "importAccount" })[suffix] ?? suffix}`;
  } else if (id.startsWith("campaign.")) {
    body = suffix === "create" ? { campaignVersion: 1, commandId: "fixture" }
      : suffix === "loadout" ? { equippedModuleIds: [], expectedRevision: 0, commandId: "fixture" }
        : suffix === "submit" ? { runId: "fixture", expectedRevision: 0, commandId: "fixture" } : { expectedRevision: 0, commandId: "fixture" };
    target = `campaigns.${suffix}`;
  } else if (id.startsWith("classroom.")) {
    body = suffix === "create" ? { name: "Fixture" } : suffix === "assign" ? { packId: "fixture" }
      : { op: suffix.startsWith("member_") ? suffix.slice(7) : suffix, handle: "fixture", role: "learner" };
    if (suffix === "archive") body = { op: "archive" };
    target = `classrooms.${({ member_invite: "invite", member_remove: "remove", member_accept: "respond", member_decline: "respond", member_leave: "respond" })[suffix] ?? suffix}`;
  } else if (id.startsWith("assignment.")) {
    body = suffix === "withdraw" ? { op: "withdraw" } : suffix === "submit" ? { runId: "fixture" } : { op: "withdraw", runId: "fixture" };
    target = `classrooms.${({ withdraw: "withdrawAssignment", submit: "submit", submission_withdraw: "withdrawSubmission" })[suffix]}`;
  } else if (id === "shared.join_accept") { body = undefined; target = "live.join"; }
  else if (id.startsWith("shape_draft.")) { body = { document: {} }; target = `shapeStudio.${suffix}`; }
  else if (id.startsWith("pack_draft.")) { body = suffix === "playtest" ? {} : { document: {} }; target = `studio.${suffix}`; }
  else if (id.startsWith("repertoire.")) {
    body = suffix === "create" ? { name: "Fixture", side: "white", targetElo: 1500, coverageDenominator: 100, source: { kind: "pgn", pgn: "1. e4 *" } }
      : suffix === "gap_enter" ? { gapKey: "fixture" } : suffix === "answer" ? { positionKey: "fixture", moveUci: "e2e4", ifMatch: "fixture" } : {};
    if (suffix === "delete") body = undefined;
    target = `repertoires.${({ delete: "remove", scan: "queueScan", gap_enter: "enter", answer: "chooseAnswer" })[suffix] ?? suffix}`;
  } else if (id === "run.create") { body = createBody; target = "service.create"; }
  else if (id === "run.import") { body = { id: "fixture", side: "white", opponentPolicy: { mode: "human_common" }, policyConfig, seed: 1, source: { kind: "pgn", pgn: "1. e4 *" } }; target = "service.importGame"; }
  else if (id === "run.share_revoke") { body = undefined; target = "service.revokeShare"; }
  else if (id === "rated_game.create") { body = { id: "fixture", start: { fen: START }, side: "white", band: 1500, policyConfig, seed: 1 }; target = "service.createRatedGame"; }
  else if (id === "learner_profile.share_card") { body = { metricId: "fixture", consent: true }; target = "learnerProfile.shareCard"; }
  else if (id === "progress.schedule_dismiss") { body = { op: "dismiss" }; target = "service.dismissSchedule"; }
  else if (id === "opponent.select") { body = selectBody; target = "selector.selectWithReceipt"; }
  else if (id.startsWith("cohort_standing.")) {
    const op = ({ show_rating: "showRating", hide_rating: "hideRating", show_record: "showRecord", hide_record: "hideRecord" })[suffix] ?? suffix;
    body = { op, windowFrom: "2026-10-07T00:00:00.000Z" };
    target = `service.${({ open: "openCohortStanding", close: "configureCohortStanding", window: "configureCohortStanding", publish: "publishCohortStanding", withdraw: "withdrawCohortStanding", show_rating: "setCohortStandingVisibility", hide_rating: "setCohortStandingVisibility", show_record: "setCohortStandingVisibility", hide_record: "setCohortStandingVisibility" })[suffix]}`;
  } else if (id.startsWith("live.")) {
    if (id === "live.session.create") { body = { runId: "fixture", kind: "stream", title: "Fixture" }; target = "live.create"; }
    else if (id === "live.session.close") { body = { op: "close" }; target = "live.close"; }
    else if (id.startsWith("live.board.")) { body = { op: suffix, handle: "fixture" }; target = "live.board"; }
    else if (id.startsWith("live.match.")) { body = { op: suffix }; target = "live.matchOperation"; }
    else if (id === "live.link.mint") { body = { invitedRole: "participant" }; target = "live.mintLink"; }
    else if (id === "live.link.revoke") { body = { op: "revoke" }; target = "live.revokeLink"; }
    else if (id === "live.proposal.create") { body = { nodeId: "fixture", moveUci: "e2e4" }; target = "live.propose"; }
    else if (id.startsWith("live.proposal.")) { body = { op: suffix }; target = "live.resolveProposal"; }
    else if (id === "live.vote.open") { body = { op: "open", nodeId: "fixture", prompt: "Fixture", options: [{ moveUci: "e2e4", label: "Fixture" }], durationSeconds: 30 }; target = "live.openVote"; }
    else if (id === "live.vote.cast") { body = { op: "cast", windowId: "fixture", choiceUci: "e2e4" }; target = "live.castVote"; }
    else if (id === "live.vote.close") { body = { op: "close", windowId: "fixture" }; target = "live.closeVote"; }
    else if (id === "live.invitation.create") { body = {}; target = "live.invite"; }
    else if (id === "live.leg.import_pgn") { body = "1. e4 *"; target = "live.importLeg"; }
  } else if (id.startsWith("run_action.")) {
    const bodies = {
      marks_replace: { nodeId: "fixture", branchId: "fixture", scope: "position", shapes: [] },
      marks_rescope: { nodeId: "fixture", branchId: "fixture", scope: "branch", rescopeFrom: "position" },
      deletion_preview: {}, delete: { previewDigest: "fixture" }, distill: { packId: "fixture", title: "Fixture" },
      reasoning_review: { checkpointEventSeq: 1 }, voice: { nodeId: "fixture", scope: "reading" }, speech: { nodeId: "fixture", scope: "reading" },
      share: { branchId: "fixture" }, flip: { nodeId: "fixture" }, lease: {}, reveal: {}, duplicate: { id: "fixture", seed: 1 },
      schedule: { nodeId: "fixture", kind: "blocked" }, grant: { op: "grant", handle: "fixture", role: "participant" }, revoke: { op: "revoke", handle: "fixture" },
      group: { source: "hand_picked", candidates: ["e2e4"] }, group_reply: { groupId: "fixture" },
      move_user: { uci: "e2e4" }, move_opponent: { selection }, rewind: { nodeId: "fixture" }, fork: { nodeId: "fixture" },
      compare: { branchIds: ["a", "b"] }, branch_decidedness: { branchIds: ["a", "b"] }, analysis: { nodeIds: ["fixture"], kind: "eval" },
      simulate: {}, simulate_enter: { simulationId: "fixture", branchIndex: 0 },
      prediction: { ...selectBody, checkpointId: "fixture", nodeId: "fixture", predictedUci: "e2e4" },
      reasoning: { nodeId: "fixture", checkpointEventSeq: 1, skipped: true }, evidence: { resultSeq: 1 }, assistance: {},
      hints: { nodeId: "fixture", rung: "pattern", decisionDigest: "fixture", assistance: {} }, modules_query: { assistance: {}, query: {} },
      opponent_ply: { requestId: "botreq_abcdefghijklmnop", expectedNodeId: "fixture", expectedBranchId: "fixture", expectedEventHeadDigest: `sha256:${"a".repeat(64)}` },
      hint_cancel: undefined,
    };
    if (!Object.hasOwn(bodies, suffix)) throw new Error(`Missing body fixture: ${id}`);
    body = bodies[suffix];
    target = `service.${({ marks_replace: "replaceMarks", marks_rescope: "rescopeMarks", deletion_preview: "deletionPreview", delete: "deleteRun", distill: "distillationAccess", reasoning_review: "reasoningReviewAccess", voice: "guidanceAccess", speech: "guidanceAccess", lease: "claimLease", grant: "updateGrant", revoke: "updateGrant", group: "createGroup", group_reply: "groupReply", move_user: "move", move_opponent: "opponentPly", branch_decidedness: "branchDecidedness", simulate_enter: "enterSimulation", prediction: "unused", reasoning: "recordReasoning", evidence: "applyEvidence", assistance: "assistanceAuthority", hints: "hintAccess", modules_query: "assistanceAuthority", opponent_ply: "botOpponentPly", hint_cancel: "hintAccess" })[suffix] ?? suffix}`;
    if (suffix === "prediction") target = "selector.select";
  }
  if (typeof target !== "string" || target.endsWith(".undefined")) throw new Error(`Missing dispatch fixture: ${id}`);
  const path = row.template.replace(/:([A-Za-z]+)/gu, (_, parameter) => parameter === "leg" ? "1" : parameter === "requestId" ? "a".repeat(32) : "fixture");
  return { ...row, path, body, target, headers: { "x-writer-id": "fixture", "if-match": "fixture", "idempotency-key": "00000000-0000-4000-8000-000000000001", ...(body === undefined ? {} : { "content-type": typeof body === "string" ? "text/x-chess-pgn" : "application/json" }) } };
}

export function requestFor(item, changes = {}) {
  return new Request(`http://localhost${item.path}`, { method: item.method, headers: item.headers, ...(item.body === undefined ? {} : { body: typeof item.body === "string" ? item.body : JSON.stringify(item.body) }), ...changes });
}

/** Sentinel cutpoints: real production route/parser reaches an entry, no service work is performed. */
export function tracedHandler(createRestHandler, ServerError) {
  const calls = [], principal = Object.freeze({ learnerId: "fixture", handle: "fixture" });
  const proxy = name => new Proxy({}, { get(_, key) {
    if (name === "identity" && key === "authenticate") return () => principal;
    return (...args) => { calls.push({ target: `${name}.${String(key)}`, args }); throw new ServerError("INVALID_REQUEST", "DISPOSABLE_ROUTE_CUTPOINT"); };
  } });
  const handler = createRestHandler(proxy("service"), proxy("selector"), undefined, proxy("identity"), proxy("studio"), proxy("live"),
    undefined, proxy("shapeStudio"), proxy("voice"), undefined, undefined, proxy("repertoires"), proxy("tts"), proxy("reasoningReview"),
    proxy("classrooms"), undefined, undefined, proxy("learnerProfile"), undefined, proxy("campaigns"), proxy("hints"));
  return { calls, handler };
}
