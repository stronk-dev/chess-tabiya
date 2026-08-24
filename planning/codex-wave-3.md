# Codex wave 3 — the work that needs no ruling

**Opened 2026-08-24.** The 2026-08-23/24 wave produced ~180 ledger rows, twelve UX dossiers and a
four-tier reconciliation. Most of it is specification. **This file is the subset that is buildable
right now** — nothing here waits on an owner ruling, an RFC acceptance, or a document I still owe.

Ordered. Each item names its ledger row, its evidence, and what "done" means.

## 1. Instruments first — they are blocking other agents today

1. **`register-check` must not read the working tree** ([[D1509]]). It derives migration heads from
   the working tree, so one agent's uncommitted `STORAGE_VERSION` bump blocks the pre-commit hook for
   every other agent and forces the `--no-verify` escape the hook exists to prevent. Derive from the
   index or from HEAD. **Done:** a dirty unrelated storage edit no longer fails an unrelated commit.
2. **Chain `test-browser` back into CI** ([[D1507]]). The step that linked it was created and deleted
   the same day, so a deterministic failure has been invisible. **Done:** the suite runs before push.
3. **Fix the failure it hides** ([[D1507]]): the boundary sheet **announces authored commentary and
   does not render it**. **Done:** announce and render agree, asserted by the suite.
4. **A manifest-freshness check** ([[D1508]]). All 32 sourcing manifests are stale against their own
   packs — zero match — found by an accidental command rather than any check, and it puts *"full
   content"* in question. **Done:** staleness fails a gate instead of waiting for luck.

## 2. Accessibility — twelve defects, none needing a ruling

Full list and line references in `design/research/ux-accessibility-and-mobile.md` §4 ([[D1492]]).
Highest value first:

5. **Keyboard square-sight parity** ([[D1447]]) — two lines. `Chessboard.svelte:144` binds `onSelect`
   to Chessground's **pointer** select only; call it from the `activate` transition, and specifically
   **not** from `onActiveSquareChange`, since sight is on-request rather than on-cursor.
6. **The nine drill shortcuts are dead at all twelve verified tab stops** ([[D1492]]).
   `interactiveTarget()` classes every `<button>` in the composed path as interactive and the handler
   then declines the event. **Done:** shortcuts work from the tab stops a keyboard user actually
   reaches, with a key that returns focus to the region.
7. The remaining ten: `KeyboardHelp` clipping with no `overflow`; the skip link targeting the nav it
   should skip; no `<main>`; a static `<title>` across twelve routes; route changes moving no focus
   and announcing nothing; the busy live region `display:none` below 60rem so *"Thinking…"* is never
   announced on a phone; `ShapePanel` with no dialog role, focus move, restore or Escape; two
   sub-24px targets; `<kbd>` inside accessible names; phone tabs with no selected state.

## 3. The presentation layer — the part [[D1435]] unblocked

8. **The preset pill and disclosure footer** ([[D1435]], [[D1457]]). The blocker was never a missing
   feature — the config projection and clamp tables are now written, and §7.1 enumerates the eight
   values the surface reads. Every one of the nine config fields already has a shipped consumer.
   **Done:** a learner can see and change their preset without meeting a 72-control matrix.
9. **Label the assistance controls with questions, not producers** ([[D1454]]). `rfc/module-registration.md`
   §1.4 already writes each module's intent in the first person; bind `label = declaration.intent`.
   **Done:** no control in the run screen is named after the thing that produces it.

## 4. Authoring — wiring, not building ([[D1488]])

10. **`lintPackDraft` client caller.** The endpoint accepts arbitrary unsaved bytes and has no caller,
    so an author must upload a draft to be told it is wrong. `api.ts` already has `lintShapeDraft`.
11. **Studio and `make pack-check` must run the same checks** — the docs already claim they do. Two
    constructor arguments; four codes are currently unreachable in Studio.
12. **`GET /principles`** — `rest.ts` contains the string `principle` zero times while
    `principle-registry.ts:63` holds a finished, sorted browse projection.

## 5. Small and shipped-wrong

13. **[[D484]]'s control styling** — priced at ~4 lines in `planning/ux-work-lane.md:635`, open since
    2026-08-16, and the matrix grew 33% while it sat.
14. **[[D1441]]** — `evidenceKindLabel` labels one member of four, so `wdl` reaches a learner as `wdl`.
15. **[[D1421]]** — no suppression rule for already-decided positions; we grade +4.67 → +2.67 a
    *mistake* where Lichess says nothing. Worse under the ruled 2.5 floor, and freechess's published
    `Brilliant` already carries the not-already-winning cutoff, so the shape is not an invention.

## What is NOT here, and why

**Waiting on the owner:** twelve intent amendments (law 5, [[D1505]]); the casting fence and the
onboarding prohibition ([[D1451]]); the failure state ([[D1300]]/[[D1499]]); O5, O9 and O11; the
public-matchmaking question under [[D1414]]; cohort read symmetry ([[D1482]]).

**Waiting on me:** the [[D1505]] protocol clause — until it lands, any rollup we rebuild drifts again
by the same route; ~97 proposed dossier rows to land and route; repairs to the three blocked drafts
([[D1410]], [[D1411]], [[D1412]]); the `social-play` rebuild on native-first; the `hint-distance`
redraft behind codex's selector gate.

## ⚠ THIS FILE IS A CURATED SUBSET — [[D1522]], 2026-08-24

Fifteen hand-picked items against **hundreds** of recommendations across twelve UX dossiers. The
owner named the failure: *"why do i have to explicitly keep mentioning every single little thing?"*
Curating is the defect — everything unselected leaves the visible surface, and the owner becomes the
index.

**`planning/ux-implementation-index.md` is the complete enumeration**: every dossier item classified
(buildable now / blocked on a ruling / blocked on an RFC / already done / superseded), cross-checked
against every queue, with **in no queue at all** as a first-class count. Its buildable-now items are
appended below this file's section 5. **Work from the index, not from this list.**

Two items the owner had to name himself, both now tracked:

- **Bot personas / the honest bot card** ([[D1501]], [[D1502]]) — `design/research/ux-opponents.md`
  specifies it in full and it was queued **nowhere**. A card may describe the machinery and its
  absences in the language of what the learner will experience, never the bot as *a kind of chess
  player*; and the persona word-filter must become a **provenance rule**, since eight banned
  adjectives do not stop *"she likes to keep the position closed and grind"*.
- **Native ratings** ([[D1521]]) — ruled in scope by [[D1414]], **zero** occurrences in any queue.
  Blocked by [[D1516]]: `rated_games.run_id` is a PRIMARY KEY, one rated game per run, against a
  native match that is one run with two learners. **A named blocker is a queue entry, not an excuse
  for absence.**

**Standing constraint added today** ([[D1520]]): [[D1416]] deferred tournaments, leagues and operator
accounts **as features**; the **architecture must be ready for them**. Every 1.0 decision that would
make a later tournament expensive or impossible is in scope — the run/pairing aggregate and the
declared result ([[D1481]]) are the two already known.

### Why three enumerations did not stick — [[D1523]]

`work-index`'s entire check is *does this row's id appear as a string in a durable document*. It
cannot distinguish **queued** from **merely mentioned**. So each enumeration wrote a document, the
document cited the ids, the gate went green, and the work stayed undone — and because the
classification lived in the snapshot rather than on the item, the next enumeration began from zero.

**A fourth enumeration is not the fix.** The fix is a **persistent per-item state** — todo / doing /
blocked / done, with an owner — and an instrument that measures **assignment** rather than citation.
Until that exists, treat every "0 unrouted" line in this repository as saying nothing about whether
any work will happen.
