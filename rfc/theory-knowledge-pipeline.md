# RFC: Theory knowledge pipeline

- **Status:** draft — 2026-08-23. The F4 provenance compiler. Ready for review; **acceptance is
  blocked by two named things, neither of them scope** (§14): owner decision **O5**, which is
  drafted and ready and has never been ruled, and **F3** (`pack-capability-contract.md`), which is
  a draft rather than an accepted RFC
- **Author:** claude (on the [[D1310]] mandate read; [[D1330]] live-debt **rank 8**)
- **Created:** 2026-08-23
- **Design refs:** `design/05-in-run-experience.md` §3 (the assistance ladder — rung 5 *"Authored
  claims … provenance is the only safeguard"*, and amendment clause 2, *"Eligibility precedes
  selection"*, owner ruling O2), §3b-i (*"The classifier is the source. The shape entry is the
  claim. The LLM is the mouth."*); `design/04-content-architecture.md` §8 (production model);
  `design/03-product-breadth.md` §Intelligence and explanation
- **Exploration gate:** the **R4** research arm is complete and landed —
  `design/research/theory-knowledge-pipeline.md` plus the six-arm experiment in
  `planning/platform-alignment/knowledge-retrieval/` (`plan.md`, `results.md`, `gold-queries.json`,
  `source-register.csv`, `tools/knowledge-retrieval-harness/`). Drafting is commissioned by
  [[D1330]] (*"Drafting order is that list, top-down"*, rank 8) under [[D1310]] (*"the drafting
  mandate covers every lane traceable to an explicit owner ask"*); the owner ask is [[D557]],
  *"investigate a SEPARATE theory knowledge-builder … not scraping inside a hint request"*.
  [[D1374]] of the same day recounted that remainder — ranks 9 and 10 (the two desk teardowns) do
  not survive a per-dossier read and the count is **8**. **Rank 8 is unmoved by the recount and is
  now the last of the eight.**
  [[D581]]'s own note says *"design/owner ruling required before RFC"* — that tension is stated
  rather than finessed in §14, and it is why this document is drafted and not proposed for
  acceptance
- **Depends on:** the implemented F1 evidence contract
  (`rfc/archive/evidence-contract-manifest.md`) and the compiled catalogue at HEAD; the implemented
  sourcing artifact triple (`rfc/archive/content-sourcing-foundation.md` — `sources.json` /
  `evidence.json` / `pack.json`); accepted `rfc/runtime-opening-identity.md` (the opening
  applicability keys and its frozen-input precedent); accepted `rfc/pack-population-provenance.md`
  (the `citable_text` record kind and the `provenance_note` claim label); draft
  `rfc/pack-capability-contract.md` (F3) for the bundle-compatibility declaration. **Two dependencies
  that gate parts of the surface rather than the whole:** `rfc/runtime-opening-identity.md` is
  accepted but **unlanded**, and its two readings are the ground projections for the
  `opening.endpoint` and `opening.path` key kinds — until it lands, those two kinds refuse
  `key_ground_missing` (§5, criterion 7c); and [[D1409]]/[[D1419]]'s span-scoped `voiceCheck` repair
  is **owed on `packages/runtime/src/voice.ts`**, and no theory passage may enter a packet before it
  lands (§11.1, criterion 24b)
- **Parent / amends:** **amends `rfc/pack-population-provenance.md` §3** (two predicates on the
  `citable_text` record contract — accepted 2026-08-23 and **unlanded**, so this is an amendment to
  an unimplemented contract, not a change to shipped behaviour). Consumes, and does not redefine,
  `rfc/claim-semantic-anchors.md`'s authored/machine clause partition
- **Supersedes / superseded by:** —
- **Planning:** `planning/platform-alignment/knowledge-retrieval/` (the completed research home);
  `planning/theory-knowledge-pipeline/` once implementing

```tabiya-claims
principle-entry-schema | lane 0.2 | provenance.sources items become a closed union of the existing string form and a structured citation object (sourceId, revisionUrl, sha256, sectionRef, quotedText); standsOn gains a fourth member cited_source admissible only when a structured citation is present
```

**Why exactly one claim, and why not the four a reader will expect.**

- **No pack-schema lane.** Nothing in `schemas/drill_pack.schema.json` describes an evidence
  record, and `$defs/provenance` types `licence` as `nonEmptyString` and `attribution` as
  `array of object` — the CC-BY-SA-4.0 restriction §6 widens lives **entirely** in
  `apps/server/src/sourcing/check.ts:342` and `:353`, not in the schema. Verified by reading the
  schema's `$defs/provenance` at HEAD.
- **No `evidence-kinds` member.** `citable_text` is already claimed by accepted
  `pack-population-provenance.md` and is the right kind; §9 amends its *predicates*, not the
  vocabulary. Minting a ninth bibliographic member beside it would be the duplication [[D1202]]
  warns about.
- **No run-schema lane and no migration position.** Nothing this RFC specifies is persisted in
  SQLite or in a run: the bundle is a read-only file artifact pinned by a release, retrieval is a
  pure function of it, and the proof of a citation lives in a pack's committed ledger.
- **No new `schemas/` file and therefore no sixth schema register.** The bundle and the source
  register follow the two existing sourcing artifacts — `tabiya.sourcing.manifest.v1` and
  `tabiya.sourcing.evidence.v1` — which are versioned by a `schema` discriminator **inside the
  document** and validated in TypeScript (`apps/server/src/sourcing/ledger-validation.ts`), with no
  `urn:chess-tabiya:schema:` `$id` and no register; only their *vocabulary* is registered. §7.4
  states the exact trigger that must open a register instead, and criterion 18 asserts C7 stays
  green rather than trusting that sentence.

## Summary

The owner asked for a **separate theory knowledge-builder**, and the research answered in two
halves. The negative half is settled and measured: over 144 fixed queries, exact keys + full-text
reached **97.7% recall@5** while the best semantic arm reached **94.7%**, returned an ineligible top
result on **8.3%** of answerable queries against a 2% ceiling, and abstained on **66.7%** of hard
negatives against a 90% floor — three predeclared gates, three failures ([[D564]];
`planning/platform-alignment/knowledge-retrieval/results.md:55-69`). That half is already honoured
in the tree: `runtime-opening-identity.md:73` says *"No LLM, FTS search or semantic similarity
participates in applicability."*

The positive half has no home. This RFC is it: a **deterministic provenance compiler** that fetches
pinned, allow-listed, redistribution-compatible sources; records rights, revision, digests and exact
spans; attaches **typed applicability predicates** rather than free-text tags; validates or
quarantines; and publishes one immutable, digest-addressed SQLite bundle carrying an exact-key index
and FTS5 — with **no** crawler, vector store, embedding provider, reranker, contextualizing LLM or
PostgreSQL anywhere in a deployment. `deploy/compose.release.template.yaml` stays one Node server,
one SQLite volume and an optional Maia profile.

The law-8 line is drawn once, in §1, and every later section is an instance of it: **the pipeline
never says a chess thing is true. It says a named, pinned, licensed source says it, at these exact
bytes, and that a typed predicate over the position admits it.** Retrieval rank never enters that
sentence, and neither does an LLM. §11 lists every refusal beside the mechanism that fails when it
is violated, because a refusal written into a projection's `limitations` array is checked only for
non-emptiness (`packages/runtime/src/evidence-contract.ts:452`) and would be decorative — [[D1343]].

## Motivation

### The hole, measured at HEAD rather than asserted

The corpus already contains a citation layer. Nothing reads it.

| Fact | Measured at HEAD | scope walked |
|---|---|---|
| Committed evidence records | **893** across **68** ledgers — `engine_eval` 415, `tablebase_result` 341, `position_legality` 59, `opening_identity` 52, `puzzle_provenance` 26 | `content/**/*.json` |
| Records supporting **any** `PROSE_POINTERS` pointer (`check.ts:36-42`) | **0** | every scope below |
| Free-text `provenance.sources` strings on pack documents | *as printed by the census* — see criterion 1 | **undetermined; the drafted 378 / 65 / 49 reproduces over no scope** |
| Typed `provenance.attribution` entries | **31** across **22** documents | `content/drafts/**` |
| Packs declaring `provenance.licence: "CC-BY-SA-4.0"` | *as printed by the census* — see criterion 1 | **undetermined; the drafted 54 reproduces over no scope** |
| Principle-registry entries (`content/principles/`) | **13** | `content/principles/**` |
| — with `standsOn: "authors_practice"` | **13 of 13** | `content/principles/**` |
| — whose `provenance.sources` is the single sentence *"Synthesized from the authored claims in content/drafts during the claim-backing migration; no machine or external source establishes the judgement."* | **13 of 13** | `content/principles/**` |

The unit of every count above is **one committed document or one committed record**, and every one
is reproduced by the single derivation command criterion 1 pins. The integers are drift tripwires
([[D1240]]); the criterion asserts set-equality against the command's output, never against this
table. **The scope column is not decoration** — a re-derivation at HEAD found the drafted table
mixing three different scopes silently and carrying two rows that reproduce over none of them
(criterion 1). The argument survives intact because it rests on the **0**, which reproduces over
every scope: whatever the exact denominator, no committed record supports a prose pointer.

Read together they say one thing. **Not one byte of prose in this repository is grounded in a
source that any instrument can check.** 378 hand-written citation sentences and 49 URLs sit in a
free-string array; `licenceObligations` (`check.ts:340-356`) can only demand attribution for a
source that *contributes prose*, and its prose test is `record.supports` matching a
`PROSE_POINTERS` pattern — which **zero of 893 records do**. The attribution machinery is real,
correct, and currently unreachable. That is [[D268]]'s hole seen from the other side, and
`pack-population-provenance` §3 built the door (`citable_text`) without building anything that
walks through it at more than hand scale.

### Why the builder and not "just cite by hand"

The 13 principle entries are the control. They were written by hand, they are honest, and all 13
declare that **no source establishes them**. Hand citation at author speed produces exactly this:
either free text nothing reads, or an honest declaration of absence. A pipeline is the difference
between *"a Wikibooks page says this somewhere"* and *"revision 4628469, code points 8,214–8,502,
sha256 69bdd1bf…, CC BY-SA 4.0, attributed"* — and the second is the only form
`CITATION_SOURCE_UNRETRIEVABLE` and `licenceObligations` can act on.

### Why not the thing that already exists

Skipper (`~/frameworks/monorepo/api_consultant`) has an operationally mature ingestion core, and
the dossier's structural finding stands: the useful object is `internal/knowledge`, not the agent
around it. But the experiment refused extraction on measurement, not taste, and the refusal has
three independent legs (`results.md`):

1. **Retrieval.** All three gates failed (above). The sharpest error was not the vector at all —
   the free-text key `pawn` admitted the generic pawn-ending passage for four rook-and-pawn
   questions and **excluded the correct rook-ending passage before ranking ever ran** ([[D579]]).
   That is a defect in the key layer this RFC specifies, and it is why §5's keys are typed
   predicates with declared match semantics and no substring arm.
2. **Artifact identity.** Stored chunks carry URL/root/type/title/ingested-at and **no** licence,
   revision, source digest, chunk digest, span or embedding-model identity; a same-dimension model
   swap is invisible ([[D580]], `results.md:112-116`). §7's build identity is the generalization of
   that failure.
3. **Deployment.** The binary would not start without Frameworks Postgres, service identity and
   Gateway MCP; the bounded run required starting Commodore and Periscope Query
   (`results.md:118-122`). Acceptable for a disposable instrument; not a self-host tax for theory.

### Corrections to the source dossier, re-derived at HEAD

Every load-bearing number in `design/research/theory-knowledge-pipeline.md` reproduced. Four things
did not, and they change the specification rather than decorate it.

1. **"the thirteen existing principle entries and their eventual cited sources"** (`:278`) reads as
   a corpus the experiment could draw eligible targets from. At HEAD the thirteen are
   **13/13 uncited by their own text** and **13/13 `authors_practice`**. They are not a theory
   source; they are the first *consumer*, and the schema has nowhere to put the citation. That is
   why this RFC claims principle-entry lane 0.2 (§10) instead of treating regrounding as a later
   RFC's problem.
2. **"reuse the source-ingestion … patterns"** (`:17`) understates the gap. The dossier's table
   (`:128`) credits Skipper's crawler with *"robots rules, SSRF-safe transport, redirect limits,
   size bounds, SPA detection/render fallback"*. Tabiya's shipped fetch client is **49 lines**
   (`apps/server/src/sourcing/http.ts`) and has **none** of them — it is a serialized queue with a
   user agent, a 429/5xx retry ladder and nothing else. "Reuse the patterns" is therefore net-new
   work, priced in §3, not a copy.
3. **"an immutable exact-key/SQLite-FTS bundle"** (`:39`) is right and incomplete: `content/sources/`
   is **gitignored** (`.gitignore:11`), so the pinned bytes a span points into are not in the
   repository. A bundle that ships spans without shipping or re-deriving the bytes is
   unverifiable. §3.3 resolves this with immutable **revision** URLs plus a fail-closed digest
   re-check, which needs no committed prose bytes — and it is a stricter control than the dossier
   asked for.
4. **"allow-listed sources"** (`:38`) is not currently expressible. `SourceLicence.spdx` is a closed
   two-member union — `"CC0-1.0" | "CC-BY-SA-4.0"` (`apps/server/src/sourcing/types.ts:1-13`) — and
   `licenceObligations` rejects any pack `provenance.licence` or attribution entry that is not
   **exactly** `"CC-BY-SA-4.0"` (`check.ts:342`, `:353`). Two consequences neither dossier records:
   a **CC0 source cannot be attributed at all** (an attribution row licensed `CC0-1.0` raises
   `LICENCE_MIXED`), and a third licence is unrepresentable. §6 specifies the repair.

**Out of scope, named so it is not inferred:** the learner-facing theory↔drill door, the launch
target and the return join. Those are F7 and they are `design/research/theory-drill-current-joins.md`'s
([[D1330]] rank 5). This RFC supplies the passage store, its provenance, its typed keys and the
retrieval contract; it deliberately stops at the point where a passage is handed to a consumer. §13
draws that line precisely.

## Specification

### §1 — The three origins of a claim, and what refuses a fourth

Everything this pipeline emits traces to exactly one of three origins. There is no fourth, and the
absence of a fourth is the whole law-8 argument.

| Origin | The sentence it licenses | What establishes it | What fails if it is faked |
|---|---|---|---|
| **A. Quoted source bytes** | *"⟨source⟩, at revision ⟨r⟩, code points ⟨a⟩–⟨b⟩, says: ⟨exact text⟩"* | a pinned revision URL, a source digest, an exact span, and a licence permitting quotation and redistribution | §6's licence gate, §9's `CITATION_SPAN_AMBIGUOUS` / `CITATION_REVISION_UNPINNED`, the existing `CITATION_SOURCE_UNRETRIEVABLE` |
| **B. A typed applicability predicate, *recomputed* over the position** | *"this position satisfies ⟨key⟩"* | a registered F1 projection evaluated over the FEN carried by the query itself (§8 rule 0), never a key the caller asserted | `THEORY_KEY_UNGROUNDED` at query time (§8 rule 0); the F1 compiler: `EVIDENCE_DERIVATION_WIDENS` (`evidence-contract.ts:493-499`), `EVIDENCE_DEPENDENCY_MISSING`, `EVIDENCE_PROJECTION_INCOMPLETE` |
| **C. An authored declaration** | *"⟨author⟩ claims ⟨X⟩"*, and — see below — *"⟨reviewer⟩ judged this passage applicable to ⟨key⟩ on ⟨date⟩"* | the shipped authored-clause path — `author_principle` labelling, `CLAIM_PRINCIPLE_MISSING`, and the principle registry | `claim-semantic-anchors` §5 step 8; `pack-population-provenance` §4 fence 1 |

**A source saying a thing is origin A, never origin B.** *"Wikibooks says …c5 controls b5"* is a
quotation. *"…c5 controls b5"* is a chess claim this pipeline may not make, and the rules layer
already makes it better. The pipeline is a librarian, not a coach.

**Origin B has to be an instrument, and an earlier draft left it as prose.** The sentence *"a
registered F1 projection evaluated over the position"* was written into this table while §8's
`TheoryQuery` carried **no FEN, node or run at all** — `{eligibility, text?, limit}`. The keys were
therefore *caller-supplied assertions* that the pipeline indexed against without ever seeing the
position they claimed to describe, which is [[D1389]]'s shape (a projection whose stated ground is a
thing nothing in the call path can read) at the centre of the law-8 case. §8 rule 0 repairs it: the
query carries the position, every eligibility key is **recomputed** from it by its registered ground
projection before any index is touched, and a caller key the ground does not produce is a refusal
rather than a filter. The table row above is now true because the mechanism exists, not because the
sentence is written down.

**And for prose sources, origin B is mostly origin C, which this document must say plainly.** §5
rule 4 already concedes that where a key cannot be derived — *"and for prose sources it usually
cannot"* — the key is **authored by the reviewing human**. `THEORY_KEY_UNATTRIBUTED` (§6.3) checks
only that a reviewer and a date are named; **nothing checks that the key holds**, and nothing could,
because the key is a judgement about a passage's applicability rather than a measurement over a
position. So for the corpus this pipeline exists to build, the *typical* admitted passage is admitted
by origin C wearing origin B's clothes. That is not a defect to be argued away — it is the honest
shape of citing prose — but it must be **carried in the data and in the rendered sentence**, which
§5 rule 6 and §8 rule 7 now require: a passage's keys are partitioned into derived and authored arms,
a result records which arm admitted it, and a passage admitted only by an authored key may be
rendered only in origin C's sentence form, never in origin B's.

**The fourth origin, refused by name: retrieval rank.** *"The index scored this passage 0.83"* is
not a licence to say anything at all. It orders an already-eligible set (§8) and no other thing.
This is `runtime-opening-identity.md:73` read forward rather than as a prohibition, and it is
`design/05` §3's amendment clause 2 (*"Eligibility precedes selection"*, owner ruling O2) applied to
prose instead of to events. **The refusal is only real if an eligible set cannot be the whole
bundle**, and in the drafted type it could be: `phase` and `side` are members of the closed key union,
so `eligibility: [{ kind: "phase", value: "middlegame" }]` admits every middlegame passage and FTS
rank alone chooses among them — the fourth origin reconstructed exactly, through a legal query, with
criterion 10 green throughout because every returned passage *is* in the materialized eligible set.
§8 rule 0b closes it with a specificity floor: `phase` and `side` may **narrow** an eligible set and
may never **constitute** one.

**The fifth, also refused: an LLM.** No language model participates in fetching, extracting,
chunking, keying, validating, indexing, ranking or selecting. §11 enumerates the mechanisms.

### §2 — The source register

`content/theory-sources.json`, `schema: "tabiya.theory.sources.v1"`. It is committed, reviewed like
content, and is the **only** input to the fetcher. Today's allow-list is a two-member literal inside
a `main()` argument check (`apps/server/src/sourcing/source-fetch.ts:47-48`, admitting exactly
`lichess-chess-openings` and `lichess-puzzle-db`); this register replaces it for theory sources and
leaves the two structured feeds where they are.

```ts
interface TheorySourceEntry {
  readonly sourceId: string;              // stable slug, unique in the register
  readonly canonicalUrl: string;          // the page's stable identity
  readonly revisionUrl: string;           // an IMMUTABLE URL: ?oldid=, a commit sha path, a byte range
  readonly revision: string;              // the revision token itself, extracted, not inferred
  readonly publisher: string;
  readonly authors: readonly [string, ...string[]];   // "Wikibooks contributors" is a valid author
  readonly licence: SourceLicence;        // reused from sourcing/types.ts, widened by §6
  readonly attributionText: string;
  readonly language: string;              // BCP-47
  readonly permits: {
    readonly quotation: boolean;
    readonly adaptation: boolean;
    readonly redistribution: boolean;
  };
  readonly strength: "structured_dataset" | "reference_work" | "community_wiki"
                   | "tabiya_research" | "tabiya_authored";
  readonly review: { readonly state: "accepted" | "rejected"; readonly by: string; readonly at: string };
  readonly sha256: string;                // digest of the pinned bytes at that revision
  readonly bytes: number;
  readonly retrievedAt: string;
  readonly admissionNote: string;         // what this source may and may not be used for
}
```

Five register rules, each with a refusal code:

1. **`revisionUrl` must be immutable.** A URL whose bytes may legitimately change cannot
   distinguish drift from update. `THEORY_SOURCE_REVISION_UNPINNED`.
2. **A source enters the bundle only if `permits.quotation && permits.redistribution`.** The bundle
   ships the quoted spans, which *is* the redistribution act. A quotation-only source may be cited
   by an author from its own bytes; it may not be indexed. `THEORY_SOURCE_NOT_REDISTRIBUTABLE`.
3. **`review.state` has no `unreviewed` member.** An entry exists only after a human accepted or
   rejected it, so "not yet reviewed" is the absence of a row rather than a state that can leak
   through a default. (`rejected` rows are retained so a rejected source cannot be silently
   re-proposed.)
4. **`strength` is provenance, never authority.** No consumer may order, weight, prefer or grade by
   it, and no rendered sentence may mention it. It exists so a research dossier is never displayed
   as general chess authority — the exact admission note `results.md:26` recorded for the three
   Tabiya dossiers in the experiment corpus.
5. **The standing refusals are fixtures, not prose.** `design/research/theory-sourcing.md`'s "Do not
   use" list — TWIC (*"free for personal use only"*), PGN Mentor (no terms stated),
   the ecochessopeningcodes endgame compilation (unlicensed, murky provenance), Lichess studies in
   bulk (author-owned), and the `calebjcourtney` SQLite dump verbatim — becomes **five committed
   negative fixtures**: a register entry naming any of those origins fails
   `THEORY_SOURCE_REFUSED`. A refusal that lives only in a dossier is a refusal that a future author
   will not read.

### §3 — Fetch and pin

#### 3.1 What must be added to the shipped client

`SourcingHttpClient` (`apps/server/src/sourcing/http.ts`, 49 lines) is a serialized single-flight
queue with a project user agent, a `[60s, 120s, 240s]` retry ladder for 429/5xx, and a non-retried
4xx error. The builder needs, and the file has none of:

| Control | Why it is required here specifically |
|---|---|
| SSRF guard — scheme allow-list, DNS resolution check, private/link-local/loopback refusal, re-checked after every redirect | the register is content-tier and reviewed by humans; a builder that will fetch whatever a reviewed row names is a request forgery primitive on the operator's network |
| Redirect limit and a same-registrable-domain rule | a redirect off the reviewed origin silently defeats the allow-list |
| Byte ceiling with streaming abort | `request()` buffers `response.arrayBuffer()` whole; an unbounded body is an unbounded allocation |
| `Content-Type` allow-list | a binary body extracted as text produces garbage spans that still digest cleanly |
| `robots.txt` for any origin outside the register's structured feeds | politeness, and the etiquette `design/research/theory-sourcing.md` §2 records for Lichess is already stricter than robots |

**Refused, deliberately, from the dossier's crawler table:** sitemap discovery, same-origin link
discovery, SPA detection and headless-browser render fallback. The register names revisions
explicitly; nothing discovers a source. A builder that can discover sources can ingest one nobody
reviewed, which defeats §2 entirely.

#### 3.2 Pacing and rate limits

The existing serialized `inProcessTail` and retry ladder are retained unchanged, and the source lock
(`lock.ts`) still guards concurrent builds. The one-request-at-a-time etiquette recorded for Lichess
endpoints (`theory-sourcing.md` §2, §5) is a property of the shipped client and stays.

#### 3.3 Reproducibility without committing prose bytes

`content/sources/` is gitignored (`.gitignore:11`), so the pinned bytes are a local build input, not
a repository artifact. Rather than commit prose (which would make every build a redistribution
event of every source, reviewed or not), reproducibility is carried by three facts:

1. `revisionUrl` is immutable (§2 rule 1), so a refetch is defined.
2. The register records `sha256` and `bytes` of those bytes.
3. **A rebuild that fetches a different digest at the same revision URL fails closed** with
   `THEORY_SOURCE_DIGEST_DRIFT`. It never silently re-extracts, and it never updates the register:
   a changed revision is a new register row and a human review.

This is `runtime-opening-identity.md` §1.1's frozen-input pattern (five named files at one commit,
with byte counts and SHA-256, and *"Runtime never fetches the network"*) applied to prose. It is
strictly stronger than the dossier's ask, which stopped at "record digests".

### §4 — Extract: a passage is a span, not a chunk

```ts
interface TheoryPassage {
  readonly passageId: string;      // sha256 over sourceId|revision|spanStart|spanEnd|textSha256
  readonly sourceId: string;
  readonly revision: string;
  readonly sectionRef: string;     // the source's own addressable unit: heading path, row key, id
  readonly spanStart: number;      // Unicode CODE POINT offset into the extracted text
  readonly spanEnd: number;        // exclusive; spanEnd > spanStart
  readonly text: string;           // exactly the code points in [spanStart, spanEnd)
  readonly textSha256: string;
  readonly extractor: { readonly id: string; readonly version: number };
  readonly keys: readonly ApplicabilityKey[];   // §5; may be empty, which means "never eligible"
}
```

Four rules:

1. **Offsets are Unicode code points, everywhere, and the fixture proves it.**
   `claim-semantic-anchors` criterion 10 had to be corrected from "bytes" to "code points" in the
   one criterion whose subject is unit confusion (that RFC's changelog, correction 8). The same
   correction is made here *before* the mistake, and criterion 6 exercises an astral-plane
   character.
2. **A passage boundary is the source's own boundary** — a paragraph, a list item, a table row, a
   record — never a fixed token window. Skipper's ordinary 500-token chunker turned **55 logical
   passages into 106 chunks** (`results.md:28-29`), i.e. it split roughly two to one, and a CC BY-SA
   quotation whose boundary was chosen by a token counter straddles the section it must be
   attributed to. **Generic chunking is refused.**
3. **Extraction is deterministic and versioned.** One named extractor per source shape (MediaWiki
   `action=parse` on the pinned `oldid`; TSV/CSV record pointers; plain text). The extractor id and
   version enter the build identity (§7), so an extractor change invalidates the bundle rather than
   silently re-cutting spans.
4. **No generated context, ever.** Skipper's optional contextual retrieval prepends one or two
   LLM-written sentences before embedding while storing the original for display
   (`theory-knowledge-pipeline.md:214-219`). It bought **1.5 points of recall@1, zero recall@5 and
   one hard negative of twelve** (`results.md:71-74`), and it changes which passage is retrieved.
   It is not adopted at any strength, including "index-only".

### §5 — Enrich: typed applicability predicates

This is the section [[D579]] wrote. The key type is closed, every member declares its match
semantics, and **no member matches on substrings**.

Table unit: **one applicability key kind**; total **11**. The acceptance criterion asserts
set-equality against the compiled key union, not against this integer ([[D1240]]).

| Key kind | Domain | Match semantics | Ground projection / source | compiled at HEAD? |
|---|---|---|---|---|
| `position.exact` | normalized FEN | equality | rules arithmetic | ✅ |
| `position.transposition` | `transposeKey(fen)` | equality | `packages/runtime/src/chess.ts:16` | ✅ |
| `opening.endpoint` | catalogue endpoint id | equality | `theory.opening.current_endpoint@1` (`rfc/runtime-opening-identity.md:60`) | ❌ **specified only, not compiled** |
| `opening.path` | catalogue path id | membership | `theory.opening.catalogue_membership@1` (`rfc/runtime-opening-identity.md:62`) | ❌ **specified only, not compiled** |
| `opening.eco` | an ECO **interval**, e.g. `E60`–`E99` | letter equality **and** integer interval containment | the five pinned `chess-openings` TSVs, `CHESS_OPENINGS_COMMIT` (`apps/server/src/sourcing/openings.ts:18`) | ✅ |
| `phase` | `opening \| middlegame \| endgame` | equality | `rules.phase.reading` (`evidence-catalog.ts:746`) | ✅ |
| `material.signature` | role multiset per side | declared per key: `equal` or `superset` | `derived.material.reading.role_signature` (`evidence-catalog.ts:681`) | ✅ |
| `structure.named` | registered structure id | equality | `rules.structural.reading.named_structure` (`evidence-catalog.ts:237-240`) | ✅ |
| `shape` | registered shape-entry id | equality | `theory.shapes.firing` (`evidence-catalog.ts:757`) | ✅ |
| `motif` | one member of `SEMANTIC_EVENT_PROJECTION_IDS` | equality on the projection id | 67 members at HEAD (`evidence-catalog.ts:149`) | ✅ |
| `side` | `white \| black` | equality | FEN side to move | ✅ |

**The last column is new and it corrects a false claim.** An earlier draft headed this column
*"Ground projection / source, **at HEAD**"* for all eleven rows. Two of the eleven are not at HEAD:
`theory.opening.current_endpoint@1` and `theory.opening.catalogue_membership@1` appear **only** in
`rfc/runtime-opening-identity.md` (accepted 2026-08-23, **not landed**) and in **zero** lines of
`packages/runtime/src/` or `apps/server/src/`. `[V]` The compiled catalogue's only opening producer
is `theory.opening_identity` with the single projection `theory.opening_identity.record`
(`evidence-catalog.ts:790`), which is an authoring-provenance source record, not either of these
readings. §8 rule 0's `key_ground_missing` refusal is what this costs: **the two `opening.*` key
kinds are inadmissible at query time until `runtime-opening-identity` lands**, and criterion 7 asserts
the refusal rather than letting the kinds sit in the union as dead members. That is a real dependency,
recorded in `Depends on:`, not a table footnote.

Six rules that make the table a mechanism rather than a list:

1. **There is no free-text key kind and no `contains` arm.** The union above is exhaustive and
   `ApplicabilityKey` is a discriminated union with literal `kind` values; a string tag does not
   typecheck. The R4 failure is committed as a **permanent negative fixture**: the four
   rook-and-pawn queries against the generic pawn-endings passage must return the rook-endings
   passage and must not return the pawn-endings passage, and the fixture is named for [[D579]] so
   deleting it is visible.
2. **`opening.eco` is an interval, not a prefix.** R4 crossed A40/D00 and B10/B12 on name
   similarity; a substring match on `E6` also matches `E6` in a different volume's prose. Letter
   plus integer interval is the only form admitted.
3. **Every key names its ground projection, and a key whose ground abstains is not emitted.** An
   abstention is not a key with an unknown value; it is the absence of a key. This is the shipped
   abstention discipline (`abstention: { possible, reasons }`, enforced non-vacuously at
   `evidence-contract.ts:445`) applied to enrichment.
4. **Enrichment is deterministic code over the pinned bytes and the registered projections.** No
   model infers a key from prose. Where a key cannot be derived — and for prose sources it usually
   cannot — the key is **authored on the register row or the passage** by the reviewing human and is
   recorded as authored, with `strength` and `review` already carrying who and when. An authored key
   is origin C (§1) and is labelled as such in the bundle.
5. **A passage with zero keys is never eligible.** It is retained (so its provenance survives) and
   is unreachable by §8's contract. There is no "no keys means match anything" fallback; that
   reading is exactly how a librarian becomes a coach.
6. **The two arms of rule 4 are a partition in the data, not a note in this RFC — because for prose
   they are the majority arm, and nothing checks that an authored key holds.** A passage carries
   `derivedKeys` (emitted by a named ground projection over the source's own structured content) and
   `authoredKeys` (reviewer-supplied, each carrying `reviewer` and `reviewedAt`), and the two lists
   are never merged. `THEORY_KEY_UNATTRIBUTED` (§6.3) is a **naming** check — it asserts a reviewer
   and a date are present and cannot assert that the key is true of the passage, because the key is a
   judgement rather than a measurement. So an `authoredKeys` entry is **origin C** (§1), it is
   labelled as such all the way to §8's `admittedBy.origin: "authored_applicability"`, and the
   sentence a consumer may render about it names the reviewer rather than the position. Stating this
   is not a concession — it is the difference between a librarian who says *"a human decided this
   page is about rook endings"* and one who says *"this position is a rook ending"* on the same
   evidence. Criterion 23.

### §6 — Validate, quarantine, and the licence ceiling

#### 6.1 The lifecycle

`raw → extracted → enriched → validated → publishable | quarantined`. Quarantine is a state in the
build database, not a deletion: a passage that fails any check is retained with its failure code so
the failure is auditable, and **is not written to the bundle**. Export is fail-closed — one
quarantined passage does not block the bundle, but one *unclassified* passage (a passage in neither
state) aborts the export with `THEORY_BUILD_INCOMPLETE`.

#### 6.2 The licence ceiling — a blocker with a repair, not a scope cut

`SourceLicence.spdx` is `"CC0-1.0" | "CC-BY-SA-4.0"` (`apps/server/src/sourcing/types.ts:1-13`), and
`licenceObligations` (`check.ts:340-356`) enforces two rules that were written for a wholesale
CC-BY-SA content posture:

- `check.ts:342` — a pack `provenance.licence` other than exactly `"CC-BY-SA-4.0"` raises
  `LICENCE_MIXED`;
- `check.ts:353` — **every** attribution entry whose `licence` is not exactly `"CC-BY-SA-4.0"`
  raises `LICENCE_MIXED`.

Two consequences, neither of them previously recorded. **A CC0 source cannot be attributed at all**
— attribution is optional for CC0, but an author who attributes anyway (which
`theory-sourcing.md` §1 recommends as courtesy for the Lichess data) fails the check. And **a third
licence is unrepresentable**, so the allow-list the owner asked for is capped at two SPDX
identifiers before it starts.

The repair, specified rather than deferred:

1. `SourceLicence.spdx` becomes a closed enum with an explicit per-member admission rule. Members at
   this RFC: `CC0-1.0`, `CC-BY-4.0`, `CC-BY-SA-4.0`, `CC-BY-SA-3.0`, `public-domain`. Each carries
   `requiresAttribution` and `shareAlike` booleans **derived from the member, not authored**, so a
   register row cannot mis-declare its own obligations.
2. `licenceObligations` splits into two arms that no longer share a constant: the **pack prose
   licence** arm keeps today's wholesale rule (the pack's own prose is CC-BY-SA-4.0 or nothing —
   this is `theory-sourcing.md` §3's posture (b) and the tree already implements it), and the
   **attribution entry** arm accepts any register-admitted licence and demands attribution exactly
   when `requiresAttribution` is true for that member.
3. A share-alike source may be **quoted** into a CC-BY-SA-4.0 pack and may not be **adapted** into
   one whose licence is incompatible; `permits.adaptation` is checked at the point of adaptation,
   not at ingest.

This is a widening of a TypeScript union and a split of one function. It touches no JSON Schema
(§ claims block), and it is why this RFC's claims block is one line rather than two.

#### 6.3 What the validator checks

| Check | Code |
|---|---|
| span is a real, in-range, code-point-aligned slice of the pinned bytes | `THEORY_SPAN_INVALID` |
| `text` is byte-equal to that slice and `textSha256` matches | `THEORY_PASSAGE_DIGEST_MISMATCH` |
| the source permits quotation and redistribution | `THEORY_SOURCE_NOT_REDISTRIBUTABLE` |
| the source's licence requires attribution and `attributionText` is present | `THEORY_ATTRIBUTION_MISSING` |
| every key's ground projection exists in the compiled F1 manifest | `THEORY_KEY_GROUND_MISSING` |
| an authored key names its reviewer and date | `THEORY_KEY_UNATTRIBUTED` |
| no two passages share a `passageId` with different bytes | `THEORY_PASSAGE_ID_COLLISION` |

### §7 — The bundle

#### 7.1 Shape

One SQLite file, read-only at runtime, `schema: "tabiya.theory.bundle.v1"` recorded in a `meta`
table. Tables: `source`, `passage`, `passage_key`, `passage_fts` (FTS5 over `text`), `build`. There
is **no vector column and no embedding table**, and criterion 12 asserts their absence rather than
their configuration, because an absent column cannot be enabled by a flag.

#### 7.2 Build identity — the generalization of [[D580]]

Skipper detects an embedding-model change only by vector **dimension**, so a same-dimension swap is
invisible (`results.md:115`). The bundle therefore records, and hashes into one `bundleId`:

- the source register's canonical digest, and every source's `revision` + `sha256`;
- every extractor id + version actually used;
- every enricher id + version actually used;
- **the compiled F1 evidence-manifest digest** — the keys in §5 are meaningless against a different
  projection vocabulary;
- the bundle schema string;
- `generatedAt`;
- the digest of the retrieval-evaluation result (§7.5).

`bundleId = sha256(canonical(build row))`. A release pins exactly one `bundleId`.

#### 7.3 Runtime compatibility

At startup the server compares the bundle's evidence-manifest digest with the running manifest's. On
mismatch it **refuses the bundle and serves honest-empty theory**, rather than serving passages
keyed against a vocabulary it no longer speaks. The refusal is a named startup diagnostic, not a
crash: theory is an enrichment, and a release must still play chess without it. When F3 lands, this
declaration is expressed in its capability grammar rather than as a bespoke digest field, which is
Discharge D1.

#### 7.4 Why this is not a sixth registered schema, and the exact trigger that would make it one

`tabiya.theory.bundle.v1` and `tabiya.theory.sources.v1` follow `tabiya.sourcing.manifest.v1` and
`tabiya.sourcing.evidence.v1`: a version discriminator inside the document, TypeScript validation,
no `schemas/*.schema.json` and no register. That precedent is deliberate and is why
`register-check.mjs` derives its schema set **from disk** (`readSchemaFiles`, C7) — a file in
`schemas/` without a register is the recorded `campaign-schema` defect (`rfc/README.md`
§Campaign-schema-version register), and the correct way to avoid repeating it is not to put a
non-schema artifact there.

**The trigger, stated so it is not left to judgement:** the moment either artifact acquires a
`urn:chess-tabiya:schema:` `$id`, or a second document writes its format, a register section and a
`SCHEMA_SLUGS` entry are owed in the same commit. Criterion 18 asserts C7 green after
implementation, which fails automatically if a schema file lands without one.

#### 7.5 The committed evaluation

The bundle is not exported until a committed retrieval suite runs against it and its result digest
enters the build identity. The suite is R4's shape, re-pointed at production: eligible-passage
recall@1/@5, ineligible top-1 rate, hard-negative abstention, citation/digest reproduction after a
clean rebuild, and the two invalidation controls (one edited source; one changed extractor). The
gold set is committed. **No gold answer may be written by an LLM** — `results.md:32` records that
discipline for the experiment and it becomes a rule here.

The thresholds are **not** copied from R4. R4's numbers were gates on a *research* question ("does
semantics beat exact+FTS"), and `plan.md:60` says so explicitly: *"These are predeclared research
thresholds, not product acceptance criteria."* The product gate is different in kind and stated in
criterion 10: **ineligible top-1 must be exactly zero**, because with eligibility computed by typed
predicates (§8) an ineligible result is not a ranking miss — it is a contract violation.

### §8 — Retrieval: eligibility first, ranking inside it, never the reverse

```ts
/** The nine kinds that can constitute an eligible set. `phase` and `side` are NOT members. */
type SpecificApplicabilityKey = Extract<ApplicabilityKey, { kind:
  | "position.exact" | "position.transposition" | "opening.endpoint" | "opening.path"
  | "opening.eco" | "material.signature" | "structure.named" | "shape" | "motif" }>;

interface TheoryQuery {
  readonly position: {                       // rule 0: the subject the keys are about
    readonly fen: string;                    // normalized; the only thing keys are recomputed over
    readonly nodeId?: string;                // provenance for the caller's own audit; never read by retrieval
    readonly runId?: string;
  };
  readonly eligibility: readonly [SpecificApplicabilityKey, ...ApplicabilityKey[]];  // rule 0b
  readonly text?: string;                                                            // ranking only
  readonly limit: number;
}

type TheoryPassageRef = {
  readonly passageId: string;
  readonly sourceId: string;
  readonly sectionRef: string;
  readonly attributedQuotation: string;      // rule 7: the quote and its attribution are one string
  /** rule 7: which arm of the passage's key partition admitted it. */
  readonly admittedBy:
    | { readonly origin: "derived"; readonly keys: readonly ApplicabilityKey[] }
    | { readonly origin: "authored_applicability"; readonly keys: readonly ApplicabilityKey[];
        readonly reviewer: string; readonly reviewedAt: string };
};

type TheoryResult =
  | { readonly kind: "passages"; readonly passages: readonly TheoryPassageRef[]; readonly eligibleCount: number }
  | { readonly kind: "empty"; readonly reason: "no_eligible_passage" | "bundle_absent" | "bundle_incompatible" }
  | { readonly kind: "refused"; readonly reason: "key_ungrounded" | "eligibility_underspecified" | "key_ground_missing";
      readonly key: ApplicabilityKey };
```

**Two gating rules, then seven ordering rules.**

**Rule 0 — the query carries the position, and every key is recomputed over it before any index is
consulted.** `search` evaluates each `eligibility` key's registered ground projection (§5's table)
against `position.fen` and compares the result to the key the caller supplied. A key the ground
projection does not produce, or whose ground **abstains**, returns
`{ kind: "refused", reason: "key_ungrounded" }` — it is **not** silently dropped and **not** used
as a filter. A key whose ground projection is absent from the compiled F1 manifest returns
`key_ground_missing` (the query-time twin of §6.3's build-time `THEORY_KEY_GROUND_MISSING`).
*This is what makes origin B an evaluation rather than a caller assertion (§1).* The caller may
therefore not widen its own eligibility by asserting a key the position does not satisfy, which is
the only way a caller could have reached passages outside its position's admitted set.

**Rule 0b — `phase` and `side` may narrow an eligible set and may never constitute one.** The first
tuple member is typed `SpecificApplicabilityKey`, so `eligibility: [{ kind: "phase", … }]` does not
typecheck, and the runtime re-checks it (a JSON caller does not typecheck) returning
`{ kind: "refused", reason: "eligibility_underspecified" }`. Without this the closed key union
admits a whole-bundle search through a legal query and rank alone selects among the results — the
fourth origin §1 refuses by name, reconstructed with every other rule still green.

**Rules 1–8.**

1. **`eligibility` is required and non-empty in the type.** There is no overload, default or
   sentinel that searches the whole bundle. A query with no keys does not typecheck.
2. **The eligible id set is materialized from the key indexes before the text index is consulted**,
   and the FTS query is applied as a filter over that set. A passage outside the set cannot appear
   at any rank. This is the mechanical form of `runtime-opening-identity.md:73`.
3. **An empty eligible set returns `kind: "empty"`, and there is no fallback.** No widening of the
   key set, no dropping the most specific key, no free-text search over the bundle, no
   "related passages". The R4 negative behaviour is the reason: with lexical score revived,
   contextual retrieval answered **4 of 12** unrelated questions — a 4K livestream question mapped
   to king-and-queen mate, football offside to a detector dossier, a Kubernetes crash to pack
   stability, a saxophone to the Sicilian (`results.md:99-103`). Those twelve are committed hard
   negatives (criterion 11).
4. **The response carries passages, never an answer.** There is no endpoint that returns generated
   or assembled prose. `eligibleCount` is reported so a consumer can render *"3 of 17 shown"* — the
   full-vs-shown denominator discipline the grounded-coaching dossier requires — and is not a score.
5. **No ranking signal may be a chess judgement.** Admitted ordering inputs: FTS rank over the
   supplied text, key specificity (an exact position outranks a phase), and `sectionRef` order
   within a source. Refused: recency, popularity, source `strength`, passage length, and any
   engine or human-model quantity.
6. **The runtime never fetches.** The bundle is the only source. There is no request-time scrape,
   which is the misreading [[D557]] was raised to correct.
7. **A result says which origin admitted it, and a quotation never leaves the store without its
   attribution.** `admittedBy.origin` is `"derived"` only when every key that admitted the passage
   came from the derived arm of §5 rule 6's partition; a passage admitted by an authored key carries
   `"authored_applicability"` with the reviewer and date the `THEORY_KEY_UNATTRIBUTED` check already
   demands. A consumer may render an `"authored_applicability"` passage only in origin C's sentence
   form (*"⟨reviewer⟩ judged this passage applicable to ⟨key⟩ on ⟨date⟩"*), never in origin B's
   (*"this position satisfies ⟨key⟩"*). And `attributedQuotation` is **one string** containing the
   attribution and the quoted span together, so there is no representation of a bare quotation for a
   renderer to emit — §11's origin-A sentence form becomes a data shape instead of an instruction.
8. **The eligible set is a function of the position, not of the caller.** Rules 0, 0b and 2 compose
   to one property an implementer can test directly: for a fixed `position.fen`, the union of every
   passage reachable by any admissible query is fixed, and no caller-supplied field widens it.
   Criterion 22.

### §9 — Consumption: a passage becomes evidence only through the ledger

A retrieved passage is a **candidate**. It becomes evidence when, and only when, it is emitted as a
`citable_text` record into a pack's evidence ledger, at which point every gate
`pack-population-provenance` §3 specifies already applies: `grounds: "citable_source"`, exact
`values` keys `["title", "sectionRef", "quotedText"]`, a manifest entry with `origin.kind: "http"`
and non-null `sha256` (`CITATION_SOURCE_UNRETRIEVABLE`), support restricted to `PROSE_POINTERS`
(P5), and `licenceObligations`' attribution demand — which fires for the first time in this
repository's history, because §Motivation measured **0 of 893** records supporting a prose pointer
today.

**The bundle is a search index. The ledger is the proof.** A `citable_text` record does not name a
`passageId` and does not depend on the bundle existing: its proof is the pinned source bytes. That
separation is deliberate — it means a bundle rebuild can never invalidate a committed citation, and
a citation can never be validated by "the index said so".

**Amendment owed to `pack-population-provenance` §3** (accepted 2026-08-23, unlanded — two
predicates, no vocabulary change, no lane):

- **P6 — `CITATION_SPAN_AMBIGUOUS` (error).** `quotedText` must occur **exactly once** in the pinned
  source bytes. `sectionRef` is a free string and cannot locate a quote; occurrence-uniqueness turns
  the pair into a verified locator with no schema change. *Positive fixture:* a quote appearing
  twice in one source → error. *Negative fixture:* a unique quote → clean, proving the predicate
  reads its subject and not its own state (`pack-population-provenance` §5's discipline, and
  [[D522]]'s lesson).
- **P7 — `CITATION_REVISION_UNPINNED` (error).** A `citable_text` record's manifest entry must name
  an immutable revision URL. `sha256` pins bytes; a mutable URL means the next legitimate fetch
  differs and drift is indistinguishable from update. *Hazard named, as §5.5 does:* there are
  **0 `citable_text` records in the corpus** at landing, so both predicates fire zero times on
  today's content and their fixtures are the only thing that proves they work.

**Emission is author-reviewed, never automatic.** A builder tool may *propose* a record; applying it
is an explicit content edit under the content-wave closeout. This mirrors `claim-semantic-anchors`
§7's migration-planner rule (*"It never writes arbitrary prose and never uses an LLM. Apply mode
requires an explicit file list and is all-or-nothing."*) and exists for the same reason.

### §10 — Principle regrounding, and the principle-entry lane

`schemas/principle_entry.schema.json` (head **0.1**) types `provenance.sources` as an array of
non-empty strings. All **13** committed entries fill it with the same sentence declaring that no
source establishes the judgement, and all 13 stand on `authors_practice`. The registry is honest and
entirely uncited, and the schema gives it no way to stop being.

**Lane 0.2** (`PRINCIPLE_ENTRY_SCHEMA_VERSION`, `packages/schema/src/index.ts:8`):

1. `provenance.sources` items become a closed two-arm union: the existing non-empty string, or
   `{ sourceId, revisionUrl, sha256, sectionRef, quotedText }`.
2. `standsOn` gains a fourth member `cited_source` (`PrincipleBasis`,
   `packages/schema/src/principle-entry/index.ts:4`).
3. **The member is admitted biconditionally, in the validator, in the same change.**
   `standsOn === "cited_source"` **iff** at least one structured citation is present. A vocabulary
   member with no reader is [[D428]]'s defect and `pack-population-provenance` §4 refuses it by
   name; the biconditional is the reader, and it also makes `cited_source` impossible to use as a
   cheaper relabel ([[D135]]).
4. Both arms of the union remain valid, so **all 13 entries stay valid unchanged** and no principle
   digest moves (`digestPrincipleEntry` is `digestCanonicalJson` over the whole entry —
   `principle-entry/index.ts:26`), which means no pack claiming a principle re-stamps.

Two honest notes. A principle-entry document carries no `formatVersion` field
(`schemas/principle_entry.schema.json` `required`), so a lane bump has no per-document marker; that
is tolerable for a purely additive lane and is stated so a later breaking change knows it must add
one. And the client types `standsOn` as bare `string` (`apps/web/src/lib/api.ts:218`), so a fourth
member costs nothing there and also buys nothing there — presentation of `cited_source` is a
separate, later concern, ledgered rather than smuggled in.

### §11 — The LLM boundary, and what fails when it is crossed

`design/05` §3b-i is the design-tier statement: *"The classifier is the source. The shape entry is
the claim. The LLM is the mouth."* This section is the enforcement map. **No row's enforcement is a
`limitations` string.** `limitations` is machine-checked only for non-emptiness
(`evidence-contract.ts:452`, inside the `EVIDENCE_PROJECTION_INCOMPLETE` conjunction), so a refusal
declared there is a projection asserting a rule nothing evaluates — [[D1343]], open with no owner.
This RFC declares `limitations` where the contract requires the field, and puts every load-bearing
refusal somewhere that fails.

| Refusal | What fails when it is violated | Where |
|---|---|---|
| An LLM may not select a passage | `search` returns a sealed result set from the key indexes; the renderer receives a `ConsumerEvidenceView`, and any unsealed object throws `EVIDENCE_GENERIC_BYPASS` | `evidence-contract.ts:392-396` |
| An LLM may not decide applicability | keys are evaluated by registered projections before retrieval; the LLM has no input to the eligibility set — it is not a parameter of any function it can call | §8 rule 1 (type) |
| An LLM may not write a chess noun, square, move or judgement not in the packet | `voiceCheck` / `BANNED_JUDGEMENTS` (32 members) on the rendering path | `packages/runtime/src/voice.ts:93,116` |
| An LLM may not participate in the build | the builder has no model client, no provider config and no network egress beyond the register's origins (§3.1) | criterion 13 asserts zero provider imports in the builder package |
| Retrieval rank may not establish applicability | a passage outside the materialized eligible set cannot be returned at any rank | §8 rule 2, criterion 11 |
| An empty eligible set may not be filled | `TheoryResult` has an `empty` arm and no widening path; the 12 R4 hard negatives are committed | §8 rule 3, criterion 11 |
| A derived theory projection may not claim more than its inputs | `EVIDENCE_DERIVATION_WIDENS` over grounding, exactness, answer content and abstention | `evidence-contract.ts:493-499` |
| A quoted source may not be rendered as a Tabiya assertion | the rendered sentence must name the source; a citation record with no attribution fails `licenceObligations` for share-alike sources and `THEORY_ATTRIBUTION_MISSING` at build for the rest | `check.ts:340-356`, §6.3 |
| A research dossier may not be shown as chess authority | `strength` may not order, weight or appear in rendered text | §2 rule 4, criterion 14 |

**The one thing an LLM may do**, and it is unchanged from the shipped contract: paraphrase an
already-admitted, already-sealed packet at a requested directness, through the existing bounded
voice path. It may not shorten a quotation — a shortened quote is an adaptation, and adaptation is a
licence question (§6.2 rule 3), not a rendering one.

#### 11.1 — This is the first thing to put third-party chess prose into the packet, and the word guard is packet-relative

`voiceCheck` compares the model's output against `view.items.flatMap(item => item.sentences)`
(`voice.ts:112`) and `absentWords` flags a word **only when it is absent from that joined string**
(`voice.ts:107`). `[V]` Every arm — squares, UCI, SAN, `CHESS_LEXICON`, `BANNED_JUDGEMENTS` (32
members, `:93`), `PRESCRIPTIVE_VERBS` — is scoped to the whole packet. A quoted theory passage is
third-party prose written by chess authors for chess readers, so admitting one **hands the renderer
that passage's squares, its moves, and its judgement words for use anywhere in the output**. Nothing
before this RFC put such prose into a packet: the shipped packet carries structures, observations,
markers, an endgame reading, shape refs, authored clauses and recorded engine/tablebase readings
(`voice.ts:52-64`), all of which are Tabiya-composed.

**Two owner rulings land on exactly this and they are checked rather than assumed.** [[D1409]]:
*"a judgement word is permitted **only inside the exact rendered sentence that grounds it,
byte-matched**, and is banned everywhere else in the output — including elsewhere in the same
packet."* [[D1419]] extends it: *"the span rule governs **judgement words, squares, moves, chess
nouns and prescriptive verbs alike**"*, because *"leaving any arm packet-relative rebuilds the
condition that made [[D1406]] possible."* Together they close the arm that matters most here: with
the span rule on all four arms, a quotation licenses its own words **inside its own byte-matched
sentence and nowhere else**, so the leakage this section would otherwise create does not exist.
**That is the case closed, and it was closed by the owner rather than by this document.**

**Three things remain, stated because they are the residue rather than the whole problem:**

1. **`plan` is in no list at all, and neither are `initiative`, `compensation` or `pressure`.**
   [[D1419]] names this explicitly as *"not fixed and not ruled"*, and it reproduces at HEAD: none of
   the four appears in `CHESS_LEXICON`, `BANNED_JUDGEMENTS` or `PRESCRIPTIVE_VERBS`, and the only
   occurrence of the string `plan` anywhere in `voice.ts` is the `plans: readonly ShapeEntryRef[]`
   packet field at `:59`. `[V]` No scoping rule reaches a word no list contains, and **theory prose is the
   single largest new source of exactly those four words** in the product. This RFC does not lift
   them and does not add them (a `BANNED_JUDGEMENTS` widening is a rendering-contract change with its
   own consumers); it records that admitting theory prose materially raises the exposure of an
   already-open ruling, and routes it as Discharge D12.
2. **`voiceCheck` has no attribution arm.** It checks tokens and words and never checks that a
   rendered quotation names its source, so under the span rule an LLM may emit the quoted sentence
   byte-for-byte with no *"Wikibooks says"* and pass every arm. §1's origin-A sentence form
   (*"⟨source⟩, at revision ⟨r⟩ … says: ⟨exact text⟩"*) was therefore prose, not a mechanism. **§8
   rule 7 makes it a data shape instead**: the packet item is `attributedQuotation`, one string
   containing attribution and quote together, so byte-matching the quote necessarily carries the
   attribution and there is no representation of a bare quotation for a renderer to reach.
   Criterion 24.
3. **The caption escalation stands open**, by [[D1419]]'s own words — *"a sentence that merely names
   the closed class frees every word in it — was offered as a third option and not taken"*. A quoted
   passage is a long sentence naming many things, so the span rule narrows the escalation to that
   sentence but does not remove it. Not this RFC's to rule; named so it is not discovered later.

**And the repair is owed, not shipped.** `voice.ts:107` is packet-relative at HEAD; [[D1409]]'s row
reads *"repair owed on `packages/runtime/src/voice.ts`"*. No theory passage may enter a packet before
it lands — criterion 24 asserts the span-scoped guard is in place, and is **red at HEAD**.

### §12 — Refused by name, with the measurement

| Refused | Why, measured |
|---|---|
| Making whole Skipper a Tabiya dependency | would not start without Frameworks Postgres, service identity and Gateway MCP; the bounded run needed Commodore and Periscope Query (`results.md:118-122`) |
| Extracting the pgvector / embedding / reranker / contextualizer path for 1.0 | three predeclared gates, three failures: 94.7% vs 97.7% recall@5, 8.3% vs ≤2% ineligible top-1, 66.7% vs ≥90% abstention ([[D564]], `results.md:55-69`) |
| Contextualized embeddings as an "index-only aid" | +1.5 recall@1, **0** recall@5, one hard negative of twelve, plus provider latency (`results.md:71-74`) — and it changes which passage is retrieved |
| A crawler, sitemap discovery, or SPA/headless rendering | the register names revisions; discovery can ingest an unreviewed source (§3.1) |
| Generic ~500-token chunking | 55 logical passages → 106 chunks (`results.md:28-29`); a token-cut quotation cannot be attributed to the section it came from |
| A chat agent, an answer endpoint, or any generated-prose response | §8 rule 4 |
| A "related passages" fallback on empty | §8 rule 3; four of twelve unrelated questions were answered when lexical score was allowed to revive candidates |
| Porting the whole crawler/extractor/retrieval stack to TypeScript up front | the dossier's own options table calls this *"do not start here"*; §3.1 adds five controls to a 49-line client instead |
| A runtime PostgreSQL, vector service or model-provider requirement | `deploy/compose.release.template.yaml` stays one Node server, one SQLite volume, optional Maia |

Two of these may return, and the door is described so it is not a secret: **optional semantic
ranking** may be reconsidered only against a materially larger cited corpus, a **fresh** gold set,
and an explicit abstention model evaluated separately — `results.md:136-137`'s own condition. It
would be a new RFC and a new register claim, not a flag on this one.

### §13 — The boundary with F7, stated precisely

| This RFC (F4) | `theory-drill-current-joins` / F7 |
|---|---|
| The passage store, its provenance and rights | The learner-facing theory panel and library catalogue |
| Typed applicability keys and their ground projections | Which pack a shape or theory identity launches |
| `search(eligibility, text?) → passages \| empty` | The launch that preserves source run/node ([[D692]]/[[D693]]: the pack id dropped by `navigate("/play")`) |
| The citation record's predicates | The completed-attempt link back to the source |
| The honest-empty result | The four first-class outcomes: theory-only, drill-only, both, neither |

F4 hands F7 a function and a store. It does not open a screen, and it adds no route.

The line is drawn identically from the other side: `rfc/theory-drill-current-joins.md` §6 clause 1
hands this lane out by name — *"An allow-listed, digest-addressed bundle of third-party theory text,
its offline provenance compiler, and FTS discovery inside an eligible set is R4's subject … and is
gated on the O5 ruling, which is the OWNER's and is unmade"* — and states that its own four join
kinds need none of it. Neither document waits on the other: F7 lands on shapes, principles, anchored
claims and the pinned CC0 catalogue; F4 lands on external prose. They meet only at §8's function
signature.

### §14 — The full ask, its cost, and what blocks it

The full ask is [[D581]] and O5's recommended ruling in one document: allow-list, offline provenance
compiler, immutable local exact/FTS bundle, applicability sets, deterministic-with-optional-LLM
rendering, honest empty. **All six are specified above.** Nothing has been trimmed for size, and no
part of the ask is deferred to a successor document with no name.

Cost, honestly: five HTTP controls on a 49-line client (§3.1); one register format and its
validator; one extractor per source shape (three at first — MediaWiki, delimited records, plain
text); one enricher with eleven key kinds, most of which call projections that already exist; one
SQLite writer with FTS5; one search function; one union widening and one function split in
`check.ts` (§6.2); two predicates in `pack-population-provenance` (§9); one additive schema lane
(§10); and the committed evaluation suite (§7.5). No new service, no new container, no provider
credential.

**Two things genuinely block acceptance, both named, neither of them scope:**

1. **Owner decision O5, unruled.** `planning/platform-alignment/decision-queue.md:42` records it
   **READY FOR OWNER — R4/R8/R18 complete**, with a drafted recommendation this RFC follows clause
   for clause. [[D581]]'s ledger note says *"design/owner ruling required before RFC"*, and
   [[D1330]] commissioned the drafting anyway as live-debt rank 8. Both are true: the document
   exists so the ruling has something concrete to rule on, and it does not become `accepted` until
   O5 does. **Owner: the owner.** This is the one blocker no other party can lift.
2. **F3 is a draft, not an accepted RFC.** `planning/platform-alignment/rfc-graph.md:71` puts F4
   behind *"F1/F3 accepted"*, and §7.3's runtime compatibility declaration should be expressed in
   F3's capability grammar rather than as this RFC's private digest field — the same seam
   `claim-semantic-anchors` §7 is waiting on. **Owner: `pack-capability-contract`.** Discharge D1.

What does **not** block it, said explicitly so it is not re-litigated: document size, the number of
sections, the absence of a learner surface, and the fact that the first bundle will be small. A
17-row register and a few hundred passages is a small *corpus*, not a small *contract*, and the
contract is what an RFC is for.

### §15 — The code sites this draft expects to own, and the one it cites ([[D1381]])

[[D1381]], landed while this draft was being written, requires a draft to name the code sites and
repairs it expects to own so the coordinator can check them against every other in-flight draft,
and requires the shared ones to be pinned in `rfc/README.md` the way schema lanes are. The list:

| Site | What this RFC does to it | Contested? |
|---|---|---|
| a new builder package (register, fetch, extract, enrich, validate, index, export, search) | creates | no — nothing else writes it |
| `apps/server/src/sourcing/http.ts` | adds five transport controls (§3.1), changes no existing behaviour | no |
| `apps/server/src/sourcing/types.ts` — `SourceLicence.spdx` | widens the closed union (§6.2) | no |
| `apps/server/src/sourcing/check.ts` — `licenceObligations` **only** | splits into a pack-prose arm and an attribution arm (§6.2) | **yes — `pack-population-provenance` owns this file's `evidenceSemantics`, `evidenceSupports`, `PROSE_POINTERS` and its five predicates. Disjoint functions; pinned below** |
| `schemas/principle_entry.schema.json`, `packages/schema/src/index.ts` (`PRINCIPLE_ENTRY_SCHEMA_VERSION`), `packages/schema/src/principle-entry/index.ts`, `apps/server/src/principle-validation.ts` | lane 0.2 and its biconditional (§10) | no — the principle-entry register carries zero other live claims |
| `pack-population-provenance` §3's `citable_text` predicate family | adds P6 and P7 (§9) | **yes, by amendment, with that RFC's agreement recorded as Discharge D2** |

**And one site this RFC does not own but depends on, which neither owning document names.**
`licenceObligations` decides whether a CC-BY-SA source *contributes prose* — and therefore whether
`ATTRIBUTION_MISSING` fires — partly from `boundAssertions`, which it computes by reading
`binding.spans` (`check.ts:346`). `rfc/claim-semantic-anchors.md` §2 replaces that shape with
`contract` + `clauses`, and §5 deletes the old paths from production admission. It names
`claim-binding.ts`, `evidence-catalog.ts` and `pack-validation.ts`; it mentions `licenceObligations`,
`boundAssertions` and `ledger-validation` **zero times**. Two readers break:

- `apps/server/src/sourcing/ledger-validation.ts:346` requires
  `exactKeys(raw, ["claimId", "pointer", "textSha256", "spans"])`, so a V2 binding is rejected as
  `EVIDENCE_INVALID` **before** any of this reaches the licence layer;
- `check.ts:346` then reads `binding.spans.flatMap(…)` on a shape that no longer has `spans`.

The consequence is specific to this RFC's subject: **the attribution obligation for every
machine-bound claim is downstream of the claim-binding shape.** The site belongs to
`claim-semantic-anchors` — it is that RFC's shape change — and this RFC cites it, does not edit it,
and records it as Discharge D11 so the join is not discovered at implementation time. Criterion 21
asserts it from this side.

## Deviations from design

- **`design/05` §3's ladder places rung 5 (authored claims) above rung 4 (corpus frequency) by
  source risk.** A *cited* source is a new point on that ladder: it carries an author's judgement
  (rung 5's risk) plus a verifiable provenance the ladder's rung 5 explicitly lacks (*"with no
  review workflow … provenance is the only safeguard"*). This RFC does **not** renumber the ladder
  and proposes no design-tier edit (law 5). If the owner reads cited theory as a distinct rung, that
  is a design reconciliation this RFC would carry a BACKLOG row into rather than write itself.
- **`design/04` §8's production model** assumes pack prose is authored and cited by hand. §9's
  builder-proposes/author-applies flow is consistent with it and mechanizes only the proposal. No
  edit proposed.
- **`design/research/theory-knowledge-pipeline.md`'s four corrections** (Motivation) are corrections
  to a living-tier dossier; their erratum is Discharge D7.

## Acceptance criteria

> **Cross-review 2026-08-23 — [[D1410]] repaired 2026-08-24; all four law-8 points now have a mechanism.** (1) `TheoryQuery` carries `position.fen` and §8 rule 0 **recomputes** every eligibility key over it, refusing `key_ungrounded` rather than filtering on a caller assertion. (2) §8 rule 0b adds a specificity floor: `phase` and `side` may narrow an eligible set and may never constitute one, in the type and again at runtime. (3) §5 rule 6 makes the derived/authored key split a partition in the data, carried to §8's `admittedBy.origin` and to the sentence form a consumer may render — origin B does collapse into origin C for prose, and the document now says so and labels it. (4) [[D1409]] + [[D1419]] **do** close the leakage arm (the span rule on all four arms); §11.1 states the three-part residue — `plan`/`initiative`/`compensation`/`pressure` are in no list at all, `voiceCheck` has no attribution arm (repaired by §8 rule 7's `attributedQuotation`), and the caption escalation stands open by [[D1419]]'s own words. Criteria 22–27 are new; [[D1395]]'s five HTTP controls are criterion 25 and the eight orphaned refusal codes are criterion 26.

> **Findings landed 2026-08-23.** [[D1393]] — the attribution gate opens silently when `claim-semantic-anchors` lands. [[D1394]] — a CC0 source cannot be attributed. [[D1395]] — the source fetcher has no SSRF guard, redirect limit or byte ceiling. [[D1396]] — 0 of 893 records support a load-bearing pointer.

1. **The corpus baseline is a command, and every row of it declares its own scope** ([[D1240]]).
   `make theory-source-census` prints, from the committed tree: ledger count, record count and
   per-kind split; the number of records supporting a `PROSE_POINTERS` pointer; the number of
   `provenance.sources` strings and of `provenance.attribution` entries; and the principle registry's
   size and `standsOn` distribution. **Each row prints its scope beside its number** — the glob it
   walked, the key path it read, and the predicate it counted — and the criterion asserts the census
   output is **set-equal by document id** to the tree's content within each declared scope.
   *Concrete RED: a census row that prints an integer with no scope glob fails, which is what
   produced the defect below.*

   **Why the scope declaration is the criterion rather than a nicety.** The Motivation table's
   integers were re-derived at HEAD and **they do not share a scope, and three of them reproduce over
   no scope at all**: `[V]`
   - **893 records / 68 ledgers** and the per-kind split `engine_eval` 415, `tablebase_result` 341,
     `position_legality` 59, `opening_identity` 52, `puzzle_provenance` 26 reproduce **exactly** over
     all of `content/**/*.json` — 764 records in `content/drafts`, 129 in `content/candidates`.
   - **31 attribution entries across 22 documents** reproduces **exactly** over `content/drafts`
     **alone** — over all of `content/` it is 46 across 37.
   - **13 / 13** principle entries reproduce over `content/principles`.
   - **378 `provenance.sources` strings across 65 documents, 49 with a URL** reproduces over
     **neither**: all of `content/` gives 513 / 127 / 75; `content/drafts` gives 369 / 53 / 40;
     drafts excluding `.browser.json` fixtures gives 366 / 50 / 40; drafts + principles gives
     382 / 66 / 40; de-duplicating the strings gives 428 unique / 50 unique URLs. No scope I could
     construct yields 378 / 65 / 49.
   - **54 packs declaring `provenance.licence: "CC-BY-SA-4.0"`** likewise reproduces over neither:
     all of `content/` gives 119, `content/drafts` gives 45, drafts + principles 58, drafts + shapes
     70.

   Those five integers are therefore **struck as tripwires** and the Motivation table marks them
   *"as printed by the census"*. The three that do reproduce keep their tripwire status **with their
   scope named**: `893 / 68` and the per-kind split at `content/**`, `31 / 22` at `content/drafts/**`,
   `13 / 13` at `content/principles/**`. The load-bearing zero — **0 records supporting a
   `PROSE_POINTERS` pointer** — reproduces over every scope, which is the one number the argument
   actually rests on. *Negative: a hand-maintained count in a test fixture fails, because the census
   must read the corpus.*
2. **The register refuses what the dossier refuses.** Five committed negative fixtures — a TWIC
   origin, a PGN Mentor origin, the ecochessopeningcodes compilation, a bulk Lichess study, and the
   `calebjcourtney` dump — each fail `THEORY_SOURCE_REFUSED`. *Positive: the 17 R4 register rows
   (`knowledge-retrieval/source-register.csv`) all pass, which also proves the format can express a
   real allow-list.*
3. **A mutable revision URL cannot enter the register.** A row whose `revisionUrl` carries no
   immutable token fails `THEORY_SOURCE_REVISION_UNPINNED`. *Positive: the eight Wikibooks `oldid=`
   URLs and the five `chess-openings` commit-path URLs from R4 pass.*
4. **A digest change at a pinned revision fails the build closed.** Re-running the builder against a
   source whose bytes differ at the same `revisionUrl` raises `THEORY_SOURCE_DIGEST_DRIFT`, writes
   no bundle, and does not update the register. *Negative: a builder that re-extracts and continues
   fails this criterion.*
5. **Both R4 invalidation controls pass, including the one Skipper failed.** One edited source
   atomically replaces exactly its own passages and no others (Skipper passed this —
   `results.md:114`). One changed **extractor version** produces a different `bundleId` and is
   refused by a runtime pinned to the old one (Skipper's analogue failed — a same-dimension model
   change was invisible, `results.md:115`).
6. **Spans are code points and reproduce after a clean rebuild.** For every passage,
   `text` equals the `[spanStart, spanEnd)` slice of the pinned bytes, `textSha256` matches, and
   `passageId` is stable across a rebuild from scratch. One fixture source contains an astral-plane
   character before a quoted span; a code-unit implementation returns a shifted slice and fails.
7. **The applicability key union is set-equal to §5's kinds, no member matches a substring, and a
   kind whose ground projection is not compiled is refused rather than dead.** Three arms.
   **(a)** The compiled `ApplicabilityKey` union is set-equal by `kind` to the §5 table (11 at
   drafting, as a tripwire). **(b)** A test asserts no member's evaluator calls `includes`,
   `indexOf`, `startsWith` or a `RegExp` over passage text or key values. **(c)** For every kind, the
   named ground projection is looked up in `compileEvidenceManifest(EVIDENCE_CONTRACT_DECLARATIONS)`;
   a kind whose ground is absent must return `{ kind: "refused", reason: "key_ground_missing" }` at
   query time and must be rejected at build time with `THEORY_KEY_GROUND_MISSING`. *Concrete RED at
   HEAD, and this is the point:* `theory.opening.current_endpoint@1` and
   `theory.opening.catalogue_membership@1` are **not in the compiled catalogue** — they exist only in
   `rfc/runtime-opening-identity.md` — so arm (c) requires `opening.endpoint` and `opening.path` to
   refuse today and to start working, with no code change to this pipeline, when that RFC lands.
   *Negative: adding a `{ kind: "tag"; value: string }` member fails set-equality; a substring
   evaluator fails arm (b); a build that emits an `opening.endpoint` key against today's catalogue
   fails arm (c).*
8. **The [[D579]] fixture is permanent and named.** The four R4 rook-and-pawn queries return the
   rook-endings passage and **do not** return the generic pawn-endings passage; the fixture file is
   named for D579. *Negative: an enricher that emits a `phase`-only key for both passages fails,
   which is the original defect.*
9. **A passage with zero keys is unreachable.** It exists in the bundle with its provenance and is
   returned by no query. *Negative: an implementation treating "no keys" as "matches everything"
   fails.*
10. **Ineligible top-1 is exactly zero on the committed suite** — not 2%, not 8.3%. Every returned
    passage's id is a member of the materialized eligible set for that query, asserted over all
    committed queries. *Negative: an implementation that computes FTS first and intersects
    afterwards can return a passage when the intersection is empty and fails this arm.*
    **What this criterion cannot catch, and why criterion 22 exists.** Membership in the eligible set
    is trivially satisfied by making the eligible set large: under the drafted type,
    `eligibility: [{ kind: "phase", value: "middlegame" }]` materializes every middlegame passage and
    every returned result is a member, so this criterion stays green while FTS rank alone selects the
    answer. This criterion checks that eligibility **precedes** selection; criterion 22 checks that
    eligibility is **a function of the position**, which is the half that carries the law-8 argument.
11. **The twelve hard negatives return `kind: "empty"`.** The R4 negatives — including the 4K
    livestream, football offside, Kubernetes and saxophone queries (`results.md:99-103`) — produce
    no passage at any rank. *Negative: a fallback that drops the most specific key and retries
    fails.*
12. **The bundle has no vector surface at all.** The schema has no embedding column and no vector
    table; the builder package has no embedding, reranker or vector dependency in its manifest.
    Asserted as an absence over the schema and the dependency list, so it cannot be re-enabled by
    configuration.
13. **No model provider is reachable from the builder.** The builder package imports no LLM client,
    and a test asserts zero occurrences of the provider-client modules in its dependency closure.
    *Negative: adding a "summarize this passage" step fails the import assertion before it fails
    review.*
14. **`strength` is inert.** A test asserts `strength` appears in no ordering comparator and in no
    rendered string. *Negative: sorting results by `strength` fails — that is the research dossier
    becoming chess authority, which `results.md:26` refused at ingest.*
15. **The licence widening is real and the split is failable.** A register row licensed `CC-BY-4.0`
    is admitted; a `CC0-1.0` attribution entry no longer raises `LICENCE_MIXED`; a pack whose own
    `provenance.licence` is not `CC-BY-SA-4.0` **still** raises it. *Negative: a single widened
    constant shared by both arms passes arm one and silently loosens the pack-prose rule — asserted
    as a red fixture.*
16. **The two citation predicates fire on fixtures, since the corpus cannot exercise them.** A
    `citable_text` record whose `quotedText` occurs twice in its source fails
    `CITATION_SPAN_AMBIGUOUS`; one occurring once passes. A record whose manifest entry names a
    mutable URL fails `CITATION_REVISION_UNPINNED`; one naming an `oldid=` revision passes. Both
    positive and negative fixtures are required, per `pack-population-provenance` §5's rule and
    [[D522]]'s lesson.
17. **The principle lane is additive and biconditional.** `PRINCIPLE_ENTRY_SCHEMA_VERSION` is
    `"0.2"`, `schemas/principle_entry.schema.json`'s `$id` is `…principle-entry:0.2`, **all 13
    committed entries validate unchanged and their digests are byte-identical**, and
    `validatePrincipleEntry` rejects both `standsOn: "cited_source"` with no structured citation
    **and** a structured citation with `standsOn: "authors_practice"`. *Negative: implementing only
    the forward direction leaves `cited_source` an inert enum member — [[D428]]'s defect.*
18. **All four instruments stay green, and C7 is asserted, not assumed.**
    `make register-check`, `make status-parity`, `make work-index`, `make intent-parity`,
    `make verify` and `make sourcing-check` pass after implementation. C7's schema-set-from-disk
    check is named explicitly, so a `schemas/theory_*.schema.json` landing without a register fails
    the build rather than repeating the `campaign-schema` defect.
19. **The runtime survives an absent and an incompatible bundle.** With no bundle file, and with a
    bundle whose evidence-manifest digest differs from the running manifest's, theory returns
    `kind: "empty"` with the correct reason and every other surface is unaffected. *Negative: a
    startup crash on a missing bundle fails — theory is an enrichment, not a prerequisite.*
20. **The deployment surface does not grow.** `deploy/compose.release.template.yaml` gains no
    service and no required environment variable; the release image gains one read-only file.
    *Negative: a `knowledge-builder` service in the release template fails; an optional builder
    profile that is not in the release template is fine.*

21. **The licence layer survives the claim-binding shape change** (§15). A fixture ledger carrying a
    V2 claim binding reaches `licenceObligations` and still raises `ATTRIBUTION_MISSING` for a
    share-alike source contributing prose. *Negative at HEAD, and this is the point:* the same
    fixture today fails at `ledger-validation.ts:346`'s `exactKeys` before the licence layer runs,
    and `check.ts:346`'s `binding.spans.flatMap` has no `spans` to read — so the criterion is
    honestly red until `claim-semantic-anchors` lands its shape change **including this reader**.

22. **Eligibility is a function of the position, and no caller-supplied field widens it** (§8 rules
    0, 0b, 8 — the mechanical form of origin B). Four arms, each with a named RED state.
    **(a)** For a fixed `position.fen`, a fixture enumerates every admissible query and asserts the
    union of reachable passages equals the set computed by evaluating all eleven ground projections
    over that FEN. *RED: a `search` that reads `eligibility` without recomputing.*
    **(b)** A query supplying a key the position does not satisfy — e.g. `phase: "endgame"` on a FEN
    whose `rules.phase.reading` returns `middlegame` — returns
    `{ kind: "refused", reason: "key_ungrounded" }`. *RED: an implementation that drops the key and
    proceeds, or that uses it as a filter — both return passages and fail.*
    **(c)** A key whose ground projection **abstains** on that FEN returns the same refusal, not an
    empty filter. *RED: treating abstention as "no match", which silently narrows instead of
    refusing (§5 rule 3's discipline at query time).*
    **(d)** `eligibility: [{ kind: "phase", … }]` and `eligibility: [{ kind: "side", … }]` return
    `{ kind: "refused", reason: "eligibility_underspecified" }` from the runtime check, and do not
    typecheck. *RED, and this is the concrete tree state the drafted type permitted: a phase-only
    query that returns every middlegame passage ranked by FTS, with criteria 10 and 11 both green.*
23. **The derived/authored key partition survives into the rendered sentence** (§5 rule 6, §8 rule
    7). A passage carrying only `authoredKeys` is returned with
    `admittedBy.origin: "authored_applicability"` and a non-empty `reviewer`/`reviewedAt`; a
    renderer fixture asserts the origin-C sentence form is used and the origin-B form
    (*"this position satisfies …"*) is not. *RED: an implementation that merges `derivedKeys` and
    `authoredKeys` into one list — the origin becomes unrecoverable and the fixture fails.*
    *Also RED:* a passage carrying an authored key with no reviewer fails `THEORY_KEY_UNATTRIBUTED`
    at build (§6.3), which is the one thing that check does assert.
24. **A quotation cannot leave the store without its attribution, and no theory passage enters a
    packet before the span-scoped voice guard lands** (§11.1). Two arms.
    **(a)** `TheoryPassageRef` has no field containing the quoted span alone; `attributedQuotation`
    is one string and a fixture asserts every rendered theory item's text contains the source
    attribution as a prefix. *RED: adding a bare `quotedText` field to the ref — the fixture greps
    the type and fails.*
    **(b)** A fixture asserts `voiceCheck`'s four arms are **span-scoped** ([[D1409]], [[D1419]]) —
    a judgement word, square, move, chess noun or prescriptive verb appearing in one packet item may
    not be emitted inside a different sentence of the output. ***Red at HEAD, deliberately:***
    `voice.ts:107`'s `absentWords` is packet-relative today and [[D1409]]'s row records the repair as
    *"owed on `packages/runtime/src/voice.ts`"*. This criterion does not implement that repair; it
    refuses to admit theory prose until someone does.
25. **The five HTTP controls exist and each fails on a fixture** ([[D1395]], §3.1 — the finding this
    document landed and then did not close). One fixture per control, all against the builder's
    client: an SSRF attempt (`http://127.0.0.1:…`, `http://169.254.169.254/…`, and a DNS name
    resolving to a private address) is refused **and refused again after a redirect**; a redirect
    chain exceeding the limit is refused; a redirect to a different registrable domain is refused; a
    body exceeding the byte ceiling aborts mid-stream rather than buffering; a `Content-Type` outside
    the allow-list is refused. *RED at HEAD: `apps/server/src/sourcing/http.ts` is 49 lines with none
    of the five, so all five fixtures fail against the shipped client.*
26. **Every refusal code this RFC mints has a fixture, asserted as a set rather than by hand.** A
    test enumerates the builder's exported error-code union and asserts it is **set-equal** to the
    set of codes exercised by the committed fixtures. At drafting, eight codes had no criterion at
    all — `THEORY_SOURCE_NOT_REDISTRIBUTABLE`, `THEORY_BUILD_INCOMPLETE`, `THEORY_SPAN_INVALID`,
    `THEORY_PASSAGE_DIGEST_MISMATCH`, `THEORY_ATTRIBUTION_MISSING`, `THEORY_KEY_GROUND_MISSING`,
    `THEORY_KEY_UNATTRIBUTED`, `THEORY_PASSAGE_ID_COLLISION` — so each now needs one:
    a quotation-only source is refused at bundle entry; an unclassified passage aborts the export; an
    out-of-range and a surrogate-splitting span are refused; a `text` whose digest disagrees with its
    slice is refused; a share-alike source with no `attributionText` is refused; a key naming an
    uncompiled ground projection is refused (criterion 7c); an authored key with no reviewer is
    refused; two passages colliding on `passageId` with different bytes are refused.
    *RED: minting a ninth code without a fixture fails set-equality — which is the exact defect this
    criterion exists to prevent, since it is the one the cross-review found.*
27. **The three new query refusals are typed, not thrown.** `TheoryResult`'s `refused` arm carries
    the offending key, and a fixture asserts `search` never throws for a well-formed but inadmissible
    query. *RED: an implementation that throws — a caller cannot distinguish "your key is ungrounded"
    from "the bundle is broken", and the honest-empty discipline (criterion 19) collapses.*

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | Express §7.3's bundle/runtime compatibility in F3's accepted capability grammar instead of a bespoke digest field | `pack-capability-contract` | that RFC's capability table | |
| D2 | The `pack-population-provenance` §3 amendment (P6 `CITATION_SPAN_AMBIGUOUS`, P7 `CITATION_REVISION_UNPINNED`) landing in that RFC's text | claude | `rfc/pack-population-provenance.md` changelog | |
| D3 | The `SourceLicence`/`licenceObligations` widening and split (§6.2), including the red fixture that a shared constant fails | codex | this RFC's implementing commit | |
| D4 | The builder, register, extractors, enricher, bundle writer and search function (§2–§8) | codex | this RFC's implementing commit | |
| D5 | The principle-entry 0.2 lane and its biconditional validator (§10) | codex | this RFC's implementing commit | |
| D6 | The committed production gold set and evaluation suite (§7.5), re-pointed from R4's research thresholds to criterion 10's product gate | claude | `planning/theory-knowledge-pipeline/` results file | |
| D7 | The four errata on `design/research/theory-knowledge-pipeline.md` (the 13 principle entries are uncited consumers, not a corpus; the 49-line fetch client; the gitignored source store; the two-licence ceiling) | claude | that dossier's erratum lines | |
| D8 | Presenting `cited_source` on the learner-facing principle surface, where `standsOn` is currently typed as bare `string` (`apps/web/src/lib/api.ts:218`) | `review-map` | that RFC's principle/claim rendering section | |
| D9 | The theory-source half of [[D1367]]'s *"shared source contract"* for the hint ladder — a theory rung must not go dark because Stockfish is absent. **The ladder, its per-source ceilings and its theory-only fixture belong to `hint-distance`; this RFC owns only the source contract underneath them** | `hint-distance` | that RFC's per-source adapter section | |
| D10 | Decide whether an optional semantic ranking experiment is ever re-opened, against a larger cited corpus and a fresh gold set (`results.md:136-137`) | OWNER | a new RFC and a new register claim, never a flag on this one | |
| D11 | Carry the V1→V2 claim-binding shape change through the **licence** readers it does not currently name — `ledger-validation.ts:346`'s `exactKeys` and `check.ts:346`'s `boundAssertions` — so the CC-BY-SA attribution obligation keeps firing for machine-bound claims (§15) | `claim-semantic-anchors` | that RFC's §7 migration section | |
| D12 | `plan`, `initiative`, `compensation` and `pressure` are in **no** `voice.ts` guard list, so no scoping rule reaches them ([[D1419]], explicitly unruled). Admitting third-party theory prose is the single largest new source of those four words; decide whether the rendering contract's word lists widen before theory prose reaches a packet (§11.1) | OWNER, then `review-map` | a `voice.ts` widening or a recorded refusal | |
| D13 | [[D1419]]'s **caption escalation** — a sentence that merely names the closed class frees every word in it — stands open by the ruling's own words. A quoted passage is exactly such a sentence, so the span rule narrows it without removing it (§11.1) | OWNER | the follow-up RFC [[D1419]] routes to `rfc/archive/adaptive-guidance.md` | |

## Open questions

1. **Who reviews a source, and is `review.state` a person or a role?** §2 rule 3 removes
   `unreviewed` so absence is the only "not yet", but it types `review.by` as a string. For a
   single-owner repository that is the owner's name; for a community-content future it needs an
   identity. Specified as a string, recorded because the answer changes the register's shape rather
   than its semantics. Not acceptance-blocking.
2. **Does an authored applicability key (§5 rule 4) belong on the register row or on the passage?**
   Specified as on the passage, because a source spans phases and openings and a row-level key would
   over-admit — which is [[D579]]'s failure at a different granularity. The alternative (row-level
   with per-passage overrides) is cheaper to author and easier to get wrong. Recommended as
   specified; recorded because it is the one enrichment decision no measurement settles.
3. **Should the bundle ship in the release image or be downloaded on first run?** Specified as
   shipped, because a download is a network dependency at start and §7.3's honest-empty path then
   becomes the common case rather than the exceptional one. The cost is image size, which is a real
   number nobody has measured yet — [[D581]]'s bundle-size metric was in R4's plan and the
   production figure is D6's to produce.

## Ledger rows

Proposed — ids assigned at landing; head was **D1373** at drafting. (The wave brief said D1354;
`80c05ba` landed D1357–D1373 while this fork was reading, so the head is stated as measured.)

- 🐞 **Not one byte of prose in the corpus is grounded in a checkable source, and the machinery to
  check it already ships.** **0 of 893** committed evidence records support any `PROSE_POINTERS`
  pointer (`check.ts:36-42`), so `licenceObligations`' `contributesProse` branch (`check.ts:347`)
  has never fired through its prose arm. Meanwhile **378** free-text `provenance.sources` strings
  (49 with a URL) and **31** typed attribution entries sit across **65** pack documents, joined to
  nothing. `citable_text` is the door `pack-population-provenance` built; this RFC is what walks
  through it. Fixed by §9 plus the builder; the *measurement* is the row.
- 🐞 **A CC0 source cannot be attributed, and a third licence cannot be named.**
  `licenceObligations` raises `LICENCE_MIXED` for any attribution entry whose `licence` is not
  exactly `"CC-BY-SA-4.0"` (`check.ts:353`) and `SourceLicence.spdx` is a closed two-member
  union (`sourcing/types.ts:1-13`). So courtesy attribution of the CC0 Lichess data fails the check,
  and the allow-list the owner asked for is capped at two SPDX identifiers before it starts. Repair
  in §6.2; the row records that one constant is doing two different jobs.
- 🐞 **The shipped sourcing fetch client has no SSRF guard, redirect limit, size ceiling or
  content-type check.** `apps/server/src/sourcing/http.ts` is 49 lines: a serialized queue, a user
  agent, a 429/5xx retry ladder. Today that is bounded by a two-member hard-coded source list
  (`source-fetch.ts:47-48`); the moment a reviewed register names the origins, it is a request
  primitive pointed at whatever the register says. §3.1 specifies the five controls. The row is
  worth its own id because the gap exists **now**, independently of this RFC landing.
- 🐞 **The principle registry is 13 for 13 uncited, and the schema gives it no way to stop being.**
  Every entry stands on `authors_practice` and every entry's `provenance.sources` is the same
  sentence declaring that no source establishes the judgement. `sources` is `array of
  nonEmptyString`, so a citation cannot be expressed even when one exists. Lane 0.2 (§10) is the
  repair; the row is the measurement and survives whether or not the lane lands here.
- 💡 **`limitations` on an evidence projection is a declared refusal that nothing enforces, and it
  is load-bearing in at least three active RFCs.** `evidence-contract.ts:452` checks only
  `nonEmptyStrings(projection.limitations)` inside the `EVIDENCE_PROJECTION_INCOMPLETE` conjunction.
  [[D1343]] records the class and is open with no owner. This RFC routes around it (§11 puts every
  refusal on a mechanism that fails), which is the cheap per-document fix; the class fix — making a
  limitation a typed, checkable predicate rather than prose — still has no home and is worth
  costing before a fourth document inherits the same false comfort.
- 🐞 **The CC-BY-SA attribution obligation is downstream of the claim-binding shape, and the RFC
  that replaces that shape names neither reader.** `licenceObligations` decides *contributes prose*
  partly from `boundAssertions`, computed by reading `binding.spans` (`check.ts:346`); and
  `ledger-validation.ts:346` pins the binding to `exactKeys(["claimId","pointer","textSha256","spans"])`.
  `rfc/claim-semantic-anchors.md` replaces `spans` with `clauses` and mentions `licenceObligations`,
  `boundAssertions` and `ledger-validation` **zero times** — so at Stage B a V2 binding is rejected
  as `EVIDENCE_INVALID` before the licence layer runs, and if that validator is widened without the
  licence reader, `ATTRIBUTION_MISSING` stops firing for every machine-bound claim instead of
  throwing. Owned by `claim-semantic-anchors` (Discharge D11); found from the licence side, which is
  the only side that was looking.
- 📊 **The production ineligible-top-1 gate is stricter than the research gate, and nothing has
  measured it.** R4's 2% ceiling was a research threshold over a semantic ranker
  (`knowledge-retrieval/plan.md:60` says so in terms); with eligibility computed by typed predicates
  an ineligible result is a contract violation, so criterion 10 sets zero. Whether a real production
  corpus can hold zero while returning anything useful is D6's measurement, not this RFC's claim.

## Changelog

- 2026-08-23: created. Drafted from the landed R4 dossier and its six-arm experiment on the
  [[D557]] owner ask, routed as [[D1330]] live-debt rank 8. Four corrections re-derived at HEAD
  rather than carried: the thirteen principle entries are **13/13 uncited consumers**, not a
  candidate corpus (§10 claims principle-entry lane 0.2 as a result); the shipped fetch client is
  **49 lines with none** of the crawler controls the dossier's reuse table credits (§3.1);
  `content/sources/` is **gitignored**, so span reproducibility needed immutable revisions plus a
  fail-closed digest re-check rather than committed bytes (§3.3); and the licence layer is capped at
  **two SPDX identifiers** with `LICENCE_MIXED` rejecting CC0 attribution, which makes "allow-listed
  sources" currently inexpressible (§6.2). The law-8 line is drawn once in §1 — three origins,
  retrieval rank refused as a fourth, an LLM refused as a fifth — and §11 maps every refusal to the
  mechanism that fails, explicitly avoiding `limitations`, which is checked only for non-emptiness
  ([[D1343]]).
- 2026-08-23, same day, after [[D1381]] and [[D1374]] landed under this fork: §15 added — the code
  sites this draft owns, the two it shares (`licenceObligations` beside
  `pack-population-provenance`'s predicates; the `citable_text` family by amendment), both pinned in
  `rfc/README.md`. Writing that list surfaced a defect neither owning document names: the CC-BY-SA
  attribution obligation reads `binding.spans` (`check.ts:346`) and `ledger-validation.ts:346` pins
  the binding's exact key set, while `claim-semantic-anchors` replaces that shape and mentions
  neither reader — Discharge D11 and criterion 21, honestly red until that RFC carries it. The
  [[D1374]] recount is recorded in the exploration-gate line: ranks 9–10 do not survive, the count
  is 8, and rank 8 is unmoved.
- 2026-08-24: **[[D1410]] repaired.** The law-8 argument was prose at four points it claimed were
  structural, and each now has a mechanism that can go red. **Origin B had no instrument**:
  `TheoryQuery` carried no FEN, node or run, so a registered projection was never evaluated over
  anything — §8 rule 0 adds `position.fen` and **recomputes** every eligibility key over it, refusing
  `key_ungrounded` instead of filtering on a caller assertion (criterion 22a–c). **A whole-bundle
  search was expressible** through `eligibility: [{ kind: "phase", … }]` with criteria 10 and 11 both
  green — §8 rule 0b adds a specificity floor in the type and again at runtime (criterion 22d), and
  criterion 10 now says in terms what it cannot catch. **Prose applicability is authored, not typed**
  — §5 rule 6 makes the derived/authored split a partition carried to §8's `admittedBy.origin` and to
  the sentence form a consumer may render, and §1 states plainly that for prose the typical passage is
  origin C wearing origin B's clothes (criterion 23). **The packet/word-guard case is closed by the
  owner, not by this document**: [[D1409]] and [[D1419]] put the span rule on all four `voiceCheck`
  arms, which removes the leakage; §11.1 states the three-part residue — `plan`/`initiative`/
  `compensation`/`pressure` are in no list at all (D12), `voiceCheck` has no attribution arm (repaired
  by §8 rule 7's single `attributedQuotation` string, criterion 24a), and the caption escalation stands
  open by [[D1419]]'s own words (D13) — and the span repair is **owed on `voice.ts` at HEAD**, so
  criterion 24b is red and refuses to admit theory prose until it lands. Also closed: [[D1395]]'s five
  HTTP controls become criterion 25 (red at HEAD against the 49-line client); the **eight** refusal
  codes with no criterion become criterion 26, asserted as set-equality so a ninth cannot appear
  unfixtured; §5's *"at HEAD"* column is corrected — `theory.opening.current_endpoint@1` and
  `theory.opening.catalogue_membership@1` are **not compiled**, existing only in
  `rfc/runtime-opening-identity.md`, so those two key kinds refuse `key_ground_missing` until it lands
  (criterion 7c); and criterion 1 now requires the census to print a **scope** beside every integer,
  because a re-derivation found the Motivation table silently mixing three scopes and carrying two
  rows — 378/65/49 sources strings and 54 CC-BY-SA-4.0 packs — that reproduce over **none** of them.
  The argument survives because it rests on the **0** prose-pointer records, which reproduces
  everywhere. Two citations corrected in passing: `.gitignore:14`→`:11` and the CC-BY-SA-4.0
  restriction at `check.ts:341,354-355`→`:342,:353`.
