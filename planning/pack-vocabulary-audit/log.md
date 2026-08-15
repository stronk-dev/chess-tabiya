# Pack vocabulary integrity audit log

Append-only.

## 2026-08-15 — audit opened (codex)

- Treated the work as an evidence instrument, not a design pass.
- Current-tree census already differs from the handoff baseline: 41 draft packs (not 35), 23 shape entries, 42 unique schema `const` strings (not 38), and 12 objective types (not 8). The audit will report the live tree and preserve the stale baseline as a finding.
- No RFC, design, or authored content is in scope for edits.

## 2026-08-15 — census correction (codex)

- The initial 41-pack count conflated 35 authored packs with six `*.browser.json` acceptance fixtures in the same directory. The requested 35-pack corpus is correct; fixture coverage is reported separately.
- The schema counts remain a real live-tree correction: 42 unique `const` strings and 12 objective types.

## 2026-08-15 — audit complete (codex)

- Audited 35 authored packs, six browser fixtures, 23 shape entries, 42 schema const literals, 12 objective types, 34 authored success conditions, 89 structural expressions, and 78 fixed refusal codes.
- Found no remaining constant authored condition: 27 positional conditions varied and all seven event conditions fired on authored-spine replay. Kept 16 expressions with no positive catalogue/synthetic witness explicitly separate from proven deadness.
- Generalized D32: validation compiles five of twelve objective types, while play compiles every active non-trajectory objective and each active trajectory leg. Seven objective types can therefore admit a structural condition that later throws.
- Confirmed D29 and added two latent integrity findings: non-integer material equality is globally impossible despite schema admission, and `winner` is accepted but ignored for stalemate.
- Made no runtime, RFC, design, or authored-content changes. Ranked the evidence for the four in-flight RFCs in `report.md`.
- `ENGINES_REQUIRED=1 make verify` passed: 474 tests across 80 files; Svelte 0 errors/0 warnings; scaffold and packaging OK.
- `make test-browser` passed at zero retries: 24 passed, one optional Maia test skipped.
