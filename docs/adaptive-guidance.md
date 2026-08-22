# Adaptive guidance

Adaptive guidance is a derived, non-authoritative reading layer over a run. It classifies the
current phase, records arithmetic turning-point markers, names a small set of endgame families,
and optionally exposes recorded human-model distributions. None of these projections is stored
as run truth, changes objective grading, or prescribes a move. Assistance is silent by default.

Transition primitives do not add a fifth pivotal-marker family. R3 measured the proposed live
detector below its own usefulness bar, so the transition census is available only through the
learner-opened reading described in `docs/transition-primitives.md`; `AssistanceConfig` is
unchanged.

`immediate_guard` is a separate, pack-authored on-ramp policy rather than an assistance
preference. It may surface recorded engine evidence during play, but only after the learner's
move stands and the consequence has begun; all other policies retain their existing defaults.

## Phase bands

`classifyPhase(fen)` computes two exact quantities for each position:

- non-pawn material per side, using queen 9, rook 5, bishop 3, and knight 3; and
- bishops and knights still occupying their four original home squares.

It returns one of four values under the named **Tabiya phase bands**:

| Result | Rule |
|---|---|
| `endgame` | the larger side's non-pawn material is at most 13 |
| `unclear` | that material is 14–17 |
| `opening` | material is at least 18 and at least five minors remain home |
| `middlegame` | material is at least 18 and at most two minors remain home |
| `unclear` | material is at least 18 and three or four minors remain home |

The bands are a product convention, not chess truth. The renderer says so. A pack's authored
phase and the detector result appear separately; the detector never corrects the author. A
phase-change marker fires only between definite classifications, skipping `unclear`. Endgame is
absorbing on a promotion-free path because the material count cannot rise.

## Assistance configuration and enforcement

Six learner-facing contexts have independent, versioned local preferences: curated drills,
Just Play, imported games, native matches/Arenas, streamed sessions, and the on-ramp. A live
stream or match selects its own profile; `immediate_guard` selects on-ramp first. The stored
shape is currently:

```ts
{
  version: 4,
  markers: "off" | "live",
  guided: "off" | "live",
  humanSplit: "off" | "on_request",
  corpus: "off" | "on_request",
  voice: "authored" | "persona",
  spoken: "off" | "browser" | "provider",
  boardLighting: "off" | "legal" | "sight" | "evidence",
  arrows: "off" | "sight" | "evidence",
  ambient: "off" | "on"
}
```

Five contexts start from `SILENT_ASSISTANCE`; its rules-tier `boardLighting: "legal"` is the
single named exception to literal off. The `immediate_guard` on-ramp differs only by starting
named-pattern guidance live. A stored preference remains authoritative as a whole, so an explicit
on-ramp `guided: "off"` is never overwritten by that fallback. Preferences live in `localStorage`; they are not events,
run fields, or server-side learner state. A profile selects what the learner asked for, never
what the viewer may receive. The shared `permittedAssistance` function separately projects that
permission ceiling and guards the server-owned human-split and corpus seams. A human split is
unavailable while a run's feedback-delivery window is closed and to live participants or
spectators. Markers and named-pattern guidance are client projections of data the viewer already
holds, so pretending to withhold them server-side would be theatre.

`guided` owns the named-shape timeline channel and its attributed `ShapePanel`; `markers` owns the
separate pivotal-moment channel. The two controls do not depend on each other. When guidance is
live but no shape matches, the learner-opened structure inspector reports that honest absence.

## Pivotal markers

`pivotalMarkers(run, branchId)` derives the complete, stable, path-ordered list from persisted
FENs and events. Learner-requested comparison, story, and evidence-packet surfaces keep that
complete projection. `liveMarkers(run, branchId, context)` is the narrower unasked projection
used by the timeline: castling and pawn-contact irreversibility are omitted, while capture of the
last piece of a role remains. A capture leaving both sides queenless renders “The queens have
left the board.” Nothing opens automatically; the learner must open a dot to see its sentences.

The live projection also applies the human-split permission. Recorded human divergence is absent
for participants and spectators, and for solo/host viewers while feedback delivery is closed.
Phase-change and option-collapse markers remain live but explicitly grandfathered and unmeasured;
the admission register records that debt rather than treating their presence as evidence.

Four detector families ship:

- **Irreversibility:** castling, capture of the last piece of a role, and a pawn capture or a
  pawn push that first creates pawn contact. These are current recorded facts, not importance
  judgments.
- **Phase change:** one definite Tabiya phase band to another. `unclear` produces no marker and
  is skipped when finding the previous definite phase.
- **Recorded human divergence:** a persisted `human_common` opponent selection whose recorded
  mass has no move above 50% and at least three moves at or above 15%. Missing mass or another
  applied policy abstains. The sentence names the recorded engine and says that the percentages
  are recorded mass.
- **Sustained option collapse:** a side goes from at least eight legal moves to at most three at
  two consecutive decisions by that side. The delayed second observation suppresses ordinary
  one-check noise. It is a legal-move count, never a claim about reasonable moves.

The detector does not use live engine evaluation. `retrospectivePivot` is separate and works
only on already-disclosed, recorded comparison evaluations; it returns the largest consecutive
centipawn change or honest absence and creates no live marker.

## Human-model split

`GET /runs/:id/human-split?nodeId=...` asks the configured opponent selector for a MultiPV-8
`human_common` report at that recorded node. It returns the engine identity, rating target, and
candidate masses. It is ephemeral and does not become evidence or a run event. The disclosure
window is checked server-side; refusal is the typed `ASSISTANCE_WITHHELD` error (HTTP 409).

The selection itself still comes from the engine's `bestmove`. The report request does not alter
the server's selection rule. The real Maia sidecar records `seedHonored: false`, so run-to-run
move identity is not claimed; the tagged integration check proves only that MultiPV reporting
still terminates in a legal best move and supplies massed candidates.

Runtime corpus counts use the same permission and disclosure window but a separate,
operator-authenticated source. They remain off by default and are documented in
`runtime-corpus-evidence.md`.

## Endgame census and named techniques

`endgameReading(fen)` runs only inside the endgame phase band. It recognizes exact material
multisets for pawn endings, rook-and-pawn versus rook, rook endings, queen endings, and
single-minor endings. Anything else is rendered as outside Tabiya's material-census convention.

The rook-and-pawn-versus-rook index names Lucena and Philidor; Vancura is additionally named for
an a- or h-file pawn. These are attributed names, not executable advice. Each points to a shape
entry for its eventual authored body. If no such entry exists, the surface explicitly says no
technique entry is available. Other recognized families likewise report that the index has no
entry. Outcome grading remains the responsibility of the existing outcome objective machinery.

## Deterministic packet and optional voice

The server can assemble an `EvidencePacket` from the requested run node: its FEN, author- or
detector-attributed phase, structural matches and observations, pivotal markers, endgame census,
matching shape references, already-revealed authored prose, and the deterministic sentences for
all of them. The packet is assembled before an external provider is consulted.

`POST /runs/:id/voice` accepts a node and `marker`, `reading`, `steering`, or `story` scope. Voice
and speech packets can contain recorded human-model divergence, so both routes enforce the same
human-split permission before returning text or audio: participants, spectators, and pre-release
solo/host viewers receive typed `ASSISTANCE_WITHHELD`. A deployment
with no provider returns typed `VOICE_UNAVAILABLE` (HTTP 503), and the client does not show the
persona preference. With a provider, `voiceCheck` rejects new square or move tokens, ungrounded
chess nouns and judgments, and a closed set of prescriptive verbs. One failed rendering may be
retried; a second failure returns the byte-identical deterministic sentence set. Output is
ephemeral and never becomes evidence.

The checker is deliberately necessary but insufficient: paraphrased advice can evade any closed
word list. A known passing leak remains a test fixture so this limit cannot be mistaken for a
proof. The real safeguards are sparse explicit invocation, a packet-only prompt, a persona with
no chess claims, deterministic fallback, and no persistence. A vendor-neutral `external_http`
adapter ships without a vendor SDK; it sends only persona prompt, deterministic sentences, and
scope, and reports `llm: external` when configured. Browser-side spoken delivery remains off by
default and consumes only text from a surface the learner explicitly opened.

`AssistanceConfig` v4 adds separate board-lighting, arrow, ambient-presence,
and spoken-source controls. Older v1–v3 local records migrate on read; v3
spoken `on` becomes `browser`, and an unknown future record fails back to
silent defaults. The lighting ladder is `off | legal | sight | evidence`.
Legal destinations are board mechanics. Sight shapes render current structural
observations with their rail sentence. Evidence coloring is capped to sight
unless `feedbackDeliveryOpen` is true for a solo learner or host, and it never
requests a fresh engine verdict mid-decision.

An optional `external_http` TTS provider is independent of the LLM provider.
`POST /runs/:id/speech` builds the same packet-bound checked text, uses the
deterministic sentences when no LLM is configured, sends only that text to TTS,
and streams ephemeral audio with `no-store`. No run, learner, session, position,
or client identifier crosses that wire. Absence is typed `TTS_UNAVAILABLE` and
the provider option is not offered. See `adoption-wave-1.md` for the voice wire
and preference origins.

## Measured envelope and boundaries

On the implementation host, combined phase classification, pivotal projection, and endgame
reading across all 16 Pack B spine-prefix runs plus a 60-ply Just Play path measured 5.361 ms
median and 11.46 ms maximum over 20 samples. The test records these numbers and checks only a
non-vacuous finite workload. The product tripwire remains: investigate perceived delay around
100 ms and intervene around 200 ms; measurements do not replace the user-experience judgment.

Current boundaries are explicit:

- no detector output is persisted or used to grade an objective;
- no live evaluation drives a marker;
- no move is prescribed by deterministic assistance;
- no shape or technique content is authored by this layer;
- marker and guided preferences are client-enforced because their inputs are public projection;
- human split and corpus evidence are server-withheld until delivery opens; and
- optional provider voice may change wording only, never the evidence packet or run record.
