# Proposed intent amendment — `design/06` after the learner profile landed

**Filed:** 2026-09-24 · **By:** claude (player-style / skills implementation lane) · **For:** OWNER
**Trigger:** `CLAUDE.md`, clause added 2026-08-24 ([[D1505]]): *a change set that falsifies a
sentence in `design/00`–`06` adds a proposed intent amendment (the file, the exact sentence, and
what is now true) to `planning/platform-alignment/` in the same commit.*
**Change set:** `rfc/player-style.md` and the migration-free subset of `rfc/skills.md`
(receipts: `planning/style/implementation-2026-09-24.md`, `planning/skills/implementation-2026-09-24.md`).
**Law 5 holds:** nothing in `design/` is edited. This file reports that intent now disagrees with the
tree; it enacts nothing.

---

## 1. Falsified: `design/06-campaign.md:383-385`

**Exact phrase:**

> The floor beneath the catalogue remains cadence-and-completion: a daily position and per-unit
> mastery marks over a named vocabulary, no number about the learner anywhere.

**What is now true.** The product shows numbers about the learner on a private page, `/profile`,
linked from Rating and Learn: habit-card values with their floors and intervals (only once a card's
own floor clears), per-opening result counts, and counts of recorded observations — each with its
denominator and drill-down. (`RatingScreen` already showed a rating before this landing — [[D1190]].)
Campaign progression is unchanged: no campaign module reads the profile, a mark or a credit
(`apps/server/src/learner-profile-walls.test.ts`), and a skill mark gates nothing.

**Suggested wording.** Scope the sentence to the campaign: "…no number about the learner anywhere in
the campaign; the private profile (rfc/player-style.md) shows measured counts to the learner alone
and never feeds progression."

## 2. Absent, not falsified: `design/03-product-breadth.md` has no profile or style surface

`rfc/player-style.md` Discharge D5 already records this as owner-tier. The surface now exists at
`/profile`; the IA row is the owner's to write.
