# O5 decision memo — the 1.0 theory source and knowledge-builder posture

**Prepared:** 2026-08-23, at HEAD `36074c7`, for the owner.
**Queue row:** `planning/platform-alignment/decision-queue.md:42` — *READY FOR OWNER — R4/R8/R18 complete*.
**Handoff:** `planning/platform-alignment/theory-drill/o5-o6-handoff.md` (the queue's `theory-drill/o5-o6-handoff.md` resolves to this path).
**Scope of this memo:** verification and framing only. It writes no design doc, no RFC and no ledger row.

---

## The question

> When Tabiya wants to show a learner a sentence of chess theory it did not write, where may that
> sentence come from, what has to be true about it before it is shown, and what is allowed to build
> and choose it?

---

## What the research settled

Every claim below was re-derived at HEAD for this memo. Evidence labels follow
`design/research/README.md`.

1. **Semantic/vector retrieval is refused as 1.0 authority, on three predeclared gates and three
   failures.** `[V]` Over 144 fixed queries the strongest semantic arm reached 94.7% recall@5 against
   exact+FTS's 97.7% (the gate required *+10 points*), returned an ineligible top-1 on 8.3% against a
   2% ceiling, and abstained on 66.7% of hard negatives against a 90% floor
   (`planning/platform-alignment/knowledge-retrieval/results.md:55-69`; thresholds at
   `knowledge-retrieval/plan.md:50-56`; ratified as [[D564]], `design/BACKLOG.md:155`).

2. **A free-text key is more dangerous than no key.** `[V]` The untyped key `pawn` admitted the
   generic pawn-ending passage for four rook-and-pawn questions and *excluded the correct
   rook-ending passage before ranking ever ran* (`results.md:89-95`, [[D579]] at
   `design/BACKLOG.md:175`). Keys must be typed predicates with declared match semantics.

3. **The reference implementation cannot identify the artifact a passage came from.** `[V]` Stored
   chunks carry URL/root/type/title/ingested-at and no licence, revision, source digest, chunk
   digest, span or model identity; a same-dimension embedding swap is invisible
   (`results.md:112-116`, [[D580]]).

4. **Whole-service extraction is a self-host tax.** `[V]` The binary would not start without
   Frameworks Postgres, service identity and Gateway MCP, and the bounded run required Commodore and
   Periscope Query (`results.md:118-122`).

5. **The typed-applicability workflow prototype passes at HEAD.** `[V]` Re-run for this memo:
   `npx vitest run --config tools/r8-theory-drill-harness/vitest.config.ts` → 2 files, 5 tests,
   all green. R8's opening index also holds: 52 records collapse to 49 transposition keys, three of
   them carrying both a parent and a descendant opening name
   (`design/research/theory-drill-current-joins.md:194`).

6. **The corpus has a citation layer that nothing reads.** `[V]` **0 of 893** committed evidence
   records (across **68** ledgers; `engine_eval` 415, `tablebase_result` 341, `position_legality` 59,
   `opening_identity` 52, `puzzle_provenance` 26) support any `PROSE_POINTERS` pointer
   (`apps/server/src/sourcing/check.ts:36-42`), so `licenceObligations`' prose arm
   (`check.ts:347`) has never fired. **0** `citable_text` records exist. The **13** principle entries
   are **13/13 `authors_practice`** and 13/13 declare in their own provenance that no source
   establishes them. All independently reproduced for this memo over git-tracked `content/`.

### One thing the research did **not** settle, and the handoff reads as though it did

The handoff (`o5-o6-handoff.md:10-12`) says exact+FTS won *"while the semantic safety, abstention and
artifact controls failed."* True — but those five gates were conditions on the **semantic extraction
branch only** (`plan.md:50-56`). The recommended baseline was never gated on them, and on the two
safety columns that were measured it scored **worse**: exact+FTS returned an ineligible top-1 on
**18.2%** of answerable queries and abstained on **0.0%** of hard negatives, against the semantic
arm's 8.3% and 66.7% (`results.md:57-63`). `[V]`

This does not overturn the recommendation — it locates where its safety actually comes from. The
product is safe not because FTS is safe but because **typed eligibility runs in front of it**, and
R4 never tested that layer (its key layer was free text, which is finding 2). The F4 draft says this
in terms and sets a stricter product gate — ineligible top-1 **exactly zero** — while recording in
its own ledger row that *nothing has measured whether a real corpus can hold zero and still return
anything useful* (`rfc/theory-knowledge-pipeline.md:817-820, 954-958`). The owner should rule knowing
that the safety claim is architectural and still unmeasured, not empirical.

---

## What has changed since the handoff was written

**This is the section that matters. The recommendation is now partly moot, partly pre-specified by a
document that landed today, and partly assigned to a different RFC.**

### 1. Two RFCs landed on 2026-08-23, both after the O6 rulings

| commit | time | document |
|---|---|---|
| `73a867e` | 00:41 | the O6.1/O6.2/pilot/O6.3 owner rulings appended to the handoff |
| `1f31dfe` | 22:40 | `rfc/theory-drill-current-joins.md` — the F7 lane's typed applicability edge |
| `de59c8a` | 22:49 | `rfc/theory-knowledge-pipeline.md` — the F4 provenance compiler |

**The handoff's own status header is now stale.** `o5-o6-handoff.md:3-4` still reads *"O5 ready; O6
architecture/budget ready"*; O6.1 was approved and O6.2 ruled against the recommendation seventeen
hours before either RFC was written (`o5-o6-handoff.md:107-119`; `design/BACKLOG.md:289-291`).
O5 itself is genuinely unruled — no ledger row, no log entry, no queue amendment.

### 2. `theory-knowledge-pipeline` implements all six drafted clauses — so the ruling is **narrower** than the queue says

Clause by clause, against `o5-o6-handoff.md:30-45`:

| Drafted clause | Status in `rfc/theory-knowledge-pipeline.md` |
|---|---|
| **Source posture** — versioned allow-list, per-entry rights/digests/keys | **Exceeded.** §2 specifies `TheorySourceEntry` in full plus five register rules with refusal codes, and turns the dossier's "Do not use" list into five committed negative fixtures (`:250-271`, criterion 2). It also **adds a rights decision the ruling never named** — see item 5 |
| **Build posture** — offline compiler, CLI/optional Compose profile, not a runtime dependency | **Exceeded.** §3, §12, criterion 20. It also *refuses* what "derived from the Skipper crawler patterns" would have permitted: sitemap discovery, link discovery, SPA detection and headless render fallback are all refused by name (`:289-292`) |
| **Runtime posture** — immutable digest-addressed bundle; exact authoritative; FTS inside the eligible set; vector refused, may return as a gated experiment | **Exceeded.** §7–§8. Criterion 12 asserts the *absence* of a vector column and of any embedding dependency *"so it cannot be re-enabled by configuration"* (`:825-828`), and Discharge D10 escalates any future semantic experiment to **the OWNER** as a new RFC — stricter than "separately gated" |
| **Identity posture** — a set of versioned theory identities plus launch targets, no LLM resolving ambiguity | **Moved to a different RFC.** F4 returns *passages*, not identities or targets (`:531-534`). The identity-set posture is now `rfc/theory-drill-current-joins.md` §1.4 (*"An exact key yields an identity SET"*, `:242`), and F4's §13 table hands it over explicitly (`:673-681`). One narrowing: F4 refuses source `strength` as an ordering input (`:555-556`), where the clause allowed "a declared specificity/source order" |
| **Rendering posture** — deterministic cited text normative; an optional conforming LLM may **shorten**/rephrase admitted spans | **Contradicted in one word.** §11: *"It may not shorten a quotation — a shortened quote is an adaptation, and adaptation is a licence question (§6.2 rule 3), not a rendering one"* (`:649-650`) |
| **Empty posture** — theory-only/drill-only/both/neither first-class, never replaced by coach prose | **Split.** F4 owns the honest-empty *result* (`:531-534`, §8 rule 3, criterion 11). The **four first-class outcomes** are assigned to F7 by F4's own boundary table (`:679`) |

**Consequence for the ruling.** Four of the six clauses no longer need the owner to *choose* anything
— a document has specified them tighter than the recommendation asked, with acceptance criteria that
fail if the specification is violated. What O5 still genuinely decides is (a) whether that posture is
the one Tabiya wants at all, and (b) the three things below that the recommendation never contemplated.

### 3. `theory-drill-current-joins` §6.1 is **still accurate** on O5, and stale on O6

`rfc/theory-drill-current-joins.md:483-490` hands the theory-corpus lane out by name and calls the
O5 ruling *"the OWNER's and is unmade"*. **That is correct at HEAD.** Two corrections:

- It says the lane *"lives in `design/research/theory-knowledge-pipeline.md`"* (`:485`). Nine minutes
  after it landed, the lane acquired an RFC. Not wrong when written; stale now.
- Its citations drift by a line or two: `o5-o6-handoff.md:1-2` is really `:3-4`, and `:46-47` is
  `:47-48`. Cosmetic.
- **Its Discharge D5** — *"The O6 stable-primitive and re-authoring-budget ruling … OWNER"*
  (`:607`) — was already discharged when the RFC landed ([[D995]]/[[D996]], 22 hours earlier).
  D4 (the O5 ruling) is the only live owner discharge in that document.

### 4. The principle-entry lane collides with a standing owner ruling — **the sharpest new finding**

F4 §10 proposes principle-entry schema lane 0.2, adding *"a fourth member `cited_source`"* to
`standsOn`, admitted biconditionally with a structured citation (`:596-616`, criterion 17).

But `PrincipleBasis` **already has** the member this is for:
`packages/schema/src/principle-entry/index.ts:4` and `schemas/principle_entry.schema.json:13` read
`"chess_tradition" | "authors_practice" | "instrument_pattern"` — and **owner ruling [[D531]],
mirrored into protected intent at `design/04-content-architecture.md:369-371`, names it**:

> *"principles must first be regrounded to cited chess tradition (`standsOn: "chess_tradition"` with
> real citations) before pairings against them mean anything."*

`rfc/README.md:44` says the same from the register side: `pack-population-provenance`'s `citable_text`
member *"is exactly what [[D530]]/[[D531]] need to reground the 13 principles from `authors_practice`
to `chess_tradition`."*

**`rfc/theory-knowledge-pipeline.md` mentions `chess_tradition` and [[D531]] exactly zero times**
(verified by grep). So the draft proposes a fourth member for a state an owner ruling already
assigned to the third — and the third is currently used by **0 of 13** entries, i.e. it is already
the inert-vocabulary defect ([[D428]]) that §10 rule 3 was written to prevent. This is a real fork
and it is the owner's, because a ruling made it.

### 5. Three things the RFC decides that the drafted recommendation never mentioned

- **The licence set.** "Allow-listed sources" is *currently inexpressible*: `SourceLicence.spdx` is a
  closed two-member union `"CC0-1.0" | "CC-BY-SA-4.0"` (`apps/server/src/sourcing/types.ts:1-13`),
  and `check.ts:342` and `:353` raise `LICENCE_MIXED` for anything that is not **exactly**
  `CC-BY-SA-4.0`. §6.2 widens the union to five members — `CC0-1.0`, `CC-BY-4.0`, `CC-BY-SA-4.0`,
  `CC-BY-SA-3.0`, `public-domain` — with `requiresAttribution`/`shareAlike` derived from the member
  (`:430-441`). That is a rights decision sitting inside a retrieval RFC.
- **A zero-tolerance product gate nobody has measured** (criterion 10, `:817-820`), flagged as such
  by the RFC's own ledger row (`:954-958`).
- **Escalating the semantic-reopen question to the owner** as Discharge D10 (`:887`).

### 6. The four newly-landed defects — what each does and does not change

| Defect | Verified at HEAD for this memo | Does it change what the owner is approving? |
|---|---|---|
| **[[D1393]]** — `ATTRIBUTION_MISSING` stops firing silently | ✅ `check.ts:346` computes `boundAssertions` from `binding.spans`; `ledger-validation.ts:346` pins `exactKeys(["claimId","pointer","textSha256","spans"])`. **Correction to the framing of this task: `rfc/claim-semantic-anchors.md` is a DRAFT, not accepted** (`rfc/README.md:15`; its own status line reads *"draft 2026-08-23 … deliberately waiting on F3's literal capability/version syntax before acceptance"*). It mentions `licenceObligations`, `boundAssertions` and `ledger-validation` zero times | **No — but it changes the sequencing.** This is a *prospective* hole that opens only if that draft lands its shape change without the licence reader. It is owned by that RFC (F4 Discharge D11, criterion 21 *honestly red*, `:867-872`). Nothing the owner rules here fixes or worsens it |
| **[[D1394]]** — a CC0 source cannot be attributed | ✅ `sourcing/types.ts:4`, `check.ts:342`, `check.ts:353` all confirmed | **Yes.** This is why item 5's licence widening exists. Approving "an allow-list" without approving a licence set approves something that does not compile |
| **[[D1395]]** — no SSRF guard, redirect limit, byte ceiling or content-type check | ✅ `apps/server/src/sourcing/http.ts` is exactly 49 lines; grep for redirect/SSRF/content-type/byte returns nothing. Bounded today only by the two-member literal at `source-fetch.ts:47-48` | **Yes, and it is live now.** A reviewed register naming arbitrary origins turns this into a request-forgery primitive on the operator's network. §3.1 prices five controls (`:275-287`). The gap exists whether or not O5 is ruled |
| **[[D1396]]** — 0 of 893 records support a load-bearing pointer | ✅ **on its load-bearing half.** 0 of 893 reproduces exactly. ❌ **on its supporting counts** — see below | The finding stands; three of its numbers need an erratum |

### 7. Three census counts in the RFC and in [[D1396]] do not reproduce at HEAD

Measured over **git-tracked** `content/` only (the untracked `content/sources/` was excluded and
makes no difference):

| Asserted | Claimed | Actual at HEAD |
|---|---|---|
| `provenance.sources` strings | **378** across **65** documents, **49** with a URL | **513** across **130** documents, **75** with a URL. Restricted to the 92 packs (`drafts` + `candidates`): **405** strings, **75** URLs |
| `provenance.attribution` entries | **31** across **22** documents | **46** across **37** corpus-wide; 31/22 is right **only** under a `content/drafts`-only denominator |
| Packs declaring `CC-BY-SA-4.0` | **54** | **119** corpus-wide, **81** over the 92 packs, **45** in drafts. No denominator yields 54 |
| Records / ledgers / prose pointers / principles | 893 / 68 / 0 / 13 / 13 | **all reproduce exactly** ✅ |

The **65** is a field transposition: it is the number of documents containing at least one URL,
reported as the total document count. Reproduction command is recorded in this memo's commit message.

Two notes. First, **the ruling does not turn on any of these three numbers** — the load-bearing
measurement (0 of 893) is exact, and was independently reproduced by `pack-population-provenance`'s
cross-review (`rfc/README.md:44`). Second, this is the RFC's own criterion 1 working in reverse: it
declares the integers *"drift tripwires"* asserted against `make theory-source-census`
(`:776-783`), but that command does not exist yet, so three tripwires were set to numbers no command
produced. The fix is to pin the command and its denominator before acceptance, not to re-arithmetise
the table.

### 8. Minor citation drift in the F4 draft, listed so it is fixed once

`.gitignore:14` should be **`:11`** (`content/sources/` is gitignored — the claim is true, the line
is wrong; `:14` is `.env`), cited twice (`:173`, `:302`). `check.ts:341` should be **`:342`** and
`check.ts:354-355` should be **`:353`**, cited at `:180-181` and `:416-420`. [[D1394]]'s ledger row
already carries the corrected lines.

### 9. Protected intent is stale, and one line of it is the intent home for this ruling

`design/04-content-architecture.md:79-80` reads *"**Deliberately not chosen here:** the 1.0 theory
source and the stable primitive set — O5/O6 remain blocked by R8/R10."* R8 landed 2026-08-21 with an
executable arm; R10 is the learning-effect experiment, still `WAIT/EXTERNAL` on a representative
pilot (`planning/platform-alignment/execution-queue.md:62`) and unrelated to source choice. O6 is
ruled. That sentence is the exact hole an O5 ruling fills, and it is law-5 protected —
`planning/platform-alignment/intent-amendment-handoff.md:97` repeats it verbatim.

---

## The recommendation

Approve the drafted contract with **three amendments and one instruction**, i.e. rule the following
clauses:

1. **Source posture — approve as drafted.** A committed, human-reviewed, versioned allow-list is the
   only input to the builder; nothing discovers a source; the dossier's "Do not use" list becomes
   five committed refusal fixtures. `strength` is provenance and may never order, weight or be
   rendered.
2. **Licence set — approve explicitly, because it is not implied.** Admit `CC0-1.0`, `CC-BY-4.0`,
   `CC-BY-SA-4.0`, `CC-BY-SA-3.0`, `public-domain`, with obligations derived from the member, and
   keep the pack's own prose licence at `CC-BY-SA-4.0` wholesale (`design/02`'s posture, unchanged).
   Without this clause the allow-list does not compile ([[D1394]]).
3. **Build posture — approve as drafted, and approve the refusals.** Offline compiler, CLI or
   optional Compose profile, never a runtime dependency; **no crawler, sitemap discovery, link
   discovery, SPA detection or headless render fallback**. The five transport controls of [[D1395]]
   are a precondition of the first non-Lichess origin, not a nice-to-have.
4. **Runtime posture — approve as drafted, including the absence assertions.** One digest-addressed
   immutable SQLite bundle; typed eligibility authoritative; FTS ranks only inside an already
   materialized eligible set; **no vector column and no embedding dependency exist**, so no flag can
   re-enable them. Reopening semantic ranking requires a new RFC and a fresh gold set, and is yours
   (F4 Discharge D10).
5. **Identity posture — approve, and note it is delivered by `theory-drill-current-joins`, not F4.**
   Exact keys yield an identity **set**; provenance keeps the full set; no LLM resolves ambiguity.
   Amend the clause to refuse **source strength** as an ordering input while allowing key specificity.
6. **Rendering posture — approve as *narrowed*.** Deterministic cited text is normative. An optional
   conforming LLM may rephrase an already-admitted, already-sealed packet at a requested directness.
   **Strike "shorten" from the clause**: shortening a quotation is adaptation, which is a licence act,
   not a rendering act.
7. **Empty posture — approve as drafted.** Theory-only, drill-only, both and neither are first-class;
   no result is ever replaced by generic coach prose or an engine line; there is no widening, no
   key-dropping retry and no "related passages" fallback.
8. **Principle regrounding — rule the member (see choice point 1 below).**
9. **Instruction:** before `theory-knowledge-pipeline` is accepted, its §Motivation census table and
   [[D1396]]'s supporting counts get an erratum, and `make theory-source-census` pins the denominator.

Approving this **does not** lift Gate F, does not lift the D560 content-scale hold, does not
graduate a pack, does not publish candidate openings and does not authorize content expansion
(`o5-o6-handoff.md:6, 101-102`).

---

## The genuine choice points

**1. Does a regrounded principle declare `chess_tradition` or `cited_source`?** — the one real fork.

- **`chess_tradition` (the member that exists, and the one your own D531 ruling names).** Cost: the
  member is currently a bare enum value with no reader; making it mean "carries a real citation"
  requires the same biconditional validator F4 §10 specifies, just pointed at a different string. Any
  future entry standing on tradition *without* a citation loses its home.
- **`cited_source` (the draft's fourth member).** Cost: two members now describe grounded principles,
  `chess_tradition` stays inert — which is exactly the [[D428]] defect §10 rule 3 argues against —
  and `design/04:369-371` needs an intent amendment to say so.
- **Recommended:** rule `chess_tradition`, on the ground that it is already both the schema's member
  and your ruling's word, and that the biconditional reader is the same work either way. If you
  prefer `cited_source`, the ruling should also say what `chess_tradition` now means, or retire it.

**2. Is the [[D1395]] transport hardening part of F4, or does it land before it?**

- **Part of F4** (as drafted): cheapest, one commit, but the gap stays open for as long as F4 waits
  on F3's acceptance.
- **Ahead of F4**: closes a live network-facing gap now, at the cost of a small independent change to
  a file F4 also touches (`rfc/README.md:408` already pins the shared-file ownership, so the
  collision is managed either way).
- Either is defensible. The evidence does not choose; the question is how long you are comfortable
  with the gap.

**3. Does the bundle ship in the release image, or download on first run?** F4 open question 3
(`:902-906`) specifies *shipped*, because a download makes honest-empty the common case rather than
the exceptional one, and O13's Choice-C appliance floor points the same way. The cost is image size —
a real number **nobody has measured**, owed by F4's Discharge D6. **Recommendation: do not rule this
now.** Let the measurement land; nothing blocks on it.

### Where the evidence has already settled it — please do not re-open these as choices

- **Semantic/vector retrieval for 1.0.** Three predeclared gates, three failures, measured
  (`results.md:55-69`). The door back is D10 and it requires a materially larger cited corpus and a
  fresh gold set.
- **Typed predicates over free-text keys.** [[D579]] is a measured defect in the key layer, not a
  preference.
- **No LLM anywhere in fetch, extract, chunk, key, validate, index, rank or select.** This is law 8,
  not a tuning parameter.
- **No generic chunking.** A 500-token cut turned 55 logical passages into 106 chunks
  (`results.md:28-29`); a quotation whose boundary a token counter chose cannot be attributed to the
  section it came from.
- **No "related passages" on empty.** With lexical score allowed to revive candidates, four of twelve
  unrelated questions were answered — a 4K livestream question mapped to king-and-queen mate, a
  saxophone to the Sicilian (`results.md:99-103`).

---

## Law 8 — where the LLM sits, and what structurally stops it

CLAUDE.md forbids LLM-manufactured chess truth outright, and a knowledge-builder is exactly the shape
that drifts there. Stated plainly:

**The LLM appears at exactly one point: rephrasing an already-selected, already-sealed evidence packet
on the rendering path. It appears nowhere else in this recommendation.** It does not fetch, extract,
chunk, key, validate, index, rank, select a passage, resolve a theory identity, choose a drill, or
write a gold answer.

What structurally prevents it from creating chess claims — mechanisms that **fail**, not prose:

| Boundary | The mechanism that fails, verified at HEAD |
|---|---|
| It cannot receive an unsealed packet | `assertConsumerEvidenceView` throws `EVIDENCE_GENERIC_BYPASS` unless the object was built by `evidenceForConsumer` (`packages/runtime/src/evidence-contract.ts:392-396`) |
| It cannot introduce a judgement word | `voiceCheck` rejects any of the **32** `BANNED_JUDGEMENTS` — *weak, strong, better, advantage, winning, should, must, best, mistake, blunder, brilliant, accurate, sharp, strongest…* — appearing in the output but **not in the packet** (`packages/runtime/src/voice.ts:93-98, 110-116`), and the same packet-relative test guards `PRESCRIPTIVE_VERBS`, `CHESS_LEXICON`, UCI, SAN and bare squares (`voice.ts:99-104`) |
| It cannot decide applicability | eligibility is a required, non-empty, typed argument evaluated by registered projections **before** retrieval; a query with no keys does not typecheck (`rfc/theory-knowledge-pipeline.md:526, 538-540`) |
| Rank cannot become a claim | the eligible id set is materialized from the key indexes before the text index is consulted, so a passage outside it cannot appear at any rank (`:541-542`, criterion 10 asserts ineligible-top-1 = 0) |
| A derived reading cannot outrun its inputs | `EVIDENCE_DERIVATION_WIDENS` fails on exactness, grounding, answer content or abstention (`evidence-contract.ts:493-499`) |
| It cannot enter the build at all | criterion 13 asserts **zero provider-client modules in the builder's dependency closure**, so a "summarize this passage" step fails an import assertion before it reaches review (`:829-832`) |
| A quoted source cannot be laundered into a Tabiya assertion | the rendered sentence must name the source, and an unattributed share-alike source fails `licenceObligations` (`check.ts:340-356`) |

**Three honesty notes.**

- `voiceCheck` is **packet-relative**: a banned word is a violation only when it is absent from the
  packet. If the packet quotes a source that says *"advantage"*, the renderer may say *"advantage"*.
  That is correct — it is quotation, origin A — but it means the guard bounds the LLM to the packet,
  it does not bound the packet.
- **Full evidence-bound LLM rendering is not built.** `design/03-product-breadth.md:326` and
  `planning/exploration/gates.md:296` both record B4's residual: *"The LLM half stands: full
  evidence-bound LLM rendering remains unbuilt."* Approving the rendering clause approves a boundary
  around a thing that does not yet exist.
- F4 §11 deliberately refuses to put any refusal in a projection's `limitations` array, because that
  field is machine-checked **only for non-emptiness** (`evidence-contract.ts:452`) — a declared
  refusal there is decorative ([[D1343]], open with no owner). That is the right instinct, and the
  class defect still has no home.

---

## What turns on it

| Unblocks | How |
|---|---|
| **`rfc/theory-knowledge-pipeline.md` acceptance** | Its §14 names exactly two blockers: this ruling (*"the one blocker no other party can lift"*, `:706-713`) and F3's acceptance. A ruling clears the first |
| **`rfc/theory-drill-current-joins.md` Discharge D4** | `:606` — the only live owner discharge in that document; D5 is already discharged by [[D996]] |
| **F4 in the node graph** | `planning/platform-alignment/rfc-graph.md:71` gates F4 on *R4/R8/R18, O5, F1/F3 accepted*. R4/R8/R18 are complete; O5 is the owner's half |
| **F7** | Needs F3/F4/F5 accepted (`rfc-graph.md:74`). F4 cannot be accepted without this ruling |
| **`design/04-content-architecture.md:79-80`** | The protected-intent sentence that names O5 as unmade. A ruling authorizes claude to amend it under law 5 |
| **The principle regrounding wave** | [[D530]]/[[D531]] are blocked on a citation mechanism. Choice point 1 decides which member it writes |
| **What stays blocked regardless** | Gate F, the D560 content-scale hold, pack graduation, candidate publication, content expansion (`o5-o6-handoff.md:6, 101-102`). The sacrificial pilot is already sourced **grounded-only** by [[D997]], so it needs no theory corpus and does not wait on this |

---

*Traceability: every file:line in this memo was re-derived at HEAD `36074c7` on 2026-08-23. The
corpus counts in §7 were measured over `git ls-files content` with `content/sources/` excluded.*
