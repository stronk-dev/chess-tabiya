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
