# Campaign core — fourth fresh independent buildability review

- **Date:** 2026-09-04
- **Artifact:** `rfc/campaign-core.md` after the [[D2420]]–[[D2427]] fourth author repair
- **Verdict:** return to author on [[D2620]]–[[D2624]]
- **Executable review:** `make campaign-two-horizon-fourth-fresh-review` — 5/5
- **Retained author controls:** 34 original/third-repair checks + 9 fourth-repair checks, plus both strict TypeScript projects
- **Production authorization:** none

## What survives

This return does not reopen the Campaign product choices. The fixed three-act foundation, path
choice, play-not-win progression, earned campaign-only rewinds, separate module/theory/resource
families, boss suppression, prestige-only winning gate, exact historical inventory cut, complete
foundation route/UX journey and the explicit full-1.0 successor set remain sound directions. The
fourth repair also genuinely closes its earlier SQLite active-run race and account-versus-appliance
lifecycle errors.

## Return findings

1. **[[D2620]] — the charge ledger has no command identity at the operation that spends it.** The
   contract requires `charge_spent` to carry a play-run mutation command and commit atomically with
   rewind, fork, group creation or simulation entry. None of the four live REST/client/service
   operations accepts a command id, expected campaign revision or campaign result envelope. After
   response loss the same gesture can mutate and spend again; the asynchronous group arm also has
   no stored result to replay after provider settlement. Define one cross-aggregate command image
   and exercise same-command replay, different-command concurrency, provider failure and stale
   campaign revision.
2. **[[D2621]] — valid receipts for another subject authorize Campaign theory.** The repaired model
   checks passage id and two Booleans, but never compares `applicability.packDigest` to the pinned
   encounter pack and carries no workflow context/disclosure ceiling/event-head identity. The
   executable negative supplies a different-pack applicability receipt and a more-permissive
   disclosure receipt; the passage is still `authorized`. Bind and assert the exact pack, node,
   context, event cut and source identities.
3. **[[D2622]] — the SQL duplicates ownership without equality constraints.** A creation receipt
   for Alice/campaign A/version 9 may reference Bob's campaign run; an award row may grant Alice a
   reward from Bob's run; and two active campaigns may point at the same play run. All insert with
   foreign keys enabled. The owned-reward and charge-lookup projections trust those columns.
   Introduce one composite run authority (or derive the duplicates), unique/FK active encounter
   identity and crossed-restore/reconciliation negatives.
4. **[[D2623]] — a replayable row is not a semantic campaign event.**
   `parseCampaignEventRow` accepts an empty `node_committed` payload and validates no event-specific
   result. Its outer freeze retains caller-owned nested payload objects, so a resource reward can
   change after admission. Parse every closed event/result member, canonicalize and recursively
   seal it, then cross missing/extra/wrong-kind and post-parse mutation cases.
5. **[[D2624]] — the official-curriculum model proves a much smaller object than criterion 30.**
   It has no CampaignDocument node set, target learner, time envelope, evidence refs, dependency
   action/fallback/source availability or review receipt. It accepts caller-supplied facts without
   one-fact-per-document-node identity; the negative gives one node conflicting opening/endgame
   facts and the generated metadata validates. Compile from the parsed pinned document plus sealed
   registries and implement every negative criterion 30 names.

## Why the retained green controls are insufficient

The author model proves the intended happy path locally. It does not join charged commands to the
four production request shapes, bind otherwise-valid evidence receipts to their subject, enforce
cross-table relational ownership, parse event discriminants recursively or model the complete
official publication object. Each fresh arm crosses one of those boundaries directly and will
invert only when the corresponding authority exists.

## Required next pass

Repair these five seams as one bounded Campaign-foundation amendment. Do not add campaign schema,
migrations, endpoints, client routes or official content while the RFC is returned. After both
maintained targets pass, request another independent review; implementation also remains ordered
behind the named returned dependencies.
