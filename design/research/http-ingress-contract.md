# HTTP ingress contract audit — 2026-09-30

Scope: D1846, D3333–D3335; implementing `rfc/safe-deployment-profiles.md` §§7–8.
This is a current production-source audit and transport experiment, not a completed deployment.

## Findings

1. **The pre-body Origin promise was false at the Node boundary.** The original
   `requestFromNode` consumed every chunk and concatenated it before invoking the application;
   `application.ts` then called `deploymentRefusal`. Three real-socket controls supplied one byte
   of an unfinished million-byte upload and could obtain neither the Origin/Fetch-Metadata 403 nor
   the wrong-Host 421. The repair constructs a lazy request body, so that existing policy can run
   before application body consumption. `[V]` `apps/server/src/rest.ts`,
   `apps/server/src/application.ts` handler, `apps/server/src/http-ingress.test.ts`.

2. **Body-contained semantic identity cannot be resolved before body read.** The RFC requires
   classroom-member `op` to resolve before reading the body and an unknown operation to spend
   no JSON budget. The actual protocol obtains it from `parseBody(request)`. Consider these
   requests, identical until the body, including length (14 bytes):

   ```text
   POST /classrooms/c/members HTTP/1.1
   Content-Type: application/json
   Content-Length: 14

   {"op":"leave"}
   ```

   Substitute `{"op":"bogus"}` without changing any pre-body metadata. `leave` is an admitted
   discriminator and `bogus` is refused. A function of method/path/headers cannot distinguish
   them. This is a contradiction in the specified resolution order, not evidence that the route
   needs a new header or URL protocol. `[V]` `apps/server/src/rest.ts` classroom-member branch;
   `rfc/safe-deployment-profiles.md` §8's discriminator table and pre-body-resolution paragraph.

3. **The closed operation population is stale.** The actual router includes account import and
   import-preview; Campaign creation/loadout/abandon/start/submit; learner-profile share-card;
   and run `modules/query`. None has an identity in §8's closed unsafe-operation set. The final
   generic run-action template does not cure a missing identity in the literal partition, nor
   does the capability-operation census cover every auth/Campaign/classroom route. This is a
   witnessed missing subset, not a purported complete replacement census. `[V]`
   `apps/server/src/rest.ts` auth, Campaign, learner-profile and module-query branches;
   `apps/server/src/capability-operations.ts`; `rfc/safe-deployment-profiles.md` §8.

4. **Native receive bounds were not explicit.** The adapter called `createServer` without
   options. Eight of nine initial ingress controls failed: three early policy refusals,
   progressive byte-preserving request delivery, cancellation followed by a response, the
   explicit configuration and actual incomplete-header/body deadlines. Oversized headers
   already failed at the native parser and must not be claimed as a newly fixed defect.
   `[V]` `apps/server/src/http-ingress.test.ts`, initial `make http-ingress-check` output;
   checkpoint receipt `planning/safe-deployment-profiles/http-ingress-2026-09-30.md`.

## Contract repair needed before the route-budget implementation

Proposed direction, **not accepted here**: admit method/template/content type before body read,
apply that route's generated transport bound, then parse and validate the semantic selector within
that bound. Unknown methods/routes can retain zero-body admission; unknown selectors inside an
otherwise valid JSON route cannot promise zero bytes read. Preserve the existing wire protocol.
If body selectors imply different bounds, explicitly specify the route envelope and the stricter
post-parse semantic limit rather than pretending semantic identity is known before parsing.

The authoring work must regenerate the complete current unsafe route/operation population,
include account imports and Campaign/module APIs, and prove missing/crossed/extra operations
fail. The production adapter must then enforce declared-length and chunked limits itself, refuse
compressed requests, and deliver typed 413 without destroying the response socket prematurely.
That work remains D1846/D3334/D3335, not discharged by lazy adaptation or deadline controls.

## Timeout implementation basis and limits

The pinned proxy supplied an independent counterexample: the upstream fixture logged receipt of
the unfinished POST and returned its refusal, while the TLS client reached its five-second
deadlock guard without response headers. Caddy documents that its Go HTTP/1 server consumes the
unread body before writing by default; enabling `enable_full_duplex` in both profile templates
made the exact pinned TLS proof deliver 403 and the bounded-consumer 413 before upload completion.
This is D3336; it is not solved by changing a response flush interval, which also changes backend
cancellation semantics. `[V]` `tools/http-streaming-proxy/{upstream.ts,check.mjs}`;
[Caddy HTTP/1 full-duplex option](https://caddyserver.com/docs/caddyfile/options#enable-full-duplex).

Node documents `connectionsCheckingInterval` as the incomplete-request/header deadline poll and
defaults it to 30 seconds. The production adapter sets a one-second poll so its declared
10-second header and 30-second body deadlines are actually observed; tests allow scheduling
slack rather than treating this as a sub-millisecond performance budget. The five-second idle
keep-alive configuration is explicit, with no extra keep-alive timeout buffer. `[V]`
[Node HTTP createServer options](https://nodejs.org/docs/latest-v24.x/api/http.html#httpcreateserveroptions-requestlistener),
[Node keep-alive buffer](https://nodejs.org/docs/latest-v24.x/api/http.html#serverkeepalivetimeoutbuffer);
`apps/server/src/rest.ts`, `apps/server/src/http-ingress.test.ts`.

No chess detector, content, capability identity, protected intent or kill-criterion claim changes.
The experiment uses the production adapter and actual deployment refusal function; it does not
boot the whole authenticated packaged application. The separate Explorer migration D3330 still
blocks complete working-tree application gates.
