# Board annotation

Learners can draw circles and arrows on the main drill board. These marks are the learner's own thought, not product-generated assistance: they do not enter the run event log, grading, evidence packets, or disclosure policy.

Marks use the four colours that round-trip through PGN `%csl` and `%cal` comments. The board does not snap an arrow to a legal move or erase marks when a movable piece is clicked.

Each mark has one of two scopes:

- **Position** (default) uses the node's transposition key. It returns on rewind and appears at the same position on another branch.
- **Line** uses the active branch and node. It clears on a fork and can be moved to position scope, or back, as one atomic operation.

The server stores marks in `run_marks`, separately from `DrillRun`. Reads and writes are principal-scoped: anyone allowed to read a run may maintain their own marks, but cannot read or mutate another learner's private set.

PGN export includes only the requester's marks and always states the filter with `TabiyaMarks: own (N); other authors' marks are not exported`. It never reveals how many marks another author has.

In a live session, a mark is relayed only when its author held the board lease when it was written and the session is not a match. Relay is shared across viewers and attributed to the author. Match-seat and spectator sketches remain private.

Limits are 64 shapes at one scope key and 1,000 marks per learner per run. Deleting a learner deletes their marks; deleting a run cascades them.
