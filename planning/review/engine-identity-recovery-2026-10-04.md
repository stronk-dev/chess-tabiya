# Review engine identity recovery

D3372 repairs the actual Review coordinator under `rfc/review-evidence-compiler.md` §4.1
and the configured-versus-temporarily-unavailable ruling D1077. It does not complete Review
coverage, the provider foundation or a 1.0 capability.

## Production failure and repair

The previous coordinator retained its first engine lookup promise for the whole application
lifetime. A rejected lookup became null, and every later window reused that failure. Its
transient state map reported provider_off although a scheduler was configured; read-only
observation lost the failure and reported not_yet_scheduled. A successful lookup also prevented
new branches from discovering a subsequently changed engine version.

The coordinator now shares only a pending lookup, catching both synchronous and asynchronous
failures. Configured discovery failure remains provider_failed in the tracked branch's read-only
state. A later authorized ensure may discover the recovered engine. No provider attempt starts
during failed discovery, and no existing failure/exhaustion record is reset. Successful windows
still use only the shared scheduler, normal source admission and durable evidence attachment.
Fully delivered or terminal branches do no new discovery or provider work. An unconfigured
scheduler remains provider_off and never calls discovery.

## Verification

`make review-evidence-runtime-check` passes 33 tests across the server and runtime Review files,
including six new controls. Recovery from null, rejection and synchronous throw reaches the
production RunService import/Story paths, the actual shared scheduler/parser and SQLite evidence
log. The controls prove complete recovered node coverage, exactly one durable attachment per
node, unchanged unrelated terminal attempt history and no extra work on repeated settled reads.
Additional controls cover concurrent identity lookup, read-only observation, changed successful
engine identity with unchanged prior deliveries, and true provider-off configuration. The three
initial recovery controls failed against the old coordinator. Typecheck has zero errors and
Svelte warnings. Complete software, content, browser and governance results follow below.

These are labelled mock-engine contract tests, not human-likeness or real-engine performance
measurements. No chess collector, sampling policy, schema, authored content or capability meaning
is changed. No protected intent sentence is altered or newly falsified.

## Separate open foundation defect

D3371 records a distinct measured defect. In `evidence-catalog.ts`, both live Review transition
declarations contain one eval_point input; in `evidence-factories.ts`, both factories accept and
retain ordered before/after points. Review §3 already requires two points. The strict execution
compiler therefore reports only one endpoint's provider occurrence for either transition.
The versioned declaration/consumer repair remains blocked on the Review RFC's author lane;
frozen capability meanings must not be overwritten and retired Story mate-to-cp conversion must
not be revived. D3363's Inspector distribution and D3370's sampled Maia source are separate.

The ledger, work-state, queue, RFC/register, docs and anchored roadmap are updated in the same
checkpoint. Complete RFC discharges and milestone states remain unchanged; nothing is pushed.

## Exact source and compatibility checks

`make staged-software-contracts` passes against exact index tree
`35f03263fa33d1194553432bd6f58bcfdb19a85b`: 2,861 tests/325 files, seven isolated performance
tests/four files, warning-free typechecking and downstream build, packaging, release-policy,
value-authority, source/history, lifecycle and migration checks. Proof:
`engine-identity-recovery-software-2026-10-04.json`. Production and test bytes are frozen after
that snapshot; only final tracking/results/proof/log text follows.

All 874 capability declarations remain current and retained; no metadata restamp is needed.
Semantic validation remains 38/38 cases and zero fully passed profiles, not independent semantic
validation completion. The 352-document migration plan has zero rows and ledger restamps.
Content checks pass 223 tests/23 files, zero clearance errors and 104 exact requirement documents.
Provider checks pass 365 test executions, with the separate Review target's 33 executions also
passing. Complete governance passes. These local gates are not a claim about a published release
or a new GitHub run.

## Completed browser and closeout gates

`make test-browser-ci` passes 111 journeys: 56 ordinary, five content, 49 viewport/input matrix
and one packaged journey. The optional real-Maia latency measurement is skipped; no retry is used.
The actual Review/import/Analyze/retry/Compare, registered-bot reload and Campaign boss journeys
pass, alongside the board matrix. This is regression coverage, not proof that every 1.0 feature
or owner-use discharge is complete.

Only D3372 closes. D3371 remains assigned and blocked on versioned declaration repair. The
tracker has zero untriaged items; RFC and milestone states are unchanged. Final staged-process
checks and normal commit hooks run before commit. Unrelated shared edits remain excluded;
no worktree, push, publication, archive change or protected-intent edit is made.
