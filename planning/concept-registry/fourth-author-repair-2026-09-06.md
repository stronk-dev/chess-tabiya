# Concept registry — fourth author repair

**Date:** 2026-09-06
**Scope:** [[D2904]]–[[D2908]], [[D2922]]
**Verdict:** repaired at requirements tier; another genuinely fresh independent review is required.

## What changed

- Startup now has an exact recoverable two-phase protocol. A bootstrap-only storage handle finishes
  prerequisite structural migrations. The concept coordinator then owns one transaction containing
  stored-pack hydration, complete-document digest validation, migration data/receipt, version stamp
  and commit. Service-ready storage is minted only after commit.
- The concept data operation requires an already-active transaction and cannot begin, commit,
  rollback or stamp the version. Injected failure therefore leaves both data and `user_version` at
  the prerequisite phase for an exact restart.
- Historical pack authority is an opaque cloned/frozen artifact snapshot. Every claimed digest is
  recomputed from the complete canonical document inside the transaction; mutable
  `PackRegistry.byDigest` is not an authority input.
- Consumer closure uses the real `apps/web/src/lib/api.ts` boundary, starts at server and web entry
  paths, and requires each operation-bearing declaration to be called from another reachable
  module. A reachable but uncalled export is rejected.
- The graph consumes the committed repository compiler/config authority and rejects syntactic,
  semantic, resolution and options diagnostics before issuing a receipt.
- The predecessor review now reads every reviewed text input from exact commit `8596c97c`; its
  caller-stamped digest behavior is retained by a bounded vulnerable model, so later product/RFC
  correction cannot turn historical evidence red.

## Executable evidence

`make concept-registry-fourth-author-repair` retains the complete predecessor chain, executes the
fourth review's five falsifiers, then passes 5/5 direct repair groups plus strict TypeScript.

The model is disposable contract evidence under the exploration gate. It changes no production,
schema, storage, content, archive or protected-design byte.

## Next

Another genuinely fresh reviewer must attack the composed startup/transaction boundary, the
artifact-snapshot mint and actual reachability semantics. Acceptance and implementation also remain
blocked on the independently-passed shared-resource bootstrap.
