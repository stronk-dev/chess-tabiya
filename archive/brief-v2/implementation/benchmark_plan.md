# Benchmark plan

## Hardware record

Capture CPU, RAM, GPU, storage, OS, engine/model versions and worker counts.

## Maia benchmarks

For 5M/23M/79M where available:

- cold startup;
- warm median/p95 move latency;
- memory;
- throughput at 1/2/4 concurrent sessions;
- MultiPV latency;
- 100 sampled 20-ply games for coherence review.

## Stockfish benchmarks

- 1/2/4 threads;
- fixed nodes versus fixed time;
- MultiPV 1/3/5;
- median/p95 interactive latency;
- deep queue throughput;
- tablebase probe latency.

## UX benchmarks

- pack open;
- branch switch;
- rewind;
- compare render;
- same-root replay;
- endgame reset.

## Product comparison benchmark

Run the same five tasks in:

- Chess Endgame Training;
- Noctie;
- Chess.com Practice;
- Chessable bot-from-position;
- Chess From Position/Lichess;
- prototype.

Record clicks, latency, whether a branch is preserved, feedback timing and whether the whole task can be completed without external tools.
