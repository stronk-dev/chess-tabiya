# Evidence contract manifest — implementation log

Append-only.

## 2026-08-21 — implementation opened

- Reconciled the accepted register/body status split caught by `make status-parity` ([[D661]]).
- Refreshed the RFC's fourteen areas to exact current files and symbols in `plan.md`.
- Began checkpoint 1 (Declare); no schema, storage or content change is authorized.

## 2026-08-21 — verification returned the binding checkpoint to author

- Checkpoints 1 and most of 3 are executable: the shared compiler/catalogue declares 14 producer
  paths, 65 projections, 23 current operations plus the disposed arrows surface, 177 exact
  bindings, a deterministic digest, startup failure, `/capabilities` summary and the
  `make evidence-manifest-check` gate. Twelve isolated compiler error fixtures pass.
- The production guidance packet now wraps its local/recorded members, and the external voice
  adapter receives a compiled `guidance.voice@1` view rather than the whole packet. Exact
  producer/projection matching was tightened after review showed projection-only filtering could
  accept a forged producer identity.
- `make verify` is green: 788 tests / 121 files. A3 detector conformance and A5 workflow-default
  baselines remain green. The disposable A4 negative harness now fails on its historical assertion
  that plans are not wrapped; the new catalogue/manifest tests are the stricter replacement while
  the negative baseline remains in Git history.
- The bind-stage audit found [[D662]]: `VoiceEvidenceView.evidence` is compiled, but its `sentences`
  member is copied independently from `EvidencePacket`. Compare replaces those sentences and Story
  appends derived prose without matching declarations, so real provider bytes can still bypass a
  green manifest. The same audit exposed the pre-existing separate reasoning adapter defect
  [[D663]].
- Per RFC §10/§15, F1 is returned at this seam rather than gaining a legacy bypass. Author review
  must choose and specify the truthful derived-evidence boundary for compare/story revoice (for
  example, declared scope-specific projections or removal from this consumer). No content/schema
  migration or F2 selector work was started.

## 2026-08-21 — author return made buildable

- `author-return.md` traces every voice/speech/reasoning scope and prices three remedies. The
  recommended shape is one typed rendered item whose sentence and source evidence cannot diverge;
  a generic derived-sentence projection is explicitly refused.
- [[D665]] records the false phase payload/provenance declaration.
- [[D666]] records that the 23-operation checker is currently an anchor census, not the accepted
  bare-payload bypass proof. The handoff preserves it for what it does prove and specifies the
  missing negative type fixture.

## 2026-08-21 — amended bind stage returned on consumer-boundary identity

- The amended sentence path is executable: raw packet prose is gone; admitted and rendered views
  are runtime-sealed; provider input and `voiceCheck` share one item list; compare/story now emit
  declared record/derived items; reasoning review has a separate non-evidence request; detector and
  authored phase payloads are distinct. Focused typechecks and 61 tests are green.
- Applying criterion 7 beyond voice found [[D669]]: `guidance.packet` is a producer explicitly
  forbidden from being a consumer by §10.2, while `/analysis` is a command issued before the
  evidence it allegedly consumes exists. An empty branded wrapper would repeat [[D666]].
- [[D670]] records the second buildability failure: 18 leaf predicate ids cannot exactly identify
  a recursive multi-family `StructuralExpression` AST. Wrapping the AST under one leaf would repeat
  [[D665]] at a new payload.
- `second-author-return.md` prices the author action and preserves the independently valid amended
  implementation. No schema, storage, content, D667 or D668 work was absorbed.

## 2026-08-21 — second author amendment accepted; bind stage resumed

- [[D669]] is resolved in the contract by distinguishing producer/computation, acquisition and
  consumer/delivery directions. `guidance.packet` and `analysis.engine` leave the consumer census;
  their producer/request symbols remain separately checked. The census re-derives to 23.
- [[D670]] is resolved in the contract by separating the complete authored AST, direct
  feature-leaf results and a total computed result carrying an exact path/node/result trace. The
  review caught and included non-feature grammar nodes rather than pretending the 18 feature kinds
  cover `pieceOnSquare`, quantified `piece` or `plan_signature`.
- Buildability checks are green: runtime typecheck, 8 focused tests and
  `make evidence-manifest-check` (17 producers / 80 projections / 23 operations / 197 bindings).
  F1 remains implementing while the real delivery bindings and criterion-7 type fixtures land.
