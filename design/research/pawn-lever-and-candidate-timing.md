# Pawn lever and candidate-passer timing

**Question.** Which pawn-contact and candidate-passer events are exact, discriminating and stable,
and what observed timing—if any—supports words such as “lever,” “break” or “conversion plan”?

**Verdict.** `[V]` Status, action and consequence must remain separate. Creating a moved-pawn
contact is background; executing an existing pawn contact by capture is highly distinctive but does
not say the liquidation is favorable. A disclosed candidate-majority status is selective,
especially early, while advancing it weakens with horizon and immediate conversion is nearly absent.
No measured atom licenses “break now,” breakthrough, good timing or a plan.

## 1. The convention is versioned, not folklore

Historical Stockfish source called a non-passed pawn a candidate when it was free of a same-file
opposer and its neighboring friendly support count met or exceeded forward neighboring enemy
pawns, subject to isolated/backward exclusions
([Stockfish 2.1 pawn source](https://sources.debian.org/src/stockfish/2.1.1%2Bgit20111006-2/src/pawns.cpp/)).
`[V]` That is useful prior art for an arithmetic feature, not timeless chess truth and not a
current Stockfish output.

The disposable instrument therefore names its narrower rule `candidate-majority@1` and declares
the difference: non-passed; no enemy pawn ahead on the same file; at least one friendly pawn beside
or behind on an adjacent file; that support count is at least the enemy-pawn count ahead on adjacent
files. It deliberately omits Stockfish's separate backward-pawn classifier rather than silently
recreating an engine judgement. `[V]` (`tools/d788-pawn-timing-harness/`)

The other identities are literal:

- **lever created:** a non-capturing pawn move newly attacks an enemy pawn;
- **existing lever executed:** a pawn captures an enemy pawn it attacked before moving;
- **survives one reply / executes next own move:** the exact moved pawn is retained through the
  reply, then the contact persists or that pawn performs the capture.

## 2. One-edge measurement

| Exact event | Authored | Imported fixed sample | Full paths: early / middle / later |
|---|---:|---:|---:|
| existing pawn contact executed | **9.82×** | **15.07×** | **13.43× / 16.62× / 8.61×** |
| moved pawn gains `candidate-majority@1` | **2.80×** | **3.30×** | **7.60× / 3.87× / 1.73×** |
| candidate-majority pawn advances and remains candidate | 1.66× uncertain | 2.68× | 2.86× / 1.48× uncertain / 1.08× uncertain |
| non-capture creates a lever | 1.03× | 0.90× | 1.18× uncertain / 1.08× uncertain / **0.60×** |

`[V]` Full counts, rates, paired-bootstrap intervals and denominators are in
`tools/d788-pawn-timing-harness/output.md`. The populations are 717 authored decisions / 19,619
alternatives, 577 fixed imported decisions / 18,842 alternatives, and 6,942 full-path decisions
split into disclosed ply bands.

The strongest number is easy to misuse. “Executed an existing lever” is a typed pawn-capture join;
its legal-alternative baseline includes every non-pawn move. It earns exact capture/contact identity,
not praise, a default hint, or a second capture detector. Engine, tablebase, theory or authored
consequence must establish whether resolving that contact was good.

Candidate-majority gain is robust but strongly horizon-shaped. It can support a structure card or
theory breadcrumb with the exact supporting/blocking pawns. It does not imply that the candidate is
strong, should advance, or will become passed.

## 3. Observed timing does not establish a plan

Across 622 authored and 6,775 imported three-edge windows: `[V]`

| Retained sequence | Authored | Imported |
|---|---:|---:|
| created lever still exists after one reply | 11 | 125 |
| same pawn executes it on its next move | 1 | 45 |
| newly candidate pawn becomes passed on its next move | 0 | 1 |

These are occurrence counts, not choice-normalized lifts. They prove the exact identity can survive
and that canonical fixtures are available. They do not prove the opponent reply was forced, the
timing was favorable, or the first move intended the capture. Immediate candidate conversion is so
sparse that it cannot ground a general “create a passer” sequence module.

## 4. Product consequences

- **Board/touch:** show the exact pawn contact, supporting pawns and opposing blockers on request.
- **Post-commit:** lever creation alone remains silent by default. An executed contact may join a
  local-exchange, passed-pawn, structure or theory module.
- **Review/drills:** the 45 observed create→reply→execute examples seed disagreement fixtures, but
  an accepted collector must preserve identities and attach separate value/consequence authority.
- **Bots:** candidate and contact state may parameterize a declared pawn-trait policy. The policy
  owns the preference; the feature owns only geometry.
- **Player habits:** candidate/lever rates require eligible opportunities, phase and resulting
  action. Raw counts are position-selection artifacts.

“Pawn break,” minority attack, majority conversion, favorable liquidation, breakthrough and plan
language remain theory/authored/search-level claims. No authored pack was relabelled.
