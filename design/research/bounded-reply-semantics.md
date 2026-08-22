# Bounded reply and tactical-consequence semantics

**Question.** Which exact claims become valid when every legal opponent reply is enumerated, and
does that support “forcing” guidance beyond raw check/capture/threat labels?

**Verdict.** `[V]` Complete one-reply enumeration is cheap enough and semantically useful, but it
mostly **rejects** stronger tactical language. Exact reply breadth, only-reply identity and retained
refutations deserve a shared primitive. Generic positive-capture threats are background and almost
none survive every reply. Meaningful double attacks are selective, but only 0/10 authored and 2/29
imported played events satisfy the RFC's all-replies consequence. “Forced win,” unavoidable tactic,
value and anything deeper than the declared horizon remain outside the evidence.

## 1. Declared horizon

The disposable D794 instrument evaluates one played/candidate move, enumerates the opponent's
complete legal reply set with chessops, and then stops after testing the mover's immediate legal
capture in each reply position. `[V]` (`tools/d794-bounded-reply-harness/`;
[chessops source](https://github.com/niklasf/chessops))

It distinguishes four things that prose often collapses:

1. `reply_breadth@1`: the exact legal replies after the move, including their UCIs;
2. `threat@1`: under the RFC's disclosed pass convention, an immediate positive
   `legal-exchange@1` capture exists (abstain while the opponent is in check);
3. a named capture threat survives every reply: same attacker, target, squares/roles and positive
   legal capture after each reply;
4. `fork_survives_reply@1`: the moved piece's meaningful double attack exists, and after every
   reply the mover remains and can positively capture at least one original non-king target.

Zero replies is terminal, not “only reply.” Checks, captures and low breadth are recorded as exact
facts; none is a synonym for force or quality.

## 2. Reply breadth is exact but population-shaped

| Population | played mean / p10 / median / p90 | legal alternatives mean / p10 / median / p90 |
|---|---:|---:|
| authored packs | 27.08 / 3 / 31 / 42 | 31.21 / 6 / 34 / 43 |
| imported fixed sample | 34.45 / 25 / 36 / 46 | 36.23 / 27 / 37 / 47 |

`[V]` Authored packs deliberately contain constrained endgame/mating trajectories. Exactly-one-reply
moves therefore measure **5.16% authored versus 0.52% imported**. The non-check subset is 3.77%
authored and **0/577 imported**, and the authored examples concentrate in bishop+knight mate.
Reply count is a useful literal fact; the authored rate is not a universal human-play prior.

Checks are stable at 2.48× authored / 2.60× imported. Mate delivery is extremely rare and exact
(6/717 and 1/577 played decisions). Neither justifies a quality label; they already have rules-level
identities.

## 3. All-reply persistence is a narrow filter

| Event | Authored played | Imported played | Consequence |
|---|---:|---:|---|
| positive-capture threat exists | 126/675 (18.67%), 0.91× | 208/545 (38.17%), 1.04× | background; negative/on-demand reading |
| same threat survives every reply | 1/675 | 0/545 | nearly empty; exact when present |
| meaningful moved-piece double attack | 10/717, 1.72× | 29/577, 1.96× | selective state/event, authored interval uncertain |
| double attack retains a positive original-target capture after every reply | **0/717** | **2/577** | 0/10 and 2/29 played fork events survive |

`[V]` Counts, alternative rates, paired-bootstrap intervals and positive source ids are in
`tools/d794-bounded-reply-harness/output.md`.

The survival predicate is not broken: positive and refutable fixtures pass; 2 authored and 11
imported **alternative moves** also satisfy it. The result instead establishes a real product
constraint: `fork_survives_reply@1` is a rare Review/drill fact, not the producer for everyday fork
feedback. The ordinary meaningful-double-attack event remains separate and must retain a defusing
reply when the consequence fails.

Likewise, generic `threat@1` is a broad current-state reading. A “blunder prevention” workflow may
compare the learner's candidate against alternatives after its own eligibility/risk policy, but the
collector cannot call every existing threat a blunder or imply it is unavoidable.

## 4. Cost and product contract

The full focused pass—reply enumeration, exchange checks, eight probes and output—took 5.30 s for
20,336 authored candidate edges and 7.53 s for 19,419 imported edges: approximately **0.26 ms and
0.39 ms per candidate edge** in this research harness. `[V]` This is evidence for the RFC's “cheap”
class, not a production latency guarantee.

The collector contract should expose one shared exact reply object:

- triggering move and terminal/check status;
- complete legal reply UCIs and exact count;
- for a bounded consequence, the retained attacker/target operands;
- the first/all refuting replies when it fails;
- convention id and horizon (`1 reply`), with abstention reason where applicable.

Modules then translate the same object differently: an overlay can show reply squares, Review can
say a fork was defused by a named move, a drill can branch over every defense, and a bot policy can
weight reply breadth. No source calls the move forcing, best, winning or inevitable.

## 5. Acceptance consequence

The tactical-collector RFC's non-vacuity rule must not be weakened when rare kinds read zero in one
population. It must require positive and hard-negative canonical fixtures plus report each
population honestly; zero authored `fork_survives_reply@1` is a coverage result and a content-fixture
requirement, not permission to drop the projection or fabricate a pack label.
