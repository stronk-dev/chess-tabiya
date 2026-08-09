# Drill mode contracts

## Line Drill

**Input:** opening pack, side, target difficulty, optional repertoire.  
**Output:** accepted structure, theory/idea score, transition checkpoint, branch graph.

Required behaviors:

- corpus/pack-weighted opponent moves;
- transposition recognition;
- mandatory and accepted-alternative nodes;
- theory boundary;
- continuation into characteristic middlegame;
- optional first-plan fork.

## Plan Drill

**Input:** reviewed root, narrow objective, opponent policy, stop conditions.  
**Output:** at least one played branch, objective state, comparison-ready evidence.

Required behaviors:

- delayed feedback;
- 8–20-ply segment by default;
- semantic checkpoint;
- branch fork and alternate plan;
- synchronized comparison;
- same-root/new-defense replay.

## Outcome Drill

**Input:** root, objective type, truth source, defender profile.  
**Output:** result, state transitions, practical metrics, replay options.

Required behaviors:

- play to result or triviality;
- WDL-preserving grading;
- exact and human-level opponent options;
- mirror/opposite-side/related-position replay;
- transition provenance when reached from another mode.

## Trajectory Drill

**Input:** trajectory graph with phase transitions.  
**Output:** one or more phase runs linked by provenance.

Required behaviors:

- no arbitrary stitching;
- organic or guided mode;
- ability to stop after any phase;
- branch can alter later transition;
- endgame objective derived from branch state.
