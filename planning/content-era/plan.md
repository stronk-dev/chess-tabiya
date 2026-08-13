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
| `review` | **retired 2026-08-13** — there is no reviewer pass. Historical entries stand; new entries log `0` |
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

## 1b. Whose cost are we measuring? (correction, 2026-08-12)

The six-category model implicitly assumed a human author. In this project the
author is **claude** and the reviewer is **the owner**, so the numbers mean
something different — and arguably more relevant: K10's real question here is
not "can a human hand-write packs affordably" but **"can this owner+agent
pipeline produce reviewed packs affordably."**

Therefore log two clocks, never merged:

- `agent-*` — the six categories as spent by the authoring agent.
- `owner-review` — the owner's actual reading/judging/correcting time.

The K10 verdict is on the **pipeline total**, dominated in practice by
`owner-review` + `revision` (an agent can encode fast; only the owner can say
whether the chess is right). If owner-review per pack does not fall as packs
accumulate, that is the real cost ceiling — tooling cannot fix judgment time,
only content reuse and better first drafts can.

**Correction, 2026-08-13.** `owner-review` stood at **0 minutes across all three
packs** — the clock this section called decisive never started. The owner's ruling
draws the conclusion rather than waiting longer for it: there is no pack review
workflow and there never will be one, so the clock is retired rather than left
running at zero. K10's verdict is therefore on `agent-*` plus `revision` plus
whatever grounding work (citation hunting, engine passes) the §3b bar actually
demands — which is measurable, unlike judgment time nobody was spending.

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

Authoring: claude drafts; there is no review step (ruling 2026-08-13, §3b).
Every claim needs a citable source or a mechanical check per §3b and the rights
rule — original prose only, ideas cited, annotation text never copied — and every
claim that has neither is named in the pack's own `graduationBlockers` and stays
there.

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

## 3b. Graduation bar (codex review, 2026-08-12; reviewer sign-off struck 2026-08-13)

**"Original prose" satisfies copyright, not grounding.** A pack may sit in
`draft` with agent-authored, uncited strategic claims. It may **not** be
`published` until **every strategic assertion in the pack** has grounding. The
complete assertion set (widened after codex review — the earlier list named only two
of five, while the provenance block admitted all five were ungrounded):

1. `objective.summary`
2. every `planClasses[].description`
3. every `spine[].annotations` entry
4. every `feedbackClaims[].text`
5. every `deviations[].note` **and its `class` judgment**

Each needs one of **two** things:

- a citable source (Wikibooks CC BY-SA theory with attribution, an annotated
  master game, a named book/course *idea* restated in our words), or
- engine/corpus/tablebase validation that actually bears on the claim (Stockfish
  at fixed depth on the concrete line; Syzygy where the material is inside seven
  pieces; explorer frequency for "this is common at 1600").

Otherwise the product ships fluent, ungrounded assertion under an authored
label — the exact failure ADR-0005 forbids, arriving through the content door
instead of the LLM door.

**The third route is struck (owner ruling, 2026-08-13).** This list previously
ended with "a strong reviewer's explicit sign-off". **There is no pack review
workflow and there never will be one.** A sign-off gate nobody performs is worse
than an honest label, because a status nobody can grant implies a check that never
happened — and `owner-review` had stood at 0 minutes across all three packs, which
was the evidence. Consequences for this bar, stated rather than left implied:

- an assertion that neither a source nor an instrument can reach **stays
  ungrounded, permanently and in writing**. It is named in the pack's own
  `graduationBlockers` and it does not become groundable by anyone reading it.
  Pack C's practical-difficulty judgments and Pack B's three-plan taxonomy are the
  live examples;
- some assertions are unreachable by material, not by effort. Pack C sits at eleven
  pieces, so no tablebase applies to any node in it and none ever will;
- what replaces the reviewer's assurance is not another assurance. It is the
  **publication channel** (`rfc/pack-studio.md` §10): a pack says where it came
  from, and nothing anywhere says it was checked.

**Enforcement status, stated honestly.** This is still a process barrier, not a
per-assertion validator rule: `graduationBlockers` is untyped extra metadata, and
per-assertion grounding cannot be enforced until the evidence encoding exists (a
content-era output, not an input). What *is* enforceable and what changes:

- **shipped today**: `pack-check` fails any pack whose `reviewStatus` is not
  `draft` while `provenance.sources` **or** `provenance.reviewers` is empty
  (`apps/server/src/pack-validation.ts:87-109`, `GRADUATION_REQUIRES_SOURCES` /
  `GRADUATION_REQUIRES_REVIEWERS`);
- **after `rfc/pack-studio.md`**: the sources half survives, re-keyed on
  `published`; the reviewers half is **deleted** along with the field it reads,
  because it demanded a name nobody can supply. Registration additionally refuses
  any pack that still carries a non-empty `graduationBlockers`, which turns this
  section's convention into a precondition for the first time — author-declared,
  and honest about being author-declared.

## 4. Exit criteria

Batch 1 is done when: three packs + one trajectory have every §3b assertion either
grounded by a citable source or a mechanical check, or named in their own
`graduationBlockers` as permanently ungrounded with the reason; the six-category
cost table has real numbers; the contract-harvest notes exist; and a written verdict
on K10 (pack production cost) is logged in `planning/exploration/log.md` with the
tooling priorities it implies.

"Reviewed and published" was the previous wording. Nothing is reviewed, so the
exit criterion is grounding coverage plus honest labelling of what could not be
grounded — which is what the three packs' rewritten blockers now record.
