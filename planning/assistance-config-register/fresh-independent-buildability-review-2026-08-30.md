# AssistanceConfig register — fresh independent buildability return

**Reviewed:** 2026-08-30

**Reviewer:** codex, fresh adversarial pass

**Document:** `rfc/assistance-config-register.md` after the D2009–D2012 author repair

**Verdict:** **RETURNED on two enforcement gaps ([[D2037]], [[D2038]]).** The repaired snapshot,
history and claimant-transition algebra survives. Its committed transition cannot run in current CI,
and its source-delta input is not complete enough to enforce the one-codec claim it promises.

**Executable reproduction:** `make assistance-register-final-review` — 4/4. The earlier author
contracts remain separate at `make assistance-register-contract` and
`make assistance-register-repeat-review`.

## Method

The pass traced C9.5/C9.6 through the actual governance workflow and compared the repaired author
transition's inputs with criterion 15's parallel-codec negative. It inspected the workflow checkout,
the existing committed-change reader's shallow-history behavior, the RFC implementation boundary,
and the exact D2009 author model.

## What survives

- `AssistanceConfig` remains a rule-7 shared sequential resource;
- current tree head/digest equality is unconditional, so a future claim cannot mask v4 drift;
- landed heads are a contiguous append-only history rather than one current row;
- a head advance consumes one exact prior claimant and appends one owner-bound row;
- the v5 claim correctly names runtime `parseAssistanceConfig`, never a desired `validV5`;
- the D1639-dependent product phase is now stated honestly;
- the process landing remains product-byte-free.

## 1. The required committed transition cannot run in CI ([[D2037]])

C9.5/C9.6 require the repository-governance job to compare the committed register with its first
parent. Every `actions/checkout@v7` in `.github/workflows/verify.yml` uses the default shallow
checkout and supplies no `fetch-depth`. The required parent is therefore not a guaranteed local Git
object.

This is not theoretical. `tools/status-parity.mjs` already requests `HEAD^`, catches any failure,
and silently omits the committed change set. A first-parent C9 implemented through the same shape
could report green while executing no committed arm—the exact false-green this process RFC exists to
prevent.

The repair is currently outside the RFC's buildable scope: §6 omits the workflow, while criterion 8
restricts the implementation diff to its listed process files. Add the governance workflow to the
file boundary, check out enough history for `HEAD^1`, name the exact parent command, and fail with a
typed governance error when the parent is required but unavailable. Include a shallow-repository
negative and a two-commit positive; do not catch parent absence as a fixture-root exception in the
real repository path.

## 2. The transition sees a projection, not the complete assistance authority ([[D2038]])

The repaired author model receives `changedSymbols` as an argument and compares it with the claim.
It never derives that set from a closed source/import inventory. The RFC says the transition reader
emits changed `AssistanceConfig` properties and “changed codec declarations,” but defines neither
which declarations are codec authorities nor how every persistence reader/writer is discovered.

Consequently the positive v5 transition still passes when a parallel
`apps/web/src/lib/validV5.ts#validV5` is added but the already-projected input contains only the three
claimed runtime tokens. Criterion 15 explicitly says a parallel web migration authority must fail;
the current mechanism has no observation with which to do so.

Publish one generated, set-equal authority census rooted at every production AssistanceConfig
persistence reader/writer and migration/parser import. The transition must derive changed authority
tokens from previous/current source trees, not accept a caller-complete list. A new reader, parser,
migrator or validator outside the sole runtime codec must either be in the exact prior claim or fail.
Cross a parallel web validator, an indirect import alias, a deleted old parser, an unrelated `.ts`
change and the valid runtime-only transition.

## Resume order

1. Define and execute the closed assistance codec/persistence authority census ([[D2038]]).
2. Add first-parent-capable governance checkout and fail-closed parent acquisition ([[D2037]]).
3. Replace the four reproduction arms with able-to-fail author contracts while retaining all prior
   D1916/D2009–D2012 controls.
4. Run the three assistance targets, governance and `make verify`, then request another fresh review.

No runtime, web, schema, storage, content, archive or protected design byte changed in this review.
