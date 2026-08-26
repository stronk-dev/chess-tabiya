# Bot policy axes and grounded profile cards

**Question:** How can the roster distinguish strength band, behavior family and persona without
comparing unlike units or letting free prose outrun the mechanism?

**Feeds:** D1601, D1607, D1609–D1611, bot-roster amendment, opponent experience.

**Method:** re-derive the returned roster claims against current source and committed measurements,
then execute a closed card compiler over representative baseline, guarded and pawn-forward
profiles. No persona identities or chess claims were authored.

## 1. Independent axes, not “orthogonal strength”

The roster draft compares a band span stated in Elo-like outcome units with family shifts stated in
centipawns, then calls the axes orthogonal. There is no declared conversion between those units,
and the guard deliberately changes the severe tail. Its mechanical equality criterion also
included presentation even though every profile has a different persona. [V]
(`planning/bot-roster/buildability-return-2026-08-26.md` D1601)

The executable repair represents three separate projections:

- **band axis:** Maia engine/model identity and one of `[1000, 1400, 1800, 2200]`;
- **family axis:** baseline, guard contract, or guard-dependent registered pawn trait; and
- **display identity:** name, avatar and decorative tagline. [V]
  (`tools/d1601-bot-card-contract-harness/`)

The same family projection is byte-equal at bands 1000 and 2200 even when model-band and
presentation projections differ. Baseline, guarded and pawn-forward family projections differ at
one or two declared layers. No function compares cp with Elo or presupposes that a family transform
has zero strength effect. Exact-digest calibration reports the effect later. [V] (8/8 arms)

This is a structural independence claim only: the band selector and family transform are separately
declared inputs. It is not an empirical assertion that family cannot affect outcome strength. [M]

## 2. A bot card is a compiled evidence consumer

The current production presentation layer accepts `name` and free `bio`, guarded by eight banned
chess adjectives. The planning roster then supplies hand-written “what a learner would notice”
sentences, some of which overstate Maia as the plurality move, turn a 250-cp mask into “hanging
pieces”, or omit abstention scope. A word filter cannot reject an equivalent ungrounded claim
phrased without those adjectives. [V] (`apps/server/src/bot-policy-catalog.ts`;
`planning/bot-roster/roster.md` §1.4; D1607)

The prototype compiler accepts only a profile and an optional exact-digest calibration receipt. It
does not accept caller sentence strings. Every behavior statement is selected by registered layer
identity and carries one or more closed source ids. [V]

For all profiles it compiles:

- the Maia band mechanism and explicit non-equivalence to FIDE/Lichess/Chess.com rating;
- sampler temperature/top-p;
- absence of an opening book and cross-game memory;
- roster-wide endgame and clock calibration absences; and
- exact-profile calibration or its explicit absence. [V]

Guarded profiles add the literal Stockfish 18/depth-8/250-cp mechanism and every whole-guard
abstention family. Pawn-forward adds the measured guard dependency, multiplier and +12.28
percentage-point result with both guard and trait measurement source ids. The compiler never calls
250 cp a hanging piece or says the guard always runs. [V]

## 3. Decorative identity remains separate

Name, avatar and a chess-neutral decorative tagline remain presentation inputs because a persona
must be memorable. They render in a display slot and are excluded from policy-axis equality and
all “how this opponent plays” statements. A fixture proves a decorative café tagline reaches the
display object and none of the grounded behavior text. [V]

This separation is stronger than a regex, but not a machine proof that arbitrary prose is
chess-neutral. The shipping persona registry should therefore be a closed owner-authored asset set,
not a general user/provider text field; card behavior must remain entirely compiler-owned. [M]

## 4. Calibration and absence are first-class

An uncalibrated card says exactly that and claims no human-scale rating. A calibration receipt must
name the exact profile digest, time-control scope and registered source. A valid receipt renders a
band-relative label; a receipt for another digest fails. [V]

This preserves the distinction already found in the bot research: Maia's band number is a model
control, the measured ladder is relative, and absolute human Elo needs a separate funded anchor.
It also prevents persona copy changes after calibration from silently inheriting old results,
because presentation participates in the profile digest even though it is excluded from family
policy equality. [M]

## 5. Author repair

The bot-roster author can now replace D1601/D1607 with able-to-fail language:

1. call band and family independently declared policy axes, not orthogonal strength axes;
2. compare family projections excluding model-band and presentation;
3. keep every exact profile `uncalibrated` until a matching receipt exists;
4. replace free chess-bearing card copy with a registered statement compiler;
5. render guard abstention, no book, no memory, endgame/clock scope and calibration state; and
6. keep persona decoration out of the mechanism section.

D1610 and D1611 remain owner decisions. D1609 remains open until exact-digest calibration and
observability run. This dossier does not amend or accept an RFC.
