# Feedback-delivery Stage 1 harness — DISPOSABLE

Research tooling under `rfc/0000-rfc-process.md` §Exploration gate. It exercises the shipped
run, pack-orchestration, authored-feedback, and comparison projections; it is not production code
and is not part of `make verify`.

It records the Stage 1 starting admission split, conservatively measures C1 reach by replaying all
learner-controllable authored branches while driving single-choice opponent plies through persisted
opponent selections, and measures CR1 at 2, 4, and 8 branches.

The D645 lifecycle arm separately replays every authored leaf and fails if an absorbing objective
transition hides authored descendants. Its generated report is refreshed with
`UPDATE_OBJECTIVE_LIFECYCLE=1`.

Run side-effect-free:

```sh
./node_modules/.bin/vitest run --config tools/feedback-delivery-harness/vitest.config.ts
```

Refresh the committed report explicitly:

```sh
UPDATE_FEEDBACK_DELIVERY=1 ./node_modules/.bin/vitest run --config tools/feedback-delivery-harness/vitest.config.ts
```
