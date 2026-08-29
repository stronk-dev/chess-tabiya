# Adoption wave 1

Tabiya now carries five market-proven conveniences without weakening its
training invariants: native run stories, grounded public story cards, optional
spoken delivery, event-shaped milestones, and opposite-side replay.

## Native stories

`GET /runs/:id/story?branch=<id>` supports imported, pack, and position runs.
An imported mainline remains storyable under its recorded-result contract. A
native branch becomes storyable only when it carries a validated
`outcome.reached` event; otherwise the server returns `STORY_UNAVAILABLE` (409)
without enqueueing a story evidence pass. The default native branch is the one
with the most recent terminal event.

Story evidence completion is path-scoped and idempotent. It enqueues only
missing recorded evaluations on the selected root-to-leaf path and never reads
another branch into the story. Native stories identify their source only as
`{kind: "native"}` and derive the terminal result from the recorded outcome.
The client offers, rather than opens, a story at attempt completion. Story
moments remain doors back into the same preserved run.

`suggestTitle(story)` is a deterministic runtime composer over the story result,
top-ranked recorded moment, ply, and recorded endgame family. No free-text or
persona title is persisted or published.

## Public story cards

Migration 13 adds `public_tokens` and `run_derivations`. A story share token is
32 random bytes; SQLite stores only its SHA-256 hash. It has the closed scope
`story_read`, no expiry, and remains valid until explicit revocation or deletion
of its creator. Only a run host may create, list, or revoke shares.

Authenticated management routes are:

- `POST /runs/:id/share` with `{branchId}`;
- `GET /runs/:id/share`;
- `DELETE /runs/:id/share/:tokenId`.

`GET /api/shared/:token/story` and `GET /shared/:token` are deliberately
unauthenticated. They expose only the deterministic title, the recorded result,
up to eight story moments with FEN/ply/SAN/sentences, and the product link. They
expose no learner identity, run graph, event log, PGN, other branch, or write
operation. Unknown, revoked, and deleted tokens all receive the same generic
404 response. The browser can copy the public URL and render the selected
recorded position and sentence set to a downloadable PNG.

The story screen states the capability's lifetime before minting: the public URL does not expire
and remains readable by anyone holding it until revocation or creator-account deletion. It lists
active and revoked links with creation time and exposes the authenticated revoke operation. Revoke
copy promises only that future reads stop; it does not imply that copies already saved elsewhere
can be recalled. Clipboard permission is optional: creation still succeeds and leaves a selectable
URL plus manual-copy guidance when the browser denies clipboard access.

This table is the one anonymous-capability-token trust surface. Later scopes
must widen its closed checks through a numbered migration rather than creating
a parallel token mechanism.

## Voice and spoken delivery

`TABIYA_VOICE_PROVIDER=external_http` enables the vendor-neutral text renderer.
`TABIYA_VOICE_PROVIDER_URL` is required; `TABIYA_VOICE_PROVIDER_KEY` is an
optional bearer token and `TABIYA_VOICE_PROVIDER_TIMEOUT_MS` defaults to 4000.
The entire outbound JSON body is exactly:

```json
{"personaPrompt":"…","sentences":["…"],"scope":"marker"}
```

The scope is `marker`, `reading`, `steering`, or `story`. No learner, run,
session, client, or raw-position identifier is sent. Invalid responses,
non-success status, timeout, and packet-check rejection share the existing
one-retry then deterministic-fallback behavior.

Browser assistance preferences are version 3. Version 1 and 2 records migrate
locally with `spoken: "off"`; the storage key is unchanged. Speech uses the
browser `SpeechSynthesis` API, is off by default, and speaks only sentences from
an assistance surface the learner explicitly opened. Missing synthesis support
is an honestly disabled control with a stated reason.

## Milestones

`GET /progress/milestones` derives learner-scoped milestones from attempts,
schedules, and run derivations. Nothing is stored and nothing interrupts play.
The closed v1 set records first attempt, stable grade, achieved objective, win,
scheduled return, ten attempts on one root, and opposite-side replay. Each item
links to its preserved run and branch.

Milestones are event facts, not skill numbers. Sentences contain no percentage,
score, streak, rating, ranking, or cross-learner comparison. The sole numeric
kind—ten attempts on one root—is a count of preserved events.

## Opposite-side replay

`POST /runs/:id/flip` with `{nodeId, resistance?}` reads an authorized source
node and atomically creates a server-named `flip-<UUID>` position run plus a
`flip_sides` derivation. The derived learner side is opposite the source
learner side. The source event log and branches are untouched; the new run is
pack-free because authored grading and claims are orientation-specific.

The client exposes replay from the attempt-complete sheet and shows derivation
links in both directions. The derived run uses the ordinary Just Play opponent
loop, branch, comparison, and export machinery. A live human match may impose a
stricter refusal on flip because a private engine-facing copy would bypass its
mutual disclosure boundary.

## Verification

The implementation is covered by storage migration tests, native story and
path-scope tests, exact public-projection and token-hash tests, transport and
timeout fallback tests, assistance preference migration tests, atomic flip
tests, and zero-retry browser acceptance covering speech, story sharing and
revocation, milestone links, and opposite-side replay.
