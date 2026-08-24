# Proposed intent amendment — `design/03` under [[D1414]] native-first

**Filed:** 2026-08-24 · **By:** claude (social-play rebuild) · **For:** OWNER
**Trigger:** AGENTS.md, clause added 2026-08-24 ([[D1505]]) — *a change set that falsifies a sentence
in `design/00`–`06` adds a proposed intent amendment — the file, the exact sentence, and what is now
true — to `planning/platform-alignment/` in the same commit.*
**Change set:** `rfc/social-play.md`, rebuilt on [[D1414]]/[[D1415]]/[[D1416]]/[[D1481]].
**Law 5 holds:** nothing in `design/` is edited by this pass. This file reports that intent now
disagrees with a ruling; it does not enact anything.

---

## 1. Falsified now — `design/03-product-breadth.md:53-55`

**Exact sentence:**

> - **Position Arena:** at minimum, two-leg fixed-position sparring through
>   invitation/Lichess handoff plus PGN return; native clocks/matchmaking can
>   deepen later without erasing the surface.

**What is now true.** [[D1414]] rules 1.0 human play **native-first**: rated and clocked human play is
built here, not delegated. Native clocks and native ratings are therefore **1.0 work**, not a later
deepening. The rest of the sentence stands unchanged and is not proposed for amendment — the Lichess
handoff and the PGN return both survive as import paths (`rfc/social-play.md` §4), and nothing erases
the two-leg surface.

**The narrow defect is the word *later*.** It sequences native clocks after the minimum, and the owner
has sequenced them into it.

**Proposed replacement clause** (the owner's to write, veto or ignore — offered so the amendment is
concrete rather than a complaint):

> - **Position Arena:** at minimum, two-leg fixed-position sparring through
>   invitation/Lichess handoff plus PGN return. Native clocks and native ratings
>   are 1.0 ([[D1414]]); native matchmaking is unruled.

**Confidence: high.** This is a direct, unconditional consequence of a ruling already made.

---

## 2. Conditionally falsified — and deliberately NOT amended yet

[[D1414]] states its own reservation: *"does native-first include a **public matchmaking pool** in 1.0,
or only private/friend play plus native ratings? Pairing strangers brings abuse handling, reporting
and moderation with it; pairing friends does not. This goes back to the owner before the redraft fixes
a scope."*

`rfc/social-play.md` Open question 1 therefore writes both branches and chooses neither. **Two design
sentences turn on that choice**, and proposing an amendment to either one now would be the redraft
assuming the answer it was told not to assume. They are recorded here so the amendment is already
drafted at the moment of the ruling rather than rediscovered afterwards.

### 2a. `design/03-product-breadth.md:87-88`

> - **Arena and events:** scheduled pack nights, invitations, cohorts, two-leg
>   position matches, team relays, and **later native matchmaking** reuse run,
>   branch, evidence, and replay semantics.

### 2b. `design/03-product-breadth.md:327` (B5's shipped-scope cell)

> Native matchmaking stays outside minimal-real scope by design

**Under Branch A** (private/friend play plus native ratings) both sentences remain **true** and no
amendment is owed.

**Under Branch B** (a public matchmaking pool in 1.0) both are **false**, and Branch B additionally
collides with `design/02-product-shape.md:98-99` — *"No operator account exists… Administrative
capability lives in environment and configuration, never a privileged user"* — because a moderation
queue is a privileged human acting. That collision is the reason the question is owner-tier at all;
`league-as-return-loop.md` §C5 states it as *"A league is not missing an admin screen; it is missing
the role, and the role was refused on purpose."*

**Trigger:** the ruling on `rfc/social-play.md` Open question 1. If it is Branch B, all three sentences
(2a, 2b, and `design/02:98-99`) need the owner's pen in the same pass.

---

## 3. Long-standing, restated so the count is visible — `design/03-product-breadth.md:87-88`

The same events row contains **"team relays"**, which [[D412]] reads as a *roster with a calendar*,
distinct from external tournament relay (`live-sources`/`live-following`'s object). Two independent
agents have now derived that reading from scratch, and `rfc/social-play.md` §5.4 declines to build it
on that basis.

This is **not** falsified by [[D1414]]; it was ambiguous before and remains so. It is restated here
only because `live-sources` and `social-play` have both recorded it as owner-tier and undischarged, and
the count of agents who have paid for the ambiguity is now three.

**Proposed disambiguation** (owner's to accept or reject): the events row's *team relays* means a
roster with a calendar inside Tabiya; relaying an external tournament is `live-following`'s object and
is named separately.

---

## 4. What is NOT proposed

- **`design/02-product-shape.md:98-99`** — *"No operator account exists… never a privileged user."*
  `rfc/social-play.md` §7.2 **conforms** to this rather than deviating from it. [[D1481]] found the
  operator account deferred by [[D1416]] is redundant against the shipped `rfc/archive/teacher-surface.md`
  delegated-capability model, and the two genuinely missing objects — a round/pairing aggregate and a
  declared result — need no privileged user. No amendment is owed **unless** Branch B is ruled (§2).
- **`design/05-in-run-experience.md:41`** (*"Absence is stated, never simulated"*) and **`:42`**
  (session machinery *"may never alter what the run says happened on the board"*). Both are applied by
  the rebuild, not amended: `:41` is the whole basis of the terms label (§3.2) and the fair-play
  sentence (§3.5), and `:42` is why resignation and the agreed draw are **run** events rather than
  session-journal entries (§3.4).
- **`design/00-thesis.md`** — contains no occurrence of *social*, *human play* or *friend*
  (re-verified). There is no sentence to falsify. If native-first is to be anchored in the thesis at
  all it would be an **addition**, not a correction, and that is entirely the owner's.
