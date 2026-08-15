# Branch-set scale log

## 2026-08-15 — codex implementation

- Review approved: the accepted text contains the shortfall correction and learner-perspective tablebase conversion.
- Added a shared comparison cap, one-pass branch path index, pure decidedness projection, sequential tablebase classification, reversible local fold, stated truncation, and separate settled/hidden disclosures.
- No engine evaluation is enqueued by branch count. Undecided and unknown branches remain visible.
- The tablebase provider is injected into `RunService`; categories are converted from side-to-move before the runtime sees them.
