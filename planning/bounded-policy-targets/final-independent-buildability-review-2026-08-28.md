# Bounded-policy targets — final independent buildability review

**Reviewed:** 2026-08-28

**Reviewer:** codex

**Document:** `rfc/bounded-policy-targets.md` after the [[D1962]]–[[D1968]] author repair

**Verdict:** **RETURNED.** The local exact-target model remains useful and the previous semantic/type
repairs survive, but the background operation is not yet implementable against the actual F1
manifest and process-sealed inputs without inventing request identity, cancellation, execution
registration and failure behavior.

**Executable reproduction:** `make bounded-target-final-review` — 7/7. The author's
`make bounded-target-contract` remains green at 18/18 plus its crossed TypeScript controls.

## What survives

- one exported threat-pass anchor rather than a private chronology clone;
- no invented initial promotion provenance and no unreachable `target_captured` arm;
- one complete-set batch owning all targets and legal candidates before the 512-pair gate;
- fixed three/four-move return tuples and a discriminated existential/universal result;
- provider/policy/learner significance remain correctly outside this local collector;
- background execution remains warranted by the measured tails.

## Blockers

### 1. Shared work has no per-caller cancellation algebra ([[D1993]])

`submit(request, signal)` supplies one signal per caller, while exact duplicate requests share one
job. The RFC does not say whether one abort cancels every caller, only that waiter, or the underlying
job after the final waiter leaves. It also does not order deduplication against queue admission.

**Repair:** define waiter-local completion/cancellation, last-waiter job cancellation, dedup-before-
capacity ordering and cleanup. Cross two waiters with one abort, both aborting, late attachment and
an already-queued duplicate while capacity is full.

### 2. Request and result digests have no byte authority ([[D1994]])

`DeclaredEvidence` carries a process seal, producer/projection ids and payload, but no digest. The
RFC invokes an “exact duplicate request digest” and returns arbitrary `string[] inputDigests`
without defining canonical bytes, input ordering or a domain tag. Two implementations can disagree
on deduplication and audit identity while accepting the same sealed items.

**Repair:** publish one domain-separated request digest over canonical, sorted exact input
identities and a checked result projection. Reordering exchanges must preserve identity; any changed
sealed input must not.

### 3. The live manifest constructor forces the proposed producer to `sync` ([[D1995]])

The RFC's literal F1 image requires `local/background`. The sole production `producer()` helper in
`evidence-catalog.ts` derives latency from availability and maps every local producer to `sync`.
The author harness constructs neither the real producer nor this helper.

**Repair:** make latency an explicit checked producer argument, preserve current declarations, and
cross legal/illegal availability-latency combinations plus the exact compiled bounded-target row.

### 4. The producer-operation census named by acceptance does not exist ([[D1996]])

F1 has `EvidenceConsumerOperation` and a checked consumer-operation census. It has no corresponding
producer/service operation declaration. The RFC nevertheless requires its service and only callers
to appear in a “generated evidence-operation census,” with no type, registry or checker to build.

**Repair:** publish the producer-operation authority and bind the exact service symbol and allowed
caller class, or replace the criterion with an existing executable authority that proves reach.

### 5. `exchange_neutralized` contradicts the evaluator refusal ([[D1997]])

The measured D1023 algorithm decides `exchange_neutralized` by calling `legalExchangeForMove` on the
post-candidate position. The RFC's scope and Refusal 2 prohibit calling that evaluator or an
equivalent beside the retained inputs. The retained source exchange cannot determine whether the
changed position remains positive.

**Repair:** declare the post-candidate exchange evaluation as a versioned internal semantic
dependency of this derived producer without minting a second source item, and test its exact result;
or remove the cause. Retaining only the old exchange cannot implement it.

### 6. Service failures and construction defaults are open ([[D1998]])

The result algebra covers chess/admission abstentions but not a rejecting yield adapter, internal
traversal exception, seal assertion failure or invariant breach. No service-options type binds the
one/eight queue, 512 pairs, 25,000 nodes, 64-node yields or the actual production macrotask adapter.
The author cancellation control aborts inside its injected callback and therefore does not test an
independently scheduled event-loop abort.

**Repair:** publish exact return-versus-throw behavior, cleanup/no-publication guarantees and one
options/default constructor including a named Node-24 macrotask adapter. Cross a real timer abort and
every failure exit.

### 7. `visitedPositions` is not reproducible ([[D1999]])

Evidence caps at 25,000 and cancellation is promised at exactly 64 visited positions, yet the RFC
does not state whether root/candidate states, preparations, replies, terminal states,
transpositions, failed identity updates or replayed witnesses increment the counter. The research
harness has a private convention; it is not the production contract.

**Repair:** specify the counter transition at every traversal state/edge and carry it into the
production census. Cross terminal, identity-loss, cap-1/cap/cap+1, yield-63/64/65 and repeated-
position cases.

## Resume order

1. Define canonical request identity and waiter/job lifecycle ([[D1993]], [[D1994]]).
2. Add the real local/background manifest and producer-operation authorities ([[D1995]], [[D1996]]).
3. Reconcile the post-candidate exchange dependency ([[D1997]]).
4. Close service options/failures and the exact node counter ([[D1998]], [[D1999]]).
5. Re-run `make bounded-target-contract`, `make bounded-target-final-review`, the exhaustive census
   and full `make verify`; then request fresh independent review. No production code is authorised
   before that review.
