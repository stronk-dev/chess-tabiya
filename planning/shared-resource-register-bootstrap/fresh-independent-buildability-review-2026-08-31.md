# Shared-resource register bootstrap — fresh independent buildability review

- **Date:** 2026-08-31
- **Subject:** `rfc/shared-resource-register-bootstrap.md`
- **Verdict:** returned to author on D2381–D2384
- **Scope:** process/buildability only; no product or register implementation was attempted

## What survives

The two-step direction is right: a process change must make absence representable before a product
RFC can claim version 1. The release-manifest and concept-registry schemas are legitimate first
consumers, and product bytes must remain outside the bootstrap commit. Replacing duplicated name
and schema-slug authorities with one checked catalogue is also the correct repair class.

The draft is not buildable yet because four parts of that direction have no executable image.

## D2381 — the literal empty tables are parsed as data

The absent-root example contains `| — | — | ... |` under both `Landed` and `Live claims`.
`parseRegisterSections` filters only header keys (`version`, `member`, `migration`, and `claim`) at
`tools/register-check.mjs:318-323`. Therefore `—` becomes a landed version and a live claim owned
by RFC `—`; existing C3/C4 fail before any absent-root rule can run.

Repair: use header-only tables, or name one sentinel in the parser and test both tables. The first
is smaller and preserves “no landed row / no live claim” literally.

## D2382 — catalogue-derived names do not derive semantics

Deleting `RESOURCE_NAMES` and `SCHEMA_SLUGS` removes two lists, but the checker still selects
behavior by literal resource identity:

- schema grammar/output: `resource.endsWith("-schema")`;
- migration grammar, landed comparison, tree extraction and output: `resource === "migration"`;
- closed-vocabulary grammar, member projection and output: `resource === "evidence-kinds"`.

An arbitrary new `closed_vocabulary` row would therefore be treated as evidence kinds, because
the catalogue supplies no claim grammar, head projection, landing comparison or output mode.

Repair: make kind semantics explicit and closed. Either the catalogue carries a checked
`claimMode`/`headMode`, or `kind` maps to one generic implementation for schema, ordered migration
and member vocabulary. No branch may name `migration` or `evidence-kinds`; fixtures introduce a
second resource of every supported kind and prove it uses the same path.

## D2383 — the migration population is left for the implementer to invent

The only literal catalogue rows are the two new schema roots. The RFC says to migrate seven
current resources, but does not publish their exact rows or the syntax for:

- the migration's head plus ordered migration-list authority;
- the evidence-kind member authority;
- campaign schema's intentional `version authority = none`;
- the five existing schema file / `$id` / exported-version joins.

That is the document's main data structure, and one example kind cannot specify three kinds.

Repair: publish the complete nine-row catalogue as normative input, including the two absent roots,
and a negative fixture for each column of each kind. The implementation must be a transcription of
that table, not a discovery pass that chooses syntax while coding.

## D2384 — two commits and one-way history have no preimage authority

The draft requires two commits and forbids landed→absent, but every specified C0/C2/C4/C6 input is
the current README/tree. A final snapshot where the process RFC archives and a product RFC adds its
first claim in the same commit is indistinguishable from the required sequence. After a later
commit removes landed bytes and rewrites the register to absent, ordinary CI also sees only the
new snapshot. “Staged governance” is named, but no base image, CI parent, function or receipt is.

Repair the three transitions against exact preimages:

1. **introduce absent root:** base `HEAD` has the named process RFC active and accepted; staged
   index archives it as implemented and adds exactly its catalogue/register roots plus ledger/log;
2. **first claim:** base `HEAD` already contains the absent root and archived introducer, so the
   introducing commit cannot also carry the product claim;
3. **first landing / no regression:** base `HEAD` contains the unique first claim; staged index
   creates the complete landed image. Any base with a landed row forbids current `absent`.

Name the exported staged-check function and the CI-parent check (including merge-parent policy),
then fixture same-commit introduction+claim, partial landing and committed landed→absent.

## Required author response

The next author round must repair all four findings in the RFC and extend the author contract with
executable negative arms. Another independent review is required before acceptance. D2363 and
D2370 remain open; no product RFC may claim either root yet.
