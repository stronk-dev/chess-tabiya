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

## 3. `rfc/client-surface-floor.md` — BLOCKED on one owner ruling

Cross-reviewed by driving the running app. **C2 (delete the `62rem` breakpoint)
survives independent re-derivation decisively** and could land alone.

**Blocked:** at **360×640** the proposed board floor and full board visibility are
mutually unsatisfiable — the board's bottom lands at 643 px against a 640 px
viewport **with no scroller**, which is worse than the page-scrolling it replaces.
Acceptance criterion 5 cannot pass. Owner ruling pending on three exits.

---

## Open, no RFC yet

- **D60** stays open as you correctly left it. **R10 has now measured the answer:**
  `[1000, 2400]`, the widest interval that is strictly ordered *and* readable,
  refusing nothing that exists (all 63 `targetElo` values in `content/` are
  1100–1939) while refusing 50 and 9000. Applying it is an owner call.
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
