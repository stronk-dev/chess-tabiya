# Engineering epics and tickets

## E1 — Chess and branch core

- E1.1 legal board adapter;
- E1.2 complete state serialization;
- E1.3 immutable node store;
- E1.4 rewind/fork commands;
- E1.5 PGN variation export;
- E1.6 graph property tests.

## E2 — Pack system

- E2.1 JSON Schema loader;
- E2.2 pack version/digest;
- E2.3 checkpoint evaluator;
- E2.4 objective state machine;
- E2.5 pack regression CLI.

## E3 — Engines

- E3.1 generic UCI process wrapper;
- E3.2 Stockfish worker and cache;
- E3.3 Maia worker and settings;
- E3.4 cancellation after rewind;
- E3.5 opponent policy broker;
- E3.6 deterministic seed replay.

## E4 — Drill UI

- E4.1 active board and objective;
- E4.2 branch rail;
- E4.3 timeline/checkpoints;
- E4.4 dual-board compare;
- E4.5 keyboard controls;
- E4.6 loading/error states.

## E5 — Feedback

- E5.1 evidence packet;
- E5.2 objective comparison;
- E5.3 engine trajectory chart data;
- E5.4 structural/timing event renderer;
- E5.5 authored claim mapping;
- E5.6 uncertainty labels.

## E6 — Outcome drill

- E6.1 Syzygy adapter;
- E6.2 WDL-preserving grading;
- E6.3 triviality rules;
- E6.4 mirror/opposite-side variants;
- E6.5 practical resistance policy.

## E7 — Opening continuation

- E7.1 theory graph;
- E7.2 transposition mapping;
- E7.3 required/accepted/off-objective classification;
- E7.4 theory boundary;
- E7.5 transition to Plan Drill.
