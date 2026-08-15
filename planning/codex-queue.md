# Codex queue — refreshed 2026-08-15 (night)

**Landed and verified today (9 waves):** `authoring-frictions` 0.16 ·
`validator-integrity` · `tempo-vocabulary` 0.17 · `resistance-spectrum` run 0.14 ·
`predicate-wave-3` 0.18 + shape-entry 0.3 · `opening-evidence-path` 0.20 ·
`branch-set-scale` · `deviation-classes` 0.21 · `transition-primitives` 0.22 ·
`expression-census` · `engine-request-contract` run 0.15 / migration 20.
**591 tests / 96 files, browser 24 at zero retries.**

## 1. `rfc/fixture-realism.md` — READY

Claims **nothing versioned**. Cross-reviewed; owner ruling applied **in the body**,
not just a banner.

**The ruling:** NARROW the tolerance toward the measured envelope, and the E4 floor
**stands as written** — do *not* restate it as instrument-reachable. Pick the
constant from the measured envelope (Maia's worst case is **9.25e-08** against the
shipped **3.81e-06**, 41× wider), state the headroom factor, and add the fixture
that crosses it. A later engine build that starts refusing is the guard working.

Cross-review found the RFC was one gate short: §5b and §5c each bought themselves a
gate while **E4's floor — the rule at the centre of D56 — was prose nothing
checked**. §5d's register fails today, deliberately. It also re-measured the code
register: **194 distinct codes, 111 without direct disposition** across seven
emission forms, not the 59/45 claude had ledgered from one family.

## 2. `rfc/live-marker-quality.md` — READY, with D68 to settle

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

## 3. `rfc/client-surface-floor.md` — READY (owner ruling landed)

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
