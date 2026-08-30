# AssistanceConfig register log

## 2026-08-26 — Draft opened

Research gate passed in `design/research/assistance-config-shared-resource.md`. Draft specifies a
format/order-insensitive AST digest, one sequential head+1 writer, twelve able-to-fail mutation
classes and no product-byte changes. Guided Hint is the proposed sole v5 owner; presets retain a
dependency rather than a second claim. Awaiting independent process/buildability review.

## 2026-08-26 — Pre-review buildability corrections

The first self-review found three exact contract gaps before the independent pass. [[D1627]]:
syntax-only direct-union extraction would reject v5's already-specified
`"off" | HintRung`, whose domain resolves through an imported readonly tuple. The draft now uses a
workspace TypeScript `Program`/`TypeChecker`, normalizes resolved literal domains and fails on broad
or non-literal residue. [[D1628]]: RFC-0000 is already generic, so naming one current resource there
would create a prose inventory; it is removed from the file boundary. [[D1630]]: the shipped
`derivedOutput` fallback assumes every non-schema/non-migration resource is `evidence-kinds`, so
the RFC now pins the assistance output branch and fixture.

The adjacent v5 product seam is separately ledgered as [[D1629]]: registration alone does not bind
the hand-written browser parser/migrations to runtime's type. `hint-distance` now requires one pure
runtime codec consumed by web and a TypeChecker-derived persistence conformance matrix. The process
register remains product-byte-free and ready for independent review; implementation is not
authorised yet.

## 2026-08-27 — Independent review return

The TypeChecker extraction, single-writer ownership, history and product-byte boundary survived.
The review returned one false-green, [[D1916]]: C9.3 permits a live lane-5 claim to excuse changed
v4 bytes while the tree head stays 4. The claim can reserve only the next head; tree and register
head/digest must always agree on checked bytes. Three executable controls also reproduced the
already-routed [[D1629]] browser-codec gap without duplicating it here. Exact return:
`independent-buildability-review-2026-08-27.md`.

## 2026-08-27 — D1916 author repair executes

Removed the claim-based digest exception. The amended C9 always requires AST-derived tree head and
digest to equal the checked register; a live claim only reserves registered head+1. The disposable
review harness now passes 7/7: same-head drift plus lane 5 and head-only drift plus lane 5 both
fail; unchanged head 4 plus one lane-5 reservation passes; only a complete atomic head-5
tree/register/landed update with the claim removed passes. The two D1629 browser-codec controls
remain downstream product work. Repeat independent review is required before implementation.

## 2026-08-28 — Repeat independent review return

The [[D1916]] always-equal current-head repair passes its stable 7/7 Node-24 contract. Repeat review
returned the remaining process boundary on [[D2009]]–[[D2012]]: C9 preserves only the current
Landed head rather than contiguous history; the sole v5 claim names `validV5` even though Guided
Hint forbids that parallel validator; the mandated preset status rewrite skips the still-open D1639
owner ruling; and a final head-5 snapshot cannot prove the previous commit held the sole writer
claim. `make assistance-register-repeat-review` reproduces all four. C9 implementation and v5 claim
transfer remain blocked pending author repair and fresh review.

## 2026-08-28 — Second-return author repair

C9 now treats Landed rows as exact history: bootstrap pins heads 1–4 to their recovered commits,
and later staged/first-parent checks accept only prefix-preserving one-head appends. A head advance
must consume exactly one prior matching claimant, remove its claim, append one row owned by that
RFC and make a source-change set exactly equal to the claim's path/symbol tokens. The v5 claim names
the two `AssistanceConfig` fields plus runtime `parseAssistanceConfig`, never `validV5`; the future
presets wording says Guided Hint awaits the D1639 owner ruling and then repeat review. The seven-arm
author contract passes with the original seven D1916 checks. Fresh independent review remains;
implementation and claim transfer are still unauthorised.

## 2026-08-30 — Fresh independent review return

The D1916/D2009–D2012 repairs survive, but the completed enforcement path does not. [[D2037]]:
repository-governance uses a shallow default checkout, so the committed `HEAD^1` transition C9.5/6
requires is unavailable; the RFC also excludes the workflow repair from its exact file boundary.
The existing status checker demonstrates the dangerous fallback by silently omitting its committed
arm when `HEAD^` cannot be read.

[[D2038]]: the author transition accepts an already-projected `changedSymbols` list and no closed
source/import census defines every AssistanceConfig codec/persistence authority. Adding a parallel
browser `validV5` while reporting only the three claimed runtime tokens therefore passes the author
model, contradicting criterion 15. Four review reproductions pass behind
`make assistance-register-final-review`. Exact return:
`fresh-independent-buildability-review-2026-08-30.md`. No process/product implementation is
authorised until both boundaries are repaired and freshly reviewed.

## 2026-08-30 — Third-return author repair

Repaired [[D2037]] by placing the governance workflow in the exact implementation boundary,
requiring `fetch-depth: 2`, resolving `HEAD^1` explicitly and making missing required history
fatal. Repaired [[D2038]] by replacing caller-supplied transition tokens with a generated closure
over runtime `AssistanceConfig` fields, the sole runtime codec and the sole browser persistence
reader. The v5 claim now names all four roots; parallel validators, migrations and namespace
readers cannot hide outside the comparison.

The disposable author contract is now six arms behind `make assistance-register-final-review`.
Implementation and claim transfer remain unauthorised until a fresh independent review accepts the
complete amended C9 contract. Exact repair receipt:
`third-return-author-repair-2026-08-30.md`.

## 2026-08-30 — Fourth-return author repair

The second fresh review's five blockers were one boundary error: resource identity described the
interface plus selected reader symbols, not the persisted/configured AssistanceConfig contract.
The RFC now defines one phase-aware TypeScript/Svelte authority graph. Bootstrap seals the actual
v4 `validV4`/`migrate`; v5 must remove both for the sole runtime codec. The graph contains the
shared storage key, reader, writer, serializer, constructors, permission projection and Advanced/
run consumers, and its canonical bytes join the contract digest so fixed-head semantic drift fails.

The Guided Hint reservation is now the exact ten-node symmetric difference, including deleted
legacy operations. `make assistance-register-second-author-repair` passes 8/8 against real source
and mutations; the historical five-arm return harness now fails 5/5, the intended inversion. Exact
receipt: `fourth-return-author-repair-2026-08-30.md`. Implementation and claim transfer remain
unauthorised until a fresh independent review accepts the complete contract.
