# Time controls — HEAD derivation for the D1041 lane

**Written 2026-08-23.** Code and RFC reads were taken against `1300303` (the commit carrying the
D1041 ruling); `40d2cd9` landed under this pass and moved `design/BACKLOG.md`, so **every ledger
cite below is refreshed to `40d2cd9`** while non-ledger cites are `1300303`. The working tree also
carries another agent's dirty files — `apps/server/src/*`, `apps/web/src/lib/board-input.ts`,
`packages/runtime/src/{evidence-*,index,mobility,pivotal,semantic-evidence,tempo}.ts`, `docs/*`,
`tools/d872-*`, `tools/exact-legal-mobility-harness/`, `planning/exact-legal-mobility/` — so line
numbers into those are **working-tree at derivation time**. All code line numbers were re-read at
source, never copied from the ledger (every ledger cite for `clockState` has drifted; see §2.1).
Nothing outside `planning/time-controls/` was created or modified. **This is a derivation dossier,
not an RFC and not a fix.**

---

## 0. Licensing status for drafting — stated first, per the D951 remedy

**PARTIALLY LICENSED. Arm (b) — real clocks in play — is licensed to draft. Arm (a) —
simulated pressure in drills — is licensed to draft only if the RFC's arm-(a) scope is limited to
depicting recorded facts; the *enforced* / *graded* form of arm (a) sits behind one unruled
owner fork this lane did not open and cannot close for itself.** Derived, not assumed:

| # | Gate | Where | Verdict |
|---|---|---|---|
| 1 | The general exploration gate | `rfc/0000-rfc-process.md:26-28` closes product-RFC drafting *"until the vertical slice has passed the continuation gates … **or an owner ruling** (logged in `planning/exploration/log.md`) **opens a specific RFC early**"* | **OPEN.** `planning/exploration/gates.md:198`: *"**Owner override 2026-08-12** (logged): RFC drafting opened with E1 met, E2 advisory, and E3/E4/E5 accepted as in-flight risk."* Twenty-plus active RFCs sit on that override |
| 2 | A lane-specific standing gate (the D951 class) | The gate that produced D951 is `planning/campaign-research-queue.md:4-5` and names the **campaign** RFC only. Grep for `D330\|D355\|D357\|D364\|time control` across `planning/`: hits are `platform-alignment/refused-vs-asked.md` §1.3 and `decision-queue.md:114-115`, both of which *report the absence of a lane*, not a gate | **NO STANDING GATE.** Nothing in `planning/` forbids a time-controls RFC |
| 3 | Law 1's *"no RFC from a GAP row"* | The research base exists and is measured: `design/research/time-as-a-difficulty-lever.md` (43,272 rendered items, the 10+0 arithmetic, the code census) and `tools/d355-reading-cost-harness/`. `tools/d947-broadcast-roundtrip-harness/roundtrip-output.md:12` supplies the `[%clk]` inventory | **SATISFIED for arm (b)**; see the arm-(a) caveat below |
| 4 | **D357's own stated ordering constraint** | `design/BACKLOG.md:1002`, verbatim: *"So the clock ruling should not be taken before the hint-ladder ruling"*, blocking on the D317–D326 owner question (whether the `move` item becomes purchasable pre-commit) | **STILL UNRULED.** D317 is `💡 open` at `design/BACKLOG.md:1445`; the a/b/c fork appears in **no** row of `planning/platform-alignment/decision-queue.md`. D1041 rules the clock **anyway** — which the owner is entitled to do — but D357's finding survives the ruling and re-aims at arm (a): under option (c) *"a clock becomes a cheating amplifier"* |
| 5 | Law 8 | Arm (b) is arithmetic over rules and wall time — clean. Arm (a) is **not automatically clean**: see §3 | **Arm (b) clean; arm (a) conditional** |

**What D1041 actually did.** `design/BACKLOG.md:374` reads *"⚖️ ruled — lane opened, derivation
commissioned."* It commissioned **this document**, not a draft. Per the D951 remedy the drafting
fork must re-check this section before writing bytes; on the reading above it may write arm (b)
and the *depicted* half of arm (a), and must return to the owner for the enforced half.

**One sequencing note, not a gate.** The run-schema lane at 0.18 is already claimed
(`rfc/README.md:134,277` — `bot-policy.md`, positioned behind `longitudinal-store`). Typing
`clockState` is a run-schema bump, so this lane claims **0.19 or later** and lands behind
`bot-policy`. Drafting waits on nothing; the *migration position* does.

---

## 1. The owner's asks — quoted in full

### 1.1 D1041 — the ruling that opened the lane (`design/BACKLOG.md:374`)

> **OWNER RULING 2026-08-23 ([[D330]]/[[D355]]/[[D357]]/[[D364]]): time controls ship BOTH ways
> — simulated pressure in drills AND real clocks in play.** The full feature, chosen over the
> narrower simulated-only recommendation: (a) **simulated pressure as a drill dimension** — the
> owner's original 2026-08-16 idea, *"simulate the time pressure of a GREAT move during 10+0
> chess and then give actual time"*, teaching what a strong move costs under time without running
> a clock during rehearsal; (b) **real clocks wherever a game is played** — Just Play, matches,
> campaign encounters. Consequences to carry into the lane: `clockState` stops being a
> zero-reader passthrough; bots need move-time models (`bot-policy` refuses *artificial move
> delay* at `:638` — that refusal is now scoped to guard-disclosure honesty, not to clocks);
> rating interacts with timed play; campaign encounters gain a timed class. **Three documents
> refused this on their own authority while the owner's fork sat unqueued since 2026-08-16**
> ([[D1037]]'s class)

### 1.2 D330 — the origin idea (`design/BACKLOG.md:987`)

> **There is no time control in this product at all, and `clockState` is a passthrough nothing
> reads.** Owner idea 2026-08-16: *"what if we want to simulate the time pressure of a GREAT move
> during 10+0 chess and then give actual time?"* Measured: `clockState` is typed
> `Record<string, unknown>` on both `DrillRun` and the start options, is set from `rest.ts`, is
> persisted — and **has zero readers**. No clock, no increment, no per-move budget, no display, no
> expiry. Separately and importantly, **`clock_zeroed` is the HALFMOVE clock** — a fifty-move-rule
> counter — and **`timingWindows` is MOVE-COUNT tempo, not clock tempo**; both names invite the
> conflation and neither is a clock. So the owner-s proposal has **no mechanism whatsoever**
> today, and the honest first question is not *how do we build a clock* but *what is the smallest
> thing that produces the felt pressure* — a countdown that ends the encounter, or a soft budget
> that changes what assistance can be consumed. See [[D331]], which is why this is worth more than
> it looks

**One clause of this row is wrong and §2.1 corrects it in the tree**: `clockState` is on **`Node`**
and on the **per-move** options, never on `DrillRun` and never on the run-start options. D355
already found this; D330 was never edited to match. It matters, because the altitude is the whole
of D355's argument.

### 1.3 D355 — the altitude finding (`design/BACKLOG.md:1000`)

> **A game clock is NOT the refused pursuit clock — the discriminator is whether the budget
> survives a rewind, and it is one field's altitude.** `design/06` §5 refuses *"a pursuit clock is
> a retry price by another name"*, and §2c's own decomposition says only **how often** you may
> retry conflicts with `00` §76's *"experimentation without cost"*. Tested: a **run-pooled** clock
> makes the *k*-th retry cost more than the first — it is a rewind budget with a real-valued
> counter and the refusal is exactly right. An **attempt-scoped** clock that resets at the fork
> prices *deliberation inside one attempt* and touches none of §2c's three separable ideas. **The
> shipped placeholder already picked the safe altitude** `[V]`: `clockState` is declared on
> **`Node`** (`packages/runtime/src/types.ts:111`, alongside `branchId` at `:107`; mirrored at
> `schemas/drill_run.schema.json:265`) and written only from `CommitMoveOptions.clockState`
> (`runtime.ts:57`, applied `:341`) — nodes are path- and branch-scoped, so a clock built on the
> reserved field **rewinds with the board automatically**, and the refused version needs a **new
> run-level field**. That makes the ruling checkable in a diff rather than in prose. Two
> counter-arguments given in the dossier: a resetting clock has no teeth unless flag-fall rides
> `06` §5's *submitted-branch* verb (it can, and needs no new refusal class); and `06` §5's
> power/legibility dichotomy has **no slot** for a device that shrinks the learner's own capacity.
> `design/research/time-as-a-difficulty-lever.md` §2

### 1.4 D357 — the cheating-gradient finding (`design/BACKLOG.md:1002`)

> **The answer is the cheapest thing this product could ever print, so a clock is a gradient
> TOWARD cheating.** Measured per-item medians `[V]`: `move` **1 word / 0.3 s**, `kind` **6 /
> 1.5 s**, `fact` **9 / 2.3 s**, `ranking` **63 / 15.9 s**. Inside one 10+0 move budget (15 s) a
> learner can read the answer **50 times over**, or **0.94** of one human-model split. Under time
> pressure the rational learner reads the shortest item that resolves the most of the live
> decision — which is precisely the item `coaching-versus-cheating-and-the-band-curve.md` calls
> cheating. **This interlocks directly with that dossier's open owner question:** under its option
> (a) `move` stays refused and a clock weakly favours the honest end (weakly — η² = 0.038); under
> option (c) `move` becomes purchasable pre-commit and **a clock becomes a cheating amplifier**.
> So the clock ruling should not be taken before the hint-ladder ruling

### 1.5 D364 — the three-way fork that was never queued (`design/BACKLOG.md:1009`)

> **`DESIGN-GAP:` `06` §5's refused list is one word too broad and its escalation dichotomy is one
> axis too narrow — both are owner-tier amendments, proposed not written.** (1) *"a pursuit clock
> is a retry price by another name"* is true of the **run-pooled** clock and false of the
> **attempt-scoped** one, and the shipped `clockState` field cannot express the refused form
> ([[D355]]). (2) *"what escalates is LEGIBILITY, not power"* is a complete dichotomy only while
> nothing constrains the learner's own computation; a clock is a **third kind** — it changes
> neither what the opponent can do nor what the product will say — and `06` §5 has no verdict on
> it either way. **The owner question the dossier ends on: is time nothing, a decoration, or a
> rule?** (a) **nothing** — close the cluster and delete the reserved field, banking the derived
> ≈6-item loadout as a slot number; (b) **a decoration** — the depicted clock of [[D362]],
> recommended and cheapest; (c) **a rule** — the enforced attempt-scoped clock, admissible but
> amending §5 twice, and **a run-pooled budget must be refused in the same ruling** or the design
> drifts back into the retry price by accident, because the difference between the permitted and
> the refused object is one field's altitude and nothing today would catch it

**What D364 asked, and what D1041 settled.** D364 asked one question with three answers:
*is time nothing, a decoration, or a rule?*

| D364's arm | Superseded by D1041? | Residue |
|---|---|---|
| (a) nothing — delete the field | **Superseded, fully.** D1041 says `clockState` *"stops being a zero-reader passthrough"* | None. D361 now closes by **typing** the field, not deleting it |
| (b) a decoration — the depicted clock | **Adopted as arm (a)'s honest core.** D1041's *"and then give actual time"* is D362 verbatim | Live. §3 shows this is the only arm-(a) form with a grounded source at HEAD |
| (c) a rule — the enforced attempt-scoped clock | **Adopted for arm (b), where it is not the same object.** D1041's arm (b) is a *game* clock in a *game*, not a pursuit clock in a drill | **The two amendments D364 demanded are still owed** and D1041 did not write them — see gap 1 |

**Two of D364's clauses survive the ruling intact and are the lane's sharpest constraints:**

1. **The run-pooled refusal must be re-stated affirmatively.** D364: *"a run-pooled budget must be
   refused in the same ruling … because the difference between the permitted and the refused
   object is one field's altitude and nothing today would catch it."* D1041 did not say it. The
   RFC must, and must make it a failable test (§7 gap 2).
2. **`06` §5 needs two owner-tier amendments** (law 5 — the owner's or claude-on-the-ruling's).
   `design/06-campaign.md:324-329` still reads: *"**What escalates here is LEGIBILITY, not
   power.** … every device that would make it compound is on the refused list (escalating numeric
   economies are law-8 violations; **a pursuit clock is a retry price by another name**)."*
   D1041 overturns neither sentence explicitly.

---

## 2. What exists at HEAD

### 2.1 `clockState` — the complete census, re-measured

**Exactly 9 non-test, non-`dist` references across `apps/` and `packages/`** (D361 says 6; the
count and every line number in the ledger have drifted — the row is stale, not wrong in kind):

| # | Site | Role |
|---|---|---|
| 1 | `packages/runtime/src/types.ts:124` — `readonly clockState?: Readonly<Record<string, unknown>>;` | **Declaration on `Node`**, last field, after `createdAt` at `:123` |
| 2 | `packages/runtime/src/runtime.ts:58` — same type, in `CommitMoveOptions` | Per-move input (also reaches `AppendOpponentPlyOptions`, `runtime.ts:63-66`, via `Omit<CommitMoveOptions,"actor"\|"selection">`) |
| 3 | `packages/runtime/src/runtime.ts:342` — `...(options.clockState === undefined ? {} : { clockState: options.clockState })` | The **only write**, into the new `Node` |
| 4 | `apps/web/src/lib/api.ts:644` — in `MoveOptions` | Client type. **The only `apps/web` reference in the whole tree**; zero `.svelte` files mention it |
| 5–7 | `apps/server/src/rest.ts:564`, `:566`, `:570` | Parsed as *"is it an object"* (`record(clockState, "clockState")`) and re-emitted |
| 8–9 | `apps/server/src/rest.ts:1601`, `:1603` | The same, on the opponent-ply route |

**Readers: zero.** No branch, condition, projection, renderer, validator, migration or test reads
the value. It is written, serialised, persisted in the run event log, replayed, and never
consulted.

**Two corrections to the premise this lane inherited.** It is **not** on `DrillRun`
(`types.ts:318-333` lists fourteen fields; `clockState` is not among them) and **not** on the
start options (`CreateRunInput`, `runtime.ts:35-42`, and `LegacyCreateRunInput`, `:45-53`, have no
such field). It is **per-move, on `Node`** — which is D355's whole point, confirmed at HEAD: the
reserved field already sits at the branch-scoped altitude, so **a clock built on it rewinds with
the board for free**, and the run-pooled form D364 demands be refused is *not expressible* without
a new run-level field.

**The schema declaration, verbatim** (`schemas/drill_run.schema.json:218-222`):

```json
"clockState": {
  "description": "Reserved until clock semantics are specified by a later RFC.",
  "type": "object",
  "additionalProperties": true
},
```

Referenced from the node object at `:277` (`"clockState": { "$ref": "#/$defs/clockState" }`),
inside a `"additionalProperties": false` node — so **the node is closed and the clock is open**.
The run log, which `design/05-in-run-experience.md:42` calls *"the sole source of chess truth"*,
today accepts and persists an arbitrary untyped object per ply from any client. That is D361, and
D1041 makes it closable: **give it a shape in the commit that gives it a reader.**

**Does the run schema's lane have to move?** Yes. `schemas/drill_run.schema.json:24` pins
`"schemaVersion": { "const": "0.17" }`. Closing `clockState` from `additionalProperties: true` to
a typed object is a **breaking narrowing** of an already-persisted field, not a stamp-only
widening — historical rows may hold anything. Lane 0.18 is claimed (`rfc/README.md:134`,
`bot-policy.md`, *"position behind longitudinal-store"*), so this lane takes **0.19+**. Whether
existing untyped values are migrated, dropped, or quarantined is gap 3.

### 2.2 The three clock-named objects that are not clocks

| Object | What it actually is | Cite |
|---|---|---|
| `clock_zeroed` | The **halfmove** clock — a fifty-move-rule counter. A `move_irreversibility` transition subkind; fires 265 of 771 committed spine transitions and renders a real sentence | `packages/runtime/src/transition.ts:360`, evaluated `:309`; D360 (`design/BACKLOG.md:1005`) refuted the claim it was dead |
| `timingWindows` / `luxuryMoveBudget` | **Move-count** tempo, not seconds. `"luxuryMoveBudget": { "type": "integer", "minimum": 0, "maximum": 20 }` | `schemas/drill_pack.schema.json:784`; consumed `packages/runtime/src/tempo.ts:169,258,272` *(tempo.ts dirty at derivation time)* |
| `TempoVerdict` | A **move-count** verdict vocabulary whose tokens read like clock language: `"unopened","open","in_time","over_budget","too_slow","outpaced","premature"` | `packages/runtime/src/tempo.ts:15-23` |

**This is a naming hazard the RFC must confront in its first section.** Three objects already
occupy clock vocabulary; a fourth arriving as *the* clock will collide in every grep, in authoring
copy, and in the renderer sentence pool. The RFC should pin distinct nouns (proposal:
`timeControl` for the declared control, `clockState` for the per-ply reading, `flag` for
expiry — and rename nothing shipped, since `clock_zeroed` and `TempoVerdict` are both live).

### 2.3 Node timestamps — the nearest thing to a clock, and why it is not one

Every `Node` carries `createdAt` (`types.ts:123`), so **per-ply elapsed time is already derivable
by subtraction**. Three facts make that derivation unsafe for arm (b) and useless for arm (a):

1. **The timestamp is client-supplied.** `runtime.ts:296` is `const at = timestamp(options.at)`
   and `timestamp` is `return at ?? new Date().toISOString()` (`:78-80`); `at` arrives from the
   request body (`rest.ts:568`) and is threaded through the service (`service.ts:1668,1676`). A
   client may claim any time it likes — **a server-authoritative clock cannot be built on
   `createdAt` as plumbed today** (gap 6).
2. **Imported runs collapse it.** `service.ts:829` commits every imported ply with the single
   `input.createdAt`, so imported node timestamps are all equal — elapsed time per move is
   **structurally zero**, not merely absent.
3. `lastMoveAt` (`apps/server/src/live-session.ts:103`) derives from the same field and inherits
   the same trust property.

### 2.4 Live sessions and matches — clock-adjacent state that already exists

`MatchState` (`apps/server/src/live-types.ts:131,139`; mirrored `apps/web/src/lib/api.ts:287`)
carries `pausedAt: string | null` and `pauseProposedBy: string | null`, persisted
(`storage.ts:3268`, columns `paused_at` / `pause_proposed_by`).

The refusal (`apps/server/src/service.ts:2061-2066`), verbatim:

```js
#refuseWhileMatchLive(runId:string,run:DrillRun):void{
  const context=this.#matchContext(runId);if(context===undefined||context.state.pausedAt!==null)return;
  const node=run.nodes.find((candidate)=>candidate.id===run.activeCursor.nodeId);
  if(node!==undefined&&terminalPosition(node.fen))return;
  throw new ServerError("MATCH_LIVE","Pause the match before rehearsing or revealing");
}
```

Eleven call sites (`service.ts:919,1020,1052,1145,1294,1509,1549,1630,1718,1867,1917`) — including
**`rewind` (`:1008`) and `fork` (`:1040`)**. `compare` is *not* among them
(`design/research/mechanics-by-mode.md:704` corrects `design/03:94` on exactly this).

**This is the single most valuable thing that already exists for arm (b).** A pause/resume
protocol with mutual consent, persisted timestamps, and a rewind refusal is precisely a clock's
stop/start machinery — built, shipped, and tested — for one surface only.

And the statement the lane must retire, `docs/live-sessions.md:46-47`:

> Native matches have no clocks, ratings, matchmaking pool, resignation event, or agreed-draw
> event.

(The *ratings* half is already stale — `learner-rating` is `implementing`.)

### 2.5 Imported PGN `[%clk]` — what happens today, exactly

`tools/d947-broadcast-roundtrip-harness/roundtrip-output.md:12`, measured:

> All 10 games parsed. Input carried 972 `[%eval]`, 902 `[%clk]`, 59 literate verdicts
> (`Blunder./Mistake./Inaccuracy.`); the returned `ParsedPgnMainline` (rootFen, headers, result,
> san/uci moves) contains none of them — comments are silently dropped by mainline extraction,
> never surfaced and never crashing.

The mechanism: `parsePgnMainline` reduces each mainline node to `{san, uci}`
(`apps/server/src/pgn-import.ts:48-56`) while keeping `headers: Object.freeze(Object.fromEntries(
game.headers))` (`:63`) whole. So `[TimeControl]` survives into `ImportedGameRecord.headers`
and `[%clk]` does not survive into the **run**.

**But it does survive into storage.** `ImportedGameRecord` carries `pgn: string`
(`apps/server/src/storage.ts:163`), written verbatim from `source.pgn` and persisted in the
`imported_games.pgn` column (`storage.ts:1747-1752`), up to the 64 KiB limit
(`service.ts:794-796`). **Every `[%clk]` of every pasted import is already in the database
today.** Arm (a) does not need a new import field; it needs a re-parse of bytes we hold.

**Two caveats, and the second is a hard collision:**

- The broadcast fixtures carry **zero `[TimeControl]` headers** (`grep -c TimeControl` over both
  `tools/d947-broadcast-roundtrip-harness/fixtures/*.pgn` = 0). Broadcast PGN has per-move clocks
  and no declared control; pasted Lichess PGN typically has both. The abstention path is real.
- **`rfc/live-sources.md` (accepted) destroys them.** `sanitizeBroadcastPgn` *"removes all `{...}`
  comments (which is where Lichess keeps evals, clocks, and literate verdicts)"* (`:143-144`), and
  criterion 3 (`:273-278`) asserts the **stored record** contains *"zero occurrences of … `[%`
  … zero occurrences of `[%eval`, `[%clk`"* — failing closed with `BROADCAST_ANNOTATION_RESIDUE`.
  See §5.5.

### 2.6 Engine and bot time — what the tree already decided

| Fact | Cite |
|---|---|
| Search bounds are **nodes** in practice: `go nodes 50000` | `apps/server/src/engine-supervisor.test.ts:238-242` |
| But the type already admits wall time: `searchBound?: Readonly<{ kind: "nodes" \| "movetime"; value: number }>` | `packages/runtime/src/types.ts:99`; `apps/server/src/bot-policy-catalog.ts:76` |
| `movetime` **is** shipped for evidence jobs: `` `go movetime ${job.movetime!}` `` | `apps/server/src/evidence-queue.ts:380`, validated `:135-143` |
| Stockfish `Move Overhead` is **refused**: *"Selections use explicit search bounds rather than an engine clock"* | `apps/server/src/capabilities.ts:132` |
| `nodestime / Ponder / go mate` refused: *"No product question asks for these controls"* | `capabilities.ts:128` |
| A bot profile may **declare** the time control its Elo was measured at: `calibration?: { measuredElo: number; timeControl: string; citation: string }` | `apps/server/src/bot-policy-catalog.ts:112-116` — **type-only; no shipped profile populates it** (a second reserved-and-unread field, sibling of `clockState`) |

**No engine time-to-depth telemetry exists anywhere**, and obtaining it means reopening a refused
capability. This closes one candidate grounding source for arm (a) before it is proposed.

---

## 3. Arm (a) — simulated pressure in drills. Does the grounding exist?

The owner's sentence has two halves and they have opposite evidentiary status.

> *"simulate the time pressure of a GREAT move during 10+0 chess **and then give actual time**"*

### 3.1 The law-8 boundary, stated as a test

Law 8 / ADR-0005 plus `design/05-in-run-experience.md:41` (*"**Absence is stated, never
simulated**"*) give one test: *what measured record does this number come from, and whose decision
was it about?* Three sentence shapes, three verdicts:

| Sentence | Grounded? | Why |
|---|---|---|
| *"White played this with 4:12 on the clock."* | **YES `[V]`** | A recorded `[%clk]` value from bytes we hold (§2.5). A fact about a specific game |
| *"At this time control, a move like this typically takes about 40 seconds."* | **NO** | A population claim about human deliberation time. **No such corpus exists in this tree**, and none of the four instruments in `capabilities.ts` produces one |
| *"This move would have taken **you** 40 seconds."* | **NO — the named trap** | A counterfactual about *this learner*, generated from nothing. It is the *"Ne5 centralizes the knight"* anti-pattern in the time domain, and D820 already names its degenerate form: *"do not fake it with random delays, which is the uniform-noise mistake in the time domain"* (`design/BACKLOG.md:460`) |

### 3.2 Per-move time data: the complete inventory

| Candidate source | Exists? | Status |
|---|---|---|
| Imported PGN `[%clk]` (paste path) | **YES** | 902 occurrences measured in one 10-game round. Stored verbatim in `imported_games.pgn` (§2.5). **Not parsed, not typed, not surfaced** |
| Imported PGN `[TimeControl]` header | **YES** | Survives into `ImportedGameRecord.headers` today (`pgn-import.ts:63`). Absent from broadcast fixtures |
| Broadcast round clocks | **YES in the bytes, DESTROYED by the accepted RFC** | `rfc/live-sources.md:143-144,273-278` — see §5.5 |
| Learner's own per-move elapsed time | **DERIVABLE, UNTRUSTWORTHY** | `Node.createdAt` deltas; client-supplied (§2.3). Zero for imported runs |
| Engine time-to-depth | **NO** | Bounds are nodes; `Move Overhead` and `nodestime` refused (§2.6) |
| A human deliberation-time corpus | **NO** | D820: *"a timing layer requires clock-accepting model/corpus work"* — deferred, expensive, never started. Maia is a policy model, not a latency model |
| `bot-policy` `calibration.timeControl` | **DECLARED, UNPOPULATED** | Would say what control a bot's Elo was measured at, never how long a move takes |

### 3.3 The honest verdict

**The grounding for the depicted half exists and is already in the database. The grounding for
the *simulated* half does not exist anywhere, and there is no cheap route to it.**

- ✅ **"Give actual time"** — recoverable today by re-parsing `imported_games.pgn`. This is D362's
  *"one retained field away"*, and §2.5 improves on it: it is a **re-parse of stored bytes**, not
  a new import field, so it works retroactively on every game already imported.
- ✅ **The pairing with "a GREAT move"** — the honest object already ships. Nothing grades a move
  (D363); the nearest recorded selector is `storyMoments`' `STORY_PIVOT_CP = 150`
  (`packages/runtime/src/story.ts:33`, applied `:86`), rendering *"The recorded evaluation moved
  +X cp across this move"* — a **change**, not a verdict. So arm (a)'s honest object is *"the move
  at which the recorded evaluation moved 150 cp, played with 24 seconds left"*: **two recorded
  facts, no chess claim.**
- ❌ **Any statement about what a move *costs* in time, in general** is ungrounded. It needs a
  corpus joining position features to human clock spend at a declared control — D820's *"new
  corpus/model work"*. The obvious raw material (Lichess `[%clk]` at scale) is **bulk corpus
  ingestion**, which `CLAUDE.md` §Rejected forbids as a prerequisite.

**Consequence.** Arm (a) v1 is a **depiction of recorded clocks**, abstaining when the source
carries none. It is not a simulator; the simulator is a research lane of its own (gap 12).

---

## 4. Arm (b) — real clocks in play

### 4.1 The state machine

Nothing exists; all of it is new. The pieces:

| Element | Shape | Notes |
|---|---|---|
| Declared control | `{ initialMs, incrementMs }` — Fischer increment only in v1 | Delay/Bronstein/multi-stage deferred. `bot-policy.md:579,592` already treats time control as a **calibration-scoping string**, so the RFC should pin one canonical serialisation (`"600+0"`) used by both |
| Per-side remaining | Two integers, server-authoritative | Cannot ride `Node.createdAt` (§2.3) |
| Per-ply record | The typed `clockState` on `Node` (§2.1) | Branch-scoped, so it rewinds with the board — D355's finding, now load-bearing |
| Running/paused | Reuse `MatchState.pausedAt`'s protocol for matches; **new** for solo surfaces | §2.4 |
| Flag-fall | A **new** terminal producer | §4.3 — this is the hard part |

### 4.2 Server authority is not optional

The move-commit path accepts a client `at` and stores it as truth (§2.3). Three rules follow:
(1) decrement from a **server-read** wall clock at commit, never from `at`; (2) refuse client `at`
on timed runs outright — cleaner than "advisory", and one line of validation; (3) keep the
projection deterministic on replay. `rfc/campaign-core.md:276` already pins the discipline for a
sibling fold — *"the fold is pure; **no wall-clock reads inside it**"* — which a clock projection
satisfies only if each ply's remaining time is **recorded**, never recomputed. That is exactly
what a typed `clockState` is for.

### 4.3 Flag-fall is a fifth terminal reason, and that is a contract change

`outcome.reached` is appended only from `terminalOutcome(position, side, repetitions)`
(`packages/runtime/src/runtime.ts:346-351`) — a **pure function of the board**. A flag-fall is not
a board fact. `learner-rating.md:147` states the current position:

> `chessops` decides; nothing else does. There is no resignation path, no adjudication, no
> engine-eval verdict

and `:667-669` gives the test: *"§1's test is 'a rating may move only on facts `terminalOutcome`
produces', and `terminalOutcome` produces exactly four: `isCheckmate`, `isEnd` without checkmate,
`halfmoves >= 100`, `repetitionCount >= 3`."*

**Flag-fall is a fifth.** It requires a new terminal producer and a widened `terminal_reason` (see
§5.1). It also brings FIDE 6.9's own subtlety — flag-fall with insufficient mating material is a
**draw**, not a loss — which is a rules fact `chessops` can answer and the RFC must ask.

### 4.4 A rewind in a timed game

This is where arm (b) meets the whole rest of the product.

| Surface | What happens today | With a clock |
|---|---|---|
| **Native match** | `rewind`/`fork` already return `MATCH_LIVE` unless `pausedAt !== null` (§2.4) | **Solved by construction.** You pause; the clock stops; you rehearse; you resume. The pause protocol *is* the clock protocol |
| **Just Play / position runs** | No match context ⇒ `#refuseWhileMatchLive` returns immediately; rewind is free | **Open.** Either (i) rewind stops the clock and resumes at the forked node's recorded remaining time — D355's attempt-scoped reset, branch-scoped for free; or (ii) rewind is refused while the clock runs, mirroring the match rule. (i) preserves *"experimentation without cost"*; (ii) preserves the game's integrity |
| **Campaign encounter** | Rewind spends an earned charge (`CAMPAIGN_REWIND_EXHAUSTED`) | §5.3 |
| **Rated game** | R11 voids any run containing a `run.rewound` event | §5.1 — a timed rewind is doubly complicated only if the clock also moves; if the clock stops, R11 is unchanged |

**The recommended reading, and the reason it is cheap:** because `clockState` lives on `Node`, a
fork inherits the forked node's recorded reading automatically. **The attempt-scoped clock is
what the shipped field already implements**; the run-pooled clock D364 demands be refused would
need a new run-level field. Make that a **failable test**, not prose (gap 2).

---

## 5. The seams into accepted contracts

### 5.1 `learner-rating` (implementing) — the sharpest seam, and one unexpected gift

**Nothing in the RFC mentions clocks, pace, or move duration.** Its only "clock" is the §6.3
rating-period clock (*"12 sealed rated games, or 7 days with at least one"*, `:733-734`).

**Does adding a clock break the 8-condition rated predicate (`:335-354`)?**

| # | Condition (abridged; full text at `rfc/learner-rating.md:335-354`) | Timed play breaks it? |
|---|---|---|
| 1 | *"declared rated at creation, before its first ply"* | **No** — the control is declared at creation too |
| 2 | `sessionKind === "position"` | **No** |
| 3 | `human_common` + a ladder rung `targetElo` | **Conditional** — §5.2. The Elo label is time-control-scoped (`bot-policy.md:592`: *"maia1's own rating spans ~230 Elo across time controls against the same human pool"*), so a rung calibrated at one control does not transfer |
| 4 | `eloHonored: true` and a pinned `containerDigest` | **No** |
| 5 | *"≥21 pieces"* | **No** |
| 6 | Every server-routed assistance rung refused | **No** |
| 7 | *"no `run.rewound` event and exactly one branch"* | **No** — R11 is orthogonal to the clock |
| 8 | *"It reaches `outcome.reached`. **No adjudication, tablebase included**"* | **YES — this one breaks** |

**Condition 8 is the collision.** §5.4 (`:657-687`) is a careful argument that only
`terminalOutcome` may seal, and `terminal_reason`'s SQLite CHECK is literal
(`rfc/learner-rating.md:1230-1231`):

```sql
terminal_reason TEXT CHECK (terminal_reason IN
  ('checkmate','stalemate','insufficient_material','fifty_move','threefold')),
```

on a `STRICT` table, in an already-claimed migration. Adding `'flagged'` (and, for FIDE 6.9,
`'flagged_insufficient_material'`) is a **rebuild migration against an implementing RFC**.

**But the amendment is admissible on §5.4's own reasoning, which is the useful finding.** §5.4
refuses the tablebase seal because *"a tablebase result is a fact about the position **under
optimal play by both sides from here** — a counterfactual."* A flag-fall is the opposite: it is a
fact about the game **as actually played**, under the rules of chess, decided by the same
rulebook `chessops` implements. It is a result, not an adjudication. The RFC should say so
explicitly and in §5.4's own vocabulary, or it will read as the exception §5.4 exists to refuse.

**The gift: a clock closes §11.3's named unremovable bias.** `rfc/learner-rating.md:1690-1696`:

> **There is no resignation.** `terminalOutcome` has no resign path, so a learner who abandons a
> losing rated game produces no result and no rating movement. Selection is therefore real:
> abandon-when-losing inflates the rating, and nothing in Glicko-2 detects it. … Three responses
> were available — adjudicate abandonment as a loss (requires inferring intent), add a resignation
> event (a run-schema change this RFC declines), or make the bias visible.

**A clock is a fourth response, strictly better than all three:** walking away from a losing
position **flags**, a real result requiring no inference about intent. It retires the `abandoned`
void reason for timed games and with it §7.2's abstention row (*"above an abandonment share of
0.25, the point estimate is withheld … regardless of RD"*, `:806`) — an abstention the RFC itself
labels `[M]`, a convention rather than a measurement. **This argument appears nowhere in
D330–D364 and is, on the evidence, the strongest single case for arm (b) in the tree.** Its
precondition is exact: the clock must run **server-side while the learner is absent**; a clock
that ticks only in an open tab converts nothing.

### 5.2 `bot-policy` (implementing) — the subtlest seam

**The refusal, verbatim (`rfc/bot-policy.md:638`):**

> | — | artificial move delay | refused | [[D820]]: no fake timing; a timing layer requires clock-accepting model/corpus work |

**The doctrine behind it (§2.7, `:347-350`):**

> **§2.7 Timing** — **there is no timing layer, deliberately** ([[D820]]/O8). Selections return
> when computed; **the compiler refuses any layer declaring a delay effect.**

Enforced three ways: a compiler failure (`:381` — *"any layer with a delay effect (§2.7)"*), a §9
refusal (`:675` — *"**Fake delays** ([[D820]]) — §2.7"*), and a negative conformance fixture that
must fail compilation (`:727`).

**D1041 says the refusal is *"now scoped to guard-disclosure honesty, not to clocks."* The tree
does not currently support that reading, and saying so is more use than agreeing.** The refusal's
rationale is not disclosure — it is *fake timing*, **an invented number presented as a real one**,
in the same family as the label rule (`:573-575`: *"a bot's stated Elo is a measured claim with
its measurement cited, or it is not stated"*) and the fake-human-likeness refusal (`:664-666`:
*"Nothing is advertised that isn't measured"*). The honest reconciliation is not "it was about
disclosure all along" but a **distinction the tree has the vocabulary for and has not drawn**:

| Object | Is it "artificial move delay"? | Verdict |
|---|---|---|
| `setTimeout(f, randomDelay)` before returning a computed move | **Yes** | Stays refused. D820's *"uniform-noise mistake in the time domain"* |
| A declared **layer** with a `delay` effect | **Yes** | Stays refused; still a compile error |
| The bot **actually searching under a wall-clock bound** (`searchBound.kind === "movetime"` — already a shipped type, `types.ts:99`, and already used for evidence jobs, `evidence-queue.ts:380`) | **No** — the elapsed time is real | **Admissible**, but see the determinism problem below |
| A bot's clock **decremented by real elapsed compute**, disclosed on the profile card | **No** | Admissible; the card already carries `calibration.timeControl` (`bot-policy-catalog.ts:114`) |

**The determinism problem, which is the actual blocker.** `bot-policy`'s criterion A3 requires
*"byte-identical `OpponentSelection` including the `policy` record"* on replay (`:731`), and
`:446` calls byte-identical reproducibility *"the property the whole instrument chain rests
on."* **`go movetime` is not reproducible across machines or loads; `go nodes` is.** So the bot
cannot honestly consume clock via a movetime search bound without breaking A3.

**The shape that satisfies both**, proposed not ruled: the bot's clock consumption is a
**declared, deterministic function of the seed and the position** — reproducible like every other
layer, disclosed on the profile card with a citation, and **labelled a model rather than measured
deliberation** until D820's corpus exists. Neither a fake delay (nothing sleeps) nor a
non-deterministic search. **It is still a new layer category needing a `bot-policy` amendment**,
because §2.7 refuses *any* layer with a timing effect: the RFC cannot assert past a compile error
and a negative fixture, it must amend them (gap 8).

**Recommendation:** ship arm (b) v1 with **no bot clock at all** — the learner's clock runs, the
bot's does not. Honest (the bot is not pretending to think), zero `bot-policy` change, and exactly
how a training clock works. The two-sided bot clock defers to v2 behind the amendment.

### 5.3 `campaign-core` (implementing) — does spending a rewind cost time?

**No, and §2.5 already forbids it** (`rfc/campaign-core.md:184-187`):

> **2.5 What the economy is not.** Charges are not purchasable, not sellable, **not convertible**,
> and never an input to any verdict, seal, module sentence, or (future) rating

A rewind that costs seconds is a **time-for-charge conversion**, which §2.5 refuses in terms.
Making a rewind cost time therefore requires amending §2.5 — and D364's run-pooled warning applies
exactly here: a per-rewind time cost *is* the pursuit clock, because the *k*-th retry then costs
more than the first. **Recommendation: do not. A rewind stops the clock; it does not spend it.**

The timed encounter class:

- `encounter.kind` is *"a closed enum with one member"* in v1 (`:106-117`); *"adding `position`
  (rated boss), `prediction` or `survival` is a schema change belonging to the Discharge rows."*
- **Discharge D4 (`:491`) is the lane's named home:** *"Evidence-dark fun nodes and cosmetic
  rewards (D887's marked-play class) and time controls (nothing exists to build on — `clockState`
  is an untyped passthrough)"*, owner `planning/campaign/`, discharged at *"that amendment's
  registration."* **D1041 has now falsified D4's parenthetical premise**, and the discharge row
  should be re-pointed at `planning/time-controls/`.
- **Timing is orthogonal to encounter kind.** A timed encounter is a `timeControl` on a node, not
  a fifth `encounter.kind` — which keeps the closed enum closed and is much the cheaper shape.
- **Does flagging lose an encounter?** Unanswered anywhere. §4.1 (`:242-259`) seals on the
  submitted branch tip's `ObjectiveState`, and ADR-0007 / D1040 make *finishing* grant the reward
  *"whatever the verdict."* So a flagged encounter most naturally seals as `"failed"` **and still
  pays the reward and the charge grant** — which is consistent, but it is an owner-tier call
  (gap 10).

### 5.4 `longitudinal-store` (accepted, unimplemented) — cleanest seam in the lane

`decision_class` is a closed three-value column *in the primary key*
(`rfc/longitudinal-store.md:169,181`):

```sql
decision_class TEXT NOT NULL CHECK (decision_class IN ('played','game','predicted')),
...
PRIMARY KEY (learner_id, run_id, projection_id, projection_version, phase, decision_class),
```

and AC-10 (`:707-709`) asserts the column list *equals the §2 lists exactly*, with *"adding a
`sentence` column fails it."*

**The RFC already anticipated this exact question and answered it** (`:266-270`):

> Producers outside the semantic-event set (shape firings, tablebase facts, **clock spend**,
> explorer joins) are **not ingested at landing** — open question 1 records the nearest candidate.
> Every one of them persists in run event logs and is re-derivable into this store later without
> data loss, because the store is a projection (§4.1); deferral costs **a rev bump and a rebuild,
> not a migration.**

**So: time-per-decision does not become an observation in v1, and adding it later is cheap and
already licensed.** The RFC should say nothing beyond citing this clause.

**The trap the brief names is real and belongs here.** A clock changes what *"the same position"*
means. The store's decision identity is `(parent.fen, node.moveUci)` (`:124-126`) and its root key
is `rootKey(sessionKind, packId, transposeKey)` (`:154-155`) — **neither carries time**. Two
decisions at the identical FEN, one with 5:00 and one with 0:08 remaining, are the *same* decision
to this store and would pool into one habit denominator. That is precisely the corruption
`decision_class` was added to prevent, arriving through a different door. If time ever becomes an
observation, **the time budget must be in the key or the pooling is silent** — which is a schema
question with a `derived_rev` bump attached, not a column addition (gap 14).

### 5.5 `live-sources` (accepted) — a direct collision

Broadcast clocks are in the ingested bytes (902 `[%clk]`, §2.5) and the accepted RFC **destroys
them by design and asserts their absence**:

- `:143-144` — the sanitizer *"removes all `{...}` comments (which is where Lichess keeps evals,
  clocks, and literate verdicts)"*
- `:152-156` — after stripping, the movetext must contain *"zero occurrences of `{`, `}`, `;`,
  **`[%`**, `$`, `!`, and `?`"*, or the import fails closed with `BROADCAST_ANNOTATION_RESIDUE`
- `:273-278` — criterion 3 asserts *"zero occurrences of `[%eval`, `[%clk`"* **against the stored
  record**, not the parse result

Not an oversight: D410's trap is third-party *grades* entering storage as authored text, and the
assertion was deliberately widened past a token list because *"the literate vocabulary is open,
not closed"* (`:127-129`). A clock is not a grade — but the assertion that catches grades catches
clocks too, because `[%` is one character class.

**The amendment owed:** narrow the sanitizer to strip `[%eval]` and verdict prose while
**extracting** `[%clk]` into a typed side-channel *before* the strip, so the stored PGN stays
clean and the clock survives as data; criterion 3's `[%clk` clause then inverts. This is gap 9 —
the one place where two accepted contracts point in opposite directions.

**Asymmetry worth stating:** the **paste** path is unchanged and stores comments verbatim
(`live-sources.md:175-178`; ledgered as D959). So today, and after live-sources lands,
`[%clk]` survives for pasted PGN and dies for broadcast PGN — the reverse of what arm (a) wants.

---

## 6. What the learner sees — the placement constraint

### 6.1 The six invariants (`design/05-in-run-experience.md:37-42`)

| Invariant | Does a clock touch it? |
|---|---|
| *"You commit before you learn anything"* | **No** — a clock says nothing about the position |
| *"An attempt is never destroyed"* | **No**, provided rewind forks the clock reading with the node |
| *"Rewind is an experiment, not an undo"* | **At risk.** If the clock keeps running through a rewind, rewinding acquires a price and the invariant weakens. Stop the clock |
| *"Nothing here invents chess truth"* | **No for arm (b)** (rules arithmetic). **Yes for the simulated half of arm (a)** — §3 |
| *"Absence is stated, never simulated"* | **Directly binding on arm (a).** An import with no `[%clk]` must say so, never interpolate |
| *"The run is the sole source of chess truth"* | **Binding.** The clock reading must be in the run event log to be replayable — which is the argument for typing `clockState` rather than adding a side table |

### 6.2 The five regions (`design/05-in-run-experience.md:48-61`)

Region 1 is *"Board and objective"*; region 5 is *"Session and role controls."* **No region is a
clock**, and `design/05` contains no clock, timer, or pace concept at all.

### 6.3 `play-composition`'s closed stage — the hard constraint

`rfc/play-composition.md:300-303`:

> The stage column's layout children are **closed**: the board frame, the timeline strip, and
> (tablet/phone) the objective/state line — each of constant token height. Everything else in the
> DOM path from the composition root to the board element is layout-inert with respect to state.

Reinforced by §1's two invariants (`:125-135`): *"Nothing that grows sits in the board's column"*
and *"Content never resizes the board"*; and by the geometry function (`:250-264`), where **no
term may be measured from content** and *"the tokens are compile-time constants, not
runtime-computed."* And `:202-205`: *"**Nothing above the board.** Between the shell topbar and the
board there is nothing, at any viewport."*

The 16-state composition (`:500-524`) is *"the closed list the acceptance matrix multiplies against
the seven viewports; adding or dropping one is a spec change with a changelog line"*, and
`play-composition.md` contains **zero** mentions of a clock.

**Where a clock lives without reopening any of that — the precedent already exists.**
`rfc/campaign-core.md:362-377` had the identical problem for the `⟲ N` charge balance and solved
it:

> **In-run campaign presence is one strip**, seated in an existing region (the rail — the same
> seat family `postcommit_nudge` uses) … **No composition state is added or modified**: criterion
> 11 asserts the 16-state list is byte-unchanged at this RFC's landing.

**Recommendation: the clock is a companion-region seat, not a stage child, and it adds no
composition state.** Three rules and two costs:

1. **It never enters the stage column** — not above the board, not below it, not in the strip. The
   geometry function stays content-free.
2. **It is fixed-size at every reading** — monospaced digit slots, so `10:00` and `0:09` occupy
   one box. Otherwise the seat's height becomes state-dependent, which §1's second invariant
   forbids in the companion region too (the region scrolls; it does not push).
3. **Low-time emphasis is paint, not layout** — colour and weight inside a fixed box, the field
   pattern `:317` already names for overlays.

- **Cost 1:** a rail-seated clock is further from the board than any competitor's. Whether that
  survives real time pressure is an owner-play question, not a document question (gap 16).
- **Cost 2:** a ticking element is a new *kind* of thing here — all 16 states are reachable by an
  input; a clock changes without one. Whether "low time" is a 17th state is play-composition's
  changelog, not this RFC's (`campaign-core.md:472-473` is the byte-identity precedent).

**Also owed:** `AssistanceConfig` is `version: 4` (`packages/runtime/src/assistance.ts:4-15`) with
a migration chain in `apps/web/src/lib/assistance-preference.ts:45-51`. If clock **display** is a
learner preference it is a version 5 with a migration; `play-composition`'s criterion A11
(`:638-641`) explicitly bars an `AssistanceConfig` version move from *its* diff, so the two must
not land in one commit.

---

## 7. Gaps — every question an RFC author must answer

**Owner-tier forks (⚖️) cannot be closed by the RFC author.**

| # | Gap | Kind |
|---|---|---|
| 1 | **`design/06-campaign.md:324-329` still refuses the pursuit clock and still says *"what escalates is LEGIBILITY, not power."*** D1041 overturns neither sentence in writing. D364's two amendments are owed before an RFC can cite `06` §5 without contradicting it | ⚖️ law-5 amendment |
| 2 | **Is the run-pooled clock refused?** D364 demands it be refused *in the same ruling*; D1041 is silent. Without it the design drifts back into the retry price by one field's altitude | ⚖️ |
| 3 | **Does a drill's simulated pressure ever *fail* you, or is it purely informational?** The brief's own question, and the load-bearing one for arm (a). Purely informational = D364(b) = grounded (§3). Failing = D364(c) = the enforced attempt-scoped clock, which needs gap 1's amendments **and** re-opens D357's cheating gradient | ⚖️ |
| 4 | **The D317–D326 hint-ladder fork is still unruled** and D357 says the clock ruling depends on it: under option (c) *"a clock becomes a cheating amplifier"*, because `move` is the cheapest item the product can print (1 word / 0.3 s vs `ranking`'s 63 / 15.9 s). If gap 3 resolves to "informational", this stops mattering; if it resolves to "enforced", it must be ruled first | ⚖️ |
| 5 | **Does flagging lose a campaign encounter?** And does a flagged encounter still pay its reward and charge grant, per ADR-0007 / D1040's *"unlocked by playing"*? Nothing in `campaign-core` §4.1 contemplates a non-board terminal | ⚖️ |
| 6 | **Server-authoritative time.** `Node.createdAt` is client-supplied (§2.3). Does a timed run refuse client `at` outright, or keep it advisory? Does the clock run while the learner's tab is closed? (§5.1's abandonment gift **requires** yes) | RFC |
| 7 | **`terminal_reason` widening.** Adding `'flagged'` to a literal SQLite CHECK on a `STRICT` table in `learner-rating`'s claimed migration (`:1230-1231`) is a rebuild migration against an implementing RFC. Plus FIDE 6.9: flag + insufficient mating material is a **draw** | RFC + coordination |
| 8 | **`bot-policy` §2.7's compile error.** *"the compiler refuses any layer declaring a delay effect"* (`:348`), enforced at `:381` and by a must-fail fixture at `:727`. A clock-consuming bot needs an amendment, not an assertion. And `movetime` bounds break criterion A3's byte-identical replay (`:731`) | RFC + amendment |
| 9 | **`live-sources`' sanitizer destroys `[%clk]` and asserts its absence** (`:143-144,152-156,273-278`). Extract-before-strip, and criterion 3's `[%clk` clause inverts | RFC + amendment |
| 10 | **Rated ⇄ timed.** Does a timed game rate on the same ladder? `bot-policy.md:592` measures ~230 Elo of drift across time controls for the same model against the same pool — so a rung calibrated at one control does not transfer. Either time control joins the rung identity, or timed games are unrated in v1 | ⚖️ / RFC |
| 11 | **Does a rewind cost time?** `campaign-core` §2.5's *"not convertible"* forbids it as written (§5.3). Recommendation: no — but it is an amendment either way | ⚖️ |
| 12 | **The simulator has no corpus.** *"This move typically takes 40 seconds"* requires D820's *"new corpus/model work"* — which is bulk ingestion, which `CLAUDE.md` §Rejected forbids as a prerequisite. Name it as a separate research lane or refuse it out loud | ⚖️ |
| 13 | **`clockState`'s untyped history.** The field is `additionalProperties: true` and persisted. Narrowing it is breaking: migrate, drop, or quarantine existing values? Run-schema lane 0.19+ (0.18 is `bot-policy`'s) | RFC |
| 14 | **"The same position" in the longitudinal store.** `(parent.fen, node.moveUci)` and `rootKey(...)` carry no time (§5.4). A 5:00 decision and a 0:08 decision pool. If time ever becomes an observation the budget must be **in the key** | RFC (deferred, cheaply — `:266-270`) |
| 15 | **Naming.** Three shipped objects already own clock vocabulary — `clock_zeroed` (live, 265/771 firings), `timingWindows`/`luxuryMoveBudget` (move-count), `TempoVerdict`'s `too_slow`/`in_time`/`over_budget`. Pin distinct nouns in §1 (§2.2) | RFC |
| 16 | **Placement is unvalidated.** A rail-seated clock is further from the board than any competitor's; whether that survives real time pressure is an owner-play question, not a document question (§6.3) | ⚖️ by use |
| 17 | **Does arm (a) abstain often enough to be a feature?** D362's own instruction: *"Scope the abstention path first — if a material share of imports carry no clocks, this is an abstention, not a feature."* Broadcast fixtures carry `[%clk]` but **zero `[TimeControl]`** (§2.5). Unmeasured for the paste path | Measurement, pre-draft |
| 18 | **Just Play's rewind under a running clock** (§4.4). Stop-and-fork, or refuse-while-running? | RFC |
| 19 | **Does the clock display count as assistance?** If it is an `AssistanceConfig` axis it is a version-5 migration and collides with `play-composition` criterion A11 (`:638-641`). If it is not, it is chrome and needs no ceiling term | RFC |
| 20 | **Increment only, or delay/Bronstein/multi-stage?** And one canonical serialisation shared with `bot-policy`'s `calibration.timeControl` string (`bot-policy-catalog.ts:114`, currently declared and unpopulated) | RFC |

### Traps, named

| # | Trap | Why it bites |
|---|---|---|
| T1 | **The law-8 trap in arm (a)** | *"This move would have taken you 40 seconds"* is a fabricated number about a specific person, produced by no instrument. D820 names the degenerate form (random delays); the plausible form is worse because it is *more* believable |
| T2 | **The depiction/simulation slide** | *"Give actual time"* is grounded; *"simulate the pressure"* is not. They sit in one owner sentence, and the second will ride in on the first's evidence unless the RFC splits them in its opening paragraph |
| T3 | **The altitude slide** (D364's) | Run-pooled vs attempt-scoped differs by one field's altitude and nothing today would catch it. Make it a test |
| T4 | **The pooling trap** (§5.4) | A clock silently changes what *"the same position"* means to any store keyed on FEN |
| T5 | **The cheating gradient** (D357) | Under time pressure the rational learner reads the shortest item that resolves the most of the decision, and `move` is the cheapest thing the product can print. Measured, a clock tilts toward cheating rather than balancing it |
| T6 | **Vocabulary collision** (§2.2, gap 15) | Three clock-named non-clocks already ship |
| T7 | **"The bot needs a move-time model"** | D1041 states it as a consequence. True only if the bot's clock runs. **v1 does not need it** (§5.2); adopting it early buys a `bot-policy` amendment, a compile-error fix and a determinism problem for no v1 value |

---

## 8. Recommended scope cut and sequencing

**Honest size estimate: this is the largest lane opened this week, and the largest of the four
D1040–D1043 rulings.** Two arms; new state machine; a fifth terminal reason; amendments owed to
`design/06` (owner-tier), `learner-rating` (implementing, STRICT-table migration), `bot-policy`
(implementing, compile error + fixture), `live-sources` (accepted, criterion inversion),
`campaign-core` (implementing, Discharge D4 re-point); a run-schema bump behind two claimed
positions; and a new persistent UI element against a closed composition. **It does not fit in one
RFC and should not be attempted as one.**

**Which arm first: (a).** Not because it is less interesting — because **its data is already in
the database** (§2.5), it touches no accepted contract's semantics except `live-sources`'
sanitizer, and it creates no terminal state, no server-authority requirement, no rating
interaction and no bot question. Arm (b) touches five accepted documents and cannot start until
gaps 1 and 2 are ruled.

### Sequencing

| Stage | Contents | Blocked on |
|---|---|---|
| **0 — pre-draft, ~half a day** | Measure gap 17: what share of realistic pasted imports carry `[%clk]` and `[TimeControl]`. A disposable harness over `imported_games.pgn` and a Lichess sample, under §Exploration gate. **If clocks are rare, arm (a) is an abstention and the cut changes** | Nothing |
| **1 — RFC-A: recorded clocks on imported games** | Parse `[%clk]` and `[TimeControl]` from the already-stored `imported_games.pgn` into typed per-ply readings; type `clockState` (closing D361) as the record's home; a rail-seated depiction; the honest-empty sentence when the source has none; the D363 pairing (*"the move at which the recorded evaluation moved 150 cp, played with 24 seconds left"* — `STORY_PIVOT_CP = 150`); the `live-sources` extract-before-strip amendment (gap 9). **No enforcement. No countdown. Nothing fails you.** Run schema 0.19, behind `bot-policy`'s 0.18 | Stage 0; gap 15's naming |
| **2 — the owner rulings** | Gaps 1, 2, 3, 5, 10, 11 as one decision-queue block. Gap 4 (the hint ladder) rides along, since gap 3 may moot it | Owner |
| **3 — RFC-B1: real clocks in native matches** | The narrowest arm-(b) cut, because `pausedAt` already supplies stop/resume and `#refuseWhileMatchLive` already refuses rewind while running (§2.4/§4.4). Server-authoritative decrement; flag-fall as a new terminal producer; **unrated** in v1 (gap 10 deferred); **no bot clock** (§5.2); retires `docs/live-sessions.md:46-47` | Stage 2 |
| **4 — RFC-B2: solo timed play** | Just Play and position runs. Requires gap 18's rewind rule, and inherits the abandonment gift only if the clock runs server-side while the tab is closed (gap 6) | Stage 3 |
| **5 — amendments** | `learner-rating` `terminal_reason` + `'flagged'` + the §11.3 abandonment consequence (the strongest argument in the lane, §5.1); `campaign-core` Discharge D4 re-point and the node-level `timeControl`; `bot-policy` §2.7's layer category | Stages 3–4 |
| **Deferred, named** | Two-sided bot clocks; a rung-by-time-control rated ladder; the deliberation-time corpus (gap 12) and with it the *simulated* half of arm (a); delay/Bronstein/multi-stage controls; time as a longitudinal observation (`longitudinal-store.md:266` already licenses it as a rev bump); broadcast-clock live following (`live-sources` Phase B) | — |

### The one-line v1 of each arm

- **Arm (a) v1:** *the clock the original player actually had, shown next to the move they
  actually made, and silence when we do not know.* Grounded, retroactive, contract-light.
- **Arm (b) v1:** *a real, server-authoritative, unrated clock in native matches, where pause,
  resume and the rewind refusal already exist.* Everything else defers.

### Ledger rows this derivation owes

| Row | Content |
|---|---|
| new 🐞 | `rfc/live-sources.md`'s sanitizer destroys `[%clk]` and criterion 3 asserts its absence — a direct collision with D1041 arm (a) (§5.5) |
| new 💡 | A clock is the fourth response to `learner-rating` §11.3's abandonment bias, and the only one needing no inference about intent (§5.1) |
| new 🐞 | `BotProfileDeclaration.calibration` (`bot-policy-catalog.ts:112-116`) is a second declared-and-unpopulated field in the time domain — `clockState`'s sibling |
| **D330 correction** | The row states `clockState` is on `DrillRun` and the start options. It is on `Node` and on `CommitMoveOptions` (§2.1). D355 corrected it; D330 was never edited |
| **D361 refresh** | 9 non-test references, not 6; every line number in the row has drifted (§2.1) |
| **D364 disposition** | Arm (a) superseded, (b) adopted for drills, (c) adopted for play — but the two `06` §5 amendments and the run-pooled refusal remain **unwritten** (§1.5, gaps 1–2) |
| `campaign-core` D4 | Re-point from `planning/campaign/` to `planning/time-controls/`; its parenthetical *"nothing exists to build on"* is now falsified by D1041 |
