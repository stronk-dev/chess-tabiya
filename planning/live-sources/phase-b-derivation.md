# Live sources — Phase B (live-follow) and casting: RFC derivation

**Lane:** `live-sources`, the [[D947]] owner commission. Phase A is accepted
(`rfc/live-sources.md`); this document derives **Phase B** ([[D957]]) and **casting**
([[D958]]).
**Written:** 2026-08-23, by claude, on the finding that live sources is the #1 item on the
owner-interest ranking and the only lane whose owner commission is *verbatim*.
**Measured at:** HEAD `3e40491`. The tree moves continuously — codex commits while this runs —
so every line cite below was read at this HEAD, not copied from the accepted RFC. §1.3 records
what that discipline caught.
**Method:** no RFC's claim about itself and no audit's claim about the code was taken as
evidence. `[V]` = executed or read at HEAD; `[P]` = desk research from a cited dossier; `[M]` =
model knowledge or unmeasured inference, flagged as such.
**Disambiguation:** `planning/live-marker-quality/` is a *different* lane — "live markers" are
in-run assistance markers, not live games.

---

## 0. Licensing status for drafting — read this first

**A Phase B RFC IS licensed today. A casting RFC is NOT.** The lane's licence does not come
from [[D1093]]; it comes from the owner's own commission, and it has already been exercised once.

| Question | Answer | Source |
|---|---|---|
| Does [[D1093]]'s drafting mandate reach this lane? | **No, not on its own text.** Its operative sentence is *"Product-surface RFCs in **these ruled lanes** may be drafted"*, and it enumerates exactly three: [[D1031]] variants, [[D1041]] time controls, [[D1060]] famous games. Live sources is **not** among them | `design/BACKLOG.md:438` |
| Does the lane therefore need a further ruling, as the review lane does? | **No — and this is the difference between the two lanes.** Review has no per-lane ruling at all. Live sources has [[D947]], an ⚖️ **owner commission recorded verbatim**: *"where is the stuff like retrieving LIVE games (current tournaments for example) so streamers can cast or anyone can analyse?"* That row **is** the per-lane ruling D1093 says the other three lanes each have | `design/BACKLOG.md:335` |
| Has that licence been exercised and honoured? | **Yes — once, successfully.** `rfc/live-sources.md:9-14` names its exploration gate as *"the owner's verbatim commission ([[D947]] ⚖️) plus executed hands-on evidence"*, and the RFC was **accepted 2026-08-22**. A gate that admitted Phase A admits Phase B of the same commission | `rfc/live-sources.md:3,9-14` |
| Does D947's text reach Phase B specifically? | **Yes, explicitly.** The commission's lane definition names five things, and live-follow and casting are two: *"Lichess broadcast-round ingestion, third-party-grade stripping (D410), **the source-game-still-live assistance lock (D411)**, relay-vs-team-events split (D412), and **the streamer-cast / anyone-analyses compositions** over the existing overlay projection (D705)"*. Phase A discharged it only *"**partially**"*, by its own words | `design/BACKLOG.md:335`; `rfc/live-sources.md:362-363` |
| So what is *not* licensed? | **Casting.** Not for want of a lane ruling — for a **lane-internal gate the RFC set on itself**. `rfc/live-sources.md` Open question 1 is marked ⚖️ Owner, Discharge **D2**'s owner column reads `OWNER`, and [[D958]] records the row as *"blocked on owner B5 ruling pending"*. This is the lane refusing its own casting drafting until B5 is answered | `rfc/live-sources.md:370,376-380`; `design/BACKLOG.md:327` |
| Is the general exploration gate open? | Yes — owner override 2026-08-12, logged | `planning/exploration/gates.md:198` |
| Anything else gating Phase B? | **Nothing licensing; three things scheduling.** (a) Phase A is unimplemented, queued **sixth** in migration order. (b) The [[D411]] lock's designated carrier is half-built and **explicitly blocked** by [[D971]] (§3.3). (c) The `decision_class` grain Phase A claims to consume is **entirely unimplemented** (§5) | `planning/codex-queue.md:504-512`; `design/BACKLOG.md:48`; audit, §5 |

**Plainly stated, as asked.** [[D1093]] does **not** reach this lane. It does not need to:
[[D947]] is the owner's own verbatim commission and is a *stronger* licence than a derived
mandate, because it names the lane's contents in the owner's words rather than by inference.
**Phase B may be drafted now, citing D947 exactly as Phase A did.** **Casting may not** — one
owner ruling (B5, framed precisely in §4.5) is owed, and no agent has yet framed it, which is why
it has sat open since 2026-08-22.

**Two law-5 consequences, flagged not acted on.**

1. Casting **does** have an intent-tier home — `design/03-product-breadth.md:81-83`. Unlike game
   review, this lane is not proposing a surface the design tier never named. Nothing to amend.
2. The [[D412]] events-row clause is **still undischarged**: `rfc/live-sources.md:371`
   Discharge D3 is owner-owned, and `design/03-product-breadth.md:87-89` still reads
   *"…two-leg position matches, **team relays**, and later native matchmaking…"* with no
   external-relay distinction. Phase B inherits it. Propose through a BACKLOG row; never write
   `design/03` directly.

---

## 1. What Phase A shipped versus what it specified

### 1.1 The audit finding, verified

**Confirmed: zero broadcast code at HEAD.** `[V]` `grep -rni "broadcast"` over `apps`,
`packages`, `workers` → **0 matches**.

| Phase A symbol, as specified | at HEAD | evidence |
|---|---|---|
| `resolveBroadcastSource`, `splitBroadcastRound`, `sanitizeBroadcastPgn` | **absent** | grep, 0 matches |
| `ImportSource` member `{ kind: "broadcast" }` | **absent** — union is still exactly `"pgn" \| "lichess"` | `apps/server/src/import-source.ts:3-5` |
| `BROADCAST_ANNOTATION_RESIDUE` / `BROADCAST_BOARD_CHOICE_REQUIRED` | **absent** | `apps/server/src/errors.ts` carries neither |
| `source_kind` admitting `'lichess_broadcast'` | **absent — the CHECK still refuses it** | `storage.ts:4388`: `CHECK (source_kind IN ('pgn_paste','lichess_url'))`, on a `STRICT` table |
| `ImportedGameRecord.sourceKind` widened | **absent** — still `"pgn_paste" \| "lichess_url"` | `storage.ts:158` |
| `[%clk]` extraction ([[D1048]]) | **absent** | grep, 0 matches |

**What a user can do today: nothing.** A `lichess.org/broadcast/...` URL fails at
`normalizeLichessGameUrl` — the segment `broadcast` does not match
`/^[A-Za-z0-9]{8}(?:[A-Za-z0-9]{4})?$/` — raising `IMPORT_SOURCE_UNSUPPORTED: "The lichess URL is
not an individual game URL"` (`import-source.ts:53-56`). A manually downloaded round PGN is
refused by the parser (*"PGN must contain exactly one game"*, `pgn-import.ts:26`). Pasting a
single hand-extracted board **does** work — and stores its `??` / `[%eval]` / `Blunder.`
annotations verbatim, which is [[D959]], open.

**What the accepted paper promises:** URL grammar → splitter → board picker → `[%clk]`
extraction → structural strip with fail-closed assertion → the existing `importGame` path, plus
one CHECK-rebuild migration, under twelve acceptance criteria. None of it is code.

### 1.2 Why, and when it can land

Phase A is not stalled; it is **queued behind five migration positions**: `longitudinal-store` →
`bot-policy` → `campaign-core` → **`live-sources`** → `recorded-clocks`
(`rfc/README.md:279-284`), with codex instructed *"Do not take this before the positions ahead of
it land"* (`planning/codex-queue.md:511-512`).

**Consequences for Phase B, so the author does not discover them late:** its migration position
is **behind `recorded-clocks`** (seventh); the next free storage version is **26**
(`STORAGE_VERSION = 25`, `storage.ts:631`); its run-schema lane, if it needs one, is **0.20**
(0.18 is `bot-policy`'s, 0.19 `recorded-clocks`' — `rfc/README.md:139-140`).

### 1.3 Line-cite drift — Phase A's citations no longer resolve

Re-reading at HEAD caught this. An implementer following the accepted RFC literally lands in the
wrong place.

| claim | cite in accepted RFC | actual at HEAD `3e40491` |
|---|---|---|
| `imported_games.source_kind` CHECK | `storage.ts:3356` — cited **four times**, including the `tabiya-claims` block codex implements against | **`storage.ts:4388`** |
| `pgn: source.pgn` retained verbatim | `service.ts:555` | **`service.ts:846`** |
| `importGame` span | `service.ts:497-568` | **`service.ts:787-858`** |
| 64 KiB body cap | `service.ts:504-505` | **`service.ts:795-797`** |
| `AssistanceContext` shape | `assistance.ts:21-27` | **`assistance.ts:22-30`** — and it has gained a field (§3.2) |
| `AssistancePermission` | `assistance.ts:20` | **`assistance.ts:21`** — still four members; `intent-presets`' `"legal"` never landed |
| resolved-source shape | `import-source.ts:85-90` | **`import-source.ts:7-12`** |

**Recommendation:** cite by **symbol name plus a quoted fragment** wherever the target is inside
`service.ts` or `storage.ts` — 2,300 and 4,400 lines respectively, edited by every landing lane.
Correct Phase A's four cites before codex implements against `3356`.

---

## 2. The live-follow mechanism

### 2.1 The endpoint contract, measured

| fact | value | grade |
|---|---|---|
| `GET /api/stream/broadcast/round/{id}.pgn` — chunked, held open, **no auth for public rounds** | — | `[V]` `live-relay-as-drill-source.md:75-105` |
| First burst | **0.24 s**, delivering the entire round (42,672 bytes, all 26 games) | `[V]` `rfc-derivation.md:71-74` |
| Polling the plain endpoint | **4.57 s** for a 45-game round (220 KB), byte-identical across 3 samples; Lichess's docs call polling *"slow, and very inefficient"* | `[V]`/`[P]` `rfc-derivation.md:68-79` |
| Update shape | **the entire current PGN of one game**, re-sent on every move, keyed by `[GameURL]` | `[V]` `live-relay-as-drill-source.md:75-83` |
| Observed rate | 90 s window → 82,922 bytes, 54 `[Event` chunks = the 42-game dump **plus 12 update pushes**; one board seen twice at 20 then 20½ plies | `[V]` `live-relay-as-drill-source.md:74-79` |
| Rate policy | *"Only make one request at a time"*; 429 → wait one minute | `[V]` `live-relay-as-drill-source.md:107-115` |
| Organiser delay | `delay` 0–3600 s is a round-creation field — an upstream-delayed feed is **still a live game** | `[V]` `live-relay-as-drill-source.md:128-131` |

**An update is a whole-game snapshot, not a delta.** A follower must **diff** each push against
what it holds. This drives §2.4.

### 2.2 ⚠ The two evidence bases in this lane disagree about whether to hold a connection

**This conflict is not recorded anywhere and it changes Phase B's architecture.**

- **The harness (2026-08-22, executed):** 0.24 s vs 4.6 s, *"streaming beats polling
  decisively"*, and Phase A §5 says *"which is why Phase B's follower is a held stream"*
  (`rfc/live-sources.md:264-268`). `[V]`
- **The dossier (2026-08-16, landed research) recommends the opposite** — verbatim,
  `design/research/live-relay-as-drill-source.md:530`:

  > Long-lived streaming connection | **new, and avoidable — recommend avoiding it.** Every
  > outbound fetch in the server today is a bounded one-shot; `/api/stream/broadcast/round` is an
  > open socket with reconnect, backpressure and lifecycle concerns the process has never had.
  > **Two polite one-shot fetches — one at import, one when the learner returns — deliver the
  > entire product value at zero architectural cost. Take the stream only if a live spectator
  > wall is later specified.**

**The dossier's own escape clause resolves it, and couples Phase B to the B5 ruling.** *"Take the
stream only if a live spectator wall is later specified"* — a cast **is** a live spectator wall.
So:

| if the owner rules casting… | the follower should be… | why |
|---|---|---|
| **in scope** (B5 option 2 or 3, §4.5) | a **held stream** | a cast audience needs push latency; the harness numbers justify the socket |
| **out of scope** (B5 option 1) | **two polite one-shot fetches** — one at import, one on return | the solo analyst does not need sub-second updates; the dossier's *"entire product value at zero architectural cost"* holds, and the server keeps its bounded-fetch property |

**The RFC author must not pick the held stream by default.** Phase A's §5 sentence asserted it
without noticing the dossier's recommendation. This is gap 4 and it is the single largest
architectural consequence of the B5 ruling — which is itself an argument for asking B5 *before*
drafting.

### 2.3 The follower — shape and lifecycle (if the stream is ruled in)

Nothing at HEAD holds a connection. `import-source.ts` is request/response only: a module-global
`serial` promise chain (`import-source.ts:21`), a 10 s `AbortController`
(`import-source.ts:35,70`), 429/5xx → `IMPORT_SOURCE_UNAVAILABLE` with `retryAfter`
(`:38,80`). **A held stream must not join that chain** — it serialises to one in-flight request,
so a held connection would block every import in the process forever. Hard constraint, not a
preference (derivation gap 7).

| stage | behaviour | why |
|---|---|---|
| **open** | first follower of round `R` opens the stream; later followers of the same round attach to it | the rate policy is per-IP; N learners must not be N connections |
| **first burst** | full round in ~0.24 s, indexed by `[GameURL]` | this index and Phase A's board-picker payload are the same structure — build once |
| **update** | whole-game push routed by `[GameURL]` to followers of that board; diff; grow (§2.5) | pushes are per-game, so fan-out is per-board |
| **idle** | no followers → close after a grace period | a round with no audience must not hold a socket |
| **round end** | upstream `finished` **and** all boards terminal | **the D411 release trigger** (§3.4) — the follower is the only thing that knows |
| **connection loss** | reconnect, backoff ≥ 1 min on 429; **the lock stays ON while disconnected** | fail-closed |
| **process restart** | followers are **not** durable state; re-derive from the source records that declare a followed round | avoids a follower table; the record is the authority |

### 2.4 ⚠ The unmeasured trap: upstream prefix revision

`[M]` — **not measured, and it must be before an RFC is accepted.** Because each push is a
whole-game PGN and relay operators transcribe OTB games by hand, a push can plausibly *correct*
an earlier ply, not merely extend it. The dossier records no observation of corrections,
retractions or revisions (grep-verified across the file), so this is inference, not evidence.

**Harness task, one afternoon, same instrument class as the D414 harness:** hold
`/api/stream/broadcast/round/{id}.pgn` on a live round for 30–60 minutes, record every push, diff
each against the previous push of the same `[GameURL]`. Report how many pushes were pure suffix
extensions, how many revised an earlier ply, and how many revised only a header (result
corrections being the likeliest case).

### 2.5 The growth model — priced against what actually ships

This is the lane's hardest decision. Two audits at HEAD changed the answer materially from what
the Phase A derivation assumed.

#### The five constraints, measured

**C1 — run identity is content-addressed over the *complete* mainline, and it is *sealed*.** `[V]`
`movetextDigest` is computed once over `{rootFen, uci[]}` (`service.ts:804-807`), placed inside
the imported `SessionSource` (`packages/runtime/src/session.ts:20-26`), and hashed into
`run.sessionDigest` by `digestSessionSource` (`session.ts:113-120`). That digest is written into
the **`run.started` event** (`runtime.ts:209`) and **re-derived from `events[0].data` on every
projection** (`events.ts:377`), with `projectRun` refusing a second `run.started`
(`events.ts:183-184`). **There is no writer.** To change it you must rewrite event #1, which
`appendEvents` cannot do (`events.ts:389-397` re-projects `[...run.events, ...appended]`), and
`read()` replays the stored snapshot on every load (`storage.ts:1718-1729`, throwing *"Stored run
snapshot failed replay"*). A grown mainline cannot be re-digested. **This is not "expensive"; it
is structurally impossible without a `DRILL_RUN_SCHEMA_VERSION` bump and a storage migration.**

**C2 — `sessionDigest` is stamped into artifacts that outlive the run.** `[V]` It is the
`policyConfigDigest` for opponent selection (`rest.ts:1357`, `service.ts:2274`,
`session-controller.ts:560`), the `TabiyaSession` PGN export header (`packages/runtime/src/pgn.ts:69`),
and the provenance string on a distilled pack (`distill.ts:95`).

**C3 — `imported_games` is INSERT-only.** `[V]` One INSERT (`storage.ts:1747-1753`), two DELETEs
(`:2104`, `:2163`), and **no `UPDATE imported_games` anywhere in the repo**. `run_id` is the
PRIMARY KEY, so a re-import cannot even insert a second row. `pgn`, `result`, `movetext_digest`
and `imported_at` are write-once. The table is `STRICT`, so adding a column needs migration 26 —
**and `account-data.ts:417` asserts a closed `exactKeys` set over the record's eight fields**,
which fails on any column addition not made in lockstep.

**C4 — rewind, branch and compare are prefix-stable and tolerate growth.** `[V]` This is the
audit's most useful correction to the pessimistic assumption. Rewind is *purely a cursor move*
emitting `run.rewound`; **no node is ever deleted** (`runtime.ts:386-419`, `events.ts:208-216`).
`branchPath` derives a branch head per call as the last node carrying that `branchId`
(`branch-path.ts:21-41`), so appending mainline nodes after alt-branch nodes still resolves
correctly. `branch.forkNodeId` pins a fork permanently (`runtime.ts:107`) — **a fork taken at ply
25 stays at ply 25 even if the mainline later reaches ply 60, which is exactly the semantics a
followed game wants.** Compare recomputes `leafNodeId` and `maxOffset` per call
(`compare.ts:230-241`); growth only makes the reference column taller, a presentation
consequence, not a correctness one. **Rewind/branch/compare are not the obstacle. Identity is.**

**C5 — landed research already ruled on this, and no lane document cites the ruling.** `[V]`
`design/research/live-relay-as-drill-source.md:389-397`, verbatim:

> Once snapshotted, nothing about the source can alter the run. So `design/05` §1 — *"the run is
> the sole source of chess truth […]"* — **survives untouched, on one condition: the snapshot
> must be a copy, not a live reference. A run that *follows* a broadcast would break the
> invariant outright and must never be built. The source moves; the run does not.**

**Append-to-run is already refused by landed research on the invariant the whole product rests
on.** The Phase A derivation's gap 2 posed it as an open fork; it is not one.

#### The three options

| | **A. Re-import per update** | **B. Append to run** | **C. Followed source object** |
|---|---|---|---|
| shape | each push creates a fresh `imported` run | one run whose mainline is extended in place | the followed game is a **separate growing record**; runs are *cut* from it, each immutable |
| run identity (C1/C2) | ✅ untouched | ❌ **structurally impossible** without a schema-version bump + migration | ✅ untouched |
| the C5 ruling | ✅ complies — each run is a copy | ❌ **refused outright** by landed research | ✅ complies — *"the source moves; the run does not"* is literally its design |
| rewind/branch/compare (C4) | ✅ intact per run | ✅ intact | ✅ intact |
| learner branches survive an update | ❌ **no** — a fork at ply 30 is stranded when ply 31 arrives | ✅ yes | ⚠️ branches live on the cut, which does not grow; following on means a new cut |
| storage (C3) | needs `run_derivations.kind` to gain `'broadcast_refresh'` (STRICT rebuild, `storage.ts:3853`), reusing shipped `createDerivedRun`/`derivationFor`/`derivationsFrom` (`storage.ts:1933-1945`) | needs `imported_games` UPDATE — a column set that does not exist, plus the `exactKeys` lockstep | one new table; `source_kind` already widened by Phase A |
| evidence cost | ❌ a full mainline eval pass **per push** | ⚠️ new nodes only | ✅ deferred to the cut — which is what the learner asked for |
| register cost | migration 26 | migration 26 **+ run-schema lane 0.20 + a redefinition of accepted digest semantics** | migration 26, **no run-schema lane** |
| honest to the learner | ⚠️ "your game became a different game" | ⚠️ the board changed under them | ✅ "this is a snapshot of a game in progress; take another when you like" |

**Recommendation: C.** It is the only option that satisfies C1, C2 and C5 simultaneously, its
evidence cost is bounded, and it needs no run-schema lane. It is also the honest product
sentence: *a live game is a stream; a run is a snapshot you took of it.* **A is the acceptable
fallback** if the owner wants Phase B in one sprint — it complies with C5 and reuses the shipped
`run_derivations` linkage, at the cost of stranding learner branches. **B should be recorded as
refused, with C5 as the reason**, rather than carried as an open option.

**⚖️ This remains an owner-level fork** (§6, gap 3) — not because B is live, but because C makes
a product statement: *a followed game and a run are different objects.* That is the owner's to
make.

#### The shipped precedent to follow

`importLeg` (`live-session.ts:237-251`) already appends a parsed PGN mainline into an
**existing** run: root-FEN equality gate (`:242`), fork into a labelled branch (`:245`), a commit
loop identical in shape to `importGame`'s (`:247`), and **two independent idempotence guards** —
`if (existing.branchId !== null) throw "Arena leg was already imported"` (`:248`) and, at SQL,
`UPDATE arena_legs … WHERE … AND branch_id IS NULL` with `if (changed.changes !== 1) throw`
(`storage.ts:3252-3254`). It persists via `saveArenaImport` under the lease guard. **This is the
template for a source-to-run cut**, and its two-guard un-repeatability is the pattern Phase B
should copy rather than invent.

### 2.6 🐞 A live defect this lane's conditions would open

`[V]` **Found by the HEAD audit and, as far as this derivation can tell, unrecorded.**

`commitMove` does **not** fork at a childless leaf (`runtime.ts:299-306`), and `importGame`
leaves `activeCursor` at the mainline tip on `branch:0`. There is **no `sessionKind === "imported"`
guard** in `RunService.move()` (`service.ts:944-968`) or `opponentPly()` (`:970-1006`). So
`POST /runs/:id/moves` on an imported run whose cursor is still at the tip **appends a node with
`branchId = <run>:branch:0` — literally extending the imported mainline**, indistinguishable from
the imported plies except by `createdAt`.

Today this is latent, because `commitMove` throws `runTerminated` at a terminal tip
(`runtime.ts:281-286`) and finished imports are terminal. **It opens for `Result "*"` imports —
which is precisely the live-broadcast case.** The web UI never exercises it (`App.svelte:852`
routes imported runs to `"story"`, and re-entry rewinds-then-forks, `:409-415`), but the REST
route is open.

**Phase B must close this before it ships a single unfinished import**, and the fix is
independent of the growth model: refuse a user move at the mainline tip of an imported run, or
force the fork. It also interacts with §4.4, where the same hole is reachable from the casting
surface with an engine on the other end.

### 2.7 Move-0 follows

Phase A's convention is *"a board becomes importable at its first move"* (`live-sources.md:113`),
enforced by `requireMoves: true` (`service.ts:797`; `pgn-import.ts:38-39`). **Under option C this
stops being a special case:** a followed source with zero moves is a legal empty record; only the
*cut* needs a move, and the cut is a user action. Under A or B it needs a `requireMoves` exception
and a zero-node run — verify `createRun` accepts one before promising it.

---

## 3. The [[D411]] live-lock

### 3.1 The obligation, and why it is the lane's one non-negotiable

[[D411]], verbatim (`design/BACKLOG.md:811`):

> **Assistance must be lockable on "the source game is still live."** A learner drilling a
> position from an in-progress broadcast could otherwise read our evidence rungs while the real
> game is still being played — which is why organisers ship delays of up to 3600 s and Lichess a
> 3-move stream delay.

Organisers ship those delays (`live-relay-as-drill-source.md:128-131`) precisely to stop the
audience feeding information back to the board. A learner drilling a live position with
`analysis` on is holding a Stockfish evaluation of a position two grandmasters are currently
thinking about. That is not a privacy bug or a licensing bug — it is an assistance device for
cheating at an ongoing tournament game, and in a cast it leaks to every viewer at once.
**Every lock decision in this lane resolves fail-closed, and the RFC should say so once, at the
top, in those words.**

### 3.2 Where it is pinned: the ceiling term, as a dynamic bit

`intent-presets` §2 quotes `design/05:230-232` byte-exactly:

> **Effective assistance is `requested preset ∩ workflow/session ceiling ∩ honesty/access ∩
> source availability` — every term only narrows.** A workflow or session ceiling can only remove
> assistance, never add it.

`rfc/intent-presets.md:102-119` types all four terms. **The live-lock is the second term** — and
"can only remove, never add" is exactly a lock's semantics.

`AssistanceContext` at HEAD (`packages/runtime/src/assistance.ts:22-30`) is
`{ sessionKind, workflowContext, deliveryOpen, role, seatedInContest, reviewing }`.
`sourceGameLive: boolean` joins that list.

**The measured argument against a new `WorkflowContextId`** — stronger than the derivation's
"ripples through every table": `assertPresetFoundation` **hard-asserts the grid arithmetic**,
throwing `CONTEXT_PRESET_INVALID` unless the admitted/refused pair counts are exactly **28 and
12** (`packages/runtime/src/presets.ts:89-92`). A ninth context makes the grid 5×9 = 45 and
**throws at module load, in client and server both**. It is not merely expensive; it breaks a
shipped compile-time invariant. And it is the wrong shape anyway: liveness is session state that
*releases*, whereas `deriveWorkflowContext` is a pure function of
`sessionKind`/`feedbackPolicy`/`liveKind` (`presets.ts:107-119`) — none of which can know whether
a real game is running.

### 3.3 ⚠ The carrier problem — the ceiling term is only half-built

**No lane document records this, and it changes Phase B's shape.**

| `intent-presets` specifies | at HEAD | evidence |
|---|---|---|
| closed vocabularies, module/context tables, `deriveWorkflowContext` | ✅ **landed** | `presets.ts:5-13,40-51,107-119`; called at `service.ts:2052` |
| `AssistanceContext` gains `workflowContext` | ✅ **landed** | `assistance.ts:24` |
| **`permittedAssistance` reads it** | ❌ **not landed** — the body reads `deliveryOpen`, `seatedInContest`, `role`, `reviewing` and **ignores both `sessionKind` and `workflowContext`** | `assistance.ts:31-34` |
| `ContextContract` / `configClamp` | ❌ **absent** — what shipped is `WorkflowContextPolicy`, with `moduleCeiling` but **no `configClamp`** | grep: 0 matches; `presets.ts:23-29` |
| `AssistancePermission` gains `"legal"` | ❌ **not landed** — still four members | `assistance.ts:21` |

The blocker is named: `rfc/intent-presets.md:3` — status *implementing* — and **[[D971]] blocks
*"the exact config projections and clamps, compiler, preset pill, and footer"*** pending
amendment and re-review (`design/BACKLOG.md:48`).

D411's row predicted a version of this (*"the first consumer of `permittedAssistance`'s
declared-and-unread `sessionKind`"*), but at HEAD there are now **two** declared-and-unread
fields, not one.

**Two ways out:**

| option | verdict |
|---|---|
| Wait for [[D971]] | ❌ couples the owner's #1 lane to an unrelated blocked amendment |
| **Land the bit in `permittedAssistance`'s body directly**, as `seatedInContest` already is | ✅ **recommended.** `seatedInContest` proves the pattern: it locks `humanSplit`/`corpus` to `locked_off` and clamps lighting/arrows to `"sight"` **with no `configClamp` at all** (`assistance.ts:32-34`). `sourceGameLive` clamps harder, the same way, and migrates into the clamp table when D971 lands |

**State this explicitly in the RFC**, so the pinning is not misread as a dependency.

### 3.4 Fail-closed release semantics — exactly what re-opens

**The rule: the lock is ON unless we have positive evidence the game is over.** Every unknown
resolves to locked.

| trigger | lock | rationale |
|---|---|---|
| source created from a round flagged `ongoing` | **ON** | default |
| board `Result` is `*` | **ON** | the parser coerces anything non-terminal to `"*"` (`pgn-import.ts:57-60`) |
| board terminal **AND** round `finished` | **OFF** | both arms — see below |
| board terminal, round still `ongoing` | **ON** | the *round* is the delay unit; a finished board in a live round still leaks (shared prep, pairings, a teammate still playing) |
| follower connection lost | **ON** | fail-closed |
| server restart, liveness unknown | **ON** until re-derived | fail-closed |
| manual Phase A import of a broadcast board | **ON** unless the round is verifiably finished | Phase A ships **no** liveness check at all |

**AND, not OR.** The Phase A derivation proposed *"both, OR-ed safe-side"*
(`rfc-derivation.md:315-317`). OR is the **unsafe** direction — it releases as soon as *either*
arm says finished. Fail-closed is **AND**. This corrects the earlier derivation.

**What re-opens on release, precisely:** `sourceGameLive` flips false and the ceiling term stops
clamping, restoring the `imported` context's shipped ceiling — `quiet`, `guided`, `theory_only`,
`analysis`, module ceiling = everything except `blunder_prevention` (`presets.ts:44`). Nothing
more. The lock never *grants*; releasing it merely stops it narrowing, which is what *"every term
only narrows"* requires.

### 3.5 The lock needs two arms and must close four doors

**A config clamp alone is bypassable by an API caller.** The repo already accepts this:
`#refuseWhileMatchLive` throws `MATCH_LIVE: "Pause the match before rehearsing or revealing"`
(`service.ts:2061-2067`, also `:2076`) — a **server-side refusal on the route**, for exactly this
class of problem. `SOURCE_GAME_LIVE` is the natural sibling code beside `MATCH_LIVE` in
`errors.ts:48`. Cite the precedent; do not reinvent it.

| door | code at HEAD | why the lock must close it |
|---|---|---|
| **the evidence pass** | `importGame` calls `#ensureStoryEvidence(run, run.branches[0]!.id)` **unconditionally** (`service.ts:857`), enqueuing a Stockfish `eval` for **every mainline node** (`service.ts:1998-2021`) | the primary leak. And the pass is **idempotent-completing** — it re-walks `branchPath` on every story read and enqueues anything lacking a durable eval (`:2013-2019`), so **a growing live game auto-enqueues evals as it grows**. The dossier already saw this: *"Running fifty engine jobs over a game still being played is both wasteful and… the wrong instinct. **A live root should enter play directly, not through a story**"* (`live-relay-as-drill-source.md:535-541`) |
| **`story()`** | `service.ts:876-879`: for an imported run `importedMainline` is true whenever `branchId === run.branches[0].id` — **the mainline story needs no outcome at all**, only `feedbackDisclosed(run)` | and for `attempt_end`, `feedbackDisclosed` is satisfied by a single `feedback.revealed` event (`packages/runtime/src/feedback.ts:13-16,22-30`) — **one user click**. Nothing here knows about the source game |
| **branch comparison** | `compare.ts:218-313`; recomputed per call | a live board's *comparison* leaks as much as its evaluation |
| **export / public tokens** | `pgn.ts:69`; `PublicTokenRecord` scope `story_read` (`storage.ts:167-169`) | a token minted over a live run outlives the session |

### 3.6 ⚠ The release and the contamination spike coincide

`[V]` Ongoing rounds carry `[%clk]` but **no `[%eval]`** — Lichess analyses once the game ends
(`rfc-derivation.md:50-53`). So third-party-verdict pressure is **lowest** while live and
**highest at the exact instant the game finishes** — which is the instant the D411 lock releases.
**The strip and the release fire together, and the RFC must order them: sanitize, then release.**

---

## 4. Casting proper

### 4.1 The promise and the ruling

`design/03-product-breadth.md:81-83`, verbatim:

> **Streamer/Twitch:** the streamer owns the live board; chat votes on plans or moves; the host
> snapshots, rewinds, branches, compares, and exposes an overlay. Viewers do not need full
> synchronized clients.

[[D705]]: *"coach and streamer need explicit workflow compositions, not new evidence modes.
Stream can bind the existing overlay/vote/marks projection."*

### 4.2 What ships today

`[V]` `LIVE_SESSION_KINDS = ["stream","academy","match"]` (`packages/runtime/src/types.ts:38`),
aliased server-side (`live-types.ts:5`). `stream` is a registered `WorkflowContextId`
(`presets.ts:5-6`), reached by `deriveWorkflowContext` on `liveKind === "stream"`
(`presets.ts:113`), admitting `quiet`, `guided`, `theory_only`, `analysis` with a ceiling of
everything except `blunder_prevention` (`presets.ts:46`).

The overlay's **rendered output** is one inline branch in `App.svelte:1077` — a disabled
`Chessboard` with relayed marks, plus an aside carrying `objectiveState`, branch count, mark
attribution, the vote prompt and per-option tallies, and the sentence *"Host is ahead; evidence is
withheld until this run discloses."* Votes are host-authored, server-bounded to **2–8 legal
options** over 15–600 s (`live-session.ts:197-199`), spectators may vote
(`authorization.ts:33-35`), and relayed chat votes land in a disjoint `chat:<adapter>:<key>`
namespace with an explicit unverifiability disclosure (`live-session.ts:210-215`;
`live-vote.ts:5-8`). Polling is 2 s (`App.svelte:348`).

### 4.3 The collision: casting is the highest-leverage version of the D411 leak

`imported` (`presets.ts:44`) and `stream` (`presets.ts:46`) are the **two highest-ceiling
contexts in the registry after `position`** — both admit `analysis`, whose module set includes
`full_inspector` (`presets.ts:35`). `match` is the only context locked to `quiet` + `rules_floor`
(`presets.ts:45`). So a live-followed board sits, in **both** its solo and its cast context, at
near-maximum assistance, on a game still being played, in front of an audience.

And `docs/live-sessions.md:131-140` records an **accepted limitation** that reads very differently
once the board is a live tournament game: *"A streamer cannot be forced to play blind while their
audience sees more evidence: the streamer can grant and use a second spectator account… It
protects every reader from premature evidence; it does not pretend to prevent a host from cheating
on themselves."* **Cheating on yourself is a fine thing to permit in a rehearsal. It is a
different thing when the board is a game two grandmasters are still playing.** The RFC must say
whether that accepted limitation survives contact with a live source, or whether a followed run is
the case where it does not.

### 4.4 🐞 The overlay is NOT a read-only projection, and casting is therefore not free

**This derivation set out to confirm that locking the run locks the overlay for free. The HEAD
audit refutes it.** `[V]`

`docs/live-sessions.md:106-107` states: *"The overlay uses the same run projection and feedback
barrier as the player; it is not a second evidence surface."* **True of the rendered markup and
of the barrier. False of the mount.** The overlay route calls `controller.resume()`
(`App.svelte:311`), and `session-controller.ts:202-237` then issues `api.capabilities()`,
`api.graph()`, a full `shapes` catalog fan-out (`:659-662`), `api.authoredFeedback()`
(`:574-578`), and — the serious one — **`#playOpponentIfNeeded()`** (`:228`).

`#playOpponentIfNeeded` (`session-controller.ts:498-531`) short-circuits **only** when
`this.#matchMode !== undefined` (`:499`), access is `read_only` (`:504`), the position is
terminal, or it is the learner's turn (`:509-517`). Otherwise it calls
`await this.#api.selectMove(...)` — a Maia/engine provider request — and then `appendOpponentPly`
(`:522-524`), **committing a ply to the run from the overlay tab**. `matchMode` is set only for a
`match` session (`App.svelte:310`), so for a **`stream` session it is `undefined` and the guard
does not fire**. Access is `writer` whenever the browser profile holds the run's writer id, which
is `localStorage`-keyed and therefore **shared across tabs of the same origin**
(`writer-session.ts:8-10,39-47`). A streamer opening the overlay in a second tab hits exactly
this. Once running as writer, `run-state.ts:370-391` also starts a **1 s
`evidence`/`applyEvidence` poll**.

**Compose that with §2.6 and the lane's own subject matter:** cast a live-followed board as a
`stream` session, and the overlay — finding a non-terminal position where it is not the learner's
turn — will **ask Maia for a move and commit it onto the imported mainline**, on behalf of a
grandmaster who has not moved yet. Indistinguishable from the real plies except by `createdAt`.
That is a manufactured chess claim about a game in progress, rendered as if it happened: a **law
8** violation reached without anyone writing a line of new code.

**Consequences for the RFC, stated plainly:**

1. **Casting v1 is not "zero building".** It requires at minimum an imported/followed-source guard
   in `#playOpponentIfNeeded` — or better, server-side in `move()`/`opponentPly()` per §2.6, since
   a client guard is not a guarantee.
2. **The safety property casting rests on must be tested, not assumed.** The acceptance criterion
   is: a cast of a locked run issues **no** provider query and commits **no** ply, asserted at the
   API boundary — not by inspecting the markup.
3. `docs/live-sessions.md:106-107` should be corrected to something like: *the overlay's rendered
   output carries no evidence, but the overlay route mounts a full session controller.* That is a
   docs edit riding this lane, and it is worth a ledger row on its own because it misleads any
   reader reasoning about overlay safety — as this derivation initially was.
4. **`play-composition` does not reach the overlay.** `rfc/play-composition.md` never mentions
   `/live/overlay/:runId`, a live session, or casting; its ~20 `overlay` occurrences all mean the
   §Specification layout primitive (a non-layout paint layer, `:120-121`). The live overlay
   imports nothing from the geometry authority (`play-composition.ts:26-62`) and hand-rolls its
   CSS (`App.svelte:1175-1176,1194`). So the brief's framing — *"the overlay is a projection of
   run state, not a new screen"* — is the **intended** contract, not the shipped one. Casting
   needs either an explicit extension of `play-composition`'s scope or its own composition
   contract.

### 4.5 The B5 ruling, framed precisely

**This is what the owner is being asked. It has never been written down.** [[D958]] says "blocked
on the owner's B5 ruling"; `rfc/live-sources.md:376-380` calls it "justification order". Neither
states the decision.

**The B5 revival conditions, verbatim** (`design/03-product-breadth.md:423-430`):

> **Live session platform (B5)** — *moved to last*: … Ordered last because none of it can be
> validated by use without other humans (a streamer audience, a coach, an opponent); its BACKLOG
> revival conditions — **singleplayer loop validated and fun; a coach partner or community
> existing** — remain in force and are the real trigger.

And the dossier's binding verdict (`live-relay-as-drill-source.md:430-437`): *"A live relay does
not relieve that condition; it makes the surface more attractive to a streamer we do not have."*

**The question, in one sentence:** *B5's machinery is already shipped (`gates.md:243`,
"mechanically shipped 2026-08-13"), but its revival conditions bar further investment until a
streamer audience exists. Casting-over-a-followed-run is a composition over that already-shipped
machinery. Does it count as new B5 investment (gated), or as Phase B wiring (ungated)?*

| option | what it means | cost | second-order effect |
|---|---|---|---|
| **1. Gated** — casting waits for B5 revival | Phase B ships the follower, the growth model and the lock; the `stream` binding waits | Phase B is fully useful solo. Cost: the commission is honoured in one half, and *the word the owner used first was "cast"* | **the follower becomes two one-shot fetches** (§2.2) — cheaper, and the dossier's recommendation |
| **2. Ungated as wiring** | bind a followed run to the existing `stream` session and overlay; ship no new stream-side surface | **no longer free** — §4.4 adds a real guard plus its criteria. Still small. Risk: B5 investment wearing a wiring label | **justifies the held stream** (§2.2) |
| **3. Casting leads** | Phase B is scoped and sequenced around the cast, discovery UI included | reopens the B5 revival condition as a **standing** decision; the dossier argues against it on evidence | held stream, plus B5's real backlog (chat bridge, editorial delay) |

**Recommendation: option 2, with a hard fence.** The owner named casting in the commission, and
the wiring is still small even after §4.4. The fence that keeps it honest: **Phase B may bind a
followed run to the existing `stream` session and the existing overlay, and may ship no new
stream-side surface, no chat bridge, no Twitch/YouTube/OAuth integration and no editorial delay**
— the four things [[D704]] measured as absent and which are B5's real work. Guard it with the grep
pattern Phase A criterion 10 already uses (`live-sources.md:333-336`), and option 2 cannot
silently become option 3.

**But it is the owner's call, not the RFC author's** — it is a decision about whether a standing
gate applies, and gates are intent tier. Note also that the ruling **selects the follower
architecture** (§2.2), so asking it before drafting saves a rewrite.

---

## 5. The seams

| seam | state at HEAD | what Phase B consumes | what Phase B must add or resolve |
|---|---|---|---|
| **`intent-presets`** | accepted, *implementing*; [[D971]] blocks the clamps | the ∩ algebra as the lock's home (`rfc/intent-presets.md:102-119`); the `stream` ceiling (`presets.ts:46`); `deriveWorkflowContext` (shipped) | `sourceGameLive` as a dynamic `AssistanceContext` bit (`assistance.ts:22-30`) read inside `permittedAssistance` (`:31-34`) — **not** a ninth `WorkflowContextId`, which `assertPresetFoundation`'s 28/12 assertion forbids (`presets.ts:89-92`). **Must state it does not depend on D971** (§3.3) |
| **`longitudinal-store`** | accepted; **entirely unimplemented** — `decision_class` has **zero** code hits across `apps/`, `packages/`, `workers/`, `schemas/`; neither `learner_observations` nor `learner_structure_stats` exists | the three-value grain `('played','game','predicted')` (`rfc/longitudinal-store.md:170,181`) | **The brief's question — a followed game is neither `played` nor quite `game` — resolves to `'game'`, and the RFC already says why.** §4.2's derivation rule: in an imported run a user-actor node is `game` *"iff it lies on the primary branch at a ply within the source mainline — the boundary is `importedMainlinePlies`, the move count of the immutable `imported_games` record's movetext"* (`:332-340`). A followed source is still *a human playing a real game*; liveness is a property of the source, not of the decision class. **But the boundary is defined against an immutable record**, and a growing source has a moving `importedMainlinePlies` — Phase B must say what that boundary means mid-stream. Note also that Phase A's claim to "consume the accepted grain untouched" is **paper consuming paper** |
| **`learner-rating`** | implementing, migration 25 landed | nothing — a followed run must not rate | ✅ **it cannot, by construction.** The only producer of a `rated_games` row is `createRatedGame`, which **hardcodes** `kind: "position"` (`service.ts:602-607`); imported runs have no path to one, and `projectAttempts` returns empty for them (`progress.ts:84-86`). Phase B should still ship the failable criterion with a non-vacuous negative control ([[D444]]). **Adjacent, out of scope, worth a row:** a rated `position` run *can* carry a `stream` session with board handoff, and `#projectRatedGame` (`service.ts:2106-2143`) never reads authorship, so a delegate's moves seal to the declarer (`storage.ts:1574-1595`). `longitudinal-store` already pins the correct rule — attribute to the owner, *"NEVER the acting writer"* (`rfc/longitudinal-store.md:306,315-327`, AC-2 `:666-668`); `learner-rating` reaches for no such seam |
| **`play-composition`** | accepted, *implementing* (shell checkpoint) | — | ❌ **it does not reach the overlay** (§4.4 item 4). The brief's premise that "the overlay is a projection of run state, not a new screen" is the intended contract, not the shipped one. Either extend the scope or give casting its own contract |
| **[[D410]] / [[D959]] strip guarantees** | Phase A §3 + criteria 3–5, amended by [[D1048]] | the same `sanitizeBroadcastPgn` on every push | **the guarantee must survive N times, not once.** Every push is a full PGN and must be sanitized before anything is stored; under option C the source record is written per push, so the fail-closed `BROADCAST_ANNOTATION_RESIDUE` assertion runs per push — and mid-stream residue must not kill the follower silently. Plus §3.6: **sanitize, then release** |
| **`recorded-clocks`** (new since Phase A) | draft 2026-08-23; claims run-schema **lane 0.19** and `imported_games.clocks` at `position behind live-sources` | the [[D1048]] extraction Phase A ships | a growing game has growing clocks. The two lanes must agree whether `imported_games.clocks` is append-only or rewritten — **not yet coordinated by either document.** Same collision class as [[D1048]], caught early this time |
| **registers** | `rfc/README.md:139-140`, `:279-284` | — | migration position **behind `recorded-clocks`** (seventh); storage version **26**; run-schema lane **0.20** *only if needed* — under growth option C it is **not**, which is a further argument for C. Also: `account-data.ts:417`'s `exactKeys` closed set breaks on any `imported_games` column addition not made in lockstep |

---

## 6. Gaps — what an RFC author must answer

Numbered. **⚖️ marks an owner-level fork**; ⚠ marks a trap; 🐞 marks a defect found here.

1. **⚖️ The B5 ruling** (§4.5). Gated / ungated-as-wiring / casting-leads. Recommendation: option
   2 with a grep-guarded fence. **It also selects the follower architecture (gap 4), so ask it
   before drafting.**
2. **⚖️ The growth model** (§2.5). Recommendation: the followed-source object (C), with
   re-import-per-update (A) as the fallback and **append-to-run (B) recorded as refused**, since
   `live-relay-as-drill-source.md:389-397` already ruled *"a run that follows a broadcast… must
   never be built"*. Owner-level because C makes a product statement.
3. **⚠ Is upstream prefix revision real?** (§2.4). Unmeasured. **Measure before drafting** with
   the 30–60 minute stream-diff harness. Do not accept an RFC that assumes suffix-only growth.
4. **⚠ Held stream or two one-shot fetches?** (§2.2). The harness and the dossier point in
   opposite directions and **no document records the conflict**. The dossier's escape clause
   (*"take the stream only if a live spectator wall is later specified"*) ties this to gap 1.
5. **⚠ Law 8 — a live game's evaluation is provisional, and nothing in the codebase can say so.**
   `grep -rn "provisional"` over `packages/runtime/src` and `apps/server/src` returns **only
   `rating.ts:77,208`**. The evidence layer has no provisional state: an eval of an in-progress
   position attaches as `evidence.attached` / `source: "engine_validated"`, durably,
   indistinguishable from an eval of a finished game. Saying anything definite about an unfinished
   game is a claim we cannot back (`design/05:41`, *"Absence is stated, never simulated"*).
   **Decide:** refuse to evaluate live positions at all (recommended — it falls out of §3.5's
   evidence-pass door and the dossier already recommends entering play directly, not through a
   story), or introduce a provisional evidence state (a much larger change). **Do not** compute
   them and rely on a display lock.
6. **⚠ The D411 lock's failure mode is the worst outcome available to this lane** (§3.1). Leaking
   evidence about a game in progress — to a learner, or worse to a cast audience — is not a
   degraded feature. Say it once, at the top, in those words.
7. **The lock needs two arms** (§3.5): a config clamp and a server-side route refusal, because an
   API caller bypasses the first. `MATCH_LIVE` (`service.ts:2061-2067`) is the precedent;
   `SOURCE_GAME_LIVE` beside it in `errors.ts:48` is the shape.
8. **Enumerate exactly which routes the lock refuses** (§3.5): the evidence pass
   (`service.ts:857`), `story()` (`service.ts:876-879` — one `feedback.revealed` click away),
   branch comparison, and any export or public token minted over a live run.
9. **⚠ The release and the contamination spike coincide** (§3.6). Specify the order: sanitize,
   then release.
10. **🐞 The imported-mainline extension hole** (§2.6). `POST /runs/:id/moves` at the tip of a
    `Result "*"` imported run appends to `branch:0` with no guard (`runtime.ts:299-306`;
    `service.ts:944-968`). Latent today, opened by the first unfinished import. **Must be closed
    before Phase B ships**, independent of the growth model. Deserves its own ledger row.
11. **🐞 The overlay mounts a write-capable controller and can commit an engine ply on a
    `stream` session** (§4.4). `session-controller.ts:498-531`, guard at `:499` covers `match`
    only. Composed with gap 10 this manufactures a chess claim about a game in progress — a
    **law 8** violation reached with no new code. Needs a guard, a criterion asserted at the API
    boundary, and a correction to `docs/live-sessions.md:106-107`. Deserves its own ledger row.
12. **Facet vs kind** — does the D411 bit ride a source facet on `imported` or a new session kind?
    Phase A deferred with a recommendation (`live-sources.md:381-386`); §3.2 supplies the missing
    hard argument (the 28/12 assertion). Confirm and close.
13. **The follower must not join `import-source.ts`'s serialised queue** (§2.3). A held connection
    on the module-global `serial` chain (`import-source.ts:21`) blocks every import in the
    process.
14. **Follower lifecycle details** (§2.3): connection sharing, idle close, reconnect backoff,
    durability across restart (recommendation: re-derive, no follower table).
15. **Move-0 follows** (§2.7). Free under option C; needs a `requireMoves` exception and a
    zero-node run under A and B — verify `createRun` accepts one.
16. **`decision_class` for a followed game** (§5). Resolves to `'game'` on the RFC's own §4.2
    rule, **but** that rule's boundary `importedMainlinePlies` is defined against an *immutable*
    record. Say what it means for a growing source. And note the seam is paper-on-paper: the
    column has zero code hits.
17. **⚠ Phase A's line cites no longer resolve** (§1.3) — four wrong, including the
    `tabiya-claims` cite codex will implement against. Correct them, and adopt
    symbol-plus-fragment citation.
18. **The [[D971]] coupling must be explicitly denied** (§3.3).
19. **A third writer of board truth** (§2.5, C5). `design/05:42` says session machinery *"may
    never alter what the run says happened on the board"*. A follower that writes into a run is a
    new writer class beside the learner and the opponent. Option C avoids the question; A and B
    must answer it.
20. **`recorded-clocks` coordination** (§5): is `imported_games.clocks` append-only or rewritten?
    One sentence in each document, agreed before both land.
21. **Discovery surface** (Phase A's deferred item, `live-sources.md:279`): which index
    (`/api/broadcast` vs `/top` vs `/search`), how much curation, IA placement under `design/03`'s
    **Live** area (`:290`). Phase B raises the stakes — following requires *finding* a live round,
    and a URL paste is a poor entry point for "what's on right now".
22. **The [[D412]] design clause is still undischarged** (§0). Phase B inherits it; do not write
    the design doc.
23. **Does `docs/live-sessions.md:131-140`'s accepted self-cheating limitation survive a live
    source?** (§4.3). Permitting a streamer to cheat on themselves is fine in rehearsal; the board
    here is a game two grandmasters are still playing. Rule on it, do not inherit it silently.

---

## 7. Recommended scope cut

### 7.1 One RFC or two?

**Two, sequenced — but drafted from this one derivation, and the second is short.**

The argument for one: casting is small once the follower exists, and splitting costs a second
acceptance cycle.

The argument for two, which wins: **they have different licences.** Phase B is licensed today by
[[D947]]; casting is blocked on a B5 ruling nobody has asked. One document means the lane's
#1-ranked mechanism waits behind a question about a streamer we do not have. Phase A made this
cut correctly and it worked.

**If the owner rules B5 before drafting begins, merge them** — a single Phase B RFC with a casting
section is cleaner than two documents. **And the owner should be asked first anyway**, because the
ruling selects the follower architecture (§2.2). The split exists only to stop an unasked question
from blocking the mechanism.

### 7.2 The wiring-vs-building split

| | **building** (new mechanism, real risk) | **wiring** (composition of shipped parts) |
|---|---|---|
| **Phase B v1** | the source fetcher — held stream **or** two one-shot fetches per gap 4 · the growth model and the followed-source object (§2.5) · the `sourceGameLive` bit and its two-armed lock (§3) · the four door refusals (§3.5) · per-push sanitization (§5) · **closing the mainline-extension hole (§2.6)** | the board picker reusing Phase A's split index · `decision_class='game'` (consumed) · politeness constants (consumed) · the `importLeg` two-guard cut pattern (`live-session.ts:237-251`) · `run_derivations` linkage if option A |
| **Casting v1** | **the overlay write-guard and its API-boundary criterion (§4.4)** — this cell was empty until the HEAD audit | host a followed run as the existing `stream` session · the existing `/live/overlay/:runId` projects it · the existing vote/marks relay · viewers fork via existing re-entry paths |

**The correction that table records is the most useful thing in this document.** [[D705]] ruled
that casting is a composition, not a new evidence mode, and that ruling still holds — but
"composition, not a new evidence mode" was being read as "free". It is not: the composition
inherits a write-capable overlay mount that, over a live source, will ask an engine for a move
and commit it. **Casting v1 is small, but it is not empty, and the thing it must build is a safety
guard rather than a feature.**

### 7.3 Recommended sequence

1. **Put B5 to the owner** as the three-option question in §4.5 — it gates casting *and* selects
   the follower architecture. Record the answer as a per-lane row beside
   [[D1031]]/[[D1041]]/[[D1060]].
2. **Measure gap 3** (prefix revision) with the 30–60 minute stream-diff harness. One afternoon.
   Without it the growth model is argued, not derived.
3. **File the two defect rows** (gaps 10 and 11) — they are live findings about shipped code, not
   Phase B scope, and law 6 says evidence against us gets logged, not held.
4. **Correct Phase A's line cites** (gap 17) before codex implements against `storage.ts:3356`.
5. **Draft `live-sources` Phase B** under [[D947]], with the growth-model fork as an ⚖️ open
   question if the owner has not ruled, and casting merged or split per step 1.
6. Phase B implementation lands **behind** Phase A, which lands behind `campaign-core`.

**Explicitly out of Phase B v1:** discovery/curation UI beyond a URL paste and the round index
(gap 21) · tour- and group-level stream variants · organiser or relay operation of any kind
([[D709]]: we consume, we do not relay-operate) · any chat bridge, Twitch/YouTube/OAuth
integration or editorial delay ([[D704]] measured all four absent; they are B5's real work) · a
provisional evidence state (gap 5's expensive arm) · rating any live-followed game (§5 — refused
by construction, asserted by criterion).
