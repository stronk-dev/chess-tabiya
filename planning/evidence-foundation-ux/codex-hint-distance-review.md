# Hint distance — Codex buildability review

- **Reviewed:** 2026-08-23
- **Input:** `rfc/hint-distance.md` at `85a0584`
- **Verdict:** **RETURN TO RESEARCH / AUTHOR**
- **Scope:** evidence identity, selector evidence, disclosure enforcement, source separation,
  production reachability and rated-run boundary.

The central primitive is right: a useful hint is a semantic event on a searched line, not a PV
with some moves hidden. The draft is not ready for acceptance. Its production family table is
mostly outside the experiment it cites, it does not distinguish a helpful learner consequence from
an opponent event later in the line, and its sealed payload contains the very move that lower rungs
promise not to expose.

## Acceptance blockers

### B1 — The drafted seven-family table was not measured by D1066

The D1066 harness froze `NUDGE_EVENT_IDS` in
`tools/d1066-semantic-horizon-harness/semantic-horizon.test.ts:24-32`. Of the RFC's seven proposed
families, only `rules.tactic.event.double_attack@1` and
`rules.tactic.event.loose_piece@1` occur in that set. `derived.tactic.discovered_executed@1` is
produced by `localSemanticEvents` but was excluded by the harness filter. Mate-in-one,
forced-mate-after-move, fork-survives-reply and promotion-pressure are not emitted by
`localSemanticEvents` at all. The reported 56/64 and 46/64 reach therefore do not measure the
table in §2.

The RFC acknowledges the production re-run as D8 but still calls itself ready for review. The
selector is not incidental: its refusal table decides whether the feature is useful or usually
empty, and the dossier explicitly says research is *not sufficient to declare the selector
complete*.

**Required action before redrafting.** Implement the candidate table in a disposable harness,
including the real constructors for every proposed family, preregister perspective/polarity rules
(B2), and report reach, family mix, abstentions, latency and phase split on both engine arms. Freeze
the table only after that result. Criterion 4 cannot substitute for the missing exploration gate;
it belongs before acceptance, not as implementation work after it.

### B2 — “An event appears in the PV” is not a grounded reason for the learner's first move

Selection is precedence-dominant across any event anywhere in four plies. `HintHorizon` records an
actor but no root side, beneficiary/adversary, event sign or relation between the first move and the
selected event. A high-precedence double attack created by the opponent on ply 2 can therefore
outrank a learner-side event on ply 3, while rung 4 still reveals the root's first engine move. The
packet would be exact about every operand and false about why that move is being hinted.

This is not solved by calling the event a “consequence.” Temporal occurrence is not causal or
helpful polarity. The current D1066 instrument extracts `event.sign` but the proposed
`HintHorizon` drops it, and it never gates on `event.anchor.side` relative to the root side.

**Required action.** Preregister and measure a perspective contract. At minimum, every candidate
must carry root side, edge actor side, sign and a closed relation such as
`learner_action | opponent_threat | learner_avoidance`; the adapter must prove that relation from
typed operands rather than infer benefit. Include lines where the opponent forks, mates, promotes
or creates a loose piece inside the window and prove they cannot be rendered as support for the
learner's first move. If the evidence can only say “this occurs later,” the wording and module must
say exactly that.

### B3 — Catalogue identity is mistaken for evidence-instance identity

Both `engineLineRef` and `eventRef` are typed as `VersionedEvidenceId`. That type is only
`{ id, version }` (`evidence-contract.ts:14`): it names a projection declaration, not the exact
Stockfish job, PV bytes or semantic event occurrence. The runtime already has the required instance
identities: engine evidence refs are `engine:<jobId>`, and sealed semantic events carry a digest in
`SemanticEvidenceEvent.id` over projection, edge, sign and operands.

As drafted, two different engine searches with the same projection version produce identical
`engineLineRef`, despite the research showing only 65.6% depth-8/depth-12 first-move agreement.

**Required amendment.** Carry both declaration and occurrence identity: an exact engine job/event
reference (or immutable content digest), plus their projection ids. Rebuilding the horizon must
verify the referenced bytes and search provenance. Add negative fixtures that swap two PVs with
the same projection version and two same-family events on different edges.

### B4 — Lower rungs still hold the full move; the claimed enforcement does not exist

The registered projection payload is one full `HintHorizon` containing target squares, actor,
occurrence ply and `firstMove`. Section 8 says the LLM may see only the selected rung, and criterion
6 says a rung-0 packet contains no square and a rung-3 packet contains no move, but no redacted
packet type or compiler is specified. The only new runtime file named is `hint-horizon.ts`; the
full horizon is therefore the obvious object a renderer/provider would receive.

This directly defeats the feature's purpose. A prompt asked for an obtuse rung while holding
`firstMove.san` is a policy request, not a data boundary. It can leak the answer accidentally or
through a future renderer.

**Required amendment.** Specify a separately brand-sealed `HintDisclosurePacket<Rung>` whose type
and runtime bytes contain only the cumulative fields licensed at that rung. Only the compiler may
read `HintHorizon`; UI and external-provider adapters accept only the redacted packet. Add runtime
forge tests, serialization tests, and an external-provider sentinel proving `firstMove`, UCI, SAN,
ply and squares absent at each lower rung. Rung reduction must create a new sealed view, not spread
and hide fields at render time.

### B5 — The LLM boundary is asserted in prose and contradicted by the payload

Section 8 says the record's shape prevents a renderer from saying “best move.” It does not: the
record contains `firstMove` taken from Stockfish's bestline job. Removing
`principal_variation` prevents leaking the rest of the line; it does not prevent turning the first
move into an ungrounded recommendation or calling it best/forced.

**Required amendment.** Route the disclosure packet through F1's registered-renderer / typed-item
boundary. The deterministic canonical sentence and its allowed semantic clauses must be derived
from the same packet; the external provider may paraphrase only that sentence, and the checker must
refuse “best,” “forced,” “winning,” recommendation language, a different move, or any field absent
from the rung. Add adversarial provider fixtures at every rung. The LLM remains optional rendering,
never the enforcement mechanism.

### B6 — The claimed shared theory/engine ladder has no shared source contract

Section 4 says one ladder serves engine, theory and authored grounds. The only new projections and
payload require a PV, occurrence ply and first move. The four non-engine rows retained from
`learner-modules` are Syzygy/endgame/authored rows with different payloads; no adapter converts them
to a typed rung packet. The draft then says source unavailability caps `hintDistance` to `off`, which
would disable an available theory hint merely because the engine horizon abstained.

This is precisely the user-facing requirement that sometimes support should expose **only theory**,
not moves.

**Required amendment.** Keep one user-facing distance vocabulary if desired, but specify distinct
source adapters and source ceilings. An engine-semantic packet may reach `move`; a cited theory or
authored packet may reach only the fields it actually grounds; a tablebase packet has its own exact
image. Availability is evaluated per eligible source, then the module selects among available
packets—never a global “engine empty => off.” Add a theory-only fixture with the engine unavailable
and prove pattern/subject remain reachable while distance/move are refused.

### B7 — The production request/response path is absent

No implementation surface names the server operation, client method, module adapter or UI consumer
that requests a rung, waits for the engine job, compiles the horizon and returns the redacted packet.
The D1 discharge lists projections, selector, contract edits and the config field. That can ship a
configurable primitive with zero product consumer—the exact architecture failure this programme is
meant to stop.

**Required amendment.** Name the end-to-end path and its owner. Acceptance must start at the live
guided-hint request and finish at the rendered module state, including pending, honest-empty,
provider-off and each rung. If `learner-modules` owns the UI, make its implementation an explicit
dependency and do not call this feature reachable until the binding lands. Include a consumer
closure check, not only projection registration.

### B8 — The rated-run guard is above the actual enqueue choke point

Criterion 13 proves only that `DrillRunService.analysis()` calls `#refuseRatedAssistance`.
`enqueueEvidence()` is public, accepts `kind: "bestline"`, and performs no rated-run refusal before
writing the job. Today analysis is the only production caller; this RFC necessarily adds another
hint request path. Guarding one caller does not guard the capability.

**Required amendment.** Put the rated bestline/horizon refusal at the common enqueue or compiler
boundary and retain the analysis test as a caller test. Add a direct-enqueue negative fixture and a
future-caller fixture. Do not rely on a route convention to enforce a cheating boundary.

### B9 — The per-rung answer gate named by the RFC does not exist

`module-contract.ts` validates only `accepted.answerContent` when that optional field is present.
The RFC says horizon acceptance rows omit it, because the current single-image ceiling would reject
their mixed fact/threat/move content. There is no packet compiler in production code, and no named
implementation surface for the per-rung gate repeatedly cited in §§4 and 8. Omitting the field
therefore bypasses the only current check.

**Required amendment.** Define the packet compiler and its answer-content image as production code,
then require every module acceptance to declare the exact projection content it consumes. The
compiler must check projection declaration → disclosure packet → requested rung → module stage,
with no optional-field bypass. Include the current omitted-field shape as a must-fail fixture.

## Secondary corrections

1. §3's statement that every eligible family is emitted by `localSemanticEvents` is false for four
   of the seven and false in the measured-filter sense for five. Replace it after B1's harness run.
2. The latency gate depends on the unwritten shared candidate/event packet (D5). Either bring that
   dependency into the implementation order or state that independent compilation is permitted but
   the module cannot be default-on until D5 lands and the integrated p95 clears the budget.
3. `HINT_RUNG_ABOVE_CEILING` should not be raised merely because a source abstained after the UI
   requested an otherwise permitted rung. Distinguish policy refusal from runtime unavailability;
   the latter renders the named empty state. Otherwise normal provider failure becomes a client
   error.

## Required research receipt

Before the next author round, land one read-only result artifact containing:

- the exact candidate/refusal table and code digest;
- engine budget/version and the immutable 64-position population identity;
- reach and family mix by phase for depth-12 and 100 ms;
- learner-side, opponent-side and unclassified candidate counts;
- polarity/refusal counts and at least one hard negative per family;
- cold/warm/provider-off end-to-end latency, not only per-edge classifier time;
- the final set-equality list consumed by the RFC.

## Proposed ledger rows

Ids are deliberately unassigned while `design/BACKLOG.md` is being edited concurrently. The author
or coordinator must land one row for B1–B9 plus the three secondary corrections. Do not leave these
only inside the review artifact.

