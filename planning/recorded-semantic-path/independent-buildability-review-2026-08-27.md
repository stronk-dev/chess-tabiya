# Recorded semantic path — independent buildability return

**Reviewed:** 2026-08-27

**Reviewer:** codex

**Document:** `rfc/recorded-semantic-path.md`

**Verdict:** **RETURNED on four contract gaps ([[D1927]]–[[D1930]]) plus the inherited
value-level provenance blocker [[D1921]].** The bounded recorded-path compiler is the correct
missing producer operation for Review, modules, longitudinal analysis and drill feedback. The
draft cannot yet prove that it compiled the complete requested branch, that its source evidence
belongs to those edges, or that its identity includes the conventions under which the events are
true.

## Method

The pass re-derived the live branch resolver, run/node schema, recorded-move adapter, eleven
sequence constructors, semantic-event seal, compiled manifest, server read authority and proposed
digest/performance contract. A disposable five-arm harness executes the current boundaries. It
also derives the family population from manifest semantics rather than trusting the prose count.

## What survives

- one shared compiler over recorded history is preferable to Review, modules and longitudinal
  consumers independently recreating semantic events;
- the exact manifest predicate “semantic event has `run.record.move@1` in a declared derivation
  member” yields exactly the eleven named projection ids;
- all thirteen stated horizons match the current operand functions;
- complete per-start receipts correctly distinguish emitted, evaluated-negative and insufficient
  continuation;
- recorded runs and hypothetical Stockfish paths remain distinct source authorities;
- no selection, significance, grading, intention, prose or LLM work belongs in this operation;
- the authenticated server boundary can reuse the shipped `requireRead` authority;
- implementation is not complete until deleting a real downstream consumer fails an executable
  witness.

## 1. `branchPath` cannot establish the complete path ([[D1927]])

The draft makes `branchPath(run, branchId)` the sole authority and validates only the nodes it
returns. The live helper chooses the head as the last matching element in `run.nodes`, then follows
parents until a lookup fails. Reordering `[root, first, leaf]` to `[root, leaf, first]` makes it
return `[root, first]`; changing the leaf's parent to an unknown id makes it return `[leaf]` without
error. A parent cycle has no visited-set guard. Post-validating the returned slice cannot discover
ancestry that the resolver already omitted.

Specify a total strict resolver for this operation. It must reject duplicate ids, missing fork,
missing parent, cycles, multiple/disconnected tips and same-branch nodes outside the selected
chain; derive one tip from graph structure rather than array order; require the chain to reach the
declared fork and run root; and return typed refusals. If the active branch uses `activeCursor` as
an additional authority, state the rule and its non-active-branch counterpart explicitly.

## 2. `run.record.move@1` is narrative, not an exact edge receipt ([[D1928]])

The draft claims the existing projection retains run id, branch id, both node ids, FEN boundary,
ply/offset, UCI and SAN. Its manifest operands are only `context`, `offset`, `moveSan` and its
generic adapter validates key presence only. It seals an arbitrary context, offset and impossible
SAN. The renderer treats it as comparison prose (“branch at offset … begins with …”), not as a
typed edge identity. The exact FEN/UCI/node values needed to bind a semantic event are absent from
the declared payload.

Define one exact recorded-edge authority with a literal payload and validating adapter: run,
requested branch, before/after node, before/after canonical FEN, canonical UCI, canonical SAN,
absolute ply and branch-relative offset. Decide whether this is a new projection or a versioned
successor and price the resulting derivation/event migration; do not silently change the meaning
or operand shape of `run.record.move@1`. A missing or wrong SAN must refuse rather than becoming a
learner-visible false recorded move.

## 3. Exact derivation inputs are not bound to event operands ([[D1921]])

The sequence constructors check the number of move-evidence items and their projection refs. The
semantic compiler reduces derivation inputs to a set of projection ids. It does not compare source
payload values with the event's retained anchors. The harness passes two sealed move records from
“another-run”, with fake node ids, offsets 99/100 and SAN `Qa9`; the contact-timing event seals and
has the same id as the correctly sourced event.

This is the recorded-path instance of [[D1921]], not a second independent invention. The repaired
value-level derived constructor must accept the exact sealed source values, resolve one declared
derivation member, validate each recorded-edge receipt against the corresponding retained anchor,
and include the canonical source closure in the seal/receipt. Criterion 6 must test wrong run,
branch, node, FEN, UCI, SAN, order and multiplicity—not only wrong producer or missing projection.

## 4. The digest omits the convention head it claims ([[D1929]])

The result is said to be deterministic from current manifest/convention heads, and the eleven
events include declared-convention semantics such as `observed-window@1`. The digest material
contains `manifestDigest` but no semantic-convention registry digest or per-event convention
closure. The convention RFC that would create those receipts is itself returned and is not a
dependency here. A convention successor can therefore change what a named event means without the
recorded result proving which closure it used.

Make accepted/implemented semantic-convention provenance an explicit predecessor. Retain the
exact convention closure on emitted events and include its canonical registry/receipt identity in
the path result digest. If the author instead narrows the guarantee to projection bytes only, it
must delete every convention-head/history claim and explain how Review distinguishes old/new
semantics; silently relying on a future manifest change is not a contract.

## 5. The performance gate can bless any baseline and is unsafe as CI ([[D1930]])

The first implementation records whatever p95 it produces, with no absolute Review or
longitudinal-service budget and no fixed path-length envelope. Later regressions can be accepted by
editing the baseline beside an “explained mechanism difference.” Conversely, a raw wall-clock
25% assertion over an in-process chess workload is likely to reproduce the repository's recent
machine-sensitive CI failures.

Before acceptance, use a disposable prototype to measure fixed short/ordinary/long imported-run
populations and whole-set multiplication. Set an absolute budget from the strictest named consumer.
Keep deterministic operation-count/cache-call assertions in software-contract CI; route timing to
the performance tier with pinned environment, repetitions and tolerance. A benchmark record is
evidence, not its own mutable pass authority.

## Required next pass

Repair strict path and exact edge authority first. Coordinate the value-level seal and convention
receipt with the already-returned semantic-convention RFC rather than building a private local
provenance format. Then measure the consumer envelope, amend the result/digest and negative
fixtures, and repeat independent review. No owner UX ruling is needed.

No production, protected design, schema, content, server, web or archive byte changed in this
review.
