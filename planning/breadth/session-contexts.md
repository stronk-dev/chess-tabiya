# General session contexts — foundation alignment (program item #3, B2/B8)

Planning-tier reconciliation of `design/03-product-breadth.md` item 3 against
shipped code, written 2026-08-12 under `planning/breadth/README.md`. Every
"exists" claim carries a `file.ts:line`; every "absent" claim carries the grep
that proves it. Nothing here amends `design/`.

## 1. Scope

| Surface | Breadth text | Gate rows owned |
|---|---|---|
| Pack-optional runs | "This requires pack-optional runs and honest dynamic/retrieved guidance" (`03-product-breadth.md:39`) | B2 |
| Just Play | normal game, chosen side/position/opponent; recognize theory/phase/structure/checkpoints as play develops; rewind/fork/compare/evidence without a pack | B2 |
| From position | FEN, PGN, shared drill URL, historical-game position, imported study/repertoire node | B2, B8 |
| Phase/structure recognition contract | BACKLOG "Automatic phase/structure recognition and re-anchoring"; exploration Q4c | B2, B4 (input) |
| Drill-in-a-URL | address a FEN/objective or pack/run directly | B8 |
| Share / spectator-safe read-only projections | "platform primitives, not late marketing additions" (`03-product-breadth.md:90`) | B8, B3 (share/export), B5 (substrate) |

Not owned here: mode contracts (item #4), multi-branch review surfaces (#5),
authored-prose delivery (#2), live roles (#8). This dossier owns the *entry and
identity* of a run and the read-only projection of one.

## 2. What ships today

### 2.1 The load-bearing question: can a run exist without a pack?

**No. Verdict: a pack is required at four independent layers, and only one of
the four has an escape hatch that the composed application never reaches.**

| Layer | Requires a pack? | Evidence |
|---|---|---|
| Wire schema | Yes | `schemas/drill_run.schema.json` `required: [… packId, packDigest …]`; `packDigest` pattern `^sha256:[0-9a-f]{64}$` |
| Runtime type | Yes | `packages/runtime/src/types.ts:188-189` — `readonly packId: string; readonly packDigest: string` (non-optional); `runtime.ts:30-38` `CreateRunInput` likewise |
| REST parse | Yes | `apps/server/src/rest.ts:198` — `packId: requiredString(value.packId, "packId")` |
| Service | Yes in the real app | `service.ts:130` `this.#packRegistry?.required(input.packId)`; `pack-registry.ts:206-211` `required()` throws `PACK_NOT_FOUND`. `application.ts:295` always constructs `new RunService(storage, { evidenceQueue, packRegistry: registry })`, so the pack-blind branch at `service.ts:145-152` is unreachable in the composed server. It is exercised only by tests that omit the registry (`server.test.ts:72`, `latency-performance.test.ts:117`, `opponent-selector.test.ts:409`) |
| Browser transport | Yes | `apps/web/src/lib/api.ts:123-129` — `CreateRunRequest` has `id/packId/policyConfig/seed/createdAt` and no `startFen` or `packDigest`, so the client cannot express the pack-blind shape even if the server allowed it |
| Client controller | Yes | `session-controller.ts:195` `startPack(packId)` is the only run-creating entry; `:417` `#requiredPack()` throws "No drill pack is active"; `:327-359` `#playOpponentIfNeeded` reads `pack.start.fen`, `packStartSide(pack)`, `pack.opponentPolicy`, `pack.spine`; `:174-177` resume fetches `/packs/:id` before it can render |
| Client render | Yes | `DrillScreen.svelte`, `CompareView.svelte`, `screen-model.ts`, `evidence-sentences.ts`, `run-state.ts` all take `DrillPackDefinition` as a required parameter (grep: 13 files under `apps/web/src` reference the type) |
| Entry UI | Yes | `App.svelte:206-212` — `/play` renders `PackList` and `onSelect` calls `controller.startPack(packId)`. No other run-creating call site exists |

### 2.2 What is already pack-independent (the assets to build on)

| Capability | Shipped? | Evidence |
|---|---|---|
| Branch/rewind/fork/compare/PGN semantics never read a pack | yes | only `packages/runtime/src/pack-pgn.ts:6` imports `@chess-tabiya/schema/drill-pack`; `runtime.ts`, `compare.ts`, `objective.ts`, `pgn.ts`, `replay.ts` do not |
| Opponent selection is pure and pack-free | yes | `rest.ts:406-418` `POST /select-move`; `opponent-selector.ts:51-56` takes `startFen` + `historyUci` + policy; `:453-457` `theory_strict` degrades to `human_common` when no spine is supplied |
| Server run mutation/graph/compare/pgn already branch on "no registered pack" | yes | `service.ts:188-191`, `:204-210`, `:251`, `:269-271`, `:384-386` via `#registeredPack()` at `:401-404` |
| Read-only follower session (spectator substrate) | yes | `session-controller.ts:179-183` `WriterSession.observe`; `run-state.ts:296-307` polls `/events?sinceSeq` every 2 s in `read_only`; `DrillScreen.svelte:353-356` banner, `:372` board input disabled |
| Reload path that does not depend on the pack query string | yes | `GET /runs/:id/events?sinceSeq=0` + `projectRun` (`session-controller.ts:169-184`); `/graph` is intentionally event-free (content-era log correction 2026-08-12) |
| Deterministic feature vocabulary | yes, but only reachable through authored rules | `objective.ts:24-67` — `rulesFact`, `materialBalance`, `fenPredicate{transposeKey, pieceOnSquare, pawnStructure}`, `checkpointReached`, `all/any/not` |
| Drill/FEN address helpers | yes, **unused** | `packages/schema/src/drill-pack/urls.ts:71-115` `formatDrillUrl` `/drill/<packId>@<version>[/<spineNodeId>]`, `formatFenUrl` `/fen/<fen>/<objectiveType>`, `parseDrillAddress`, `resolveDrillAddress`. Grep for these four names across `apps/` returns nothing; only `packages/schema/src/drill-pack.test.ts` imports them |
| Capability slots for the two surfaces | yes, honestly unavailable | `apps/server/src/capabilities.ts:22-23` `SURFACE_IDS` includes `justPlay`, `fromPosition`; `:108-109` both hardcoded `"unavailable-here"`; `apps/web/src/lib/api.ts:91-97` lists both in `PLANNED_SURFACES` |

### 2.3 Verified absences

| Capability | Shipped? | Proof of absence |
|---|---|---|
| Any phase/structure/opening recognition | no | `grep -rniE "recogni\|detector\|\bECO\b\|openingName" apps packages --include=*.ts --include=*.svelte` → four hits, all unrelated test titles (`opponent-selector.test.ts:200`, `objective.test.ts:216`, `:290`, `evidence-ref.test.ts:25`) |
| Opening book / explorer / corpus / Syzygy client | no | `grep -rin "explorer\|corpus\|syzygy\|tablebase" apps packages --include=*.ts --include=*.svelte` → zero hits |
| The word `phase` as runtime behaviour | no | non-test hits are `pack-registry.ts:55` (`phase: raw.phase`, a projected catalogue string) and `PackList.svelte:17` (marketing copy) |
| PGN import | no | `packages/runtime/src/pgn.ts:4-7` imports `makePgn` only; `parsePgn` appears in no non-test source file |
| `/drill`, `/fen`, share, or spectate routes | no | `router.ts:18-27` `STATIC_ROUTES` = `/ /play /review /learn /live /create /library /settings`; `:37` the only dynamic route is `/play/run/:runId`; `parseRoute` reads `pathname` only and discards `search` |
| Authentication or share tokens | no | `grep -rni "authorization\|cookie\|bearer\|auth" apps/server/src/*.ts` (non-test) → zero handler hits. Every run is world-readable to anyone who can reach the server; "share link" and "run URL" are the same object |
| Evidence withholding for a pack-less run | **inverted** | `feedback-policy.ts:21` `if (pack === undefined \|\| feedbackIsRevealed(pack, run)) return run.nodes;` and `:48` the same for events. A run with no registered pack publishes **all** engine evidence immediately. `service.ts:325`, `:339` gate `/evidence` and `applyEvidence` only when `pack !== undefined` |
| Evidence generation for a pack-less run | no | `service.ts:186`/`:193` and `:205`/`:212` — `if (pack !== undefined) this.#enqueueMoveEvidence(result.run)`. A pack-less run produces no evidence jobs at all |
| Honest disabling of write controls for followers | no | `DrillScreen.svelte` Fork / Compare / Export buttons carry no `snapshot.access` guard; only the board (`:372`) and the status text (`:344-345`) react. `run-state.ts:248-250` throws `NOT_ACTIVE_WRITER` client-side, so the failure is honest but the affordance is not, and the shipped `HonestControl` convention (`docs/app-shell.md` §Honest disabled controls) is not applied |
| Never-silent run creation | no | `rest.ts:192-211` `parseCreateInput` and `:156-177` `parsePolicyConfig` read known keys and construct fresh objects; unknown nested fields are dropped without error (confirmed behaviourally, content-era log CORRECTION 2026-08-12) |

## 3. The gap — what each capability needs to be minimally real

| Capability | Missing for minimal-real |
|---|---|
| Pack-optional run | A run identity that does not name a registered pack: run schema v0.5 + a run-level `start` and `feedbackPolicy`, because both are currently sourced from the pack document. Plus a never-silent `POST /runs` so the new shape cannot be half-supplied |
| Client rendering without a pack | One projection type that the eight client modules can consume in place of `DrillPackDefinition`. This is the single largest client change and it is a *substitution*, not new UI |
| Just Play entry | A route and a start form (side, start position, opponent mode, target rating), a run-level evidence boundary, and a resume/export path identical to a pack run's |
| Evidence boundary | Today "no pack" means "no withholding **and** no evidence". Both halves must flip together: pack-less runs must enqueue evidence and must carry their own reveal policy, or Just Play silently violates ADR-0006 |
| From position | FEN parse (shipped in `urls.ts:49-55`), PGN parse (`chessops/pgn` is a dependency; `parsePgn` unused), pack-spine-node start, and duplicate-from-shared-run. Each resolves to the same session-definition shape |
| Recognition | An observation type, an evidence-ref namespace, an abstention default, and a rule that authored boundaries win. No detector exists at all today |
| Drill-in-a-URL | Router entries for the two shipped address forms plus a server resolver; the parse/format/resolve half already exists and is tested |
| Share / spectator | An explicit read-only projection that does not rest on the absence of authentication, and honestly-disabled write controls in the follower view |

## 4. Contracts to pin

Each contract quotes the shipped artefact it extends.

### C1 — Run identity without a pack (run schema v0.4 → v0.5)

Shipped: `packages/runtime/src/types.ts:185-195`

```ts
export interface DrillRun {
  readonly schemaVersion: DrillRunSchemaVersion;
  readonly id: string;
  readonly packId: string;
  readonly packDigest: string;
  …
}
```

and `schemas/drill_run.schema.json` `required: [schemaVersion, id, packId, packDigest, policyConfig, nodes, branches, events, activeCursor]` with `packDigest` matching `^sha256:[0-9a-f]{64}$`.

Pin: v0.5 adds `sessionKind: "pack" | "position"`, makes `packId`/`packDigest`
nullable **as a pair**, and adds required `start: { fen, side }` and
`feedbackPolicy`. `RunStartedEvent.data` (`types.ts:94-105`) changes with it,
because resume reconstructs context from that event alone
(`session-controller.ts:169-177`). The alternative encoding — synthesising a
pack document per session so the fields stay populated — is rejected: it is the
"honest thin fixture vs theater" line, because nothing authored it and its
digest would claim provenance it does not have.

### C2 — `SessionDefinition`: the projection eight client modules consume

Shipped: `pack-registry.ts:46-73` `projectPackDocument()` already returns the
browser-safe pack shape (identity, start, objective type/summary,
`feedbackPolicy`, `opponentPolicy`, spine, checkpoints reduced to id/label/actions).

Pin: `GET /runs/:id/session` returns exactly that shape for both run kinds —
derived from the registered pack for `sessionKind: "pack"`, and from the run's
own declared definition (empty `spine`, empty `checkpoints`, generated objective
summary) for `sessionKind: "position"`. `DrillSessionController`,
`RunStateStore`, `screen-model.ts`, `evidence-sentences.ts`, `DrillScreen` and
`CompareView` change their parameter type from `DrillPackDefinition` to
`SessionDefinition`; `packStartSide` (`screen-model.ts:53-59`) and
`feedbackRevealed` (`run-state.ts:75-87`) keep their current logic unchanged.

### C3 — Run-level feedback policy (closes the pack-undefined bypass)

Shipped: `feedback-policy.ts:11-15`

```ts
export function feedbackIsRevealed(pack: PackRecord, run: DrillRun): boolean {
  return pack.feedbackPolicy === "delayed_checkpoint"
    ? run.events.some((event) => event.type === "checkpoint.reached")
    : run.events.some((event) => event.type === "segment.completed");
}
```

Pin: the policy source becomes the run (C1's `feedbackPolicy`), not the pack
record; `publicNodes`/`publicEvents` lose their `pack === undefined` early
return (`feedback-policy.ts:21`, `:48`) and `service.ts:186`/`:205` stop gating
evidence enqueue on pack presence. Registered packs keep authority: a pack run's
run-level policy is copied from the pack at creation and is not client-supplied.

### C4 — Recognition, at three explicitly separated levels

| Level | Status today | Role in the minimal-real version |
|---|---|---|
| (a) **Author-declared** transitions and boundaries | shipped, partial: frozen trigger vocabulary `atPly`, `atSpineNode`, `fenPredicate`, `materialBalance` + timing windows (`pack-orchestrator.ts:39-71`; `docs/drill-pack-format.md`). Only `atSpineNode`/`atPly` are proven against real authored content (content-era log, pack A session 2 pass (a)) | **Authoritative wherever present.** Unchanged by this item |
| (b) **Deterministic computable** features | vocabulary shipped (`objective.ts:24-67`) but reachable only through authored objective rules; no run-level evaluator, no evidence namespace | **This is what the minimal-real version uses, and the only thing it uses** |
| (c) **Learned / automatic** recognition | nothing (§2.3 grep) — exploration Q4c is `💡` | Not part of the minimal-real version. Its input is (b)'s observation stream plus labelled ground truth, which does not exist yet |

Pin for (b), extending shipped unions:

- `types.ts:11-12` `EvidenceKind = "eval" | "wdl" | "bestline"` gains `"feature"`;
  `EvidenceSource = "engine_validated" | "human_model_predicted"` gains
  `"rules_derived"`. Both are additive enum entries in
  `schemas/drill_run.schema.json` (`"enum": ["eval","wdl","bestline"]`,
  `"enum": ["engine_validated","human_model_predicted"]`).
- `evidence-ref.ts:11-13` closed grammar `rules:<fact>` / `pack:<id>` /
  `engine:<jobId>` gains `feature:<featureId>`, with the same
  `/^[A-Za-z0-9._-]+$/` id rule as `evidenceId()` (`evidence-ref.ts:15-23`).
- Observations ride the shipped `evidence.attached` event
  (`types.ts:129-136`); no new event type, so `readBackReplay` adjacency rules
  are untouched.
- **Non-authority rule, mechanical:** a `feature:` observation may never emit
  `checkpoint.reached` and may never be the sole `evidenceRefs` entry of an
  `objective.state_changed` on a run whose `sessionKind` is `"pack"`. Where an
  authored boundary exists, it wins; the observation is still recorded.
- **Abstention is the default:** a feature evaluator that does not match emits
  nothing, and the client renders the absence as absence. There is no
  "probably a Carlsbad structure" state.

Minimal-real feature set — all expressible from shipped predicates, all
abstainable, none requiring a corpus or a model: exact/containing pawn-structure
signature match against a named fixture set; material-balance threshold crossing;
queen-off (`pieceOnSquare` composition); seven-or-fewer-men count (an
eligibility fact, not a tablebase query); and first divergence from every
registered pack spine (`pack-orchestrator.ts:21-37` `activeSpineNodeId` already
computes this and returns `undefined` on divergence).

**Cannot be honestly pinned yet, and what would pin it:** the *rendering timing*
of `feature:` observations. The authored-prose delivery work established that
serving content back needs a server-side per-scope reveal contract and that the
run-global latch is insufficient (`docs/drill-client.md` §Feedback withholding).
Recognition observations inherit that question. This dossier pins the namespace,
the abstention rule and the non-authority rule; program item #2 owns when they
are shown. Structure *family names* are likewise unpinnable until
`design/04-content-architecture.md`'s families have one authored instance —
pack A is the first.

### C5 — Share token and spectator-safe projection

Shipped: `service.ts:248-259` `graph()` and `:274-277` `events()` are already
unauthenticated reads returning `activeWriterId`; `run-state.ts:296-307` already
implements the follower loop.

Pin: a per-run `shareToken` and `GET /share/:token` returning a read-only
projection built from the *same* `publicEvents` path, so the withholding policy
cannot diverge between owner and spectator. `activeWriterId` is omitted from the
share projection (it is a capability hint, not spectator information). The
client adds a `/watch/:token` route and applies `HonestControl` to Fork, Compare
and Export in follower mode. This must not be built on the current absence of
authentication: a share link is an explicit grant, and its revocation is
rotating the token.

### C6 — Never-silent run creation

Shipped: `rest.ts:192-211` `parseCreateInput`. Pin: reject unknown top-level and
nested keys with `INVALID_REQUEST` naming the offending JSON pointer, matching
the closed-vocabulary lesson from `pack-check` (`docs/drill-pack-format.md`
§Semantic authoring lint). C1 doubles the shape of this body; shipping the new
shape over a silently-permissive parser repeats the exact failure the
checkpoint-action vocabulary already demonstrated.

## 5. Slice plan

| # | Slice | Minimal real proof | Acceptance scenario | Depends on |
|---|---|---|---|---|
| S1 | **Pack-optional run identity + session projection** (C1, C2, C6) | A run created from a bare FEN plays, rewinds, forks, compares, exports PGN, survives reload through `/events?sinceSeq=0`, and appears in `GET /runs` — which needs a `user_version` migration because `RunSummary.packId` is currently required (`storage.ts:13-21`) | `POST /runs {sessionKind:"position", start:{fen:INITIAL_FEN, side:"white"}, feedbackPolicy:"delayed_checkpoint", policyConfig, seed}` → 201 with `packId: null`; the same body carrying an unknown key `policyConfigDigest` → 400 with its JSON pointer; `GET /runs/:id/session` returns the same shape for this run and for a Najdorf-fixture run | shipped runtime only |
| S2 | **Just Play entry + run-level evidence boundary** (C3) | `/play/just` starts a real run against `human_common`; engine evidence is withheld until the run's own reveal condition, then applied by the writer | Start Just Play as White from the initial position, play six plies against the mock opponent, confirm `/graph` carries no `engine:` refs before reveal and does after; rewind to ply 2, fork, compare both branches, export a legal variation PGN; capability `justPlay` flips to `available` | S1 |
| S3 | **From-position starts and drill addresses** | Four entries resolve to one session definition: pasted FEN, pasted PGN (final or selected ply), `/drill/<packId>@<version>[/<spineNodeId>]`, and duplicate-from-an-existing-run | Paste a 30-move PGN, choose the position after move 18, start a run there, play four plies, export; separately open `/fen/<encoded>/<objectiveType>` and reach a playable run; `parseDrillAddress` is called from `apps/`, not only from its test | S1 |
| S4 | **Deterministic recognition v1** (C4) | Observations from the five-feature set attach as `feature:` evidence during a Just Play run and abstain where nothing matches; on a pack run they never override an authored checkpoint | Play a Just Play run into a queenless middlegame: a `feature:queens-off` observation is attached and rendered with its source label; play the Najdorf fixture past `plan-commitment`: the authored checkpoint still fires and no `feature:` ref appears in that transition's `evidenceRefs`; play an opening with no matching signature: nothing is emitted and the UI shows no phase claim | S1, S2; renders through item #2's evidence surface |
| S5 | **Share tokens and spectator-safe projection** (C5) | A second browser opens a share URL, follows moves live, and cannot mutate — with every write control honestly disabled and explained | Writer plays three plies; a second browser at `/watch/:token` shows the same position within one poll interval, has Fork/Compare/Export `aria-disabled` with a nonempty `aria-describedby` reason, and the DOM sweep in `app-shell.test.ts` passes on the new route; rotating the token makes the old URL 404 | S1; consumed by #8 |

S1 is the highest-leverage first slice: it is the only wire-schema change in the
area, and S2–S5 plus program items #4, #5 and #6 all extend the type it defines.
S1 and S2 are the pair that makes the surface real — a pack-optional run nobody
can start or render is not a surface.

## 6. Dependencies in / out

**In**

| From | What this item needs | State |
|---|---|---|
| #1 shell (shipped) | routes, `HonestControl`, keyboard region registration, `justPlay`/`fromPosition` capability slots | shipped: `docs/app-shell.md`; `capabilities.ts:22-23` |
| #2 evidence/explanation | the per-scope reveal contract that decides *when* a `feature:` observation is shown. This dossier defines the namespace and the abstention rule; #2 defines the timing | not shipped; S4's rendering waits on it, S4's recording does not |
| content-era pack A | the authored boundary case recognition must yield to, and the first real structure family name | `content/drafts/anti-caro-advance.json` exists as a draft |
| Shipped selector | `POST /select-move` already answers without a pack (`opponent-selector.ts:51-56`) | no change needed |

**Out**

| To | What it inherits |
|---|---|
| #4 training modes | `SessionDefinition` (C2) is the type every mode contract extends; Outcome Drill from a FEN and Trajectory across phases are pack-optional runs by construction |
| #5 review | duplicate-from-run (S3) and the share projection (S5) are the export/share half of B3 |
| #6 create | the PGN/FEN import parser from S3 is the seed path for study-to-pack and session distillation |
| #7 return | run history lists pack-less runs once C1 lands, but not for free: `RunSummary.packId` is a required string (`storage.ts:13-21`) and `list()` already avoids consulting the registry, so C1 must carry a summary migration alongside the schema change (the `PRAGMA user_version` runner at `storage.ts` migration 1 is the shipped precedent) |
| #8 live | S5's read-only projection is the substrate for stream overlay and academy spectator roles |

## 7. Proposed BACKLOG row edits

Replacement rows for `design/BACKLOG.md` (proposals only — not applied here).

**Existing first cell:** `| Automatic phase/structure recognition and re-anchoring |`

```
| Automatic phase/structure recognition and re-anchoring | 📜 scheduled — breadth program item #3 slice S4. Split three ways and only the middle level is in scope: (a) author-declared boundaries stay authoritative and shipped; (b) deterministic features are the minimal-real version, riding the shipped `evidence.attached` event with a new `feature:` ref namespace, abstaining by default, and mechanically barred from emitting checkpoints or being the sole ground of an objective change on a pack run; (c) learned recognition stays exploration **Q4c** and needs (b)'s observation stream plus labelled ground truth first. Zero detector code exists today (grep 2026-08-12) | `03-product-breadth.md`, `planning/breadth/session-contexts.md` §C4, `arch/rfcs/RFC-0005` sketch |
```

**Existing first cell:** `| Just Play — normal/from-position play with branch-and-learn as the game develops |`

```
| Just Play — normal/from-position play with branch-and-learn as the game develops | 📜 scheduled — program item #3 slices S1–S2. Verified blocker: a pack is required at five layers (run schema v0.5 needed; `rest.ts:198`; `service.ts:130` + `application.ts:295`; `api.ts:123-129`; `session-controller.ts:417`). Second verified blocker: with no pack the evidence boundary inverts — `feedback-policy.ts:21`/`:48` publish everything and `service.ts:186` enqueues nothing — so a run-level feedback policy lands with the pack-optional run, not after it | `03-product-breadth.md`, `planning/breadth/session-contexts.md` |
```

**Existing first cell:** `| Share/spectate/deep links |`

```
| Share/spectate/deep links | 📜 scheduled — program item #3 slice S5. The follower half already ships (`WriterSession.observe`, 2 s `/events?sinceSeq` poll, read-only banner); what is missing is an explicit grant rather than reliance on the server having no authentication at all (grep 2026-08-12: no authorization/cookie/bearer handling), and honest `HonestControl` disabling of Fork/Compare/Export in follower mode | `03-product-breadth.md`, `planning/breadth/session-contexts.md` §C5 |
```

**Existing first cell:** `| Drill-in-a-URL |`

```
| Drill-in-a-URL | 📜 scheduled — program item #3 slice S3. Half of it already ships unused: `packages/schema/src/drill-pack/urls.ts` formats, parses and resolves `/drill/<packId>@<version>[/<spineNodeId>]` and `/fen/<encodedFen>/<objectiveType>`, and is imported only by its own test. Missing: router entries (`router.ts:18-27` has neither) and a server resolver that turns an address into a session definition | B8, `03-product-breadth.md`, `planning/breadth/session-contexts.md` |
```

**Existing first cell:** `| Pack interop: import Lichess studies / existing repertoires as pack seeds |`

```
| Pack interop: import Lichess studies / existing repertoires as pack seeds | 📜 scheduled in two parts — the *reading* half (PGN/FEN/study-node parse into a session definition) is program item #3 slice S3; the *authoring* half (annotate into a pack) is item #6. `chessops/pgn` is already a dependency and `parsePgn` is used nowhere (`runtime/src/pgn.ts:4-7` imports `makePgn` only). Still the biggest K10 lever | Q7, `planning/breadth/session-contexts.md` |
```

**New rows** (per the ledger rule that an unrecorded idea is a process bug):

```
| Run-level feedback policy for pack-optional runs | 💡 2026-08-12, found by code audit for program item #3. `feedback-policy.ts:21`/`:48` treat "no registered pack" as "reveal everything", and `service.ts:186`/`:205` skip evidence generation entirely — so a pack-optional run would both violate ADR-0006's anti-contamination default and have nothing to withhold. The reveal condition must move from the pack record to the run | ADR-0006, B2/B4, `planning/breadth/session-contexts.md` §C3 |
| Never-silent request validation | 💡 2026-08-12 (from the content-era session-2 correction, previously logged but unrowed). `POST /runs` drops unknown top-level and nested body keys without error (`rest.ts:192-211`), the same failure shape as the open checkpoint-action vocabulary: the caller writes something, the validator blesses it, nothing happens. Must land with any request-body shape change | `planning/content-era/log.md` 2026-08-12 CORRECTION, `planning/breadth/session-contexts.md` §C6 |
```

## 8. Owner-level questions

Two genuine product-intent forks; both change what the product *is*, not how it
is built.

1. **Does Just Play interrupt?** The episode model withholds feedback and stops
   at checkpoints (`01-training-model.md` §stages; ADR-0006). Just Play is
   described as "start a normal game … and let the system recognize … as play
   develops" (`03-product-breadth.md:36-39`). These pull opposite ways: a game
   that stops to announce "structure recognized" is not a normal game, and one
   that never stops is a board with a bot on it. The fork is whether recognition
   in Just Play is (i) silent until the user asks, (ii) a passive marker on the
   timeline that never blocks, or (iii) an interrupting checkpoint like a pack's.
   S4 is buildable under any of the three; the acceptance scenario differs.

2. **Is a shared run public or granted?** Today there is no authentication, so
   every run is already readable by anyone with the URL — the "share link" is an
   accident of deployment, not a decision. The fork is whether a run is public
   by default with the URL as the only secret (cheap, matches the self-hosted
   single-user posture in `plan.md` Q2), or whether sharing is an explicit
   per-run grant with a rotatable token (S5 as specified, and the only version
   that survives the product ever having a second user). This also decides
   whether a spectator can duplicate a shared run into their own — under the
   first answer that is unrestricted copying, under the second it is a granted
   capability.
