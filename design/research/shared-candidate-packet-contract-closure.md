# Shared candidate packet — contract closure after the D1631–D1636 return

**Question.** Can the returned shared-candidate RFC be repaired without weakening complete legal
population identity, losing Maia history, laundering heterogeneous evidence through F1, dropping
current collectors, or converting Stockfish mate scores to centipawns?

**Verdict.** Yes, but not by amending the existing wrapper in place. The factual candidate
population is a **sealed internal compilation receipt containing original declared evidence**, not
a new evidence projection. Game adjudication, provider requests, policy results, and learner-facing
selection are separate typed joins. The current RFC must also narrow its first landing: no live bot,
hint, or Review consumer exists at HEAD, so the first implementation can truthfully replace the
research semantic-selection path, preserve the server candidate adapter, and bound the existing
selector cache; application injection belongs to the first live consumer RFC. `[V]`

The disposable Node-24 instrument is
`tools/d1631-candidate-packet-repair-harness/packet-repair.test.ts`: nine tests cover all six
returned blockers against the shipped legal-move authority, F1 compiler, semantic collectors and
candidate adapter. `[V]`

## Method

- Re-read the returned RFC and independent review, then re-derived every named symbol at HEAD.
- Enumerated non-test callers under `apps/*/src` and `packages/*/src`, excluding generated output.
- Executed terminal fixtures through `exactLegalMoves` and chessops terminal predicates.
- Compiled the RFC's literal proposed F1 row with the shipped `compileEvidenceManifest`.
- Reconstructed the full current candidate evidence multiset from original declared values and
  compared it with `candidateFeatureVector` on ordinary, capture, double-attack and abstention
  fixtures.
- Executed a typed White-to-root score/loss model for both colors, cp, mate, mixed domains and
  measurement mismatch.
- Checked the rules boundary against FIDE Articles 9.2 and 9.3 and the score-domain boundary against
  Stockfish's current `UCIEngine::format_score`. `[V]`

## 1. A legal population is not a game adjudication ([[D1631]])

`Chess.isEnd()` is unsuitable as the packet's emptiness predicate because chessops returns end for
insufficient material as well as no-legal-move positions. `exactLegalMoves`, however, still returns
legal king moves for king versus king. The harness reproduces this directly. `[V]`
(`packages/runtime/src/legal-moves.ts`; `apps/server/src/service.ts:terminalPosition`)

The factual packet has exactly this closed status:

```ts
type CandidatePopulationStatus =
  | { readonly kind: "playable" }
  | { readonly kind: "no_legal_moves";
      readonly reason: "checkmate" | "stalemate" };
```

Construction order is normative:

1. derive `legalMoves = exactLegalMoves(canonicalFullFen)`;
2. if non-empty, emit `playable` and every legal row;
3. if empty, distinguish `position.isCheckmate()` from `position.isStalemate()` and emit zero rows;
4. any other zero-row state is a compiler defect.

Insufficient material, fifty-move and threefold remain **adjudication** attached to a run/game
decision, never packet status. Fifty-move state is partly carried by FEN's halfmove field;
threefold requires the occurrence history. FIDE defines repetition by repeated positions and the
fifty-move claim by fifty moves per side without pawn move or capture, confirming that neither is a
synonym for no legal move. `[V]`
([FIDE Laws of Chess, Articles 9.2–9.3](https://handbook.fide.com/chapter/e012023))

The same factual packet may therefore still support Review after the game was adjudicated. An
opponent operation may refuse to move because the game is over, but it must not falsify the legal
population to express that refusal. `[M]`

## 2. Three cache identities, not one ([[D1632]])

The packet and the final opponent decision do not have the same inputs. The harness proves that two
requests can share one packet identity while differing at both later layers. `[V]`

### 2.1 Factual packet

```text
digest(
  canonical full six-field FEN,
  legal projection id@version,
  move-identity convention,
  compiled manifest digest,
  packet compiler version,
  exact request scope
)
```

No seed, profile, band, session, provider or move history enters this key. Full FEN deliberately
retains both counters because anchors and evidence ids retain those bytes. `[V]`

### 2.2 Provider result

```text
digest(
  provider + engine/model/container identity,
  exact normalized EngineRequest bytes,
  start FEN + ordered history,
  options (Elo, temperature, top-p, MultiPV),
  fixed search bound / timeout contract
)
```

`OpponentSelector.#maia` sends `position fen <startFen> moves <history...>` and the policy options
as provider inputs. A provider receipt must therefore bind the exact request digest and output
digest. Equal final FEN does not license sharing a Maia result across different histories. `[V]`
(`apps/server/src/opponent-selector.ts:#maia`)

### 2.3 Policy/final result

```text
digest(
  packetId,
  admitted provider receipt/output digest,
  policyConfigDigest + exact profile identity,
  seed,
  authored spine/pack input when applicable,
  every other declared policy input
)
```

The current `selectionCacheKey` already retains history through `historyHash` plus profile, policy,
pack and seed. The repair is to **bound its existing single-flight map while preserving those
inputs**, not to replace it with the factual key before a staged provider/policy architecture
exists. When a later bot RFC separates provider and policy caches, it must use the three identities
above. `[V]` (`apps/server/src/opponent-selector.ts:selectionCacheKey`, `OpponentSelector.#cache`)

## 3. The first landing has one real operation, not three ([[D1633]])

The non-test source census is exact at HEAD: `[V]`

- `candidateFeatureVector` has only its definition in `apps/server/src/candidate-evidence.ts`;
- `selectLocalSemanticEvidence` has one actual caller,
  `apps/server/src/semantic-evidence-check.ts`, plus its own definition;
- `OpponentSelector` does not mention candidate population or candidate feature construction;
- `createApplication` constructs `OpponentSelector` without a population service;
- no `CandidatePopulationService` or `CandidatePopulationCache` symbol exists.

Therefore the RFC must delete the claim that this landing injects one service into a live bot and a
server-side semantic operation. That would again prove anchors rather than consumption ([[D666]]).

The buildable first landing is:

1. `CandidatePopulationCompiler.compile(beforeFen, scope)` — synchronous, provider-free, checks an
   optional abort signal between candidate rows, returns one frozen sealed receipt;
2. `CandidatePopulationCache.get(request, signal)` — process-local single-flight, rejection/abort
   eviction, dual entry/retained-weight LRU bound from [[D1579]];
3. `CandidatePopulationService.get(request, signal)` — the only public construction boundary;
4. `selectLocalSemanticEvidenceFromPopulation(packet, playedMove, policy)` — synchronous selection
   from the already-complete packet, no callback-supplied alternatives;
5. `semantic-evidence-check.ts` constructs one service and becomes the first executable
   `research.semantic_selection` composition root;
6. the server candidate adapter reads the packet's exact rows and preserves its current output
   closure, but is still documented as not live;
7. `OpponentSelector.#cache` gains a configurable bounded LRU while retaining its current exact key.

`application.ts` injection, a live bot call, Guided Hint and Review joins remain explicit discharges
owned by `evidence-move-selector`, `hint-distance` and `review-evidence-compiler`. The first live
consumer constructs one service in `createApplication` and injects that same instance into every
live packet consumer landing with it. This sequence avoids both an unused injected dependency and
three private caches. `[M]`

The compiler is local CPU work. Cancellation is cooperative between rows; it cannot interrupt one
collector call mid-stack. An aborted flight is not cached. Provider deadlines remain provider-layer
responsibility and never enter packet identity. `[M]`

## 4. The packet is a receipt of evidence, not an evidence projection ([[D1634]])

The RFC's literal row fails the shipped compiler exactly as the return states:
`declared_convention/convention` cannot derive solely from
`rules.mobility.reading.legal_moves@1`, which is `position_rules/exact`. The harness compiles that
literal tuple and receives `EVIDENCE_DERIVATION_WIDENS`. `[V]`

Adding every possible retained projection as one `inputs` member is also false: most event
projections do not fire on most rows, several reading/event projections explicitly abstain, and the
packet contains a variable multiset per candidate. `anyOf` is no repair: it describes alternate
complete derivation members, not a heterogeneous collection, and a single output grounding cannot
inherit each member's different grounding. `[V]`
(`packages/runtime/src/evidence-contract.ts:compileEvidenceManifest`)

The truthful repair is to remove `derived.candidate.event_population@1` entirely:

```ts
interface CandidatePopulationReceipt {
  readonly [CANDIDATE_POPULATION]: true;
  readonly id: string;
  readonly legalMoveEvidence: DeclaredEvidence<ExactLegalMoveReading>;
  readonly candidates: readonly {
    readonly moveUci: string;
    readonly afterFen: string;
    readonly events: readonly SemanticEvidenceEvent[];
    readonly readings: readonly DeclaredEvidence<unknown>[];
  }[];
}
```

The compiler seals this operator-only receipt with a private symbol plus process-local admission
set, freezes it deeply, and retains original event/evidence references. It is an internal data
structure organizing declared evidence; it makes no new chess assertion and is never passed to a
renderer or LLM. F1 continues to govern the constituent evidence at the consumer boundary. Each
consumer admits exactly the projections it uses, then receives the internal receipt beside those
admitted views as the population/index. `[M]`

This is not an F1 escape hatch. A packet cannot mint, re-declare, render or widen any contained
item; a forged/copy/JSON receipt fails its own runtime seal; every event still passes the semantic
seal; every consumer-visible evidence value still passes `evidenceForConsumer`. Treating a container
as a new derived chess fact was the escape hatch. `[M]`

## 5. Literal closure and no feature loss ([[D1635]])

The packet's one-edge **event** closure is derived from the exact functions composed by
`localSemanticEvents`, not from a sample:

- 11 structural events;
- 1 pawn-island event;
- 13 transition events;
- 4 tactical events;
- 1 castling-right event;
- 2 exchange-derived events;
- 1 discovered-execution event;
- 12 breadth events;
- 2 one-edge defender-duty events.

That is 47 unique projection ids. Selection-derived avoidance events and the seven observed-window
semantic tactics are not one-edge compiler outputs and are excluded by construction, not because a
corpus missed them. `[V]` (`packages/runtime/src/semantic-evidence.ts:localSemanticEvents`;
`packages/runtime/src/evidence-catalog.ts` projection-group constants)

The **reading** closure is the current 20-constructor child set plus two conditional identities:

- `rules.exchange.predicate.legal_exchange@1` only for a legal capture;
- `derived.tactic.fork_survives_reply@1` only when the same edge emitted a double attack, derived
  from that event and its exact reply-breadth reading.

The complete reading identity set is therefore 22; occurrence multiplicity is retained (for
example castling-legality readings), so migration compares sorted id@version **multisets**, not just
sets or counts. `[V]` (`apps/server/src/candidate-evidence.ts:childReadings`, `collectorResults`)

The harness reconstructs declared values from the real constructors and proves multiset equality
with the current vector on four permanent arms: ordinary `e2e4`, a capture carrying legal exchange,
`d4b5` carrying double attack plus fork survival, and a checking move whose threat reading honestly
abstains `pass_while_in_check`. Deleting either conditional feature fails. `[V]`

The packet may retain all 47 events while the legacy vector continues intersecting them with its
tactical+breadth allow-list. “Shared population” does not mean every consumer accepts every item;
it means every consumer selects from the same complete rows and original evidence identities. `[M]`

## 6. One White source, one typed root projection ([[D1636]])

`live.stockfish.position_eval@1` remains the correct reusable source: exact evaluated FEN,
perspective White, typed cp or mate, engine identity and one fixed bound. Stockfish formats mate and
cp as different variants and its cp conversion explicitly excludes mate, so any mate-to-large-cp
sentinel is false evidence. `[V]`
([Stockfish `UCIEngine::format_score`](https://github.com/official-stockfish/Stockfish/blob/master/src/uci.cpp))

Candidate comparison is a separate internal typed derivation:

```ts
type RootScore =
  | { kind: "centipawns"; value: number }
  | { kind: "mate"; outcome: "win" | "loss"; distance: number };

type CandidateLoss =
  | { kind: "centipawns"; value: number }
  | { kind: "mate";
      relation: "equal" | "slower_win" | "forfeits_forced_win" | "faster_loss";
      distance: number };
```

Admission and algebra are exact:

1. every evaluation FEN equals its packet row's `afterFen`;
2. every item has one identical engine/model identity and identical search bound;
3. cp flips sign only when the root side is Black;
4. mate `side` becomes win/loss relative to root; distance is a positive safe integer;
5. cp-only best is maximum root cp and loss is `best − candidate`;
6. mate-only winning best is shortest mate; if every candidate loses, best is longest survival;
   loss remains one typed relation above, never cp;
7. a cp/mate mixture abstains `mixed_domain` for the entire set;
8. engine/bound mismatch abstains `measurement_mismatch` for the entire set.

The existing cp-threshold guard consumes only cp losses. A mate result may provide typed ordering to
a separately ruled bot policy, but it cannot silently cross the cp guard. Review keeps the original
White score and never consumes root loss. `[M]`

The harness executes both root colors, cp-only and mate-only comparisons, mixed-domain abstention,
measurement mismatch, and zero/fractional mate-distance refusal. `[V]`

## 7. Exact author outcome

The RFC can now be amended without an owner ruling. The author must make these deletions explicit:

- delete the F1 packet producer/projection and raw-packet consumer bindings;
- delete `insufficient_material` from zero-row packet status;
- delete the packet-id-only final-cache rekey;
- delete the claim that application/bot/server semantic consumers land in the first implementation;
- delete the incomplete event+reading migration and White-bytes-as-root label.

Then replace them with the receipt boundary, separate adjudication, three cache identities, actual
first operation, 47+22 closure, and typed score algebra above. Another independent buildability
review remains required before implementation. `[M]`

## Limits

- This pass specifies a truthful foundation contract; it does not measure learner usefulness or bot
  feel.
- It does not choose a learner-visible semantic selection policy, hint rung, Review priority or bot
  personality weight.
- It does not create the F12 numeric release memory ceiling ([[D1580]]).
- It does not prove variants; all current collectors remain standard-chess scoped.
- The proposed internal receipt seal must still receive forge/copy/JSON and reference-retention
  negative fixtures during implementation.
