# Adaptive Guidance implementation log

Append-only.

## 2026-08-14 — Codex implementation review

Approved after four factual corrections caused by the preceding Shape Library lifecycle:
storage/pack/test baselines, the now-shipped position player, technique-entry absence, and one
duplicated boundary row. The closed route allowlist and closed error-code/status mapping remain
explicit implementation seams. No redesign or new authored vocabulary is required.

## 2026-08-14 — Runtime projections

Implemented the pinned phase bands, shared assistance permission table, four marker kinds,
material-census endgame reading, backward-only recorded-eval pivot, and evidence-packet voice
check. Tests include both declared counter-intuitive phase fixtures, abstention skipping,
irreversibility, sustained-vs-one-check option collapse, persisted human-model divergence,
the exact census, and the known voice-check leak as a passing fixture. No derived value is
persisted.

## 2026-08-14 — Server seams

Human-common selections now request MultiPV 8 as a report while still selecting the engine's
`bestmove`; the tagged Maia test requires massed candidates. Added the disclosure-window and
role-gated human-split endpoint, typed `ASSISTANCE_WITHHELD` / `VOICE_UNAVAILABLE` mappings,
an injected vendor-neutral voice provider with one retry and deterministic fallback, and the
`none | external` capability seam. The typed browser API mirrors both endpoints. Tests cover
withheld → revealed → re-closed delivery and the provider-invention fallback.

## 2026-08-14 — Client composition

The run screen now labels detected and pack-authored phases separately, stores a silent-by-
default assistance configuration per session kind, and renders pivotal markers as passive
timeline dots that open only on request. The opened panel composes deterministic marker,
endgame-census, optional shape, human-split, and external-voice layers without promoting any
of them to run truth. Unit coverage pins the preference and off/passive behaviour. The browser
scenario starts from a developed queens-on position, performs a forced queen exchange across
the phase band, verifies nothing auto-opens, checks the rendered grounding vocabulary, and
proves switching markers off removes the dots.

## 2026-08-14 — Acceptance and measured envelope

The combined `classifyPhase` + `pivotalMarkers` + `endgameReading` instrument traversed all
16 Pack B spine-prefix runs and one synthetic 60-ply Just Play path over 20 samples on this
Apple Silicon development host: median **5.361 ms**, maximum **11.46 ms**. These are recorded
observations, not a unit-test threshold; the test asserts only a non-vacuous workload and
finite measurements. Focused runtime/server/client tests and the queen-exchange browser
scenario passed. The optional tagged Maia check remains outside `make verify` by policy.

## 2026-08-14 — Browser seam before closeout

The first full browser gate found that the new Assistance control was absolutely positioned
against the viewport and sat underneath the shell's account controls: it existed in the DOM but
could not be clicked. It now belongs to the drill top-bar action region, with only its opened
menu positioned relative to that control. The acceptance fixture also removed a blocking pawn
from its scripted queen-exchange file; the corrected legal `Qxd8+ Kxd8` path now crosses the
phase band and passes at zero retries. This was a real cross-layer layout defect, not hidden by
forcing the click.
