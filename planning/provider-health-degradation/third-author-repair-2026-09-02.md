# Provider health/degradation third author repair — 2026-09-02

## Verdict

Author repair complete for [[D2412]]–[[D2417]]. This is not acceptance or implementation. Fresh
independent buildability review is required before either implementation checkpoint is authorized.

## Repaired authority

- One literal eight-operation/eleven-stage map derives the operation, stage and provider-instance
  route. Results, live/local origins and cached origins are correlated to that route, configured
  implementation, generation and normalized request digest.
- The unknown-input parser refuses crossed operation, stage, instance, implementation, generation,
  request and cached-origin identities.
- Recovery has a distinct `recovering` state carrying the prior failure, first-success times and
  `1/2` progress. Cache hits never advance recovery.
- Cache inventory and lookup are partitioned at exact
  operation/stage/instance/generation/request/key grain. A global capability reports only that an
  exact cache service exists; request admission proves the actual hit.
- Production-local services retain `local_service` as both configured implementation and origin.
  Remote `provider_live` and test-only `local_fixture` remain distinct.
- TTS is not an orphan operation. It is the conditional audio stage of `render.voice`,
  `render.voice_compare` and `render.voice_story`.
- `ProviderBackoffGroupId` separates upstream admission coordination from provider health.
  Explorer and tablebase share `lichess-api` throttling while keeping independent health state.

## Verification

`make provider-health-third-author-repair` passes the original eight contract arms, nine new
able-to-fail controls and both strict TypeScript models. No production, schema, runtime, API,
client, content, archive or protected-design byte changed. The lane remains a declaration awaiting
fresh independent review.
