# Declared-evidence value authority

**Question.** Does the private declared-evidence seal prove that a rules payload equals the chess
authority named by its projection, or only that a public named adapter was called?

**Disposition.** Answered for the current adapter population `[V]`. The seal is a construction and
identity boundary, not generally a value-authority boundary. This is safe for source classes whose
adapter is itself the named trust boundary only when that trust is explicit. It is insufficient for
deterministic rules facts before those facts gain ordinary product consumers.

## Method

The disposable D2144 harness reads the complete one-line `exactObject` adapter population, joins
each projection to the compiled manifest, checks that every adapter is exported from the runtime
barrel, and executes false-value controls through live adapters and the compiled consumer gate.
The working negative control is the repaired pawn-contact adapter from D2141. `[V]`
(`tools/d2144-evidence-seal-audit/value-authority.test.ts`; `make evidence-seal-audit`)

The D2146 refresh widened the instrument from the initial suffix-specific regex to every generic
`exactObject` const and every specialized/dynamic mint route. That correction found one omitted
adapter whose name does not end in `Evidence`, four duplicate mint paths and six declared
projections with no mint path. `[V]` (`design/research/evidence-mint-route-closure.md`)

This pass measures the current tree. It does not claim that every generic adapter should recompute
its payload: recorded, authored, human/provider and deterministic rule sources have different
authorities.

## Results

### 1. The seal proves construction, not truth

`declareEvidence` validates literal producer/projection ids, freezes the wrapper, and adds the
wrapper to a private `WeakSet`; it never validates the payload against a board, move, provider
receipt or authored source. `assertDeclaredEvidence` checks that private membership. `[V]`
(`packages/runtime/src/evidence-contract.ts:393-406`)

The generic `exactObject` helper checks that its hand-written required-key list equals the
manifest operand list and that required keys are present. It does not compare values with the
producer operation; D1934 separately records that it also accepts extra keys. `[V]`
(`packages/runtime/src/evidence-source-adapters.ts:16-26`; `design/BACKLOG.md` [[D1934]])

The runtime barrel publicly exports the named adapters, so the construction boundary is available
to every runtime consumer rather than being private to the producer that computed the fact. `[V]`
(`packages/runtime/src/index.ts:386-475`)

### 2. Population

The current source file contains **75** public generic object adapters. Their compiled grounding /
exactness classes are: `[V]` (`tools/d2144-evidence-seal-audit/value-authority.test.ts`)

| Plane / grounding / exactness | Adapters | Currently bound |
|---|---:|---:|
| rules / position rules / exact | 20 | 12 |
| rules / declared convention / convention | 17 | 5 |
| derived / declared convention / convention | 13 | 11 |
| derived / position rules / exact | 5 | 3 |
| derived / recorded run / exact | 2 | 2 |
| derived / recorded run / convention | 2 | 2 |
| derived / declared convention / exact | 1 | 1 |
| search / tablebase exact / exact | 4 | 4 |
| search / bounded search / measured | 2 | 2 |
| human / corpus or model / measured | 4 | 4 |
| authored or theory / authored claim / authored | 4 | 4 |
| record / declared convention / convention | 1 | 1 |
| **Total** | **75** | **51** |

The 15 currently bound position-rules/exact rows are not merely future inventory: they include
castling-rights loss, square-control events, pawn-island events, exact check/reply-breadth events,
defender removal/relocation and three derived state events. `[V]`
(`tools/d2144-evidence-seal-audit/value-authority.test.ts`, third inline population snapshot)

### 3. False-value controls

Four independent same-key false readings—castling rights, square control, material-role magnitude
and loose-piece status—receive valid declared wrappers. Those four exact readings currently have
zero compiled consumer bindings, so absent reach is their present protection. `[V]`
(`tools/d2144-evidence-seal-audit/value-authority.test.ts`, second test)

An impossible castling-rights event also receives a seal: `e2e4`, identical before/after FENs and
cause `rook_captured`. Unlike the four readings, it is admitted by
`research.semantic_selection@1`. The adapter consults neither position. `[V]`
(`tools/d2144-evidence-seal-audit/value-authority.test.ts`, third test;
`packages/runtime/src/evidence-source-adapters.ts:119`)

The repaired pawn-contact adapter refuses a same-key inversion of every passed-pawn result by
recomputing the complete authority from the retained FEN. That demonstrates the boundary can fail
for value forgery without weakening the private seal. `[V]`
(`packages/runtime/src/evidence-source-adapters.ts:138-154`;
`packages/runtime/src/evidence-adapter-closure.test.ts:87-99`)

## Interpretation

This does **not** show that 75 adapters need one universal recomputation rule. It shows that one
function currently serves four different trust models without declaring which model applies:

1. deterministic board/edge rules that can compute their own complete payload;
2. derived facts that should be minted only after exact declared inputs are checked;
3. recorded/provider/human measurements that must retain a sealed acquisition/source receipt; and
4. authored facts whose authority is provenance plus review, not machine chess truth. `[M]`

The ordinary-module expansion makes the distinction urgent. The four forged readings are harmless
to learners today only because they are unbound; Phase 3 exists to bind this evidence into Support,
Review and bots. Treating current zero reach as proof of source correctness would recreate the
producer-to-consumer gap at the trust boundary. `[V]` for current reach; recommendation `[M]`.

## Required successor contract

Before a deterministic rules projection becomes a learner, Review, bot, pack-validation or
longitudinal input, its declaration needs one exact **value-authority mode** and an able-to-fail
negative: `[M]`

- `computed`: one constructor owns computation from FEN or a validated edge and returns sealed
  evidence; callers cannot provide the result object;
- `derived`: one compiler validates the literal declared-input member and alone mints the output;
- `recorded` / `provider`: the adapter requires the exact sealed source receipt and projects from
  it without caller-supplied identity;
- `authored`: the adapter requires the registered authored/provenance authority and does not
  mislabel authored judgement as position-rules exactness.

The repair should be population-driven and staged. D1934's exact-key repair is necessary but not
sufficient; changing `exactObject` to reject extras still accepts false values. D2141 is the
positive implementation pattern for a deterministic complete reading, not permission to
duplicate 75 collectors. The complete boundary is larger still: 191 routes mint 187 distinct
projections, while six catalogue projections have no route. `[V]` for the insufficiency; repair
shape `[M]`.

## Product consequence

DESIGN-GAP: B4's claim that “exact source adapters” ship is true for identity/construction and
false as a population-wide value-authority statement. Gate F must not admit ordinary evidence
delivery merely because a wrapper is sealed; the bound source must prove the payload under one of
the four modes above. This strengthens the existing no-raw-dump architecture and does not add a
learner setting or new chess claim.
