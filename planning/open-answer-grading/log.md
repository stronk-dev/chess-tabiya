# Open-answer grading log

## 2026-08-14 — Codex review and implementation start

The accepted mechanism survives the post-wave tree: the one-segment routes fit `parseRunRoute`, migration 17 can stamp frozen literals `0.11` → `0.12`, the event admits replay integrity checks, authored key points can remain outside the public pack projection, and transcript retention requires no table.

One integration contradiction was corrected before code: `#forWrite` permits a participant who currently holds the lease, so “writer-leased” cannot also mean “participants cannot record.” The implementation follows the shipped rule: the active writer may submit reasoning; spectators cannot. This is required for coached participants to use the interaction.

Current implementation baselines are pack schema 0.14, run schema 0.11, storage 16, 453 tests across 75 files, and 22 zero-retry browser tests (plus the optional Maia case). Older baselines and pre-wave “today” statements in the RFC are historical drafting context.
