# RFC: Adoption wave 1 — five cheap market-proven features

- **Status:** draft
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
  `archive/live-session-platform.md` (the no-anonymous-token limit this RFC amends).
  Forward-coordinated with the `social-match` draft (not yet present in `rfc/` at drafting
  time) via the shared public-token contract in §6.
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
ledgered by the owner on 2026-08-14 (`design/BACKLOG.md:198-202`). Nothing here adds a grounding
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
  `outcome.reached` reveals under every feedback policy (`docs/drill-client.md:84-85`).
  Requesting a story for a run with no storyable branch, or naming a non-storyable branch,
  returns the typed error `STORY_UNAVAILABLE` (HTTP 409). Mid-run engine evidence can never leak
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

Storage — **migration 14** (`STORAGE_VERSION` 13→14, register claim in §7) creates two tables:

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
dies with the account rather than surviving as an orphaned public window.

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
- Unconfigured deployments are byte-identical to today: `VOICE_UNAVAILABLE` (503), persona
  preference hidden (`docs/adaptive-guidance.md:108-110`).

Spoken delivery (the audio half):

- Speech is produced client-side by the browser's `SpeechSynthesis` API. No audio provider, no
  server audio path, no new external dependency.
- The versioned per-session-kind assistance preference (`docs/adaptive-guidance.md:34-44`) bumps
  version 1→2, adding `spoken: "off" | "on"` with universal default `"off"`. Stored v1
  preferences are read as v2 with `spoken: "off"`.
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
  and atomically creates: a new **position** run owned by the caller with root FEN = the node's
  FEN and learner side = the opposite of the source run's learner side, plus the
  `run_derivations` row (§2's table; kind `flip_sides`, source run/branch/node recorded). The
  requested resistance defaults to the source run's requested policy when the deployment can
  execute it, else the caller chooses; the normal capability rules apply.
- The derived run is an ordinary Just Play position run (`docs/shape-library.md:56-61`): full
  board/timeline/branch/compare/export machinery, objective region explicitly stating no pack
  is loaded and nothing is claimed.
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

The `social-match` draft (friend-link play) was **not present** in `rfc/` at drafting time, so
per the wave's coordination rule this RFC names the shared contract and specifies only the
card's read-only needs:

- `public_tokens` (§2) is the **single trust surface** for anonymous capability tokens: one
  table, hashed 32-byte tokens, a closed typed `scope` CHECK, per-token revocation, uniform 404
  non-disclosure, cascade deletion with the creating account.
- This RFC defines exactly one scope, `story_read`, and its projection contains no write
  capability and no live-session state. `social-match` adds its friend-link scopes by widening
  the `scope` CHECK in its own migration and names this RFC in `Depends on:`; it does not
  create a second token table. A Cross-draft ownership pin recording this
  ("`adoption-wave-1.md` owns `public_tokens`") is added to `rfc/README.md` §Cross-draft
  ownership pins in the same commit that lands this draft's register rows.

### 7. Register claims

Per the pre-assigned order (predicate-wave-2 → corpus-evidence → adoption-wave-1 →
social-match) and the standing register law (`rfc/README.md:16-27,41-42,73-79`):

- **Pack schema:** no version claimed. No pack field changes; `retryVariants.opposite_side`
  already exists in 0.6. The next version (0.13) is free for `predicate-wave-2`.
- **Run schema:** no version claimed. No new event kinds: the story, milestones, and card are
  derived projections; a flip creates ordinary runs; tokens and derivations are non-run tables.
- **Migration:** this RFC claims **migration 14, `STORAGE_VERSION` 13→14** (create-table/index
  only: `public_tokens`, `run_derivations`), landing behind migration 13, which the earlier
  `runtime-corpus-evidence` draft claims per the wave order. If that draft claims no migration,
  the renegotiation happens at the register per its standing rule ("a draft that cannot land
  behind its predecessor renegotiates here rather than renumbering unilaterally",
  `rfc/README.md:41-42`).
- The client assistance-preference version bump 1→2 (§3) is browser-local versioned state, not
  a registered shared resource; it is recorded here for the review trail.

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

Baseline, verified 2026-08-14 on this machine before drafting: **399 unit tests / 69 files, all
passing** (`pnpm test`), and **16 ordinary browser tests** (17 listed minus the optional
`maia-latency` measurement) at zero retries. The full suite must remain green; every criterion
below adds tests.

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
   non-storyable branch cannot be shared.
4. **Provider adapter:** contract-shape, non-2xx, and timeout failures each count as one failed
   rendering and produce the deterministic fallback after the existing single retry; an
   unconfigured deployment still returns `VOICE_UNAVAILABLE`.
5. **Milestones:** a fixture attempt/schedule/derivation set projects exactly the expected
   closed event set (no invented kinds, no duplicates, earliest-row-wins), and no sentence
   matches a percentage/score/streak pattern.
6. **Flip:** the created run has the source node's FEN as root, the opposite learner side, and
   an atomic `run_derivations` row; the source run's event log and branches are byte-identical
   before and after; a caller without a source grant gets the unknown-run 404.
7. **Migration 14** applies idempotently to a fresh and an upgraded database, and all committed
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
