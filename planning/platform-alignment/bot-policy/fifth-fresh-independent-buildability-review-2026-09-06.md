# Bot policy — fifth fresh independent buildability review

- **Date:** 2026-09-06
- **Reviewer:** codex, independent of the fourth author repair
- **Input:** `rfc/bot-policy.md` and `tools/d1970-bot-policy-author-repair/contract.ts` after the
  D2407–D2411 repair
- **Verdict:** **RETURNED on [[D3025]]–[[D3032]]; no catalog, schema, migration, route, roster,
  client, tournament or production bot implementation is authorized**
- **Executable reproduction:** `make bot-policy-fifth-fresh-review` — 8/8 fresh groups plus the
  retained 31+6 author controls and TypeScript checkpoints

## What survived

The fourth repair does invert the five controls it names. Tempered masses are normalized before the
top-p cut; acquisition clocks are excluded from the deterministic image while the complete delivery
remains beside it; individual stale fields fail unless their hashes are also changed; provider-health
types are imported rather than copied locally; and an unrelated exact cache remains conditional.

Those are real repairs. They do not yet establish the authority chain claimed by the RFC. Fresh
tests applied the checkpoint to complete structural substitutions, coordinated durable rewrites,
duplicate provider populations and the repository compiler dialect. All eight controls reproduce.

## Blocking findings

### [[D3025]] — profile identity does not bind profile semantics

`compileBotPolicyExecution` resolves the supplied id but compares only the resolved digest to the
digest string retained on the supplied object. It never compares the supplied family, band, model,
sampler or ordered layers with the resolved catalog member. `deriveBotSourceView` then branches on
that caller-supplied family.

The executable control keeps the genuine `human-baseline.1400@1` id and digest, changes the family
to `guarded-human`, supplies that family's layer list and compiles a contradictory guarded
execution. Catalog identity must be the value authority: consumers resolve the member and use it,
or assert complete value equality before any semantic branch.

### [[D3026]] — durable parsing validates a coordinated rewrite against itself

The new parser is stronger against a single changed field, but it does not reconstruct the
decision. It hashes the stored root, sources, layers, considered rows and chosen move exactly as
presented by the stored object. The test takes a valid envelope, gives a move excluded by normalized
top-p (`reconstructedMass: 0`) all final mass, selects it, recomputes the decision, commit and
operation hashes, and the parser accepts it.

The durable path must start from parsed storage-owned root/profile/provider authorities, execute or
assert the exact registered derivation, and compare the stored projection with that result. A
self-consistent attacker-authored projection is not replay authority.

### [[D3027]] — idempotent replay bypasses even the local durable parser

`beginBotOperation` accepts `previous` as a public argument and compares only its request id and
pre-provider digest. It does not call `parseBotPolicyEventEnvelope` or require a storage-issued
receipt. A prior envelope with a changed chosen move and stale hashes is correctly refused by the
parser and immediately returned by `beginBotOperation` as `replayed_idempotent`.

The operation must load the winner from its durable run/event authority and parse it before replay;
callers cannot supply the event being treated as historical truth.

### [[D3028]] — the request parser is not the closed request boundary

`parseBotOpponentPlyRequest` validates only the `botreq_` string and the JavaScript types of three
other fields. It accepts extra keys, empty node and branch ids, and a non-digest event head. The
control includes a forbidden caller FEN and still receives a valid request.

The route parser needs exact keys, non-empty bounded identities and the canonical SHA grammar before
the pre-provider digest is computed.

### [[D3029]] — duplicate Stockfish rows pass all-legal validation

The guard's `sameSet` helper discards duplicates. A sealed provider table containing every legal
move plus a duplicate first row therefore passes the all-legal test and reaches `guard: applied`;
the later `find` makes row order decide which score is used. A3 explicitly names duplicate rows as a
failure fixture. Validate unique set equality before deriving the reference or any candidate loss.

### [[D3030]] — persisted provider truth is a bot-local self-digest

`assertPersistedProviderInput` does not cross `assertProviderDelivery` or an operation-specific
durable provider parser. It checks the operation string, hashes the supplied delivery and checks two
digest-shaped strings. The control changes a cloned Maia acquisition's provider to Stockfish,
recomputes the bot-local delivery digest, and the persisted assertion accepts it while the shared
provider authority rejects it.

JSON persistence necessarily needs a durable reconstruction path rather than an in-memory WeakSet,
but that path belongs to the shared provider protocol and must parse the complete operation-specific
request, identity, receipt and payload. Bot policy cannot replace it with a local hash.

### [[D3031]] — availability trusts profile substitution and a superseded health model

`profileAvailability` branches on the supplied family without resolving the profile. Changing a
real guarded profile's family to `human-baseline` makes an otherwise missing Stockfish dependency
report generally available. The same source still imports the seventh provider-health repair even
though the eighth through eleventh repairs and the twelfth fresh return now supersede its authority.

Availability must consume one exact catalog member and the eventually accepted current
provider-health checkpoint. A passed historical repair is evidence, not a forever-live dependency.

### [[D3032]] — the author checkpoint compiles only under a private weaker dialect

The repository compiler contract enables `exactOptionalPropertyTypes`. The author checkpoint's
standalone `tsconfig.contract.json` does not extend it and silently omits that option. Compiling the
advertised contract under `tsconfig.base.json` produces TS2322 and TS2375 at the optional guard
score and optional feature-subset result. The fresh harness reproduces the exact diagnostics with
the TypeScript API and keeps its own runtime compile on the author dialect so this returned target
can stay green.

The repair must inherit the repository compiler options; ordinary governance cannot call a private
compiler result “strict” when product code is compiled under a stricter contract.

## Required next author round

One bounded repair must close the authority chain rather than add more one-field mutation tests:

1. resolve and retain exact catalog members at every compiler and availability consumer;
2. reconstruct durable decisions from parsed shared provider/root/profile authorities and compare
   the complete derived projection;
3. load/parse replay winners through the durable event authority, never a caller argument;
4. close the route request grammar;
5. make Stockfish rows uniquely set-equal before score derivation;
6. use the shared operation-specific durable provider parser/receipt;
7. rebase the health join on the eventual accepted current checkpoint; and
8. inherit `tsconfig.base.json` and repair all diagnostics.

Another genuinely fresh review remains mandatory. The 4×3 roster, calibration, Stage-B candidate
features, route source, UI cards, rematches, Review integration and bot tournaments remain separate
1.0 work and are not implied complete by this contract repair.
