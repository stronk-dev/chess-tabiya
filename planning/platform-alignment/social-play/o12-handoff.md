# O12 owner handoff — human play, adapters and bot events

**Status:** ready for owner ruling  
**Inputs:** R11, R15/R16, R17, R18/O13, D649

## Recommended ruling

1. **Hybrid 1.0.** Keep native private friend matches as casual learning sessions; add an optional
   generic chess-network adapter and use Lichess as the first implementation.
2. **Identity before convenience.** The adapter must persist source run/node/pack, provider,
   challenge ID, game ID, provider-accepted clock/rated state, returned run/branch and attributed
   result. A URL plus pasted PGN remains fallback transport, not a completed adapter.
3. **Provider-owned competition.** Public seeks/matchmaking, rated play, clocks, ratings and
   fair-play enforcement remain provider authority in 1.0. Native friend matches display that they
   are casual, untimed and unenforced.
4. **Learning round trip.** Authorized provider completion automatically imports into the source
   run and opens the same Review/retry/branch/drill/theory paths. Provider analysis is attributed
   input, never a Tabiya grade. Manual import survives provider-off.
5. **No native public pool or human tournament in 1.0.** Their operations, moderation, population
   and integrity costs are not disguised as frontend work. Federation remains R19/O14 and
   post-1.0.
6. **Admit a bounded local bot-event module after O8/F8.** Every entrant names an exact policy and
   version; every child game is an ordinary reviewable run. Standings are result arithmetic, not a
   rating or skill claim. No avatar-only personality tournament ships.
7. **Self-host boundary.** External play is optional. OAuth/token custody, revocation, provider
   health, rate limits and deletion enter the F12 platform contract; the core loop and native
   friend play require no hosted provider.

## Consequence of approval

O12 is answered. F11 may draft only the external-play envelope/adapter workflow, explicit native
casual labels and local bot-event composition above. Native ratings, public matchmaking, human
tournaments, anti-cheat and federation remain outside 1.0. The existing native match remains valid
and is not replaced by the adapter.

## What remains owner-use validation

Account-connection language, provider-off recovery, challenge/result-return legibility and whether
the bot event feels fun. Those checks may tune presentation; they cannot weaken identity,
attribution or fair-play boundaries.
