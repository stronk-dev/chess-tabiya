# Human Position Arena

## Concept

Match two players from a curated starting position rather than move one.

This is not merely a novelty blitz queue. It is a sparring protocol.

## Recommended match format

### Two-leg match

```text
Game 1: A has White, B has Black
Game 2: colors swapped, same root
```

Use the same time control and, where practical, the same pack objective.

After both games:

- compare the first divergence;
- compare plans and timing;
- inspect objective state changes;
- allow each player to fork one position and replay against a bot or each other;
- discuss before turning on deep engine analysis.

## Why a human adds value

- coherent plans and adaptation;
- genuine pressure and uncertainty;
- rating-level mistakes that may not match Maia's distribution;
- post-game discussion;
- exposure to an idea the pack author did not script.

## Why feedback still matters

Without a review layer, fixed-position games are useful reps but can reinforce bad conclusions. The arena should therefore sit on the same branch/evidence runtime as bot drills.

## Matchmaking difficulties

- sparse queue by rating, pack and time control;
- color/position imbalance;
- disconnects and second-leg abandonment;
- cheating and engine use;
- rating design;
- moderation;
- position leakage and pre-study;
- clocks and server authority.

## First implementation

Do not build native matchmaking first.

Start with:

- generated Lichess custom-position challenge links;
- private club cohorts;
- scheduled pack nights;
- invitation links containing pack/version and root FEN;
- imported PGNs returned to the drill lab for comparison.

Chess From Position already demonstrates launching Lichess challenges from a generated position. That lowers the proof cost.

## Rating

Use a separate training rating, if any. A fixed position can favor one side and users may know the pack. Ordinary chess rating is inappropriate.

Possible metrics:

- two-leg match score;
- objective achievement by side;
- performance relative to cohort in the same pack;
- branch quality after review;
- no global Elo until there is sufficient position calibration.

## Later formats

- asynchronous correspondence from a position;
- team analysis relay;
- coach-hosted arenas;
- “best defence” ladder;
- simultaneous branch tournament where all players start from the same root;
- hidden-objective games where each side receives a distinct plan.

Human sparring is valuable, but it is a phase-two product after the solo drill loop works.
