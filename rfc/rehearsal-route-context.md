# RFC: Rehearsal arrival without supplementary-read failures

- **Status:** draft
- **Author:** codex
- **Created:** 2026-10-13
- **Design refs:** `design/05-in-run-experience.md` stable board and honest absence; `design/03-product-breadth.md` Play/Learn/professional surfaces
- **Exploration gate:** inherited owner breadth ruling; D3756's four actual native-start controls answer the failure boundary before drafting (`design/research/ux-arrival-and-start.md` §15)
- **Depends on:** `rfc/archive/app-shell.md`, `rfc/play-composition.md`, implemented assignment/repertoire contracts
- **Parent / amends:** `rfc/archive/app-shell.md` run-route read/failure composition
- **Supersedes / superseded by:** —
- **Planning:** existing `planning/codex-queue.md`; D3756

```tabiya-claims
none
```

## Summary

Assignment/repertoire reads supplement a rehearsal; they do not determine access to its board.
Load them independently with visible pending/failure and read-only retry, after preserving every
mandatory graph, lease, capability and live-match admission. D3756 owns implementation only after
independent acceptance. No new endpoint, stored state, schema, cache, source or assistance policy.

## Motivation

Actual created runs exist and retain their play when either `/assignments` or `/repertoires`
fails, but the current run route replaces the board with its page error. Held reads keep the
board absent indefinitely. The measured timeline also includes these reads, but this RFC does
not claim their removal fixes the remote 250 ms readiness failure.

## Specification

### Mandatory arrival remains mandatory

Preserve the existing run/controller, saved-pack identity, latest capability admission, graph
role/lease, live-session collection and related live-match detail. Preserve original versus
freshly-created attachment rules, participant/spectator ceilings, checkpoint/reasoning disclosure,
pending Review Compare handoff, derivations and Campaign-origin behavior. No failed required read
may default to host, solo, writer, paused match or an available provider. Required failures retain
the existing page recovery. Only the following two supplementary groups change their scheduling.

Table unit: independently recoverable read groups; total **two**, not two HTTP requests.

| Group | Reads | Existing consumer |
|---|---|---|
| Assignments | `api.assignments` when supported | `completedAssignmentOffers`, explicit consented assignment submission |
| Repertoire | `api.repertoires`, then `loadRepertoirePages` | `activeRepertoireGap`, explicit answer choice |

Start both alongside required arrival work, but do not await either to clear `routeLoading`.
Each group owns `pending`, `ready` or `failed` client state tied to the run id, route generation
and authenticated learner. Unsupported optional API methods retain the existing supported-empty
behavior; an implemented method failing is never relabelled empty or unsupported.

Publish successful data only for the same current run/route/learner. A repertoire group is ready
only when its collection and required gap pages complete under existing identity validation;
one failed page fails that group rather than displaying an incomplete scan as complete. Do not
change any parser, repertoire predicate, chess judgment or existing resource mutation.

### Visible state without board displacement

Use the existing `contextActions` companion, not a notice above/in the board column. Pending
and failed groups do not automatically expand the companion or move focus. Its collapsed badge
must make failures discoverable. Preserve the companion's one-expanded state and geometry.

Pending: "Checking assignment links…" / "Checking repertoire links…". Failed:
"Assignment links could not load. You can keep playing." / "Repertoire links could not load.
You can keep playing." Each failure has an explicit "Retry assignment links" or "Retry repertoire
links" button. Copy is fixed and never exposes diagnostic messages. Pending status is announced
politely; failure is announced once per failed read, not each run snapshot.

Only a ready group may supply its corresponding offer. Do not reuse the previous run's data,
describe a failed group as no assignments/gaps, or erase the other successful group's offer.
Existing outcome/host/submission/consent/repertoire-digest guards still control every mutation.

Retry rereads only that group's current GETs. Capture the same route/run/learner before issuing,
block duplicate retry, and retire late completions on departure, replacement, sign-out or a
newer retry. Preserve retry focus while pending and on failure; on success return focus to the
same companion context without forcing the board or another selected card. It must not call
create, duplicate, resume, restart, move, submit or adopt an answer. Required authority changes
continue through the existing controller/access path, never through this supplemental state.

## Deviations from design

None intended. This changes the archived shell's read/failure composition, not the product's
board, assistance, chess truth, consent or live-match policy.

## Acceptance criteria

1. Permanent mounted predecessor controls fail for each of the two held/failed groups. Actual
   desktop and touch-phone native starts/resumes show a playable authorized board while each
   supplementary read is held or failed; independently compare stored nodes/branches/cursor.
2. Release held genuine reads and recover failed reads through group-local Retry. Populated
   assignment and repertoire fixtures restore the exact offer under unchanged authority.
   Exercise a failed gap page, not just empty collections, and retain the other group's success.
3. Required capability/graph/live-session/match failures still refuse arrival. Participant,
   spectator, active match, revoked lease, completed consent and Campaign cases preserve ceilings;
   no tested read failure silently opens play or widens help.
4. Deferred success/failure after another run, navigation, sign-out and newer retry cannot publish;
   duplicate activation issues one read group. Failed retry retains its focused button. No
   mutation/recreation/resume occurs during retry, and no previous-run offer flashes on entry.
5. Native phone/tablet/desktop journeys preserve the full board rectangle and physical square
   hit targets before/after pending/failure/retry; no auxiliary notice opens or steals another card.
6. Ordinary software/content/governance/build and all browser tiers pass, including the unchanged
   five-sample 250 ms native arrival gate. Report paired measurements without claiming a remote
   or portable improvement. D3600 needs its own cause/exact-revision proof, not this closure.
7. Close D3756 with implemented docs, ledger/state and append-only log in the same commit.
   No whole capability, official content or release completion follows from this one repair.

## Discharges

none

## Open questions

None proposed. Independent buildability/security/presentation review is required before acceptance;
in particular, test whether the existing companion can discover failure without auto-expansion.

## Changelog

- 2026-10-13: drafted from four actual created-run read boundary controls; no production change.
