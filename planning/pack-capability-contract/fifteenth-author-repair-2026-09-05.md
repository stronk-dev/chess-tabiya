# Pack capability contract — fifteenth author repair

Date: 2026-09-05

Scope: bounded contract repair for [[D2771]]–[[D2777]] plus author self-audit [[D2778]]. No
production, schema artifact, migration, content, route, client, archive or protected-design byte
changed.

## What changed

- One parser consumes all 23 `evidence_jobs` columns and enforces the eight mutually exclusive
  durable state shapes at every lease, settlement, application and replay read.
- Lease load and settlement compare exact stored expiry with a database-observed canonical instant;
  settlement and consumption store real canonical instants.
- Provider responses retain canonical raw bytes and a recomputable domain-separated digest, pass
  exact payload parsers for eval, WDL, best line and tablebase, and remain bound to operation,
  instance, request, generation, job and the exact database-issued lease.
- Objective proposals equal the requested state and the exact prior-plus-job evidence set.
- `evidence_run_transitions` retains the parsed before/after run bytes and digests, event range and
  whole transition digest. Receipt v2 names that transition identity; replay reloads and rejoins it.

## Executable result

`make pack-capability-fifteenth-author-repair` retains the complete predecessor chain and passes
8/8 new groups. Negative cases cover partial consumed rows, expired load and post-load expiry,
structural and malformed provider results, every payload kind, crossed database responses, crossed
objective state/refs, coordinated current-image/receipt rewrite and placeholder clocks. A valid
response-loss replay returns the retained after-image and byte-equal receipt.

## Boundary

This is author evidence, not acceptance. The executable provider adapter is a disposable stand-in;
production must consume the accepted provider-exchange operation rather than copy it. Pack schema
0.30, evidence-job/transition storage and D560's held corpus application remain unauthorized until
another genuinely fresh review and dependency acceptance.
