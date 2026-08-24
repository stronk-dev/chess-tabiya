# Authoring and the library from the user's side — a UX specification

- Date: 2026-08-24
- Commissioned by the owner, verbatim: *"we need to go from a user perspective per feature… what do
  they expect, what do competitors do, PROPER UX."*
- Scope: **the `create` route (Pack Studio and the shape editor) and the `library` route (shapes,
  principles, theory)** — authoring the content, and browsing the structured knowledge the product
  holds. Six sibling dossiers cover arrival, in-run, the core loop, live/social, after-the-run and
  settings; **none of them mentions `/create`, `/library` or Pack Studio once** `[V]` (grep over
  `design/research/ux-*.md` returns zero hits for all three). These two surfaces are the hole.
- Method, three passes per feature as commissioned: (1) what a user expects; (2) what competitors
  actually do, **labelled**; (3) what we should do and why it differs. Each feature closes with cost
  and dependencies.
- **Evidence basis.** Shipped-state claims are `[V]`, read at `f95aed8b` this pass with file and
  line, or measured by a script over `content/` this pass. Competitor claims are `[P]` or `[M]` —
  see the ceiling below, which is harder here than in any sibling dossier.
- Feeds: B6 (`design/03-product-breadth.md:328`), B7's discovery half, B11
  (`:333`), `design/04-content-architecture.md` §0/§8, [[D1434]] (the raw-JSON-textarea row),
  [[D695]] (the library's missing catalogue), [[D700]] (concepts are pack-scoped by design),
  [[D1394]]/[[D1396]] (the attribution machinery), [[D502]] (the draft-badge ruling),
  [[D560]]/[[D949]] (the content hold), `docs/pack-studio.md`, `docs/shape-library.md`,
  `docs/pack-graduation.md`.
- Reconciles, does not duplicate: **`ux-arrival-and-start.md` §5 owns the pack catalogue** (C1–C5:
  phase-first filters, the objective sentence on the card, mode verbs, relative difficulty,
  provenance placement). This dossier does not re-specify the pack shelf. It owns the **authoring
  surface** and the **non-pack knowledge** — shapes, principles, theory — which C1–C5 never touch.
  `pack-authoring-cost.md` owns the Q7/K10 cost verdict and this spec treats its numbers as binding.
  `authoring-vocabulary-completeness.md` owns format expressiveness; where this spec touches a
  vocabulary gap it cites that dossier and stops.

---

## The ceiling on every competitor claim in this dossier — read first

Two limits, and the second is specific to this scope.

1. **[[D1458]]: no product in the corpus has ever been driven hands-on**, and the dossiers say so.
   `teardown-cet.md:4-7` is the sole exception — *"desktop Chrome (agent-driven via browser
   automation)… everything below directly observed/measured this session"* `[V]`. Everywhere else
   `[V]` means *the vendor's page or shipped bundle was fetched and read*. This dossier downgrades
   those to `[P]`.
2. **Worse here: nobody has ever seen a competitor's authoring editor at all.** A sweep of the whole
   `design/research/` tree this pass found **no teardown of Lichess's study editor, Chessbook's
   repertoire builder, Chessable's author console, or any PGN/tree editor in any product** `[V]`
   as an absence. The Chessable author-side evidence is *entirely* help-centre articles and blog
   posts — `chessable-movetrainer.md:8-11` states it: *"Method: desk — official help-center articles
   and blog posts fetched and read (curl…). **Product NOT run.**"*

   **Consequence, stated once and applied throughout §3–§9: every claim in this dossier about how an
   authoring editor looks, feels, or is laid out is `[M]`, not `[P]`.** What competitors are
   evidenced on is the *economics* and the *policy* of authoring — revenue share, import formats,
   what validation runs and when, what authors complain about. That is real evidence and this spec
   leans on it. Screen anatomy for authoring is not available at any label, and §3–§9's screen
   proposals are therefore derived from our own shipped contract, not from the field.

The library half is better served: `teardown-cet.md:46-47` is a genuine hands-on catalogue
measurement, and `ux-arrival-and-start.md` §4.4 already assembled the catalogue-axes evidence.

**No participant evidence of any kind.** Nothing below §2 has been tested on an author or a learner.

---

## 0. The two findings, one sentence each

**Create.** *Every capability a decent authoring tool needs is already implemented on the server, and
the client exposes almost none of it* — the pack linter accepts an unsaved document over HTTP and has
no client caller at all; the shape linter accepts a probe FEN and reports one boolean; the run
distiller works end to end; a preview server, a legality walker, a tablebase walker, an engine
walker, a source fetcher and a graduation reporter all ship as `make` targets — and the surface a
person actually touches is **two `<textarea>` elements** holding a median of **471 lines** of JSON
they must keep schema-valid, chess-legal and licence-clean **with no board, no preview, and no
validation feedback until after they have uploaded it**.

**Library.** *The route named for the product's knowledge contains none of it, and is a strictly
worse copy of two other routes.* `/library` renders one inert `<ul>` of pack titles — no link, no
button, worse than `/play`'s card — and one `<ul>` of runs headed *"Runs with exportable PGN"* that
offers no export, only navigation and a delete button. **Zero shapes, zero principles, zero theory.**
Meanwhile 25 shape entries carrying **117 named plans, 78 watch points and 89 typical mistakes** —
284 units of authored chess knowledge, reused by 38 of 56 packs — are reachable only as a passive
marker that appears mid-run if you happen to play into the position.

---

## 1. The shipped baseline, measured this pass

All `[V]` at `f95aed8b`.

### 1.1 `/create`

`apps/web/src/App.svelte` is **1,195 lines / 91,239 bytes**; every screen is one `{#if route.name}`
chain. The create route body is **lines 973–1028 — 56 lines / 6,611 bytes** of inline markup.

The editors, verbatim:

```svelte
<label for="studio-json">Pack JSON</label>
<textarea id="studio-json" bind:value={studioJson} spellcheck="false"></textarea>
```
(`App.svelte:988`, and `:1013` for `shape-studio-json`.)

- `studioJson` is `let studioJson = $state("")` (`:99`) — **it starts empty**. There is no scaffold,
  no template, no "new pack" starter. All three writes to it are `JSON.stringify(doc, null, 2)`
  (`:430`, `:530`, `:981`).
- The empty state is the entire onboarding: *"No database drafts yet. Paste a v0.8 pack to begin."*
  (`:984`). **The shipped schema is `urn:chess-tabiya:schema:drill-pack:0.27`**
  (`schemas/drill_pack.schema.json:3`) — the one instruction a new author receives names a format
  **nineteen versions stale**.
- The textarea is styled `min-height: 42vh; font: 0.8rem/1.4 ui-monospace` (`:1178`). Against a
  median pack of 471 pretty-printed lines that is roughly a **5% viewport onto the document**.
- **There is no board and no preview anywhere in lines 973–1028** — zero `Chessboard`, zero FEN
  render, zero position display. The only route to a board is *Save & playtest*, which navigates
  away to `/play/run/:id`.
- Five pack actions (`:990-994`): Create draft · Save · Save & playtest · Register community pack ·
  Withdraw…. Four shape actions (`:1016-1019`): Create shape draft · Save shape · **Lint + probe** ·
  Register community shape, plus a Probe FEN input (`:1014`).
- Validation surfaces in exactly one form (`:1002`), a flat list:
  ```svelte
  {#each selectedPackDraft.validation.issues as issue}<li><code>{issue.path}</code> {issue.code}: {issue.message}</li>{:else}<li>Validation clean.</li>{/each}
  ```
  No severity distinction, no grouping, no count, no heading, no jump-to-location — and it is
  wrapped in `{#if selectedPackDraft}`, so **pasted-but-not-yet-created JSON gets no feedback at
  all**.
- The error banner (`:1001`) renders `error.message` raw, so a malformed body shows the bare
  `JSON.parse` string as the entire error UI.
- **The four shape handlers (`:597-614`) have no `try`/`catch` and there is no shape error element.**
  A bad parse or a 4xx there produces an unhandled rejection and silently nothing on screen.
- Distillation from a run ships (`rest.ts:1416`, banner at `App.svelte:818`) but the client
  hardcodes `packId: \`distilled-${run.id}\`` and `title: "Distilled rehearsal"` (`:430`) — **every
  distilled draft is called "Distilled rehearsal" and the author is never asked.**

### 1.2 `/library`

Eighteen lines, 1,631 bytes (`:1079-1096`). Title: **"Packs and run artifacts"**. Two `<ul>`s:

```svelte
<section><h2>Rehearsal packs</h2><ul>{#each packs as pack}<li>{pack.title} <small>{pack.reviewStatus.replaceAll("_", " ")}</small></li>…
```

- The pack row renders **title and `reviewStatus` only** — dropping mode, phase, difficulty, channel
  and publisher that `PackList.svelte` at least shows — and it is **not clickable**. No link, no
  button, no navigation.
- The second section is headed *"Runs with exportable PGN"* and **contains no export affordance**:
  a navigate button, a branch count, and a host-only *"Delete this run"*.
- **Shapes are not rendered.** `api.shapes()` (`GET /shapes`) exists and its only caller in the whole
  client is `session-controller.ts:667`, resolving references mid-run.
- **Principles are not rendered, and cannot be.** `rest.ts` contains the string `principle` **zero
  times** `[V]`. `principle-registry.ts:63` defines
  `list(): readonly PrincipleSummary[]` returning `{id, version, digest, name, phases, licence}`,
  id-sorted — a finished browse projection with no route and no callers.
- **Theory is not rendered.** `lib/theory-presentation.ts` is in-run prose.
- **No filter, search, sort or phase navigation exists anywhere in the client** — confirmed by grep
  across `apps/web/src` for search inputs, sort keys and filter controls. `[[D1474]]` already
  ledgers this.

So `/library` is a strictly worse duplicate of `/play`'s pack list plus a strictly worse duplicate of
`/review`'s run list, with a destructive action attached.

### 1.3 The real authoring surface is a Makefile, and it is far better than the Studio

Twelve `make` targets constitute the actual pipeline (`Makefile:67-135`), and `docs/content-sourcing.md:4-5`
names it: *"fetch/ingest → normalize → emit candidate → review."*

| target | what it gives the author |
|---|---|
| `make pack-check FILE=` | full three-layer validation with `SEVERITY /pointer [CODE] message` |
| `make pack-preview FILE=` | **validates, then serves the draft at `localhost:3000`, reloading on file change** |
| `make shape-check FILE= PROBE= CORPUS=` | shape validation **against a corpus**, not one FEN |
| `make expression-census` | every trigger and success signature measured over the authored position corpus |
| `make verify-draft FILE=` | walks root/spine/deviations, emits the evidence and source sidecars |
| `make tablebase-walk` / `make engine-walk` | read-only grounding reports over a pack |
| `make sourcing-check` | manifest union, licence matrix, deny list, evidence↔manifest linkage |
| `make graduation-report` / `graduation-clear FILE=` | what is blocking publication |
| `make candidate-emit` / `candidate-attach` / `source-fetch` | machine-emitted seeds and evidence |

**All 92 pack documents in the repository were produced through that loop, and none through the
Studio** `[V]` — 56 hand-authored in `content/drafts/`, 36 machine-emitted `pack.json` across 42
directories in `content/candidates/`, and `content/packs/` holds **zero**. (Denominator caution:
[[D1003]] records that *"92 documents"* is a property filter rather than a defined corpus, and
[[D1381]] records two same-day drafts disagreeing 92-vs-56. Both counts are given here with their
predicates.)

`docs/pack-studio.md:57-58` states the posture candidly rather than by accident:

> *"Studio remains an intentionally low-level authoring instrument rather than a visual chess-content
> editor."*

That sentence is the thing this dossier is arguing with, and §2 explains why the argument is not
"make it prettier".

### 1.4 What is genuinely good and must survive a redesign

Five things, and a redesign that loses any of them is a regression:

1. **Honest disabled reasons.** Every blocked action names its blocker through `aria-describedby` —
   *"Fix the listed validation errors before the real run can start."*, *"Resolve the declared
   graduation blockers first."* (`:996-999`). This is `design/05:41` applied correctly and it is
   better than anything in the corpus.
2. **The retention warning before registration** (`:999`): *"Registration publishes immutable
   document bytes, authored prose, licence, and attribution; those remain available with 'deleted
   account' attribution if you later delete your account."* Stated before the irreversible act.
3. **Save & playtest opens a real run**, and the server — not the author — chooses run id, seed and
   per-run policy (`docs/pack-studio.md:53-55`). The author cannot accidentally test against a
   configuration a learner will never see.
4. **Channel is server-derived and unforgeable** (`docs/pack-studio.md:10-13`), discharging
   `design/03:105-113`.
5. **The closing honesty line on the shape editor** (`:1027`): *"Shape entries name reusable patterns
   and plans. They do not prescribe a move in the current position."* Law 8 in the authoring surface.

### 1.5 Measured defects the recommendations below repair

| # | Defect | Evidence |
|---|---|---|
| 1 | The editor is a textarea onto a median 471-line / max 970-line document | `App.svelte:988`; corpus measured this pass |
| 2 | The only onboarding string names format **0.8**; the schema is **0.27** | `:984` vs `schemas/drill_pack.schema.json:3` |
| 3 | **The pack lint endpoint has no client caller.** `POST /packs/drafts/:id/lint` accepts `body.document` (`rest.ts:1058`) — arbitrary unsaved bytes — and `apps/web/src/lib/api.ts` has no `lintPackDraft` at all | grep: `lint` in `api.ts` returns only `lintShapeDraft` |
| 4 | **You must upload before you can be told what is wrong.** The issue list is gated on `selectedPackDraft` | `:1002` |
| 5 | **The validator cannot do partial documents.** `validatePackDocument` returns early on schema failure and computes *no* lint and *no* runtime issues | `pack-validation.ts:1364-1369` |
| 6 | **Studio and CLI do not run the same checks**, contradicting `docs/pack-studio.md:3-4`'s *"the same living pack validator as `make pack-check`"*. `PackStudio.lint` passes only `shapes` (`pack-studio.ts:87`); `pack-check.ts:140-143` passes shapes **and principles and sibling packs**, so `CLAIM_PRINCIPLE_UNKNOWN` (`:867`), `CLAIM_PRINCIPLE_OFF_PHASE`, `VARIANT_PACK_UNKNOWN` and `VARIANT_RELATION_UNPROVEN` (`:828`) are unreachable in Studio. A Studio-green pack can fail `make pack-check` | code, both files |
| 7 | **No `GET /principles`.** 13 entries, a finished `list()` projection, zero routes. The author cannot discover a single valid `principles[]` value | `rest.ts` grep = 0; `principle-registry.ts:63` |
| 8 | Errors are RFC 6901 pointers with **no line or column anywhere**, displayed against a plain textarea | `pack-validation.ts:111-121` |
| 9 | Four shape handlers have no error path at all | `App.svelte:597-614` |
| 10 | Distilled drafts are all named *"Distilled rehearsal"* | `App.svelte:430` |
| 11 | `/library`'s pack rows are inert and its PGN heading offers no PGN | `App.svelte:1082-1083` |
| 12 | The route named Library holds none of the library | `App.svelte:1079-1096` |
| 13 | `docs/app-shell.md:28` still describes `/create` as *"Honest empty state for the authoring program"*, last touched 2026-08-23 — stale against `docs/pack-studio.md` | both docs |
| 14 | `design/03:328`'s B6 correction says *"session distillation was claimed here and does NOT exist"*. It exists at HEAD: `rest.ts:1416`, `App.svelte:430`, banner `:818` | code |

---

## 2. Who authors here — and why this answer changes the whole specification

This is the question the commission asks first, and getting it right is worth more than any screen
below.

**The design tier's answer is unambiguous, and it is not "a coach" or "a contributor".**
`design/04-content-architecture.md:362-372` (owner ruling, D531): *"Classification of
claim↔principle pairings is claude's, against cited principles, **reviewed by the owner**."*
`design/00-thesis.md` contains no contributor, no community, no flywheel language at all `[V]`.
`design/04` §8's production order puts *"the long tail via study-import and session-distillation
tooling rather than hand authoring"* **last, at stage 5** (`:351-355`), and B6 already recorded that
half of it did not exist.

**The measurement agrees.** `pack-authoring-cost.md` measured **43.5 minutes per pack over 33 packs
and nine waves** `[P]` — and **every one of those minutes was an agent's**. The dossier's own honesty
limit (`:52-58`): *"Every minute figure is self-reported by the authoring agent."* Its category
split is the tell: encoding 43.6% · research 28.3% · engine-validation 11.2% · tooling-friction 11.6%
· revision 5.3% · **review 0.0%** `[P]`. The dossier states the meaning at `:256-264`:

> *"**Encoding-dominant here means prose-dominant.** The rule as written would misfire; the format is
> not the bottleneck, **writing honest chess prose is**."*

**So there are exactly three authoring populations, and only two of them are real today:**

- **A — claude, working in the repository.** The one that produced all 92 documents. Works in a text
  editor with the Makefile, does not use `/create`, and does not need a GUI to edit JSON.
- **B — the owner, ruling and reviewing.** Registered **zero minutes across nine waves** `[P]`. The
  design tier requires owner review for principle pairings and for anything clearing a graduation
  condition; the instrument for that review does not exist anywhere.
- **C — the community author.** Has a publication channel (`design/03:105-113`), an interchange
  guarantee (`:123-124`), a database-backed draft store, and no description in any design document
  of what they experience, why they would come, or what they get. **Population C is a channel
  without a person.**

**Three consequences that shape everything below.**

1. **This is not a course marketplace and must not be specified as one.** The single most-evidenced
   authoring fact in the corpus is Chessable's revenue-share author marketplace — *"we gave them the
   lion's share… Authors have essentially become our business partners"* `[P]`
   (`chessable-movetrainer.md:135-146`), 400+ authors, 1000+ courses `[P]`. That is a real moat and
   it is **structurally unavailable to us**: `docs/pack-graduation.md:42` and the 2026-08-13 owner
   ruling say *"There is no reviewer sign-off workflow"* and there never will be one. A marketplace
   without editorial review is a liability, not a moat. **Do not propose a review queue.** The
   honest analogue is Lichess studies — open authoring, no editorial gate, provenance and channel as
   the only safeguard — and that is exactly what `design/03:105-113` already rules.
2. **The highest-value authoring user we can serve today is population A, and population A is not
   served by `/create` at all.** A tool that is worse than the Makefile will be used by nobody who
   has the Makefile. Every recommendation in §3–§9 is therefore tested against one question: *does
   this beat `make pack-check` in a terminal?*
3. **Population B has no surface and needs one.** `design/04:347-348`'s pipeline still ends in
   *"review → publish"* — a step the 2026-08-13 channel ruling struck for packs but which D531 and
   D950 still require for principles and blocker clearance. Owner review registering 0.0% of 1,434
   measured minutes is not evidence that review is cheap; it is evidence that **it has never
   happened**. §8 proposes the instrument.

---

## 3. Feature — getting a document into the studio

### What a user expects

Nobody's first act in an authoring tool is *paste a 471-line JSON document*. The expectation, uniform
across every content tool anyone uses, is that **the tool starts you with something and you change
it**: a blank-but-valid skeleton, a template, a duplicate of an existing item, or an import.

They also expect the tool to know what it wants. Our format has **24 top-level properties, 10 of them
required** (`schemas/drill_pack.schema.json:7-18`), and every object in the schema is
`additionalProperties: false` across **52 `$defs`** — a stray `note` or `_todo` anywhere is a hard
error. An author cannot hold that in their head, and the current surface asks them to.

The sharpest expectation, and the one the shipped surface inverts: **tell me what is wrong before I
commit, not after.** Today the order is: paste blind → press *Create draft* → the server persists
your bytes → *then* you see the issues.

### What competitors do

`[M]` for anything about editor screens — see the ceiling. What is evidenced is the *entry paths*:

- **Import is the universal on-ramp, and it is a first-class shipped feature everywhere.** Chessbook:
  *"Import from **PGN, Lichess games/studies, and linked Chess.com/Lichess accounts**, or build
  move-by-move in the explorer"* `[P]` (`teardown-chessbook-desk.md:86-89`). Chessable's MoveTrainer
  2.0 shipped *"a **new PGN importer**"* as a headline replatform deliverable, explicitly *"**not**
  an algorithm change"* `[P]` (`chessable-movetrainer.md:114-116`) — the importer was worth a
  release on its own. Lichess ships *"studies as authoring; broadcasts; **board editor**"* `[P]`
  (`coverage-sweep-2-notability.md:146`). Chessigma, which has no importer, records that *"**PGN
  import is the most requested feature still on the roadmap**"* `[P]`
  (`teardown-chessigma-desk.md:169`).
- **A curated starting point beats a blank one.** Chessbook shipped *"pre-made repertoires with
  rating-range filtering"* in 2024, read by our own teardown as *"a curated on-ramp before personal
  authoring"* `[P]` (`teardown-chessbook-desk.md:90-92`).
- **The stopping rule is authored too.** Chessbook lets the author set coverage in games — *"1 in
  300 games"* — and flags deeper work as not worth it `[P]` (`:75-81`). Openings, unlike tactics,
  can be *"done"*. Nothing in our format lets an author say when a pack is finished.

### What we should do, and why it differs

**A1 — `/create` opens on a chooser, not a textarea.** Four doors, all of which already have working
back ends:

| door | back end | state |
|---|---|---|
| **Start from a position** — paste a FEN or play moves on a board | `start.fen` + `start.side` are 2 of the 10 required fields | needs a board |
| **Start from a game** — paste PGN or a Lichess URL | `POST /runs/import` ships (`api.ts:1009`) | wired to `/review` today, not here |
| **Start from a run you played** — distillation | `POST /runs/:id/distill` ships (`rest.ts:1416`) | wired, but unnamed and unreachable from `/create` |
| **Start from an existing pack** — duplicate and edit | `GET /packs/:id/export` ships (`docs/pack-studio.md:48`) | no client caller |

Three of the four exist. The reason to lead with them is not convenience: **it is that three of them
produce a schema-valid document before the author types a word**, which converts the whole of §5's
validation problem from "reach validity" into "stay valid".

**A2 — the fourth door produces a scaffold, not an empty string.** A new pack begins as the 10
required fields with honest placeholders and a `reviewStatus: "draft"` already set — not `""`. The
current empty state costs the author the single hardest part of the format (knowing what is
mandatory) at the single moment they know least.

**A3 — fix the version string, and make it derived.** *"Paste a v0.8 pack to begin"* should read the
schema's own `$id` rather than restating it. The document is at 0.27; a hardcoded 0.8 in the only
instructional string in the surface is the exact failure mode `design/05:41` exists to prevent — a
confident statement that is wrong.

**A4 — distillation asks for a title.** Replacing two hardcoded strings (`App.svelte:430`) with a
small form. A pack named *"Distilled rehearsal"* cannot be found later, which matters more once §10
gives the corpus a browse surface.

**Why this differs from the field.** Chessable's importer feeds a *course* — an ordered list of lines
with prose. Ours feeds a document that must additionally declare an objective, a resistance policy, a
feedback policy and a provenance block, and the fields the importer cannot fill are precisely the
ones carrying the judgement. So our import doors must **land the author in the editor with the
machine-fillable half done and the judgement half explicitly marked as owed** — which is exactly what
distillation already does correctly (`docs/pack-studio.md:60-68`: it copies only recorded move facts,
*"never authored grading, deviation classes, claims, plan classes, annotations, or engine evidence"*,
and *"always declares graduation blockers"*). Distillation is the model; the other three doors should
behave the same way.

### Cost and dependencies

| item | cost | depends on |
|---|---|---|
| A1 chooser | small — routing plus four cards | A2 for the fourth door; a board for the first |
| A2 scaffold | trivial — one constant, derived from the schema's required list | — |
| A3 version string | trivial | — |
| A4 distill title form | trivial | — |
| Moving game import from `/review` to a shared component | small | §11's IA decision |

---

## 4. Feature — editing the move tree

### What a user expects

The author is describing chess. The input device for chess is a board. They expect to play the line
and have the tool write it down.

What they get instead: `spine` is a recursive tree whose every node requires **four fields —
`id`, `moveUci`, `moveSan`, `children`** (`schemas/drill_pack.schema.json:470-487`), where `children`
is required even when empty, `moveUci` must match `^[a-h][1-8][a-h][1-8][qrbn]?$` (lowercase
promotion only), and `moveSan` must equal what `makeSan` computes for that move on that path — the
linter recomputes it and raises `SPINE_SAN_MISMATCH` (`lint.ts:216-223`). **The author hand-writes
the same move twice in two notations and hand-maintains the tree's legality**, and the deepest pack
in the corpus runs to 970 pretty-printed lines.

The cost of this is measured, not hypothesized. `pack-authoring-cost.md:229-236` records that **every
authoring wave rebuilt a throwaway chess-verification harness** — four independent attestations
across waves, two of them installing python-chess into a scratchpad venv again `[P]`. Authors keep
building a board because the tool does not have one.

### What competitors do

- **Everyone has a board editor, and it is unremarkable enough that nobody's teardown thought to
  record it.** Lichess ships a board editor and studies with variation trees `[P]`
  (`coverage-sweep-2-notability.md:135-146`). Chessbook lets you *"build move-by-move in the
  explorer"* `[P]`. Chessigma's analysis board offers *"Paste a FEN or PGN, explore variations"*
  `[P]` (`teardown-chessigma-desk.md:90`). **This is the one place where the corpus's silence is
  itself the finding**: a move-tree editor is so standard that not one of 28 teardowns treated it as
  a feature worth describing, and we do not have one.
- **The one product whose branching was actually observed destroys the tree.** `teardown-cet.md`
  `[V]` hands-on: *"**Branching is destructive.** Move-list click jumps to any node; playing a
  different move there **replaces** the recorded future."* Our authoring tree must not do that, and
  a textarea at least cannot.
- **A competitor's own architect indicts line-keyed authoring.** Chessbook's developer, fetched
  interview `[P]` (`teardown-chessbook-desk.md:65-69`): *"treating repertoires as a collection of
  lines is actually very limiting; it doesn't work for transpositions… **Store EPDs, not FENs**."*
  Our linter already detects the problem it names — `SPINE_TRANSPOSITION_COLLISION` on a 4-field FEN
  key (`lint.ts:233-240`) — as a **warning nobody sees until upload**.
- **Chessable handles transpositions editorially**, as authored chapters `[P]`
  (`chessable-movetrainer.md:104-112`). That is a content decision, not a tool feature, and it is
  the option available to a product whose authors are professionals with editors.

### What we should do, and why it differs

**B1 — a board is the primary input for `start`, `spine` and `deviations`.** Play the line; the tool
writes `moveUci`, `moveSan` and `children` and generates ids. This is not a nicety: **it deletes an
entire class of error the format currently permits and the author currently pays a harness to
avoid.** `ILLEGAL_SPINE_MOVE`, `SPINE_SAN_MISMATCH`, `INVALID_START_FEN`, `DUPLICATE_SPINE_NODE`,
`ILLEGAL_DEVIATION_MOVE` and `DEVIATION_WRONG_SIDE` (`lint.ts`, six error codes) all become
unconstructible rather than caught.

**B2 — the tree and the JSON are two views of one document, and both stay editable.** This is where
we should refuse the field's default. A pure visual editor would strip population A of the thing they
actually need — direct access to `guard`, `timingWindows`, `objective.grading`, `feedbackClaims` —
and `docs/pack-studio.md:57-58`'s *"intentionally low-level"* posture is defending something real.
The answer is not to overturn it but to **stop making it exclusive**: a board and a structured
outline for the parts a board can express, the raw document for everything else, with selection
synchronised in both directions. Clicking `/spine/0/children/2` in the issue list selects that move
on the board; playing a move scrolls the JSON to it.

**B3 — transposition and reachability warnings render on the board, where they mean something.**
`SPINE_TRANSPOSITION_COLLISION` is a statement about two positions being the same, and it is
currently a string containing a pointer. Likewise `AUTHORED_PROSE_AFTER_LAST_CHECKPOINT`
(`lint.ts:99-106`) — prose that **can never be revealed to a learner** — which is the single most
important warning in the linter for an author whose measured bottleneck is *writing prose*
(`pack-authoring-cost.md:256-264`), and it currently renders as `WARNING /spine/…/annotations/1`.
An author who has just spent twenty minutes on a paragraph deserves to be told, on the board, that
nobody will ever see it.

**Why this differs.** Every competitor's tree editor produces a *repertoire* — moves plus optional
comments. Ours must produce a **document that a runtime can play against a learner**, so the tree
editor's real job is not move entry; it is showing the author **the three overlays only our format
has**: which nodes are inside `authoredBoundary`, where each `checkpoint.trigger` fires, and which
`deviations` hang off which node with what `class`. Those are the fields that make it a drill rather
than a study, and they are invisible in a textarea.

### Cost and dependencies

| item | cost | depends on |
|---|---|---|
| B1 board input for start/spine/deviations | **large** — the biggest single item in this dossier | Chessground already ships in the client; chessops already ships in `@chess-tabiya/schema` lint |
| B2 dual view with synchronised selection | medium | B1; a structured editor model over the document |
| B3 board-rendered lint overlays | small once B1/B2 exist | §5's issue model |

**Dependency note:** B1 is large but it is not novel. The client already renders a board with legal
move generation for the drill screen, and `lint.ts` already walks a pack's tree with chessops to
prove legality. B1 is joining two shipped things.

---

## 5. Feature — validation while you work

### What a user expects

Continuous, positional, prioritized feedback: errors where they are, as you make them, worst first.
This is the least controversial expectation in software and the shipped surface violates every clause
of it.

### What competitors do

The only evidenced authoring-time validation in the corpus, and it is a good one:

- **Chessable runs an engine check over the author's course as a batch job.** `teardown-chessable-desk.md:31`
  `[P]`: *"Soft fail is per-course batch computation, **PRO-gated for self-made courses**, 'should'
  be on for all published courses"*, with margins at `:27` — openings within 0.3 eval, tactics
  mate-preserving or within 1.0, endgames tablebase-equivalent. Two things to take from this: the
  check is **asynchronous and whole-document**, not per-keystroke; and it is **tier-gated for
  user-authored content**, i.e. even the category leader treats machine-checking author content as a
  cost centre.
- **Chessable gives authors a scoping tool with automation.** *"**Key moves**: up to two per
  variation mark a study window… **with an automated marking script for authors**"* `[P]`
  (`chessable-movetrainer.md:86-88`).
- **The counter-example is what happens without it.** Chessbook, whose stats are excellent and whose
  prose is unchecked: *"Very few lines have explanations, and with the ones that do, **there are many
  errors** (such as a knight move being described as 'developing a bishop to the long diagonal')"*
  `[P]` (`teardown-chessbook-desk.md:176-179`). Our own dossier flags it as *"an ADR-0005 cautionary
  case: ungrounded prose erodes trust even in a beloved tool."*

### What we should do, and why it differs

Our validator is far stronger than anything evidenced in the field — three layers, ~150 runtime
codes, checkpoint reachability that **actually creates a run and plays it**
(`pack-validation.ts:1324-1348`). The problem is entirely in delivery, and it has four parts.

**C1 — lint the buffer, continuously, without saving.** `POST /packs/drafts/:id/lint` already accepts
`body.document` — arbitrary unsaved bytes (`rest.ts:1058`) — and **the client has no caller for it**.
This is the cheapest high-value fix in the dossier: one API method and a debounced call, and the
author stops having to upload in order to be told they were wrong.

**C2 — solve the partial-document problem, which the validator will not solve for you.**
`validatePackDocument` returns early on schema failure (`pack-validation.ts:1364-1369`) and computes
**no lint and no runtime issues**. So a half-written pack yields only structural errors; then, the
moment it goes schema-clean, the entire semantic surface arrives at once. That is the worst possible
shape for an author working top-down, and it is a wrapper concern:

- Present the required-field set as a **checklist of what is still missing**, not as errors. AJV
  helps here — `schemaPath()` appends the missing property to the instance path
  (`pack-validation.ts:117-119`), so a missing `title` reports `/title`, not `/`. That is directly
  usable as a "not yet filled in" marker rather than a failure.
- Distinguish **"incomplete"** from **"wrong"** in the interface. Today they are the same list.

**C3 — collapse the `oneOf` explosion before display.** `successCondition` is an 8-arm `oneOf` and
`structuralFeature` an 18-arm one, under `allErrors: true`. One wrong key inside one arm produces
failures against *all* arms at the same instance path. Filter on the discriminating key (`kind` /
`type` / `state`) and show the arm the author was evidently writing. Without this, C1's continuous
linting would make things worse, not better.

**C4 — make Studio and CLI agree, and treat the disagreement as a defect.** `PackStudio`'s
constructor takes `(storage, registry, shapes?)` (`pack-studio.ts:41-50`) and its `lint` passes only
shapes, while `pack-check.ts:140-143` passes shapes, principles and sibling packs. Four codes are
therefore silently unreachable in Studio, and `docs/pack-studio.md:3-4`'s claim that Studio *"uses
the same living pack validator as `make pack-check`"* is false at HEAD. The registry itself does get
principles (`application.ts:274-286`), so the served catalogue is safe — but **the Studio author is
flying blind on exactly the fields v0.26 added**. Passing two more constructor arguments fixes it.

**C5 — surface the checks the linter cannot run, rather than hiding them.** `make verify-draft`,
`make tablebase-walk` and `make engine-walk` are the grounding half, and `pack-authoring-cost.md:156-165`
records that they have the best ratio in the corpus: **~8 minutes of engine time per pack buying
seven caught errors across ten packs** `[P]` — including *"a drafted mainline that queried as a
draw"* and *"a both-bishops-on-dark-squares root that queried as a draw"*. These are long-running and
network-bound, so they belong as **explicitly requested jobs with visible state**, not as
lint-on-keystroke. `design/05:41` governs the presentation: a grounding pass that has not been run
says so, rather than the pack looking clean.

**Why this differs from the field.** Chessable's soft-fail asks *"is this move within 0.3 of best?"*
Ours asks *"can this objective ever resolve, is this checkpoint reachable, does this timing window
ever close, is this guard satisfiable, does this structural expression have a non-empty domain"* —
`OBJECTIVE_RULES_UNCOMPILABLE`, `CHECKPOINT_UNREACHABLE_AT_ROOT`, `TIMING_WINDOW_NEVER_RESOLVES`,
`GUARD_DISABLES_EVERYTHING`, `QUANTIFIED_DOMAIN_EMPTY`. **These are questions about whether the drill
works at all, and no competitor has them because no competitor's content unit can fail this way.**
That makes the delivery problem more urgent, not less: our validator is our differentiator and it is
currently presented as a wall of `<code>` tags.

### Cost and dependencies

| item | cost | depends on |
|---|---|---|
| C1 debounced buffer lint | **trivial** — one `api.lintPackDraft` method plus a debounce; endpoint ships | nothing |
| C2 incomplete-vs-wrong split | small–medium; presentation logic over the existing issue list | C3 to be usable |
| C3 `oneOf` discriminator filtering | medium; needs a small map of union → discriminating key | nothing |
| C4 Studio/CLI parity | **trivial** — two constructor arguments | nothing. **This is a defect, not a feature** |
| C5 grounding jobs with visible state | medium; the jobs exist as CLI, need a server-side runner and status | operator boundary for explorer credentials (`docs/content-sourcing.md:155-156`) |

---

## 6. Feature — the vocabularies an author has to guess

### What a user expects

When a field takes one of a known set of values, they expect to be shown the set. This is not a
preference; it is the difference between a controlled vocabulary and free text, and the corpus
already shows which one we have.

**Measured this pass, over the 56 draft packs `[V]`:**

| vocabulary | governed how | reuse |
|---|---|---|
| **`principles`** — 13 registered entries | fail-fast registry, id-validated at load | **12 of 13 referenced, by 35 of 56 packs** |
| **`shapes`** — 25 registered entries | registry, unknown ids rejected at registration | **21 of 25 referenced, by 38 of 56 packs** |
| **`concepts`** — free text | `array of nonEmptyString, uniqueItems`, no pattern, no registry | **168 distinct, 143 used exactly once — 85% singletons** |

That is the entire argument in one table. The two vocabularies with a registry became real shared
vocabulary; the one without became 143 orphan strings. And `docs/shape-library.md:96` confirms the
absence is by design, not accident: the library *"does not supply… **cross-pack concept identity**"*,
which [[D700]] measures at the persistence layer — 199 references deliberately fragmented into
pack-scoped `pack:<pack>#<raw>` keys.

**And the author cannot see either registry from the studio.** `GET /shapes` exists
(`rest.ts:1000`) and the create route never calls it. `GET /principles` **does not exist** — 13
entries, a finished sorted projection at `principle-registry.ts:63`, zero routes. An author writing
a `feedbackClaim` with `evidenceTypes: ["author_principle"]` is guessing at the 13 ids until
`make pack-check` tells them, and per §5's C4 the Studio will not even tell them then.

### What competitors do

- **The field's controlled vocabulary is the opening name, and it is the primary browse axis
  everywhere.** 365Chess's trainer configures by *"database (Big/Masters), color, **opening or ECO
  code**"* `[P]` (`teardown-365chess-desk.md:93-101`). Chessable's priority lines are
  *"algorithm-selected… based on a database of online games **in a certain rating range**"* `[P]`.
  ChessMotive tags positions `phase` / `difficulty` / `themes` / `event` / `moveNumber`, with `phase`
  **validated** to `opening|middlegame|endgame` `[P]` (`teardown-chessmotive-desk.md:43-44`).
- **Lichess's puzzle theme keys are a controlled vocabulary we already treat as reusable fact.**
  `theory-sourcing.md:108-112` `[V]`: take the theme **keys** as facts, *"write our own description
  prose"*.
- **The one product that let its taxonomy sprawl produced the corpus's sharpest browse complaint** —
  Aimchess's Training Room, *"a list of lists with **no particular order of difficulty, frequency,
  priority, expected duration**"* `[P]` (`competitor-play-ux.md:140-141`).

### What we should do, and why it differs

**D1 — `GET /principles`, mirroring `GET /shapes`.** Four lines in `rest.ts` over a projection that
already exists. It unblocks the studio picker (D2), the library (§10) and the F7 join [[D695]] names.

**D2 — every registry-backed field is a picker, never a text input.** `principles`, `shapes`, and
`objective.type` (a 12-member enum of which `authoring-vocabulary-completeness.md:95-119` measures
**7 in use**). The picker shows the entry's `name` and `statement`, not just its id — an author
choosing `result-not-moves` should see *what it asserts* and its `counterCase`, because
`schemas/principle_entry.schema.json` **requires a counter-case on every principle** and that is the
thing that makes the choice honest.

**D3 — `concepts` gets an autocomplete over what already exists, and nothing more.** This is
deliberately weaker than a registry. [[D700]] rules that grouping labels *"would launder identity"*
and that a registered identity plus migration is required — that is a content-architecture decision
above this dossier's tier. But **suggesting an existing string while the author types costs nothing
and would have prevented most of the 143 singletons**, and it does not assert that two packs' use of
a string means the same thing. The lint already warns `CONCEPT_KEY_NOT_SLUG` (`lint.ts:390-399`);
the studio should apply the slug rule at the input rather than reporting it afterwards.

**D4 — the studio must state which vocabulary entries are dead.** Measured this pass: **one orphan
principle** (`activity-has-a-price`, referenced by zero packs) and **four orphan shapes**
(`hanging-pawns`, `knight-vs-bishop`, `up-an-exchange`, `vancura`). Also
`authoring-vocabulary-completeness.md:95-119` `[V]`: of the declared vocabulary, **4 reasoning-ground
kinds have 0 uses, 7 tempo verdicts have 0 uses, 3 `variantOf` relations have 0 uses**, and
`plan_defense` / `human_external` are in the schema enum but declared unimplemented
(`capabilities.ts:31-34`) — **selectable in a textarea, unselectable in reality**. A picker that
shows an unimplemented option without saying so is a trap; one that hides it silently violates
`design/05:41`. It should show it, disabled, with the reason.

**Why this differs.** Every competitor's vocabulary is descriptive metadata — themes, tags, ECO codes
— and getting one wrong makes an item harder to find. Ours is **load-bearing on trust**: a
`feedbackClaim` naming a principle is the mechanism by which an authored judgement becomes
attributable rather than asserted (`docs/drill-pack-format.md:96-98` — *"The registry makes authored
judgement attributable, not machine-true"*). Under `design/05:76`'s rung 5 — *"An author's judgement.
Can simply be wrong, and with no review workflow… provenance is the only safeguard"* — **the picker
is a trust mechanism, not a convenience.**

### Cost and dependencies

| item | cost | depends on |
|---|---|---|
| D1 `GET /principles` | trivial; projection exists | — |
| D2 pickers | small once D1 and C4 land | C4 (Studio must hold the registries to validate against them) |
| D3 concepts autocomplete | small; client-side over the served corpus | `PackSummary` widening, which `ux-arrival-and-start.md` §5.4 already requires for its own C1 |
| D4 dead/unimplemented marking | small | `capabilities.ts` already declares it |

---

## 7. Feature — provenance, licence and attribution, while you work

### What a user expects

An author expects the tool to tell them what they owe **before** they publish, and to make paying it
possible. The commission names two ledger rows here, and both are visible in the encoding.

**What ships today, measured `[V]`:**

- The pack schema's `provenance` requires **exactly one field**, `reviewStatus`. `sources`,
  `licence` and `attribution` are all optional.
- **`provenance.attribution` items are `{"type": "object"}` — no required keys, no closure**
  (`schemas/drill_pack.schema.json:1148-1151`). Any object passes. By contrast
  `schemas/shape_entry.schema.json` and `schemas/principle_entry.schema.json` both **require
  `["title","author","licence"]`** on every attribution row. The pack schema — the one carrying the
  most third-party material — is the loose one.
- The real obligation lives elsewhere: `licenceObligations` (`sourcing/check.ts:340-354`) demands an
  attribution row whose `sourceId` matches the manifest, whose `licence` is `CC-BY-SA-4.0`, and
  **whose `noticeText` matches the manifest entry byte-for-byte**. So the de-facto shape is
  `{sourceId, licence, noticeText}` and **the schema will not guide the author to it**, nor will
  `make pack-check` catch a wrong one — only `make sourcing-check`, which
  `docs/content-sourcing.md:33-35` makes *advisory* outside `content/candidates/`.
- **The corpus shows the predictable result.** Of 56 draft packs: **11 carry no `licence` key at
  all**; **31 carry no `attribution` key at all** and 3 more carry an empty array, so **34 of 56 have
  no attribution entry**. Of 25 shape entries, **23 have zero attribution rows** despite all 25
  declaring `CC-BY-SA-4.0`.

**[[D1394]] is visible in the encoding, not just in the type.** The licence row in a candidate
manifest is `{basis, noticeText, rationale, spdx}` — measured across 42 `sources.json` files: **35
rows are `{"basis":"spdx","spdx":"CC0-1.0","noticeText":null}`** and 74 are `no-rights-asserted`.
There is **no `author`, no `title`, and no `url` field on a licence row**, and the only attribution
channel — `noticeText` — is `null` on every CC0 row. So the one permissive licence in the union is
the one that structurally cannot be credited. The raw retrieval cache is thinner still: a
`content/sources/` record is `{body, etag, kind, retrievedAt, status, url}` — **no licence field at
all** `[V]`.

**[[D1396]] compounds it.** The `PROSE_POINTERS` set — the five pointers a citation may load-bear on
(`check.ts:36-42`) — is `/objective/summary`, `/planClasses/{n}/description`,
`/spine…/annotations/{n}`, `/deviations/{n}/note`, `/feedbackClaims/{n}/text`. Zero of 893 records
support one. `authoring-vocabulary-completeness.md:240-246` `[V]` states the consequence: 66
`EVIDENCE_TYPE_UNBACKED` warnings, and `check.ts:191` promotes that warning to an **error** on
`published` — **so the entire corpus is unpublishable on that check alone.**

### What competitors do

- **Nobody in the corpus shows an author their licence obligations, because nobody in the corpus has
  any.** Chessable, Chessbook, Chessigma and 365Chess all author against material they own or
  license commercially. This is a place where the field offers us nothing to copy, and the reason is
  our own posture: `theory-sourcing.md:7-9` `[V]` — *"original prose only OR compatibly-licensed
  prose with attribution… **Content licensing is kept separate from code licensing**."*
- **The two clean postures, and the rule against mixing.** `theory-sourcing.md:56-63` `[V]`: either
  all-original prose citing sources as reference, or pack prose declared CC BY-SA 4.0 wholesale.
  *"**Do not mix per-paragraph — provenance tracking will not survive edits.**"* This is the single
  most important sentence for the authoring UX, because a per-field attribution model is exactly
  what a naive studio would build.
- **Lichess studies are author-owned; there is no blanket reuse right** `[V]` (`theory-sourcing.md:118-121`)
  — which matters directly, since §3's import doors include Lichess studies. **An imported study's
  annotations are someone else's copyright**, and the import path must strip them, as
  `famous-game-sources-licensing.md:276-279` `[V]` already establishes for games: *"an imported
  annotation is another party's move verdict entering our corpus as authored-looking text — the D410
  shape and the ADR-0005 anti-pattern."*
- **Attribution already has somewhere to live.** `famous-game-sources-licensing.md:311-322` `[V]`:
  *"**An attribution obligation has somewhere to live today without a schema change.**"*

### What we should do, and why it differs

**E1 — a provenance panel that is filled in as the author works, not a JSON block they remember.**
Three questions in plain language: where did this come from, under what licence, and who must be
credited. The panel writes `provenance.sources`, `provenance.licence` and `provenance.attribution`,
and it names the two clean postures from `theory-sourcing.md:56-63` as an explicit choice rather than
letting the author drift into a per-paragraph mix that provenance cannot survive.

**E2 — close `provenance.attribution` in the pack schema to match the shape and principle schemas.**
`{title, author, licence}` required, `url` optional, `sourceId` and `noticeText` added for the
sourcing checker's benefit. Two schemas in this repo already do it. This is a format change and
therefore an RFC, not a client change — named in §12.

**E3 — the studio runs the licence check the CLI runs, and shows what it found.**
`make sourcing-check` is where `ATTRIBUTION_MISSING` and `LICENCE_MIXED` live, and no client surface
invokes it. An author who has imported a CC-BY-SA source and not credited it should be told **at the
moment of import**, not at a `make` target they may never run.

**E4 — [[D1394]] is a blocker for the import doors, and the studio should say so rather than
silently degrade.** A CC0 source cannot currently be attributed: `sourcing/types.ts:4` caps `spdx` at
two ids, and `check.ts:342`/`:353` raise `LICENCE_MIXED` for anything that is not exactly
`CC-BY-SA-4.0`. So the Lichess puzzle DB and the `chess-openings` TSV — both CC0, both already in the
pipeline, 35 manifest rows between them — enter with **no channel to name their origin in a
learner-visible way**. Under `design/05:41` the studio's honest behaviour is to display the licence
row it *can* record and state what it cannot, rather than presenting a credited-looking pack.

**E5 — do not build per-claim citation UI on either unlanded RFC.** `rfc/pack-population-provenance.md`
is **accepted but not implemented** (claims schema 0.29; `provenance.corpusEvidence`, `citable_text`
and `provenance_note` do not exist in the tree), and `rfc/claim-semantic-anchors.md` is **draft and
blocked** (*"Acceptance is blocked until §7 can name the literal F3 declaration and refusal
behavior"*, `:304-305`). The two are in a recorded deadlock — `pack-population-provenance.md:562-577`:
*"whichever of these two RFCs lands second owes the reconciliation."* The one sentence in either that
is written directly at this surface is `claim-semantic-anchors.md:275-276` `[V]`: *"Authoring tools
may show a proposed canonical rewrite. **Applying it is an explicit content edit, not an automatic
binding.**"* That constraint should be honoured now — **no auto-rewrite of authored prose, ever** —
and the rest deferred until one of the two lands.

**Why this differs.** Every competitor's authoring tool is a content tool. Ours is a content tool
with a **licence compiler attached**, because our corpus is assembled from CC0 and CC-BY-SA sources
under a posture we chose. That is a genuine differentiator — `adoption-audit.md:63` `[V]` records our
provenance discipline as already **shipped in substance** and better than the field's — and it is
currently invisible to the person creating the obligation.

### Cost and dependencies

| item | cost | depends on |
|---|---|---|
| E1 provenance panel | medium | — |
| E2 close the attribution schema | small code, **RFC-gated** | §12 |
| E3 sourcing-check in the studio | medium; the checker is CLI-shaped and needs a server entry point | operator boundary for network sources |
| E4 honest CC0 statement | trivial | — |
| E5 defer claim-binding UI | zero — a refusal | either RFC landing |

---

## 8. Feature — graduation blockers, and the owner-review instrument that does not exist

### What a user expects

Publishing is the point. An author expects the tool to show them **what stands between this draft and
publication**, as a worklist they can attack.

The mechanism for this is unusually good and completely unsurfaced. `docs/pack-graduation.md` defines
typed conditions with three states — `blocking` (unpaid work), `resolved` (preserves the original
statement plus when and how it was cleared), `accepted` (a deliberate non-work condition **requiring
a resolvable ruling citation**). That is a well-designed contract.

**What the corpus actually holds, measured this pass `[V]`:**

- **293 typed conditions across 55 of 56 packs** — 220 `blocking`, 43 `accepted`, 30 `resolved`.
- **205 distinct blocker ids for 293 conditions; 184 of them fire exactly once.**
- **The median blocker id length is 56 characters. So is the maximum.** The ids are prose sentences
  slugified and truncated at exactly 56 — `the-one-break-counting-rule-feedbackclaim-is-the-pack-s-`,
  `engine-evidence-now-recorded-the-root-and-authored-posit`, ending mid-word with a trailing hyphen.

The "stable id" the graduation contract rests on is a truncated sentence, and it is a direct
consequence of there being no condition vocabulary to pick from. The visible cost is in the generated
audit page: `no-review-workflow` appears **40 times**, and `content/accepted-conditions.md` shows it
was **hand-paraphrased each time** — *"Only a citable source or mechanical validation that bears on
the claim clears a blocker"*, *"The only two things that clear one are…"*, *"No sign-off will ever
clear a blocker below…"*. One owner ruling, one condition, forty rewrites.

### What competitors do

- **Chessbook is the only product in the corpus with a "done" concept, and it is authored.**
  `teardown-chessbook-desk.md:75-81` `[P]`: the stopping rule is *"a user-set coverage target
  expressed in games"* — *"1 in 300 games"* — below which digging deeper is flagged not worth it.
  Philosophy at `:38-40`: openings, unlike tactics, can be *"done."*
- **Chessable's publication gate is editorial and commercial**, not mechanical — the revenue-share
  partnership `[P]` is the review mechanism. **Structurally unavailable to us** per §2.
- **The failure mode when publication is ungated.** Chessbook again: *"Very few lines have
  explanations, and with the ones that do, there are many errors"* `[P]`.

### What we should do, and why it differs

**F1 — the blocker list is the studio's primary right-hand column, not a validation footnote.** For
an author, *"what is stopping this from being published"* is a more useful organising question than
*"what is structurally invalid"*, and the data already exists per draft.

**F2 — a typed condition vocabulary with a picker, and free text only as a `statement`.** The
`graduationEntry` shape requires `{id, state, statement}`. Today the id is derived from the
statement; it should be **chosen from a registry** and the statement should carry the prose. This
converts 205 unique-by-accident ids into a countable set, which is the precondition for F3.

**F3 — the corpus-level view: which blockers, how many packs, in what order.** With F2's vocabulary,
*"40 packs are blocked on `no-review-workflow`, 19 on missing engine evidence"* becomes a sentence
the product can say. Today `make graduation-report` produces a 95-line page grouped by condition
kind, and no interface reads it. **This is the closest thing the product has to a content roadmap and
it is a Makefile output.**

**F4 — build the owner-review instrument, because `review` has registered zero minutes and that is
not a good sign.** `design/04:362-372` requires owner review for claim↔principle pairings; D950
requires owner veto over authored `counterCase`s; `accepted` blockers require a resolvable ruling
citation. `pack-authoring-cost.md:65-70` `[P]`: *"`review` is zero everywhere and always was"* — and
`:269-272` records the plan's prediction that owner review would dominate as **falsified by the
data**. The honest reading is not that review is cheap; it is that **it has never happened**, and the
instrument for it does not exist. What it needs is small: a queue of pairings and accepted conditions
awaiting a ruling, each showing the claim, the principle, its `counterCase`, and the citation being
offered — with approve, reject, and *"needs a real source"* as the three outcomes.

**F5 — do not build a review queue for community packs.** This is a refusal and it is ruled, not
chosen. `docs/pack-graduation.md:42`: *"There is no reviewer sign-off workflow"*; `docs/pack-studio.md:31`:
*"publication channel communicates the actual safeguard."* F4 is the **owner ruling on our own
content**, which the design tier requires. F5 is **third-party editorial review**, which the design
tier forbids. Keeping these separate is the whole reason F4 is proposable.

**Why this differs.** Every competitor's publish button means *"it is live"*. Ours means *"an
immutable version enters a channel whose only safeguard is the provenance attached to it"*. So the
pre-publication surface is not a checklist of polish items — it is **the last place a human can look
at an unproved claim before it becomes permanent**, and `design/05:76` says provenance is the only
thing standing behind it.

### Cost and dependencies

| item | cost | depends on |
|---|---|---|
| F1 blockers as primary column | small; data is on every draft view | — |
| F2 condition vocabulary + picker | medium; needs a registry and a migration for 205 existing ids | **format change → RFC** |
| F3 corpus blocker view | small once F2 lands; `graduation-report` already computes it | F2 for grouping to mean anything |
| F4 owner-review instrument | medium | D531's precondition (principles regrounded to `chess_tradition`) for pairings to be worth reviewing |
| F5 no community review queue | zero — a refusal, already ruled | — |

---

## 9. Feature — the shape editor and its trigger

### What a user expects

A shape entry is, per `design/04:99-103`, *"the expensive, high-leverage, reusable asset"* — authored
once, firing wherever the classifier matches. The author's question is therefore not *"is this JSON
valid"* but **"where does this fire, and where does it fire that it shouldn't?"**

The shape editor is the one place the studio already tries to answer that: a **Probe FEN** input and
a *Lint + probe* button returning *"Probe trigger: matches"* or *"does not match"* (`App.svelte:1014-1021`).
That is a real idea, and it is one FEN at a time, one boolean at a time — against a `trigger` that is
a nested boolean tree. `content/shapes/lucena.json`'s trigger is a single line containing an `all` of
a `not` of an `any` of eleven `piece_count` predicates plus a six-way `passed_pawn` disjunction. The
median shape is 322 pretty-printed lines; the largest is 995.

**The cost is written into the corpus in the authors' own words.** `lucena.json`'s `watch` array
contains this, addressed to the learner because there was nowhere else to put it:

> *"Fires for the rook-and-pawn-versus-rook census with a passed knight- to bishop-file pawn on the
> seventh; **whether the attacking king stands in front of the pawn and the defending king is cut
> off — the actual Lucena conditions — is king geometry this vocabulary cannot express.** Verify on
> the board."*

And in the same file, a plan's `success.note` reads *"RESTATED PLAN. The plan was 'Run the checking
rook out of distance'… Original success note: …"* — migration debris, visible in a shipped record,
because the author had no view of what a trigger change did to the corpus.

Meanwhile the CLI has exactly the missing instrument: `make shape-check FILE= PROBE= **CORPUS=**`
takes a corpus, and `make expression-census` *"measures every trigger and non-null success signature
over the authored position corpus"* (`docs/shape-library.md:86-88`).

### What competitors do

- **Nothing in the field authors structural predicates, so there is no competitor practice to
  compare.** `[V]` as an absence over the 28-product matrix — no product in the corpus has a
  reusable-pattern content unit at all, which is what B11 claims as differentiated
  (`design/03:333`).
- **The nearest analogue is a tagging taxonomy applied by hand.** ChessMotive tags positions with
  `themes` `[P]`; Lichess's puzzle themes are machine-derived and we already treat their **keys** as
  reusable facts `[V]` (`theory-sourcing.md:108-112`). Neither is authored as a predicate over a
  position.
- **The transferable pattern is Listudy's, and it is about co-location, not triggers.**
  `theory-drill-current-joins.md:125-136` `[V]`: Listudy's study surface exposes *"comments,
  move/annotation hints, configurable hint duration, reset, Stockfish play and Analyze **beside the
  same variation**"*, and the transfer is *"do not force the learner through global settings"*. The
  authoring version of that is: **the trigger, its matches and its prose belong on one screen.**

### What we should do, and why it differs

**G1 — the probe becomes a corpus preview.** Replace the one-FEN boolean with *"this trigger fires on
N of the M authored positions"* plus the list, each opening the board. `make shape-check`'s `CORPUS`
argument and `make expression-census` already compute exactly this, and `docs/shape-library.md:92-93`
records the cost envelope: four entries over all 16 Pack B spine positions at **median 1.313 ms,
maximum 3.238 ms** `[V]`. **This is cheap enough to run on every edit.**

**G2 — a structured expression builder over the 18-leaf grammar, with the JSON alongside.** Same
posture as §4's B2: not a replacement, a second view. The grammar is duplicated verbatim between
`drill_pack.schema.json` and `shape_entry.schema.json`, kept in step only by a sync test
(`docs/shape-library.md:24-26`); a shared builder should read one grammar and assert the two agree —
which turns a duplication hazard into a single source.

**G3 — the null-signature refusal becomes an explicit authoring choice.** Measured this pass:
**21 of 117 authored plans (18%) carry `success.signature: null`** — the explicit, learner-visible
refusal to grade. `docs/shape-library.md:28-29` makes it deliberate, and the schema requires a `note`
alongside it. The editor should present it as a first-class option — *"this plan's success cannot be
expressed structurally, and here is why"* — rather than something the author reaches by typing
`null`. **This is `design/05:41` at the point of authorship**, and an 18% honest-refusal rate is a
number the product should be proud of rather than one it hides.

**G4 — give the trigger somewhere to explain itself.** [[D103]] already ledgers it: *"A shape entry
has nowhere to record why its trigger says what it says"* — `triggerNote` was rejected by
`additionalProperties: false`. The Lucena entry's `watch` array is carrying that load today, which
means **an authoring limitation is being narrated to learners as chess advice**. A format change, so
RFC-gated; named in §12.

**G5 — fix the shape editor's missing error path.** Four handlers, no `try`/`catch`, no error
element (`App.svelte:597-614`). This is a bug, not a design question.

**Why this differs.** Everyone else's reusable content unit is a tag: applied by hand, wrong in one
place at a time. Ours is a **predicate evaluated by a runtime against every position a learner
reaches**, so an authoring error is not one mislabelled item — it is a claim that fires
systematically on positions the author never saw. That makes corpus preview (G1) the single most
important feature in the shape editor, and it is the one the CLI already has.

### Cost and dependencies

| item | cost | depends on |
|---|---|---|
| G1 corpus preview | small–medium; evaluator ships, `CORPUS` path ships, needs a server route | a served position corpus (the authored spines) |
| G2 expression builder | **large**; 18 leaves plus `all`/`any`/`not`/quantified | grammar sync test as the contract |
| G3 null-signature as a choice | small | — |
| G4 `triggerNote` | small code, **RFC-gated** | §12 |
| G5 error path | trivial — a bug fix | — |

---

## 10. The library — does it have any reason to exist for a learner?

The commission asks for an honest answer. Here it is in two parts, because the honest answer is
different for the route and for the content.

### 10.1 The route as shipped: no. It should be deleted rather than improved.

`/library` is **a strictly worse copy of `/play`'s pack list and a strictly worse copy of `/review`'s
run list, with a delete button attached** `[V]` (§1.2). Its pack rows drop four fields `PackList`
already renders and are not clickable. Its second section promises PGN export and does not offer it.
Its title is *"Packs and run artifacts"* — the word *artifacts* facing a learner.

`ux-arrival-and-start.md` §5 already owns the pack catalogue and specifies it properly (C1–C5:
phase-first navigation, search over title + `concepts` + `objective.summary`, the objective sentence
on the card, mode verbs, relative difficulty). **When C1–C5 land on `/play`, `/library`'s first
section is redundant by construction.** Its second section is `/review`'s job. Keeping the route as a
place to put lists that did not fit elsewhere is how `design/03:293`'s five promised destinations
became one inert `<ul>`.

There is also a direct warning from our own corpus. `theory-drill-current-joins.md:152-156` `[V]`,
surveying how the best workflows join theory to practice:

> *"The best workflows all preserve a smaller identity than 'topic': a course variation, repertoire
> branch, study chapter or exact practice position… **The useful synthesis is therefore not one giant
> Library page.**"*

### 10.2 The content it is named for: yes, and the evidence is quantitative

Three things make a browse surface over shapes and principles worth building, and all three are
measured rather than assumed.

**First, there is a real body of knowledge.** 25 shape entries carrying **117 named plans, 78 watch
points and 89 typical mistakes** — 284 authored units — plus 13 principles, each with a required
`statement` and a required `counterCase` `[V]`.

**Second, it is genuinely reusable, which is the design tier's own test.**
`design/04-content-architecture.md:179` sets the bar: *"Content earns its cost by how much of it
fires in a game nobody authored."* Measured this pass: **21 of 25 shapes are referenced by 38 of 56
packs; 12 of 13 principles are referenced by 35 of 56 packs.** Compare `concepts`, the field that is
*on* the pack card's data model: 168 distinct, 143 singletons. **The two vocabularies that are
invisible to users are the two that actually became shared; the one that is visible is not a
vocabulary at all.**

**Third, learners already meet this content and cannot get back to it.** Shape entries reach the
learner today as *"passive timeline markers"* that open *"an attributed detection-and-plans panel"*
mid-run (`docs/drill-client.md:316-319`). So a learner who played into the Carlsbad structure has
read its plans, its watch points and its typical mistakes — **and there is no surface anywhere that
lets them read it again, or find the other packs that rehearse it.** [[D695]] measures the resulting
dead ends: *"ShapePanel has no drill door, **Library has no theory/shape catalogue** and even its
pack rows are inert."* [[D692]] measures the sharpest one: `shapeRecommendations()` computes the
exact matching `packIds` and the client *"prints and then discards"* them, calling a bare
`navigate("/play")`.

**So the reason a learner would go there is specific and it is not "browsing".** It is: *I met a
thing called the Carlsbad structure in a drill; what is it, and what else rehearses it?* That is a
question with a named subject, an answer we hold, and no route.

### 10.3 What a learner expects from such a surface

- **To recognise the name.** They arrive with a word they saw mid-run, not a category.
- **A definition and a picture.** What is this structure, and what does it look like on a board.
- **What to do about it** — both sides. Our 117 plans are already authored per colour.
- **A door back into play.** The single most-cited pattern in the corpus. 365Chess's browse funnel is
  *"name → stats → games → **play it**"* `[P]` (`teardown-365chess-desk.md:233-237`), and our own
  audit's verdict on the last hop is that *"they leave [it] as a bare Stockfish game and we make the
  actual product."*
- **Honesty about what is not known.** 18% of our plans decline to state a structural success
  condition. A learner should see that as candour, not as a gap.

### 10.4 What competitors do

- **Depth in a narrow catalogue beats breadth, and it is achievable at our scale.** The corpus's only
  hands-on catalogue measurement: **83 positions in R+P vs R alone, 20 subcategories under Rook &
  Pawn**, each launchable from a FEN-in-URL with a target objective `[V]` observed
  (`teardown-cet.md:46-47`) — reached in *"< 2 s including render; subjectively immediate"* `[V]`.
  **Our 25 shapes with 117 plans are a comparable hierarchy and are presented as nothing.**
- **Every catalogue in the field filters on at least two axes** `[P]` (`ux-arrival-and-start.md:507-509`) —
  phase or material class, opening name or ECO, and a rating band. For shapes, **phase discriminates
  usefully**: measured this pass, 14 middlegame · 11 endgame · 3 opening.
- **For principles it does not.** All 13 declare all three phases `[V]`, so a phase facet over
  principles would be a no-op. This is the kind of thing a spec should catch before someone builds
  it.
- **The failure mode is the undifferentiated list.** Aimchess's Training Room, *"a list of lists with
  no particular order of difficulty, frequency, priority, expected duration"* `[P]` — the sharpest
  browse complaint in the corpus, and `ux-arrival-and-start.md:301-304` already applies it to us.
- **Search should be exact + FTS, and that is already decided.** [[D564]] `[V]`: exact+FTS reached
  **97.7% recall@5** against 94.7% for the strongest semantic arm, and semantic retrieval is refused
  for 1.0.

### 10.5 What we should do, and why it differs

**H1 — replace `/library` with a knowledge surface: shapes and principles, not packs and runs.**
Two sections, both of which the pack shelf and the run list do not cover. `GET /shapes` ships;
`GET /principles` is §6's D1.

**H2 — the shape entry gets a real detail page: name, phase, a board showing a position where its
trigger fires, its plans by side, watch points, typical mistakes, provenance.** All of it is already
authored and already projected by `GET /shapes/:id`. The board is the addition, and G1's corpus
preview computes exactly which position to show.

**H3 — every shape detail page carries the door [[D692]] measures as computed-and-discarded: "packs
that rehearse this".** The reverse index is `pack.shapes[]`, present on 38 of 56 packs, and
`shapeRecommendations()` already computes it server-side. [[D693]] names the constraint: the reverse
query must **honour `relation`** and exclude `prospective` references, *"whose contract explicitly
says they never fire, grade or open authored feedback"*. Four of our 25 shapes are referenced by no
pack at all — those pages should say so rather than showing an empty list.

**H4 — principles are shown with their `counterCase` and their `standsOn`, always, or not at all.**
This is the honesty crux and it is a genuine fork. **All 13 principles are `standsOn:
"authors_practice"`** `[V]`, and [[D1396]] records that all 13 *"self-declare that no source
establishes the judgement"* — `tempo-is-the-currency`'s own provenance reads *"no machine or external
source establishes the judgement."* D531's precondition is explicit: principles *"must first be
regrounded to cited chess tradition (`standsOn: "chess_tradition"` with real citations) before
pairings against them mean anything"*, warning that pairing claims against self-referential rules
*"would produce provenance that looks stronger than it is."*

A browse page presenting 13 unsourced assertions as a knowledge base does exactly what D531 warns
against, and it brushes ADR-0005. So: **`standsOn` renders on the face of every principle card, in
the learner's words** — *"the author's own practice; no external source establishes this"* — **and
the required `counterCase` renders beside the statement, not behind a disclosure.** A principle that
shows you when it does not apply is teaching; one that does not is a slogan. If that presentation is
judged too weak to ship, the correct action is to **not ship the principles section until D531's
regrounding lands** — not to ship it quietly. §13 puts this to the owner.

**H5 — theory gets no browse surface in this iteration, and the reason should be stated on the page.**
There is no theory record type. `design/04:121-128` treats theory as *line content* — irreducible
move sequences living inside packs — and [[D581]] rules the 1.0 theory layer *"should be a
provenance compiler plus immutable local index, not a semantic service"*, requiring a design/owner
ruling before an RFC. So the honest `/library` states that theory lives inside the packs that teach
it and links to the phase-filtered opening shelf. **`design/03:293` promises theory-shaped
destinations the content architecture does not yet have record types for**, and §12 names that.

**H6 — one door in, from where the learner met the thing.** The shape panel's in-run header gets a
link to the entry's page. Without this, H1–H4 is another destination nobody visits — which is the
lesson [[D1473]] already paid for: *"WE BUILT A GOOD START FORM AND HID IT BEHIND A NAV ITEM NOBODY
WOULD CLICK."*

**Why this differs from the field.** Everyone else's library is a **catalogue of things to buy or
consume** — 258 courses, thousands of courses, an ebook shelf. Ours would be a **catalogue of the
concepts the product recognises**, which is only interesting because the product *does* recognise
them: the entry a learner reads is the same record that fired on their board. Nobody else can offer
that, because nobody else's reusable content unit is evaluated against live positions. The library's
reason to exist is not shelf depth — our shelf is thin and `adoption-audit.md:214-216` `[V]` says so.
It is **that our knowledge units have addresses in the runtime**, and giving them addresses in the
interface is the cheap half of that.

### 10.6 Cost and dependencies

| item | cost | depends on |
|---|---|---|
| H1 replace the route | small; deleting the two `<ul>`s is most of it | `ux-arrival-and-start.md` C1–C5 landing on `/play`, so nothing is lost |
| H2 shape detail page | medium; board + already-projected fields | G1 for choosing the position to show |
| H3 packs-that-rehearse-this door | small; `shapeRecommendations()` computes it | [[D693]]'s `relation` fix |
| H4 principles section | small | **§13 owner decision**; `GET /principles` (D1) |
| H5 theory absence stated | trivial | — |
| H6 in-run door | trivial | H2 |

---

## 11. Where Create and Library sit — the IA question neither surface can answer alone

`ShellFrame.svelte:25-35` is a **flat nine-item bar**: Home · Play · Learn · Review · Record · Live ·
**Create** · **Library** · Settings `[V]`. Create is item 7, Library item 8, both at the same visual
weight as Play.

Three measured problems.

**11.1 — Every learner permanently sees an authoring tool they will never open.** Per §2 there is no
population C today. `ux-arrival-and-start.md:64-72` `[V]` measures the compounding effect: **eight of
the nine destinations are empty on day one**, including *"No database drafts yet"*. `design/03:282-283`
requires that navigation have *"room for the whole spectrum"* — room for, not equal weight. A
first-party instrument and the primary learner action currently occupy the same rank.

**11.2 — Two of Create's four promised destinations are implemented on other routes.**
`design/03:292` lists Create as *"pack studio, **imports**, session-to-pack, publication channel"*.
Measured: **game import lives on `/review`** (`App.svelte:836-842`) and **repertoire import lives on
`/learn`** (`:893`) `[V]`. Both are defensible where they are — you import a game to review it, a
repertoire to learn from it — but it means `/create` holds two of four, and §3's A1 wants the import
doors as authoring entry points too. The resolution is a shared import component reachable from all
three, not a third copy.

**11.3 — The doc that owns the route table describes a `/create` that no longer exists.**
`docs/app-shell.md:28` calls it *"Honest empty state for the authoring program"*, last edited
2026-08-23 `[V]`, while `docs/pack-studio.md` describes a full database-backed studio. Same class of
staleness as `design/03:328`'s B6 correction, which still says session distillation *"does NOT
exist"* while it ships at `rest.ts:1416`.

**What we should do.** Nav grouping is an application-shell decision this dossier does not own —
[[D1450]] records that *"nobody owns the screen"* and that `/create` and `/library` are two of the
fifteen unowned route bodies. What this dossier can say with evidence: **Create is a first-party
instrument and should not carry the same rank as Play until population C exists**, and **Library
should be renamed for what §10 puts in it** — *Shapes*, or *Knowledge* — because *Library* is the
word that invited packs and run artifacts into it in the first place. Both are named in §13.

---

## 12. What this asks of documents this dossier may not edit

Law 5. Named, not written.

| document | what this dossier finds | why it is intent, not implementation |
|---|---|---|
| `design/03:292` | Create's four destinations include *imports*, which ship on `/review` and `/learn`. Either the IA row or the placement is wrong | Surface-map ownership is intent tier |
| `design/03:293` | Library promises *"packs, games, positions, concepts, **historical sources**"* — five destinations. **`concepts` is data-blocked by [[D700]]'s pack-scoping**, and there is no theory or historical-source record type. §10 proposes shapes and principles instead, which the row does not name | The surface map is `design/03`'s to change |
| `design/03:328` (B6) | The correction *"session distillation was claimed here and does NOT exist"* is **stale at HEAD** — it ships at `rest.ts:1416` / `App.svelte:430`. B6's gate text is otherwise met | Gate state is intent tier; [[D1452]] already records `03:323` going stale the same way |
| `design/04:347-348` | The production pipeline still ends *"claims with evidence → **review** → publish"*, a step the 2026-08-13 channel ruling struck for packs. §8's F4/F5 split (owner review of our own claims: yes; third-party editorial review: never) needs the doc to say which survives | Reconciling two owner rulings is the owner's |
| `design/04` §8 | The production model has **no population C**. If community authoring is a real intent, §2 says the design tier owes a description of who they are and what they get; if it is not, the studio should be specified for populations A and B and say so | Whether a contributor exists is a product-identity decision |
| **RFC needed** — pack schema | E2 (close `provenance.attribution` to `{title, author, licence}` as the shape and principle schemas already do) and G4 ([[D103]]'s `triggerNote`) are format changes | Law 1; both are also fenced by [[D560]]/[[D949]] if they force pack re-editing |
| **RFC needed** — graduation | F2's typed condition vocabulary changes `graduationEntry.id` semantics and needs a migration for 205 existing ids | Format change |
| `docs/app-shell.md:28-29` | Describes a `/create` that predates the studio and a `/library` this dossier proposes replacing | Docs tier — fixable without a ruling, named here so it is not missed |

---

## 13. Owner decisions this dossier surfaces

Genuine forks where the evidence is in and the call is not ours.

| # | Decision | Why it is a decision, not a finding |
|---|---|---|
| 1 | **Does population C — the community author — exist as a product intent, or is `/create` a first-party instrument that happens to have a public channel?** §2 finds a channel with no person: no design document describes a contributor's experience, and `design/04` §8's author is claude reviewed by the owner | Everything in §3–§9 changes weight. For populations A and B the priorities are C1/C4 (lint parity), F1/F4 (blockers and review) and G1 (corpus preview). For population C they are A1 (import doors), B1 (a board) and E1 (provenance panel) — and a much larger build |
| 2 | **Do we ship a principles browse surface while all 13 are `standsOn: "authors_practice"`?** §10 H4. D531's precondition says regrounding to `chess_tradition` must come first, warning that pairings would *"produce provenance that looks stronger than it is"* | Shipping with `standsOn` and `counterCase` on the face of every card is defensible under `design/05:41`. Not shipping until regrounding lands is also defensible. Shipping without the labels is not |
| 3 | **Does `/library` become a knowledge surface (shapes + principles) or get deleted?** §10.1 finds the route as shipped is a strictly worse duplicate of two others; §10.2 finds the content has a measured reason to exist | If C1–C5 land on `/play` and H1–H4 are not funded, deleting the route is the honest outcome — `design/03:293` would then be an unmet promise stated once rather than a bad screen shown always |
| 4 | **Is a board in the authoring surface funded?** §4's B1 is the largest item here and the one that would most change what authoring *is*. `docs/pack-studio.md:57-58`'s *"intentionally low-level authoring instrument rather than a visual chess-content editor"* is a shipped posture, and B1 argues with it | A posture stated in a doc is the owner's to keep or revise. The evidence for revising: four independent attestations of authors rebuilding a chess harness `[P]`, and six lint error classes that become unconstructible |
| 5 | **Does the owner-review instrument (§8 F4) get built, given that `review` has registered 0.0% of 1,434 measured minutes across nine waves?** | Either review is a real step and needs a surface, or the design tier's review requirements in D531/D950 should be restated as something else. The current state — required by intent, zero minutes in practice, no instrument — is the one option that cannot be right |
| 6 | **Is Create's nav rank right?** §11.1. Every learner permanently sees an authoring tool at the same weight as Play, and eight of nine destinations are empty on day one | Depends entirely on decision 1 |

---

## 14. Load-bearing `[P]` and `[M]` claims, and what would settle each

| Claim | Label | Load it bears | Settled by |
|---|---|---|---|
| **Every claim about how any competitor's authoring editor looks or behaves on screen** | **`[M]`** | Nothing in §3–§9 rests on one, deliberately. Screen proposals derive from our own contract | A hands-on pass on Lichess studies' editor and Chessbook's repertoire builder — both free, both accountable in under an hour. **This is the single largest gap in the corpus for this scope** |
| Chessable's revenue-share author marketplace and its scale (400+ authors, 1000+ courses) | `[P]` | §2's argument that a marketplace is structurally unavailable to us | Not settleable by us and does not need to be — the refusal rests on our own ruling (`docs/pack-graduation.md:42`), not on their numbers |
| Chessable's soft-fail engine check is a per-course batch job, PRO-gated for self-made courses | `[P]` desk | §5's framing that authoring-time machine checking is asynchronous and whole-document | A PRO account and one self-made course |
| Chessbook imports PGN / Lichess studies / linked accounts, and its *"1 in 300 games"* stopping rule | `[P]` extract + App Store copy | §3's import doors; §8's *"done"* concept | Free account, 20 minutes |
| Chessbook's authored prose contains chess errors (*"a knight move… developing a bishop"*) | `[P]` in-source | §5's ADR-0005 cautionary framing | Free account |
| Chessigma's *"PGN import is the most requested feature still on the roadmap"* | `[P]` fetched | §3's claim that import is the universal expectation | Fetched vendor copy is adequate for this weight |
| **Our own 43.5 min/pack and its category split** | `[P]` self-reported, **arithmetic `[V]`** | §2's population argument and §5's prioritization | A stopwatch on one wave. `pack-authoring-cost.md:52-58` states the limit itself |
| *"No wave since pack A has played a run"* — the runtime-playtest half measured exactly once | `[P]` | §5's C5 (grounding as visible jobs) and the claim that Save & playtest is undertested | One wave that playtests |
| CET's 83 positions / 20 subcategories, and its < 2 s browse-to-board | **`[V]` hands-on** | §10.4's claim that catalogue depth at our scale is achievable | Already the corpus's strongest competitor evidence |
| *"No product in the corpus authors structural predicates"* | `[V]` as an absence over 28 products | §9's claim that the shape editor has no field practice to copy | Cannot be strengthened by desk work. `README.md` coverage limit 1 applies — three real competitors were owner finds |
| **Everything in §1, §6, §7, §8, §10.2 measured over `content/`** | `[V]` this pass | Most of the dossier | Reproducible: the counts come from scripts over the committed corpus at `f95aed8b` |

**What I did not check:** I did not run the studio in a browser; the shipped-state claims are read
from source, not from a session, which is weaker than `mechanics-by-mode.md`'s hands-on standard for
our own product. I did not author a pack through `/create` end to end — that would be the strongest
single piece of evidence for or against this whole dossier and it costs one session. I did not
measure how long any recommendation would take to build; the cost columns are `[M]` ordinal
judgements.

---

## 15. Recommendations, ordered by what they cost against what they fix

| # | Recommendation | Blocked on | Fixes |
|---|---|---|---|
| 1 | **Call the pack lint endpoint from the client** (§5 C1). One API method plus a debounce; `rest.ts:1058` already accepts arbitrary unsaved bytes | nothing | You must upload before you can be told you were wrong |
| 2 | **Pass `principles` and `packs` into `PackStudio`** (§5 C4) — two constructor arguments | nothing | Studio-green packs failing `make pack-check`; a false claim in `docs/pack-studio.md:3-4` |
| 3 | **Ship `GET /principles`** (§6 D1) — the projection exists at `principle-registry.ts:63` | nothing | 13 entries an author must guess and a learner cannot reach; unblocks D2 and H4 |
| 4 | **Add the shape editor's missing error path** (§9 G5) | nothing | Four handlers that fail silently |
| 5 | **Derive the version string; ask distillation for a title** (§3 A3/A4) | nothing | The only onboarding string names a format 19 versions stale; every distilled pack is called *"Distilled rehearsal"* |
| 6 | **Blockers become the studio's primary column** (§8 F1) | nothing | 220 blocking conditions no interface reads |
| 7 | **Corpus preview replaces the one-FEN probe** (§9 G1) | a served position corpus | Authors narrating trigger limitations to learners in `watch` prose |
| 8 | **Replace `/library` with shapes + principles** (§10 H1–H3, H5–H6) | `ux-arrival-and-start.md` C1–C5; §13 decision 3 | 284 authored knowledge units reachable only by accident; a route that duplicates two others |
| 9 | **Incomplete-vs-wrong, and `oneOf` collapsing** (§5 C2/C3) | nothing | A wall of redundant AJV errors that gets worse the moment #1 makes it continuous |
| 10 | **Registry pickers for `principles`, `shapes`, `objective.type`; autocomplete for `concepts`** (§6 D2/D3) | #2, #3 | 143 singleton concepts; guessed principle ids |
| 11 | **The chooser and the scaffold** (§3 A1/A2) | a board for the first door | An empty textarea as the entire onboarding |
| 12 | **The provenance panel and honest CC0 statement** (§7 E1/E4) | [[D1394]] for the CC0 half | 34 of 56 packs with no attribution entry; obligations invisible at the moment they are created |
| 13 | **Board input for start / spine / deviations** (§4 B1–B3) | §13 decision 4 | Six lint error classes; four attestations of authors rebuilding a chess harness |
| 14 | **Owner-review instrument** (§8 F4) | §13 decision 5; D531's regrounding precondition | Review required by intent, 0.0% of measured minutes, no surface |
| 15 | **Typed graduation-condition vocabulary** (§8 F2/F3) | RFC | 205 ids that are 56-character truncated sentences; no corpus-level view of what blocks publication |
| 16 | **Structured expression builder** (§9 G2) | grammar sync contract | A 995-line shape whose trigger is one line of nested boolean JSON |

**Recommendations 1–6 are blocked on nothing, are individually trivial, and between them close the
gap between a studio that is worse than the Makefile and one that is merely narrower.** Two of them
(#2, #4) are defects rather than features.

---

## 16. Proposed ledger rows

Ids assigned at landing per [[D1130]]; **head was D1478 at drafting.** Not written by this pass.

- 🐞 **The Pack Studio's linter accepts unsaved bytes over HTTP and the client has never called it.**
  `POST /packs/drafts/:id/lint` (`rest.ts:1058`) lints `body.document` — arbitrary in-editor bytes —
  and `apps/web/src/lib/api.ts` has **no `lintPackDraft` at all**; only `lintShapeDraft` exists
  (`:1135`). So the pack author must `POST` a draft to the server before any validation feedback
  appears (`App.svelte:1002` gates the issue list on `selectedPackDraft`). The capability shipped and
  the wire was never run. Sibling of [[D1141]]'s unreachable-route sweep.
- 🐞 **`docs/pack-studio.md:3-4` claims Studio and `make pack-check` run the same validator, and they
  do not.** `PackStudio.lint` passes only `shapes` (`pack-studio.ts:87`); `pack-check.ts:140-143`
  passes shapes **and principles and sibling packs**, so `CLAIM_PRINCIPLE_UNKNOWN`
  (`pack-validation.ts:867`), `CLAIM_PRINCIPLE_OFF_PHASE`, `VARIANT_PACK_UNKNOWN` and
  `VARIANT_RELATION_UNPROVEN` (`:828`) are silently unreachable in Studio. The registry does get
  principles (`application.ts:274-286`) so the catalogue is safe — **the author is blind on exactly
  the fields v0.26 added.** Fix is two constructor arguments.
- 🐞 **The principle registry ships a finished browse projection with no route.**
  `principle-registry.ts:63` returns `{id, version, digest, name, phases, licence}`, id-sorted;
  `grep principle apps/server/src/rest.ts` returns **0**. `GET /shapes` exists at `rest.ts:1000`.
  Consequence at both ends: an author cannot discover a valid `principles[]` id, and a learner cannot
  read one. Blocks [[D695]]'s F7 join and §10's H4.
- 📊 **The two vocabularies with a registry became shared vocabulary; the one without became 143
  orphan strings.** Measured over 56 draft packs: **principles — 12 of 13 referenced by 35 packs;
  shapes — 21 of 25 referenced by 38 packs; `concepts` — 168 distinct, 143 used exactly once (85%
  singletons)**. `concepts` is `array of nonEmptyString, uniqueItems` with no pattern and no
  registry, and slug-shape is only a lint **warning** (`lint.ts:390-399`). Corroborates [[D700]] from
  the authoring side and gives it a cheap partial mitigation (autocomplete over existing strings)
  that does not launder identity.
- 📊 **Graduation blocker ids are 56-character truncations of prose sentences, and the graduation
  contract rests on them being stable.** 293 typed conditions across 55 of 56 packs (220 `blocking`,
  43 `accepted`, 30 `resolved`); **205 distinct ids, 184 firing exactly once, median AND maximum id
  length 56** — e.g. `the-one-break-counting-rule-feedbackclaim-is-the-pack-s-`. The one real id,
  `no-review-workflow`, fires 40 times and `content/accepted-conditions.md` shows it **hand-paraphrased
  each time**. Cause: no condition vocabulary to pick from. Effect: the blocker set cannot be
  grouped, counted or triaged, which is exactly the work publication requires.
- 🐞 **The pack schema is the loosest of the three on attribution, and it carries the most third-party
  material.** `provenance.attribution` items are `{"type":"object"}` — no required keys, no closure
  (`schemas/drill_pack.schema.json:1148-1151`) — while `shape_entry.schema.json` and
  `principle_entry.schema.json` both require `["title","author","licence"]`. The real obligation
  lives in `sourcing/check.ts:340-354` and demands `{sourceId, licence, noticeText}` with
  byte-exact notice text, which neither the schema nor `make pack-check` enforces. Measured: **11 of
  56 packs carry no `licence` key, 34 of 56 carry no attribution entry, and 23 of 25 shapes have zero
  attribution rows despite all 25 declaring CC-BY-SA-4.0.**
- 📊 **[[D1394]] is visible in the encoding, not only in the type.** A candidate licence row is
  `{basis, noticeText, rationale, spdx}` — **no author, no title, no url** — and across 42
  `sources.json` files **35 rows are `CC0-1.0` with `noticeText: null`**. The raw retrieval cache is
  thinner still: a `content/sources/` record is `{body, etag, kind, retrievedAt, status, url}` with
  **no licence field at all**. So the CC0 half of the pipeline has no structural channel to name its
  origin, and the studio cannot show an author an obligation the manifest cannot hold.
- 💡 **The `/library` route is a strictly worse duplicate of two other routes with a delete button
  attached.** `App.svelte:1079-1096`, 18 lines: pack rows render title + `reviewStatus` only and are
  **not clickable** (dropping four fields `PackList.svelte` already shows); the section headed *"Runs
  with exportable PGN"* offers **no export**, only navigate and delete; the page title is *"Packs and
  run artifacts"*. Zero shapes, zero principles, zero theory. Once `ux-arrival-and-start.md` C1–C5
  land on `/play`, section one is redundant by construction and section two is `/review`'s job.
- 📊 **284 units of authored chess knowledge are reachable only by accidentally playing into them.**
  25 shape entries carry **117 named plans (21 of them — 18% — honestly declaring
  `success.signature: null`), 78 watch points and 89 typical mistakes**, reused by 38 of 56 packs;
  they reach learners only as in-run passive timeline markers (`docs/drill-client.md:316-319`). There
  is no surface that lets a learner re-read one, and [[D692]] measures the reverse door being
  computed and discarded. This is the measured case for [[D695]]'s missing catalogue.
- 💡 **An authoring limitation is being narrated to learners as chess advice.**
  `content/shapes/lucena.json`'s `watch` array tells the learner *"whether the attacking king stands
  in front of the pawn and the defending king is cut off — **the actual Lucena conditions** — is king
  geometry this vocabulary cannot express. Verify on the board."* [[D103]] already ledgers that a
  shape has nowhere to record why its trigger says what it says (`triggerNote` rejected by
  `additionalProperties: false`), so the `watch` array is absorbing it. The same file carries a
  `success.note` beginning *"RESTATED PLAN…"* — migration debris in a shipped record.
- 🐞 **`design/03:328`'s B6 correction is stale: session distillation ships.** The gate row still
  reads *"session distillation was claimed here and does NOT exist — `session_distilled` is a
  reserved enum with zero producers"*, while `POST /runs/:id/distill` (`rest.ts:1416`), the client
  call (`App.svelte:430`) and its in-run banner (`:818`) all ship. Same class as [[D1452]]'s finding
  about `design/03:323`. Related: `docs/app-shell.md:28` still calls `/create` an *"Honest empty
  state for the authoring program"* at a 2026-08-23 edit, contradicting `docs/pack-studio.md`.
- 💡 **Two of Create's four promised destinations are implemented on other routes.**
  `design/03:292` lists Create as *"pack studio, **imports**, session-to-pack, publication channel"*;
  game import lives on `/review` (`App.svelte:836-842`) and repertoire import on `/learn` (`:893`).
  Both placements are individually defensible; the result is that `/create` holds two of four and any
  authoring entry point needs a third copy or a shared component.
- 💡 **Distillation hardcodes the author out of naming their own work.** `App.svelte:430` sends
  `packId: \`distilled-${run.id}\`` and `title: "Distilled rehearsal"`. Every pack produced by the
  one assisted authoring path that ships has the same title, which matters more once the catalogue
  becomes searchable.
- 💡 **The studio's only instructional string names a format nineteen versions stale.**
  *"Paste a v0.8 pack to begin."* (`App.svelte:984`) against
  `"$id": "urn:chess-tabiya:schema:drill-pack:0.27"` (`schemas/drill_pack.schema.json:3`). The string
  should be derived from the schema rather than restating it — `design/05:41`'s failure mode exactly:
  a confident statement that is wrong.
- 📊 **The validator cannot validate a partial document, and the studio has no wrapper for that.**
  `validatePackDocument` returns early on schema failure (`pack-validation.ts:1364-1369`) computing
  **no lint and no runtime issues**, so an author working top-down sees only structural errors until
  the document goes schema-clean and then receives ~150 runtime codes at once. Compounded by an
  8-arm `successCondition` and an 18-arm `structuralFeature` `oneOf` under `allErrors: true`, which
  produce failures against every arm at one instance path. Any continuous-lint work (row 1 above)
  must land discriminator-aware filtering with it or it makes things worse.
- 💡 **Owner review is required by three intent-tier rulings, has an instrument nowhere, and has
  registered 0.0% of 1,434 measured authoring minutes across nine waves.** `design/04:362-372`
  (D531) requires owner review of claim↔principle pairings; D950 requires owner veto over authored
  `counterCase`s; `accepted` graduation conditions require a resolvable ruling citation.
  `pack-authoring-cost.md:65-70` `[P]`: *"`review` is zero everywhere and always was"*, and `:269-272`
  records the plan's prediction that review would dominate as falsified. Either the step needs a
  surface or the rulings need restating; the current combination cannot be right.
- 📊 **Nobody has ever seen a competitor's authoring editor, and the corpus does not say so
  anywhere.** A sweep of `design/research/` this pass found **no teardown of Lichess studies' editor,
  Chessbook's repertoire builder, Chessable's author console, or any PGN/tree editor in any product**
  — the Chessable author-side evidence is entirely help-centre and blog text (`chessable-movetrainer.md:8-11`:
  *"Product NOT run."*). This is narrower than [[D1458]]'s general finding: for authoring, even the
  `[P]` desk tier is empty on screen anatomy, so every look-and-feel claim is `[M]`. Two free
  accounts and an hour would move the whole authoring corpus up a label.

## Coverage-matrix row (proposed)

| Area | Feeds | Status | Report |
|---|---|---|---|
| Authoring and library UX from the user's side — Pack Studio, the shape editor, validation/provenance/graduation while authoring, and whether a browse surface over shapes, principles and theory has a learner reason to exist | owner commission 2026-08-24, B6/B7/B11, `design/04` §0/§8, [[D1434]], [[D695]], [[D700]], [[D1394]]/[[D1396]], [[D103]], [[D692]]/[[D693]] | covered `[V]` shipped-state (read at `f95aed8b`) + `[V]` corpus measurement (56 drafts, 36 candidates, 25 shapes, 13 principles, 293 graduation conditions) + `[P]` competitor economics/policy; **screen anatomy for authoring is `[M]` — no competitor authoring editor has ever been seen at any label, which is narrower than [[D1458]]**; no participant evidence. Finds the authoring capability shipped server-side and unwired client-side, and `/library` a strictly worse duplicate of two routes while 284 authored knowledge units are reachable only mid-run | `ux-authoring-and-library.md` |

---

## Residuals and limits

- **The studio was read, not driven.** Every `[V]` about `/create` and `/library` comes from source at
  `f95aed8b`. `mechanics-by-mode.md:26-27` sets the higher bar for our own product — *"Every `[V]`
  marked hands-on below is a control I pressed or a route I called"* — and this pass did not meet it. Authoring one pack end to end
  through `/create` is the single cheapest thing that would confirm or overturn §3–§8.
- **No participant evidence.** Nothing here has been tested on an author or a learner. §13's decision
  1 in particular — whether population C exists — is a product-identity question that research cannot
  settle.
- **The competitor authoring corpus is empty at the screen level** and this dossier says so rather
  than filling the gap with plausible descriptions. §14 names the two-hour fix.
- **Cost columns are `[M]`.** Ordinal judgements, not estimates.
- **Fenced by [[D560]]/[[D949]].** Nothing here recommends authoring more content; the content hold
  stands. Every recommendation is about the *instrument*, which `design/04:357-359` explicitly
  licenses: *"the answer is **better tooling (importers, corpus mining, authoring assist), not more
  hours**."*
- **[[D1230]] compliance.** No `## Recommended scope cut` section exists here and none was drafted.
  §15 prices the full ask in order; §13 puts the two genuinely large items (a board, an owner-review
  instrument) to the owner as decisions with their evidence attached rather than pre-deciding them
  as cuts.
