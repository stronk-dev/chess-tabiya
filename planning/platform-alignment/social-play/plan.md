# R17 human play and social events — boundary plan

**Opened:** 2026-08-21  
**Authority:** platform-alignment R17; disposable research only  
**Status:** mechanical/code/desk arms answered 2026-08-21; owner-use integration remains

## Question

Which human-play and event responsibilities belong in Tabiya 1.0, which should be delegated to a
chess-network adapter, and what identity must survive the round trip so play always returns to
Review, rehearsal and the personal observation ledger?

This pass may measure and prototype a contract. It may not implement an adapter, promise fair
play, add public matchmaking, or infer O12's product choice.

## Population

- the shipped native friend match and two-leg Position Arena;
- current invitation, imported-leg, run, result and progress records;
- clocks, resign/draw/rematch, public discovery, reporting/blocking and event state;
- Lichess's official challenge, Board, seek, game-export and bulk-pairing API contracts as of
  2026-08-21;
- a minimal external-play envelope and local bot-event envelope.

## Checks

1. Produce a capability matrix across native play, the current external handoff and the official
   Lichess API: arbitrary FEN, clock, result, rematch, public opponent discovery, fair-play venue,
   moderation, persistent provider/game identity, automatic result return, Review/rehearsal
   continuity, bot policy identity and event/tournament identity.
2. Trace every current Arena field through invitation, import, run and learner progress. Report a
   string URL or PGN as transport, not identity.
3. Prototype one round-trip envelope that preserves source run/node/pack, provider challenge/game,
   clock/rated state, imported run/branch and result without granting the provider chess authority.
4. Prototype one local bot-event envelope that records event, entrant policy/version, child game
   and Review target. Treat a leaderboard as observation of results, never a skill grade.
5. Cost three choices separately: native full platform, adapter-first hybrid, and explicit external
   handoff. Include deployment operations, OAuth/token custody, rate limiting, moderation and
   provider-off behavior.
6. Separate private casual play, public/rated play and local bot events. One working match route
   does not establish the other two.

## Falsifiers and negative controls

- an opaque HTTPS challenge URL with no provider or challenge/game ID is not an adapter;
- a manually pasted PGN with no source link does not close the learning round trip;
- an untimed private match cannot be labelled rated, clocked or fair-play protected;
- a tournament that does not persist every child game and Review/re-entry target is a disconnected
  feature;
- a bot event without exact policy IDs and versions is not reproducible;
- external play must remain optional, and provider failure must preserve native rehearsal/history;
- an imported game may report provider analysis only as attributed imported data, never as Tabiya's
  own judgment.

## Exit

R17's mechanical/code/desk arms complete when the current-state matrix and both identity envelopes
are reproducible, every missing edge has a ledger owner, official provider capabilities are cited,
and O12 receives a bounded native/adapter/defer choice with explicit fair-play and federation
boundaries.
