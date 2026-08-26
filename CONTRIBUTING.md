# Contributing to Tabiya

Tabiya is evidence-first and contract-driven. Small fixes should stay small; product behavior is
implemented only after its question is settled and its RFC is accepted. This guide is the human
entry point. `AGENTS.md` contains the complete repository laws and remains authoritative.

## Start here

1. Read `README.md` for the product and current status.
2. Read `docs/architecture.md` for system boundaries.
3. Read `docs/features.md` to find the capability that owns the change.
4. Read `docs/extending.md` for the relevant extension recipe.
5. Read `rfc/0000-rfc-process.md` before changing product behavior, a schema or persistence.

## Classify the change before editing

```text
Is it a documentation correction with no product claim?
  -> update docs and their index; run the documentation check.

Is it a defect against an already accepted and implemented contract?
  -> add/update a BACKLOG row, repair the smallest owned surface, test it, update docs.

Is it a new product idea or a change of product meaning?
  -> BACKLOG row first; research/gate work; owner/design ruling; accepted RFC; implementation.

Is it a disposable experiment?
  -> tie it to an exploration question, mark it disposable, land evidence in design/research,
     update the coverage matrix/gates, and append the exploration log.

Does it change authored content?
  -> follow the content workflow and current Gate-F restrictions; close out the content ledger/log
     in the same change set.
```

Never infer implementation authority from a roadmap row, a draft RFC, a test harness or an existing
unused type. The current RFC state is in `rfc/README.md`.

## Repository workflow

1. **Register the work.** Every new idea or discovered defect gets a `design/BACKLOG.md` row when it
   is first stated. Reuse an existing row when it already owns the same issue.
2. **Find the capability owner.** Use `docs/features.md` and `planning/roadmap-1.0.json`.
3. **Confirm authority.** Product implementation needs an accepted RFC unless it is a narrow defect
   repair against an existing contract. Open research questions cannot be bypassed by code.
4. **Make the smallest coherent change.** Keep runtime, schema, server, client, content and tooling
   responsibilities in their documented layers.
5. **Verify at the right boundary.** A unit test proves a unit; a direct REST test does not prove
   application reach; a browser fixture does not prove a release image.
6. **Close out every tier touched.** Update implemented docs, the ledger, the appropriate append-only
   log and any RFC/archive/register state required by RFC-0000.

## Protected and immutable material

- `archive/` is immutable. Supersede it in living tiers; never edit it.
- `design/00` through `design/06` are owner intent. Non-owner implementers propose amendments under
  `planning/platform-alignment/`; they do not edit those files directly.
- `design/BACKLOG.md` is a shared ledger and should be updated by every tier.
- `planning/**/log.md` files are append-only.

If an implementation makes an intent sentence false, include a proposed intent amendment naming the
file, exact sentence and new truth. Do not silently leave the contradiction behind.

## Verification

Use the narrowest useful command while developing, then the applicable aggregate gate.

| Change | Minimum useful checks |
|---|---|
| Documentation/index only | `make docs-check` |
| TypeScript runtime/server/web | Relevant test file, then `make verify-software` |
| Real committed content | Relevant authoring check, then `make verify-content` |
| RFC/register/roadmap/process | Relevant targeted checker, then `make verify-governance` |
| Route or complete learner journey | `make test-browser-smoke`, `test-browser-content` or `test-browser-matrix` as applicable |
| Release/package behavior | The named release or packaging proof; ordinary unit tests are insufficient |
| Full local gate | `make verify` and, when the UI changed, `make test-browser` |

See `docs/testing.md` for what each tier proves and deliberately does not prove.

## Documentation expectations

- Update `docs/` when implemented behavior changes.
- Update `docs/features.md` only when capability ownership or scope changes; do not paste live counts
  into it.
- Keep every `docs/*.md` file linked from `docs/README.md`; `make docs-check` enforces this.
- Link to the authoritative roadmap receipt for live status rather than maintaining a second rollup.
- Distinguish implemented behavior, accepted-but-unbuilt contracts and future intent.

## Shared worktree and commits

Other contributors or agents may have visible changes in the same worktree. Preserve them. Stage an
explicit owned-file list, inspect `git diff --cached --name-only`, and never use `git add .`,
`git add -A` or `git commit -a`. Commit at a natural checkpoint when requested; never push, publish,
deploy or open a pull request without explicit owner authorization.

## Useful references

- `docs/README.md` — complete implemented-document index.
- `docs/development.md` — toolchain and commands.
- `docs/extending.md` — file placement and integration checklists.
- `design/research/README.md` — evidence labels and citation rules.
- `rfc/0000-rfc-process.md` — research/RFC/implementation lifecycle.
- `planning/roadmap-to-done.md` — current path to a full 1.0.
