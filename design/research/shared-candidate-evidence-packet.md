# Shared candidate evidence — one rules population, separate score and horizon joins

**Status:** answered for the implemented code/contract arm `[V]`. The lower packet is specified
well enough for an RFC; end-to-end cache latency remains an implementation acceptance measurement.

**Question.** Can `CandidateFeatureVector` be reused as the common evidence substrate for bot
policy and semantic hints, or what lower primitive must both consume?

**Inputs.** The implemented candidate adapter and tests, the compiled evidence contract, the
D1066 semantic-horizon result, and the executable strict-subset/envelope instrument in
`tools/d1071-candidate-packet-harness/`. All claims below are `[V]` source or executable evidence.

## Verdict

Do not widen `CandidateFeatureVector`. Put a score-free, complete legal-candidate event packet
beneath it, then derive bot and hint products through separate exact joins.

The implemented vector fails all three reuse conditions:

1. **It is not a population.** The constructor accepts any non-empty set of individually legal,
   unique moves. On the initial position the harness supplies two moves, the adapter accepts them,
   and the exact legal population is twenty: **2/20 (10%)**. The production test nevertheless says
   “features every legal candidate” while supplying those same two moves
   (`apps/server/src/candidate-evidence.ts`; `apps/server/src/candidate-evidence.test.ts`).
2. **It is not retained semantic evidence.** A sealed `developed` event has eight envelope keys:
   anchor, basis, derivation inputs, evidence, id, operands, projection and sign. The vector keeps
   only `{source,payload}`. Sign, stable identity, source derivation and grounding are gone. A hint
   would have to recompute them, defeating D1071's cache, or trust an unsealed reconstruction.
3. **Its engine dependency is declared, not consumed.** The exact adapter accepts arbitrary finite
   caller bytes as `scoreCp`; the harness passes 900031 and 900027 successfully. Listing
   `live.stockfish.eval` in the manifest verifies a type-level dependency but does not bind these
   values to sealed engine evidence. This is the undeclared-input class already caught for runtime
   opening identity at D1018, now live in an operator projection.

There is also no runtime reuse to preserve: the only non-test `candidateFeatureVector(` occurrence
is its function declaration. The manifest names `selectMove; opponent-selector;
candidateFeatureVector`, but neither selection path calls the constructor at HEAD. Registration is
not integration.

## Required lower primitive

Provisional identity: `derived.candidate.event_population@1`. Naming remains RFC-owned; the shape
does not.

```text
CandidateEventPopulation {
  id                         digest of the identity fields below
  beforeFen                  canonical full six-field FEN
  legalConvention            exact legal-move convention id + version
  collectorManifestDigest    compiled producer/projection semantics
  compilerVersion            packet construction semantics
  legalMoves                 canonical sorted UCI population
  candidates[] {
    moveUci                  exactly one member of legalMoves
    afterFen                 canonical legal child
    events[]                 original sealed SemanticEvidenceEvent values
    readings[]               original sealed DeclaredEvidence values, if requested
  }
}
```

The compiler must establish set equality between `legalMoves` and candidate rows: same cardinality,
no duplicates, no omissions, no extras, canonical order irrelevant to meaning. Empty is legal only
for a terminal root and must carry the terminal reason. A caller cannot supply `afterFen`, event
sign, event id, derivation inputs or collector results; the compiler derives them from the root and
legal moves.

The packet carries no engine, score, rank, salience, selected event, prose, trait or grade. Local
rules remain available when Stockfish, Maia, tablebase, Explorer and the LLM are off. This is the
architectural separation the product needs: evidence collection is not a UI module and is not bot
policy.

## Three consumers, three exact derivations

| derived consumer | literal inputs | output | abstains when |
|---|---|---|---|
| bot candidate vector | complete event population + one sealed fixed-bound evaluation for every declared scored candidate | scores joined to retained event identities | evaluation provider is off, score set is incomplete/mixed-domain, or the bot's declared cap is not the complete population it claims |
| semantic-horizon hint | event population at each searched PV node + one sealed versioned PV | chosen eligible event, target, actor, occurrence ply and move | PV is absent/illegal, packet missing, selector finds no eligible event, or budget expires |
| Review opportunity/avoidance | event population at the played root + sealed played edge | played event and literal alternative denominator | played edge or complete population is absent |

The bot may intentionally evaluate a declared capped subset, but then the derived value says
`evaluated_subset` and cannot support D1066/R2 complete-alternative claims. MultiPV is a scored
search output, not the exact legal population.

## Cache and invalidation contract

The in-process cache key is:

```text
digest(canonical full FEN, legal-convention id/version,
       collector-manifest digest, packet-compiler version)
```

Selection policy does **not** belong in the packet key. A selected hint is a second cached
derivation keyed by packet id + PV identity + selection-policy digest; bot weighting is another.
This lets one factual population serve different opinionated modules without contaminating the
facts with presentation policy.

Construction must be single-flight per key and bounded by an LRU/session budget. Manifest,
legal-convention or compiler-version change creates a new key rather than mutating an old result.
Provider state cannot invalidate a rules packet because it has no provider input. Provider-off
invalidates or abstains only the dependent score/PV join.

The first implementation should remain process-local so runtime brands survive. A persisted or
cross-process form is a different projection: it needs a serialized receipt containing every
literal source digest and must be re-sealed on admission. JSON that merely resembles a semantic
event is not the event.

## Security and surface boundary

The full packet is operator-only. It contains every legal alternative and can therefore disclose
moves even though it carries no ranking. Learner surfaces receive only the admitted derived module
item allowed by `preset ∩ ceiling ∩ role ∩ availability`. The advanced inspector may identify the
sources of that item; it does not dump the candidate population.

The LLM is not a consumer of the packet. It may render a sealed selected item after the
deterministic module has fixed the event, operands and disclosure stage. It may not inspect all
alternatives to choose what seems interesting.

## Acceptance handoff

An RFC/implementation is buildable when it has able-to-fail fixtures for:

1. one omitted legal move, one duplicate, one extra and one wrong child FEN;
2. a terminal zero-move root distinguished from a truncated non-terminal root;
3. event sign/id/anchor/basis/derivation surviving the packet unchanged;
4. a caller-invented score rejected unless accompanied by the exact admitted engine item;
5. two concurrent consumers receiving one compiled packet identity;
6. provider-off rules success with bot/PV joins honestly unavailable;
7. manifest/compiler/legal-convention changes missing the old cache entry;
8. end-to-end cold and warm hint/bot latency, retaining D1071's measured cold/warm baseline.

This closes the research shape of D1071 and D1072. It does not authorize implementation, pick the
final projection name, or claim the latency gate has passed.
