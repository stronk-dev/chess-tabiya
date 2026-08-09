# Endgame drills: outcomes, not answer keys

## Product principle

The endgame module should take the central idea of Chess Endgame Training seriously:

> set up a meaningful ending and make the player finish or save it.

The product advantage should come from speed, UX, practical opponent selection, branch persistence, varied repetition and integration with earlier phases.

## Outcome Drill types

### Convert

Start winning. Finish the game or reach a certified trivial win.

### Hold

Start drawn. Preserve the draw against strong or perfect resistance.

### Save

Start worse or losing against a realistic opponent. Create practical chances and exploit mistakes.

### Resist

The position may remain objectively lost. Maximize difficulty, reach counterplay checkpoints, and avoid immediate collapse.

### Technique sprint

Repeat a theoretical procedure several times with mirrored boards, changed pawn files, side-to-move changes or different defensive choices.

## Grading hierarchy

### Tablebase positions

For supported piece counts, use Syzygy WDL/DTZ as exact truth.

Do not require shortest mate unless the pack explicitly teaches speed. Grade primarily:

- did win remain win;
- did draw remain draw;
- did the player reach the intended technique;
- did the 50-move-rule state matter;
- how many opportunities were given back.

### Larger endgames

Use Stockfish WDL/evaluation plus pack-defined thresholds and structural checkpoints.

A winning player may use a slower plan without being failed. A defender may be rewarded for creating practical problems even if perfect play still loses.

## Opponent choices

### Perfect defender

Use tablebase or strong Stockfish. Best for theoretical certainty.

### Human-level defender

Use Maia/corpus-guided candidates with an objective-preservation guard. Best for practical conversion.

### Annoying defender

Among moves that preserve the theoretical state, prefer moves that maximize choice complexity, checks, counterplay or common human difficulty.

### Fallible attacker

For save-the-game training, the opponent should be strong enough to press but human enough to release the advantage.

## Repetition design

The endgame module should offer four distinct replay buttons:

- **same position, new defense**;
- **mirror and replay**;
- **same technique, new position**;
- **play the other side**.

That is more educational than a generic “try again.”

## Triviality and finish rules

Do not waste time forcing routine moves after the lesson is complete.

A pack may define triviality by:

- tablebase state and distance threshold;
- material and known mating procedure;
- forced promotion without counterplay;
- Stockfish WDL plus no meaningful defensive resources;
- author-defined target position.

The user can always choose “play to mate.”

## Endgames arising from branches

When a middlegame branch simplifies, the system should preserve provenance:

```text
this ending arose from Branch B
critical exchange: move 24
starting evaluation: +1.2
objective now: convert
```

After the run, the user can jump back to the exchange decision and try to avoid or seek the ending.

This closes the loop between strategic choice and technique.

## Practical metrics

- conversion rate;
- hold rate;
- save rate against target opponent level;
- number of W/D/L state changes;
- time or plies to reach triviality;
- king activation timing;
- rook activity checkpoints;
- passed-pawn creation and blockade;
- repeated failure concept;
- performance on a related position after a delay.

## UX bar

The user's complaint about the existing trainer matters. The new implementation should target:

- instant board initialization;
- opponent response perceived as immediate;
- one-click replay;
- no page reload between positions;
- keyboard-first branch/restart controls;
- cached tablebase queries;
- no blocking engine analysis in the main interaction loop;
- clear goal and clear outcome.
