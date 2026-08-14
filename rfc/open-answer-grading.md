# RFC: Stated reasoning and open-answer key-point coverage

- **Status:** implementing
- **Author:** claude (drafted for owner review)
- **Created:** 2026-08-14
- **Design refs:** `design/05-in-run-experience.md` §3 (assistance ladder, rungs 0/5/6),
  `design/02` §Adoption posture via `design/research/adoption-audit.md` §5 Shortlist B #3
  (rows 6 + 19), `design/research/teardown-chessmotive-desk.md` §5/§6,
  `design/BACKLOG.md:208` ("Open-answer key-point grading as a checkpoint interaction")
  and `design/BACKLOG.md:250` ("Step-indexed reasoning transcript (steal from
  ChessMotive)")
- **Exploration gate:** opened by owner ruling 2026-08-12 (`rfc/README.md:70-77`); breadth
  sequencing ruling 2026-08-11 applies. This draft completes no B-gate; it is an
  adoption-audit structural adoption adjacent to B4's authored-claims residual and stays
  inside B4's "authored content supplies the vocabulary" constraint by shipping grammar,
  not content.
- **Depends on:** `rfc/archive/n-way-comparison.md` (prediction-checkpoint record
  precedent), `rfc/archive/shape-library.md` (shape-plan references),
  `rfc/archive/predicate-wave-2.md` (fifteen-leaf structural grammar),
  `rfc/archive/adaptive-guidance.md` (packet seam and `voiceCheck` machinery),
  `rfc/archive/return-and-progression.md` (attempts projection for cross-run lookup)
- **Parent / amends:** —
- **Supersedes / superseded by:** —
- **Planning:** `planning/open-answer-grading/` (once implementing)

## Summary

At an authored **stated-reasoning checkpoint**, the learner types what they are thinking —
candidates considered, the chosen plan, what they fear — *before* seeing any authored or
engine evidence for that stretch of play. The transcript is recorded as a durable run
event, exactly as prediction checkpoints already record a predicted move before the reply
is selected (`docs/n-way-comparison.md:25-27`, `apps/server/src/service.ts:997-1035`).
The author lists **key points** per checkpoint, each keyed to a groundable fact — a
structural expression, a shape-entry plan, an authored spine move, or a typed
`feedbackClaims` entry — never free prose. A deterministic string/synonym matcher reports
each key point as **detected** (with the learner's own words quoted) or **not detected**,
and the surface says in a byte-fixed sentence that "not detected" means the words were not
found, never that the idea was wrong. The learner sees three columns: their transcript,
the authored key points with detection status, and their **own previous attempt's
transcript at the same checkpoint** — the you-vs-you diff that
`teardown-chessmotive-desk.md:103-110` identifies as our differentiator over
ChessMotive's one-attempt-vs-authority table. No score, percentage, ratio, or verdict on
reasoning quality is ever produced. An LLM may *propose* additional matches only as
rung-6 rendering with the quoted evidence shown, behind the shipped packet seam; it can
never flip a detection or grade anything.

## Motivation

ChessMotive's single best idea is the step-indexed process transcript: capture reasoning
artifacts as structured data, then diff row by row, so failure localizes to generation vs
selection vs judgment instead of one "wrong move" verdict
(`teardown-chessmotive-desk.md:88-95`). ChessMind's ChessGPT quiz shows the open-answer
form of the same idea: the learner types prose and sees which key points they covered
(`adoption-audit.md:76`, row 19). Both audit rows converged on one RFC
(`adoption-audit.md` §5 Shortlist B #3): transcript rows as a checkpoint interaction,
graded **as coverage of authored key points only**, with the LLM confined to comparator
duty behind the packet seam.

This is the RFC most at risk of violating law 8 (`AGENTS.md:78-83`, standing ADR-0005):
grading free-text chess reasoning tempts an LLM judgment call at every step. The honesty
boundary is therefore the spine of this specification, enforced three ways:

1. **Key points are grounded, not prose.** Every authored point is keyed to a fact the
   product can attribute: rung-0 structural arithmetic, a provenance-carrying shape plan,
   the author's own spine, or a typed claim with declared `evidenceTypes`.
2. **Matching is deterministic and honest about its crudeness.** A missed match is
   "not detected", never "wrong". The matcher is a word-boundary string/synonym search
   plus chess-move-token equivalence — nothing that could be mistaken for understanding.
3. **The LLM is a comparator, not a judge.** It may propose that a learner's verbatim
   sentence expresses an authored point, with the quotation shown and labeled as a
   proposal. It goes through the same necessary-but-insufficient check discipline as
   `voiceCheck` (`packages/runtime/src/voice.ts:33-41`,
   `docs/adaptive-guidance.md:107-126`), is ephemeral, and never becomes the record.

ChessMotive's contrast is the named anti-pattern: their summary renders an `isMatch` flag
per row and a score — "3/4 finalists matched" (`teardown-chessmotive-desk.md:57-61`).
This RFC forbids exactly that rendering, including the ratio.

**Out of scope:** ChessMotive's five-row form includes a concrete calculation line entered
for both colours; that requires a both-colours line editor this RFC does not build, and
its endpoint (the opponent's actual reply) is already captured by the shipped prediction
interaction. The closed transcript union here is three rows — generation (candidates),
selection (plan), anticipation (fears). Also out of scope: any automated assessment of
transcript *quality*, cross-learner comparison of transcripts, an authored "model
transcript" to diff against (the comparison axis here is you-vs-you, not you-vs-model),
and the on-ramp category-scan scaffold (`design/BACKLOG.md:251`, a separate interaction
belonging to the on-ramp work).

## Specification

### 1. Pack format: the `stated_reasoning` interaction

The checkpoint `interaction` union (`schemas/drill_pack.schema.json`
`$defs/checkpointInteraction`, currently the closed two-variant union `intent_capture` |
`prediction`; verified against the shipped v0.13, `$id`
`urn:chess-tabiya:schema:drill-pack:0.13` — `onramp-guard`'s claimed 0.14 touches
`feedbackPolicy` and the top-level `guard` block only and leaves this union two-variant)
gains a third closed variant:

```jsonc
{
  "type": "stated_reasoning",
  "keyPoints": [            // 1..12 entries, ids unique within the checkpoint
    {
      "id": "<id>",         // $defs/id
      "label": "<short display phrase>",   // nonEmptyString, <= 120 chars
      "phrases": ["minority attack", "b4-b5", "advance the b-pawn"],
                            // 1..16 nonEmptyString match phrases, <= 80 chars each
      "ground": { ... }     // exactly one of the four kinds below
    }
  ]
}
```

Every object is closed (`additionalProperties: false`), following the v0.12 D22 rule. A
checkpoint still carries at most one interaction; `stated_reasoning` cannot be combined
with `prediction` or `intent_capture` on the same checkpoint.

`ground` is a closed four-kind union. **No kind admits free prose**; the only human
sentence in a key point is `label`, and `label` is display text for an attributed ground,
not the ground itself:

| Kind | Shape | Attribution rendered | Rung |
|---|---|---|---|
| `structural` | `{ "kind": "structural", "expression": <$defs/structuralExpression> }` — the fifteen-leaf grammar of v0.13 (`docs/structural-reading.md:11-19`), including `mirrored`/`quantified` | the detector sentence recomputed from the checkpoint FEN, with the shipped scope wording | 0 |
| `shape_plan` | `{ "kind": "shape_plan", "shape": <id>, "plan": <id> }` — resolved exactly like `planClass.shapePlan` (`docs/drill-pack-format.md:188-191`): the shape must be listed in the pack's top-level `shapes`, the plan id must exist in the entry | entry name + provenance/attribution from the shape registry (`docs/shape-library.md:25-27`) | 5, provenance-carrying |
| `spine_move` | `{ "kind": "spine_move", "spineNodeId": <id> }` — must reference an existing spine node (existing lint rule class, `docs/drill-pack-format.md:79-80`) | the authored SAN of that node, labeled as the author's line | authored, digest-bound |
| `claim` | `{ "kind": "claim", "claimId": <id> }` — must reference an entry in the pack's existing `feedbackClaims` array | the claim text plus its declared `evidenceTypes` | as declared — this is how a corpus fact enters, via a claim typed `corpus_observed` (the `$defs/feedbackClaim.evidenceTypes` enum already carries `corpus_observed`, `tablebase_exact`, `engine_validated`, etc.) |

**What load-time validation proves, per kind** (§7 carries the codes; the honesty
boundary is that each kind is checked exactly as deeply as shipped machinery can check
it, and no deeper claim is rendered):

- `structural` — existence **and truth at the checkpoint position**, when the
  checkpoint trigger is statically resolvable on the spine; the fifteen-leaf evaluator
  is shipped (`docs/structural-reading.md:11-19`) and re-runs at render time on the
  actual run FEN. This is the only kind with a truth check, so
  `KEY_POINT_GROUND_FALSE_AT_CHECKPOINT` exists for `structural` only.
- `shape_plan` — registry-backed resolution exactly as `planClass.shapePlan`: entry
  listed in `pack.shapes`, plan id present in the entry, refused otherwise at server
  load and studio registration (`docs/drill-pack-format.md:188-191`). Truth is not a
  question: the ground *is* the registry entry, and its attribution renders the entry's
  own provenance (`docs/shape-library.md:25-27`).
- `spine_move` — existence of the spine node, nothing more. The rendered attribution
  ("the author's line plays this move") is made true by existence plus the digest; no
  temporal relation to the checkpoint is checked or implied — a point may legitimately
  key a move already played ("the point of the earlier exchange") or one still to come.
- `claim` — reference into `feedbackClaims`, nothing more. The truth of a claim typed
  `corpus_observed` or `engine_validated` is **not** machine-checked at load — corpus
  and engine evidence are runtime surfaces — which is exactly why the attribution
  renders the claim as *the author's declaration with its declared `evidenceTypes`*
  (the shipped claims discipline, `docs/explanation-grounds.md`), never as a
  product-verified fact.

Pack schema version: see §8 for the register claim. The change is additive; every
existing pack validates unchanged and no committed digest moves (the `$id` is not part of
any pack document, `rfc/README.md:33-35`).

### 2. Recording: the interaction and its durable event

**Ordering is the contract:** the learner states reasoning *before* seeing evidence.
Mechanically, this mirrors the prediction checkpoint, which "record[s] the learner's move
before selecting the reply" (`docs/n-way-comparison.md:25-27`).

New endpoint, following the `prediction` route shape (`apps/server/src/rest.ts:516`):

```
POST /runs/:id/reasoning
{ nodeId, checkpointEventSeq, transcript | skipped: true }
```

`transcript` is the closed three-row union:

```ts
interface ReasoningTranscript {
  readonly candidates: readonly string[]; // 0..8 entries, each 1..120 chars
  readonly plan: string;                  // 1..1000 chars, required non-empty
  readonly fears: string;                 // 0..500 chars, "" permitted
}
```

Server behavior (`recordReasoning`, mirroring `recordPrediction`'s refusal ladder
clause by clause, `apps/server/src/service.ts:997-1035`, and then adding two rules the
prediction endpoint does not have — `prediction.recorded` is keyed by node + checkpoint
id only, with no occurrence pinning, no skip, and no double-record guard; the additions
follow the occurrence-attribution precedent cited below, not the prediction code):

- writer-leased (`#forWrite`), refused while a match is live (`#refuseWhileMatchLive`);
- requires a registered pack whose named checkpoint has
  `interaction.type === "stated_reasoning"`; otherwise `INVALID_REQUEST` (precedent
  `service.ts:1012-1014`). Position sessions have no stated-reasoning checkpoints by
  construction;
- `nodeId` must be the active cursor (precedent `service.ts:1015-1017`);
- `checkpointEventSeq` must identify an existing `checkpoint.reached` event for that
  checkpoint id at that node, and it must be the latest occurrence on the active branch;
  occurrence pinning by event sequence follows the authored-feedback attribution rule
  ("Event sequence is load-bearing: a checkpoint id may recur on different branches",
  `docs/explanation-grounds.md:144-147`);
- **one recording per occurrence**: a second POST naming the same `checkpointEventSeq` is
  `INVALID_REQUEST`. The record is append-only; there is no edit;
- oversize or empty-`plan` input is refused with `INVALID_REQUEST` and nothing is
  appended;
- on success the server computes detections deterministically (§3), appends one event,
  and returns `{ run, emitted, keyPoints, detections, previous }` in the same mutation —
  atomic like the prediction endpoint, so the learner's first sight of the key points is
  the same response that durably records their words. Under `segment_end` feedback
  policy the response withholds `keyPoints`/`detections` until delivery opens (§6).

New run event (added to the closed `DrillRunEvent` union,
`packages/runtime/src/types.ts:242-257`):

```ts
export type ReasoningRecordedEvent = Event<
  "reasoning.recorded",
  {
    readonly nodeId: string;
    readonly checkpointId: string;
    readonly checkpointEventSeq: number;
    readonly skipped: boolean;
    readonly transcript: ReasoningTranscript | null; // null iff skipped
    readonly matcherVersion: 1;
    readonly detections: readonly {
      readonly keyPointId: string;
      readonly status: "detected" | "not_detected";
      readonly match?: {
        readonly field: "candidates" | "plan" | "fears";
        readonly index: number | null;   // candidates row index; null otherwise
        readonly start: number;          // codepoint offsets into the normalized field
        readonly end: number;
      };
    }[];
  }
>;
```

Detections are persisted in the event — the durable record of what the learner was shown,
following `prediction.recorded`'s persistence of derived mass/rank — and append-time
validation enforces internal consistency the way
`packages/runtime/src/events.ts:266-275` validates a prediction against its distribution:
`skipped` ⟺ `transcript === null` ⟺ `detections.length === 0` (a typed transcript
yields exactly one detection entry per authored key point, in authored order — a
transcript that matches nothing is all `not_detected`, never an empty array); a
`match` object is present iff `status === "detected"`; every
`match` span must be in-bounds for its field; `nodeId` must exist; `checkpointEventSeq`
must reference a `checkpoint.reached` event with the same `checkpointId` and node.
`matcherVersion` is honest provenance: if the matcher ever changes, old events keep their
recorded detections and are never silently regraded.

**Skip is recorded, not silent.** `skipped: true` appends the event with a null
transcript, unlocks reveal for the occurrence (§6), and renders the byte-fixed sentence
"You chose to see the author's points without stating your reasoning first." A learner
can always decline to type; they cannot see the points without that choice being part of
the record.

A new event type widens the run schema; the stamp-only migration follows the
migration-11 precedent ("mandatory because reads filter on the current run-schema
version", `rfc/README.md:105`). Numbers in §8.

### 3. Deterministic key-point matching

The matcher lives in `@chess-tabiya/runtime` beside `voiceCheck` and is pure:
`matchKeyPoints(keyPoints, transcript, checkpointFen) → detections`.

Algorithm, exhaustively:

1. **Normalize** every phrase and every transcript field: Unicode NFKC, lowercase,
   whitespace collapsed to single spaces.
2. **Move-token equivalence.** A phrase that parses as a single SAN or UCI token (the
   shipped regexes, `packages/runtime/src/voice.ts:25-26`) is matched against SAN/UCI
   tokens extracted from the transcript. Both sides resolve against the legal moves of
   the checkpoint position's FEN, so "Nf3" ≡ "g1f3" at that position. A token that is
   not legal at the checkpoint position falls back to literal matching — the matcher
   never guesses what an illegal token meant.
3. **Literal phrase match.** Otherwise, word-boundary substring search per field, fields
   scanned in order `candidates[0..n]`, `plan`, `fears`; the first match wins and its
   span is recorded.
4. Each key point is evaluated independently. Ambiguous attribution cannot arise because
   two key points sharing an identical normalized phrase are refused at validation (§7).

**The expected failure mode is the miss, and this RFC owns the rate.** A word-boundary
matcher has no morphology, no stemming, no translation: "trade the dark bishops" does
not match the phrase "dark-squared bishop" (the plural breaks the trailing boundary and
NFKC does not touch hyphens); a minority-attack plan stated as "push the queenside
pawns" matches no phrase the author did not anticipate; Dutch or German reasoning
matches no English phrase at all. At the target bands the *common* case for a sound
idea in unanticipated words is `not_detected`. That is the accepted cost, and it is the
honest direction of error: the matcher may under-claim coverage but can never
over-claim it, and law 8 permits crude-and-honest while forbidding
fluent-and-ungrounded. Three consequences are contractual:

- **The only synonym vocabulary is the authored per-point `phrases` list** — pack
  content, owned by the pack author, versioned by the pack digest. A multilingual pack
  carries its Dutch or German variants as authored phrases. **No product-global synonym
  table, stemming, lemmatizer, embedding, or fuzzy-match layer may be added**: a shared
  synonym dictionary is chess taste encoded as infrastructure, and growing one is how a
  string matcher becomes a judgment engine. `matcherVersion` may change matching
  *mechanics* (normalization, tokenization), never introduce *vocabulary*; a proposal
  to do the latter is a new RFC that must answer this paragraph.
- **Detections feed nothing.** No `attempts` column, `graded`/`verdict` value,
  progress, scheduling, recommendation, or selection input ever reads a detection.
  Coverage is a reflection surface at one occurrence, not a metric — otherwise
  "not detected" becomes a grade one projection downstream.
- **The surface reads as coverage of the author's points, never as assessment of the
  learner** — the rendered vocabulary below plus A6's forbidden-strings check pin this.

**The rendered vocabulary is fixed and closed.** A detected point renders
"Mentioned — matched '<span>'" quoting the learner's own words; an undetected point
renders "Not detected in your words." The panel is headed by the byte-fixed honesty
sentence (following the corpus surface's fixed-line precedent,
`docs/runtime-corpus-evidence.md:48-54`):

> Matching is literal: "not detected" means these exact words were not found in what you
> wrote — not that the idea was absent, and never that it was wrong.

**What is never produced**, at any layer — matcher output, event payload, API response,
or rendered surface:

- a score, percentage, or accuracy number;
- a detected/total ratio or count ("3 of 5" is a score; ChessMotive's "3/4 finalists
  matched" is the named anti-pattern, `teardown-chessmotive-desk.md:59-60`);
- a correctness verdict, quality adjective, pass/fail, or per-point right/wrong;
- a ranking or comparison of attempts ("this attempt covered more");
- approval colour semantics (no green-check/red-cross iconography; detection status is
  rendered in words).

The output is **coverage of authored points, attributed**: a list in authored order (not
re-sorted by status — order is not an implicit ranking), each point carrying its ground's
attribution rendering from the §1 table.

### 4. What the learner sees: the you-vs-you surface

After recording (and after delivery opens, §6), the checkpoint sheet
(`docs/drill-client.md` — "The checkpoint sheet takes focus") presents three columns:

1. **Your reasoning** — the three transcript rows as typed, verbatim.
2. **The author's points** — the §3 coverage list with detection status, quoted spans,
   and per-point ground attribution.
3. **Your previous attempt** — the most recent earlier `reasoning.recorded` transcript
   for the **same checkpoint id**, resolved in this order:
   1. an earlier occurrence in the same run (another branch that reached this
      checkpoint — rewind-and-branch is the product's basic attempt unit,
      `docs/return-and-progression.md:3-5`);
   2. otherwise, the latest occurrence from the learner's own prior runs of the same
      `packId` + `packDigest`, found through the attempts projection
      (`apps/server/src/storage.ts:1143`, `:1292` — `attempts` carries `learner_id`,
      `pack_id`, `pack_digest` per run), reading at most the five most recent such runs'
      snapshots;
   3. otherwise the byte-fixed absence sentence: "No earlier attempt has stated
      reasoning at this checkpoint."

Cross-run alignment is by checkpoint id **within** the same `packId` + `packDigest`,
never across digests. A re-versioned pack may have moved, re-triggered, or re-authored
a checkpoint that kept its id; diffing a transcript against what is now a different
question would be a false comparison — the stale-reference class this product refuses
elsewhere. The deliberate cost is owned: publishing a new pack version starts the
you-vs-you history empty (the absence sentence renders), and prior-digest transcripts
remain readable in their own runs but are never re-attached.

The previous-attempt column shows that attempt's transcript and its *recorded* detections
(as stored in its event — never regraded, per `matcherVersion` in §2). The two
transcripts sit side by side, row-aligned (candidates/plan/fears); the product draws no
conclusion about which is better. This is the axis ChessMotive lacks: "Nothing compares
two things *you* did" (`teardown-chessmotive-desk.md:57-61`); "ours is you-vs-you across
preserved attempts" (`teardown-chessmotive-desk.md:103-110`).

Read surface: `GET /runs/:id/reasoning?checkpointId=...` — read-authorized like the run's
other projections; returns this run's recorded occurrences (eventSeq, branchId,
transcript, detections, key points) **for recorded occurrences only**, plus the
prior-run transcript block. Key points and detections obey §6 disclosure. Prior-run
transcripts are returned only to the run owner's principal — another learner's spectator
grant on this run does not reach into the owner's other runs.

**Who sees the learner's text — the closed list.** A transcript is learner-authored
free text inside the run record, the same visibility class as the branch `label` and
`intent` strings the run already carries (`docs/branch-runtime.md:47`). Exactly two
surfaces can return it: the run event log (`/runs/:id/events` and equivalents) and this
projection, both behind the run-grant model — host, participant, or spectator by
explicit grant, missing grants 404 (`docs/identity-and-authorization.md`). Granting a
read role *is* the disclosure decision for this text, as it already is for branch
intents. Everything else is excluded by construction: the public story-share token
exposes no event log, PGN, or run graph (`docs/adoption-wave-1.md:40-44`); PGN export
serializes headers and movetext only (`packages/runtime/src/pgn.ts`) — a transcript
never enters a PGN; the pack projection is untouched (§6); and a match opponent never
sees one, because recording is refused while a match is live (§2), so no transcript can
be authored mid-match. No copy exists outside the run's append-only events (no table,
§8), so transcripts follow the run's existing deletion and account-deletion story and
need no separate retention rule.

### 5. The LLM comparator: rung-6 rendering, never a grade

Optional, provider-gated exactly like persona voice (`docs/adaptive-guidance.md:112-117`;
no provider ⇒ typed `VOICE_UNAVAILABLE`, and the client shows no comparator control).
This is rung 6 of the ladder — "May only word rungs 0–5"
(`design/05-in-run-experience.md:77`).

`POST /runs/:id/reasoning-review { checkpointEventSeq }`, permitted only after the
occurrence is recorded (not skipped) and delivery is open. The server assembles the
prompt input **before** the provider is consulted, packet-discipline style
(`docs/adaptive-guidance.md:107-110`): the deterministic `EvidencePacket` for the node,
the learner's transcript verbatim, the authored key points (id, label, phrases), and the
deterministic detections. The provider is asked one closed question: for each
`not_detected` key point, quote a verbatim passage of the learner's transcript, if any,
that may express it.

**The loop is parse, then check, then template — provider prose never renders.** The
provider's reply is parsed into (key-point id, quotation) pairs — at most one pair per
`not_detected` point, each quotation a contiguous span of a single transcript field,
at most 240 codepoints — and everything else in the reply is discarded before any check
runs. The rendered output is the byte-fixed frame below with exactly two
interpolations: the learner's own quotation and the author's own `label`. Every
rendered byte is therefore learner-authored or author-authored; a hostile transcript
(prompt injection included) can at worst get its own words quoted back at their author,
attributed. This is deliberately stronger than `voiceCheck`, which renders checked
provider prose — here the provider only *selects*, never *phrases*.

Nothing confirms a proposal *as a match*, and nothing can: whether the quoted span
expresses the authored point is exactly the judgment the deterministic record refuses
to make (the matcher already scanned that span and found no phrase). The frame
therefore labels it a proposal, and it can never flip the stored detection.

`reasoningMatchCheck` — deterministic, and deliberately necessary-but-insufficient like
`voiceCheck` (`docs/adaptive-guidance.md:119-122`) — rejects the parsed pairs when:

- any proposed quotation is not a verbatim substring of the learner's transcript,
  checked against the raw field text — the rendered quotation is the learner's original
  characters, never a normalized echo;
- any named key-point id is not in the authored set, or is already `detected`;
- the output introduces square/move tokens or chess lexicon absent from packet +
  transcript + key-point phrases (reusing the `voiceCheck` token machinery,
  `packages/runtime/src/voice.ts:36-39`);
- any `BANNED_JUDGEMENTS` word appears that is absent from that same source text
  (`packages/runtime/src/voice.ts:21`).

One failed rendering may be retried; a second failure yields **silence** — the
deterministic detections are already on screen and are the fallback. Accepted proposals
render inside the key-point column under the byte-fixed frame:

> Possible mention, proposed by the configured language model and not a detection: you
> wrote "<quotation>" — the author's point "<label>".

A proposal **never** flips a stored detection, never appends an event, is never
persisted, and reports its provider honestly (`llm: external` precedent,
`docs/adaptive-guidance.md:123-125`). The durable record remains exactly what the
deterministic matcher produced at recording time.

### 6. Projection and disclosure

**Public pack projection.** `GET /packs/:id` reveals the interaction *type* only —
`{ type: "stated_reasoning" }` — following the prediction projection precedent
(`apps/server/src/pack-registry.ts:109-120`). Key points (labels, phrases, grounds) are
authored feedback and never appear in the pack projection
(anti-contamination boundary, `docs/explanation-grounds.md:110-114`). The client learns
"a reasoning form belongs here" and nothing else.

**Reveal ordering.** For a checkpoint occurrence whose checkpoint has a
`stated_reasoning` interaction, `GET /runs/:id/authored-feedback` withholds every item
attributed to that occurrence — and, under `segment_end`, every item whose attributed
segment path crosses that occurrence — until a `reasoning.recorded` event (typed or
skipped) exists for that `checkpointEventSeq`. Other occurrences' items are unaffected.
`hasWithheldAuthoredContent` remains the only pre-reveal fact, unchanged
(`docs/explanation-grounds.md:148-152`). Once recorded, disclosure is durable and rewinds
do not un-reveal (`docs/explanation-grounds.md:120-122`).

**Feedback policy.** Recording always happens at the checkpoint occurrence, under both
policies. Under `delayed_checkpoint`, detections and key points return in the recording
response. Under `segment_end`, the recording response acknowledges without them; they are
delivered when the segment's reveal occurrence opens, attributed to the end checkpoint
occurrence (`docs/explanation-grounds.md:118-121`). The transcript itself — the learner's
own words — is visible to the learner immediately in either policy.

**Client flow.** At `checkpoint.reached` the controller already pauses
(`docs/drill-client.md` — pause-before-reply). For a stated-reasoning checkpoint the
sheet presents the three-row form with exactly two exits: submit, or "Show the author's
points without writing" (which records `skipped: true`). There is no third path to the
authored material. The form is presented before any authored prose, marker detail, or
evidence surface for that occurrence is fetched.

### 7. Validation, lint, and the studio as consumer

Shared pack validation (`pack-validation` / `pack-check` / registry load — one pipeline,
`docs/drill-pack-format.md:87-92`) gains typed codes in the existing style:

- `KEY_POINT_GROUND_UNRESOLVED` — refusal: `shape_plan` not resolvable under the v0.11
  rules, `spine_move` naming an unknown spine node, or `claim` naming an id absent from
  `feedbackClaims`.
- `KEY_POINT_GROUND_FALSE_AT_CHECKPOINT` — refusal: a `structural` ground that evaluates
  false at the checkpoint position, when the trigger is statically resolvable
  (`atSpineNode`/`atPly` on the spine). With a dynamic trigger the check is suppressed
  rather than guessing reachability, mirroring `AUTHORED_PROSE_AFTER_LAST_CHECKPOINT`
  (`docs/explanation-grounds.md:154-157`).
- `KEY_POINT_PHRASES_COLLIDE` — refusal: two key points in one checkpoint sharing an
  identical normalized phrase; ambiguous attribution has no honest rendering.
- `KEY_POINT_PHRASE_IS_JUDGEMENT` — warning: a phrase consisting solely of
  `BANNED_JUDGEMENTS` vocabulary ("good", "winning") would make the coverage list assert
  a judgment the learner merely echoed; warn, don't refuse — the author may legitimately
  key "winning the exchange".

Structural counts (1–12 points, 1–16 phrases, length caps) are JSON-Schema constraints,
with the required negative fixtures in `schemas/fixtures/drill-pack/`
(`docs/drill-pack-format.md:104-106`).

**Pack Studio is a consumer, not a new surface.** Studio drafts run the same shared
validation, so the new codes surface in the existing lint panel with no studio-side
logic; the pack editor form gains a key-point editor (label, phrases, ground picker
reusing the existing shape/plan and spine-node selectors). Registration refusal rules are
the shared ones above. Shape Studio is untouched.

### 8. Versions, migration, and register claims

This draft lands **third in the 2026-08-14 wave** (register order:
`repertoire-gap-finding`, `onramp-guard`, then this RFC). Reconciled against the
register as of this revision, with both predecessors' claims recorded: wave claim #1
(`repertoire-gap-finding`) holds **migration 15** (create-table only; no pack/run schema
claim); wave claim #2 (`onramp-guard`) holds **pack schema 0.14, run schema 0.11,
migration 16** (`rfc/README.md:11,51,110`). Every number below lands behind both. Per
the standing register rule ("a draft that cannot land behind its predecessor
renegotiates here rather than renumbering unilaterally", `rfc/README.md:54-55`), any
further predecessor motion rebases these upward — the F2/F3 precedent
(`rfc/README.md:118-125`). Pack digests are unaffected by an `$id` rebase
(`rfc/README.md:33-35`).

- **Pack schema `0.15`** (registered, `rfc/README.md:52`; behind `onramp-guard`'s
  0.14): the `stated_reasoning` interaction variant of §1. Additive; all
  committed packs and fixtures validate unchanged; no digest moves.
- **Migration `17`, `STORAGE_VERSION` 16→17** (registered, `rfc/README.md:111`; lands
  behind `onramp-guard`'s claimed migration 16. Shipped `STORAGE_VERSION` today is 14,
  `apps/server/src/storage.ts:323` — 15 and 16 are the predecessors' unimplemented
  claims, which is why this row cannot renumber without renegotiating the wave):
  stamp-only run-schema bump for the new event type, frozen literals `"0.11"` → `"0.12"`
  (the freeze rule itself is the migration-9/11 lesson, `rfc/README.md:103-105`).
  No table is created: cross-run lookup rides the existing `attempts` projection (§4),
  and transcripts live in the append-only event log.
- **Run schema `0.12`** (behind `onramp-guard`'s claimed 0.11, which stamps
  `"0.10"`→`"0.11"` in its migration 16; `repertoire-gap-finding` claims no run schema
  change): adds `reasoning.recorded` to the closed event union. Constants:
  `DRILL_RUN_SCHEMA_VERSION` (`packages/schema/src/index.ts:1`),
  `DRILL_PACK_SCHEMA_VERSION` (`packages/schema/src/index.ts:2`).

### 9. Boundary conditions

- **Double recording**: second POST for the same `checkpointEventSeq` →
  `INVALID_REQUEST`; the run is unchanged.
- **Wrong node / stale cursor**: `nodeId` not the active cursor → `INVALID_REQUEST`
  (precedent `service.ts:1015-1017`); recording against a non-latest occurrence on the
  active branch → `INVALID_REQUEST`.
- **Wrong checkpoint kind**: checkpoint exists but interaction is `prediction`,
  `intent_capture`, or absent → `INVALID_REQUEST` (precedent `service.ts:1012-1014`).
- **No pack**: position sessions and imported runs cannot reach this endpoint
  (`#requiredRegisteredPack` refusal path).
- **Rewind and re-entry**: events are durable; rewinding past a recorded checkpoint
  deletes nothing. Re-reaching the same checkpoint id on a new branch is a new
  occurrence with its own `checkpoint.reached` seq; recording is permitted again, and
  the earlier occurrence becomes the you-vs-you left column. Reveal already granted
  stays granted.
- **Skip**: recorded, unlocks reveal, produces zero `detected` entries, renders its
  fixed sentence; a skipped occurrence still appears as a prior attempt (shown as
  "declined to state reasoning"), because pretending it did not happen would falsify the
  attempt history.
- **Empty-ish transcripts**: `plan` is required non-empty; `candidates` may be empty
  (a learner may have considered exactly one move); `fears` may be empty. All-caps,
  mixed-Unicode, or diacritic text matches through NFKC casefolding.
- **Illegal move tokens** in learner text: fall back to literal matching (§3.2); the
  matcher never resolves an illegal token to a "nearest" legal move.
- **Learner text is never validated as chess**: whatever they type is quoted verbatim
  and attributed to them. The product renders their words; it does not correct, filter,
  or grade them.
- **Live sessions**: recording is writer-leased, so participants/spectators cannot
  record; `#refuseWhileMatchLive` applies as it does to predictions. Explicitly granted
  readers of the run see recorded transcripts per the §4 closed visibility list; the
  prior-run column is owner-only (§4); anonymous share tokens and PGN never carry a
  transcript (§4).
- **Pack re-version**: a new digest of the same `packId` starts the you-vs-you history
  empty by design (§4 alignment rule); prior-digest transcripts stay readable in their
  own runs and are never re-attached to a re-authored checkpoint.
- **Oversize input**: refused atomically; nothing appended, nothing revealed.
- **Matcher evolution**: `matcherVersion` in the event; recorded detections are never
  recomputed. A future matcher change is a run-schema-visible contract change, not a
  silent regrade.
- **LLM failure modes**: quotation not verbatim → rejected; unknown or
  already-detected key-point id → rejected; two failures → silence; provider absent →
  control absent. No path persists provider output or alters detections.
- **Segment-end packs**: an unrecorded stated-reasoning checkpoint holds back its
  segment's attributed reveal (§6); the client's forced submit-or-skip at the pause
  makes this unreachable in normal play, and the server rule holds for hostile clients.
- **Author lists a key point whose phrases appear in the checkpoint label**: permitted —
  the label is shown only after recording, so it cannot prompt the learner's text.
  The pack projection leaks neither label nor phrases (§6).

## Deviations from design

1. The BACKLOG transcript sketch (`design/BACKLOG.md:250`) lists five ChessMotive-derived
   rows (candidates → shortlist → chosen move → line → judgment). This RFC ships three
   (candidates / plan / fears): the shortlist row collapses into candidates for typed
   entry, and the concrete-line row requires a both-colours line editor whose endpoint
   the shipped prediction interaction already records (see Motivation, out-of-scope).
   The union is closed; widening it is a pack-schema change with its own register claim.
2. The audit row 19 sketch (`adoption-audit.md:76`) costed "key-point vocabulary on
   claims"; this RFC instead puts key points on the checkpoint interaction and lets a
   key point *reference* a claim (§1), because coverage is checkpoint-scoped and
   occurrence-attributed while `feedbackClaims` are pack-scoped.
3. `design/05-in-run-experience.md:71` (rung-0 scope corrections) is honored by reusing
   the shipped structural sentences unmodified rather than authoring new ground
   renderings. No design doc is contradicted; none of §1–§9 grades a move, which keeps
   law 8 and the `design/01` grading rejections intact.

## Acceptance criteria

**A1 — Format.** Pack schema (0.15) validates the new variant; negative
fixtures for each refusal in §7; the v0.1 archive fixture still fails for its existing
reasons; all committed packs and `schemas/drill_pack.example.json` validate unchanged
with unmoved digests.

**A2 — Record shape.** Runtime tests: append-time validation for `reasoning.recorded`
(skip/transcript/empty-detections triple equivalence, exactly one detection entry per
authored key point when typed, `match` present iff detected, span bounds, occurrence
pairing) in the
`events.ts:266-275` style; matcher unit tests covering move-token equivalence at a real
FEN, word-boundary behavior, NFKC casefolding, first-match span capture, and the
independent-evaluation property.

**A3 — Ordering.** Server tests: authored items for a stated-reasoning occurrence are
absent from `/runs/:id/authored-feedback` before recording and present after; the
segment-end variant; double-record, wrong-node, wrong-kind, no-pack, oversize refusals;
skip unlocks reveal; participants and spectators cannot record.

**A4 — You-vs-you.** Server tests: an in-run second occurrence returns the first as
previous attempt; a duplicate-run attempt of the same pack+digest returns the prior
run's transcript with its *stored* detections; a foreign learner's run never appears;
absence renders the fixed sentence.

**A5 — Comparator.** With the mock/external provider: a verbatim-quotation proposal
passes and renders under the fixed frame with the learner's raw (unnormalized) span; a
non-verbatim quotation, an unknown or already-detected id, an oversize quotation, and a
smuggled judgment word are each rejected; provider prose outside the (id, quotation)
pairs never reaches the rendered surface; second failure yields silence; no event, no
persistence; unconfigured provider returns `VOICE_UNAVAILABLE`.

**A6 — Browser walkthrough** (extends `tests/browser/drill.spec.ts` at zero retries; the
Playwright config sets no `retries`). Using a fixture pack with a stated-reasoning
checkpoint: play to the checkpoint; assert the sheet shows the three-row form and **no
authored prose**; type candidates, plan, and fears; submit; assert at least one
"Mentioned — matched" row quoting the typed words, at least one "Not detected in your
words" row, the byte-fixed honesty sentence, and per-point ground attributions. Assert
forbidden strings: within the reasoning surface, page content contains none of `score`,
`%`, `correct`, `incorrect`, `wrong`, `accuracy`, `grade`, `pass`, `fail`, and no
detected/total ratio rendering. Rewind, fork, reach the same checkpoint, and assert the
previous attempt's transcript renders beside the new form. Record again and assert both
occurrences appear.

**A7 — Nothing existing moves.** The full suite passes from the verified baseline —
**432 tests across 73 files** (re-verified by suite run for this draft, 2026-08-14,
exit 0) — and the zero-retry browser baseline (21 authored browser tests across
`drill.spec.ts`/`match.spec.ts`/`maia-latency.spec.ts`, the Maia case optional). The
migration fixture check follows the A7 social-match shape at this draft's slot: a
database at `STORAGE_VERSION` 16 (the predecessors' claims applied) migrates to 17 with
every row surviving byte-identical; today's shipped databases sit at 14
(`apps/server/src/storage.ts:323`) and cross 15 and 16 under the predecessors' own
fixtures first.

**A8 — Docs.** `docs/drill-pack-format.md` gains the interaction variant;
`docs/explanation-grounds.md` gains the reveal-ordering rule; `docs/drill-client.md`
gains the sheet flow; a new `docs/` page or a section documents the matcher's honesty
contract and the never-produced list verbatim.

## Open questions

None.

## Proposed ledger and register rows (owner-tier; not implementer tasks)

- `design/BACKLOG.md:208` (open-answer key-point grading): 💡 → 📜 scheduled against
  this RFC.
- `design/BACKLOG.md:250` (step-indexed reasoning transcript): 💡 → 📜 scheduled against
  this RFC, noting the three-row deviation and that the category-scan row
  (`design/BACKLOG.md:251`) remains open.
- `rfc/README.md`: the pack-schema register row **0.15** (`rfc/README.md:52`) and
  migration register row **17, STORAGE_VERSION 16→17** (`rfc/README.md:111`), both
  behind `onramp-guard`'s claims (0.14 / 16), are **already recorded**. Two register
  corrections are owed in the commit that lands this draft (register edits are
  single-writer and are reported here, not made by review): the migration-17 row
  currently reads "creates `reasoning_records`", which contradicts §8 — the correct
  body is **stamp-only, run schema `"0.11"` → `"0.12"`, no table created**; and the
  run-schema claim **0.12** (behind `onramp-guard`'s 0.11) should be recorded in the
  row and the Active table beside the pack claim.

## Changelog

- 2026-08-14: created. Baseline 432/73 verified by suite run; prediction-record,
  projection, voice-seam, attempts, and register citations verified against the working
  tree.
- 2026-08-14: register reconciliation, same day. `repertoire-gap-finding`'s wave claim
  #1 (migration 15, no pack/run schema) landed while this draft was being written; §8
  rebased from migration 15 to **16** and recorded that pack schema 0.15 and migration
  16 remain provisional behind `onramp-guard`'s pending claim.
- 2026-08-14: adversarial review, same day. §8 finalized against `onramp-guard`'s
  recorded claims (pack 0.14, run 0.11, migration 16): migration **17**
  (`STORAGE_VERSION` 16→17), run schema **0.12** with frozen literals `"0.11"`→`"0.12"`
  — the prior draft's run-schema claim of 0.11 collided with `onramp-guard`'s and its
  migration number was internally inconsistent (16 with 16→17). Ledger section now
  records the owed `rfc/README.md` correction (migration-17 row says "creates
  `reasoning_records`"; the correct body is stamp-only, no table). Fixed the §2
  append-validation iff (a typed transcript that matches nothing is all `not_detected`,
  not an empty array) and stopped overclaiming the prediction precedent (it has no
  occurrence pinning, skip, or double-record guard). Added: §1 per-kind statement of
  what load validation proves (truth check is `structural`-only; `claim` truth is the
  author's declaration, not product-verified); §3 miss-rate ownership (no product-global
  synonym/stemming layer ever; detections feed no metric); §4 digest-strict you-vs-you
  alignment owned as a deliberate orphaning trade-off; §4/§9 closed visibility list for
  learner text (grant-scoped run reads only; story tokens, PGN, pack projection, and
  match opponents excluded by construction); §5 comparator loop pinned as
  parse-then-check-then-template with raw-verbatim quotations, per-point/length caps,
  and provider prose never rendering. Stale line citations refreshed
  (`rfc/README.md` shifted by the wave's register rows; `docs/n-way-comparison.md`).
  Baseline re-verified by suite run: 432/73, exit 0; 21 browser tests, no `retries`
  key.
