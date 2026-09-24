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
  "evidence.relation": "Recorded-path detector fired from this move: {family} ({projection}; {source}).",
  "evidence.relation.none": "The recorded-path compiler detected no relation starting on this move.",
  "evidence.relation.refused": "Recorded-path relations are unavailable for this line: the compiler refused it ({reason}).",
  "evidence.relation.absent": "Recorded-path relations were not compiled for this view.",
  "evidence.module.withheld": "Review Map evidence is withheld for this view: {reason}.",
  "module.refusal.role_outside_ceiling": "this viewer's role is outside the Review Map module's declared roles",
  "module.refusal.session_outside_ceiling": "this workflow context does not admit the Review Map module",
  "module.refusal.not_admitted": "the Review Map module does not admit this evidence",
  "evidence.packet.abstained":"No per-position review packet is admitted here: its compiler, rfc/review-evidence-compiler.md, is still a draft.",
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
