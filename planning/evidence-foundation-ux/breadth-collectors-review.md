# Breadth collectors — independent buildability review

**Date:** 2026-08-22  
**Input:** `rfc/breadth-collectors.md`, current F1/F2/Wave-A runtime declarations, and the
completed Phase-2b harnesses named by the RFC  
**Outcome:** **returned for author amendment**; no implementation is authorized

## What passed

- Appendix A is closed at 18 unique projection ids and every declared role belongs to the shipped
  `ProjectionRole` union.
- The landing is correctly silent: no module, preset, workflow, pack vocabulary, schema or content
  mutation is required.
- The detector/significance split is preserved. Low or population-sensitive lift remains an
  inspector/research disposition rather than becoming a universal hint rank.
- The dependency direction is right: Wave B consumes Wave A legal exchange/reply breadth and
  existing capture, check, castling and structural authorities rather than adding another engine or
  grading path.
- Canonical-fixture non-vacuity is separated from honest population zeroes.

Those properties make the RFC the right-sized second foundation wave. They do not make every
projection executable from its declared bytes.

## Blocking findings

### R1 / D851 — legal control is not pinned on all-square topology

The RFC requires pseudo and legal controller identities "for every square"
(`breadth-collectors.md` §3.1). Legal move generation is not itself a definition of legal control:
it omits pawn attacks on empty squares and attacks on friendly-occupied squares. A hypothetical
occupant, remove-own-occupant, or king-exposure filter gives different sets. The absolute-pin
fixture distinguishes only one boundary. The amendment must pin empty, friendly-occupied,
enemy-occupied, pawn and king cases and say exactly when a per-color turn clone abstains.

### R2 / D852 — exact defender loss cannot consume shipped `occupied_defence`

The research harness retains individual `defender→target` edges. At HEAD,
`transitionSemanticFacts()` emits `occupied_defence` only when the target crosses between zero and
at least one defender (`packages/runtime/src/transition.ts`:292–299). Losing one defender while a
second remains emits nothing. The RFC's new all-square controller delta can carry the exact edge;
the derived projection must consume that authority. If the author deliberately narrows to
last-defender loss, B6 must reproduce that narrower domain and re-evaluate its disposition instead
of quoting D754's broader 4.50×/6.52× result.

### R3 / D853 — contact execution names the wrong contact authority

The shipped `pawn_contact` fact is a creation event: before no contact, after contact
(`transition.ts`:344–348). `contact_executed` means a pawn captured an enemy pawn it attacked before
moving. Its necessary input is this RFC's before-position `rules.pawn.reading.contacts@1`, joined to
the exact capture and move, not the creation event. The dependency and derivation-input list must be
corrected.

### R4 / D854 — sequence horizon and payload shape are undercounted

`created_survived_reply` spans two edges; `created_executed_next_own_move` and the defender
consequence span three. Three edges contain three move anchors and four ordered board states. The
RFC says "all three source nodes" and B8 says "all three nodes," so it cannot specify both kinds or
prove path continuity. The amendment must pin a per-kind horizon, ordered anchors/FENs, shared-node
equality, and exact subject keys. Swapping any intermediate board state or tracked identity must
fail.

### R5 / D855 — `pressure-line@1` is weaker than its measured harness

The D723 harness requires a slider whose enemy screen is the only blocker to an enemy rook/queen,
with the screen lower-valued than the target. The retreat fixture then retains the same slider
color/role across its from/to squares and the exact same screen and target. The RFC omits those
color and retention constraints, allowing materially different relations to compile under the same
versioned convention. Transcribe the tested predicate and its changed-slider/screen/target
negatives.

### R6 / D856–D857 — pawn conventions are not fully transcribed

`contacts@1` names directly locked pairs, protection and connected passers without their literal
square predicates. The measured connected-passer convention deliberately permits unrestricted
rank distance, a limitation that must ship with the declaration. `candidate-majority@1` also
compresses the harness's rank arithmetic into "beside/behind": the tested rule includes same-rank
and any less-advanced adjacent-file friendly pawn, counts enemy adjacent-file pawns only when
strictly ahead, and excludes the subject pawn. These are version bytes, not implementation detail.

### R7 / D858 — captured-zone-defender needs the displaced capture square

The shared capture event retains `from`, `to`, captured color/role and `enPassant`, but not the
captured square (`transition.ts`:340–342). For en passant, `to` is not that square. The RFC must
either declare exact move-derived captured-square arithmetic or amend the shared capture contract
through its owner; otherwise the join can silently miss or misidentify a captured pawn that was a
zone defender.

### R8 / D859 — half-open occupancy has no color join

`half_open_file` is color-relative. The D723 harness classifies the file relative to the moved
rook/queen's color. The RFC says only that the moved heavy piece occupies "a" half-open file, and
does not distinguish a moved-piece occupancy event from a class change under a stationary heavy
piece. Both choices change the payload and fixtures; pin the measured one.

## Required author amendment

One amendment can close the return without a product ruling:

1. make the nine predicates above literal in §2/§3;
2. replace the two incorrect dependency lists (`defender_exposure`, `contact_executed`);
3. give every retained-sequence kind an ordered, horizon-typed payload;
4. add the named hard negatives and extend B2/B3/B4/B8 to cover them;
5. re-run or explicitly domain-correct any quoted measurement whose predicate changed.

After amendment, the independent reviewer should re-check the exact source bytes, not only the id
names. Acceptance remains an owner/Claude action under RFC-0000. Wave-A implementation may continue
within its accepted boundary; Wave B stays blocked until this review is discharged.
