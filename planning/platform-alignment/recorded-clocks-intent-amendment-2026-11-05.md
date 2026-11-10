# Proposed intent amendment — recorded historical clocks

Owner/claude-on-owner-ruling applies intent changes. This proposal reports the implementation;
it does not edit protected design or decide timed campaign rules.

File: `design/06-campaign.md`, §1, exact sentence:

> What does **not** exist: any server-held notion of an earned inventory
> (`AssistanceConfig` lives in browser localStorage keyed by session kind, so it
> cannot hold something earned), any rewind budget or refusal path, and any time
> control at all (`clockState` is an untyped passthrough nothing reads, and
> `clock_zeroed` is the *halfmove* clock — a fifty-move-rule counter, not a clock).

The clause “any time control at all” is now too broad. Imported games retain a closed parsed
declared control and exact numeric original postmove clock samples. The original source/factory,
imported actor occurrence, authenticated historical API, strict receiver and selected-move Review
readout are implemented locally. Remaining time is explicitly after the move; clock use is safe
arithmetic over the adjacent same-side sample or a proved Standard initial base and the declared
postmove increment. Missing, invalid and unknown historical data remain distinct.

Suggested replacement for the **time-control clause only**:

> Server-enforced live clocks and timed campaign rules remain separate work. Imported games now
> retain declared time controls and recorded postmove clock readings for historical Review; these
> do not enforce expiry, price rewinds, measure thought or establish learner clock habits.
> `clock_zeroed` remains the fifty-move-rule counter, and raw `Node.clockState` is not clock evidence.

The rest of the original sentence requires its existing inventory/rewind owners' reconciliation;
this clock change makes no claim about those clauses. Native viewport/release proof remains
pending under D3928. Source correctness is not external clock authentication or whole1.0 completion.

Evidence: `rfc/recorded-clocks.md` §6/dischargeD2;
`planning/time-controls/implementation-2026-11-05.md`;
`apps/server/src/recorded-clock-delivery.test.ts`;
`apps/web/src/lib/recorded-clock-readout.test.ts`; actual App callback in
`apps/web/src/lib/app-shell.test.ts`. Final delivery gates are recorded in the existing time plan.
