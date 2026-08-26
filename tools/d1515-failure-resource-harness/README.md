# D1515 failure-resource harness

Disposable exploration instrument for campaign research R12. It does not implement a campaign
mechanic and does not choose tuning constants. It exhaustively runs every achieved/failed pattern
over the accepted three-act, three-node campaign shape through four candidate state machines and
reports structural properties that do not require a human-subject claim:

- whether a failed verdict itself debits a resource;
- whether one failure can terminate the educational path;
- whether an Act-I failure changes Act-III capacity;
- whether recovery depends on winning;
- whether the candidate introduces a second numeric currency; and
- whether every failed seal produces either a spend or a visible carried consequence.

The fixed strategies are deliberately conservative and are controls, not recommendations:

- direct global HP and direct act HP automatically debit on failure;
- shared-charge resistance spends the already-ruled earned-rewind balance after a failure;
- inventory exhaustion asks the learner which acquired module to exhaust until the next act,
  carrying a named constraint when no module is available.

Run with Node 24:

```sh
/opt/homebrew/opt/node@24/bin/node --test tools/d1515-failure-resource-harness/model.test.mjs
/opt/homebrew/opt/node@24/bin/node tools/d1515-failure-resource-harness/model.mjs
```

The output is a finite-state comparison over 512 outcome sequences. It says nothing about felt
punishment, usefulness or preferred tuning; those remain an owner-use question.
