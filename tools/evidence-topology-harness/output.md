# D634 evidence topology — raw output

## Namespace census

| namespace / contract | members | compiled join |
|---|---:|---|
| runtime event payload kinds | 4 | 0/4 names match the sourcing ledger |
| sourcing ledger evidence kinds | 7 | 2/7 admitted to recorded readings |
| rules evidence facts | 34 | family-name refs only; no subject/object/square operands |
| capability dispositions | 39 | 0/8 free-text surface names match 7 canonical surface IDs |
| production assistance axes | 9 | 0 compiled joins to research module IDs |
| research modules / presets / workflows | 9 / 5 / 6 | 0 module IDs and 0 workflow IDs occur in production source |

## Producer paths

| producer id | output | current consumer | status | retained semantics |
|---|---|---|---|---|
| `rules.structural` | rules refs plus EvidencePacket structures/observations | generic in-run/compare dumps; named structures enter voice sentences | typed_but_not_renderable | generic observations keep uneven operands; per-kind refs retain only the family name |
| `rules.transition` | kind-only rules refs and a client-local TransitionReading | generic in-run transition dump; no EvidencePacket field | runtime_side_channel | direction/subkind/count survive locally; affected squares, subjects and objects are erased |
| `rules.phase` | EvidencePacket phase plus deterministic sentence | voice/deterministic guidance | renderer_visible | phase and source survive |
| `rules.pivotal` | EvidencePacket markers plus deterministic sentences | voice and marker UI | renderer_visible | marker kind/node and its frozen wording survive |
| `rules.endgame` | EvidencePacket endgame plus deterministic sentences | voice and endgame UI | renderer_visible | typed endgame reading survives |
| `theory.shapes` | EvidencePacket plans and separate shape firings | guided/story panels; plans are omitted from the voice sentence allow-list | typed_but_not_renderable | shape id/name/attribution survive; applicable passage and consequence do not |
| `pack.authored` | EvidencePacket authored items plus deterministic sentences | voice and authored-feedback surfaces | renderer_visible | authored text/id/reveal attribution survive |
| `recorded.engine` | EvidencePacket readings | frozen text appended after LLM validation; not selectable by the LLM | typed_but_not_renderable | score/depth/model/version/date survive; best move is intentionally narrowed out |
| `recorded.tablebase` | EvidencePacket readings | frozen text appended after LLM validation; not selectable by the LLM | typed_but_not_renderable | category/distances/terminal facts/source date survive |
| `live.stockfish` | run-event EvidencePayload eval/wdl/bestline plus engine ref | guard, comparison/story and explicit analysis; absent from EvidencePacket | runtime_side_channel | generic values map; eval also carries bestMoveUci despite the global move-verdict refusal |
| `live.syzygy` | run-event tablebase EvidencePayload plus tablebase ref | opponent modes, guards and evidence-ref rendering; absent from EvidencePacket | runtime_side_channel | category, DTZ/precise DTZ, DTM and terminal facts survive in a generic values map |
| `human.maia` | opponent selection and on-request HumanSplitPage | opponent play and a raw move/mass panel; absent from EvidencePacket | standalone_panel | candidate move, policy mass, target band and engine identity survive |
| `human.explorer` | on-request CorpusPage or typed abstention | raw corpus panel; absent from EvidencePacket and recorded-reading admission | standalone_panel | population definition, outcomes, move counts/share and recency survive |
| `theory.opening_identity` | opening_identity sidecar record | authoring provenance only; explicitly refused as a recorded runtime reading | sourcing_only | ECO/name/SAN/source survive in the sidecar |

## Status totals

- renderer_visible: 4
- runtime_side_channel: 3
- sourcing_only: 1
- standalone_panel: 2
- typed_but_not_renderable: 4

## Pinned contradictions and omissions

- The EvidencePacket has typed structural observations and plans, but neither contributes to the normative sentence allow-list.
- Transition readings, Maia human splits, Lichess corpus results and opening identity never enter the packet.
- Recorded engine/tablebase readings enter a typed field but are appended only after LLM validation; the LLM cannot select or translate them.
- The server publishes 39 capability dispositions, while the web Capabilities interface omits the field.
- Stockfish bestmove/bestline is globally labelled refused, but the analysis route accepts bestline and eval payloads carry bestMoveUci. The missing dimension is consumer/timing, not a universal capability verdict.
