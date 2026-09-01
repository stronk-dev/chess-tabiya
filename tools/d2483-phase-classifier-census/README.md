# D2483 phase-classifier census

Disposable Q4c research instrument. It compares the shipped deterministic phase reading with the
curated phase declared by each non-browser draft pack, at the root and across every legal authored
spine edge. It reports abstention, mismatch, label changes and two-edge reversals.

This is a consistency audit, not independent chess ground truth. A pack's declared phase is the
authoritative boundary for that curated pack, but it is not a reviewer-labelled position corpus and
cannot settle automatic phase accuracy in pack-less play.

Run the complete reproducible measurement with:

```sh
make phase-classifier-census
```

The result is written to `planning/phase-classifier-census/results.json`.
