// rfc/review-map.md §7: every authored string on the Review Map is a frozen, registered template.
// Free-form authored prose is not admitted on this surface. Numbers, moves and names enter only as
// named operands of these sentences, so the template table fixes the whole sentence rather than
// fragments that a renderer could join into a claim neither record makes ([[D146]]).
//
// Two invariants are asserted by fixture (review-map.test.ts): no template contains a word from
// `BANNED_JUDGEMENTS` (a judgement word renders only inside the exact grounding sentence that
// licenses it, [[D1409]]), and the table's key set equals the set of template ids referenced by the
// runtime projection, the Review Map component and its share card — derived, never hand-counted.

export const REVIEW_MAP_TEMPLATES = Object.freeze({
  // Game header
  "header.eyebrow.imported": "Imported game · review",
  "header.eyebrow.native": "Played run · review",
  "header.title.imported": "{white} – {black}",
  "header.title.native": "Review of this run",
  "header.source.imported": "Source: {source}, imported {date}. Moves are listed as recorded; annotation glyphs and comments from other sites are not shown.",
  "header.source.native": "Source: this run, as played on Tabiya.",
  "source.pgn_paste": "pasted PGN",
  "source.lichess_url": "a public lichess game export",
  "header.result.board": "Result on the board: {result} for {side}.",
  "header.result.recorded": "Recorded result: {result}.",
  "header.result.unfinished": "This line has no recorded result.",
  "header.coverage": "Evaluation coverage: {evaluated} of {positions} positions on this line carry a recorded engine evaluation.",
  "header.pending": "Evaluation pending for {pending} positions. Grades and accuracy update when the recorded pass completes.",
  "header.story_title": "Story title: {title}",
  "action.back": "Back to review",
  "action.export": "Export game + branches",
  "action.exporting": "Preparing export…",
  "action.exporting.status": "Preparing the recorded game and its branches.",
  "action.export.failed": "The game export could not be prepared. Try again.",
  // Accuracy (§6)
  "accuracy.title": "Accuracy",
  "accuracy.rendered": "{side}: {value}% under {convention} — 100 minus the mean win-point drop across all {decisions} of {side}'s evaluated decisions. It is not comparable to another site's accuracy figure.",
  "accuracy.abstained": "{side}: no accuracy figure. {evaluated} of {decisions} of {side}'s decisions have paired recorded evaluations; the figure renders only when all of them do.",
  "accuracy.no_decisions": "{side}: no accuracy figure, because {side} made no move on this line.",
  // Move list (§3)
  "moves.title": "Moves",
  "moves.caption": "Every move on this line. A grade appears only where the recorded evaluation drop crosses a report threshold, so most moves carry none.",
  "moves.label": "Move list",
  "moves.row.white": "{number}. {san}",
  "moves.row.black": "{number}… {san}",
  "moves.row.moment": "Moment",
  "side.white": "White",
  "side.black": "Black",
  // Retry (§4)
  "retry.action": "Retry from here",
  "retry.action.label": "Retry from before move {number} ({san})",
  "retry.moment.label": "Retry from this moment at move {number}",
  "retry.busy": "Opening a rehearsal…",
  "retry.status": "Opening one rehearsal from this position. The original game stays as its own branch.",
  "retry.unavailable.read_only": "Retry is unavailable: this account can read this game but may not add branches to it.",
  "retry.failed.board_held": "Retry is unavailable right now: another learner holds this board.",
  "retry.failed.forbidden": "Retry is unavailable: this account may not add branches to this game.",
  "retry.failed.other": "This rehearsal could not be opened. The review is still here; try again.",
  // Board and navigation
  "board.label": "Selected position",
  "board.after": "Position after {move}",
  "board.start": "Starting position",
  "nav.previous": "Previous move",
  "nav.next": "Next move",
  // Evidence panel
  "evidence.title": "Recorded facts at this move",
  "evidence.eval": "Recorded evaluation after this move: {score} from White's side ({engine}{limit}).",
  "evidence.eval.mate": "mate in {moves} for {side}",
  "evidence.eval.missing": "No recorded evaluation exists for the position after this move.",
  "evidence.grade.none": "No grade: the recorded evaluation drop across this move does not cross a report threshold.",
  "evidence.grade.abstained": "No grade: {reason}.",
  "grade.abstention.missing_eval": "a recorded evaluation is missing on one side of this move",
  "grade.abstention.input_abstained": "one of the two recorded evaluations cannot be read as a score",
  "grade.abstention.unequal_instrument": "the two recorded evaluations were not taken with the same engine and search limit",
  "grade.abstention.mate_score_inconsistent": "the two recorded evaluations disagree about a forced mate",
  "evidence.relation.none": "The recorded-path compiler detected no relation starting on this move.",
  "evidence.relation.refused": "Recorded-path relations are unavailable for this line: the compiler refused it ({reason}).",
  "evidence.relation.absent": "Recorded-path relations were not compiled for this view.",
  "evidence.module.withheld": "Review Map evidence is withheld for this view: {reason}.",
  "module.refusal.role_outside_ceiling": "this viewer's role is outside the Review Map module's declared roles",
  "module.refusal.session_outside_ceiling": "this workflow context does not admit the Review Map module",
  "module.refusal.not_admitted": "the Review Map module does not admit this evidence",
  "evidence.packet.absent": "No per-position review packet was compiled for this view.",
  // Eval graph (§6, [[D880]]): same coverage gate as accuracy, abstaining per region
  "graph.title": "Evaluation graph",
  "graph.caption": "Each point is the recorded engine evaluation after one move ({engines}), recorded from White's side and drawn as win-points for {side} through {convention}: 50 is level, and higher favours {side}.",
  "graph.none": "No position on this line carries a recorded engine evaluation, so no evaluation graph is drawn.",
  "graph.coverage": "{evaluated} of {plies} moves have a recorded evaluation after them.",
  "graph.point": "{move}: {score} from White's side, {percent} win-points for {side}.",
  "graph.point.missing": "{move}: no recorded evaluation, so the graph abstains here.",
  "graph.gap": "No recorded evaluation from {from} to {to}: the graph abstains over this stretch.",
  "graph.gap.one": "No recorded evaluation after {move}: the graph abstains there.",
  "graph.label": "Evaluation graph, one point per move. Arrow keys step through the moves.",
  "graph.text": "The graph as text",
  "graph.module.withheld": "The evaluation graph is withheld for this view: {reason}.",
  // Compare handoff (§4): the shipped N-way compare, offered once a second line leaves the game here
  "compare.action": "Compare lines from here",
  "compare.action.label": "Compare the reviewed line and {count} more from before move {number} ({san})",
  "compare.moment.label": "Compare the reviewed line and {count} more from this moment at move {number}",
  "compare.omitted": "{omitted} more lines leave the game at this position; the comparison opens with the first {shown}.",
  "compare.busy": "Opening the comparison…",
  "compare.failed": "The comparison could not be opened. The review is still here; try again.",
  // Analyze (§7, O7.3): explicit and secondary; never in the ordinary map; hidden during a retry
  "analysis.action": "Analyze",
  "analysis.action.label": "Analyze the position before move {number} ({san}): show the recorded engine line",
  "analysis.hide": "Hide engine line",
  "analysis.title": "Recorded engine line",
  "analysis.busy": "Reading the recorded engine line…",
  "analysis.failed": "The recorded engine line could not be read. Try again.",
  "analysis.line": "{engine} ({bound}) reported this principal variation from the position before {move}: {line}.",
  "analysis.first": "{engine} ({bound}) reported {line} as the first move of its search from the position before {move}; no longer line is recorded.",
  "analysis.caveat": "This is the output of a bounded engine search, shown as recorded. It is not advice, and the grades on this review do not depend on it.",
  "analysis.none": "No engine line is recorded for the position before {move}.",
  "analysis.unattributed": "An engine line is recorded for the position before {move} without its search bound, so it is not shown.",
  "analysis.withheld": "The engine line for the position before {move} stays hidden while a retry from that position is open. Finish that retry or switch to another line to see it.",
  "analysis.bound.movetime": "{ms} ms search",
  "analysis.bound.depth": "depth {depth} search",
  "analysis.module.withheld": "The engine line for the position before {move} is withheld for this view: {reason}.",
  "module.refusal.inspector.role_outside_ceiling": "this viewer's role is outside the Full Inspector module's declared roles",
  "module.refusal.inspector.session_outside_ceiling": "this workflow context does not admit the Full Inspector module",
  "module.refusal.inspector.not_admitted": "the Full Inspector module does not admit this recorded line",
  // Moment map (§5)
  "moments.title": "Moments",
  "moments.caption": "Up to three recorded moments, at most one per game phase, from {considered} admitted story moments. This is not a ranking of the play.",
  "moments.none": "No moment was selected: the story projection admitted no moment with a recorded fact on this line.",
  "moment.move": "Move {number}",
  "moment.move.san": "Move {number} · {san}",
  "moment.sources": "Sources: {labels}.",
  "moment.explain": "Explain this moment",
  "moment.explaining": "Explaining…",
  "moment.explain.failed": "This explanation is unavailable right now. Try again.",
  "kind.irreversibility": "Irreversible change",
  "kind.phase_change": "Phase transition",
  "kind.human_divergence": "Human-choice split",
  "kind.option_collapse": "Options narrowed",
  "kind.eval_pivot": "Evaluation shift",
  "kind.mate_transition": "Mate score change",
  "kind.last_level": "Last level evaluation",
  "kind.endgame_entry": "Endgame begins",
  "kind.shape_span": "Recognized structure",
  "kind.outcome": "Outcome reached",
  "kind.join": "{first} + {rest}",
  // Footer (§7, [[D687]]): computed from the admitted items, never a fixed provenance claim
  "footer.sources": "Sources on this review: {labels}.",
  // Sharing (§5, one projection feeds private, share and card)
  "share.action": "Share review",
  "share.title": "Public review links",
  "share.lifetime": "A public review link does not expire. Anyone with it can read the selected moments until you revoke the link or delete your account. Revoking blocks future reads; it cannot erase copies someone already saved.",
  "share.new": "New public review:",
  "share.created": "Public review link created and copied.",
  "share.created.manual": "Public review link created. Copy the visible URL manually; clipboard access was unavailable.",
  "share.failed": "The public review link could not be created. Try again.",
  "share.revoke": "Revoke this link",
  "share.revoked": "Future reads through that public link are blocked. Copies already saved elsewhere cannot be recalled.",
  "share.revoke.failed": "That public link could not be revoked. It may still be public; try again.",
  "share.none": "No public review links yet.",
  "share.list.label": "Review share links",
  "share.item.public": "Created {date} · public",
  "share.item.revoked": "Created {date} · revoked {revoked}",
  "card.download": "Download card PNG",
  "card.busy": "Preparing card…",
  "card.busy.status": "Preparing the selected moments as an image.",
  "card.failed": "The review card could not be prepared. Try again.",
  "card.footer": "Sources: {labels} · Tabiya",
  "card.none": "No moment was selected for this game.",
  "public.selection": "{shown} moments selected from {considered} admitted story moments.",
  "public.link": "Rehearse positions in Tabiya",
} as const);

export type ReviewTemplateId = keyof typeof REVIEW_MAP_TEMPLATES;

/**
 * Renders one registered template. Every `{name}` operand must be supplied and every supplied operand
 * must be used; operand values are inserted in one pass, so they can never introduce a placeholder.
 */
export function reviewText(id: ReviewTemplateId, operands: Readonly<Record<string, string | number>> = {}): string {
  const template: string | undefined = REVIEW_MAP_TEMPLATES[id];
  if (template === undefined) throw new TypeError(`Unregistered review template ${String(id)}`);
  const used = new Set<string>();
  const text = template.replace(/\{([a-z]+)\}/gu, (_match, name: string) => {
    const value = operands[name];
    if (value === undefined) throw new TypeError(`Review template ${id} is missing operand ${name}`);
    used.add(name);
    return String(value);
  });
  const unused = Object.keys(operands).filter((name) => !used.has(name));
  if (unused.length > 0) throw new TypeError(`Review template ${id} does not take operand ${unused.join(", ")}`);
  return text;
}
