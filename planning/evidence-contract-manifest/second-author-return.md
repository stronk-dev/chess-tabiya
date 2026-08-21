# Evidence contract manifest — second bind-stage author return

Date: 2026-08-21
Implementation base: amended/re-accepted F1 at `b8e8c87`

The amended sentence authority is buildable and implemented in the working checkpoint. This
return is narrower: applying criterion 7 to the other registered operations found that the census
does not consistently identify an evidence-consumer entrypoint.

## 1. Two census rows cannot accept evidence at their named entrypoint

`guidance.packet` is listed in `CURRENT_CONSUMER_OPERATION_IDS`, but RFC §10.2 says the packet is
an internal aggregate and *"not itself a consumer binding"*. Its implementation entrypoint
constructs evidence from a run/node/pack; requiring that constructor to accept an already-admitted
view reverses the data flow. Its explicit disposition does not resolve criterion 7, which says
every registered operation entrypoint and every pre-F1 bare payload.

`analysis.engine` is anchored to the POST `/analysis` route. That route receives node ids and a
requested engine job kind, then queues work. No `live.stockfish.eval`, WDL or PV payload exists at
that point. The real consumer boundary is later, where completed evidence is read/rendered. An
empty branded view at the POST route would be an anchor with stronger typing, not consumption.

Required author action: separate producer/request anchors from consumer-delivery entrypoints,
name the real analysis delivery symbol, remove the packet constructor from the operation census or
state an explicit criterion-7 exclusion, then re-derive the count and set-equality criterion.

## 2. Structural expressions have no exact projection identity

The 18 `rules.structural.predicate.<feature-kind>` projections are leaf feature identities. The
actual authored condition passed to `matchesStructuralExpression` is a recursive
`StructuralExpression`: `all`, `any`, `not`, `feature`, `pieceOnSquare`, `mirrored`, quantified
file/square expressions and `plan_signature`. A single expression may contain several feature
families. Criterion 7 requires the old raw expression to stop typechecking, but F1 supplies no
truthful exact projection that can carry the whole AST.

Required author action: choose and specify one payload boundary. Buildable candidates are:

1. a computed predicate-result projection carrying the boolean, operands and literal leaf
   dependencies, after which objective/guard code consumes the result;
2. an authored-condition projection carrying the complete AST, distinct from the rules producer;
3. a complete versioned expression-node vocabulary with a deterministic reconstruction rule.

Do not place a composite AST under an arbitrary leaf projection; that would make the typed bytes
and projection semantics disagree, the same class as D665.

## 3. Work that remains valid

- `EvidencePacket.sentences` is deleted.
- admitted and rendered views have a non-exported runtime symbol seal.
- registered renderers are the only sentence constructor; provider input and `voiceCheck` share
  the same sealed item list.
- compare and story carry declared `run.record` and `derived.*` items, including rank ancestry.
- reasoning review uses a separate typed non-evidence request and provider method.
- detector `PhaseReading` and authored pack phase are distinct projections.
- the compiler enforces non-empty derived inputs, dependency closure/cycles, grounding,
  exactness, answer-content and abstention inheritance.

No schema, storage or content file changed. D667 and D668 remain untouched.
