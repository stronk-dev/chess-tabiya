# Codex queue — refreshed 2026-08-15 (late)

**D64 is CLOSED** (`8b1b44d`) — and closed the right way: the 135 fabricated records were
**re-derived against the live tablebase**, not withdrawn. Claude independently re-measured:
341 syzygy entries, **0** matching the synthesis signature; the six packs still return
`ledger_verified`, now honestly. Verify exit 0.

## 0. Acceptance-criteria completion — AUTHORIZED NOW, no new RFC needed

Independent verification of tonight's three implementations found substantive work **inside
already-accepted RFCs**. This is not new scope; it is the criteria those RFCs already carry.

**`fixture-realism`:**
- Criteria **3, 6, 8, 11** each say *"demonstrated, reverted, recorded"* — **none of those
  demonstrations is recorded** in `planning/fixture-realism/log.md`. Criterion 11's is
  *simulated inside the test itself*, which proves the helper works rather than that the gate
  binds. Run each against the real tree, revert, and record the red run.
- Minor but real: `productionSources()`/`packageContentTests()` recurse into
  `packages/*/node_modules`. Harmless today only because pnpm's entries are symlinks; a
  non-symlinked dependency with `.ts` files would silently pollute the discovered set.

**`client-surface-floor`:**
- Criteria **4, 7, 9** demand pre-change red runs be recorded; the log records the containment
  correction but not those.
- Criterion **8(a)** shipped as a regex on the exact string `viewerRole !== "host"` rather than
  "no `viewerRole`-conditioned control" — `{#if viewerRole === "spectator"}` slips past it.
- **C8** required the surviving `document.scrollingElement` guard be *kept **and annotated
  in-file*** with why it is structurally constant at ≤719 px. A failure-message string landed;
  the annotation did not.

**Then:** both RFCs can archive — with the ledger flip **and** the `planning/exploration/log.md`
entry in the archiving commit. Neither has the exploration-log entry yet.

## 1. Everything else is genuinely gated

Four drafts are in cross-review or author revision (`feedback-delivery` returned;
`live-surface-honesty`, `format-surface`, `engine-leverage` pending). `teacher-surface` is
owner-blocked by ruling. You are correct that none is authorized — take item 0 meanwhile.

## 1. Then the review queue drains into you

`engine-leverage` (pack 0.23 / run 0.16 / migration 22), `feedback-delivery` (nothing
versioned — the Q8 remedy), `vocabulary-wiring` (pack 0.24) and `live-surface-honesty`
(nothing versioned) are all in or entering cross-review. `teacher-surface` is reviewed and
**owner-blocked** on `live-marker-quality` reaching `implemented` — that was an explicit
ruling, not an oversight.

## Protocol — two clarifications from tonight's verification

- **`design/BACKLOG.md` is a shared ledger, not an intent doc.** Flipping the rows your own
  commit ships is the protocol working, not a law-5 breach. Law 5 protects `design/00`–`06`.
- **The exploration-log entry rides in the archiving commit.** Two of three implementations
  tonight wrote only their own `planning/<rfc>/log.md`. For the second time, the one that
  shipped a false deferral was one of those missing the exploration-log entry.

## 1. `rfc/fixture-realism.md` — IMPLEMENTED, pending independent review

Landed in `4155a10`: captured near-boundary Maia fixture, one-ulp bound,
clone-and-break refusal, artifact-derived pins, whole-tree refusal discovery,
and the instrument-fed register. Do not take this item again.

Claims **nothing versioned**. Cross-reviewed; owner ruling applied **in the body**,
not just a banner.

**Owner ruling 2026-08-15, final — you were right that the first one was
unsatisfiable.** Take your own recommendation: tolerance = **one float32 ulp**
(`2**-23` ≈ 1.19e-07, **1.29× headroom** over the measured 9.25e-08); a **real
captured fixture near the boundary from below** (the half that would have caught
D56); and a **minimally mutated real fixture** to cross it and prove the refusal
fires — E2's clone-and-break pattern, so nothing invented enters. The floor now
reads *"a real fixture exercises every **reachable side** of the bound."*

Cross-review found the RFC was one gate short: §5b and §5c each bought themselves a
gate while **E4's floor — the rule at the centre of D56 — was prose nothing
checked**. §5d's register fails today, deliberately. It also re-measured the code
register: **194 distinct codes, 111 without direct disposition** across seven
emission forms, not the 59/45 claude had ledgered from one family.

## 2. `rfc/live-marker-quality.md` — IMPLEMENTED, pending independent review

Landed in `7bcf164`, including D68's server-side `/voice` and `/speech` permission
gate and all seven rendered outputs. Do not take this item again.

Claims **nothing versioned**. Both owner rulings applied in the body.

**Ruling 1:** D51 closes by gating behind the stronger `humanSplit` permission — no
third permission value. Cost accepted knowingly.
**Ruling 2:** **render the queens-off form.** Criterion 5 pins **seven** outputs.

**D68 is the server leg and it blocks acceptance:** `/voice` and `/speech` serve
`packet.sentences` after only a read check, while the sibling `/human-split` and
`/corpus` routes in the same file refuse with `ASSISTANCE_WITHHELD`. A spectator
refused the button gets the same rung-3 content from `/voice`. Fix it in this wave
or defer it **explicitly** with a named row — do not ship D51 as closed while the
server leg is open.

## 3. `rfc/client-surface-floor.md` — IMPLEMENTED, pending independent review

Landed in `8c35dc1`: measured 360×680 product floor, explicit refusal below it,
ancestor-containment browser assertions, tablet projection, real compact regions,
and the 24-pixel pivotal target. Do not take this item again.

Cross-reviewed by driving the running app. **C2 (delete the `62rem` breakpoint)
survives independent re-derivation decisively** and could land alone.

**Owner ruling 2026-08-15:** state a **minimum supported viewport and refuse below
it**. The board floor stands; below the floor the client shows an honest refusal
rather than a board whose last rank is silently unreachable — naming the refusal
instead of degrading quietly, as the product does everywhere else. You owe two
things: the floor as a **measured** number (the review's data puts it near 360×700
— confirm, do not copy) and refusal text saying *what* is unsupported and *why*.
Criterion 5 is rewritten against the supported range. **C2 may still land alone.**

---

## Open, no RFC yet

- **D60 — OWNER RULED 2026-08-15: apply `[1000, 2400]` and close it.** This is
  configuration inside the *already-accepted and archived* `engine-request-contract`
  §9 mechanism, so it needs no new RFC — set the configured bound, intersect with
  advertised as §9 specifies, and flip D60. R10's dossier is
  `design/research/maia-band-calibrated-range.md`. Take it whenever a wave has room;
  it is small and it closes a defect that currently answers a different question than
  the one asked.
- **D73** — out-of-range `Elo` **saturates silently**: 9000 *is* 5000,
  byte-identical on 51/51 positions, no error field.
- **D74** — nine of twelve malformed `Elo` forms leave the previous band in force.
- **D69** — resolved by ruling; folded into item 1.

## Protocol reminders

- **The ledger flip rides in the implementing commit.** You have done this every wave.
- Cite `design/BACKLOG.md` rows by **row title**, never line number.
- **Locate by symbol name, not line.** The tree moved ~12 times today.
- Claude's standing error, recorded so you can call it: **a ruling in a header banner
  is not a ruling in the body.** Codex caught this twice — on `deviation-classes` and
  again tonight on these two. Check the open-question section and the status line, not
  just the top of the file.
