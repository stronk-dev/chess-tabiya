// DISPOSABLE research registry — D634. This records the shipped topology at the
// audited commit. It is not a production evidence manifest or implementation authority.

export const RUNTIME_EVENT_KINDS = Object.freeze(["eval", "wdl", "bestline", "tablebase"] as const);

export type TopologyStatus =
  | "renderer_visible"
  | "typed_but_not_renderable"
  | "standalone_panel"
  | "runtime_side_channel"
  | "sourcing_only";

export interface ProducerTopologyRow {
  readonly id: string;
  readonly producer: string;
  readonly output: string;
  readonly currentConsumer: string;
  readonly status: TopologyStatus;
  readonly retainedSemantics: string;
  readonly sourceAnchors: readonly { readonly path: string; readonly needle: string }[];
}

export const PRODUCER_TOPOLOGY = Object.freeze([
  {
    id: "rules.structural",
    producer: "18 exact/geometric structural matchers and the structural reader",
    output: "rules refs plus EvidencePacket structures/observations",
    currentConsumer: "generic in-run/compare dumps; named structures enter voice sentences",
    status: "typed_but_not_renderable",
    retainedSemantics: "generic observations keep uneven operands; per-kind refs retain only the family name",
    sourceAnchors: [
      { path: "apps/server/src/guidance.ts", needle: "observations: reading.features" },
      { path: "apps/server/src/guidance.ts", needle: "...reading.structures.map" },
      { path: "apps/web/src/lib/DrillScreen.svelte", needle: "{#each structure.features as observation}" },
    ],
  },
  {
    id: "rules.transition",
    producer: "six transition families / fourteen emitted leaves",
    output: "kind-only rules refs and a client-local TransitionReading",
    currentConsumer: "generic in-run transition dump; no EvidencePacket field",
    status: "runtime_side_channel",
    retainedSemantics: "direction/subkind/count survive locally; affected squares, subjects and objects are erased",
    sourceAnchors: [
      { path: "apps/web/src/lib/DrillScreen.svelte", needle: "transitionReading(parent.fen" },
      { path: "apps/web/src/lib/DrillScreen.svelte", needle: "{#each transition?.observations ?? [] as observation}" },
    ],
  },
  {
    id: "rules.phase",
    producer: "phase detector or authored pack phase",
    output: "EvidencePacket phase plus deterministic sentence",
    currentConsumer: "voice/deterministic guidance",
    status: "renderer_visible",
    retainedSemantics: "phase and source survive",
    sourceAnchors: [
      { path: "apps/server/src/guidance.ts", needle: "renderPhaseReading(detected)" },
    ],
  },
  {
    id: "rules.pivotal",
    producer: "run-event pivotal marker derivation",
    output: "EvidencePacket markers plus deterministic sentences",
    currentConsumer: "voice and marker UI",
    status: "renderer_visible",
    retainedSemantics: "marker kind/node and its frozen wording survive",
    sourceAnchors: [
      { path: "apps/server/src/guidance.ts", needle: "...markers.flatMap(renderPivotalMarker)" },
    ],
  },
  {
    id: "rules.endgame",
    producer: "position-derived endgame reader",
    output: "EvidencePacket endgame plus deterministic sentences",
    currentConsumer: "voice and endgame UI",
    status: "renderer_visible",
    retainedSemantics: "typed endgame reading survives",
    sourceAnchors: [
      { path: "apps/server/src/guidance.ts", needle: "...renderEndgameReading(endgame)" },
    ],
  },
  {
    id: "theory.shapes",
    producer: "registered shape trigger matcher",
    output: "EvidencePacket plans and separate shape firings",
    currentConsumer: "guided/story panels; plans are omitted from the voice sentence allow-list",
    status: "typed_but_not_renderable",
    retainedSemantics: "shape id/name/attribution survive; applicable passage and consequence do not",
    sourceAnchors: [
      { path: "apps/server/src/guidance.ts", needle: "plans: Object.freeze(plans)" },
      { path: "packages/runtime/src/story.ts", needle: "shapeFirings(options.shapes ?? [], path)" },
    ],
  },
  {
    id: "pack.authored",
    producer: "authored annotations, deviations and plan classes",
    output: "EvidencePacket authored items plus deterministic sentences",
    currentConsumer: "voice and authored-feedback surfaces",
    status: "renderer_visible",
    retainedSemantics: "authored text/id/reveal attribution survive",
    sourceAnchors: [
      { path: "apps/server/src/guidance.ts", needle: "...authored.map((item)" },
    ],
  },
  {
    id: "recorded.engine",
    producer: "pack-sidecar Stockfish engine_eval record",
    output: "EvidencePacket readings",
    currentConsumer: "frozen text appended after LLM validation; not selectable by the LLM",
    status: "typed_but_not_renderable",
    retainedSemantics: "score/depth/model/version/date survive; best move is intentionally narrowed out",
    sourceAnchors: [
      { path: "apps/server/src/guidance.ts", needle: "appendRecordedReadings(output, packet)" },
      { path: "packages/runtime/src/voice.ts", needle: "reading.kind === \"engine_eval\"" },
    ],
  },
  {
    id: "recorded.tablebase",
    producer: "pack-sidecar Syzygy tablebase_result record",
    output: "EvidencePacket readings",
    currentConsumer: "frozen text appended after LLM validation; not selectable by the LLM",
    status: "typed_but_not_renderable",
    retainedSemantics: "category/distances/terminal facts/source date survive",
    sourceAnchors: [
      { path: "packages/runtime/src/voice.ts", needle: "Recorded reading at this position: Syzygy" },
    ],
  },
  {
    id: "live.stockfish",
    producer: "live Stockfish evidence jobs",
    output: "run-event EvidencePayload eval/wdl/bestline plus engine ref",
    currentConsumer: "guard, comparison/story and explicit analysis; absent from EvidencePacket",
    status: "runtime_side_channel",
    retainedSemantics: "generic values map; eval also carries bestMoveUci despite the global move-verdict refusal",
    sourceAnchors: [
      { path: "apps/server/src/evidence-queue.ts", needle: "bestMoveUci: bestMove" },
      { path: "apps/server/src/rest.ts", needle: "analysis kind must be bestline, eval, or wdl" },
    ],
  },
  {
    id: "live.syzygy",
    producer: "live hosted Syzygy query",
    output: "run-event tablebase EvidencePayload plus tablebase ref",
    currentConsumer: "opponent modes, guards and evidence-ref rendering; absent from EvidencePacket",
    status: "runtime_side_channel",
    retainedSemantics: "category, DTZ/precise DTZ, DTM and terminal facts survive in a generic values map",
    sourceAnchors: [
      { path: "apps/server/src/evidence-queue.ts", needle: "kind: \"tablebase\"" },
      { path: "apps/server/src/position-evidence.ts", needle: "event.data.payload.kind === \"tablebase\"" },
    ],
  },
  {
    id: "human.maia",
    producer: "Maia opponent selector",
    output: "opponent selection and on-request HumanSplitPage",
    currentConsumer: "opponent play and a raw move/mass panel; absent from EvidencePacket",
    status: "standalone_panel",
    retainedSemantics: "candidate move, policy mass, target band and engine identity survive",
    sourceAnchors: [
      { path: "apps/server/src/rest.ts", needle: "route.action === \"human-split\"" },
      { path: "apps/web/src/lib/DrillScreen.svelte", needle: "Recorded human-model splits" },
    ],
  },
  {
    id: "human.explorer",
    producer: "Lichess Explorer corpus source",
    output: "on-request CorpusPage or typed abstention",
    currentConsumer: "raw corpus panel; absent from EvidencePacket and recorded-reading admission",
    status: "standalone_panel",
    retainedSemantics: "population definition, outcomes, move counts/share and recency survive",
    sourceAnchors: [
      { path: "apps/server/src/rest.ts", needle: "route.action === \"corpus\"" },
      { path: "apps/web/src/lib/DrillScreen.svelte", needle: "renderCorpusPage(corpusPage)" },
    ],
  },
  {
    id: "theory.opening_identity",
    producer: "opening database sourcing pass",
    output: "opening_identity sidecar record",
    currentConsumer: "authoring provenance only; explicitly refused as a recorded runtime reading",
    status: "sourcing_only",
    retainedSemantics: "ECO/name/SAN/source survive in the sidecar",
    sourceAnchors: [
      { path: "apps/server/src/sourcing/openings.ts", needle: "kind: \"opening_identity\"" },
      { path: "apps/server/src/position-evidence.ts", needle: "Opening identity is position naming" },
    ],
  },
] as const satisfies readonly ProducerTopologyRow[]);

