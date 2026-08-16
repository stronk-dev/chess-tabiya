# Fun mechanics outside roguelikes — drip, experimentation, and fun without a power curve

**Question (owner, 2026-08-15/16):**

> *"even if the drills are poor for the campaign, there MUST be novel gamemodes, variations,
> minigames, puzzles, ANYTHING out there with which we can enhance the campaign mode… we might
> want to explore OTHER gameplay ideas… from idle games to stardew valley to other
> roguelikes… ANYTHING that's fitting for chess, but allowing people FUN in the campaign
> runs… and EXPERIMENTATION while LEARNING."*

`design/research/roguelike-run-design.md` studied six roguelikes and asked what *shape* a run
should have. This dossier is the deliberate widening: **fifteen genres outside the roguelike,
plus the chess-adjacent formats that already exist**, against three questions the campaign
cannot answer from inside the genre it borrowed its frame from —

1. **What mechanics drip-feed CONTENT enjoyably**, rather than gating it?
2. **What makes EXPERIMENTATION fun rather than dutiful**, when the thesis has already made it
   free?
3. **What creates fun WITHOUT a power curve?** — the hard one, and the one the roguelike set
   is structurally the *wrong* place to ask, because every game in it has a power curve.

It also tests the owner's own read of the content unit (*"drill packs are micro-DLC"*) against
the shipped code, and finds it is right about the *role* and one level off about the *grain*.

**Working method, per the standing adoption posture** (`design/02`, owner amendment
2026-08-14): a collision with an invariant is a **design prompt, not a veto**. Every mechanic
below that collides with a law gets its invariant-compatible transformation designed rather
than filed as refused. Refusal is last resort and carries an argument. Two mechanics are
refused here and both refusals are arguments, not shrugs.

**One sentence.** The genres that solve *fun without power* solve it with exactly three
devices — **score the solution not the outcome**, **make knowledge the key**, and **buy
variety with setup selection rather than progression** — and this product already owns
runnable versions of all three, two of them sitting in shipped code with **zero consumers**;
the drip question is answered not by a new economy but by the **daily-cadence + shareable-shape
pattern** and by a **collection axis that is authored, stored, indexed and switched off by one
injectable class**; and the campaign's unit is **the run, not the pack** — the runtime says so
in a three-value type, and the owner's micro-DLC framing is correct with the pack as a
*contribution to a node* rather than as the node.

---

## Method, and its limits stated first

1. **Repo claims are `[V]`**, derived in this pass at `c55b9cf`. Pack counts are a Python walk
   over `content/drafts/*.json`, canonical packs = those declaring a `phase`, with
   `.evidence.json` / `.job.json` / `.sources.json` sidecars and `.browser.json` fixtures
   excluded — the **same selection** `campaign-effect-vocabulary.md` §Method,
   `roguelike-run-design.md` §2c and `campaign-intermediate-consequence.md` §Method used, so
   the counts are directly comparable to theirs. Several of theirs have moved; §1 says which
   and by how much.
2. **Every external game fact is `[P]`** — wikis, developer talks and community sources,
   checked in this pass against the cited URL, not against a play session. Where a number is
   community consensus rather than a rule, it is marked as such.
3. **No hands-on with any comparison game in this pass**, the same limit the two predecessor
   dossiers declared.
4. **Nothing here is measured about our learners.** Every claim about how a mechanic would
   *feel* is `[M]` and is exactly what R6/R7/R8 gate. A mechanic's "what would kill it" line is
   the falsifier, not a hedge.
5. **Deliberate exclusion:** monetary design. Gacha is mined for its *anticipation and
   rotation* mechanics only; ADR-0007 makes the monetary half unavailable and uninteresting.

---

## 1. Fact refresh — five numbers the campaign cluster is reasoning with have moved

This section exists because the campaign cluster's three prior dossiers all rest on a
37-pack corpus, and two of their **load-bearing cost arguments are now discharged**. All `[V]`
at `c55b9cf`.

| Quantity | Prior dossiers | Now | Consequence |
|---|---:|---:|---|
| Canonical packs | 37 | **47** | Catalogue arithmetic below |
| **Middlegame packs** | **1** | **11** | **`06` §5's *"Act II is impossible today"* is discharged** |
| Packs by phase | 20/1/14/2 | **20 opening / 11 middlegame / 14 endgame / 2 cross_phase** | A phase-shaped map is now buildable |
| Packs by mode | line 20 · outcome 17 · plan 1 · traj 4 | **line 20 · outcome 13 · plan 11 · trajectory 3** | `BACKLOG:627` (*"Plan Drill is essentially UNAUTHORED"*) is **stale** |
| Deviations / checkpoints | 275 / 145 | **330 / 189** | Read-once content decay (§4c of the predecessor) scales with it |
| `authoredBoundary.plyHorizon` declared | 36 of 37 | **46 of 47**; median **10.5**, mean **12.8**, range **6–40** | Device D still shipped; the median *fell* because the 10 new middlegame packs declare 6–10 |
| Shape entries referenced by ≥1 pack | 16 of 25 (D44: 9 orphans) | **21 of 25** — orphans are `hanging-pawns`, `knight-vs-bishop`, `up-an-exchange`, `vancura` | **D44 shrinks from 9 to 4** |
| `timingWindows` authored | **0** | **4** | `BACKLOG:634`'s "four vocabularies with zero usage" is down to two |
| `variantOf` authored | **0** | **2** | Same |

The middlegame move landed in one commit — `aee7c64`, *"content: ten middlegame packs — Act II
is no longer one pack"* `[V]`. **All eleven middlegame packs declare `targetElo: 1800` and
`mode: "plan"`**, and their objectives now span five kinds (`reach_structure` 5,
`preserve_plan_window` 4, `execute_break` 1, `prevent_opponent_plan` 1) where the corpus
previously had one. Per-phase `plyHorizon` medians are **opening 11 · middlegame 8 · endgame 24
· cross_phase 10**.

**What this changes for the campaign, stated plainly.** `roguelike-run-design.md` §5b item 3
priced Act II at **2.2 agent-hours** (or 3.25 with route choice) and called it *"the price of
Act II existing at all"*. That bill is paid. The 9-node / 3-act shape's one content
prerequisite is met, and the binding constraint moves from *authoring* to the two things §5b
lists as **plumbing** — server-held inventory and per-lens grain. **The 9-node recommendation
should be re-derived rather than inherited**: 9 nodes is now **19.1%** of a 47-pack catalogue
(**5.2 runs** before repetition, up from 4.1), and even 15 nodes is 31.9% / 3.1 runs. The
catalogue argument for nine over fifteen has weakened; the *decay* argument (§4c) and the
minutes argument have not.

**And one number moved the wrong way for the drip question.** `content/packs/` contains
**only `.gitkeep`** — every one of the 47 packs is a *draft*, all 47 carry
`provenance.graduationBlockers` (**240 entries**), and production therefore serves **one** pack,
the schema example (`rfc/pack-graduation.md` §Exploration gate, ledger row D162) `[V]`. So the
product already has a **content release gate with a three-state lifecycle**
(`schema_example | draft | published`) and 47 items behind it. That matters for §2: the drip
question is asking for a *second* gate, learner-facing, and building it on the first would be a
category error. They have the same shape and different owners.

---

## 2. The constraints, extended — and three shipped assets nobody has counted

`campaign-intermediate-consequence.md` §1 enumerated **C1–C10** from the live docs and derived
a residue: only three kinds of consequence survive — denominated in the learner's
**information**, in **the position itself**, or in **self-inflicted opportunity cost**. That
set is inherited here unchanged and every mechanic below is checked against it. This wave adds
four constraints that the wider genre sweep makes load-bearing and that the roguelike frame
never surfaced.

| # | Constraint | Source | What it forbids |
|---|---|---|---|
| **C11** | **Our readable content is finite and read-once.** 330 deviation notes + 189 checkpoints over 47 packs; a Jaw Worm is the same fight the fortieth time, a deviation note is not | `roguelike-run-design.md` §4c, recounted `[V]` | Any drip whose *supply* is authored prose, unless the drip is priced against that supply |
| **C12** | **The run, not the pack, is the runtime's unit.** `RunSessionKind = "pack" \| "position" \| "imported"` (`packages/runtime/src/types.ts:36`) — two of three carry no pack | `[V]` this pass | Any campaign design that assumes a node ⇒ a pack; and any that assumes a pack-less node can be **graded** (see §7) |
| **C13** | **Nothing is published.** `content/packs/` = `.gitkeep`; 47 drafts, 240 `graduationBlockers` | `[V]`, `rfc/pack-graduation.md` | Any learner-facing unlock gate that reuses the *authoring* gate's states |
| **C14** | **Variants are a named, published refusal, not an omission.** `UCI_Chess960` is `disposition: "refused"`, reason *"The shipped drill format is standard chess only"* (`apps/server/src/capabilities.ts:105`) | `[V]` | Adopting a chess variant as a minigame without amending a published capability refusal — the refusal is category (B) of the audit's "100%" definition, so changing it is a *documented* act, not a free one |

### 2a. Three assets that already ship, and are not in any campaign document

Each of these makes a mechanic below cheap, and none is cited by `06`, by
`campaign-effect-vocabulary.md` or by `roguelike-run-design.md`.

**(i) The capability suppressor ships end to end — not "architecturally", literally.**
`roguelike-run-design.md` rank 3 called the Balatro boss blind *"architecturally the same shape
as something already shipped"*. It is stronger than that. `AssistancePermission` is
`"free" | "locked_off" | "sight" | "evidence"` (`packages/runtime/src/assistance.ts:20`) — a
**suppression value in the shipped type** — with all three layers behind it:

- the **producer**: `permittedAssistance` returns `locked_off` for `humanSplit`/`corpus`
  whenever `role` is not solo/host or `deliveryOpen` is false (`assistance.ts:29`);
- the **server refusal**, by name: `ASSISTANCE_WITHHELD` thrown at `rest.ts:1090` and `:1107`,
  plus a third enforcement at `service.ts:826`;
- the **honest UI sentence**: the control renders disabled with
  *"Available only after this run opens feedback, and never to participants or spectators."*
  (`apps/web/src/lib/DrillScreen.svelte:717-720`) `[V]`.

`AssistanceContext` has exactly **three** fields — `sessionKind`, `deliveryOpen`, `role`. A
boss suppression is one more input. **But it must not be a fourth field on that function**, and
this is the design constraint this pass contributes: `permittedAssistance` is the **honesty**
gate (`06` §3 law 1 — honesty outer, inventory inner), so putting a *game* rule inside it would
make a campaign decision indistinguishable from an honesty decision, and the learner would be
told a lie in the shape of a truth. The transformation: an **inner-gate mask** that composes
with `permittedAssistance`, reuses the `locked_off` value and the `ASSISTANCE_WITHHELD` error
code, and carries **a different sentence** — *"this encounter withholds X"* is a game statement
and *"X is not honestly available here"* is an honesty statement, and one screen must never
render them identically.

**(ii) A five-kind variety vocabulary is authored, validated, counted, and consumed by
nothing.** `RETRY_VARIANT_KINDS = ["same_root_new_defense", "alternate_plan_class",
"related_position_same_idea", "opposite_side", "different_material_details"]`
(`packages/schema/src/drill-pack/types.ts:27-33`). **9 variants across 7 of 47 packs** are
authored `[V]`. The only consumers repo-wide are the schema barrel and a `pack-check` *counter*
(`apps/server/src/pack-check.ts:24`, `:83`) — no runtime, no client, no route. This confirms
`campaign-effect-vocabulary.md` §2c's finding at the larger corpus and sharpens it: those five
strings are a **Dominion kingdom** (§5c) sitting in the schema, i.e. *the same board asked a
different question*, which is precisely the fun-without-power device.

**(iii) The cross-pack collection axis is authored, stored, indexed — and namespaced apart by
one injectable class.** Packs declare `concepts`: **186 tags, 156 distinct across 47 packs**,
of which only **24 appear in ≥2 packs** (`advance-chain-base` in 6, `break-timing` and
`arrangement-before-action` in 3) `[V]`. They reach a real table — `attempt_concepts(run_id,
branch_id, pack_id, concept_key, label)` with an index on `concept_key`
(`apps/server/src/storage.ts:2529-2538`) — and two live queries join it. **But the default
resolver is `PackScopedConceptResolver`, whose key is literally ``pack:${packId}#${raw}``**
(`apps/server/src/progress.ts:56-59`), so `advance-chain-base` in six packs is **six distinct
keys**, and the related-attempt query is additionally scoped `AND a.pack_id = ?`
(`storage.ts:1388-1393`). `ConceptResolver` is an **injectable interface**
(`progress.ts:52-54`), so a corpus-global resolver is a one-class change.

> **Read those three together and the shape of this dossier's answer is already visible.** The
> suppressor, the variety vocabulary and the collection axis are the three devices §5 will
> identify from outside chess entirely — and all three are shipped, unused, and cost plumbing
> rather than content.

---
