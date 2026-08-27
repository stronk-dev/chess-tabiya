# Theory knowledge pipeline — independent buildability return

**Reviewed:** 2026-08-27

**Reviewer:** codex

**Document:** `rfc/theory-knowledge-pipeline.md`

**Verdict:** **RETURNED.** The measured product direction survives: build a separate, offline,
allow-listed theory artifact; keep exact applicability ahead of lexical selection; ship no vector
service or request-time scraper; let an optional LLM render admitted evidence but never select or
invent chess claims. Implementation is not authorised from the current contract.

## Method

The pass read the complete RFC and re-derived its implementation-critical claims against the live
evidence catalogue/compiler, semantic collectors, opening catalogue, sourcing types/checker/client,
voice guard, ignored source store and release topology. It also checked the proposed licence model
against the official Creative Commons and SPDX materials, and the search contract against SQLite's
official FTS5 grammar.

The review did not edit the concurrent D872 tactical harness or the untracked `planning/review/`
work.

## What survives

The research is strong enough to refuse the Skipper-style vector/agent stack for 1.0. The fixed
experiment measured exact keys plus FTS above the semantic arms, and the self-hosted release should
remain one application plus its local artifact. Source bytes, revision, digest, exact span, licence
and attribution must be first-class. Retrieval must return cited passages, not generated answers.
Eligibility must be grounded independently of a caller's search text, and an unavailable bundle
must make theory honestly empty without blocking chess play.

Eleven seams prevent those decisions from being implemented as written.

## Blockers

### 1. The declared passage type destroys the origin partition the RFC later requires ([[D1888]])

`TheoryPassage` has one `keys: readonly ApplicabilityKey[]` field. Section 5 rule 6 and criterion 23
instead require disjoint `derivedKeys` and `authoredKeys`, with reviewer identity and date retained
on every authored key. The response's `admittedBy.origin` cannot be reconstructed from the declared
stored shape, so the law-8 distinction can disappear while every TypeScript declaration still
passes.

Publish the literal stored union/partition and its SQLite representation. A build fixture must fail
if an authored key enters the derived arm, loses its reviewer/date, or if the two origins are merged.

### 2. A manifest declaration is not an executable ground evaluator, and FEN is not a total subject ([[D1889]])

Rule 0 says all eleven ground projections are evaluated over `position.fen`.
`compileEvidenceManifest` only validates and indexes declarations
(`packages/runtime/src/evidence-contract.ts:459`); it does not bind projection ids to executable
functions. More importantly, `motif` names semantic *events*. The live event constructors require
`beforeFen + moveUci + afterFen`, and sequence motifs require a recorded path
(`packages/runtime/src/semantic-evidence.ts:395-917`). Opening identity also retains
`observedPly`. A single FEN cannot produce those facts.

Split position-local readings from transition/path occurrences, define the exact sealed subject for
each key kind, and publish one total projection-to-executor registry. Criterion 22 must exercise the
real executor and abstention per subject shape, not enumerate metadata and claim execution.

### 3. Multi-key eligibility has no set algebra ([[D1890]])

The query accepts one specific key followed by arbitrary additional keys, but the RFC never says
whether passage keys and query keys use intersection, union, exact match, or a kind-specific rule.
“Phase and side may narrow” implies conjunction; other wording speaks of keys that independently
admit a passage. A caller can submit a satisfied subset and reach a wider set unless the complete
position-derived key closure, required/optional key roles and match algebra are normative.

Publish a total key-kind algebra and derive the eligible set only from the server-computed closure.
Caller keys may narrow or request an exact predicate, but cannot define the closure. Cross fixtures
must cover one passage with two keys, two passages with overlapping keys and omission of a satisfied
key.

### 4. The bundle identity is deliberately nondeterministic ([[D1891]])

Section 7.2 hashes `generatedAt` into `bundleId`. Identical source, extractor, enricher, manifest and
evaluation bytes therefore produce a different id on every clean rebuild. That contradicts the
RFC's deterministic compiler, digest-addressed release and rebuild criteria. Including the final
evaluation digest also needs a specified pre-build/final-build order to avoid circular identity.

Define `bundleId` from semantic input/output bytes only. Keep `generatedAt` as unhashed build
metadata, and specify how the evaluation receipt names the candidate artifact without becoming a
circular input. Prove two clean rebuilds are byte/digest identical.

### 5. A clean checkout cannot prove a committed citation ([[D1892]])

`content/sources/` is gitignored. Section 9 deliberately gives `citable_text` no `passageId`, then
P6 requires `quotedText` to occur exactly once in the pinned source bytes. A normal reviewer and
ordinary CI checkout have neither the bytes nor a guaranteed network/bundle dependency, so the
claimed committed proof is unverifiable at the gate that accepts content.

Commit or release a digest-bound citation proof artifact containing the exact locator/span and the
minimum bytes needed to verify it, or make network re-verification an explicit separate tier while
ordinary validation truthfully reports `source_unavailable`. Do not use quote uniqueness as the
only locator; retain exact code-point offsets and source digest in the evidence record.

### 6. `attributedQuotation: string` is not an attribution seal ([[D1893]])

A string can be sliced, concatenated or rewritten. The current packet-wide `voiceCheck` admits
tokens from the aggregate packet and has no structured attribution arm. Criterion 24a greps the
result type for a bare `quotedText` field; it cannot stop a renderer or optional LLM from emitting
only the quotation substring.

Return a structured citation item, construct it only from the admitted source record, and let one
registered deterministic renderer emit quotation plus attribution. Provider conformance must bind
the output span to that item and require every quotation span to retain source/author/licence/link
notices. A cast-to-string or substring negative must fail at the real provider/render boundary.

### 7. The licence model is neither a valid SPDX union nor a complete rights policy ([[D1894]])

The proposed SPDX enum contains `public-domain`, which is not a generic SPDX short identifier. SPDX
defines standardized identifiers for specific licences and exceptions, not a free-form rights
status (official list: https://spdx.org/licenses/). The live `SourceLicence` also has a
`no-rights-asserted` arm, but the proposed register can independently set
`permits.quotation/redistribution`; nothing prevents an accepted row from granting itself rights.

The two derived booleans are insufficient as the compliance model. CC BY 4.0 requires appropriate
credit, a licence link and indication of changes, with supplied notices retained
(https://creativecommons.org/licenses/by/4.0/). ShareAlike compatibility is version- and
direction-specific rather than one boolean
(https://wiki.creativecommons.org/wiki/ShareAlike_compatibility).

Use a reviewed closed licence/terms policy that derives permissions and complete obligations;
represent public-domain dedication/status with a real reviewed member or a separately named rights
basis. `no-rights-asserted` must never yield redistributable bytes. Persist and render the exact
notice obligations, source link and modification status.

### 8. Rejected source rows are retained but never normatively excluded from builds ([[D1895]])

`review.state` admits `accepted | rejected` and the prose says rejected rows are retained, but the
bundle admission rules only inspect the independently authored `permits` booleans. A rejected row
with permissive flags can enter the fetch/extract/publish path. The generic “immutable URL” check is
also not defined per source origin; a substring-like revision-token check does not establish that a
server will keep bytes immutable.

Define a source lifecycle whose build input is exactly accepted rows, derive permits from the
reviewed rights policy, and provide origin-specific immutable-revision adapters. Fixture rejected,
superseded and mutable-revision rows at the actual builder boundary.

### 9. The HTTP controls leave DNS rebinding and redirect authority open ([[D1896]])

“Resolve DNS, reject private addresses, then fetch the hostname” is a time-of-check/time-of-use
gap unless the connection is made to a vetted address while TLS/SNI and Host still verify the
reviewed hostname. Redirects and robots retrieval create additional request paths that need the
same guard. “Same registrable domain” has no Public Suffix List/version or comparison algorithm,
and method/header forwarding across redirects is unspecified.

Publish one transport authority with pinned vetted destination addresses, hostname/TLS validation,
IP revalidation for every redirect, a pinned public-suffix implementation, bounded redirects/body/
headers/timeouts, and the same rules for robots. Test rebinding, IPv4/IPv6 private ranges, redirect
credential stripping and destination changes—not only literal localhost URLs.

### 10. Raw FTS input and result ordering are not a closed operation ([[D1897]])

`TheoryQuery.text` is an arbitrary string, yet SQLite FTS5 parses operators, quotes, prefixes,
column filters and NEAR expressions; some character sequences are syntax errors and future FTS5
versions may assign currently invalid characters new meaning
(https://www.sqlite.org/fts5.html#fts5_strings). The RFC also says “FTS rank + key specificity +
section order” without defining tokenizer, query escaping, empty-text behavior, score composition,
stable tiebreak or limit bounds. SQLite documents that unordered results are arbitrary and that its
default relevance rank is BM25-oriented
(https://www.sqlite.org/fts5.html#sorting_by_auxiliary_function_results).

Define a literal text-query parser/escaper and tokenizer version; never pass learner text as FTS
syntax. Publish one total comparator and bounded limit domain, including no-text behavior and final
`passageId` tiebreak. Malformed operators and equal-rank results need deterministic fixtures.

### 11. The principle citation shape is not joined to attribution obligations ([[D1898]])

The claimed principle source object contains `sourceId`, revision, digest, section and quote but no
author/publisher, licence, attribution text, licence link or modification status. Those values live
elsewhere, while the proposed biconditional only checks `standsOn: cited_source` against the
presence of a structured source. A principle can therefore validate with an unrenderable or
mismatched attribution.

Reference one accepted source-register identity and exact passage/span proof instead of copying a
partial source record. Validate digest/revision equality and derive the complete attribution from
that identity. The learner-facing citation renderer must consume the same joined record.

## Required amendment order

1. Correct the stored passage/source/licence/citation types and lifecycle (D1888, D1894, D1895,
   D1898).
2. Define executable ground subjects and the total eligibility algebra (D1889-D1890), refreshing
   the stale statement that runtime opening identity is unlanded—the two projections now compile at
   `evidence-catalog.ts:792-793`.
3. Specify deterministic artifact/proof identity (D1891-D1892).
4. Close HTTP and FTS operations at their literal trust boundaries (D1896-D1897).
5. Replace the quotation string with a structured, conformance-checked citation render (D1893) and
   retain the existing span-scoped voice dependency as a separate prerequisite.
6. Re-run clean-build reproducibility, source admission, retrieval, citation, licence and absent-
   bundle fixtures, then send the amended RFC through another independent buildability review.

O5 remains a real owner decision, but it should rule the product direction—not waive any of these
mechanical blockers. F3 remains a dependency after the current return is repaired.
