# R15/R16 professional workflows — current conformance plan

**Opened:** 2026-08-21  
**Authority:** platform-alignment R15/R16; disposable research only  
**Status:** mechanical/code/desk arms answered 2026-08-21; owner-use quality remains

## Question

What minimum coach and streamer workflows are actually composed from the shared run/evidence
system today, which accepted contracts already own the missing pieces, and where can role/default
composition leak or silently suppress assistance?

This pass does not redesign `teacher-surface`, create product code or claim participant
comprehension. D649 leaves owner use and descopes recruited participant work.

## Population

- live kinds `stream`, `academy`, `match`;
- roles solo, host, participant and spectator;
- feedback delivery closed/open;
- the overlay and live-detail projections;
- assistance preference profiles and permission ceilings;
- accepted `teacher-surface` async assignment/submission contract.

## Checks

1. Produce the full kind × role × disclosure assistance matrix.
2. Verify each live kind maps to an explicit preference profile; collapsing a kind to a generic
   run profile is reported, never interpreted as an intentional default.
3. Verify overlay content is a projection of shared run/session state and contains no separate
   evidence/engine query path.
4. Verify vote option cardinality and adapter-attribution requirements at service and UI.
5. Inventory adapter, moderation and editorial-delay capabilities separately from the two-second
   polling transport.
6. Distinguish synchronous academy observation from the accepted async classroom aggregate.
7. Compare current planning blockers to D649 and the accepted RFC. A later queue may amend an
   accepted RFC but cannot pretend its owner ruling never happened.

## Falsifiers

- spectator or participant receives a broader assistance ceiling than host/solo;
- overlay reads an evidence/provider endpoint unavailable in the shared run projection;
- match seats receive different assistance solely because one player owns the host role;
- an external chat identity is shown without adapter qualification;
- Academy has no independent preference identity;
- planning blocks an accepted owner-ruled RFC solely on an external arm D649 removed.

## Exit

R15/R16's mechanical/code arms complete when the matrix and ownership reconciliation are
reproducible, every unsafe/absent edge has a ledger owner, and O11 receives a bounded workflow
choice rather than an invitation to redesign live sessions.

## 2026-08-30 closure refresh

The August 29 Live finishing pass invalidated several original absences, so the 1.0 journeys were
re-joined at current HEAD in `design/research/professional-workflow-1.0-closure.md` rather than
reusing the 2026-08-21 matrix as current product truth.

The refreshed result returns `casting.md` without discarding its liveness work. Five joins remain:
[[D2261]] live-followed casting versus ordinary Stream rehearsal; [[D2262]] streamer privacy;
[[D2263]] Review Submission context; [[D2264]] bounded co-teacher session authority; and [[D2265]]
scheduled-session admission. Existing rows retain Academy compiler/defaults, live-vote delay,
source liveness and provider bridge. O11 is now the only author decision needed before drafting the
successor composition contract; institution-managed minors and academy CRM remain separately
scoped roadmap decisions [[D1844]]/[[D1845]].

Reproduce with `make professional-closure-audit`.
