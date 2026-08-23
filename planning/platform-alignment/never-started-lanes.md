# Never-started lanes — the owner's "isn't there a LOT more we haven't started?" audit

**Run:** 2026-08-22, at HEAD, by claude on the owner's question. **Ledger:** D948 (the trigger),
D641/D487 (the method and the missing instrument).

**This file is hand-made and rots.** [[D487]]'s own measurement: the last hand-written work index
went **121 rows stale within a day**, and [[D492]] records that *every* lane document created by
hand consolidation inherits the same defect. The counts below are true at this HEAD and at no
other; `make work-index`/`make work-register` ([[D487]]) is the instrument that would make this
file unnecessary, and this file is one more proof it keeps not existing. Do not quote these
numbers tomorrow.

**Method** (D641's, re-run): every `D<n>` row id was parsed from `design/BACKLOG.md` with the
routing harness's own regex and status convention (`tools/work-routing-harness/audit.test.ts`:
closed = ✅/⛔, everything else open). Each open id was then grepped against every living non-log
planning document (`planning/**/*.md`, excluding `log.md` files and `archive/` directories, and
excluding `unrouted-defect-refresh.md` and this file, which route nothing) and every active RFC
body (`rfc/*.md` minus README/template/0000). Zero mentions outside the ledger and the logs =
unrouted.

---

## 1. The counts, and the answer to the owner's question: yes

| Population at HEAD 2026-08-22 | Count |
|---|---|
| Total ledger ids | **887** (no duplicates) |
| Closed (✅ 342 / ⛔ 2) | **344** |
| Open (🐞 297 · 💡 161 · 📊 77 · ⚖️ 3 · 🔨 3 · ⚠️ 1 retracted-but-unclosed D506 · 1 glyphless D28) | **543** |
| Open with at least one living planning/active-RFC mention | **400** |
| **Open with ZERO mentions anywhere but the ledger and logs** | **143** |

Two receipts that make 143 worse than it looks:

1. **The D641 audit test fails at HEAD.** `npx vitest run --config
   tools/work-routing-harness/vitest.config.ts` → *"routes every open id…"* fails:
   `unmentioned` is 143, `ROUTED_IDS` is 73.
2. **55 of D641's 74 "routed" rows are zero-mention again — because they never stopped being
   zero-mention.** The 2026-08-20 refresh recorded its destinations only inside
   `unrouted-defect-refresh.md` and `registry.ts`, both of which the audit excludes; the test
   itself literally pins `unmentioned == ROUTED_IDS`, i.e. it certified that the routed rows
   *remain absent from every living destination document*. The ids were never written into
   `plan.md`, `execution-queue.md` or any queue. Only 16 of the 74 have since been picked up by
   name in living docs (mostly by the F1/F2 RFCs); 3 closed (D99, D614, D631); the other 55
   (D114, D131, D142-D143, D228, D252, D261, D264, D275, D298-D304, D356, D410, D413, D441,
   D511-D512, D520, D559, D567, D570, D574-D578, D580, D583-D604 minus closures, D620-D621,
   D623-D625) were "routed" in name only. `planning/platform-alignment/plan.md`'s claim that the
   74 *"now have one primary destination"* is nominally true and operationally false.

So the class D948 caught (D412/D704/D709) is not three strays: it is **143 open rows with no
execution path, including most of the set the last repair claimed to fix**.

---

## 2. The unrouted 143, clustered

State legend: **NS** never-started · **R** research-exists-no-RFC · **RFC** RFC-exists-not-implemented ·
**P** partially-shipped (residue defects).

### 2.1 Live / broadcast / casting — 6 rows — state: P surface, NS lane (derivation opened today)

| Id | One line |
|---|---|
| D410 🐞 | broadcast PGN carries third-party move grades; nothing asserts we strip them |
| D412 💡 | disambiguate the parked events row: team relays ≠ external tournament relay |
| D704 📊 | streamer overlay composes safely; provider integration and editorial delay are separate absences |
| D709 💡 | costed hybrid 1.0 human-play boundary: native private matches + Lichess adapter for rated/public |
| D947 ⚖️ | OWNER COMMISSION 2026-08-22 verbatim: *"where is the stuff like retrieving LIVE games… so streamers can cast or anyone can analyse?"* |
| D948 🐞 | the three live rows escaped routing one cycle after D641 closed 74 identical escapes |

The commission row itself is zero-mention because the lane file it commissions does not exist yet.
`tools/d947-broadcast-roundtrip-harness/` exists; the derivation is in flight. These six become
routed the moment the D947 lane document lands and names them.

### 2.2 Social / club / human play — 5 rows — state: P (native match + classrooms shipped; promises unkept)

| Id | One line |
|---|---|
| D252 🐞 | `kind === "match"` vs `boardControl === "match"` diverge and the divergent case ships |
| D707 📊 | native human play is a private learning primitive, not a competitive service — the boundary evidence |
| D712 🐞 | portable-data draft promised survivors could read archived-classroom tombstones; shipped code refuses every archived classroom |
| D713 🐞 | promised pre-publication warning that authored bytes survive account deletion; no Studio UI owns it |
| D946 ⚖️ | OWNER RULING 2026-08-22: witnessed-play seam pinned now, implemented never (until a real cohort) — needs absorbing into `learner-rating` §10a/OQ12 |

### 2.3 Campaign and encounter classes — 16 rows — state: R (design/06 intent + HEAD derivation dossier; RFC gated on owner play)

| Id | One line |
|---|---|
| D298 📊 | the capability-suppressing boss ships end-to-end (`AssistancePermission` incl. `locked_off`) — evidence, unconsumed |
| D299 💡 | `RETRY_VARIANT_KINDS` — five-kind variety vocabulary authored, validated, consumed by nothing |
| D301 💡 | one shared position a day + spoiler-free share — *"the cheapest complete feature in the campaign cluster"*, still mechanism-less |
| D302 💡 | three-axis histogram over the learner's own submissions (Zachtronics), with a pre-test that could kill it |
| D303 🐞 | `design/04` §1's Pack row describes an object that does not exist; the campaign unit is the RUN |
| D304 💡 | ADR-0007 twin clause: unlocked by playing, never by winning — ⚠️ owner-facing, four-system genre evidence |
| D883 💡 | avoid-the-blunder as encounter class and standalone daily (2c-gated) |
| D884 💡 | Steps-style reduced-material mini-games on the standard board, tablebase-exact at ≤7 units |
| D885 💡 | progressive armies as early-campaign spine; pieces earned via detected evidence |
| D886 💡 | **OWNER-TIER**: verdict shape 4 — score-threshold over an unbounded run (survival/streak family) |
| D887 💡 | **OWNER-TIER**: the material/board balance law — geometry/piece set exit the evidence plane; evidence-dark nodes are marked play, never training |
| D889 💡 | threat-radar hunt — `threat@1`-grounded detection drills, 2c-gated |
| D890 💡 | defender-chain hunt — also the missing consumer its own dossier names |
| D891 💡 | brain-with-a-banded-hand — solo hand-and-brain vs piece-restricted Maia |
| D892 📊 | Lucas Chess verdict: ~46 modes reduce to SIX verdict mechanics; format breadth is cheap, grounding is the moat |
| D945 ⚖️ | OWNER RULING 2026-08-22 verbatim: boss rewind is an **earned resource** — owes a design/06 §5 amendment (law 5, claude on this ruling) |

`planning/campaign/rfc-derivation.md` landed at this HEAD and cites the *dossiers* but none of
these ids yet. D886/D887 are flagged owner-tier in the ledger and **appear nowhere in
`decision-queue.md`** — decisions marked as the owner's to make never entered the queue built to
hold them. Same for D945's owed intent amendment and D304.

### 2.4 Learn-and-return / scheduler (the Chessable-family adoptions) — 7 rows — state: R, with shipped-and-dead wiring

| Id | One line |
|---|---|
| D861 💡 | pass-mark packs — Yusupov scorecard over verdicts we already emit |
| D862 💡 | tempo cycles — Woodpecker shape over the zero-consumer `TempoVerdict` |
| D863 📊 | the training tradition CONFIRMED design/01; three famous methods are shipped-and-dead wiring, not missing features |
| D864 💡 | lapse-aware rescheduling + maturity vocabulary over the existing `schedules` ladder (MoveTrainer, at the root unit) |
| D866 💡 | corpus-frequency-at-band due-queue ordering (Priority Lines) from the explorer population we already fetch |
| D867 💡 | the guided read→play→quiz ramp — highest-value Chessable adoption, an ADR-0006 design prompt |
| D868 📊 | content-strategy evidence "routed to design/04/owner": the paying is for the **author marketplace**, the returning is for the scheduler — no design/04 change, no decision-queue row |

### 2.5 Progression / skills / player analysis — 11 rows — state: RFC for the store (accepted 2026-08-22), NS for everything above it

| Id | One line |
|---|---|
| D441 🐞 | `learner_marks` and milestones are one object class; merging surfaces would falsify a doc by UI tidying |
| D597 🐞 | Chessiverse's personality page describes two incompatible products (quiz vs 100-game import) |
| D598 📊 | competitors disagree ≥4× on samples needed for a stable style profile |
| D599 💡 | a style rate needs an opportunity denominator (played − legal-alternative share) |
| D600 💡 | stable metric vector ≠ stable archetypes; R12's eligibility ladder |
| D601 🐞 | the public-player-history acquisition R12 assumed 404s today |
| D602 🐞 | "first sample size that passes" is not a sample-floor contract |
| D604 💡 | a transparent style vector re-identifies 35/36 accounts — it is behavioral identifying data; storage/export/delete contracts needed |
| D625 🐞 | Chessiverse's personality explanation contradicts itself and crosses the grounded-advice boundary — the anti-pattern record |
| D700 🐞 | 25 concept identities reused across packs while persistence fragments 199 refs into pack-scoped keys |
| D701 🐞 | progress aggregates can't substantiate their own coaching sentence (no contributing rows / opportunity denominators) |

### 2.6 Bots / opponent policy — 10 rows — state: RFC (bot-policy accepted 2026-08-22), residue uncited by it

| Id | One line |
|---|---|
| D590 📊 | history/time are base-model capabilities; the "position-only Maia" row was false for Tabiya |
| D592 💡 | plausible-error validation needs a perceptual arm, not just frequency/engine |
| D593 🐞 | Maia's emitted policy vector is not the distribution `human_common` plays (temp/top-p divergence) |
| D594 📊 | a ≥250cp bounded error guard is mechanically separable from strength |
| D595 📊 | trait transforms can be observable without material strength shift; naive labels weaker than they sound |
| D596 💡 | opening population, repertoire identity and cross-game adaptation are three different layers |
| D620 📊 | a drill spine is not a reusable bot repertoire (79.2% > 25% exercise ceiling) |
| D621 📊 | a 2.5M-game root-conditioned book is still not a continuation policy |
| D698 🐞 | R11/O8 still cite a recruited blind review the owner descoped in D649 — a lane blocked on a dead prerequisite |
| D809 🐞 | the bot ledger block reused D669–D679 after F1 allocated them; citations ambiguous |

### 2.7 Review Map / post-game — 2 rows — state: R (`review-map-and-reentry.md` dossier; plan.md workstream 5, behind R7)

| Id | One line |
|---|---|
| D559 💡 | the post-game product is under-specified vs the owner's "Chess.com Game Review, but grounded and replayable" |
| D623 📊 | Chessiverse Guided Play now overlaps the branch-rehearsal loop far more than the teardown says |

### 2.8 Assistance / renderer / LLM seam — 13 rows — state: P (wiring RFCs accepted; these defects and measurements uncited)

| Id | One line |
|---|---|
| D114 🐞 | eval swing along a PV is the wrong sharpness instrument, by construction |
| D131 🐞 | the residual sweep polices numerals; D126 polices inference from numerals — not mechanically checkable |
| D261 💡 | `voicePersona` is a deployment option, so persona-prompt criteria pin only a default |
| D356 💡 | reading cost does NOT track distance to the answer — interlock hypothesis refuted |
| D583 🐞 | board "evidence lighting" bypasses the measured evidence-compiler boundary |
| D584 🐞 | the LLM evidence packet bypasses R2 the same way |
| D585 🐞 | the ambient-assistance "Open assistance" button is a dead control — no onclick, no target |
| D586 🐞 | the sentence seam can turn an admitted fact into a false absence and `voiceCheck` accepts it |
| D587 🐞 | schema-valid renderer output still drops required theory citations |
| D588 🐞 | a small local generator is not a safe self-host fallback (1/16 R5 cases) |
| D589 💡 | renderer conformance needs a versioned promotion gate, not a provider name |
| D624 📊 | Chessiverse packages assistance as learner intents; modules must be evidence-shaped, not source-shaped |
| D878 📊 | the 7-axis assistance-surface taxonomy over 85 rows/14 products; the gap is the module/admission layer |

### 2.9 Semantic collectors — measurement and spec residue — 42 rows — state: RFC (tactical/semantic/breadth-collectors all active/accepted) but these rows are cited by none of them

D567, D570, D724–D728, D746–D747, D755–D757, D761, D773–D777, D779–D787, D789–D793, D795–D798,
D800, D803–D806, D903. One line for the cluster: the Wave-A/B/2c measurement campaign (pawn
conversion/levers, king-zone, mobility/trapped, fork/only-reply semantics, square control,
retained-identity compilers) produced dozens of 📊 findings and 💡 build specs whose content
plainly *fed* the collector RFCs — but the RFC bodies do not name the ids, so nothing proves
which findings are discharged, which are deferred, and which (e.g. D903's 179→175 eligibility
correction, D773's zero-fixture gap) are still live obligations. This is the largest block of
the 143 and the cheapest to fix: the accepted collector RFCs should cite what they consume.

### 2.10 Evidence manifest / contract defects (F1 residue) — 14 rows — state: P (manifest implemented; declared-vs-consumed mismatches open)

D142, D228, D264, D663, D665, D666, D671, D672, D674–D678, D693. Cluster line: the implemented
`evidence-contract-manifest` declares payload types its consumers don't actually receive
(D665/D672/D674–D677), the 23-op "consumer closure" proves anchors not consumption (D666), the
reasoning-review call sends the wrong argument (D663), two capability registers can disagree
(D228), `CORPUS_GUARD` has forked (D264), shape recommendations misuse `prospective` refs (D693),
and pack evidence ledgers are opened and thrown away (D142).

### 2.11 Pack schema / content integrity — 9 rows — state: R (R6 negative Gate-F result; F3 lane not drafted)

D143 (no position carries both engine and tablebase readings), D275 (attribution validated for
licence string only — chains can be fictional), D520 (illegal promotion FENs make
`tablebase.moveCensus@v1` unsatisfiable in 3/12 packs), D574/D575/D576/D578 (schema-id 0.13
named two artifacts; 0.27 vs "Living v0.25"; packs can't declare required contract; no migration
ladder), D837/D838 (the §2a second-axis derivation awaiting owner veto; the undefined "17
voluntarily" figure).

### 2.12 Knowledge / theory — 1 row — state: R (theory-knowledge-pipeline.md answered; builder not drafted)

D580 🐞 — Skipper's stored chunks cannot identify or reproduce their source artifact (no licence,
revision, digests); the deterministic builder D557 specifies would fix this and has no RFC.

### 2.13 Process / instrument / docs honesty — 7 rows — state: NS for the instrument, P for the docs

D413 (chess.com refusal wording better-founded than its own sentence), D504 (missing
`principle-entry.test.ts`), D511 (n=1 latency stated as measured), D512 (branch switch
unobservable in DOM when two branches share a node), D515 (outstanding obligations outside RFC
code are one third of the Active table), D517 (an unblocking commit left the same block standing
four columns away), D652 (SIX vs FIVE — two hand-maintained counters disagree). The instrument
that retires this whole section is D487's `make work-index`, still not started.

---

## 3. The inverse pass — things the owner talked about, wherever they live

"Stuff we talked about" is bigger than the unrouted set: some themes are routed-in-name,
gated, or have no ledger row at all. Tier reached and the next concrete actor for each:

| Theme | Where it lives | Tier reached | Honest state | Next step (actor) |
|---|---|---|---|---|
| **Theming: dark mode, board/piece sets** | D839 💡 (*"a product need, not polish… the owner dislikes light websites"*) / D840 🐞; `rfc/play-composition.md` §7 ships **token hooks only** and its discharge row D3 defers the whole lane | ledger + hooks in an implementing RFC | **never-started** (explicitly: *"this RFC neither ships a dark theme nor blocks one"*) | claude-draft the D839/D840 theming-lane RFC over play-composition's tokens + the animation pref; owner picks palettes/piece sets |
| **Skills/progression (chess.com-style skill credits)** | D549 (*"we need something like THAT too"*); `rfc/longitudinal-store.md` **accepted 2026-08-22**; `attempt_concepts` consumerless since D300; D562 🐞 no grounded taxonomy | RFC accepted, unimplemented | **RFC-exists-not-implemented**, taxonomy research not started | codex implements longitudinal-store; claude-research the evidence-grounded skill taxonomy (law 8: credited from detected evidence only) |
| **Player style / longitudinal feedback** | D552/D553 (verbatim owner asks); R12 `player-style-metrics.md` landed (literal habit cards yes, natural archetypes **refused**); D597–D604 residue unrouted; R13 grounded-coaching queued behind R7 | research landed + store RFC accepted | **research-exists-no-RFC** for the surface | implement the store, then claude-draft the habit-card surface; owner-ruling on the fun archetype layer (decision-queue "player style" row) |
| **Solitaire chess** | D869/D870 💡 rows carrying the owner's verbatim ruling, committed `cac76c4` (*"I really like the idea"*, *"shouldn't our campaign have more variants like that???"*); `training-mode-variants.md` dossier; longitudinal-store §schema pre-provisions the session kind | research + design mention + schema provision | **research-exists-no-RFC** | campaign derivation names it as an encounter class + standalone-mode fork for the owner; claude-draft after the campaign gate |
| **Fairy pieces / small boards / pawns-only** | D873 (owner balance clause: *"we don't need to forget we're learning chess here"*), D887 **owner-tier** material/board law — unrouted, not in decision-queue | ledger only | **never-started** | owner-ruling on D887's law (add to decision-queue.md), then the campaign RFC absorbs it |
| **Campaign mode** | `design/06-campaign.md` (intent), `planning/campaign/rfc-derivation.md` landed **today**, D945 boss-economy ruling today; gated by `campaign-research-queue.md` on owner-play R6–R8 (D649) | intent + derivation dossier | **research-exists-no-RFC (gated by design)** | claude executes D945's owed design/06 §5 amendment (law 5, on the ruling); derivation completes into a draft-ready package; the owner-play gate is the last step |
| **Live sources / casting live tournaments** | D947 ⚖️ commissioned today; `tools/d947-broadcast-roundtrip-harness/` exists; research base D410–D414, D704/D705/D709/D710; design/03 Live surfaces | commission + harness in flight | **in-derivation as of today** (was never-started for 11 days after its research landed) | land the derivation, route D410/D412/D704/D709/D948 into the lane doc, claude-draft the `live-sources` RFC |
| **Events / tournaments / team relays** | design/03 "Arena and events" row; D412 unrouted (the row is literally about the lane being parked ambiguously) | design named, ledger row parked | **never-started** | owner-ruling: does events ride the live-sources lane or its own; then route D412 |
| **Author marketplace / content strategy** | D868 📊 "routed to design/04/owner" — no design/04 amendment, no decision-queue row | ledger only | **never-started (dropped hand-off)** | owner-ruling via decision-queue; content side is behind the D560 hold + Gate F anyway |
| **Import/export** | game-import, pack-studio, repertoire-gap-finding and `archive/portable-account-data.md` ship with canonical docs | implemented | **shipped** | account import remains explicitly out of scope; future cross-instance import requires its own identity/collision contract |
| **Engine/provider & self-host appliance** | R18 `release-platform-audit.md` (provider-off core proven, 1.0 floor fails); D588 unrouted; O13 "ready" per plan.md | research landed | **research-exists-no-RFC** (F12 blocked on O13 mirror) | claude mirrors O13 into intent per `intent-amendment-handoff.md`, then F12 drafting |
| **Daily shared position (Wordle-shape)** | D301 — *"the cheapest complete feature in the campaign cluster"* | ledger only, unrouted in **both** audits | **never-started** | claude-draft as a small standalone RFC or the campaign RFC's first encounter; owner picks |
| **Rewind-from-mistake auto-offered branches** | D550 (Beacon); routed only into `evidence-rework-brief.md` | ledger + brief mention | **never-started** as a surface | design/02 adoption-amendment treatment: claude-research the auto-offer transform, owner rules |

---

## 4. Top 10 never-started lanes by owner-stated interest

Ranked by how directly a ⚖️ ruling or verbatim owner quote names the theme (rank 1 = quoted
this week and commissioned; lower = quoted once, older, or implied).

| # | Lane | Owner evidence | Next actionable step |
|---|---|---|---|
| 1 | **Live games / casting / analyse-anything** | D947 ⚖️ 2026-08-22 verbatim commission | finish the D947 derivation; route D410/D412/D704/D709/D948 into it; claude-draft `live-sources` RFC (harness already exists) |
| 2 | **Campaign boss economy (earned rewinds)** | D945 ⚖️ 2026-08-22 verbatim | claude amends design/06 §5 on the ruling (law 5); feed the derivation dossier; RFC waits only on the owner-play gate |
| 3 | **Solitaire chess + the variant family** | D869/D870 owner-verbatim 2026-08-22 (*"I really like… shouldn't our campaign have more variants like that???"*) | put the standalone-vs-encounter fork in decision-queue.md; encounter-class section in the campaign derivation |
| 4 | **Theming: dark mode, boards, piece sets** | D839 2026-08-22 (*"a product need, not polish"*) | claude-draft the theming lane over play-composition §7's tokens; include D840's animation pref; owner chooses defaults |
| 5 | **Skills / concept progression** | D549 2026-08-20 (*"we need something like THAT too"*) | codex implements accepted `longitudinal-store`; claude-research the detected-evidence skill taxonomy (D562) |
| 6 | **Post-session / longitudinal feedback + style** | D552/D553 2026-08-20 verbatim | same store implementation; then R13 grounded-coaching aggregation (behind R7); owner archetype ruling |
| 7 | **Review Map (grounded Game Review)** | D559 2026-08-20 (owner target named in-row) | run R7 (`r7-review-map-harness` exists); owner ruling; then RFC — plan.md workstream 5 |
| 8 | **Bot personalities beyond raw Maia** | D551 2026-08-20 verbatim; D555 ⚖️ | codex implements accepted `bot-policy`; land the two collector drafts O8 named; cite D590–D621 residue in the implementation lane |
| 9 | **Fairy pieces / reduced-material campaign material** | D873 2026-08-22 verbatim balance clause | owner rules D886/D887 (add both to decision-queue.md — they are flagged owner-tier and are in no queue) |
| 10 | **Daily shared position** | D301 (genre evidence; twice unrouted) | smallest lane in this file: one claude-draft RFC over existing run + share primitives |

---

## 5. Promised-and-silently-dropped watchlist

Things that were told to the owner (or written as commitments) and then went nowhere, found by
this pass:

1. **The D641 routing itself.** `plan.md` still tells every reader the 74 rows *"now have one
   primary destination"*; the destinations were never written into any destination document, the
   audit test pinned their continued absence, and 55 are unrouted again at HEAD. The repair was
   a pointer file, not a repair.
2. **D886/D887/D304/D868 — owner-tier decisions that never reached the decision queue.** The
   ledger marks them owner-facing; `decision-queue.md` (the file whose whole job is holding
   owner decisions) contains none of them.
3. **D945's owed intent amendment** — the ruling row itself says design/06 §5 needs the
   boss-economy amendment "claude on this ruling"; not yet executed.
4. **CLOSED 2026-08-23 — D712/D713 portable-account-data promises.** Surviving classroom
   members have a read-only archived projection and both Studio registration paths disclose
   immutable-byte retention; permanent regressions landed with the implementation.
5. **D585 — the dead "Open assistance" button**: a learner-visible control shipped with no
   handler.
6. **D698 — R11/O8 blocked on a blind review the owner already descoped** (D649): a lane still
   citing a dead prerequisite as its blocker.
7. **D301 — "the cheapest complete feature"** by its own row's accounting, unrouted through two
   consecutive audits.
8. **D863's headline** — three famous training methods (write-before-checking, pass-marks,
   tempo cycles) are *shipped-and-dead wiring*: the mechanisms exist with zero consumers, which
   is the same shape as `attempt_concepts` (D300) and `RETRY_VARIANT_KINDS` (D299).

**Standing remedy, unchanged since D487:** none of the above stays fixed by hand. Every audit —
D487, D641, D948, now this one — re-proves that hand routing decays at the rate ideas land
(88 *new* zero-mention rows accumulated in the two days since D641). The derived
`make work-index` register with the seven-point contract in `unrouted-defect-refresh.md` §"What
the derived register must do" is the only fix that survives its own success.
