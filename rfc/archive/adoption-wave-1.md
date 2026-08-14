# RFC: Adoption wave 1 — five cheap market-proven features

- **Status:** implemented
- **Author:** claude (adoption-wave-1 draft, 2026-08-14 parallel wave)
- **Created:** 2026-08-14
- **Design refs:** `design/02` §Adoption posture; `design/03` §Train (B2 repeat/mirror/opposite-side
  actions, line 50; §Review "opposite-side replay", line 64); `design/05` §1 invariants, §3a
  (post-game is where the ladder may speak), §3 rung 6 (LLM renders, never claims)
- **Exploration gate:** owner ruling 2026-08-14 (`planning/exploration/log.md`, "full parallel
  wave" entry): four RFC drafts in parallel; register discipline pre-assigned
  predicate-wave-2 → corpus-evidence → adoption-wave-1 → social-match
- **Depends on:** `archive/game-import-and-story.md` (story projection),
  `archive/adaptive-guidance.md` (voice seam, assistance preferences),
  `archive/return-and-progression.md` (attempts tables, `/learn`),
  `archive/shape-library.md` (Just Play position player),
  `archive/learner-identity-and-authorization.md` (token discipline, grant roles),
  `archive/live-session-platform.md` (the no-anonymous-token limit this RFC amends),
  `archive/runtime-corpus-evidence.md` (shared non-register resources this RFC also touches:
  the `AssistanceConfig` version — that draft claims 1→2, this RFC rebases on it (§3) —
  the append-only `ServerErrorCode` union, and the `/runs/:id/…` route-action regex,
  per that RFC's sibling rule).
  Coordinated with the `social-match` draft (not yet present in `rfc/` at drafting
  time; drafted later the same day) via the shared public-token contract in §6.
- **Parent / amends:** —
- **Supersedes / superseded by:** —
- **Planning:** `planning/adoption-wave-1/` (once implementing)

## Summary

This RFC specifies the five cheap adoptions from the adoption audit's Shortlist A
(`design/research/adoption-audit.md:163-182`): (1) the auto-offered post-game story ritual for
native runs, (2) a grounded share card with a suggested title and a public read token, (3) spoken
voice delivery over the shipped packet-checked persona seam, (4) revisitable event-shaped
milestones, and (5) flip-sides retry plus the one-click mirror control residual. Each is
market-proven elsewhere (love-evidence cited per feature), low-cost against the shipped surface,
and conflict-free once it enters through its named `design/05` §1 invariant. All five were
ledgered by the owner on 2026-08-14 (`design/BACKLOG.md:199-203`). Nothing here adds a grounding
path, a mastery number, or an LLM chess claim.

## Motivation

The audit's governing rule: the market's shape is fragmentation — each competitor is one good
feature with the rest missing; the differentiator is the integrated loop, and everything else may
be adopted freely through an invariant (`design/research/adoption-audit.md:24-30`). Of the
audit's 60 features, these five are the intersection of high love-evidence and low cost:

1. **Post-game story ritual** — chess.com's auto-offered review is "proven at ~175M-visit scale";
   a free user credits it for 900→1250 (audit row 24, `adoption-audit.md:91`). Ours is
   imports-only today: every detector ships, but no offer motion exists at a native run's
   terminal.
2. **Share card + suggested title** — Take Take Take's one-tap share card "even suggests a title"
   (audit row 2, `adoption-audit.md:44`); `docs/game-import-and-story.md:110-111` already names
   the story JSON as "the future renderer's grounded data contract".
3. **Spoken coach voice** — Dr. Wolf's single most-praised element at 4.8★/27k ("just like my
   grandfather"; voice mode "transformed our app", audit row 31, `adoption-audit.md:103`). Our
   persona text seam ships with no provider and no audio (`docs/adaptive-guidance.md:115-120`).
4. **Revisitable milestones** — TTT's medals are re-enterable records ("Revisit the games and
   sessions behind every medal", audit row 4, `adoption-audit.md:46`); transformed here into
   claim-free events over shipped attempt tables.
5. **Flip-sides + mirror** — Dr. Wolf's "flip sides after a blunder — so I can better appreciate
   my mistake" (row 33, `adoption-audit.md:105`) plus chess.com's Switch Sides, which users
   report taking years to find (row 28, `adoption-audit.md:95`). Our mirror/opposite-side actions
   are design-committed (`design/03:50,64`) but no doc evidences a shipped control — this is a
   breadth residual being closed.

Out of scope, deliberately: the runtime corpus-evidence surface, repertoire gap-finding,
open-answer grading, and friend-link *play* (Shortlist B — the corpus surface and social match
are sibling drafts in this same wave); what-if steering (audit row 38, the shortlist's honourable
mention, not one of the five ledgered rows); any social graph, streak, XP, or skill score
(refused by transformation, audit rows 3 and 9); native mobile packaging.

## Specification

### 1. Post-game story ritual for native runs

**Entry invariant, honoured explicitly:** commit-before-learning — post-game is exactly where the
full assistance ladder may speak (`design/05` §3a retrospective detection), and the ritual is an
**offer at the terminal — auto-offered, never auto-shown**. The silence default holds: the
attempt-complete sheet gains one control; no story content, moment, or evaluation appears until
the learner activates it. Every moment remains a door back into play (attempts preserved).

Server:

- `GET /runs/:id/story` extends from `imported` runs to `pack` and `position` runs. It gains an
  optional `branch` query parameter. For imported runs the default branch remains the imported
  mainline (behavior unchanged). For native runs the default is the branch carrying the most
  recent validated `outcome.reached` event.
- **Storyability rule:** a native branch is storyable iff it carries a validated
  `outcome.reached` event. This keeps disclosure honest with zero new machinery: a terminal
  `outcome.reached` reveals under every feedback policy — all three arms of
  `feedbackDisclosed` accept it (`packages/runtime/src/feedback.ts:3-18`;
  `docs/drill-client.md:84-85`) — and the shipped story read already refuses undisclosed
  runs with `ASSISTANCE_WITHHELD` (`apps/server/src/service.ts:491`); that gate extends to
  native runs unchanged, so the storyability rule is belt-and-braces, not the only barrier
  (the `sessionKind !== "imported"` refusal at `apps/server/src/service.ts:490` is the one
  check this section lifts). Requesting a story for a run with no storyable branch, or
  naming a non-storyable branch, returns the typed error `STORY_UNAVAILABLE` (HTTP 409),
  added in both places new codes must land — the closed union
  (`apps/server/src/errors.ts:1-46`) and the status map whose unlisted codes fall through
  to 500 (`apps/server/src/rest.ts:389-479`). Mid-run engine evidence can never leak
  through the story because no story exists before a terminal.
- The story path is root → the storyable branch's leaf along that branch's path. The
  idempotent-completing evidence pass from import applies unchanged
  (`docs/game-import-and-story.md:48-58`): the first story read enqueues evaluation jobs for
  path nodes lacking durable evaluation; until complete, the payload reports how many positions
  remain and disables re-entry. Native runs already enqueue one evaluation job per committed
  move (`docs/drill-client.md:75-77`), so the residual pass is typically empty.
- Detectors are the shipped set, byte-identical (`docs/game-import-and-story.md:62-82`): the
  same product conventions (±1000 cp mate rail, learner-relative scores, ≥150 cp pivot), the
  same `nodeId`/`entryNodeId` split, the same deterministic rank, up to eight displayed. Two
  differences fall out of recorded facts rather than new code: native runs have persisted
  `opponent.move_selected` distributions, so the recorded human-divergence detector
  (`docs/adaptive-guidance.md:65-67`) can produce moments an imported mainline cannot
  (`docs/game-import-and-story.md:75-76`); and the result moment is the branch's
  `outcome.reached` fact — there is no PGN recorded result to attribute and none is fabricated.
- Re-entry is unchanged: selecting a moment rewinds to `entryNodeId` and explicitly creates a
  `story-reentry` branch (`docs/game-import-and-story.md:86-89`), preserving the played
  continuation.
- Native story responses carry `source: {kind: "native"}`. They carry no imported
  headers, URL, import timestamp, or PGN result. The learner-perspective terminal fact
  remains the existing `outcome` projection; no PGN-style result is fabricated.

Client:

- The existing non-dismissible attempt-complete sheet (`docs/drill-client.md:117-122`) gains a
  "Story of this run" control when the just-terminated branch is storyable. One activation opens
  the story screen (`/review/game/:runId`, now serving any storyable run, branch preselected).
  The sheet's existing commentary and evidence content is unchanged.
- Run screens for runs with at least one storyable branch show the same Story control imported
  runs already have (`docs/game-import-and-story.md:98-100`). Runs with none show nothing — no
  teaser, no locked state.
- Optional story voice is unchanged: packet-checked, deterministic fallback
  (`docs/game-import-and-story.md:80-82`).

### 2. Grounded share card, suggested title, public read token

**Entry invariants, honoured explicitly:** grounded claims — the card renders story-JSON facts
only, and the suggested title is deterministic or packet-bound, never free (Take Take Take's
share card carries LLM-confabulated prose "already caught being wrong in public" —
`design/research/teardown-taketaketake-desk.md:162-166,185,207` — and is the named cautionary
case). Attempts preserved — the owner's card links back into the preserved run. This section
consciously amends one recorded implementation limit: "the live platform … has no anonymous
public share token" (`docs/live-sessions.md:84-86`). The amendment is exactly one read-only
scope; every live-session surface remains token-free.

Storage — **migration 13** (`STORAGE_VERSION` 12→13; renumbered 2026-08-14 after `runtime-corpus-evidence` released its reservation — the version pair follows the actual ladder, per the migration-4 lesson) creates two tables:

```sql
CREATE TABLE public_tokens (
  id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,          -- SHA-256 of a 32-random-byte token
  scope TEXT NOT NULL CHECK (scope IN ('story_read')),
  run_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  created_by TEXT NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  revoked_at TEXT
) STRICT;
CREATE TABLE run_derivations (               -- owned by §5, same migration
  derived_run_id TEXT PRIMARY KEY,
  source_run_id TEXT NOT NULL,
  source_branch_id TEXT NOT NULL,
  source_node_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('flip_sides')),
  created_at TEXT NOT NULL
) STRICT;
```

Token discipline is the session discipline: 32 random bytes, only the SHA-256 hash stored
(`docs/identity-and-authorization.md:9-10`). `ON DELETE CASCADE` on `created_by` is deliberate
and differs from the run-tombstone rule: a share link is the sharer's standing intent, and it
dies with the account rather than surviving as an orphaned public window. A `story_read`
token has **no expiry**: its lifetime is bounded only by explicit revocation and the creator
cascade (the table deliberately carries no expiry column; the sibling's nullable
`expires_at`/`uses_remaining` columns stay `NULL` for every `story_read` row, §6). Both
`CHECK` constraints are written as **literal strings**, never by interpolating a live
vocabulary tuple — the migration-9 lesson the sibling's freeze mandate records
(`rfc/README.md:103`), honoured here before it can recur.

HTTP:

- `POST /runs/:id/share` `{branchId}` — host role only (sharing is grant-shaped, and only hosts
  manage grants, `docs/identity-and-authorization.md:34`). The branch must be storyable under
  §1's rule (imported mainlines qualify). Returns the bare token exactly once plus the public
  URL. `GET /runs/:id/share` lists the caller's tokens for that run (ids, not bare tokens);
  `DELETE /runs/:id/share/:tokenId` revokes.
- `GET /shared/:token` (HTML) and `GET /api/shared/:token/story` (JSON) require no session
  cookie. An unknown, revoked, scope-mismatched, or cascade-deleted token returns the same 404
  as an unknown path — existence non-disclosure, matching the missing-grant rule
  (`docs/identity-and-authorization.md:59-60`).
- The public projection contains **only**: the card title, the result fact, up to eight moment
  sentences with their FENs and ply/SAN, engine-attribution lines, and a product link. It
  contains no learner handle, no run graph, no events, no PGN export, no other branches, no
  live evidence endpoint, and no write path of any kind. Re-entry into play is not part of the
  public surface; play requires an account and a grant.

Card renderer (client, self-contained):

- The story screen gains a Share flow: pick the card's board moment (default: the story's
  top-ranked moment, `docs/game-import-and-story.md:79-80`), create the token, copy the URL,
  and download the card as a PNG. The card is rendered client-side as SVG (board diagram of the
  chosen moment's FEN, title, up to three moment sentences, the fixed attribution line
  "rendered from recorded engine evidence", product mark) and serialized to PNG via canvas. The
  same renderer draws `GET /shared/:token`.

Suggested title:

- `suggestTitle(story)` is a **deterministic composer** in the shared runtime: a closed template
  set over story-JSON facts only — the result fact, the top-ranked moment's kind and ply, and
  the endgame census family when present (e.g. a recorded draw whose top moment is an endgame
  entry composes "Held from the rook endgame at move 34"). Same story JSON, byte-identical
  title; a unit test pins this.
- When a voice provider is configured, the sharer may request one persona rendering of the
  title. This reuses the story-voice path: `POST /runs/:id/voice` gains scope `story`, whose
  packet is the story JSON's deterministic sentences plus the composed title. `voiceCheck` and
  the one-retry-then-deterministic-fallback rule apply unchanged
  (`docs/adaptive-guidance.md:109-113`). There is no free-text title generation path.
- **The persona rendering can never reach the public surface.** The public card's title is
  always `suggestTitle(story)`, recomputed at render time from the story JSON; nothing
  persists a title anywhere (`public_tokens` carries no title column by design, §2 SQL), so
  there is no field a persona or free-text title could ride into `GET /shared/:token`. The
  persona rendering is delivered to the sharer alone — a caption they may paste themselves,
  under their own name. This is deliberate belt-and-braces: `voiceCheck` is documented as
  necessary but insufficient, and the known passing plain-English leak remains a pinned
  fixture (`docs/adaptive-guidance.md:116-118`; verified still present at
  `packages/runtime/src/adaptive-guidance.test.ts:113`) — exactly why the anonymous public
  projection never depends on it. The same argument covers every other packet field: the
  projection is composed exclusively of story-JSON facts (deterministic detector sentences,
  FENs, ply/SAN, the result fact), none of which pass through an LLM.

### 3. Spoken voice delivery and provider configuration

**Entry invariant, honoured explicitly:** silence default. Spoken delivery is off by default,
speaks only text the learner has already explicitly opened, and never autoplays at commit time.
This slice adds a **renderer and a provider config, not a grounding path**: the evidence packet,
`voiceCheck`, retry, and deterministic fallback are untouched
(`docs/adaptive-guidance.md:101-120`).

Provider configuration (the persona-text half — closes "no provider ships"):

- The shipped vendor-neutral seam (`docs/adaptive-guidance.md:118-120`) gets one concrete
  adapter: `external_http`, selected by `TABIYA_VOICE_PROVIDER=external_http` with
  `TABIYA_VOICE_PROVIDER_URL` and optional `TABIYA_VOICE_PROVIDER_KEY` (sent as a bearer
  header). Pinned contract: the server POSTs
  `{personaPrompt: string, sentences: string[], scope: "marker"|"reading"|"steering"|"story"}`
  and accepts `{text: string}`; any other shape, a non-2xx status, or exceeding the bounded
  timeout (default 4000 ms, configurable) counts as a failed rendering and falls into the
  existing retry/fallback rule. Capabilities report `llm: external` exactly as specified today.
  No vendor SDK enters the repository.
- **Privacy pin, for the hosted ruling:** that request body is the provider's entire
  disclosure. No learner identifier or handle, no run or session id, no client IP or
  user-agent forwarding, and no FEN or position payload beyond what the deterministic
  sentences themselves already say ever reaches the provider — the documented
  packet-only-prompt rule (`docs/adaptive-guidance.md:117-119`) carried to the wire. A
  contract test asserts the serialized request contains exactly the three pinned keys.
- Unconfigured deployments are byte-identical to today: `VOICE_UNAVAILABLE` (503), persona
  preference hidden (`docs/adaptive-guidance.md:108-110`).

Spoken delivery (the audio half):

- Speech is produced client-side by the browser's `SpeechSynthesis` API. No audio provider, no
  server audio path, no new external dependency.
- The versioned per-session-kind assistance preference (`docs/adaptive-guidance.md:34-44`) is
  a shared in-wave resource: the earlier `runtime-corpus-evidence` draft claims version 1→2
  (the `corpus` key) and requires siblings to rebase on it
  (`rfc/runtime-corpus-evidence.md:70-71`). This RFC therefore claims **2→3**, adding
  `spoken: "off" | "on"` with universal default `"off"`. Stored v1 and v2 preferences are
  read as v3 with `spoken: "off"` (and, for v1, that draft's `corpus` default).
- What may be spoken is exactly the text already rendered on an explicitly opened assistance
  surface: an opened pivotal-marker's sentences, the endgame reading, persona-rendered voice
  output, and story moment sentences. With `spoken: "on"`, opening such a surface speaks its
  text; each surface also carries a per-invocation speak/stop control. Nothing is spoken on
  commit, on checkpoint, or on any surface the learner did not open; feedback withholding is
  unaffected because spoken delivery consumes only already-delivered text.
- Where `speechSynthesis` is absent or has no voices, the control renders disabled with a
  nonempty reason under the shipped honest-control contract (`docs/drill-client.md:304-307`).

### 4. Revisitable event-shaped milestones

**Entry invariants, honoured explicitly:** honest progress — a milestone records an **event**,
never a skill percentage; `/learn` deliberately presents no mastery number
(`docs/return-and-progression.md:44-47`) and this section extends that posture rather than
eroding it. Attempts preserved — every milestone is a pointer into a preserved run. Silence
default — milestones are revisitable records on `/learn`, never toasts, popups, or in-run
interruptions.

- `GET /progress/milestones` is a learner-scoped **derived read** over the existing migration-6
  tables (`attempts`, `schedules`; `apps/server/src/storage.ts:2015-2070`) plus §2's
  `run_derivations`. No milestone rows are stored; the projection is recomputed per read and is
  therefore idempotent and consistent with deletion/reassignment semantics for free.
- The v1 kind set is **closed** (an unknown kind is a validation failure, not a rendering
  fallback). Each milestone is `{kind, occurredAt, sentence, link: {runId, branchId}}`:

| Kind | Derivation (earliest qualifying row wins) |
|---|---|
| `first_attempt` | first countable attempt (`countable = 1`) |
| `first_stable` | first graded attempt with verdict `stable` |
| `first_objective_achieved` | first attempt with `objective_state = 'achieved'` |
| `first_win` | first countable attempt with `result = 'win'` |
| `first_scheduled_return` | first attempt with origin `scheduled` — "returned when due" |
| `ten_attempts_one_root` | the attempt whose `attempt_no` first reaches 10 within one root (link: that tenth attempt) |
| `first_flip_sides` | first countable attempt on a run with a `run_derivations` row (composes with §5) |

- Sentences are deterministic templates over the row's stored columns (pack title resolved from
  the registry where `pack_id` is present; ungraded and pack-free rows named honestly, matching
  `/learn`'s existing language). No sentence contains a percentage, score, streak, ranking, or
  comparison to other learners.
- **Pin on the numbers rule**, so `ten_attempts_one_root` cannot be read as a violation: what
  the honest-progress posture bans is **skill numbers** — percentages, scores, streaks,
  ratings, rankings, and cross-learner comparisons — because they are claims about mastery
  the stored data cannot support (`docs/return-and-progression.md:44-47`: "no mastery
  percentage: the stored data is an attempt history"). A count of the learner's own preserved
  attempts ("ten attempts on one root") is an event fact read off stored rows — the attempt
  history speaking as itself — and is permitted. The closed kind set contains exactly one
  such count and no other numeric content; any future kind proposing a number must pass this
  distinction explicitly.
- Client: `/learn` gains a Milestones section listing achieved events newest-first, each linking
  into its source run via the existing source-run links (`docs/return-and-progression.md:44-46`).
  Honest empty state when none exist.

### 5. Flip-sides retry and the one-click mirror control

**Entry invariants, honoured explicitly:** attempts preserved — flipping never mutates the
source run; it creates a new owned run linked by provenance, and both survive. Grounded claims —
**pack claims never flip sides**: an authored objective, grading, and spine are claims about the
authored side, so the derived run is pack-free and says so rather than manufacturing a mirrored
objective (`design/05` §1, "Nothing here invents chess truth").

Server:

- `POST /runs/:id/flip` `{nodeId, resistance?}` — available to any learner holding a grant on
  the source run (a node's FEN is already visible to every authorized role, so no disclosure
  widens; no writer lease is required because nothing in the source mutates). The server
  validates the node exists on a source branch, derives the node's FEN from durable run state,
  and atomically creates: a new **position** run with server-minted id `flip-<UUID>`, owned by
  the caller, with root FEN = the node's
  FEN and learner side = the opposite of the source run's learner side, plus the
  `run_derivations` row (§2's table; kind `flip_sides`, source run/branch/node recorded). The
  requested resistance defaults to the source run's requested policy when the deployment can
  execute it, else the caller chooses; the normal capability rules apply.
- The derived run is an ordinary Just Play position run (`docs/shape-library.md:56-61`): full
  board/timeline/branch/compare/export machinery, objective region explicitly stating no pack
  is loaded and nothing is claimed. Two boundary conditions, pinned because the machinery
  already handles them: a mid-game node FEN carries castling rights, the en-passant square,
  and the move clocks, and run creation canonicalizes and legality-validates it through the
  shipped path (`canonicalRunStart` → `positionFromFen`,
  `packages/runtime/src/session.ts:58-63` — an illegal position is a typed refusal, not a
  broken run); and when the flipped learner is **not** to move at the derived root, the
  ordinary position-run flow has the opponent select first, exactly as any Just Play run
  whose FEN gives the other side the move.
- **Live-match gate (cross-draft):** against a run whose session is the `social-match`
  sibling's live native match, `POST /runs/:id/flip` is refused with that draft's
  `MATCH_LIVE` — a mid-game flip would hand a player a private engine-facing copy of the
  live position, an in-product escape from withholding. The refusal is specified and owned
  by `rfc/social-match.md` §3.3 (this RFC predates the mode; the register order lands this
  draft first, so the gate ships with the sibling).
- Attempt projection is untouched: the derived run's attempts project normally under their own
  root (the existing `derived_from_run_id` column, `apps/server/src/storage.ts:2033`, is set as
  the duplicate path already does; the attempts `origin` CHECK is not widened — the derivation
  row, not a new origin, is the provenance).

Client — two visible placements, closing the discoverability failure chess.com is loved despite
(audit row 28: years of confusion finding Switch Sides):

- **Mirror (one-click, at the root):** the attempt-complete sheet (§1's surface) gains "Replay
  this drill as White/Black" — flip at the source root. When the source pack declares a
  `retryVariants` entry of kind `opposite_side` (shipped in pack schema 0.6,
  `schemas/drill_pack.schema.json:68-81`), the control additionally shows that variant's
  authored `note` verbatim — the first surface to make that vocabulary executable.
- **Flip here (at any node):** the timeline's node preview/rewind-confirmation surface gains
  "Take the other side from here" — the Dr. Wolf motion: fork at the mistake and take the
  punishing side.
- Both are always-visible labeled controls under the honest-control contract; the run screens of
  both runs render the derivation link in both directions ("mirror of run X from move N" /
  "mirrored by run Y").

### 6. The shared public-token contract (coordination with `social-match`)

The `social-match` draft (friend-link play) was **not present** in `rfc/` at drafting time;
it has since landed in the same wave, and this section was reconciled against it (see
Changelog). The shared contract:

- `public_tokens` (§2) is the **single trust surface** for anonymous capability tokens: one
  table, hashed 32-byte tokens, a closed typed `scope` CHECK, per-token revocation, uniform 404
  non-disclosure, cascade deletion with the creating account. The Cross-draft ownership pin
  recording this ("`adoption-wave-1.md` owns `public_tokens`") is on the register
  (`rfc/README.md:131-136`).
- This RFC defines exactly one scope, `story_read`, with **no expiry** (revocation and
  creator cascade are the whole lifecycle, §2), and its projection contains no write
  capability and no live-session state. `social-match` adds exactly one further scope,
  `session_join` — single-use by default, 14-day default expiry, 90-day cap — by rebuilding
  the table in its own migration: the `scope` CHECK widens, join-only columns
  (`session_id`, `match_slot`, `invited_role`, `invited_handle`, `expires_at`,
  `uses_remaining`) are added nullable, `run_id`/`branch_id` relax to nullable under a
  per-scope CHECK, and every `story_read` row survives byte-identical
  (`rfc/social-match.md` §3.5, §3.8). It names this RFC in `Depends on:` and creates no
  second token table.
- The public URL namespace is likewise single and shared: `GET /shared/:token` dispatches by
  the resolved row's scope, and every failure mode — unknown, revoked, expired, exhausted,
  scope-mismatched, cascade-deleted — answers with the same 404 as an unknown path. Both
  drafts pin the identical posture; neither adds a token error code.
- The sibling additionally refuses `flip` and `duplicate` on live native-match runs
  (`MATCH_LIVE`, its §3.3) so neither this RFC's flip route nor the shipped duplicate route
  can become a mid-game withholding escape; this RFC's §5 records the flip half.

### 7. Register claims

Per the pre-assigned order (predicate-wave-2 → corpus-evidence → adoption-wave-1 →
social-match) and the standing register law (`rfc/README.md:16-27,41-42,73-79`):

- **Pack schema:** no version claimed. No pack field changes; `retryVariants.opposite_side`
  already exists in 0.6. Version 0.13 is claimed by `predicate-wave-2` (register row,
  `rfc/README.md:46`).
- **Run schema:** no version claimed. No new event kinds: the story, milestones, and card are
  derived projections; a flip creates ordinary runs; tokens and derivations are non-run tables.
- **Migration:** this RFC claims **migration 13, `STORAGE_VERSION` 12→13** (renumbered from 14 on corpus's release) (create-table/index
  only: `public_tokens`, `run_derivations`; literal CHECK strings per §2), recorded on the
  register (`rfc/README.md:102`). Number 13 is held **reserved** for `runtime-corpus-evidence`
  by the wave order, but that draft's own text claims **no migration**
  (`rfc/runtime-corpus-evidence.md:63-66`), so 13's release — and this RFC's rebase 14→13
  together with `social-match`'s 15→14 — happens at the register per its standing rule ("a
  draft that cannot land behind its predecessor renegotiates here rather than renumbering
  unilaterally", `rfc/README.md:48-49`); the register stays the single writer of the final
  numbers.
- **Error codes:** `STORY_UNAVAILABLE` (409) appends to the shared `ServerErrorCode` union and
  the status map (§1); the union is append-only and also appended in-wave by
  `runtime-corpus-evidence` (`CORPUS_UNAVAILABLE`) and `social-match` (`MATCH_LIVE`,
  `MATCH_MAINLINE_LOCKED`).
- **Route regex:** the closed `/runs/:id/…` action alternation (`apps/server/src/rest.ts:494`)
  gains `share` and `flip` here, beside the `corpus` action the corpus sibling adds —
  append-only alternation, landing in wave order.
- The client assistance-preference version bump 2→3 (§3, rebased on the corpus sibling's 1→2)
  is browser-local versioned state, not a registered shared resource; it is recorded here for
  the review trail.

## Deviations from design

- **Opposite-side is delivered as a pack-free derived run, not an in-pack graded action.**
  `design/03:50` lists "repeat/mirror/opposite-side actions" under Outcome Drill. Outcome
  grading is authored for one side (root claim, resistance, success conditions —
  `docs/outcome-drill-grading.md:10-24`); flipping the board while keeping the authored grade
  would assert an assessment nobody authored. The mirror attempt therefore plays as Just Play
  from the same root with the pack's `opposite_side` retry note attached as attribution, and
  the objective region states that nothing is claimed. This is the audit's transformation
  doctrine applied, not a scope cut: the *action* ships one-click; the *claim* does not flip.
- No other deviations. The share token amends a documented implementation limit
  (`docs/live-sessions.md:84-86`), not a design ruling; `design/03`'s Review surface explicitly
  lists "share" (`design/03:59`).

## Acceptance criteria

Baseline, verified after Runtime Corpus Evidence archived on 2026-08-14: **424 unit tests /
72 files, all green**, and **17 ordinary browser tests** plus the optional skipped Maia
measurement at zero retries. The full suite must remain green and every criterion below adds
exercising coverage.

Unit/integration:

1. **Story:** a native run whose branch carries `outcome.reached` yields a story with the same
   moment grammar as imports, including a recorded human-divergence moment when
   `human_common` mass was persisted; a branch without a terminal outcome yields typed
   `STORY_UNAVAILABLE` (409) and no evidence enqueue; the story read never returns engine
   evidence for nodes outside the storyable path.
2. **Title:** `suggestTitle` is deterministic (same story JSON → byte-identical title) and
   total over the closed moment-kind set; persona rendering of a title that introduces a new
   square/move token or chess judgment is rejected by `voiceCheck` and falls back to the
   deterministic title.
3. **Tokens:** creation stores only the SHA-256 hash; unknown, revoked, and cascade-deleted
   tokens return the same 404 body as an unknown path; the public story projection contains no
   handle, graph, events, or write-capable field (asserted by exact-shape fixture); a
   non-storyable branch cannot be shared; and the public card's title equals
   `suggestTitle(story)` even when the sharer requested and received a persona rendering —
   the rendering never persists and never appears at `GET /shared/:token`.
4. **Provider adapter:** contract-shape, non-2xx, and timeout failures each count as one failed
   rendering and produce the deterministic fallback after the existing single retry; an
   unconfigured deployment still returns `VOICE_UNAVAILABLE`.
5. **Milestones:** a fixture attempt/schedule/derivation set projects exactly the expected
   closed event set (no invented kinds, no duplicates, earliest-row-wins), and no sentence
   matches a percentage/score/streak pattern.
6. **Flip:** the created run has the source node's FEN as root, the opposite learner side, and
   an atomic `run_derivations` row; the source run's event log and branches are byte-identical
   before and after; a caller without a source grant gets the unknown-run 404.
7. **Migration 13** applies idempotently to a fresh and an upgraded database, and all committed
   packs and fixtures validate unchanged (no pack schema change).

Browser (extending the zero-retry Playwright job):

8. Play a Just Play position run to a terminal outcome against the mock opponent; the
   attempt-complete sheet shows the Story offer and nothing story-shaped besides it; opening it
   shows moments; selecting one creates a `story-reentry` branch and play continues.
9. From the story, create a share link; a fresh logged-out context renders the card page with
   title, board, and moment sentences; after revocation the same URL renders the 404 page.
10. After a terminal, "Replay this drill as [colour]" opens a new run with flipped board
    orientation and a visible derivation link; the source run still lists its original branches.
11. `/learn` shows the earned milestones with working links into their source runs.
12. With the spoken preference enabled (synthesis stubbed), opening a marker invokes the
    synthesis API with exactly the marker's rendered sentences; with it disabled, no invocation
    occurs.

## Open questions

None.

## Changelog

- 2026-08-14: created.
- 2026-08-14: adversarial review, same day, fixed in place. (1) Register-state corrections:
  migration 13 is *reserved*, not claimed — `runtime-corpus-evidence` claims no migration, so
  the 14→13 rebase is a register renegotiation; pack schema 0.13 is claimed by
  `predicate-wave-2`, not free; the `public_tokens` ownership pin already stands at
  `rfc/README.md:131-136` (was future-tense). (2) Shared-resource collision resolved: the
  assistance-preference bump rebases 1→2 → **2→3** behind the corpus sibling's claimed v2;
  `runtime-corpus-evidence` added to `Depends on:`; the error-union and route-regex touches
  are now recorded in §7. (3) Boundary pins added: the public card's title is always the
  deterministic `suggestTitle` recomputed at render (no persisted title exists, so no persona
  or free text can reach the anonymous surface; voiceCheck's known-leak fixture re-verified at
  `packages/runtime/src/adaptive-guidance.test.ts:113`); the `external_http` request body is
  the provider's entire disclosure (no learner identity, run id, or position payload —
  hosted-ruling privacy pin); `story_read` tokens have no expiry, and §6 now states the full
  shared contract (scopes, namespace dispatch, 404 posture, lifetimes) exactly as
  `social-match` §3.5/§3.8 does; migration 13 pins literal CHECK strings per the migration-9
  lesson. (4) Numbers-rule pin in §4: skill numbers are banned, event counts over the
  learner's own rows are facts — `ten_attempts_one_root` is the latter. (5) Flip boundary
  pins in §5: mid-game FEN castling/en-passant legality-validated by the shipped
  `canonicalRunStart` path; opponent-to-move-at-root supported; cross-draft `MATCH_LIVE` gate
  on flip against live native matches recorded (owned by `social-match` §3.3).
  (6) `STORY_UNAVAILABLE` pinned into both the error union and the status map. BACKLOG row
  cite corrected to `:199-203`. Baseline note updated with the review-time tree state.
- 2026-08-14: Codex implementation review on the post-corpus tree. Dependency and
  baseline refreshed; criterion 7 corrected to migration 13; native stories pinned to
  a non-import `source.kind: "native"` response with no fabricated PGN metadata; flip
  identifiers pinned as server-minted `flip-<UUID>` values returned with derivation.
