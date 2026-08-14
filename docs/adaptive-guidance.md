# Adaptive guidance

Adaptive guidance is a derived, non-authoritative reading layer over a run. It classifies the
current phase, records arithmetic turning-point markers, names a small set of endgame families,
and optionally exposes recorded human-model distributions. None of these projections is stored
as run truth, changes objective grading, or prescribes a move. Assistance is silent by default.

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

Each session kind has a versioned local preference:

```ts
{
  version: 1,
  markers: "off" | "live",
  guided: "off" | "live",
  humanSplit: "off" | "on_request",
  voice: "authored" | "persona"
}
```

The universal default is `off`, `off`, `off`, and `authored`. Preferences live in
`localStorage`; they are not events, run fields, or server-side learner state. The shared
`permittedAssistance` function gives the client an honest permission projection and guards the
server-owned human-split seam. A human split is unavailable while a run's feedback-delivery
window is closed and to live participants or spectators. Markers and named-pattern guidance are
client projections of data the viewer already holds, so pretending to withhold them server-side
would be theatre.

## Pivotal markers

`pivotalMarkers(run, branchId)` derives a stable, path-ordered list from persisted FENs and
events. The timeline renders a dot only when markers are enabled. Nothing opens automatically;
the learner must open a dot to see its sentences.

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

`POST /runs/:id/voice` accepts a node and `marker`, `reading`, or `steering` scope. A deployment
with no provider returns typed `VOICE_UNAVAILABLE` (HTTP 503), and the client does not show the
persona preference. With a provider, `voiceCheck` rejects new square or move tokens, ungrounded
chess nouns and judgments, and a closed set of prescriptive verbs. One failed rendering may be
retried; a second failure returns the byte-identical deterministic sentence set. Output is
ephemeral and never becomes evidence.

The checker is deliberately necessary but insufficient: paraphrased advice can evade any closed
word list. A known passing leak remains a test fixture so this limit cannot be mistaken for a
proof. The real safeguards are sparse explicit invocation, a packet-only prompt, a persona with
no chess claims, deterministic fallback, and no persistence. No provider implementation or
vendor SDK ships; the server exposes only a vendor-neutral interface and reports `llm: external`
when one is injected.

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
- human split is server-withheld until delivery opens; and
- optional provider voice may change wording only, never the evidence packet or run record.
