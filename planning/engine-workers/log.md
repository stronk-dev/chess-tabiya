# engine-workers — log (append-only)

## 2026-08-12 (claude, setup)

- RFC accepted after adversarial review (EW-C1..C8 all resolved in-draft; no
  owner rulings needed — resolutions derived from standing rulings; see RFC
  blockers section + changelog).
- Key seams for implementers: selector never appends (writer does); run schema
  v0.3 adds evidence.attached (declared amendment of archived branch-runtime);
  theory_strict membership is by transposeKey.
- Next: codex session 1 → §1 schema v0.3 + §2 supervisor.

## 2026-08-12 (codex, §1 run schema v0.3)

- Amended the living run schema to v0.3 with `evidence.attached`; the archived
  branch-runtime RFC remains unchanged. The event requires a node id, at least one
  unique evidence reference, and a typed payload: `eval|wdl|bestline`,
  `engine_validated|human_model_predicted`, plus source-specific values.
- Runtime projection appends unique references to the named node without changing
  objective state. Tests cover node-local projection, preservation of the typed
  payload in the event log, unknown-node rejection, valid schema acceptance, and
  a checked-in negative fixture missing the required evidence source.
- Updated the schema constant, runtime build assertion, and canonical branch-runtime
  and development docs from v0.2 to v0.3. Focused schema/runtime tests green (18
  tests); full verification follows before the checkpoint commit.
- Checkpoint verification: `make verify` green (14 files, 73 tests, all
  typechecks and schema/scaffold verification); `git diff --check` clean.
