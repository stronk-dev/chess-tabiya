# RFC: Branch groups — playing N candidates in parallel

- **Status:** draft
- **Author:** claude
- **Created:** 2026-08-14
- **Design refs:** `design/03-product-breadth.md` §Branch groups (lines 117–151), gate
  **B3**'s open surface (line 268); `design/05-in-run-experience.md` §1 (invariants),
  §3 (the assistance ladder), §3a (default silence); `design/BACKLOG.md` rows
  "Branch groups — play N candidates in parallel" (line 192), "Multi-branch view
  shapes" with the 2026-08-13 pan/zoom + semantic-zoom correction (line 193),
  "Branch race UX" (line 214), "Comparison column ceiling" (line 158), and
  "Branch ranking for pruning" (line 194)
- **Exploration gate:** owner ruling 2026-08-12 opened the exploration gate
  (`rfc/README.md`); the breadth sequencing ruling 2026-08-11 opened B1–B8 RFC
  planning; the branch-group surface itself is the owner's 2026-08-13 statement
  quoted in `design/03-product-breadth.md:119-121`
- **Depends on:** `archive/n-way-comparison.md` (the branch-keyed comparison
  payload, the ≤8 compare cap, `Branch.origin`, the simulate/promotion precedent,
  the prediction-endpoint precedent, the MultiPV reset discipline);
  `archive/branch-runtime.md` (event log, fork/rewind, opponent-selection
  read-back); `archive/adaptive-guidance.md` (implemented 2026-08-14 while this
  was drafted — the `permittedAssistance` function and the
  `ASSISTANCE_WITHHELD` disclosure-gated endpoint pattern this RFC reuses for
  machine-seeded creation; canonical description `docs/adaptive-guidance.md`)
- **Parent / amends:** amends `archive/branch-runtime.md` (one new event type and
  one widened union member in the run schema); composes with, and does not modify,
  `archive/n-way-comparison.md`'s comparison payload
- **Not touched:** the Just Play position player, pack schema (stays 0.11), shape
  library, and every surface `archive/shape-library.md` or
  `archive/adaptive-guidance.md` owns. This RFC ships no pack-schema change and
  claims no pack-schema number.
- **Run schema:** **0.9** — `group.created` event and `policyModeApplied` gains
  `"enumerated"` (§8). **Migration 11** (`STORAGE_VERSION` 10→11), claimed in
  `rfc/README.md`'s migration register in the same commit as this draft.
- **Supersedes / superseded by:** —
- **Planning:** `planning/branch-groups/` (once implementing)

Baselines verified on this tree 2026-08-14: **359 unit tests / 63 files** passing
(`pnpm test`; the assignment's 321/55 predates the shape-library and
adaptive-guidance landings now in tree), run schema `"0.8"` and pack schema
`"0.11"` (`packages/schema/src/index.ts:1-2`), `STORAGE_VERSION = 10`
(`apps/server/src/storage.ts:287`).

## Summary

The owner (2026-08-13): *"I am playing. I am unsure: I see about 4 good moves. I
want to play the 4 moves — like a group of branches."* This is the third
multi-branch capability and neither shipped one covers it: simulate previews
authored lines with nobody playing, compare reads branches already played, a
branch group forks N candidates from one node and **the learner plays them all**
(`design/03-product-breadth.md:123-129`).

This RFC specifies: a durable `group.created` record over ordinary played
branches (§1); group creation from four seed sources mapped onto the assistance
ladder, with the corpus source honestly scoped out (§2–§3); the
controlled-opponent rule as a **group-level reply journal**, because the shipped
seed mechanism verifiably cannot hold Maia resistance constant across sibling
branches (§4); both advance disciplines — sequential and lockstep — as client
cursor policies over one substrate, default sequential (§5); a semantic-zoom grid
whose information model is the shipped N-way comparison payload plus the group
projection (§6); and the evidence cost stated with arithmetic rather than waved
at (§7). Group members are real branches: they persist, export, and compare
exactly as any branch does, and the group is how the walkthrough's "compare
selection is cumbersome" finding dies — the group **is** the selection
(`design/BACKLOG.md:193`).

## Motivation

B3's row in `design/03-product-breadth.md:268` is "largely shipped
(`n-way-comparison`)" with exactly one named open surface: branch groups. The
comparison machinery a group terminates in already exists —
`compareBranches(run, branchIds)` with 2–8 branches on one axis
(`apps/server/src/service.ts:450-467`, `packages/runtime/src/compare.ts`) — and
the walkthrough finding it answers is recorded: manual compare selection is
cumbersome, and a group makes selection disappear.

**In scope:** the group record and projection; creation from hand-picked,
authored, Maia-reply, and engine-top-N seeds; the fixed/per-branch resistance
contract and the group-reply endpoint; sequential and lockstep advance; the
group grid with semantic zoom; run schema 0.9 and migration 11; the browser
acceptance path.

**Explicitly out of scope, with verified grounds:**

- **Opening variants from corpus as a live seed source (ladder rung 4).** The
  only explorer client in the tree is the sourcing pipeline
  (`apps/server/src/sourcing/explorer.ts`): it is invoked at authoring time,
  writes evidence ledgers into a sourcing directory, and is deliberately
  operator-authorized — "Explorer authorization is an operator boundary"
  (`docs/content-sourcing.md:117-119`). No run route reaches it
  (`parseRunRoute`'s closed allowlist, `apps/server/src/rest.ts:444`, contains no
  sourcing action), and a learner-triggered live explorer proxy is a different
  contract: request etiquette, caching, licence surface, and abstention semantics
  that `archive/content-sourcing-explorer.md` solved for the pipeline, not for
  drill time. At drill time, corpus-derived variants exist exactly where an
  author baked them into a pack — which is the **authored** source below. The
  seed-source union in §1 is closed at four members; `opening_variants` is not a
  reserved string, and reopening it means amending this union in a future RFC,
  not discovering a fifth branch of a switch.
- **Branch ranking, scoring, or pruning of group members** — the BACKLOG row at
  `design/BACKLOG.md:194` and the n-way prohibition both stand; nothing here
  orders members by quality.
- **Default compare selection heuristics** beyond "the group is the selection"
  (`design/03-product-breadth.md` rules manual inclusion first).
- **Live-session group semantics beyond the writer lease.** Groups obey the
  shipped possession rules unchanged; no vote/proposal integration.
- **The view beyond §6's normative rules.** Layout, animation, band thresholds
  and gesture mapping are implementer freedom; `design/03:149-151` deliberately
  leaves presentation unfixed and §6 keeps the information model separate.

## Specification

### 1. The information model: a group is a durable fact about ordinary branches

#### 1.1 What persists

A group is **not** a container, a session mode, or a client-side selection. It is
one appended event stating that N real branches were forked from one node as a
set, from a named seed source, under a named resistance rule. The members are
ordinary branches from the moment they exist: they appear in the branch rail,
persist forever ("an attempt is never destroyed", `design/05:29`), export to PGN,
and enter comparison like any branch. Nothing anywhere filters on group-ness;
consumers render it.

New event, joining the union at `packages/runtime/src/types.ts:215-228` beside
`PredictionRecordedEvent` (`types.ts:202`):

```ts
export type GroupCreatedEvent = Event<"group.created", {
  readonly groupId: string;              // `${runId}:group:${ordinal}`, ordinal = 1 + prior group.created count
  readonly sourceNodeId: string;         // the node every member forks from
  readonly source: "hand_picked" | "authored" | "human_replies" | "engine_top_n";
  readonly resistance: "fixed" | "per_branch";
  readonly members: readonly {
    readonly branchId: string;
    readonly seedMoveUci: string;
  }[];                                   // 2–8 entries, distinct branchIds, distinct seedMoveUcis
}>;
```

`Branch` (`types.ts:101-108`) is **not** widened — no `groupId` field. Group
membership has exactly one source of truth, the event, and exactly one reader,
the projection below. This is the D21 lesson applied in advance: D21
(`design/BACKLOG.md:132`) is a shipped producer and a shipped deriver disagreeing
about whether a segment exists; a `Branch.groupId` denormalization would create
the same two-readers shape for groups, so it is not built.

Encoding membership in `Branch.label` or `intent` prose is rejected on the
grounds `archive/n-way-comparison.md` §7.4 already recorded for `origin`: every
consumer would have to parse a convention.

#### 1.2 The projection

```ts
export interface BranchGroup {
  readonly groupId: string;
  readonly sourceNodeId: string;
  readonly source: GroupSource;
  readonly resistance: "fixed" | "per_branch";
  readonly members: readonly { readonly branchId: string; readonly seedMoveUci: string }[];
  readonly createdAtSeq: number;
}

export function groupsFromEvents(run: DrillRun): readonly BranchGroup[];
```

Derived only, never stored — the same discipline as `deriveSegments`,
`lineMembership` and shape firings ("firings are derived projections, never
events", `rfc/README.md` migration 10 row). Browser and server import the same
function; there is no second implementation (`docs/branch-runtime.md:13-17`).

**Replay validation** (a projection case in `packages/runtime/src/events.ts`
beside the `prediction.recorded` case at `events.ts:163-170`): every
`members[].branchId` must name a branch already projected whose `forkNodeId`
equals `sourceNodeId`; branch ids and seed moves must be distinct within the
event; member count must be 2–8; `groupId` must be unused. A snapshot violating
any of these fails replay rather than projecting a group that points at branches
which are not siblings — the boundary the schema would otherwise permit.

#### 1.3 Lifecycle

- **Membership is fixed at creation.** There is no add/remove/dissolve
  operation. A learner who wants a different set creates another group (possibly
  at the same node — concurrent groups at one node are legal and independent) or
  uses ordinary manual compare selection, which this RFC does not touch.
- **Completion is derived, not recorded.** A member is *settled* when its leaf
  objective state is terminal or an `outcome.reached` lies on its path below the
  fork — both already computed per branch by `branchCards()`
  (`apps/web/src/lib/screen-model.ts`) and by the consequence row. No
  `group.completed` event exists; deriving it later cannot drift from truth,
  recording it could.
- **A branch may belong to at most one group.** Creation refuses a candidate
  that would adopt (§2.4) a branch already in a group — `INVALID_REQUEST` —
  because a branch answering to two resistance contracts at once has no honest
  reply rule in §4.
- **Comparison is the shipped one.** "Compare group" calls
  `compareBranches(run, members)` — within the 8 cap by construction, since
  members ≤ 8. The 8 itself is `archive/n-way-comparison.md` §1.2's number,
  enforced at `service.ts:455-462`; the owner ruling on that ceiling is still
  pending (`design/BACKLOG.md:158`), and the group cap in this RFC is defined as
  "the compare cap" so it rebases automatically with that ruling rather than
  becoming a second constant.

### 2. Creation

#### 2.1 Route and preconditions

`POST /runs/:id/group` — `group` joins `parseRunRoute`'s closed single-segment
allowlist (`rest.ts:444`), as `simulate`/`prediction`/`analysis` did. Writer
lease required (the shipped `#forWrite`, as `move` and `simulate` use). Body,
parsed with the shipped `closedRecord` (`rest.ts:70`):

```
{
  source: "hand_picked" | "authored" | "human_replies" | "engine_top_n",
  resistance?: "fixed" | "per_branch",      // default "fixed"
  candidates?: string[],                    // UCIs; required iff source = hand_picked
  size?: number,                            // 2–8, default 4; machine sources only
  at?: string
}
```

The source node is the active cursor node — the same resolution simulate uses
(`service.ts:626`). Preconditions, in order:

1. The cursor node's position is not terminal and its objective state is not
   absorbing, else the runtime's own `RUN_TERMINATED` surfaces (409): "play
   cannot continue from a terminal node" applies to every member equally
   (`packages/runtime/src/runtime.ts:278-282`).
2. The evidence queue is configured, exactly as `move` requires
   (`service.ts:317`): group members are real played branches and their moves
   are owed evidence (§7). This is the deliberate opposite of simulate, whose
   batch calls the queue zero times because nothing it walks is real
   (`archive/n-way-comparison.md` §7.2).
3. The resolved seed set (§3) has 2–8 distinct legal moves. Fewer than 2 →
   `GROUP_SEEDS_UNAVAILABLE` (422, new code); more than the cap →
   `TOO_MANY_BRANCHES` (422, the shipped code and shape, `service.ts:459`);
   duplicates → `INVALID_REQUEST`; an illegal candidate UCI → the runtime's
   `ILLEGAL_MOVE`.

Both new codes — `GROUP_SEEDS_UNAVAILABLE` (422) and `UNKNOWN_GROUP` (404, §4.3)
— join the closed `ServerErrorCode` union (`apps/server/src/errors.ts:1`) **and**
gain arms in `errorResponse`'s status chain (`rest.ts:346-430`) in the first
implementation commit, before any route can throw them. An unmapped thrown code
surfaces as a 500; `archive/n-way-comparison.md` §1.2 documented that trap and
this RFC does not re-walk into it.

#### 2.2 The seed side is decided by the position, not the source

Whose move the seed plies are is a fact of the source node's FEN. A group at a
node where it is the **learner's** turn seeds learner-side candidate moves ("I
see 4 good moves"); a group where it is the **opponent's** turn seeds replies
("what are the plausible answers"). Both are legal for `hand_picked`,
`authored`, and `engine_top_n`. `human_replies` requires opponent-to-move: rung
3 is a model of human *resistance* (`design/05:65` — "correct as a distribution,
misleading as advice"), and enumerating Maia over the learner's own move would
re-dress the distribution as move advice; learner-to-move with
`source: "human_replies"` → `GROUP_SEEDS_UNAVAILABLE` with a reason string
saying exactly this.

#### 2.3 The member transaction

One service method, one storage save. For each seed move, in seed-set order:

1. `fork(run, sourceNodeId, { label: seedMoveSan, at })`
   (`runtime.ts:363`) — an explicit empty branch at the source node; `origin`
   defaults to `"played"` (`runtime.ts:109`), which is true: the learner will
   play it.
2. Commit the seed ply:
   - **learner-side, `hand_picked`:** `commitMove(run, uci, { actor: "user" })`
     — the learner chose these moves individually; "user" is the honest actor.
   - **learner-side, `authored` or `engine_top_n`:** `actor: "system"` — the
     mechanism placed the move; claiming the learner played it would be false.
     Simulate's walk is the precedent for system commits (`service.ts:647-650`).
   - **opponent-side, `human_replies` or `engine_top_n`:**
     `appendOpponentPly(run, selection)` with an **enumerated selection** —
     `{ moveUci: candidate_i, policyModeApplied: "enumerated", candidates:
     <the full recorded distribution, verbatim>, engine: <selector identity> }`.
     The runtime's adjacency contract holds unchanged
     (`opponent.move_selected` + matching `move.committed`,
     `docs/branch-runtime.md:83-87`), and read-back replay accepts it because it
     is an ordinary authoritative selection. What `"enumerated"` records is the
     one fact the existing vocabulary cannot state: this move was **not sampled
     by the policy** — the group enumerated it out of the recorded distribution.
     Stamping `"human_common"` on a reply Maia did not choose would be the exact
     declared-versus-applied dishonesty `policyModeApplied` was created to
     prevent (migration 5, `rfc/README.md`). §8 carries the union widening.
   - **opponent-side, `hand_picked` or `authored`:** `commitMove(run, uci,
     { actor: "system" })`. There is no distribution and no engine, so there is
     nothing honest to put in a selection; the runtime rejects bare
     `actor: "opponent"` commits by design (`runtime.ts:266-271`), and simulate
     already commits authored opponent plies as `"system"`. Consequence, stated:
     `resistanceOnPath` attributes no opponent identity to such a ply
     (`packages/runtime/src/replay.ts:103-139` pairs only selector-played
     plies), so the consequence row's resistance sentence covers one ply fewer.
     That is honest — nobody's model played it.
3. Enqueue one eval job for the committed node via the same body
   `#enqueueMoveEvidence` builds (`service.ts:1040-1059`) — §7.

After the last member: one `rewind(run, firstMemberLeafNodeId)` so the cursor
lands on member 1, ready to play (a single `run.rewound` event; the learner
asked to start playing the set); then append `group.created`
(`appendEvents`, the pattern `recordPrediction` uses at `service.ts:583-595`);
then one `#storage.save`. The event order — all `branch.forked`s before
`group.created` — is what §1.2's replay validation asserts.

Response: `{ group, run, emitted, comparison }` where `comparison` is
`compareBranches(run, memberBranchIds, { pack? })` — the grid renders
immediately from the same payload shape it always receives.

**Event arithmetic against the envelope.** Per member: 1 `branch.forked` + 1
`move.committed` (+1 `opponent.move_selected` for enumerated seeds) + whatever
`orchestratePackMove` emits; plus 1 `run.rewound` + 1 `group.created`. An
8-member opponent-side group ≈ 26 events plus orchestration. The 1000-event
envelope (`docs/branch-runtime.md:348-351`) is a documented assumption, not a
limit; §5 carries the per-round arithmetic that actually approaches it.

#### 2.4 Adoption: a candidate that already exists is a member, not a duplicate

If a seed move equals the `moveUci` of an existing child of the source node, the
branch that child belongs to **joins the group** instead of a duplicate path
being forked. The learner who played 12.Bg5, rewound, and now groups
{Bg5, h3, Qc2} means *that* Bg5 — path-keyed nodes would happily hold a second
identical Bg5 line (`docs/branch-runtime.md:33-45`), and it would teach nothing
its twin does not. Rules:

- the adopted member is the branch owning the **oldest** such child (rewind and
  re-commit can produce same-move children on several branches; oldest is
  deterministic);
- an adopted branch contributes no new events and **no new evidence job** (its
  seed node already went through the move path's enqueue);
- an adopted branch already in another group → `INVALID_REQUEST` (§1.3);
- adoption can bring a promoted `origin: "simulated"` branch into a group;
  `origin` is a promotion marker and nothing filters on it
  (`archive/n-way-comparison.md` §7.4).

The main line itself can be adopted this way: the path continuing through the
source node belongs to some branch, and that branch is a legal member.

### 3. The seed sources are the assistance ladder

`design/03:131-135`: one mechanism, five ways to fill it, each inheriting its
rung's honesty properties. Verified against the tree, four are real today and
one is not (Motivation):

| Source | Rung | Where the moves come from — verified | Availability gate |
|---|---|---|---|
| `hand_picked` | 0 | the request's `candidates` UCIs, captured on the client (§6.3) | always; needs no engine, no pack |
| `authored` | 5 | the matched spine node's children, resolved exactly as simulate resolves them: `lineMembership` → spine node → `children` (`service.ts:627-630`); authored order; first `size` (≤8) taken | pack sessions on-spine; else `NO_AUTHORED_VARIATIONS` (shipped code, `service.ts:612,630`) |
| `human_replies` | 3 | one `selector.select()` call, mode `human_common` — already MultiPV 8 (`apps/server/src/opponent-selector.ts:428`) — yielding ≤8 ranked candidates with policy mass (`opponent-selector.ts:218-240`); members = top `size` by rank; the sampled `moveUci` is ignored (this is an enumeration, not a selection); the distribution is recorded verbatim in every member's enumerated selection | selector configured, else the shipped `ENGINE_UNAVAILABLE` shape; **plus the assistance gate below** |
| `engine_top_n` | 2 | the strong play engine widened per-request: `OpponentSelector` gains `enumerate(request, n)` for `strong_engine`, composing `setoption name MultiPV value ${n}` before `position`/`go movetime` and — because the play engine is one long-lived shared process — a trailing `setoption name MultiPV value ${profile.multiPv}` reset, mirroring the two shipped per-request seams (`apps/server/src/evidence-queue.ts:311-314`; `opponent-selector.ts:412`) and the reset discipline `archive/n-way-comparison.md` §9 states for the judge. Candidates carry rank and no mass (Stockfish emits no policy mass; `mass` is optional, `types.ts:63-67`) | strong engine configured, else `ENGINE_UNAVAILABLE` (on the Maia-only release compose this source is honestly absent); **plus the assistance gate below** |

**MultiPV reality, restated so nobody rediscovers it:** the judge boots at
`MultiPV: 1` hardcoded (`apps/server/src/application.ts:196`) and the play
engine boots at the profile's `multiPv`, default 1
(`apps/server/src/strong-engine.ts:10-15`); neither spec can express a
per-request width, and the only shipped per-request mechanism is the
prepend-setoption-then-reset command composition named above. `enumerate` uses
the **play** engine, not the judge: creation is synchronous and the judge is
reachable only through the staged evidence queue.

**The assistance gate for machine sources.** Exposing a Maia distribution or an
engine's top-N over the current position *before the learner has played* is
assistance, and it is exactly what the shipped human-split endpoint already
gates: `permittedAssistance({sessionKind, deliveryOpen, role})` with
`ASSISTANCE_WITHHELD` when locked off (`rest.ts:848-849`,
`packages/runtime/src/assistance.ts:22-25` — solo or host, and the run's
feedback-delivery window open). `human_replies` creation applies that function's
`humanSplit` permission verbatim. `engine_top_n` creation applies the **same
predicate** as its own rule — rung 2 is stronger feedback than rung 3, so it
cannot be more available; this RFC deliberately does not add an engine member to
`AssistanceConfig`, which is `archive/adaptive-guidance.md`'s design surface.
`hand_picked` and `authored` are never gated: rung 0 needs no oracle and rung 5
is the pack the learner is already inside. This is the ladder doing its job —
"each source inheriting its rung's honesty properties" — and it is consistent
with ADR-0006: a learner who machine-seeds a group is explicitly requesting
disclosure-tier assistance, and gets it only where disclosure is open.

### 4. The controlled-opponent rule

`design/03:137-144`: for a group to answer *"which of my four moves is best"*,
resistance must be held constant, default `fixed`, with `per_branch` as the
deliberate opposite experiment, and the difference visible.

#### 4.1 What the shipped seed machinery actually controls — verified

The design text says "the control already ships: `opponentPolicy.seedMode`".
Verified, the shipped seed's reach is narrower than that sentence implies:

- The seed is used in exactly two places: the selection **cache key**
  (`opponent-selector.ts:180-184` — digest, packId, seed, and a hash of the
  **move-sequence history**, `:170-178`) and `theory_strict`'s server-side
  weighted sampling (`:474-477`).
- The engine sidecar **never receives a seed**. No seed `setoption` exists in
  the Maia command list (`:404-415`) or the strong-engine list (`:437-445`);
  `seedHonored` is derived from `spec.seedOption`, which no shipped spec sets,
  so both real engines report `seedHonored: false` in every recorded selection
  (`apps/server/src/engine-supervisor.ts:134-135`).
- Branch seeds derive at fork time from `run.policyConfig.seedMode`
  (`runtime.ts:108`: `per_branch` → primary+index, else primary), and the client
  sends the **active branch's** seed with every selection request
  (`apps/web/src/lib/session-controller.ts:461`).

Consequences per opponent tier, stated honestly:

| Tier | What `fixed` seed actually guarantees |
|---|---|
| `theory_strict` | full constancy: sampling is server-side and seed-driven, so identical histories draw identically |
| `strong_engine` | the seed is irrelevant; near-constancy comes from deterministic best-move search, modulo movetime nondeterminism |
| `human_common` | **almost nothing across a group.** The sidecar samples with Temperature/TopP unseeded, and the cache key includes the move-sequence hash — which sibling members never share, since they differ from their first ply. Two members reaching even the *same position* by different move orders miss the cache (history, not transpose key). |

So for the flagship human opponent, `seedMode: fixed` alone cannot make a group
a controlled experiment. The design's *intent* — constant resistance — needs a
group-level mechanism.

#### 4.2 `resistance: fixed` — the reply journal

Under `fixed`, **within one group, the opponent's reply is a function of the
position.** Before resolving a reply on a member path, the server consults the
group's *reply journal*: the recorded `opponent.move_selected` selections on all
member paths at or below the fork, read through the shipped pairing primitive
(`opponentMovesFromEvents`, `docs/branch-runtime.md:148-153`), keyed by the
**transpose key** of the position being answered (the pair's parent-node
`transposeKey`, `types.ts:88-91`).

- **Journal hit:** the recorded selection is returned **verbatim** — same
  `moveUci`, same candidates, same engine identity. Every statement in it is a
  true statement about the identical position; replaying it is not manufacture,
  it is the definition of holding the opponent constant. The response carries
  `reusedFromNodeId` so the client can render the reuse.
- **Journal miss:** the selector is called with the group's **canonical seed** —
  the primary branch seed (`run.branches[0].seed`) for every member — and the
  reply enters the journal simply by being committed and recorded as an ordinary
  opponent ply. No second store exists; the journal *is* the event log read back,
  which is why it cannot drift (the D21 class again).

This gives every tier the same group-level guarantee — *the same position gets
the same reply, always, in every member* — and the per-tier table above is then
only about how replies at *distinct* positions are produced. The UI sentence for
a fixed group states exactly the guarantee that holds and no more; when the
recorded engine reports `seedHonored: false`, the sentence is the
position-function form, never a claim about reproducible random draws:

> Fixed resistance: within this group, the same position always receives the
> same reply.

#### 4.3 `resistance: per_branch` — the opposite experiment

The journal is never consulted. Each reply is a fresh selector call with an
**effective seed of primary + member ordinal** (the 1-based position in
`members`), reproducing `runtime.ts:108`'s derivation at the group layer — this
matters because the run's own `seedMode` may be `fixed`, which would otherwise
give all members identical branch seeds and make `per_branch` resistance a lie
for `theory_strict`. Its sentence:

> Varied resistance: each branch faces its own opponent draw.

The mode is on the group record, immutable, and rendered in the group header and
on the compare surface — the visibility requirement of `design/03:143-144`
discharged in one place.

#### 4.4 The endpoint

`POST /runs/:id/group-reply` (joins the `rest.ts:444` allowlist), writer lease
required. Body: the shipped select-move body plus `groupId` — parsed exactly as
the prediction endpoint parses its superset body
(`rest.ts:1066-1073`: `closedRecord` on
`["startFen","historyUci","policy","seed","packId","groupId"]`, then
`parseSelectMoveRequest` on the first five, then the spine threading
`/select-move` performs). Keeping request composition client-side follows
`archive/n-way-comparison.md` §8.2's verified reasoning — `selectorMode(pack,
capabilities)` is a client capability read (`session-controller.ts:129-143`) and
does not move to the server. The server then **overrides the request's seed**
with the effective seed of §4.2/§4.3; the client-sent value is otherwise unused
on this route.

Resolution: unknown or foreign `groupId` → `UNKNOWN_GROUP` (404); the request's
resulting position terminal → `INVALID_REQUEST`; selector unconfigured → the
shipped `ENGINE_UNAVAILABLE` shape (`rest.ts:742` route's behaviour). Response:
`{ selection, reusedFromNodeId: string | null }`.

**Client rule.** While the active branch is a group member (derived by
`groupsFromEvents` in the browser), `#playOpponentIfNeeded`
(`session-controller.ts:410-436`) routes reply resolution through
`/runs/:id/group-reply` instead of `/select-move`, for **both** resistance
modes, and commits the returned selection through the shipped opponent-ply path
unchanged. One route for member replies means the fixed/per-branch difference
lives in exactly one server decision, not in client discipline — the same
by-construction shape the prediction endpoint used for its ordering rule.

The journal read is scoped to *this group's* member paths and to selections
whose recorded engine identity and `policyModeApplied` match the current policy
mode — a group whose run capabilities changed mid-life (say, Maia went away and
the mode fell back) must not replay a Maia selection as if Stockfish said it.
On such a mismatch the entry is skipped and a fresh selection is made; the group
header renders the shipped engine identity per reply anyway, so a mixed-engine
group is visible rather than smoothed over.

### 5. Advance discipline: two client modes over one substrate

`design/03:146-148` leaves lockstep-versus-sequential genuinely open, with the
tradeoff named: lockstep makes comparison immediate and cognitive load high;
sequential is calmer but lets branch A's memory contaminate branch B. This RFC
specifies **both**, because — verified — they require no runtime distinction at
all: the run has one cursor, entering a member is the shipped
`rewind(nodeId)` to that member's leaf (`runtime.ts:380`; a cursor move plus one
`run.rewound` event, nothing destroyed), and the two disciplines are nothing but
policies for *where the cursor goes next*:

- **`sequential`** (default): play the current member until it settles (§1.3)
  or the learner chooses to leave; the group panel's primary action is "next
  unsettled member" — one rewind to that member's leaf.
- **`lockstep`**: after the learner's ply and the reply land on member *k*, the
  panel advances to member *k+1*'s leaf; a full round visits every unsettled
  member once. The ledgered branch race (`design/BACKLOG.md:214`) is exactly
  this with N = 2, and ships as nothing more than a two-member lockstep group.

**The default is sequential, and the argument is strong enough to not need an
owner ruling.** Three grounds. (1) `design/05` §3a is a ruling that the default
posture during committed play is calm — "play it, live with it" — and lockstep
is the maximum-stimulation mode; defaults follow the design's stated posture,
and lockstep remains one tap away. (2) The owner's own framing of the risk —
cognitive load — matches the walkthrough's only UX finding in this area
(overload, not underload). (3) The costs are asymmetric and measurable:
lockstep adds one `run.rewound` per member per round — an 8-member lockstep
group approaches the documented 1000-event envelope in roughly 30 rounds
(8 × (2 moves + 1 selection + 1 rewind) ≈ 32 events/round, versus ~24 without
rewinds sequentially and creation's ~26), and each rotation is a branch switch
measured at 45–53 ms client-observed (`docs/branch-runtime.md:337-341`).
Sequential's contamination cost is real but is also partly the *point* — the
comparison at the end is of attempts the learner actually made, and the n-way
consequence row does not care in which order they were made. Nothing here
forecloses lockstep; it ships as a first-class mode in the same release.

The chosen discipline is a **client navigation preference, not run truth**: it
is stored per group in `localStorage` following the versioned local-preference
precedent of the assistance config (`docs/adaptive-guidance.md` §Assistance
configuration — "not events, run fields, or server-side learner state"), and it
may be switched mid-group, because switching how you *visit* branches changes
nothing about what happened on any board. It is deliberately **not** on
`group.created`: recording a mutable preference in an immutable event would
either freeze it or falsify it.

**A named boundary condition — rotation cancels pending evidence.** The shipped
rewind path notifies the evidence queue, which cancels queued jobs for nodes
leaving the active path (`service.ts:374` passing the queue;
`evidence-queue.ts:148-159`). Every lockstep rotation is a rewind, so a member's
just-enqueued eval job can be cancelled by the very next rotation if the judge
is behind. This RFC does not change that contract (it is correct for its
original case, and making cancellation group-aware would put group knowledge
inside the queue). It states the consequence and the recovery: a member cell or
compare column with absent evidence renders the shipped absence forms — absence
is stated, never simulated (`design/05:32`) — and the shipped deep-analysis
route (`POST /runs/:id/analysis`, `archive/n-way-comparison.md` §9) is how a
learner fills any gap on demand. A7 asserts the absence rendering.

### 6. The group view

#### 6.1 Information model first

The view consumes exactly two payloads that already exist or are defined above:
the branch-keyed `BranchComparison` over the members (columns, rows, groups,
consequences, evidence — `packages/runtime/src/compare.ts`) and the
`BranchGroup` projection. **The view adds no data and computes no chess.** Any
sentence it shows comes from the shipped sentence functions the n-way RFC
inventoried (`archive/n-way-comparison.md` §4.2); the n-way prohibition is
inherited verbatim: no cell, badge, ordering, or sentence may rank, score,
recommend, or describe a member as better or worse than another
(`archive/n-way-comparison.md` §4.2 "Prohibition, normative";
`design/BACKLOG.md:194`). Member order everywhere is `members` order.

#### 6.2 Grid with semantic zoom — the corrected row, made normative

Per the corrected BACKLOG row (`design/BACKLOG.md:193`): the group-at-one-moment
shape is a grid; the constraint is not a pixel ceiling but an
overview-versus-detail tradeoff; the answer is semantic zoom on a pan/zoom
canvas. Normative rules:

1. **One cell per member**, on a pan/zoom canvas contained inside the run's
   content region. The canvas is not document scroll, so it composes with the
   viewport-contained shell (`docs/app-shell.md:118-127`: the shell owns one
   `100dvh` viewport; regions scroll internally).
2. **Cells render different content by scale, not the same content smaller.**
   Three bands, from far to near:
   - *far*: member label (seed SAN), objective-state chip, terminal-outcome
     glyph where one exists — rules and pack facts only, all present before
     reveal (`archive/n-way-comparison.md` §4.3's distinction);
   - *mid*: adds last move, ply count, material balance (a rules fact derivable
     from the leaf FEN), checkpoint chips;
   - *near*: the board at the member's current leaf, the same disabled
     `Chessboard` mode the compare grid uses.
   Band thresholds and transitions are implementer freedom; the *existence* of
   the three bands and their content classes is normative, and A7 asserts that
   far and near render different content.
3. **No ceiling from layout.** The canvas holds any member count the record
   allows; nothing about the view re-imposes the pixel budget the owner
   corrected away.
4. **Entering a cell is the shipped rewind** to that member's leaf — the same
   gesture as the branch rail, requiring the writer lease and honestly refused
   (`HonestControl`, the shipped pattern) for spectators.
5. **The group header** renders: source (with its rung's provenance — e.g.
   "seeded from recorded human replies (Maia-1500)" using the recorded engine
   identity, never an invented attribution), the §4 resistance sentence, the
   advance toggle, and "Compare group".

Presentation beyond these rules — including whether the same canvas later
serves the tree-of-forks shape — is deliberately out of scope; the BACKLOG view
row explicitly separates the three shapes and this RFC builds only the second.

#### 6.3 Creation surface

A "Branch group" action on the drill screen opens a creation sheet listing the
four sources, each `HonestControl`-wrapped with its §3 availability reason when
unavailable (no pack spine, engine unavailable, assistance withheld).
`hand_picked` uses a capture interaction with the precedent already shipped: the
prediction step captures a move on a board **without committing it**
(`apps/web/src/lib/CheckpointSheet.svelte:60-62`); the capture mode here collects
2–8 such moves as removable chips, then one "Create group" call. The group panel
lives with the branch rail (`BranchRail.svelte` gains a grouped-member marker
beside the shipped compare checkboxes, `BranchRail.svelte:4-11`); "compare
group" sets the shipped `compareIds` to the member set
(`DrillScreen.svelte:102,291-301`) so export-with-selection
(`DrillScreen.svelte:440`) works on groups with zero new code.

### 7. Evidence cost, with arithmetic

Verified: every committed move already enqueues one Stockfish eval job —
`RunService.move` at `service.ts:325` and `opponentPly` at `service.ts:350`,
both through `#enqueueMoveEvidence` (`service.ts:1040-1059`), at
`evidenceMovetimeMs` defaulting to 100 ms (`service.ts:196-197`,
`DEFAULT_STRONG_ENGINE_PROFILE.movetimeMs`). A group multiplies exactly this:

- **Creation:** one job per non-adopted member (§2.3) — ≤ 8 jobs, ~0.8 s of
  judge time at defaults.
- **Play:** each member round is a learner ply plus a reply = 2 jobs; a
  4-member group played 10 rounds each ≈ 80 jobs ≈ 8 s of serialized judge
  time; 8 members × 20 rounds ≈ 320 jobs ≈ 32 s, arriving over the whole
  session, staged and writer-applied as today.

This RFC deliberately does **not** zero-enqueue the way simulate does: simulate
writes nothing and therefore owes nothing (`archive/n-way-comparison.md` §7.2);
a group member is a real committed attempt, and a branch whose evidence was
skipped at birth would be a second-class branch in every later comparison. Nor
does it add batching: the queue already serializes one shared judge, jobs are
100 ms, and the only observed overload path — lockstep rotation outrunning the
judge — resolves by the shipped cancellation plus on-demand `analysis` rather
than by a new scheduler (§5). If a future measured envelope says otherwise, that
is a queue change, not a group change. What this RFC *does* bound is intake: the
member cap (≤ 8, §1.3) and the compare cap are the same number, so no group can
demand more evidence per gesture than the compare surface can show.

### 8. Persisted shape: run schema 0.9, migration 11

Two run-shape changes land together in one migration (the register's
one-RFC-one-migration rule):

- `GroupCreatedEvent` joins `DrillRunEvent` (`types.ts:215-228`), with the §1.2
  projection/replay case in `events.ts`;
- `PolicyModeApplied` (`types.ts:44`) widens from `RunOpponentMode | "unknown"`
  to include `"enumerated"`, and the wire schema's closed enum
  (`schemas/drill_run.schema.json:133-135`:
  `["human_common","strong_engine","theory_strict","unknown"]`) gains the same
  member. `opponent.move_selected` is otherwise untouched; replay adjacency and
  `opponentMovesFromEvents` do not read the mode and are unaffected. The
  `resistanceSentences` renderer gains one fixed form for enumerated plies
  ("Enumerated from the recorded distribution — not selected by the opponent
  policy.") so the mode never renders as if a policy chose the move.

`DRILL_RUN_SCHEMA_VERSION` moves `"0.8"` → `"0.9"`
(`packages/schema/src/index.ts:1`) with the wire schema's
`schemaVersion` const (`schemas/drill_run.schema.json:24`). `STORAGE_VERSION`
moves 10 → 11 (`storage.ts:287`) with **migration 11** appended beside the
existing bodies (`storage.ts:2099-2300` region).

**Migration 11 body — stamp only.** Rewrite every stored snapshot at schema
`"0.8"` to `"0.9"`, both values as frozen literals, never the moving constant
(the freeze rule recorded for migration 4). No data rewrite exists to do: no
historical run contains a `group.created` or an `"enumerated"` selection, and no
field was added to any existing record. The migration is nonetheless
**mandatory**: reads filter on the current schema version
(`storage.ts:524,580`), so an unstamped run disappears from listing and resume —
the trap every schema-bump RFC since the grading pair has re-documented, here
included. Quarantined pre-v0.5 rows stay quarantined untouched.

Migration 11 and the 0.9 run-schema claim are recorded in `rfc/README.md`'s
migration register in the same commit as this draft. Pack schema is untouched
at 0.11; no pack register row is claimed.

### 9. Route and error summary

| Method | Path | Writer | New codes it can raise |
|---|---|---|---|
| `POST` | `/runs/:id/group` | yes | `GROUP_SEEDS_UNAVAILABLE` 422; reuses `TOO_MANY_BRANCHES` 422, `NO_AUTHORED_VARIATIONS` 422, `ASSISTANCE_WITHHELD` 409, `ENGINE_UNAVAILABLE` 503-shape, `INVALID_REQUEST` 400, runtime `ILLEGAL_MOVE`/`RUN_TERMINATED` |
| `POST` | `/runs/:id/group-reply` | yes | `UNKNOWN_GROUP` 404; reuses `ENGINE_UNAVAILABLE`, `INVALID_REQUEST` |

Both actions join `parseRunRoute`'s single-segment allowlist (`rest.ts:444`);
neither needs a nested path, which the anchored regex cannot express
(`archive/n-way-comparison.md` §7.1). Both new codes join `ServerErrorCode`
(`errors.ts:1`) and `errorResponse`'s chain (`rest.ts:346-430`) in the first
implementation commit. Reads need no new route: groups project from
`GET /runs/:id/events`, and comparison is the shipped `POST /runs/:id/compare`.

### 10. Defects: none claimed, five constraining

The parallel draft `defect-batch-2.md` (registered 2026-08-14, while this was
being written) owns closing D21–D24 and D27 — its verification found D21 and
D22 real and D23/D24/D27 stale with regressions missing. This RFC therefore
**claims none of them** and cites them only as constraints on its own shape:

- **D21** (`design/BACKLOG.md:132`) — producer/deriver disagreement — is the
  reason §1 has one event, one projection, no denormalized field, and no
  `group.completed` producer.
- **D22** (`:128`) — `opponentPolicy` accepts unknown fields — is why §4 reads
  only the typed fields of the policy and adds none: a group key smuggled into
  `opponentPolicy` would validate today and mean nothing, so nothing here is
  keyed off that object.
- **D23** (`:129`) — phase-less emitted packs — does not interact: groups read
  no `phase`.
- **D24** (`:131`) — cookie transport default — no cookie or transport surface
  here; unaffected and untouched.
- **D27** (`:130`) — a latency envelope asserted inside the unit gate — is why
  A9 *records* the group-creation timing against the worry band and gates on
  nothing time-dependent.

## Deviations from design

1. **`design/03-product-breadth.md:140-141` ("The control already ships:
   `opponentPolicy.seedMode` is `fixed | per_branch`, so a group defaults to
   `fixed`").** Verified in §4.1, the shipped seed does not and cannot hold
   `human_common` resistance constant across sibling branches: the sidecar never
   receives a seed (`seedHonored: false` on both real engines,
   `engine-supervisor.ts:134-135`), and the selector cache keys on the
   move-sequence history siblings never share (`opponent-selector.ts:170-184`).
   This RFC keeps the design's *contract* — fixed by default, per-branch as the
   visible opposite experiment — but implements the constancy at the group
   layer (§4.2's reply journal) and renders only the guarantee that actually
   holds. The design sentence overstates the shipped mechanism; the deviation is
   in mechanism, not intent, and this section is the RFC-channel notice of it
   (design amendment is the owner's, per law 5).
2. **`design/03:146-148` leaves lockstep-versus-sequential open.** §5 resolves
   it: both ship as client modes, sequential default, with the argument stated.
   This is a resolution the design invited rather than a contradiction of it.

Otherwise none: seed sources map to the ladder as `design/03:131-135` states
(with rung 4 scoped out on verified grounds, recorded in Motivation), the grid
follows the corrected view-shapes row, and no member is ever ranked.

## Acceptance criteria

Baselines to move from: 359 unit tests / 63 files (`pnpm test`, 2026-08-14).

- **A1 — projection and replay.** Runtime tests: `groupsFromEvents` projects a
  well-formed group; replay **fails** for each §1.2 violation — member branch
  not forked at `sourceNodeId`, duplicate member branch or seed move, member
  count 1 or 9, reused `groupId`, `group.created` preceding a member's
  `branch.forked`. A fast-check property asserts every projected group's members
  are pairwise-distinct sibling branches of its source node.
- **A2 — creation, all four sources.** Service tests: `hand_picked` at a
  learner-to-move node (actor `user` on seeds) and at an opponent-to-move node
  (actor `system`, no fabricated selection); `authored` via the spine
  (`NO_AUTHORED_VARIATIONS` off-spine and with <2 children); `human_replies`
  records the identical distribution verbatim in every member's enumerated
  selection with `policyModeApplied: "enumerated"`, and refuses a
  learner-to-move node; `engine_top_n`'s command list contains
  `setoption name MultiPV value N` **and ends by resetting to the profile
  value** (the shared-process boundary); adoption joins the oldest matching
  existing branch, enqueues no duplicate evidence, and refuses a branch already
  grouped; terminal source node refused; cursor lands on member 1; the response
  comparison has N columns.
- **A3 — the reply journal.** With a scripted selector: under `fixed`, two
  members transposing to one position (different move orders) receive
  **byte-identical** selections with the second marked as reused, and the
  selector is called once; under `per_branch` it is called twice with effective
  seeds primary+1 and primary+2; a journal entry whose recorded mode mismatches
  the current policy is skipped, not replayed. `theory_strict` under `fixed`
  draws identically on identical histories.
- **A4 — gating.** `human_replies` and `engine_top_n` creation return
  `ASSISTANCE_WITHHELD` for a participant/spectator and while feedback delivery
  is closed, and the shipped `ENGINE_UNAVAILABLE` shape when the respective
  engine is unconfigured; `hand_picked` and `authored` succeed in the same
  contexts.
- **A5 — errors are mapped.** Every §9 code produces its documented status
  through `errorResponse`, none falls through to 500.
- **A6 — migration 11.** A v0.8 snapshot upgrades to a readable `"0.9"` row;
  the stamped literal is `"0.9"`, not the constant; quarantined rows stay
  quarantined; an unmigrated v0.8 row is invisible to reads (proving the
  migration is mandatory).
- **A7 — the view.** Component tests: far band and near band of one cell render
  different content classes (no board at far, board at near); the group header
  renders the §4 sentence matching the record's resistance and never a
  reproducible-draws claim when `seedHonored` is false; a member with absent
  evidence renders the shipped absence form; a vocabulary snapshot asserts no
  rank/score/better/worse/best/worst wording anywhere in the group surface
  (the n-way A6a pattern).
- **A8 — browser (the required end-to-end).** In `tests/browser/` (with
  `drill.spec.ts`'s harness): start a run, reach a decision point, capture
  **three hand-picked candidates** without committing any, create the group with
  default `fixed` resistance, verify three new branches in the rail and the grid
  showing three cells; play at least two of the learner's own plies in **every**
  member against the resolved resistance (sequential default, plus one lockstep
  rotation exercising the advance toggle); open **Compare group** and assert a
  three-column comparison aligned on the group's fork node; export includes the
  three members.
- **A9 — suite health and the recorded envelope.** `pnpm verify` and
  `pnpm test:browser` pass. Group creation timing for an 8-member group is
  **recorded** in the planning log against the worry/intervene band
  (`design/02-product-shape.md` ruling) and gates nothing (D27's lesson).

## Open questions

None.

## Changelog

- 2026-08-14: created. Verified against the tree at 359 tests / 63 files, run
  schema 0.8, pack schema 0.11, storage 10; claimed run schema 0.9 and
  migration 11 in `rfc/README.md`.
