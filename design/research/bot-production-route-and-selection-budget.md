# Bot production route and combined selection budget

**Question:** What exact non-test operation must carry a bot profile from selection through a
persisted opponent move, and what latency contract is supported by the measured Maia-plus-guard
chain?

**Feeds:** D1605–D1609, D233, bot-policy/roster author repair, opponent experience, campaign boss
identity.

**Method:** source-boundary census at HEAD plus re-derivation of the committed D969 50-root timing
population. No engine was rerun: the committed result already measures the required sequential
Maia-vector → exact-candidate Stockfish depth-8 chain, and a new run before the route exists would
still measure a disposable composition rather than the production operation.

## 1. Only three of twelve route operations exist

The executable census names twelve necessary operations. Only these three exist today:

1. the server parser accepts and digest-validates a profile reference;
2. the selector cache key includes profile id/version/digest; and
3. `#humanCommon` acquires a wide Maia candidate vector. [V]
   (`tools/d1605-bot-route-boundary-harness/`, 7/7 arms)

The other nine are absent:

- run create and resume do not carry the profile;
- the web selection request cannot express it;
- no sealed guard receipt or trait view reaches the selector;
- `#humanCommon` never calls `composeBotPolicySelection`;
- `OpponentSelection` and its schema cannot persist the decision record;
- capabilities expose no roster; and
- no card projection consumes the declaration/receipt. [V]

The absence is not inferred from naming. The harness reads the actual runtime interfaces, run
schema, server and web create contracts, both selection-request builders, selector body,
non-test call-site census, selection carrier/schema and capability result. The sole production
occurrence of `composeBotPolicySelection(` is its own definition. [V]

## 2. The current client round trip is the wrong authority

Ordinary opponent play currently performs two mutations separated by the browser:

`SessionController → POST /select-move → selection bytes → POST /runs/:id/moves → appendOpponentPly`.

`/select-move` authenticates but is not bound to a run; its request carries caller-supplied FEN,
history, policy and seed. The browser reconstructs those fields from its run snapshot. The second
request echoes the resulting `OpponentSelection` back for persistence. [V]
(`apps/web/src/lib/session-controller.ts:#playOpponentIfNeeded/#selectionRequest`,
`apps/server/src/rest.ts:/select-move`, `RunService.opponentPly`)

Adding a profile field to that shape would make the profile client-chosen during every move and
would retain the already-open D233 raw-selection leak. It would not prove that the profile matches
the active run, current node, branch seed or resumed digest. The profile parser is therefore a
useful boundary validator but cannot be the production authority for bot play. [V]
(`design/BACKLOG.md` D233/D938/D1605)

The production operation should be run-bound and atomic at the product boundary:

`POST /runs/:id/opponent-ply { writerId, expectedNodeId, requestId }`

The server must derive root/history/seed/profile from the leased run, acquire Maia and the sealed
guard/trait evidence, compose, append the selected move and decision record, and save only if the
active cursor still equals `expectedNodeId`. `requestId` provides exact retry identity; a repeated
successful request returns the same committed event, while a stale node refuses. [M]

That one operation removes three bypasses at once: caller policy injection, evidence-bearing raw
selection bytes crossing the browser before disclosure, and selection/append races. Grouped
branches need the same server-owned core even if their route retains a group-specific wrapper.
Prediction and human-split evidence queries remain separate consumers of raw Maia and must not
inherit a persona transform merely because they use the same provider. [M]

## 3. Exact carrier sequence

The author/implementation chain is:

1. `RunOpponentPolicy.profile` stores `{id, version, digest}` and creation validates it against the
   compiled catalog. Resume reads that exact triple; it never resolves “latest”.
2. The server-owned opponent operation derives the current position/history and root candidate
   population from the active run.
3. Maia acquisition produces the base human-policy vector. The measured guard's candidate set is
   that admitted vector, so Stockfish runs after Maia; scoring the complete legal set in parallel
   would be a different, unmeasured mechanism.
4. `stockfish-guard@1` returns the sealed receipt from
   `bot-guard-and-trait-contract.md`; `pawn_move@1` derives the sealed legal-board view.
5. The compiler applies the exact profile and emits both the move and `BotPolicyDecisionRecord`.
6. One event persists the selection, profile digest, layer actions/abstentions, considered receipt
   projection and chosen mass under the run-schema lane already claimed by bot-policy.
7. Capability and card projections read the same compiled profile and live provider state; neither
   rephrases policy mechanics from free prose. [M]

Step 3 is sequential by evidence dependency. An implementation may parallelize only after a new
measurement proves an independently knowable candidate set and repeats D969's retention gates.
[V] (`design/research/stockfish-candidate-guard-probe.md` §Amendment inputs)

## 4. The combined budget can be declared from existing evidence

D969 measured 50 current pack roots across opening, middlegame, endgame and cross-phase positions.
For depth 8, the sequential cold Maia-plus-guard chain measured p50 **209.085 ms**, p90
**269.047 ms**, p95 **286.796 ms**, and max **499.1 ms**; Stockfish alone was p95 **105.054 ms**,
max **128.563 ms**. Every one of 958 requested candidates received an exact row. [V]
(`planning/platform-alignment/bot-policy/d969-population-results.json`)

This is enough to choose depth 8 and to predeclare a production contract, but not enough to claim
portable latency. The population was one machine, cold but not under the release topology's
expected concurrency; 0.9 ms beneath 500 is no hard-deadline margin. [V]

Recommended selection contract [M]:

- **healthy target / worry boundary:** combined p95 at or below **400 ms**;
- **intervention boundary:** combined p95 above **500 ms**, or any incomplete/late receipt in the
  fixed release benchmark;
- **runtime opportunity deadline:** 500 ms from selection start for the optional guard. If Maia
  consumes the window, the guard records `deadline_exceeded`, the dependent trait abstains and the
  unchanged Maia policy selects; Maia itself still reports against its existing per-call budget;
- **release consequence:** intervention does not remove baseline Play. It makes guarded and
  pawn-forward profiles unavailable until the exact image/digest/concurrency receipt clears;
- **telemetry:** record total, Maia, guard and composition durations plus every abstention reason,
  keyed by profile digest and provider identity.

The 400-ms worry line is deliberately a technical operating recommendation, not a chess or human
perception fact. It leaves an observable band before the existing 500-ms instrument commitment,
following the repository's worry/intervene convention. The implementation benchmark must run the
exact atomic route under the release concurrency and may force the author to revise the target
before acceptance; it may not silently weaken the intervention consequence. [M]

## 5. Completion boundary

Registration is not completion. D1605 closes only when a non-test route fixture proves exact
create/resume identity, changed executed path, atomic persisted decision, provider-off fallback,
stale-node refusal, retry idempotency, capability/card projection and no client profile authority.
D1606 closes only when the exact production operation produces the expected-concurrency timing
receipt. D1609 still requires exact-digest gameplay calibration, severe-tail, trait observability,
reproducibility and owner use. [M]

This dossier does not amend or accept an RFC and does not choose persona names or a default bot.
