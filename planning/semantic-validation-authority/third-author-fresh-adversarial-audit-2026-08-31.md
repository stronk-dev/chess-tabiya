# Semantic-validation authority — fresh adversarial buildability audit

- **Date:** 2026-08-31
- **Subject:** `rfc/semantic-validation-authority.md` after the D2331–D2333 repair
- **Verdict:** return to author on D2385–D2388 before the required independent review
- **Independence:** this is a fresh author-side/Codex adversarial pass, not the independent
  acceptance review; it cannot accept the RFC
- **Production:** untouched

## What survives

The D2331–D2333 repair closes the defects it names. Identity uses one base id plus numeric version;
the six profile arms now have distinct reference images; and an oracle authority retains a typed
witness and result. The maintained D2039, D2194 and D2331 author contracts pass.

The repaired document remains unbuildable for four later or adjacent reasons.

## D2385 — reading roots enter an event-only machine

Section 2 extends the root inventory with active `reading` projections and names two bounded-target
readings. Every execution and consumer type below it is still event-specific:

- declarations are `SemanticEventDeclaration`;
- operation results contain `SemanticEvidenceEvent[]`;
- cases and profiles name an `event`;
- receipts count target events; and
- eligibility calls `eventProfile` and accepts an event instance.

No operation can return a reading, so set equality either becomes impossible when the first reading
root lands or an implementer silently excludes the extension. Repair with one typed semantic-
observation union used end to end, or a separate validated-reading protocol with exact consumer
parity. Renaming `event` to `projection` without changing the result algebra does not close it.

## D2386 — cases are simultaneously equal and optional

Section 2 requires bidirectional set equality among all roots and every case's event reference,
then immediately permits cases to be a subset when cells are `required`. Criterion 1 omits cases
from the equality; criterion 14 only rejects dead or unreferenced case rows. The important state—a
new root whose executable cells are all honest debt—therefore has two incompatible outcomes.

Repair by naming the exact equal sets (roots/declarations/profiles/verdicts), the exact subset join
(case events), and the rule that every `present` case ref resolves while a `required` cell creates
no fake case. Fixture a debt-only root.

## D2387 — the oracle's output has no event proposition

The oracle runner passes only `SemanticValidationOracleRequestMap[K]` to an oracle. Those six
requests are event-agnostic rules questions such as legal successor or attack map. Its result then
contains an event-specific `SemanticValidationExpectation` and is checked only for equality with
the case expectation.

The same legal edge can emit several semantic families. A legal-successor fact therefore cannot
entail “castled emits” unless the oracle hides a second semantic predicate or a hard-coded case
answer. Import isolation does not make that mapping true. Repair by returning a neutral typed rules
fact, then requiring an independently sourced proposition that derives the target-event expectation
from that fact, or by declaring a complete event-specific independent oracle whose predicate is
reviewed as authority.

## D2388 — owner authority resolves nowhere

`owner_authored` carries a free-form `receipt` string and two digests. The prose promises a
committed owner-authored authority row but declares no store path, schema, identity/version rule,
parser, immutable bytes or single writer. That is precisely the boundary law 8 needs to distinguish
an owner judgement from an LLM-created row.

Repair by specifying the exact immutable store and ownership/write boundary plus missing, duplicate,
stale and non-owner negatives. If no such store is warranted for 1.0, remove this authority arm and
leave those cells `required`.

## Next review

The author must repair all four findings and add executable negative arms. The existing independent
review is still required afterward; this audit does not discharge it. No runtime, validation
receipt, eligibility, schema or content implementation is authorized.
