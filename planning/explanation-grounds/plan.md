# Explanation Grounds — implementation plan

RFC: `rfc/explanation-grounds.md` (accepted 2026-08-11). Assignee: codex.
Breadth program #2, v1. `[x]` flips only with the exercising test.

Read the RFC's Motivation first: three prior drafts were withdrawn for
specifying things with no shipped backing. Everything here was verified against
real code. **Do not add authored claims, timing windows, provenanceMode,
feedback packets, or per-scope reveal** — all are content-era items.

## 1. Close the compare withholding hole (server)

- [ ] `RunService.compare` gains the pack lookup + `feedbackIsRevealed` gate
      that `evidence()` already applies
- [ ] Withheld: strip `engine:` refs from timeline entries, empty overlay;
      rules/pack refs are never withheld
- [ ] Gate test that FAILS against today's code (this is a real fix, not a
      no-op assertion)

## 2. Recorded-evidence overlay (runtime, amends branch-runtime)

- [ ] `BranchComparison.evidence` per side:
      `{nodeId, plyOffset, evidenceRefs, kind, source, score}`
- [ ] Assembled from `evidence.attached` events on each branch path, reusing
      compare.ts's existing path traversal — durable events only, never the queue
- [ ] `score` = `{kind:"cp", value} | {kind:"mate", movesTo}`, White's
      perspective; `mateIn` payload round-trip test
- [ ] Derivation test: queue drained, events remain → overlay still populated

## 3. Grounded rendering (client, amends drill-client)

- [ ] Timeline entries render `<from> → <to>` + refs via the EXISTING
      `renderEvidenceRef`/`evidenceSentenceTable` (add nothing to the table)
- [ ] Adopt throw-on-empty for empty evidenceRefs (no friendly marker — matches
      whyBanner and the schema's minItems: 1)
- [ ] Eval trajectory per side aligned on `plyOffset`, fork ply marked
- [ ] Playwright: grounded sentence + one overlay entry per side at the fork.
      NO delta assertion (mock executor returns constant 0)

## 4. Docs + closeout

- [ ] `docs/branch-runtime.md` — "engine scores are not part of the comparison
      payload" is now false
- [ ] `docs/drill-client.md` — withholding surfaces now include `/compare`
- [ ] ENGINES_REQUIRED=1 make verify + make test-browser green
