# AssistanceConfig register — third-return author repair

Date: 2026-08-30

This receipt repairs the two blockers from the fresh independent review without implementing C9
or changing product assistance bytes.

## D2037 — committed transition is now executable

- The governance checkout is an explicit implementation-owned file and must use `fetch-depth: 2`.
- Production resolves the exact first parent with `git rev-parse --verify HEAD^1`.
- A required-but-unavailable parent is fatal. The committed arm cannot degrade to a skip.
- Fixture repositories provide explicit prior/current snapshots; they do not depend on ambient Git
  history.

## D2038 — assistance authority is now closed

The transition derives its source-token delta from three roots rather than accepting a caller's
projection:

1. changed `AssistanceConfig` properties in runtime `assistance.ts`;
2. the transitive declaration closure of runtime `parseAssistanceConfig`;
3. the transitive import/declaration closure of web `loadAssistance`, the sole production reader of
   the `tabiya.assistance.` persistence namespace.

The Guided Hint v5 claim therefore names four exact tokens: the two runtime fields, the runtime
codec and the web persistence root. A local/direct/indirect `validV5`, a second namespace reader or
a parallel migration authority changes the generated census and cannot be omitted by a caller.
Unrelated production changes and unimported dead helpers do not create false claim obligations.

## Able-to-fail author contract

`make assistance-register-final-review` now runs six author arms covering checkout depth,
implementation boundary, exact claim population, closed source roots, omitted parallel authority
and unrelated-source non-interference. Fresh independent review remains required before acceptance
or implementation.
