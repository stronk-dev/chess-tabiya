# Content era — the job plan

Tier: a standing **planning job** (like `planning/exploration/`), not an RFC —
authoring is production work, not a system to be spec'd. Design source:
`design/04-content-architecture.md`. Authoring guide + regression list:
`archive/brief-v2/product/content_pack_authoring.md`.

**Two deliverables, equally weighted.** Batch 1 must produce (a) usable content
and (b) **the contracts four RFC attempts could not honestly define**. A pack
that ships content but yields no contract input has half-failed.

## 1. Instrumented authoring cost (Q7 / K10)

One number per pack is useless — it says "expensive" without saying what to fix.
Every session logs **six categories separately**, in minutes, to `log.md`:

| Category | What counts |
|---|---|
| `research` | choosing roots, reading theory, explorer/corpus lookups, source citation |
| `encoding` | writing the pack JSON: spine, objectives, checkpoints, deviations, claims |
| `engine-validation` | Stockfish/Syzygy checks, fixing what validation refutes |
| `review` | the reviewer's pass (owner), incl. their reading time |
| `revision` | rework after review or validation |
| `tooling-friction` | time lost to missing tools: hand-writing FENs, no preview, no lint feedback loop, manual re-runs |

Session entry format (append-only):

```
## <date> — pack <id>, session <n>
research 45 · encoding 90 · engine-validation 30 · review 0 · revision 20 · tooling-friction 35
notes: <what was slow and why; what tool would have removed it>
contract-gaps: <what the format could not express — see §3>
```

**The decision rule:** `tooling-friction` above ~25% of total is a tooling
verdict, not a cost verdict — the answer is importers/preview/lint, not more
hours. `encoding` dominating means the format is wrong. `revision` dominating
means objectives are being written after engine analysis instead of before
(the authoring guide's rule).

## 2. Batch 1 — one pack per phase (measure before scaling)

- [ ] **Pack A — anti-Caro Advance** (opening, faced-not-chosen). 1.e4 c6 2.d4
      d5 3.e5 tabiya; the c5/f6 break race; Bf5 placement; Tal 4.h4 line.
      Carries ≥1 real timing window — this is the tempo contract's first
      encoding target.
- [ ] **Pack B — Carlsbad minority attack** (middlegame structure). Both plans
      (b4-b5 vs central e4 break), both colours, ≥2 plan classes per root.
- [ ] **Pack C — 4v3 rook endings** (endgame). Convert/hold/save variants;
      Syzygy ground truth; roots from canonical theory **and** from real
      1400–2000 games.
- [ ] **Trajectory D** linking A→its middlegame→a rook ending, proving the
      cross-phase claim on real content.

Authoring: claude drafts, owner reviews (named reviewer; strong-reviewer
recruitment remains research queue 9). Every claim needs a citable source per
the rights rule — original prose only, ideas cited, annotation text never
copied.

## 3. Contract harvest (the second deliverable)

While authoring, capture what the shipped format **could not express**. Each
pack ends with a written note answering:

- Which claim wanted a trigger the schema has no vocabulary for?
- What did the timing window actually need — `planMoves`? `opponentArrival`?
  something neither withdrawn RFC guessed?
- Where does authored territory really end, and did the boundary combinator
  ("plyHorizon caps, does not grant") match the intuition in practice?
- Which objective type was needed but unsupported (`save`/`resist`)?
- What did the reviewer want to see that no evidence source can produce?

These notes are the input to re-attempting the withdrawn RFCs
(`rfc/withdrawn/`) — read their withdrawal notes first so the same ground
isn't relearned.

## 4. Exit criteria

Batch 1 is done when: three packs + one trajectory are reviewed and published;
the six-category cost table has real numbers; the contract-harvest notes exist;
and a written verdict on K10 (pack production cost) is logged in
`planning/exploration/log.md` with the tooling priorities it implies.
