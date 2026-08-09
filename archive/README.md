# archive/ — frozen inputs

Everything under this directory is **byte-frozen**. Nothing here is ever edited. When a
frozen document is wrong or outdated, its living successor in `design/`, `rfc/`, or
`planning/` supersedes it and cites it — the original stays as evidence of what we knew
and when.

## Contents

### `brief-v2/` — Chess Phase Drill Lab brief, v2

The complete exploratory brief package that seeded this repo (59 files, research
cut-off 2026-08-08). Numbered concept docs `00`–`15`, ADR/RFC decision sketches,
JSON schemas, implementation specs, desk research (28-product competitor matrix,
source index R01–R45), and agent handoff docs.

Notes for readers:

- `MASTER_BRIEF.md` is a mechanical concatenation of the numbered files with no unique
  content. Always cite the numbered files (`brief-v2/05_MIDDLEGAME_DRILLS.md`), never
  the concatenation.
- The `adrs/` and `rfcs/` sketches predate all validation. They are design-tier idea
  sketches, not accepted decisions or specs — see `rfc/README.md` at the repo root.
- The `research/` material is desk research (product pages, forums, papers), not
  hands-on evaluation. Treat its claims as `[P]` provenance per
  `design/research/README.md`; `brief-v2/research/research_limitations.md` is the
  package's own honest accounting of this.

## Integrity

Verify the freeze at any time:

```sh
cd archive/brief-v2 && shasum -a 256 -c checksums.sha256
```

Verification record:

| Date | Result |
|---|---|
| 2026-08-09 | 58/58 OK, 0 failures (verified at import, commit 1 of this repo) |
