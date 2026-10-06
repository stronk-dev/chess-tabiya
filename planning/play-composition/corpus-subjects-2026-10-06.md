# Corpus Inspector subjects — 2026-10-06

Accepted authority: `rfc/play-composition.md` §2.4/A4, the existing Inspector consumer
migration in `rfc/evidence-presentation.md`, and the frozen runtime corpus endpoint's
pre-move/active-child semantics. No source schema, renderer seal, permission ceiling,
chess convention, endpoint extension or authored content changes.

## Repair and retained boundary

D3468: the previous non-learner lookup searched the active path, allowing a historical
opponent/root preview to request a future learner decision's predecessor. The query
now derives the latest learner decision exclusively from the displayed node's ancestry.
Learner previews retain their predecessor semantics; a root or pre-learner subject
requests itself. The actual run graph/cursor is not rewound or mutated by preview.

Pages, pending state and errors are retired by exact run/displayed/query/cursor and
corpus permission/preference identity. The epoch rejects an old settlement even after
leaving and returning to the same subject. Ordinary evidence attachment events at the
same decision do not erase an already completed population reading. The server retains
its own authenticated grant/disclosure/event-head checks across source acquisition.

D3469: the endpoint deliberately reports the learner child on the active path. That
is not a branch-aware inspected-decision contract. The existing Inspector now suppresses
the committed-move line when it differs from the inspected decision, including a root
with no decision. Population components and source receipts remain untouched. The
successor must specify authenticated decision/predecessor identity and asynchronous
response attribution; it is blocked on that contract, not misreported as implemented.

## Falsifiers and replacement controls

The first mounted fixture attempted an opponent commit without an authoritative
selection and was correctly refused by runtime. It was repaired to use appendOpponentPly
with a labelled fixture selection; those fixture refusals are not product defects.
The actual predecessor then fails four permanent assertions: both longer-line historical
opponent lookups (original and sibling), root lookup, and leave-and-return settlement.
Two late-result cases initially pass because the wrong query accidentally differs; the
corrected ancestry makes them meaningful same-predecessor controls. Removing only the
epoch increment from the repaired code fails the leave-and-return test independently
(one failed, ten passed). The replacement restores that guard; no assertion is weakened.

Modern source acquisition and the registered population renderer supply the root
positive. Context tests keep the genuine matched e4 label and suppress d4/root mismatch.
Eight new mounted controls cover active/historical learner/opponent queries, a real root
fork, late success/failure/ABA, screen destruction, no run mutation and available retry. Existing cross-node,
failure/retry/floor and v1/v2 receipt controls remain.

Native journeys import a legal six-ply game, wait for its seven recorded evaluations,
inspect historical opponents/learners and check exact HTTP request/response node IDs.
A real server response is acquired and delayed without modifying its source bytes;
leaving and returning suppresses it. Review reentry creates a real root sibling, two
native learner moves receive opponent replies, and actual branch links return to the
original line. The root retains counts but no future committed-move label. All original
and new moves survive; ordinary preview leaves board geometry, cursor and graph unchanged.

Two native driver predecessors are not acceptance: reentry's separate prediction board
makes a global Chessboard selector ambiguous (the rehearsal gesture is now scoped to
the actual stage), and the mock genuinely lists d4 (the fixture wrongly expected absence).
That second run also showed a completed page erased by unrelated attachment events;
the precise subject key no longer includes a global event count. No forced click,
synthetic source payload, source attribution rewrite or permission bypass is used.

Focused replacement: 94 tests/four client files and clean types; four native journeys
pass without retries. Retained native summary: `corpus-subject-native-2026-10-06.json`.

## Full replacement gates

Full exact-index software, real-content, complete browser and staged governance results
are added only after those commands terminate. Focused controls do not establish full
A4, a whole RFC, a milestone or release readiness. D3309/D3363 source migrations,
fifteen-family destination/source positives, D3436 reconciliation and owner-use remain
open. Routine metadata/hash maintenance is automatic, not an owner question.

The complete sequential replacement gates exit zero. `make staged-software-contracts`
passes 3,269 tests/343 files, seven isolated performance tests/four files, clean types
and all downstream scaffold, packaging, release, source, semantic, capability, history,
migration and artifact controls. Tested index tree:
`ebde88a1545bc7c8ed163e5b3de15ee1e26a31af`; retained proof:
`corpus-subject-software-2026-10-06.json`. Source semantics and all 977 declarations
remain current; no migration or authored-content re-stamp is required.

`make verify-content` passes 225 tests/23 files, 92 clearance documents with zero
errors and 104 exact capability documents. `make test-browser-ci` passes 140 journeys:
75 smoke, five content, 59 matrix and one packaged-default, with the existing optional
real-Maia probe skipped and zero test retries. Independent post-packaging hash verification
confirms all 337 retained files unchanged: 112 PNG/geometry/vocabulary triples and their
original successful report. Retained summary: `corpus-subject-browser-2026-10-06.json`.
The six changed Make/web/test implementation paths are checked against the passing
software tree; subsequent closeout/proof/docs bytes receive staged governance and hooks.

Final `make staged-process-contracts verify-governance` exits zero over the staged
closeout. Register/status/source/history, work-state/work-item, anchored roadmap/receipt,
intent, test-tier/docs and append-only/flow-back controls pass. All six implementation
paths remain byte-equal to the passing software tree. Ordinary hooks validate the
final receipt/log-only staging at the commit boundary; unrelated files stay excluded.
