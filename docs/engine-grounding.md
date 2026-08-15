# Engine grounding for authored openings

Opening claims cannot be settled by a tablebase. Tabiya therefore treats a fixed-depth engine result as a named, reproducible measurement: it makes the root assessment falsifiable at a stated cost, but it is not a proof and does not ground strategic prose, plan labels, annotations, or deviation classes.

An engine-grounded root declares `objective.grading.assessedBy.kind: "engine"` with a White-perspective centipawn or mate score, depth, engine identity, source identity, and retrieval time. Admission requires exactly one matching root `engine_eval` record plus a manifest-linked engine origin agreeing on FEN, depth, engine version, and MultiPV 1. Duplicate or inconsistent records remain unverified.

`make verify-draft FILE=<pack.json>` dispatches by assessment kind. The engine path evaluates the root, every authored spine result, and every authored deviation result at the fixed authoring profile. It sends `ucinewgame` and clears the hash before every search, emits position records into flat sibling sidecars, and preserves unrelated evidence already attached to the pack. Re-running with a different root score or engine identity refuses the declaration rather than silently updating its chess claim.

For exploration before a declaration exists, run:

```sh
make engine-walk FILE=content/drafts/<pack>.json
```

The walker emits a `tabiya.sourcing.walk.v1` report with `subject.instrument: "engine"`. It never edits the pack or writes admission sidecars. `ENUMERATE=all` is refused because exhaustively analyzing legal moves at the authoring depth is a different job, not a larger setting for this one.

Engine evidence may support literal engine measurements and the closed `engine-move-loss/v1` sentence template. It may not support human-only judgments such as deviation class, `offObjective`, difficulty, or checkpoint labels. Published strong evidence labels require a matching record. Learners see the engine name/version, depth, score, date, and the explicit sentence “This is a fixed-depth measurement, not a proof.”

Corpus evidence can coexist in the same flat ledger. Explorer attachment and draft verification merge by record identity; neither tool is allowed to erase evidence produced by the other.
