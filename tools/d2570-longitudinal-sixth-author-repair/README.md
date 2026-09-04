# Longitudinal-store sixth author repair

Disposable author contract for [[D2570]]–[[D2574]]. It supersedes the four boundaries returned by
the fifth fresh review and adds the legacy-attribution truth the repair requires. It does not add a
production migration, worker, reader, consumer, API or client.

Run:

```sh
make longitudinal-store-sixth-author-repair
```

The contract proves:

- same-head collaboration mutations taint structure attribution monotonically, change the source
  digest and invalidate a completed job in the same modeled transition;
- pre-migration runs are honest `unattributable_legacy`, while new private runs begin
  `single_player`;
- the three public row families have exact parsed types and no `unknown[]` escape;
- revision-1 imported mainline rows are always observed-only without inventing the future D2
  subject fields; and
- one branded query parser closes empty, duplicate, unknown and contradictory filter inputs.

This is author evidence only. A genuinely fresh independent review still gates implementation.
