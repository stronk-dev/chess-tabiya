# Bot policy — fresh independent buildability review

- **Reviewed:** 2026-08-30
- **Input:** `rfc/bot-policy.md` after the D1970–D1976 author repair
- **Verdict:** **RETURN TO AUTHOR / NOT ACCEPTED**
- **Reproduction:** `make bot-policy-fresh-review` — 10/10 blocker arms
- **Prior author contract:** `make bot-policy-author-contract` remains green (5 tests covering the
  seven prior return families)
- **Production status:** untouched; no run schema, migration, provider, selector, roster or UI work
  is authorized

The repair correctly replaces private provider acquisition with shared-source intent, distinguishes
returned mass from legal coverage, adds a post-provider root check and refuses to invent a move when
Maia is absent. The fresh pass tested that model against the actual shared provider types, the
required 4×3 roster and the full Stage-A/Stage-B composition. It does not compose yet. Ten seams
remain; several are hidden because the author fixture redefines the provider payloads locally.

## B1 — the durable operation receipt has no storage home ([[D2087]])

The persisted type shown in §6 ends at `OpponentSelection.policy?: BotPolicyDecisionRecord`, while
`BotOperationReceipt` is a separate interface. The claims paragraph nevertheless says request/root/
receipt fields are in that same policy record. No event, table, column or envelope carries the
receipt. Worse, the receipt contains `committedEventHeadDigest`; embedding it in the event whose
head digest it names is self-referential unless the digest explicitly excludes that field.

**Required repair:** choose one durable home and canonical digest image. If the receipt is an event
envelope or side table, define atomicity, replay and account-export behavior. If it is embedded,
define a non-circular preimage and prove save → reload → retry returns identical bytes.

## B2 — the required 4×3 roster has no representable profile identity ([[D2088]])

The closed `BotProfileId` union contains three family ids. The product requires four model bands
crossed with those three families, but the run profile triple carries no band and a profile is
mutually exclusive with `targetElo`. One id/version therefore cannot identify four distinct banded
policies without assigning four different digests to the same identity.

**Required repair:** make the band part of immutable compiled identity—either twelve profile ids or
a closed family+band identity whose digest and version semantics are exact. Cross creation, resume,
rematch, cache identity and same-family/different-band rejection.

## B3 — the author contract forks the shared delivery type ([[D2089]])

The dependency defines a delivery as `{kind, servedAt, cacheIdentity, acquisition, payload}`. The
author artifact instead defines `{operation, root, requestDigest, payloadDigest, payload}` and seals
that private object. It drops actual acquisition/provider identity and invents root/payload fields
the shared type does not supply. Thus its green source-join test cannot compile against the named
dependency.

**Required repair:** import/use the exact accepted shared types. Define a bot-local derived join over
their real request/acquisition/payload identities; do not restate them. The provider RFC is itself
returned, so serialize this RFC behind its accepted form and re-run the join fixture against it.

## B4 — the decision grammar cannot represent mate-domain guard abstention ([[D2090]])

The shared all-legal table scores each row as centipawns or mate. The author model narrows score to a
number and requires numeric `guardLossCp` for every considered row. In all-mate or mixed-domain
positions, the RFC says the guard abstains; there is no honest centipawn loss to persist.

**Required repair:** use the shared score union and correlate the considered-row record with guard
state. A numeric loss exists only for a successful comparable-centipawn guard; abstained rows carry
no fabricated number and retain the exact reason/source score.

## B5 — the “sealed derivation” seals caller claims, not a policy execution ([[D2091]])

`projectBotPolicyDecisionRecord` accepts `chosenMoveUci`, layer actions and classifier ids from its
caller, writes `finalMass = rawMass`, and performs no guard mask, pawn transform, reconstruction or
seeded sample. The seal proves only that registered strings and candidate sets were supplied. A
caller can claim a guard was applied, choose any admitted move and receive a valid sealed record
without executing the declared policy.

**Required repair:** make one compiler-owned execution return the transformed distribution, layer
receipts and sampled move, then project the record only from that sealed result. Negative fixtures
must mutate a transform, layer action and chosen move independently and fail.

## B6 — idempotency omits declared operands ([[D2092]])

The replay digest covers request, root and profile digest but omits writer lease and derivation
digest—the very operands §4.1 says must distinguish reuse. The positive test also uses
`botreq_123`, which violates the published 16-character suffix minimum, because the model has no
request validator.

**Required repair:** publish one request constructor/parser and one canonical operand image covering
request id, exact root, writer lease, profile, derivation/provider identities and any other write-
relevant bytes. Cross same id with different lease, seed/derivation, provider payload and invalid id.

## B7 — baseline availability contradicts the mandatory Stockfish join ([[D2093]])

The source constructor requires both Maia and Stockfish before any decision can be built. The RFC
simultaneously says optional guard failure preserves Maia byte-for-byte and Baseline Play remains
available. With the proposed constructor, a missing/deadline Stockfish delivery prevents even the
baseline source view.

**Required repair:** name the legal-move authority needed for baseline independently from optional
guard scores, or define a typed unavailable Stockfish arm whose baseline projection still validates
Maia legal moves. Then cross baseline/guarded/pawn families under provider off, deadline and partial
delivery without weakening move legality.

## B8 — Stage B's all-legal packet cannot compose with bounded Maia ([[D2094]])

`deriveCandidateFeatureVector` returns every packet row after requiring set equality with the
all-legal root table. The record projector requires supplied feature rows set-equal to the bounded
Maia candidate rows. Whenever Maia omits a legal move, both requirements cannot hold. The author
test checks each half separately and never passes the Stage-B output into the record constructor.

**Required repair:** derive a typed retained projection keyed by the intersection selected by the
admitted Maia population while preserving the all-legal packet/root identities and coverage. Add
one end-to-end bounded-Maia positive and wrong-root/omitted-feature negatives.

## B9 — the severe-error guard compares against the wrong best move ([[D2095]])

The author constructor computes `best` from `input.source.candidates`, which are only Maia's bounded
rows. The guard exists to compare every Maia candidate with the best **legal** Stockfish move. If
Maia omits that move, a severe loss can appear safe.

**Required repair:** derive the reference score from the all-legal table before retaining the Maia
subset, with explicit cp/mate comparison semantics. Fixture the best legal move outside the Maia
window and prove it still masks a severe candidate.

## B10 — the below-floor fallback relies on a nonexistent selected move ([[D2096]])

§4.3 permits a below-floor Maia page to take an “exact recorded base-mode path if it still contains
a legal selected move.” `MaiaPolicyPage` contains probabilities, not a selected/best move, and no
base selection algorithm or receipt is defined for this path. The author model does not implement
the branch.

**Required repair:** either run the one declared seeded sampler over the admitted bounded page and
record that honest degraded derivation, or remove the fallback. Do not invent a provider-selected
move that the shared payload never emitted.

## Re-review order

1. Repair the shared provider dependency, score algebra and baseline/guard source join.
2. Define twelve stable roster identities and one durable, non-circular operation receipt home.
3. Replace the shape-sealing projector with a compiler-owned transform + sampler result.
4. Close idempotency operands and the below-floor result algebra.
5. Make Stage B retain the bounded Maia intersection while preserving all-legal authority.
6. Invert all ten arms, preserve the author checkpoint, run full verification, then request fresh
   independent review.

No provider, bot-policy, roster, run-schema, migration, endpoint, storage or UI implementation is
authorized by this return.
