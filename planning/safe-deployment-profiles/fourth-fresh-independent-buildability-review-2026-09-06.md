# Safe deployment profiles — fourth fresh independent buildability review

- **Date:** 2026-09-06
- **Reviewer:** Codex, independent of the third author repair
- **Input:** `rfc/safe-deployment-profiles.md` after the [[D2730]]–[[D2735]] repair
- **Verdict:** **returned on [[D2978]]–[[D2985]]; production server, Compose, Caddy, workflow,
  release and documentation implementation remain unauthorized**
- **Executable reproduction:** `make safe-deployment-fourth-fresh-review` — the complete predecessor
  chain, 8/8 new blocker controls and strict TypeScript

## What survived re-review

The third repair preserves one compiled config/image relation, exact operation/profile check lists,
canonical receipt bytes, syntax-narrowed identities, fsynced state publication and restart parsing.
Its local negative controls all remain green. Those are useful shapes, but the values called “live”
still do not cross the process, TLS, HTTP, storage, socket or fixed-mount boundaries the RFC requires.

## Blocking findings

### [[D2978]] — TLS trust is caller testimony

`validateTlsHandshake` receives `chainTrusted:true`, four digest strings, hostname/SAN strings and
clock strings from its caller, validates their shape and brands the object. It performs no TLS
connection, certificate parsing, signature-chain verification or hostname verification. A caller
can mint a trusted live TLS identity for an absent server.

### [[D2979]] — eleven deployment checks attest to themselves

`expectedSubjectCheckDigest` is public. For every check except certificate and readiness,
`passDeploymentCheck` accepts that same computed digest as proof. A hosted probe therefore compiles
all thirteen checks and a success receipt without running Compose, inspecting pins/network, probing
origin/cookies/budgets/streaming, or completing the core journey.

### [[D2980]] — readiness is reconstructed, not observed

`validateComposedReadiness` accepts a caller-written status, body, revision and image digest. The
exact expected JSON mints readiness without constructing the application, opening storage, loading
the shell or invoking `/readyz`. This is the deployment-side instance of the live-route gap already
returned in storage [[D2977]].

### [[D2981]] — ingress authority performs no ingress switch

Exported `sealIngressSwitch(target)` validates an `ActiveProfileState` object and adds it to a
`WeakSet`. It observes no public listener, proxy generation, route, target socket or probe. The
migration can publish its new active generation while no traffic endpoint exists.

### [[D2982]] — migration edits look-alike tables

`ProfileMigrationStore` creates and deletes `deployment_sessions` and `deployment_public_tokens`.
The RFC instead requires every `learner_sessions` row deleted and every live `public_tokens` row
marked revoked. The executable control leaves both product-named rows live while the journal reaches
`tokens_revoked`.

### [[D2983]] — initialization ignores existing storage

`initialize` checks only for the JSON state file. It has no storage-inspection or inherited-lock
operand and accepts generation zero. Existing database rows can therefore be blessed as a fresh
install, bypassing the required `DEPLOYMENT_STATE_MISSING` refusal and explicit adoption journey.

### [[D2984]] — receipt verification does not re-establish the declared union

`parseDeploymentReceipt` accepts canonical local success bytes with an HTTPS path URL and non-null
Caddy artifacts. It does not require live TLS for hosted start/probe, and refused/failed codes plus
failed-check names remain open strings. Parsing shapes and selected digests is not verification of
the operation × profile × artifacts × origin contract.

### [[D2985]] — mounted bytes have no mount authority

`compileDeploymentSubject` accepts a string and the caller's matching digest. It never opens the
fixed `/run/tabiya/deployment.json`, observes read-only mount/file identity or separates renderer
authority from application-process observation. The claimed cross-process image can be compiled
entirely in one caller.

## Required next author round

Move issuance to the real operations. The application-side loader must own the fixed mounted file;
check-specific executors must return private observations; TLS/readiness/ingress must originate in
the exact live probe; migration must consume the accepted storage schema and supervisor lock; clean
initialization must use storage inspection; and receipt verification must parse the complete closed
union. Fixture injection may remain in a disposable harness but cannot be reachable from release
composition. Retain every earlier control and obtain another genuinely fresh review.
