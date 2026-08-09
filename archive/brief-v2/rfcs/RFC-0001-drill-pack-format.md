# RFC-0001 — Drill Pack Format

## Status

Proposed.

## Problem

The application needs a versioned, engine-independent representation of a drill's learning intent, legal positions, opponent policy, checkpoints, feedback and transitions.

## Decision

Use JSON documents validated by `schemas/drill_pack.schema.json`.

## Core fields

- metadata and version;
- mode/phase;
- target difficulty;
- starting position and move history;
- objective contract;
- concepts and transfer cue;
- plan classes;
- checkpoints and stop conditions;
- opponent policy;
- accepted alternatives;
- feedback claims/evidence requirements;
- retry variants;
- trajectory transitions;
- provenance and review status.

## Non-goals

- encoding arbitrary natural-language courses;
- storing every engine line;
- defining engine implementation details;
- replacing PGN as an interchange format.

## Versioning

Semantic version each pack. A run records the exact pack digest. Breaking checkpoint/objective changes require a major version.
