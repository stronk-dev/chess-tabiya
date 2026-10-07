# D3535 — durable training passes

Proposal for `rfc/pack-training-forms.md`, not an accepted storage or run-schema amendment.
The existing catalogue stage of D3318 can ship independently. This proposal does not
authorize the remaining mutation paths or settle the guided-pass ceiling ruling D3317.

## The actual missing contract

A set pass must remember **which attempts belong to this pass**, and a tempo cycle
must remember **which authored budget was applied**. These are ordinary session data,
not a new evidence producer, source-hash registry or proof-certificate system.

Current pack sessions identify only the pack and its digest in
`packages/runtime/src/session.ts` (`SessionSource`, `CreateRunSession`).
`apps/server/src/service.ts` (`CreateRunRequest`, pack creation) starts and orchestrates
the registered pack without a set occurrence. `apps/server/src/progress.ts` records
attempts by run and branch, not a training pass. `apps/server/src/pack-orchestrator.ts`
constructs timing predicates from the supplied pack's authored windows. The current
account inventory in `apps/server/src/account-data.ts` has no training-pass store.
These are inspected source boundaries, not findings from a hypothetical implementation.

## Proposed minimal model

- One learner-owned **training pass**, identifying the installed set, the authored
  cycle (or an ordinary pass), and its ordered members. Explicit repeat creates a
  new pass; it never resets or reuses the previous pass's results.
- One **member slot** per ordinal in that pass, linked to its exact play run and
  selected completed branch attempt. Do not scan all historical attempts for a
  matching pack ID. Retries in another pass cannot improve this pass's verdict.
- Keep the authored set/member revision needed to resume, and the applied cycle
  scale. The author amendment must specify whether snapshots or retained revisions
  supply those bytes. A digest alone is not a stored document, and substitution
  with today's changed member is not a resume.
- Apply `scaledLuxuryBudget` to execution windows only. Never modify an installed
  member document or its pack digest. One context resolver must feed start, commits,
  objective evaluation, rewind, branch replay and restored runs; applying the scale
  only on creation does not implement a tempo cycle.
- Store pass and member changes transactionally with creation/finalization of their
  play run. A repeated network command returns the same operation result; it cannot
  create another member attempt or advance another ordinal.

Two small relational stores may suffice: passes and their member slots. The amendment
must show the actual schema and transactions before claiming that they do; no campaign
event journal or independent progression engine is required by the training form.

## Learner workflow to implement

1. Learn shows the authored threshold, ordered members and any authored cycle before
   starting. Start opens the first member with the learner's existing help preference.
2. Finishing a member records that pass's exact attempt. Continue offers the next
   ordinal; it never makes a chess move or opens another exercise without a gesture.
3. Finalize the set only after the ordered pass has finished, including members outside
   an optional pass-mark subset. `open` is not a successful member verdict. The set
   result uses the existing `passed`/`reoffer` payload, without per-member points or a
   numeric aggregate grade.
4. A failed pass offers Repeat; direct member packs remain available. An authored tempo
   cycle offers the next authored scale, and the last cycle invents no further decay.
5. Reload and server restart restore the same pass, active member and scaled windows.
   Export includes owned pass/member history; account deletion removes it. Deleting
   a linked play run must not silently turn its member into a completed or replacement
   attempt. The amendment must choose and test its explicit unavailable/deleted state.

## Required review and production proof

The author must define the exact mutation/read payloads, revision-retention behavior,
branch-finalization rule, deletion behavior and run-context representation. Declare any
needed run-schema/migration claims in the existing register before assigning versions.
Existing accounts/runs need an explicit migration default of no training context; no
historical attempts are automatically adopted into a newly created pass.

Acceptance must exercise the actual application, storage and client: two separate passes
using the same member; retries and branch choice; concurrent/lost-response commands;
stable/unstable/open verdicts and an explicit subset; failed re-offer with direct access;
4-to-2 authored budget enforcement; rewind and restart with the same scaled window;
member revision change/withdrawal; zero cycle-created schedule rows; account export and
deletion; and fresh Learn-to-result journeys on desktop and phone. Unit arithmetic alone
cannot discharge D3318. Authored pilot sets remain the RFC's separate content obligation.
