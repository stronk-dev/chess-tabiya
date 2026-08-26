# Proposed intent amendment — `design/06` under the native-ratings substrate

**Filed:** 2026-08-26 · **By:** claude (native-ratings lane) · **For:** OWNER
**Trigger:** `CLAUDE.md`, clause added 2026-08-24 ([[D1505]]) — *a change set that falsifies a
sentence in `design/00`–`06` adds a proposed intent amendment — the file, the exact sentence, and
what is now true — to `planning/platform-alignment/` in the same commit.*
**Change set:** `rfc/native-ratings.md` (new), drafted on [[D1414]] / [[D1520]] and discharging
[[D1516]].
**Law 5 holds:** nothing in `design/` is edited by this pass. This file reports that intent now
disagrees with the tree; it enacts nothing.

---

## 1. Narrowing owed — `design/06-campaign.md:159-162`

**Exact sentence:**

> three bosses can be that game with a rated result: the middlegame boss.** The
> ruling's encoding is `rfc/learner-rating.md` §5.3a: a rated boss is a
> `position` session played to a rules-terminal result against a calibrated rung
> — the object `POST /rated-games` already creates, the same rated-game object
> the D437 cohort standing reads

**The same construction repeats at `:453-455`:**

> encoded in `rfc/learner-rating.md` §5.3a as a `position` session played to a
> rules-terminal result against a calibrated rung (the object `POST /rated-games`
> creates; the same rated-game object the D437 cohort standing reads)

**What is now true.** Both clauses are still exactly right **about the boss** and become wrong
**about the object**, and the appositive is what joins them: *"a rated boss is X — the object
`POST /rated-games` already creates"* reads as *X is what that object is*. After
`rfc/native-ratings.md`:

- a rated game may be **against another learner**, not only against a calibrated rung
  (§6.1(a)'s rateability predicate), and
- a rated game may end by **resignation, an agreed draw or a flag**, none of which is a
  rules-terminal result (§6.1(b), on `social-play` lane 0.23 and `enforced-clocks` lane 0.21).

**The boss is unaffected and that is the point.** `social-play.md` §3.4 rule 1 refuses
`game.resigned` on a run with no `match_states` row, so a boss cannot be resigned; and §6.1(a)'s bot
arm is verbatim today's. Nothing about the campaign changes. What changes is that two sentences
written to describe the boss now also read as a definition of an object that has outgrown them —
the exact drift-by-omission [[D1505]] was added for.

**Proposed replacement clause** (the owner's to write, veto or ignore — offered so the amendment is
concrete rather than a complaint). At `:161-162`:

> a rated **boss** is a `position` session played to a rules-terminal result
> against a calibrated rung — one shape of the rated-game object `POST /rated-games`
> creates, and the same object the D437 cohort standing reads. Human-opponent and
> non-rules-terminal shapes of that object exist ([[D1414]], `rfc/native-ratings.md`)
> and are not campaign encounters.

And the same insertion of the word **boss** plus the words *"one shape of"* at `:453-455`.

**Confidence: medium.** Read strictly, both sentences are boss-scoped and need no pen at all. They
are filed because the appositive equates the boss with the object, this change set changes the
object, and `learner-rating` §5.3a — the encoding both sentences cite by name — is one of the three
places `rfc/native-ratings.md` §6 amends. A reader arriving at `design/06` after that amendment
lands would take the object's definition from a boss's description.

---

## 2. Already filed — `design/03-product-breadth.md:53-55`, second falsifier

**Exact sentence:**

> - **Position Arena:** at minimum, two-leg fixed-position sparring through
>   invitation/Lichess handoff plus PGN return; native clocks/matchmaking can
>   deepen later without erasing the surface.

**Already proposed**, by the `social-play` rebuild, at
`planning/platform-alignment/social-play/intent-amendment-2026-08-24.md` §1, whose replacement
already reads *"Native clocks and native ratings are 1.0 ([[D1414]]); native matchmaking is
unruled."*

**No second proposal is made.** This entry exists only so the count is visible: **two** change sets
now depend on that one pen, and the second is the one the owner named himself ([[D1520]]:
*"'native ratings' — like i have asked for that 10 effing times already"*). A proposal waiting on a
signature is cheap; two independent lanes waiting on it is a scheduling fact worth seeing.

---

## 3. What is NOT proposed, and why

- **`design/02-product-shape.md:98-99`** — *"No operator account exists… Administrative capability
  lives in environment and configuration, never a privileged user."* `rfc/native-ratings.md`
  **conforms**. No organiser, arbiter or operator role is created; `games.declared_by` records who
  acted and confers nothing (§3.3 rule 3); and `contests.scope_kind='classroom'` reuses
  `teacher-surface`'s shipped delegated capability rather than inventing a role, which is exactly
  what [[D1481]] found already ships. The contest aggregate is a **container**, not an authority.
- **`design/03-product-breadth.md:87-88`** (*"…and later native matchmaking reuse run, branch,
  evidence, and replay semantics"*) and **`:327`** (*"Native matchmaking stays outside minimal-real
  scope by design"*) — **untouched.** No matchmaking is specified and nothing in the RFC leans on
  `social-play.md` Open question 1, which [[D1414]] reserved. Both sentences remain true under this
  change set; they turn on that ruling, not on this one, and the
  `social-play` memo §2 already holds the drafted amendment for the branch that would falsify them.
- **`design/03-product-breadth.md:92-97`** (native match play as shipped) — **still true.** The
  paragraph describes possession, `MATCH_LIVE`, the mutually-accepted pause and byte-identical
  disclosure. This change set adds a rating and a result to that match and changes none of those
  four properties.
- **`design/05-in-run-experience.md:41`** (*"Absence is stated, never simulated"*) and **`:42`**
  (session machinery *"may never alter what the run says happened on the board"*) — **applied, not
  amended.** `:41` is the basis of §6.3's anchored-fraction disclosure and of §8's honest limits;
  `:42` is why the declared result **reads** the run's own event log (§3.3 rule 2) and never writes
  to it, and why the three non-move endings are run events owned by other RFCs rather than
  session-journal entries.
- **`design/01-training-model.md:121-127`** — *"Native matchmaking remains later implementation
  depth."* Untouched, for the same reason as §3's second bullet.
- **`design/00-thesis.md`** — no sentence to falsify. Its standing refusal of *"an engine review
  screen with a rewind button"* and of a generic bot ladder is untouched; this RFC adds no surface
  that renders a judgement and no evidence kind.

---

## 4. One thing the owner may want to see that is not an amendment

`rfc/native-ratings.md` Open question 1 records a tension the design tier states in two halves and
nowhere joins: `learner-rating` R11 voids any rated game containing a rewind, and `MATCH_LIVE`
refuses rewind, duplicate and flip while a native match is live. Together they mean **the one place
where two humans play a real game is the one place the commit → rewind → branch → compare loop is
unavailable** — the loop `design/00-thesis.md` says the product *is*.

This is not filed as a falsification because no design sentence asserts the contrary; the thesis
describes the rehearsal loop and never claims it covers competitive play. It is recorded here
because it is the kind of thing that is obvious once written down and invisible while it lives in
two RFCs, and because the RFC deliberately declines to lean (its Discharge D7 routes it to the
owner rather than resolving it).
