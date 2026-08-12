# Explorer sourcing — log

Append-only.

## 2026-08-12 — Codex implementation

- Gate 0 first returned HTTP 401 anonymously, then resolved to Branch A after the owner
  supplied a scope-less personal operator token through `.env.lichess`: the identical
  request returned HTTP 200. Both observations and the Q6 non-revival are appended to the
  exploration log; the earlier Branch-B entry is retained because that log is append-only.
- The client canonicalizes the official rating/speed enums and validates real YYYY-MM
  windows before any request. It emits every parameter explicitly, keeps bearer credentials
  out of URLs/artifacts, caches only successful bodies, does not retry 401/403, and uses the
  shared 60/120/240-second transient schedule.
- `priority.json` derives totals from white/draw/black counts, ignores invented response
  totals/windows, sorts deterministically, and abstains below 100 games. The committed
  artifact contains the real first-wave family frequencies returned by authenticated Stage 0.
- `candidate-attach` is pre-checking, author-selects the move, permits only an existing
  feedback-claim text, renders the one byte-exact frequency sentence, updates both sidecars
  and the post-write pack digest, and validates temporary documents before rename.
- No offline corpus, learner ranking, difficulty inference, automatic move selection,
  causal claim, or alternate rating band was built. Operator authentication works; a
  learner-facing Lichess OAuth flow remains explicitly separate.

## 2026-08-12 — Independent approval and lifecycle closeout

- Claude independently verified the real authenticated priority artifact, clean credential
  boundary, operator/learner separation, and both repository gates. B6c is approved and
  archived.
