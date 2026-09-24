# Provider health and honest degradation

Source: `rfc/provider-health-degradation.md` (implemented 2026-09-24, one checkpoint, no run-schema
claim) and the live half of `rfc/opponent-recovery-journey.md`. Code:
`packages/runtime/src/provider-health.ts` (declarations, wire type, strict parser, learner notices),
`apps/server/src/provider-health.ts` (the registry), `apps/server/src/provider-health-adapters.ts`,
`apps/web/src/lib/provider-availability.ts` (the one client selector).

Tabiya reports what each optional provider can do **now**. Configuration only says that a provider
exists and which implementation it uses. Health comes from real handshakes and real request
outcomes. `/capabilities` reads the registry and never probes a provider.

## Identities

`PROVIDER_INSTANCE_DECLARATIONS` is the one tuple. Every other set is derived from it:

| family | instance | implementations | backoff group |
|---|---|---|---|
| stockfish | `stockfish-play`, `stockfish-analysis` | `uci_sidecar`, `local_fixture` | — |
| maia | `maia-inference` | `uci_sidecar`, `local_fixture` | — |
| tablebase | `tablebase-primary` | `lichess_http`, `local_service`, `local_fixture` | `lichess-api` |
| explorer | `explorer-primary` | `lichess_http`, `local_service`, `local_fixture` | `lichess-api` |
| voice | `external-voice` | `external_http`, `local_fixture` | `external-voice-api` |
| tts | `external-tts` | `external_http`, `local_fixture` | `external-tts-api` |

`APPLICATION_PROVIDER_EXECUTION` declares ten application operations. Each has exactly one provider
stage and a consumer budget, and that budget is compiled from the F1 consumer's latency ceiling
(4 000 ms today). The three external exchange identities (`external_voice.render@1`,
`external_voice.reasoning_review@1`, `external_tts.synthesize@1`) are declared in the tuple. They are
not yet members of the provider-protocol resource, because that is a register lane this RFC did not
claim.

Health is per instance and per generation, never per family. A generation is the SHA-256 of the
instance id, family, implementation, endpoint, identity, behaviour options, a non-secret
configuration revision and the supervisor start count. Secrets never enter it. Every UCI spawn is a
new generation. A generation change clears the repeat-open window, retry time, half-open token,
group claim and every cache row of the old generation.

Mock deployments (`ENGINE_MODE=mock`) publish their engines, fixture tablebase and fixture Explorer
as `local_fixture`. They never appear as `uci_sidecar` or `lichess_http`. A release receipt refuses
any snapshot that contains a `local_fixture`.

## States and operation availability

A snapshot row is one of six state-specific arms: `not_configured`, `unverified`, `recovering`,
`available`, `degraded_cached_only` and `unavailable`. The runtime parser rejects any field that
does not belong to an arm. Operations project to seven availability arms: `available`,
`requestable_unverified`, `recovering`, `conditional_exact_cache`, `temporarily_blocked`,
`unavailable`, and `cached_exact_only`. The last is issued only for one exact request and is never
serialized.

- The first real request to an unconfirmed external provider is admitted, with no probe. A UCI
  `uci`/`isready` handshake counts as a real outcome.
- A process exit, failed handshake, authentication failure or protocol-invalid output opens the
  circuit immediately. Authentication and protocol failures stay open until the generation changes
  or an operator retries.
- After a timeout, network failure or overload, retries wait 5 s, then 15 s, then 60 s. A Lichess
  429 blocks both Explorer and tablebase for at least 60 s, or for a longer valid `Retry-After`.
  Both instances keep their own health rows.
- Two transient opens inside five minutes mean the next success produces `recovering(1/2)`, and a
  second consecutive success produces `available`. Cache hits never count.
- Caller cancellation leaves health unchanged.
- A group allows one live request at a time. Callers queue first-in, first-out within their own
  deadline. A claim is token-bound and expires on its lease, and a stale claim can neither renew nor
  clear its successor.

Cache inventories (the opponent selection LRU and the Lichess tablebase and Explorer caches) are
joined on every read. While the provider is unavailable, one current-generation exact row makes the
instance `degraded_cached_only`. When the last row expires or is evicted, the instance becomes
`unavailable` without a provider call, and `checkedAt` does not move.

## Opponent selection

`OpponentSelector.selectWithReceipt` runs every selection under one compiled deadline. The deadline
covers Maia's repair retry and practical resistance's probes, and there is no longer a 60-second
Maia wait. The settled cache is a 512-entry LRU with recency updated on each hit. Its TTL is fixed
at insertion (6 h, never more than 24 h), and payloads are frozen recursively. Keys include the mode,
the sampler options and every provider generation the mode uses. In-flight work is kept separately,
and a late result from a replaced generation is discarded. An exact hit is returned as
`cached_exact`. `POST /select-move` sends it in `x-tabiya-provider-source`. A miss on a failed
provider returns `PROVIDER_UNAVAILABLE` (503), which carries `{ operation, availability,
retryAfterMs }`. The selector never substitutes another mode.

## `/capabilities`, `/healthz`

`/capabilities` returns `providerHealth: { generatedAt, providers[7], operations[10],
policyModes[5] }` with `Cache-Control: no-store`. The old `providers` flag object is gone.
`policyModes` lists the modes the deployment supports at all, and the live state of each is in
`providerHealth.policyModes`. The F1 availability of `live.stockfish`, `live.syzygy`, `human.maia`
and `human.explorer` reads the mapped instance. Provider-off wording is never a domain answer such
as "no games" or "outside range".

`/healthz` stays a process-liveness probe. Its body lists each instance's state, and an absent or
failed optional provider never changes its status.

## Maia container identity

Before each networked-Maia generation spawns, `maiaContainerProbe` sends one `tabiya-identity`
request to the sidecar. The sidecar answers with the OCI identity the release compiler injected
(`MAIA_IMAGE_ID`, `MAIA_MANIFEST_DIGEST`, `MAIA_CONFIG_DIGEST`, rendered from the registry's own
build outputs in `.github/workflows/release.yml`). Without that identity the probe returns `null`.
Maia exchanges, and therefore bots, then report `unavailable (protocol)`, while ordinary Maia
opponent selection stays available. A locally built development image has no registry manifest.
To use bots in development `maia` mode, start the sidecar with those three variables set to the
image's real digests.

## Bot roster availability

`BotProviderAvailability` (`apps/server/src/bot-opponent-source.ts`) projects the registry's snapshot
into the roster's per-operation states:

- `maia.policy_page@1` reads `maia-inference` together with its container identity.
- `stockfish.legal_root_table@1` reads `stockfish-analysis`, which is the instance the landed
  exchange uses.
- A release receipt from `ProviderRegistry.releaseReceipt` clears `guard_release_receipt_absent`.
  A forged, cross-registry or stale receipt adds `guard_release_receipt_invalid`.

Nothing yet issues a release receipt, because no release-concurrency benchmark exists, so guarded
families stay conditional.

## In the run

- **Paused opponent.** A typed provider failure while the opponent is selecting pauses the run
  before any opponent move is committed. The learner sees *Retry*, which re-issues the same request,
  and *Change opponent*, which offers the engine or human-style opponent for the rest of this
  session only. The change is not written to the run. The surface says: "This session changed
  opponent after a provider failure; the run record does not retain it."
- **Cached reply.** An exact cached reply shows "Using a saved response for this position."
- **Other controls.** Corpus, voice and speech controls stay rendered. A control that is not
  configured shows its reason. A control that fails at runtime shows its reason and a *Retry*
  button.
- **Settings.** Ordinary rows show plain states. Implementation, generation, reason and times appear
  only under Technical details.

## Not yet shipped

- Durable failure and recovery events, the recovery route and lane 0.26. These belong to
  `rfc/opponent-recovery-journey.md`.
- Registering the three external exchange operations, and sealed-delivery settlement for voice and
  TTS. Today those settle through registry-issued admission tickets.
- A structurally sealed displayed-text reference for speech. Today speech speaks the text this
  server last displayed for that run, node and scope, or the deterministic rendering, and it never
  calls voice again.
- `/readyz` (F12-A) and the digest-pinned release-profile failure/recovery run (Discharge D1, F12-H).
