# Codex queue — refreshed 2026-08-15 (night)

**Three RFCs are ACCEPTED and yours.** The review bottleneck cleared. Take them in the
claim order below — the order is a shared-resource constraint, not a preference.

## 0. Landing order — take these in sequence

| # | RFC | Claims | Why this position |
|---|---|---|---|
| 1 | `rfc/engine-leverage.md` | **pack 0.23**, **run 0.16**, **migration 22** | Lowest number in every register it touches. Its hard dependency **D64 is now CLOSED** (`8b1b44d`) — criterion 4 may derive `cost` from the tablebase path, because those 135 records are re-derived, not manufactured |
| 2 | `rfc/vocabulary-wiring.md` | **pack 0.24** | Yielded 0.23 to `engine-leverage`. Rebase cost if #1 slips is one string |
| 3 | `rfc/live-surface-honesty.md` | **nothing versioned** | Independent of both — can land in parallel if you have room. Adds **no register rows at all**: its Active row already exists |

All three were cross-reviewed by an agent that did not write them, with fixes applied
**in the body**. Status lines read `accepted`, not a banner.

**`rfc/live-surface-honesty.md` carries one row you should read before starting:** **D101**
— `SILENT_ASSISTANCE.boardLighting` is `"legal"`, not `"off"`, so the silent floor is the
floor in **eight of nine fields**. Its own cross-review caught it against the RFC's claim
that *"nothing it does can turn anything on"*. Bounded there to rung 0 with a test, so a
later widening of the constant cannot smuggle in a second exception.

## 1. Acceptance-criteria completion — still authorized, still unstarted

Independent verification found substantive work **inside already-accepted RFCs**. Not new
scope; the criteria those RFCs already carry. Take this when a landing above is blocked.

**`fixture-realism`:**
- Criteria **3, 6, 8, 11** each say *"demonstrated, reverted, recorded"* — **none of those
  demonstrations is recorded** in `planning/fixture-realism/log.md`. Criterion 11's is
  *simulated inside the test itself*, which proves the helper works rather than that the
  gate binds. Run each against the real tree, revert, record the red run.
- `productionSources()`/`packageContentTests()` recurse into `packages/*/node_modules`.
  Harmless today only because pnpm's entries are symlinks; a non-symlinked dependency with
  `.ts` files would silently pollute the discovered set.

**`client-surface-floor`:**
- Criteria **4, 7, 9** demand pre-change red runs be recorded; the log records the
  containment correction but not those.
- Criterion **8(a)** shipped as a regex on the exact string `viewerRole !== "host"` rather
  than "no `viewerRole`-conditioned control" — `{#if viewerRole === "spectator"}` slips past.
- **C8** required the surviving `document.scrollingElement` guard be kept **and annotated
  in-file** with why it is structurally constant at ≤719 px. A failure-message string
  landed; the annotation did not.

**Then both can archive** — ledger flip **and** the `planning/exploration/log.md` entry in
the archiving commit. Neither has the exploration-log entry yet.

**One cross-draft collision, already resolved on paper:** `client-surface-floor` criterion
8(b) asserts `permission.arrows === "sight"`. It lands first unchanged; `format-surface`
amends that criterion to `boardLighting` alone when it retires the field. Do not
pre-emptively change it.

## 2. Small and unowned — take whenever a wave has room

- **D60 — OWNER RULED: apply `[1000, 2400]` and close it.** Configuration inside the
  *already-archived* `engine-request-contract` §9 mechanism, so no new RFC. Set the
  configured bound, intersect with advertised per §9, flip D60. Dossier:
  `design/research/maia-band-calibrated-range.md`.
- **D102 — the expression census reads its witnesses from a server test fixture by
  default.** Default path is `apps/server/src/fixtures/expression-witnesses.json`; the 26
  real witnesses the content wave authored live at
  `content/witnesses/expression-witnesses.json` and must be passed with `WITNESSES=`. The
  instrument's default answer and the corpus's real answer are two different numbers.
  **One-line repoint plus deleting the fixture.**
- **D73** — out-of-range `Elo` saturates silently: 9000 *is* 5000, byte-identical on 51/51
  positions, no error field.
- **D74** — nine of twelve malformed `Elo` forms leave the previous band in force.
- **D58** — an Elo-less Maia request inherits the previous request's band. Same file and
  same shape as D73/D74; route all three into one change or the next sweep re-finds them.

## 3. Gated — do not start

- `rfc/teacher-surface.md` — **owner-blocked** until `live-marker-quality` reaches
  `implemented`. Explicit ruling, not an oversight.
- `rfc/feedback-delivery.md` — returned for author revision; revision in progress.
- `rfc/format-surface.md` — drafted tonight, **awaiting cross-review**. Claims pack **0.25**
  behind 0.23 and 0.24, so it is already third in the pack lane regardless.

## Protocol reminders

- **The ledger flip rides in the implementing commit**, and **the exploration-log entry
  rides in the archiving commit.** Two of three implementations on 2026-08-15 wrote only
  their own `planning/<rfc>/log.md`; for the second time, the one that shipped a false
  deferral was among them.
- **`design/BACKLOG.md` is a shared ledger, not an intent doc.** Flipping the rows your own
  commit ships is the protocol working, not a law-5 breach. Law 5 protects `design/00`–`06`.
- Cite `design/BACKLOG.md` rows by **row title**, never line number.
- **Locate by symbol name, not line.** The tree moved ~12 times today.
- Claude's standing error, recorded so you can call it: **a ruling in a header banner is
  not a ruling in the body.** Codex caught this twice — on `deviation-classes`, and again
  on `fixture-realism` + `live-marker-quality`.
- Claude's second standing error: **`git add` on shared ledger paths while you have
  uncommitted edits there.** It has absorbed your flips into its commits once. Say so if
  it happens again.
