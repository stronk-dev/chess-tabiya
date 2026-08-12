# content-era — log (append-only)

## 2026-08-12 (claude, setup)

- Job opened after the owner's full-breadth content ruling
  (`design/04-content-architecture.md`). Codex's suggestion adopted: authoring
  cost is instrumented in six separate categories from the first minute, since
  one aggregate number cannot tell us what to fix.
- Second deliverable made explicit and equally weighted: batch 1 must yield the
  authoring contracts the four failed RFC attempts could not honestly define.
  A pack that produces content but no contract input has half-failed.
- Not started: no authoring yet.

## 2026-08-12 (claude) — cost-model correction before authoring starts

- Flagged before the first measurement, not after: the six-category model
  assumed a human author. Here the author is an agent and the reviewer is the
  owner, so `agent-*` and `owner-review` are logged as separate clocks and
  never merged. K10's verdict is on the pipeline total, and the load-bearing
  number is owner-review — tooling cannot reduce judgment time; only content
  reuse and better first drafts can.
- Division of labour set: claude authors (chess judgment), owner reviews,
  codex builds authoring tooling. Codex does not write chess content.

## 2026-08-12 (codex) — draft check and preview tooling

- Added `make pack-check FILE=<path>`. It validates the file against the
  living v0.2 schema, runs the shipped spine-legality and prediction-count
  lints, and rejects feedback/opponent policies or objective conditions that
  the current server cannot execute. Output is one human-readable line per
  issue with a JSON Pointer path; errors return a non-zero status while lint
  warnings remain visible and non-fatal.
- Added `make pack-preview FILE=<path>`. It checks and builds first, then starts
  the real app in development mode with the selected draft injected into the
  registry. The selected file is watched and restarts the app on change. A
  draft may replace an existing pack id in development, which makes editing
  the living example or a reviewed pack testable without copying it into the
  production registry.
- Added the committed `content/drafts/` author/reviewer workspace. Committing
  it keeps agent drafts and owner revisions reviewable as pipeline evidence.
  The registry reads it only in development, explicitly rejects
  `DRAFT_PACK_FILE` in production, and `.dockerignore` keeps the directory out
  of production image contexts.
- Exercised the actual command surface, not only unit helpers: the living
  Najdorf example passed `pack-check`; the illegal-spine fixture failed with
  `/spine/0/moveUci`; and a development preview served the selected pack from
  `GET /packs`. That preview run caught and fixed a bundle-relative schema-path
  defect before closeout.
- Tooling deliberately not built in this slice:
  - no visual/form pack editor or browser-side live linting — measured author
    friction must first show that the command loop is the bottleneck;
  - no PGN/FEN importer or spine generator — source-preparation cost has not
    yet been measured, and generating chess choices would cross into the
    author's judgment role;
  - no engine, Maia, corpus, or Syzygy authoring assistant — those belong to
    separate evidence passes and need Pack A's real workflow to define their
    useful contract;
  - no claim triggers, timing semantics, `provenanceMode`, or other authored
    vocabulary — the withdrawn RFCs and owner constraint require real content
    to produce those contracts rather than tooling inventing them;
  - no production upload/draft endpoint — drafts are intentionally a local,
    development-only surface, and a watched process restart is sufficient for
    the first measured loop.
- No Pack A cost-clock entry was recorded here. This was tooling work, not an
  agent authoring/research/encoding/revision pass, and Codex authored no chess
  content.
