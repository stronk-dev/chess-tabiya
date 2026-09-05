# Safe deployment profiles — third fresh independent buildability review

- **Date:** 2026-09-05
- **Reviewer:** codex, independent of the second author repair
- **Input:** `rfc/safe-deployment-profiles.md` after the [[D2614]]–[[D2618]] repair
- **Verdict:** **returned on [[D2730]]–[[D2735]]; production server, Compose, Caddy, workflow,
  release and documentation implementation remain unauthorized**
- **Executable reproduction:** `make safe-deployment-third-fresh-review` — 6/6 blocker controls
  plus the retained first and second author gates

## What survived re-review

The local/appliance/hosted topology, operator-DNS appliance workflow, three-edge proxy graph,
route-budget partition, ingress/streaming requirements and canonical mounted-image direction remain
sound. The second repair also supplies a real closed unknown-input compiler and narrows operation and
digest syntax. Its five local author groups pass. The full contract still cannot safely compile a
live deployment success or resume a profile migration.

## Blocking findings

### [[D2730]] — mounted-image validation is a partial relation

`loadCompiledDeploymentImage` accepts canonical bytes whose profile fields could never be emitted by
the source compiler: an `appliance` boundary with `tlsMode:"acme"` and arbitrary internal port passes.
The loader checks origin and a few booleans, not the complete profile matrix, and it receives no
expected mounted-image digest. Canonical bytes are not necessarily authorized bytes.

### [[D2731]] — successful checks share a UUID, not a deployment subject

`PassedDeploymentCheck` retains only operation id, check name and a digest of caller operands.
`compileDeploymentSuccess` never joins those operands to the supplied compiled image, config digest,
artifact identities, profile or public URL. The executable counterexample compiles a local success
for an attacker URL and unrelated config digest from a set of equal-value check echoes.

### [[D2732]] — the executable result is not the declared receipt protocol

The author model emits a success-only object with no protocol, protocol version or result tag and
implements none of the refused/failed/cancelled union, canonical stdout serialization or verification.
It accepts `deploymentRevision:"latest"` and `elapsedMs` beyond the safe-integer boundary. This also
reintroduces the mutable revision class just repaired in dependency [[D2729]].

### [[D2733]] — TLS identity records digests without proving TLS

`parseTlsIdentity` has no trust-root/chain-validation operand and accepts future validity dates when
the caller supplies an invalid `now`. It does not require canonical UTC bytes or the exact singleton
SAN tuple. `parseDeploymentArtifacts` then treats any typed non-null TLS object as validated rather
than reparsing a sealed live result. Fingerprints identify observed bytes; they do not establish that
the handshake, hostname, time and trust policy passed.

### [[D2734]] — readiness contradicts and bypasses its storage dependency

The safe-deployment check accepts `{status:200,ready:true,imageDigest===expected}`. The freshly
repaired storage contract instead requires exact canonical JSON carrying representative-data and
storage-version truth; safe deployment separately promises immutable release revision and an
internal compiled-image attestation. No composed response/header contract or parser requires all of
them, so deployment can report ready without the storage proof it claims to consume.

### [[D2735]] — migration phases are not crash-durable effect authority

`ProfileTransition` is a caller-constructible object. A JSON-round-tripped value with negative
generations advances when passed the label `invalidate_sessions`; no sealed SQLite result, fixed-file
journal parser, atomic publication/discovery, fsync, ingress-switch receipt or restart reconciliation
exists. The prose has a five-phase durable protocol, but the advertised behavioral group exercises
an in-memory enum progression.

## Required next author round

Repair these as one release authority. Revalidate the complete profile relation and expected mounted
digest; seal one deployment subject across config, artifacts, checks and receipt; implement the full
canonical receipt union over immutable revisions and safe elapsed time; seal TLS validation from the
actual handshake/trust/clock subject; compose the storage and deployment readiness proofs; and use the
accepted storage journal/transaction primitives for crash-durable profile migration. Retain every
earlier control and add able-to-fail fixtures for each counterexample above. Another genuinely fresh
review remains mandatory before acceptance or production implementation.
