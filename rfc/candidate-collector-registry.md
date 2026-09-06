# RFC: Candidate collector registry — the executable topology behind a packet row

- **Status:** **draft — stub. Cut out of `rfc/shared-candidate-evidence-packet.md` on 2026-09-06 and
  not yet written.** This file exists so the collector-execution material removed from that document
  has a named home and a named owner ([[D1230]]), and so the findings raised against it stay routed.
  It specifies nothing yet. Nothing in it authorises implementation.
- **Author:** claude (cut record 2026-09-06); the cut material's original authors are claude and codex
- **Created:** 2026-09-06
- **Design refs:** `design/05-in-run-experience.md` §5 — *"detection is cheap, significance is not"*;
  this registry is the detection half
- **Exploration gate:** inherited from [[D1071]] 📊 and [[D1072]] 🐞, whose dossier is
  `design/research/shared-candidate-evidence-packet.md`. No new gate is claimed and no new research is
  opened
- **Depends on:** `rfc/shared-candidate-evidence-packet.md` — that RFC owns the value a collector
  result becomes; the implemented F1 evidence contract and the compiled catalogue at HEAD
- **Parent / amends:** cut from `rfc/shared-candidate-evidence-packet.md` §3.4/§5.3 and its
  Discharge D12
- **Supersedes / superseded by:** —
- **Planning:** `planning/evidence-foundation-ux/candidate-packet-cut-plan.md`

```tabiya-claims
none
```

The registry declares no catalogue projection of its own: every collector output keeps the exact F1
identity it already has, and the generated key map is derived from `PRIMARY_EVIDENCE_MANIFEST` rather
than added to it. This inherits the packet RFC's `none` on the same ground ([[D936]]).

## Summary

`rfc/shared-candidate-evidence-packet.md` was cut to the contract its dependents carry. What came out
of it, and lives here, is the **executable topology** beneath a packet row: the thirteen collector
adapters, their declared outputs and dependencies, the dependency-closed execution plan for each
request scope, the per-collector memo, the generated `id@version` projection dialect, and the sealed
outcome that gives every abstention its authority.

This is a stub, deliberately unwritten per [[D3034]]. The packet RFC requires only that the emitted
closure be **code-derived** and that a projection outside it be refused; how the declarations are
wired, ordered and invoked is this document's, and it stays unbuilt until a consumer needs it.

## Specification

### §1 — Inherited scope and its rows

Everything below was raised against author models of the packet RFC across fourteen fresh-review
rounds. Each is a real finding about a real model; none of them is production code.

**The registry and its topology.** [[D2100]] — projection ids were not an executable collector
topology. [[D2200]] — the advertised thirteen-callable registry did not satisfy its own declaration
type. [[D2684]] — the "thirteen-collector" execution ran thirteen local lookalikes. [[D2940]] — the
child-reading vocabulary was hand-copied and checked against itself. [[D1635]] — the packet migration
dropped two declared candidate features.

**The projection dialect.** [[D2329]] — the "literal projection" type was actually `string` and mixed
two dialects. [[D2199]] — an available-empty result could not identify which projection was checked.
[[D2201]] — the public contract referenced three types it never defined. [[D3012]] — receipt
assertion did not reconstruct the outcome/row bijections it claimed.

**Scope plans and dependency closure.** [[D2330]] — the declared `readings_only` scope removed
collectors its own readings require. [[D2626]] — request scope could change chess evidence while a
direct and a projected packet shared an id. [[D2656]] — the scope-equivalence control executed no
real plan. [[D2934]] — every collector was handed the complete prior memo, reopening hidden order
dependencies.

**Failure and abstention identity.** [[D1981]] — the wrapper erased unavailable into the same array
as an available no-match. [[D2102]] — collector failure reopened projection as `string`. [[D2104]] —
the receipt did not retain the collector result that created an abstention. [[D2887]] — the declared
`collector_failed` result was unreachable. [[D2935]] — a multi-output collector's throw was falsely
attributed to its first declared projection. [[D2939]] — receipt assertion checked counts but not the
exact joins.

**The legal-value seam this registry sits above.** [[D2198]] — the product factory accepted an
arbitrary manifest while every collector minted against `PRIMARY_EVIDENCE_MANIFEST`. [[D2655]] —
factory ownership was asserted against RFC prose rather than an executable source graph. [[D2657]] —
the retained graph skipped the private wrappers holding collector results. [[D2891]] — the packet
re-executed loose-piece chess logic to reconstruct a result the predecessor had already flattened.

**Vacuous and misclassified guards.** [[D2888]] — the non-terminal-empty invariant could not fire.
[[D2941]] — the author target called its TypeScript check "strict" while omitting the repository's
`exactOptionalPropertyTypes`. [[D2678]] — the compiled request was not closed. [[D2679]] — the packet
id omitted five required factual terms. [[D2680]] — direct and projected narrow packets shared an id
but retained different private evidence.

Two rows in that last group ([[D2678]], [[D2679]]) are properties of the packet's own identity and
are re-asserted by `rfc/shared-candidate-evidence-packet.md` §3.2 and §6.1; they are listed here
because the model that failed them was this registry's.

### §2 — Criteria that moved here with their mechanism

Criteria **28** (registry-closed collector failure identity), **29** (sealed abstention authority and
the outcome bijection), **30** (one manifest owns packet identity and retained values), **31** (every
result is projection-addressed), **32** (the thirteen-row registry compiles and executes its declared
topology), **34** (one literal projection dialect) and **35** (dependency-closed scope plans without
widened retained output) keep their numbers from `rfc/shared-candidate-evidence-packet.md`. Their text
is in `planning/evidence-foundation-ux/candidate-packet-cut-plan.md`.

### §3 — What this RFC may not do

It may not restate or amend `rfc/shared-candidate-evidence-packet.md` §3–§5. The packet's shape, its
completeness rule and its retention-by-reference rule are that document's; a collector produces a
value, and the packet decides whether it may be retained.

It may not become a fourteen-round contract harness. [[D3034]] is the standing ruling.

## Deviations from design

**None.** Nothing is specified yet.

## Acceptance criteria

**None yet.** This is a stub; it has no acceptance surface until it is written. Criteria 28–32, 34
and 35 are reserved for it and are not asserted here, because a criterion nobody can run red is the
defect class [[D444]], [[D984]] and [[D1274]] name.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | Write this RFC, or record that no consumer needs it. It is a stub created by a cut; a stub that is never resolved is a hiding place | codex | `planning/evidence-foundation-ux/candidate-packet-cut-plan.md` | |

## Ledger rows

No new rows. Every row named in §1 is an existing ledger row inherited from
`rfc/shared-candidate-evidence-packet.md` by the 2026-09-06 cut.

## Changelog

- 2026-09-06 — created as a stub by the cut of `rfc/shared-candidate-evidence-packet.md`
  ([[D3034]]'s changed unit of delivery, second application). Carries the collector-topology,
  scope-plan, projection-dialect and abstention-identity material and its rows. Specifies nothing.
