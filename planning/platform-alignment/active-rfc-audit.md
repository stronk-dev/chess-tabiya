# Active RFC truth audit

> **Post-audit correction, 2026-08-20:** this run counted 63 files under `rfc/archive/`, but the
> actual Archive table had only 58 rows. D638 repaired the five-row mismatch and
> `rfc-completion-refresh.md` now distinguishes lifecycle-closeout, current per-RFC re-verification
> and 1.0 outcome completion. The row-by-row A0 result remains the source for the four clean-tree
> implementation reviews.

> **Post-audit correction, 2026-08-21:** Feedback Stage 1 has since **landed** — implementation at
> `a64e6c5`, recorded at `0cf0b3e`, criteria 1-20a closed with `make verify` and the browser gate
> green. The "dirty worktree / uncommitted" statements below describe the 2026-08-20 snapshot at
> `e5a3f3f` and are no longer current; the RFC remains accepted/implementing pending its
> separately governed Stage-2 binding wave under D560.

**Run:** 2026-08-20

**Program job:** A0

**Audited commit:** `e5a3f3f` through a clean `git archive` extraction

**Worktree rule:** the uncommitted feedback-delivery implementation was excluded

## Verdict

The Active table contained four completed RFC implementations that had remained `implementing`
only because nobody performed the named independent review:

- `live-marker-quality`;
- `dead-vocabulary`;
- `engine-leverage`;
- `vocabulary-wiring`.

Their implementation logs record completed gates on 2026-08-15/16, their owned ledger defects are
closed or explicitly left open as required, their canonical documentation exists, and the current
clean tree passes the focused contracts. No blocking implementation defect surfaced in this pass.
They are lifecycle-complete and should archive in the same checkpoint as this audit.

The remaining active product documents are not complete: three are accepted but unbuilt/in-flight,
and six are drafts or returned. An accepted specification is not a shipped capability.

## Method

For every active document the pass checked four independent axes:

1. **Specification state:** body status, Active-table status, open-question blockers and resource
   claims.
2. **Implementation state:** named code symbols, migrations/schema history, content mutations and
   planning log.
3. **Verification state:** acceptance-criterion fixtures, current clean focused tests, typechecks,
   scaffold and packaging.
4. **Closeout state:** canonical docs, BACKLOG disposition, exploration log and archive membership.

This matters because the repo had repeatedly used one axis as evidence for another: code present
was read as archived, `accepted` as shipped, an old green gate as current UX proof, and archive
membership as proof that the capability fulfills a later product vision.

## Verification record

Run against `/tmp/tabiya-a0.xtBfm4`, an extraction of committed `e5a3f3f` with dependencies linked
read-only from the workspace:

| Check | Result |
|---|---|
| Focused runtime/server/schema/web RFC suites | **13 files, 179 tests passed** |
| Stockfish-required engine/opponent/practical-difficulty suites | **3 files, 53 tests passed** |
| Schema TypeScript | pass |
| Runtime TypeScript | pass |
| Server TypeScript | pass |
| Web Svelte check | **0 errors, 0 warnings** |
| Scaffold verification | pass |
| Packaging verification | pass |

The historical landing invariants were re-derived from git rather than compared naively with
today's versions: `engine-leverage` landed pack 0.23/run 0.16/storage 21 at `18d2832`, and
`vocabulary-wiring` landed pack 0.24 at `caa8afa`. HEAD is pack 0.27/run 0.17, so criteria that
name the landing version are historical assertions, not requirements that later schema evolution
return to an old value.

## Row-by-row result

| RFC | Body/register truth | Code and verification truth | Closeout truth | Disposition |
|---|---|---|---|---|
| `live-marker-quality` | implementing / implementing | Implemented at `7bcf164`; current live-marker, guidance and screen contracts pass | Ledger rows D48/D50/D51/D68 closed; D52/D53 correctly remain open; missing archive/log closeout | **archive now** |
| `dead-vocabulary` | implementing / implementing | Implemented at `329c62b`; live-source mutation, refusal-site and zero-verdict contracts pass | D360 refutation stands; residual D428 remains owned; missing archive/log closeout | **archive now** |
| `engine-leverage` | implementing / implementing | Implemented at `18d2832` plus `b65bd4e`; 0.23/0.16/21 landing state verified; current engine contracts and real Stockfish suite pass | D35/D87/D88 closed; D497/D505 are stale-lifecycle consequences; missing archive/log closeout | **archive now** |
| `vocabulary-wiring` | implementing / implementing | Implemented at `caa8afa` plus `e9695cf`; 0.24 landing state and current vocabulary contracts pass | D64/D89/D90/D347 closed; residual shape-trigger gap remains D348; missing archive/log closeout | **archive now** |
| `teacher-surface` | accepted / accepted | `granted_via` and the specified teacher migration/workflow are absent; no implementation plan/log exists | No closeout is due yet | **accepted, unbuilt**; R15/O11 may require amendment before implementation |
| `graduation-clearance` | body says “returned … answered; accepts as register owner”; register says accepted | `make graduation-clear`, clearance transitions and the two named authoring codes are absent | D503 still falsely reads open even though round 3 resolved it | **accepted, unbuilt**; correct status/ledger truth, then implement |
| `feedback-delivery` | accepted / accepted, explicitly two-stage | Stage 1 exists only in the shared dirty worktree; it is not in audited commit `e5a3f3f` | Stage 2 remains an authored/content obligation; D560's later hold must be reconciled before it | **accepted, in-flight but uncommitted**; do not absorb or call shipped |
| `assistance-controls` | draft / draft | Reveal remains absent from `RunStateStore`; guided rendering still bypasses the `guided` setting | Owner has since ruled a real per-kind ceiling, but R3/O4 now broadens the UX question to modules/presets | **draft; return for alignment author round** |
| `measurement-records` | draft body / returned register | Proposed shape-entry measurement surface and `census-check` are absent | Blocking sub-expression/subject and pack-vs-shape decisions remain | **returned/draft** |
| `learner-rating` | draft / draft | Proposed rating tables/projection are absent | Open questions 11/12 plus unrun calibration and campaign design debt remain | **draft; blocked by R11/R14 and owner decisions** |
| `pack-population-provenance` | draft / draft | Proposed `citable_text`, pack population and provenance-note contract are absent | Depends on shared registers, knowledge research and pack stability | **draft; blocked by R4/R6/O5/O6** |
| `shared-resource-registers` | draft / draft | `register-check` and `tabiya-claims` parser do not exist | Q1/Q2 still say resolve before accepted; several embedded observations are stale/retracted | **draft; author refresh before acceptance** |
| `rfc-lifecycle-completion` | draft / draft | `status-parity`, lifecycle grammar and obligation reader do not exist | Q1–Q3 still say resolve before accepted | **draft; author refresh after this audit** |

## Register and process defects confirmed

1. **D497 is real and directly repairable:** pack lanes 0.23/0.24 were advertised as held after
   their code and later schema versions shipped. Archiving the two owners fixes the live register.
2. **D505 is a category error in an active document:** a landing invariant was read as a permanent
   HEAD invariant. Archival makes it historical; the future register checker should parse claims,
   not re-run old version literals against new releases.
3. **`graduation-clearance` has the one genuine body/register leading-state contradiction:** the
   register says accepted while the body preserves “returned … answered” and delegates acceptance
   in prose. It needs a single unambiguous status token before implementation.
4. **No proposed process instrument exists at HEAD:** `register-check`, `status-parity` and
   `work-index` have no Makefile target or implementation. Therefore this audit remains a manual
   snapshot and the process RFCs stay material.
5. **The completed-RFC count is a lifecycle count, not a product-quality count.** Before this
   closeout there were 59 archived RFCs. Archiving these four makes 63. It does not make guidance,
   review, bots, theory retrieval or player classification 1.0-complete; the capability audit owns
   that different question.

## Next legal actions

1. Archive the four verified implementations and release their stale Active/register claims.
2. Correct `graduation-clearance`'s status token and D503's stale ledger state without changing its
   accepted specification.
3. Preserve the dirty feedback Stage 1 work for its implementer; do not broad-add it.
4. Run A1, the backend→frontend→content capability reality audit, before opening detector or UX
   feature work.
5. Refresh the two process drafts from this result; only then seek their owner/author rulings.
