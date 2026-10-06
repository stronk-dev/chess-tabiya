# Inspector subject identity — 2026-10-06

Accepted authority: `rfc/play-composition.md` §2.4/A4 and the existing consumer UI
migration in `rfc/evidence-presentation.md`. This repairs the subjects of existing
recorded evidence, not a new projection, permission, chess convention or selection rule.

## Two production defects

- D3466: Recorded moment evidence labelled the selected historical node but used the
  displayed board's material classification. `openPivotalEndgame` now classifies the
  exact recorded selected FEN; a missing subject abstains. Current-position and voice
  subjects remain separate.
- D3467: Evidence attached to this position reused TerminalSheet's active-cursor list
  while the board could display a historical preview. `positionEvidence` resolves only
  the displayed node's references against the recorded payload table. An attachment-free
  preview stays empty. TerminalSheet still owns the active outcome's evidence.

## Able-to-fail verification

The predecessor mounted checks failed all three divergent legal historical/current
material cases (rook/outside convention, outside convention/pawn, non-endgame/rook).
The attachment predecessor separately failed both cases: +0.25 at history versus
+1.20 at the active node, and historical absence versus active evidence. Five other
focused checks passed while the two attachment cases were red. After both repairs,
`make inspector-subject-check` passes seven tests (62 unrelated cases filtered out).
`make play-composition-client-check typecheck` passes all 115 tests/six files and
clean types, including existing terminal and concurrent revoicing coverage.

Native browser cases import actual legal two-ply PGNs, open the timeline marker and
Inspector, and check divergent classifications without changing board geometry or
recorded moves. The preview case requests an actual active-position calculation,
checks its recorded attachment identity, previews the historical node, then cancels
preview. Historical evaluation stays; the active-only continuation disappears, then
returns. Active cursor and nodes remain unchanged. The mock engine's equal zero
evaluations alone cannot prove this, hence the distinct newly requested continuation.

Driver predecessors are recorded, not presented as product failures or replacement
proof: `inspector-subject-predecessor-2026-10-06.json` records the proper terminal modal
on a bare-kings fixture (replaced with a legal pawn ending for the live-play journey);
`inspector-subject-driver-predecessor-2026-10-06.json` records the graph/events endpoint
mistake. A further three-pass/one-fail predecessor checked pre-existing import evidence
before the new calculation finished; its native snapshot showed Preparing calculation.
The corrected focused replacement passes four journeys without retries, retained in
`inspector-subject-native-2026-10-06.json`. No force clicks or synthetic source
payloads hide these boundaries.

## Replacement gates and closeout

Full replacement gates run before ledger closure and commit. Results are recorded here
when they terminate; focused success is not release proof.

Final `make local-module-execution-check staged-software-contracts` exits zero with
the suites sequential and no concurrent browser/content load. The local preflight
target passes 79 tests/five files and clean types. The complete exact-index software
gate passes 3,261 tests/343 files, seven isolated performance tests/four files, clean
types and every downstream build/packaging/release/source/value/semantic/capability/
history/migration/artifact check. Tested tree:
`e091236a7dd3f807a889c4df483ec36820c99880`; proof:
`inspector-subject-software-2026-10-06.json`. No functional deadline, assertion,
source contract, authored content or semantic metadata is changed to obtain a pass.
The earlier failed run remains recorded below, not erased or called successful.

The first complete exact-index software run fails, not passes: 3,260 tests pass and
one of 3,261 times out at five seconds (`structure_nudge: missing_policy refuses before
any collector`, `local-module-execution.test.ts`). Tree
`fe02e54c1bd8de3656a86681f264cfc7733b2afd`; failed proof:
`inspector-subject-software-predecessor-2026-10-06.json`. It overlapped full content
and browser suites on this host; resource contention is a hypothesis, not a demonstrated
product cause. The normal `ci-local` command already runs these tiers sequentially.
Replacement verification follows that schedule; neither test timeout nor assertions
are weakened. The sandbox-only content predecessor cannot listen on loopback; the
ordinary permissioned replacement passes all 225 tests/23 files, 92 clearance documents
with zero errors and 104 exact capability declarations.

Complete `make test-browser-ci` exits zero: 137 journeys (72 smoke, five content,
59 matrix, one packaged), one existing optional real-Maia skip and zero retries.
Independent verification after packaging checks all 337 retained files against their
digests: 112 PNG/geometry/vocabulary triples and the original report. The current
matrix counts 14,549 ordinary and 378 Inspector text nodes with zero ordinary leaks;
this still does not establish all fifteen raw-family/source positives. Retained proof:
`inspector-subject-matrix-2026-10-06.json` and `inspector-subject-inventory-2026-10-06.json`;
report `sha256:2bddf1e7f0d510f94e419af5898ec29e57d004932a69a00ab1cace756811efe5`.

The adjacent source audit records D3468 separately: corpus lookup for a non-learner
preview searches the active path rather than the displayed subject's ancestry. It is
assigned to core-loop with longer-line/root/sibling/delayed-response predecessor work
queued next, not counted as repaired by this checkpoint.

Full fifteen-family A4 destination/source positives, D3309 structural operand fidelity,
D3363 observed-move human-model source migration, D3436 phone contract reconciliation,
ceilings and owner-use remain open. This does not complete A4, a whole RFC, a milestone
or 1.0. Protected intent, archives and authored chess content are unchanged. Routine
metadata/hash updates are automatic maintenance, never a question for the owner.

Final `make staged-process-contracts verify-governance` exits zero: register/status/
history, ledger routing/assignments, roadmap/receipt, intent, tier separation, docs and
append-only/flow-back checks pass. All 1,687 live rows are routed, zero untriaged or
doing; all 569 UX items are assigned. The four Make/web/test implementation paths are
byte-identical to the passing software tree; later tracking/proof/log additions do
not impersonate a new software proof. Ordinary hooks validate the final commit.
