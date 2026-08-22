# Tactical + breadth collector RFC joint buildability review

**Date:** 2026-08-22  
**Inputs:** `rfc/tactical-collectors.md`, `rfc/breadth-collectors.md`, current F1/F2 runtime types
and catalogue, the completed D730/D794/Phase-2b dossiers  
**Outcome:** three blocking contract defects found and amended; both RFCs remain draft pending the
required acceptance action

## Why review them together

Breadth consumes Wave A's legal exchange, reply breadth, capture, castling and check authorities.
Reviewing each document alone can prove its appendix is internally complete while missing that the
successor mutates or mis-grounds a prerequisite. This pass therefore treated the **48 projection
ids plus their cross-RFC inputs as one graph**.

## Mechanical closure checks

- Tactical Appendix A contains **30 ids / 30 unique**; Breadth contains **18 / 18 unique**.
- Every appendix role now belongs to the shipped closed `ProjectionRole` union:
  `predicate | reading | event | source_record` (`packages/runtime/src/evidence-contract.ts:2`).
- Both RFCs claim `none`; their changes remain additive runtime projections, with no pack/run/schema,
  migration, evidence-kind or content claim.
- Every Breadth reference to capture, pawn contact, passed-pawn, piece-count, open/half-open-file,
  occupied-defence, legal-exchange, reply breadth and check resolves either at HEAD or in the
  declared Wave-A dependency.
- The production-site censuses cover the required runtime/catalogue/adapters/docs path; no server
  transport edit is required for the already-retained Maia candidate WDL.

## Blocking findings and amendments

### D824 — “consequence” was not a manifest role

The tactical prose coined a useful semantic category, then Appendix A placed it in the role column
for threat, fork-survives-reply and mate-in-one. The runtime cannot compile that value. More subtly,
the catalogue helper defaults an omitted role to `reading`, so implementation could have compiled
while silently choosing inconsistent semantics.

The amendment keeps *consequence* as prose vocabulary and assigns literal roles:

| id | role | negative/empty behavior |
|---|---|---|
| threat | `reading` | empty threat list; `pass_while_in_check` is the only abstention |
| reply breadth | `event` | exact list/count; zero means terminal |
| fork survives reply | `predicate` | `{ matched: false, refutingReplies }`; a refutation is not abstention |
| mate in one | `reading` | exact list; empty means none |

Signs, forms and answer ceilings are pinned for these ids, and every Appendix-A role is now a
literal runtime member.

### D825 — recorded salience was attributed to local rules

`createdByLastMove` and `attackerJustMoved` were operands on the local
`rules.tactic.consequence.threat@1` projection. They can only be computed by joining exact threat
identity with `run.record.move`; the declaration named neither that input nor `recorded_run`
grounding. This was the same two-authorities defect F1 exists to prevent, inside a new payload.

The amendment removes both operands and their fixture from Wave A. The exact threat projection
lands as D815's input. A later `derived.*` salience projection may join history only after tactical
landing and D815's measurement; the first F8 stack excludes it meanwhile.

### D826 — Breadth attempted to mutate Wave A castling

Breadth called “castling to more shelter” an operand on Wave A's castling event. Wave A closes that
event to color/side/cause and requires existing declarations to remain byte-identical. The
successor therefore could not satisfy both its sentence and the prerequisite's A12.

The amendment makes shelter change a later derived/module join over the immutable castling event
and Breadth's before/after shelter set. No 19th projection is invented merely to preserve a measured
headline. The king-state event is explicitly convention-grounded; its set deltas are exact bytes,
not an exactness upgrade.

## Review disposition

The three blockers are repaired in the drafts and recorded as D824–D826. No owner/product choice
was made: each correction follows the shipped evidence type/provenance contract and the RFCs' own
no-redefinition rule.

The tactical RFC was authored by Claude and has now received a separate Codex buildability pass; it
is technically ready for the owner/Claude acceptance action if the amendments are endorsed. The
breadth RFC was authored by Codex, so this same-agent pass cannot honestly satisfy its requested
**independent** acceptance review. Its exact cross-review brief is small:

1. verify the 18 ids and literal roles;
2. trace every dependency to HEAD or one of Wave A's 30 ids;
3. attack the six conventions' boundary fixtures;
4. verify no Breadth statement mutates a Wave-A declaration;
5. verify B5 permits honest population zeroes while canonical fixtures remain non-vacuous.

No implementation is authorized by this report. On acceptance, Wave A implements first; Breadth
may prepare tests/planning but lands only after Wave A supplies the two declared prerequisites.
