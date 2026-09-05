# Held promotion collectors — ninth fresh independent buildability review

- **Date:** 2026-09-05
- **Reviewed artifact:** eighth author repair for the two held §3.7 promotion projections
- **Gate:** `make semantic-collectors-promotion-ninth-fresh-review`
- **Verdict:** returned on [[D2748]], [[D2749]], [[D2750]], [[D2751]] and [[D2752]]; the twelve implemented projections remain unchanged

## Result

The eighth repair now models the total collector transaction and its retained chain behaves as
claimed. The remaining source boundary is not the durable sourcing-ledger authority named by the
RFC. `createSourcingLedgerTablebaseResultV1Evidence` accepts caller-provided JSON containing an
arbitrary source id, timestamp and tablebase value, then seals it as
`sourcing.ledger.tablebase_result@1`. It neither loads a ledger record nor joins the registered
source manifest, and its payload omits the real evidence record's `anchor`, `grounds` and
`supports`. The next constructor therefore validates evidence minted by the same caller rather
than evidence observed from durable storage ([[D2748]]).

Two total-result arms are also type declarations without authoritative construction paths. The
recorded lookup union advertises `failed/storage_unavailable|invalid_record`, but the only sealed
lookup factory can return only found or absent; a dependency that returns the declared failure is
rejected before collection ([[D2749]]). The legal-map union similarly advertises `unavailable`, but
the only sealed resolver always returns evidence and a structural total resolver is rejected
([[D2750]]). These are not optional edge cases: they are the operation's promised distinction
between absence, failure and input abstention.

Finally, tablebase exactness is not guarded on success. The live scheduler can return success for
an eight-piece request and the collector emits exact promotion/tablebase evidence because it checks
piece count only when the provider returns `outside_domain` ([[D2751]]). The caller-recorded route
can mint the same exact evidence for the same eight-piece position ([[D2752]]). Domain authority
must be derived from the request/source record before either success arm is accepted; a provider's
chosen result discriminator is not proof that Syzygy covers the position.

## Executable evidence

The maintained target runs every earlier promotion author/review target and strict TypeScript,
then passes 5/5 fresh behavioral controls. The controls cross raw caller JSON into the recorded
source, try both declared unavailable arms through the sealed dependency boundary, and drive both
live and recorded success with an eight-piece position whose promotion geometry is otherwise
valid.

No production collector, provider, packet, API, schema, content, archive or protected-design byte
changed. A bounded ninth author repair must consume an exact durable ledger/manifest authority,
make both total dependency arms constructible, and prove the same seven-piece domain for recorded
and live success. Another genuinely fresh review and the provider/value dependency landing still
precede implementation. The evidence spine remains 12/14.
