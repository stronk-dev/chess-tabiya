# D2237 Stage-A bot-trait screen

Disposable research instrument for
`planning/bot-roster/d2237-stage-a-trait-screen-plan.md`.

- `make bot-trait-screen-contract` runs semantic and able-to-fail controls only.
- `make bot-trait-screen` builds the Maia image without starting persistent application services,
  builds the existing extract/probe programs, regenerates the exact fixed
  Maia/Stockfish/Explorer population in a temporary directory, runs the preregistered eight-arm
  screen, and writes aggregate results under `planning/bot-roster/`.

The raw engine capture is deleted after a successful or failed run. The aggregate result records
cryptographic input digests. This harness does not register production profiles and cannot establish
a personality or human-like claim.
