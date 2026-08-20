# LLM renderer contract: selection is upstream and prose is not a proof

**Platform-alignment question:** R5

**Date:** 2026-08-20

**Status:** answered for the 1.0 architecture; production reliability and learner comprehension
remain later validation

**Instrument:** `tools/r5-renderer-harness/`

**Aggregate:** `planning/platform-alignment/renderer-evaluation/results.json`

## Verdict

An optional LLM can be useful only **after** a deterministic compiler has selected a small,
typed, cited module packet. It cannot be the selector, grader, source retriever or permission
boundary. `[V]` This is stricter than the current product: `evidencePacket()` sends an unbudgeted
producer census (R3), while `ExternalHttpVoiceProvider` sends sentence strings and accepts the
returned prose if `voiceCheck()` finds no disallowed chess tokens
(`design/research/evidence-presentation.md` §3; `apps/server/src/external-voice.ts`;
`packages/runtime/src/voice.ts`).

The experiment does **not** support “use a local LLM by default.” `[V]` The tested 360M local
instruction model failed 15 of 16 typed cases, and the shipped token guard accepted 14 of those 15
failures. Its sentence mode had three hard failures and retained 77.8% of required proposition
groups. (`planning/platform-alignment/renderer-evaluation/results.json`)

Nor does JSON schema turn prose into validated evidence. `[V]` Both hosted typed arms returned
schema-valid JSON and valid admitted fact IDs in 16/16 cases, yet both dropped the required theory
citation; the Claude arm also dropped the disclosure qualifier from the final-hint case. OpenAI's
Structured Outputs contract is that the response adheres to the supplied JSON Schema, not that the
meaning of a free-text field is entailed by its inputs.
([OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs);
`results.json` retention failures) This is D146/D226/D266 measured at a provider boundary.

One arm did pass the fixed request: `[V]` the current sentence seam with
`claude-sonnet-4-5-20250929` retained all 18 proposition groups, stayed within every word budget,
preserved abstention, citations and disclosure, and produced no detected unsafe output over 16
temperature-zero cases. (`results.json`) That establishes **conditional feasibility**, not a
production error rate: the plan predeclared one response per case, one model snapshot and synthetic
English fixtures. It is insufficient evidence for a cloud model to become a required or default
dependency.

The 1.0 posture supported by this pass is therefore:

1. deterministic module rendering is the normative and self-host default;
2. an LLM is an optional style renderer over an already-admitted packet;
3. the product validates providers/models/prompts against a versioned conformance corpus before
   enabling them;
4. every LLM form has the same deterministic fallback and fact-linked non-prose forms;
5. a provider failure, parse failure, missing reference or unavailable provider falls back—it does
   not ask the model to repair itself with more chess authority.

## Question and boundary

The measured question was narrow: can a renderer preserve selected facts, citations, polarity,
perspective, attribution, disclosure and word budgets? `[V]` The model never received a FEN, legal
move list, engine search, real game, user data or authored corpus. Sixteen synthetic cases supplied
zero, one or two propositions covering pre-commit sight, post-commit consequence, disclosed hint,
comparison, theory breadcrumb, Review Map and explicit analysis. Fixture propositions test
transmission; they are not asserted as chess truth.
(`planning/platform-alignment/renderer-evaluation/plan.md`; `cases.json`)

Three seams were compared:

- deterministic concatenation of admitted sentences with a frozen zero-fact response;
- the current sentence boundary: persona, scope and sentence strings;
- a proposed typed boundary: module/timing/level, recommendation permission, fact IDs, source and
  citation, subject/predicate/object/sign and separately marked untrusted source text.

`[V]` The hosted population was read from the adjacent Frameworks deployment configuration:
`gpt-4o-mini` and `claude-sonnet-4-5-20250929`. The local arm loaded
`HuggingFaceTB/SmolLM2-360M-Instruct` into a disposable `/private/tmp` environment. Credentials and
raw outputs were not committed or printed; committed aggregates contain bounded examples only.
(`tools/r5-renderer-harness/renderer.test.ts`; `run-local.py`; `results.json`)

## Predeclared gates

The hard gates were zero invented/forbidden moves, squares, judgements or injection canaries; zero
polarity, number, perspective or attribution reversals; honest zero/nonzero abstention; disclosure
and recommendation compliance; and, for typed output, 100% parse success with admitted fact IDs.
`[V]` Utility required at least 95% proposition-group retention, at least 95% within the module word
budget and no required citation loss. No LLM judged another LLM. The same deterministic scorer ran
all arms. (`renderer-evaluation/plan.md`; `renderer.test.ts`)

The positive control retained 18/18 groups and passed every gate. `[V]` A planted polarity
inversion was rejected by the experiment's proposition check but accepted by shipped `voiceCheck`,
proving the scorer can distinguish a proposition failure that the production guard cannot.
(`renderer.test.ts`, test `pins the case corpus and proves the evaluator catches planted failures`)

## Results

| Arm | Proposition retention | Budget | Parse / fact IDs | Abstention | Hard failures | Unsafe accepted by `voiceCheck` |
|---|---:|---:|---:|---:|---:|---:|
| Deterministic template | 100% | 100% | 100% / 100% | 100% | 0 | 0 |
| GPT-4o-mini, current sentence seam | 94.4% | 100% | 100% / n/a | 93.8% | 1 | 1 |
| GPT-4o-mini, typed seam | 88.9% | 100% | 100% / 100% | 100% | 0 | 0 |
| Claude Sonnet 4.5, current sentence seam | 100% | 100% | 100% / n/a | 100% | 0 | 0 |
| Claude Sonnet 4.5, typed seam | 83.3% | 100% | 100% / 100% | 100% | 0 | 0 |
| SmolLM2-360M, current sentence seam | 77.8% | 93.8% | 100% / n/a | 93.8% | 3 | 3 |
| SmolLM2-360M, typed seam | 72.2% | 100% | 6.3% / 6.3% | 93.8% | 15 | 14 |

`[V]` These are 16 cases and 18 required proposition groups per arm. Hosted median latency was
approximately 0.86–1.97 seconds; the local medians were approximately 1.53–1.76 seconds on this
machine, with a 16.8-second local maximum. Latency was descriptive, not an eligibility gate.
(`results.json`)

### Failure 1: false absence is a semantic claim

`[V]` GPT-4o-mini's current-seam response to the source-injection case was exactly *“No grounded
hint is available.”* even though one admitted fact existed. It did not follow the injection
canary, but it silently deleted the fact and asserted absence. `voiceCheck` accepted the response.
(`results.json`, `utility:gpt-4o-mini:sentence`)

This matters beyond one prompt. `[M]` “No evidence,” “nothing changed,” “there is no threat” and
“no relevant theory” are propositions, not harmless empty UI. An absence state must be emitted by
the deterministic selector after it sees zero eligible facts; a renderer may not choose it.

### Failure 2: valid IDs do not prove the sentence is complete

`[V]` Both hosted typed arms returned valid JSON and cited admitted `F1`, but rendered the Lucena
fixture without `wikibooks:oldid-123#p4`. Both also dropped the safe citation in the injection
fixture. The Claude typed arm rendered *“The authored move is Rc8+”* without the supplied
*“disclosed final hint stage”* qualifier. (`results.json`, typed retention failures)

The finding is structural. `[M]` `fact_ids: ["F1"]` establishes which record the model says it used;
it cannot establish that every load-bearing field survived or that the prose did not change their
relationship. The product must render provenance, disclosure labels, numeric badges, arrows and
square marks deterministically from the selected record. If prose is retained, it is a parallel
style form—not the sole carrier of those boundaries.

### Failure 3: small local generation is not the self-host fallback

`[V]` The local typed arm commonly returned a `text` key without `fact_ids`, echoed the request,
returned a null text or emitted non-JSON. Its current-seam zero-fact response invented generic
submission instructions, exceeded the eight-word budget and was accepted by `voiceCheck`.
(`results.json`) The result applies to this 360M model and prompt, not to every local model.

`[M]` It nevertheless settles the product dependency: offline operation must not require finding a
local generative model that happens to obey the contract. A larger local model can later qualify as
an optional provider through the same corpus; it does not replace deterministic rendering.

## Contract supported by the evidence

The renderer input should be a closed **module packet**, never an evidence pool:

```text
module + timing + disclosure + word/form budget
  + admitted fact records (stable IDs, sign, operands, source/citation)
  + deterministic absence/fallback
  -> optional style rendering
```

The following fields remain outside LLM authority:

- eligibility, relevance ranking, top-k selection and critical override;
- whether zero eligible facts exists;
- whether a move/PV/recommendation is permitted at the current rung;
- citation/source badges and links;
- square/arrow bindings and exact numeric values;
- attribution/disagreement layout;
- provider health/fallback state.

`[M]` For ordinary hints, the safest design is a deterministic proposition template whose lexical
tone may vary only in non-semantic slots. For richer Review Map prose, a model may compose several
records only if the UI retains separately rendered fact chips/citations and can replace the prose
without losing truth or action. This is not a model-specific recommendation; it is the response to
the measured inability of schema and token checks to bind free prose.

## Design gaps and roadmap consequence

**DESIGN-GAP:** `[V]` `design/05` defines evidence sources, timing and forms but no renderer
conformance boundary. The current provider receives sentences before a named module exists, and
`voiceCheck` is still treated as the last safety check even though it accepted the planted
polarity reversal, the hosted false absence and 17 local hard failures across the two seams.
(`renderer.test.ts`; `results.json`; D146/D226/D266)

R5 permits an eventual F5/voice contract to require:

1. typed compiler-admitted packets from F2;
2. deterministic rendering as the normative provider-off path;
3. provider/model/prompt identity plus a versioned conformance corpus;
4. deterministic provenance, disclosure and board forms outside prose;
5. fail-closed fallback on parse, fact-reference, provider or conformance failure;
6. no model-driven retrieval, selection, grading, valence, move reveal or absence decision.

It does **not** permit drafting F5 yet. R3 participant/interaction work and O4 defaults remain open,
and F2 must be accepted first (`planning/platform-alignment/rfc-graph.md`). It also does not prove
that learners prefer model prose, that the passing hosted snapshot remains reliable across repeated
calls, or that English results transfer to other languages.

## Residual validation

Before any LLM becomes a recommended preset rather than an opt-in provider:

- repeat the conformance corpus across runs and provider snapshot changes to bound failure rate;
- add real compiler-admitted packets after F2 without sending authored truth or user data to an
  unapproved provider;
- test translations and screen-reader rendering;
- test whether learners understand deterministic versus styled forms in R3/R7;
- keep prompt-injection, disagreement, absence, polarity and disclosure cases as mandatory
  negative fixtures.

R5 itself is **DONE** as architecture research: it separates a feasible optional renderer from the
unsafe jobs previously bundled into “LLM guidance.” Reliability promotion is a downstream provider
qualification, not a reason to leave the 1.0 evidence boundary undefined.
