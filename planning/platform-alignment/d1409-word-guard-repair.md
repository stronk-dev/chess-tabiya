# D1409 — the word-guard repair: where it lands, what it changes, and what it does not close

**What this is.** The routing and specification for owner ruling [[D1409]] (2026-08-23), which
repairs defect [[D1406]] in `packages/runtime/src/voice.ts`. It is a planning document, not an RFC
and not an implementation. It answers four things: which document owns the repair, whether the
ruling is enforceable against the shipped signature, what every caller needs, and what the ruling
does **not** close.

**What it deliberately is not.** It does not edit `voice.ts` — law 1: no implementation before an
accepted RFC, and §1 finds that the accepted RFC owning this surface is archived, so the repair
needs a home before it needs a diff. It edits no RFC, no `design/BACKLOG.md` row and no log.

**The ruling, verbatim** (`design/BACKLOG.md:1698`): *a judgement word is permitted **only inside
the exact rendered sentence that grounds it, byte-matched**, and is banned everywhere else in the
output — including elsewhere in the same packet.* Chosen over the alternative repair because it
survives future producers: each grounded sentence licenses its own words and nothing else.
`rfc/review-map.md` may not be accepted before `voiceCheck` enforces it (`rfc/review-map.md:326`).

---

## §1 — Ownership: an accepted RFC does own `voiceCheck`, and it is archived

**The owning documents, found by search across `rfc/` and `rfc/archive/`:**

| Document | Status | What it owns |
|---|---|---|
| `rfc/archive/adaptive-guidance.md` | **implemented** | Ships `voiceCheck` (`:756`, *"pure, testable, and shared"*), `CHESS_LEXICON` (`:763`), `PRESCRIPTIVE_VERBS` (`:765`), the renderer boundary (`:796`), the reject→retry→deterministic-fallback path (`:861`), and the paraphrase-attack fixtures (`:947`, `:1024-1026`). **It also states the packet-relative rule in the exact words the ruling overturns:** *"any lexicon word in the output must occur in the packet's serialized text, case-insensitive, whole-word"* (`:763`) and the same clause for verbs (`:765`) |
| `rfc/archive/evidence-contract-manifest.md` | **implemented** 2026-08-21 | Amends the signature: *"`voiceCheck(rendered, output)` replaces `voiceCheck(packet, output)`"* (`:463-464`); brands the view and asserts it (`:1059-1065`); registers consumer `guidance.voice` (`:699`) |

So: **the surface is specified, accepted and shipped.** The repair is not an invention with no home
and not a DESIGN-GAP.

**It is also not an in-place amendment.** `rfc/0000-rfc-process.md` rule 3 is explicit: *"small
clarifications to a **not-yet-implemented** RFC are edited in place… **Anything that changes
implemented behavior is a follow-up RFC linked to the archived parent, which remains immutable**."*
The packet-relative licence is implemented behaviour, quoted verbatim above, and `rfc/archive/` is
immutable under law 2 besides.

### Recommendation

**A new follow-up RFC** — proposed slug `rfc/grounded-word-licence.md` —
`Parent / amends: rfc/archive/adaptive-guidance.md` (the voice contract, §voice) **and**
`rfc/archive/evidence-contract-manifest.md` (the sealed rendered view it reads). Both parents stay
immutable and are linked, per rule 3. Precedent for a defect-shaped follow-up RFC exists twice in
this repo: `rfc/archive/defect-sweep.md` and `rfc/archive/defect-batch-2.md`, both drafted from
`design/BACKLOG.md` defect rows exactly as this one would be.

### The four alternatives, and why each is refused

- **`rfc/review-map.md`** (draft) — refused. Its own acceptance criteria are gated on the repair
  (`:326`), and the ruling says the repair is *"**not** folded into O7 — it is a live defect with its
  own repair."* A document cannot specify the precondition that blocks it and still be blocked by it.
- **`rfc/move-quality-grades.md`** (implementing) — refused, and this is the near miss. It is the
  producer whose sentence created the exposure, it already claims a `voice.ts` edit (§6: adding
  `"inaccuracy"`/`"inaccurate"` to `BANNED_JUDGEMENTS`, since landed — both are in the shipped list
  at `voice.ts:97` `[V]`), and it owes a register amendment anyway for [[D1408]]. But its §6 claim is
  an **additive vocabulary** claim; D1409 is a **mechanism** change to a shipped guard, and §4 below
  shows §6's central argument *depends on* the mechanism being packet-relative. A projection RFC
  should not own the repair that invalidates its own reasoning. It should cite it, and amend §6.
- **`rfc/theory-knowledge-pipeline.md`** (draft) — refused. [[D1410]] finding 4 makes it a
  *consumer* of the repair, and it is itself acceptance-blocked. Same objection as review-map.
- **A direct edit to `voice.ts`** — refused. Law 1.

### A cross-draft ownership pin is owed ([[D1381]])

Four in-flight documents write to or assert `voice.ts` symbols. The pin belongs in
`rfc/README.md` §Cross-draft ownership pins **before** the follow-up RFC is commissioned:

| Document | Status | Claim on `voice.ts` |
|---|---|---|
| proposed `grounded-word-licence.md` | — | **`voiceCheck`, `absentWords`, the licence rule.** The mechanism, and nothing in the lists |
| `rfc/move-quality-grades.md` `:389` | implementing | two words added to `BANNED_JUDGEMENTS` (landed) |
| `rfc/bounded-policy-targets.md` `:680`, `:778` | draft | adds `best`, `mistake`, `good`, `bad`, `prevented`, `unavoidable` to `BANNED_JUDGEMENTS` |
| `rfc/player-style.md` criterion 8 | draft | a **new** symbol `STYLE_REFUSED_TERMS` beside the lists |
| `rfc/learner-rating.md` AC-12 | implementing | asserts `BANNED_JUDGEMENTS` by symbol; writes nothing |

The lines are disjoint by construction — **mechanism versus vocabulary** — so landing order is free
in either direction, provided the follow-up RFC touches no list member. Criterion 10 in §8 asserts
exactly that, so the pin is enforced by a test rather than by a promise.

---

## §2 — What the current rule does, and what the ruled rule is

### Current: packet-relative subset test

```ts
function absentWords(words, packet, output) {
  const allowed = packet.toLowerCase();
  return words.filter((word) => new RegExp(`\\b${word}\\b`, "i").test(output)
                             && !new RegExp(`\\b${word}\\b`, "i").test(allowed));
}
// voice.ts:112
const source = view.items.flatMap((item) => item.sentences).join("\n");
```

The `.flatMap(...).join("\n")` is the defect in one expression: the view arrives **sentence-granular**
(`evidence-contract.ts:186-195` — `RenderedEvidenceItem.sentences` is `readonly string[]`) and
`voiceCheck` throws that partition away on its first line.

**Measured at HEAD** `[V]`, replicating `absentWords` over the shipped list against a packet whose
only sentence is the shipped grade rendering
(`"Mistake — the recorded evaluation moved +1.00 (59.1%) to −1.00 (40.9%) across this move, a drop of
18.2 win-points against a threshold of 10 (grade-convention@1/review)."`):

- output `"That was a blunder and a mistake; the plan was bad."` → violations `["bad", "blunder"]`.
  **`mistake` passes**, free-form, ungrounded, anywhere on the surface. That is [[D1406]] reproduced.
- **`plan` is in no list at all** — measured against all three: `BANNED_JUDGEMENTS` (32),
  `PRESCRIPTIVE_VERBS` (24), `CHESS_LEXICON` (18). So are `plans`, `initiative`, `compensation`,
  `pressure`, `control`, `space`. This matters for §6.

**One vector sharper than the ledger row.** [[D1406]] says one grade sentence frees *mistake* **and**
*blunder*. Strictly, it frees *its own* class word plus any other banned word appearing anywhere in
the packet's sentence set — so *blunder* becomes free only once some packet sentence names it. On the
Review Map that is close to automatic: `renderMoveQualityGrade`'s mate arms print tier text naming
the ladder (`grade.ts:192-194`), and any caption enumerating the closed class
`inaccuracy | mistake | blunder` (`grade.ts:3`) puts all three in the packet at once. **The
closed-class caption is the escalation vector**, and it is precisely the surface [[D1273]] ruled.

### Ruled: licence-by-span

Stated as an algorithm, because "byte-matched" is only buildable if the matching procedure is total
and deterministic:

> **Licence-by-span.** Let `S` be the set of rendered sentences of the view — each individual
> `RenderedEvidenceItem.sentences[i]`, never the join. Scan `output` left to right for
> **byte-exact, non-overlapping** occurrences of members of `S`, taking the **longest** match at each
> position. Call these the **grounded spans**. The **residue** is `output` with every grounded span
> deleted. A listed word is a violation **iff it occurs in the residue**. Grounded spans are exempt
> *by identity*: their bytes came from a registered renderer over an admitted `DeclaredEvidence`.

Properties, stated so an implementer cannot pick a different one:

1. **Deterministic.** Leftmost, longest, non-overlapping is a total order; equal-length equal-byte
   candidates are indistinguishable, so ties cannot arise.
2. **Byte-exact means byte-exact.** No case folding, no Unicode normalisation, no whitespace
   collapse, no punctuation tolerance. `renderMoveQualityGrade` emits three non-ASCII glyphs — `—`
   (U+2014), `→` (U+2192), `−` (U+2212) — and all three must be reproduced. This is the whole
   strength of the rule; every relaxation is a knob whose safe value nobody can derive.
3. **No word→sentence bookkeeping.** Licence attaches to a span, not to a word. There is no union
   step, which is what makes overlapping vocabulary a non-event (§5c) — the current rule's union
   *is* the defect.

---

## §3 — Is it enforceable without a signature change? **Yes. The caveat is larger than the signature.**

**The finding: no signature change is required, and none should be made.**
`voiceCheck(view: RenderedEvidenceView, output: string): VoiceCheckResult` already carries
everything licence-by-span needs. `renderEvidenceItems` (`evidence-contract.ts:405-415`) builds each
item's `sentences` from one registered renderer over one admitted evidence item and seals the result
with the `ADMITTED` brand; `assertRenderedEvidenceView` (`:399-403`) is already called on entry
(`voice.ts:111`). The sentence partition is inside the brand. The repair is to **stop joining**, not
to change the seam. No change to the renderer contract, the provider contract, or
`VoiceProvider.render`'s arguments.

`apps/server/src/evidence-contract.typecheck.ts:11` is a standing argument for leaving the signature
alone: it exists to assert that `voiceCheck(packet, …)` is a *type error*. Any signature change
re-opens that.

**The caveat, stated plainly, because it is the real cost of the ruling.** Byte-exact spans mean the
LLM renderer's only way to utter a judgement word is to **quote the deterministic sentence
verbatim**. It cannot paraphrase one. Under D1409, "re-voicing a grade" is a copy operation, not a
rewording. Three consequences:

1. **`rfc/move-quality-grades.md` §6 (`:380-389`) is invalidated as reasoning and must be amended.**
   It argues, in the RFC's own words, that *"once the deterministic co-rendered sentence is in the
   packet the LLM may re-voice 'mistake' but never escalate"* and that *"the co-rendered sentence
   **is** the allow-list entry."* That is the packet-relative mechanism by name. Its **outcome**
   survives and is strengthened — escalation was already caught, and borrowing now is too — but the
   mechanism sentence becomes false the day the repair lands. `move-quality-grades` is accepted, so
   this is a register amendment, and it can ride the [[D1408]] threshold amendment already owed.
2. **The production path fails safe.** `renderVoice` (`guidance.ts:163-170`) retries once, then
   returns `appendRecordedReadings(deterministic, packet)` — the byte-identical deterministic
   sentence set. Tightening `voiceCheck` can only move the provider path *toward* deterministic
   text, never toward unguarded output. **The repair has no unsafe failure mode**, only a
   fallback-rate cost.
3. **That fallback rate is the one thing nobody has measured**, and it should be measured before
   acceptance rather than asserted after. `tools/r5-renderer-harness/` already drives the real
   `voiceCheck` over renderer output (`renderer.test.ts:224`) and is the instrument. Criterion 8.

**What the signature genuinely cannot carry — recorded now so the next ruling knows its price.** An
output→source *alignment* ("which paraphrased span came from which sentence") is not derivable from
`(view, output)`. If a later ruling relaxes byte-exactness to admit paraphrase, the provider would
have to return **spans with provenance**, not a string, and *that* is a signature and
renderer-contract change. **D1409 as ruled does not require it**, and the byte-exact form is what
makes the rule decidable at all.

---

## §4 — Every caller and consumer of `voiceCheck`, and what each needs

Exhaustive over `apps/`, `packages/` and `tools/` at HEAD (`git grep`, excluding `dist/`).

| # | Site | What it is | What it needs |
|---|---|---|---|
| 1 | `apps/server/src/guidance.ts:166` | **The only production call site** — confirms [[D259]]'s count still holds at HEAD `[V]` | **Nothing.** Same signature, same retry, same fallback. Behavioural change: more deterministic fallbacks |
| 2 | `apps/server/src/guidance.test.ts:137-138` | square violation + `EVIDENCE_GENERIC_BYPASS` assertion | Nothing. A bare square is not a byte-exact sentence, so it stays a violation; the bypass arm is untouched |
| 3 | `packages/runtime/src/adaptive-guidance.test.ts:201-210` | the six voice fixtures + three list assertions | **New fixtures** (§8). All six survive unchanged: none of those strings is a byte-exact packet sentence, and `:207` (*"The tall one wants a friend beside it."*) contains no listed word |
| 4 | `apps/server/src/evidence-contract.typecheck.ts:9,11` | type-level only; `:11` asserts the old signature is an error | Nothing — **and it is a reason not to change the signature** |
| 5 | `apps/server/src/pack-validation.ts:15,192` | `KEY_POINT_JUDGEMENTS = new Set(BANNED_JUDGEMENTS)` over `ReasoningKeyPoint.phrases` | **Nothing, and this must be said out loud.** It does not call `voiceCheck` and is not packet-relative. The ruling does not reach it. It is [[D421]]'s other half — authored prose with no gate — and a reader who assumes the repair covered it will be wrong |
| 6 | `packages/runtime/src/rating.test.ts:78` | learner-rating AC-12: rating copy intersects `BANNED_JUDGEMENTS` nowhere | Nothing. Vocabulary only |
| 7 | `tools/feedback-stage1-criteria-harness/criterion20.test.ts` | both lists over **authored** rows; no `voiceCheck` | Nothing. Its 46-row figure (`output.md:4`) is unaffected |
| 8 | `tools/r5-renderer-harness/renderer.test.ts:224` | calls the **real** `voiceCheck` over renderer output | **Must be re-run; its numbers will move.** This is the fallback-rate instrument for criterion 8 |
| 9 | `packages/runtime/src/evidence-catalog.ts:873` | consumer row `guidance.voice`, implementation string names `voiceCheck` | Nothing |
| 10 | `packages/runtime/src/index.ts:101-105` | re-exports `voiceCheck` and all three lists | Nothing |
| 11 | `docs/adaptive-guidance.md:164`, `docs/evidence-contract.md:61` | canonical description of the packet-relative rule | **Both become wrong the day the repair lands.** Owed in the implementing commit, per the RFC completion protocol |

**One route is out of scope and is named rather than discovered later.** `/reasoning-review` calls
the provider directly and filters the response with `reasoningMatchCheck`, **never calling
`voiceCheck` at all** ([[D259]], `rfc/archive/evidence-at-runtime.md:1779`). Tightening the checked
route while an unchecked route exists widens the asymmetry between them. Open question 3.

---

## §5 — The hard cases, and how licence-by-span handles each

**(a) A word in a grounded sentence *and* legitimately elsewhere — *"best"* inside a quoted source
passage.** Two grounded sentences, two spans, two independent licences. Byte-exact reproduction of
the quoted passage licenses *best* **inside that reproduction only**; free prose around it is residue
and inherits nothing from either span. This is exactly what *"survives future producers"* buys:
adding a producer adds spans, never vocabulary.

**(b) A paraphrase that reorders the grounded sentence.** **Refused.** Not byte-exact → not a span →
residue → violation → retry → deterministic fallback. No partial credit, no edit distance, no
similarity threshold. Stated as an *intended property*, not an omission: any threshold is a number
nobody in this repo can derive, and a criterion whose threshold nobody can derive is [[D984]]/[[D444]]'s
class. The cost is §3's caveat and it is the cost the owner accepted.

**(c) Two grounded sentences licensing overlapping words.** A non-event **by construction**. Licence
is per-span, so overlap is invisible to the rule — there is no union step to get wrong. Contrast
with the current rule, where the union *is* the mechanism and *is* the defect. Criterion 5 makes the
distinction falsifiable, because building a per-word union of the matched spans is the natural wrong
fix and it would pass every other criterion here.

**(d) The motivating case — a grade sentence plus free prose on the same surface.** The grade
sentence reproduced byte-exact is one exempt span. The free prose is residue: *mistake*, *blunder*,
*bad* in it are all violations. This is the case measured green at HEAD in §2, and it goes red.
Criterion 1.

**(e) A grounded sentence quoted with an added prefix or suffix in the same paragraph** — e.g.
`"Here: Mistake — the recorded evaluation moved …, and it was bad."` The span still matches (it is a
substring); the prefix and suffix are residue and are judged on their own. `bad` is a violation,
`Mistake` is not. Correct, and worth a fixture because it is the shape a persona renderer will
actually produce.

**(f) The escalation-by-caption vector (§2).** Under the current rule, a caption naming the closed
class frees all three words across the surface. Under licence-by-span the caption is one span, and a
class word used outside it is a violation. **Repaired.**

**(g) A degenerate grounded sentence.** If any registered renderer ever emits a bare word — or a
bare square — as a `sentences[i]` entry, licence-by-span **degenerates to the current rule for that
token**, because the one-word span then matches everywhere the word appears. `renderMoveQualityGrade`
cannot do this (`assertMoveQualityGradeSentence`, `grade.ts:208-210`, and F-COR-1), but nothing
*general* forbids it, and the whole point of the ruling is to survive producers nobody has written
yet. The rule therefore needs a floor at the registration boundary. Criterion 6.

---

## §6 — Does it close the quoted-prose case ([[D1410]] finding 4)? **Partly. As worded, no.**

[[D1410]]-4: `rfc/theory-knowledge-pipeline.md` is the first thing to put third-party chess **prose**
into the packet, and because `absentWords` is packet-relative, *"a quoted passage's squares, moves
and `plan`/`best`/`strong`/`should` all become renderable."* The row ends *"[[D1409]] repairs (4)."*
Verified against the shipped lists, that is **too strong**:

| Leaking class | In which list | Repaired by D1409 as ruled? |
|---|---|---|
| `best`, `strong`, `should` | `BANNED_JUDGEMENTS` `[V]` | **Yes** |
| `plan` (also `plans`) | **none of the three** `[V]` | **No — and no scoping rule can repair a word no list contains.** A vocabulary gap, owned by whichever RFC lands third-party prose |
| squares (`d5`), moves (UCI/SAN) | the `SQUARE`/`UCI`/`SAN` arm — a **separate** `source.toLowerCase().includes(token)` test at `voice.ts:114`, not `absentWords` | **No.** The ruling names judgement words; this arm is untouched. A quoted Nimzowitsch passage still licenses every square and move it names, free-form |
| `CHESS_LEXICON` nouns | third `absentWords` arm | **No.** Still packet-relative |
| `PRESCRIPTIVE_VERBS` (`prepare`, `attack`, `defend`, `avoid`, `prevent`, `aim`) | fourth `absentWords` arm | **No.** Still packet-relative |

So D1409 repairs **one of the four classes** D1410-4 names, and the two largest — squares and moves
— stay open.

### Recommendation (put back as an open question, not assumed)

**Apply licence-by-span uniformly to all four arms.** Reasons: (1) the ruling's own justification —
*"each grounded sentence licenses its own words and nothing else"* — is class-agnostic and reads as
a statement about grounding, not about vocabulary; (2) leaving three arms packet-relative gives one
function two contradictory scopes, which is the condition that made [[D1406]] possible in the first
place; (3) it costs nothing extra, because the span computation is shared across all four arms.

**Stated honestly, this widening is beyond the owner's words**, so it is Open question 1 rather than
a decision this document takes.

**Cost, if it is adopted.** The square/move arm uses `String.includes`, not a word boundary, so a
substring licence exists today (`sf-a1x` licenses `a1` — [[D226]](2), executed in the archived RFC).
Span-scoping does not fix that; it should be fixed in the same change or explicitly deferred. Open
question 2.

**And even with the uniform rule, D1410-4 is not fully closed.** The residue is [[D146]]: two
byte-exact quotations placed side by side still let a reader — or the model, by juxtaposition —
take away a claim neither source makes. Token scoping cannot reach a join. **Named, not solved**,
per the [[D266]] convention that an instrument's description must name what it inspects rather than
what it is used for.

---

## §7 — Open questions for the owner

1. **Does licence-by-span apply to all four arms, or to `BANNED_JUDGEMENTS` alone as the ruling
   literally says?** Recommendation: all four (§6). This is the difference between repairing a
   quarter of [[D1410]]-4 and repairing three quarters of it.
2. **Is the `includes` → word-boundary fix on the square/move arm ([[D226]](2)) in scope for the same
   change?** Recommendation: yes — it is a small edit and the counter-example fixture already exists
   in the archived RFC.
3. **`/reasoning-review` runs with no `voiceCheck` at all ([[D259]]).** In scope, or a separate row?
   Recommendation: separate — but it should become a row now, because this repair makes the
   checked/unchecked asymmetry between the two provider routes larger, not smaller.

---

## §8 — Proposed acceptance criteria

Each names the concrete tree state that makes it fail. Criteria that cannot go red are a named
defect class here ([[D444]] — measures nothing; [[D984]] — nothing can pass; [[D1274]] — nothing can
fail), so each entry below states its RED condition explicitly.

1. **The motivating case goes red.** View whose single item's sentence is the shipped
   `renderMoveQualityGrade` output for a `mistake` grade; output = that sentence byte-exact **plus**
   `" That was a blunder and a mistake; the plan was bad."` Violations contain `judgement:mistake`,
   `judgement:blunder` and `judgement:bad`.
   **RED at HEAD:** measured today the violations are `["bad", "blunder"]` `[V]` — `mistake` is
   absent because the packet contains it. This criterion fails against the tree as it stands. That
   is the point.
2. **Verbatim quotation still passes.** Same view; output = the grade sentence byte-exact and
   nothing else. `valid === true`.
   **RED against** the alternative repair the owner did *not* choose — banning judgement words
   unconditionally — which would break every grade surface.
3. **Paraphrase is refused, and "byte-matched" has teeth.** Same view; three arms: `→` replaced by
   `to`; the class word lower-cased; one operand reworded. Each yields `judgement:mistake`.
   **RED against** any normalising matcher — `toLowerCase()`, NFKC folding, whitespace collapse, or
   punctuation tolerance in the span comparison. This is the criterion that stops the implementation
   quietly softening the ruling into something easier to pass.
4. **Licence does not travel between spans.** Two items: A's sentence contains *mistake*, B's
   contains *strong*. Output = A's sentence byte-exact + `" The knight is strong here."` →
   `judgement:strong` present.
   **RED at HEAD** — B's sentence is in the packet today, so *strong* is licensed. This makes the
   ruling's *"survives future producers"* property falsifiable rather than aspirational.
5. **Overlap is a non-event.** Two items whose sentences both contain *best*; output = one of them
   byte-exact + free prose containing *best* → `judgement:best`.
   **RED against** an implementation that builds a per-word union of licensed vocabulary from the
   matched spans. That is the natural wrong fix, it passes criteria 1–4, and only this criterion
   catches it.
6. **A degenerate grounded sentence cannot manufacture a licence.** A registered renderer whose
   `sentences[i]` is a single listed word, or a bare square/UCI/SAN token, is rejected with a named
   error code at the registration boundary (`renderEvidenceItems`).
   **RED at HEAD** — nothing forbids it today — **and RED against** an implementation that guards
   only `renderMoveQualityGrade` instead of the boundary. Stands regardless of how open question 1
   is answered; only its token classes change.
7. **The production path falls back rather than emitting residue.** `renderVoice` with a provider
   returning residue-carrying output twice returns `source: "deterministic"` and text byte-identical
   to `appendRecordedReadings(deterministic, packet)`.
   **RED against** an implementation that downgrades violations to warnings, or that strips the
   offending words and still reports `source: "provider"`.
8. **The fallback-rate cost is measured, not asserted.** `tools/r5-renderer-harness/` is re-run under
   the new rule and the RFC records the before/after provider-acceptance rate **as a number**.
   **RED if the number is absent.** This is a criterion about the document, and it exists because
   §3's caveat is the only real cost of the repair — a paragraph asserting the cost is "acceptable"
   would be [[D1240]]'s class (a hand-waved total in place of a measured baseline).
9. *(only if open question 1 is answered "all four arms")* **A quoted third-party passage licenses no
   token outside itself.** View whose item is a rendered quoted passage naming `d5` and `e4`; output
   = that passage byte-exact + `" Play d5 now."` → both `square:d5` and `prescription:play`.
   **RED at HEAD on both counts.**
10. **The vocabulary lists are untouched by this change.** At the commit landing the mechanism:
    `BANNED_JUDGEMENTS.length === 32`, `PRESCRIPTIVE_VERBS.length === 24`,
    `CHESS_LEXICON.length === 18`, asserted by symbol (all three measured at HEAD `[V]`).
    **RED against** an implementation that "fixes" [[D1406]] by adding words instead of changing the
    scope, and it keeps this RFC's line disjoint from the four drafts holding vocabulary claims (§1's
    pin) — enforced by a test rather than by a promise.

**Considered and rejected as unfailable.** *"`voiceCheck` is sentence-relative"* — a description, and
no value can violate a description ([[D1274]]'s class). *"No law-8 violation reaches a learner"* —
unmeasurable, [[D444]]'s class.

---

## §9 — What is owed next, by whom

This document takes no action on any register. Whoever commissions the follow-up RFC owes, in the
commissioning or landing commits:

- the **cross-draft ownership pin** in `rfc/README.md` §Cross-draft ownership pins (§1's table),
  **before** drafting, per [[D1381]];
- the **`rfc/move-quality-grades.md` §6 amendment** through the register (§3, consequence 1) — it can
  ride the [[D1408]] threshold amendment already owed;
- a `design/BACKLOG.md` row for the **`plan`-class vocabulary gap** (§6) — no list contains it, and
  law 4 says an idea missing from the ledger is a process bug;
- on implementation: `docs/adaptive-guidance.md:164` and `docs/evidence-contract.md:61`, both of
  which describe the packet-relative rule and both of which become wrong;
- the `planning/platform-alignment/log.md` entry, and the [[D1406]]/[[D1409]] row flips, in the commit
  that ships the repair.

---

## Appendix — measurements, all at HEAD, 2026-08-23

All `[V]`, by execution against the shipped constants copied verbatim from `voice.ts:93-100`:

- `BANNED_JUDGEMENTS.length === 32`; `PRESCRIPTIVE_VERBS.length === 24`; `CHESS_LEXICON.length === 18`.
- `plan`, `plans`, `initiative`, `compensation`, `pressure`, `control`, `space` — in **none** of the
  three lists.
- `mistake`, `blunder`, `best`, `strong`, `should` — all in `BANNED_JUDGEMENTS`.
- `absentWords(BANNED_JUDGEMENTS, "<the grade sentence>", "That was a blunder and a mistake; the plan
  was bad.")` → `["bad", "blunder"]`. `mistake` and `plan` both pass.
- `voiceCheck` production call sites in `apps/` + `packages/`: **one** (`guidance.ts:166`).
- `RenderedEvidenceItem.sentences` is `readonly string[]` and is populated one renderer per admitted
  item (`evidence-contract.ts:186-189`, `:405-415`) — the partition licence-by-span needs is already
  inside the brand, and `voice.ts:112` discards it.
