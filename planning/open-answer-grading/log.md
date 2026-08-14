# Open-answer grading log

## 2026-08-14 — Codex review and implementation start

The accepted mechanism survives the post-wave tree: the one-segment routes fit `parseRunRoute`, migration 17 can stamp frozen literals `0.11` → `0.12`, the event admits replay integrity checks, authored key points can remain outside the public pack projection, and transcript retention requires no table.

One integration contradiction was corrected before code: `#forWrite` permits a participant who currently holds the lease, so “writer-leased” cannot also mean “participants cannot record.” The implementation follows the shipped rule: the active writer may submit reasoning; spectators cannot. This is required for coached participants to use the interaction.

Current implementation baselines are pack schema 0.14, run schema 0.11, storage 16, 453 tests across 75 files, and 22 zero-retry browser tests (plus the optional Maia case). Older baselines and pre-wave “today” statements in the RFC are historical drafting context.

## 2026-08-14 — Segment-end wire boundary

Implementation exposed a contract seam the draft missed: a persisted `reasoning.recorded` event contains detection ids/statuses, while the client consumes full event-sourced mutation snapshots. Redacting that event creates an unreplayable public snapshot; returning it leaks the detection before `segment_end` opens. The bounded v1 resolution is to admit a stated-reasoning interaction under `segment_end` only when validation can statically prove that checkpoint ends an existing segment. Dynamic or first-checkpoint occurrences fail `REASONING_SEGMENT_END_UNPROVEN`. Delayed-checkpoint packs are unaffected. The HTTP projection still redacts detections defensively if invalid/legacy bytes ever reach it, and an adversarial wire test pins the absence.

The RFC's browser criterion also simultaneously mandates an honesty sentence containing “wrong” and forbids the word “wrong” anywhere in that surface. The implementation preserves the mandated honesty sentence; forbidden-verdict assertions apply to the remaining verdict/content region rather than failing on the disclosure itself.

## 2026-08-14 — Exercising verification

The full unit gate is green at 458 tests across 77 files. New coverage pins SAN/UCI and literal matching, Unicode normalization, word boundaries, occurrence and span integrity, atomic record/skip/refusal behavior, the migration-17 path, and the static `segment_end` admission rule. The browser walkthrough found that the first sheet implementation fetched no reasoning projection on a later checkpoint occurrence and displayed the previous attempt only after submission. The controller now refreshes reasoning on capture/resume, and the previous transcript is visible beside the new form before recording.

The browser gate was temporarily unable to start because a concurrently authored on-ramp draft contained an illegal `Qh5` deviation after `Nf3`, where the knight blocks the queen's path. Only that invalid deviation was removed; no replacement chess judgment was invented. The stated-reasoning browser scenario then passed at zero retries.
