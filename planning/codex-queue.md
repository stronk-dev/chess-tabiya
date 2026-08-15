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

## 1. Acceptance-criteria completion — completed and archived 2026-08-15

`fixture-realism` and `client-surface-floor` completed every recorded red/green
demonstration, hardened their production-discovery guards, passed both gates, and moved
to `rfc/archive/` with their planning directories. **Do not take this item again.**

**Surviving cross-draft note:** archived `client-surface-floor` criterion 8(b) asserts
`permission.arrows === "sight"`; `format-surface` owns removing that assertion when it
retires the field.

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
