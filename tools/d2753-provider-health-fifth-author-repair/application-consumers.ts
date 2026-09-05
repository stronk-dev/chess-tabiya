// DISPOSABLE stand-in for production call-site declarations. The production compiler replaces
// this fixture with declarations imported by the real consumers.
export const APPLICATION_CONSUMER_DECLARATIONS = Object.freeze([
  { operationId: "opponent.stockfish_play", consumer: "opponent.selection", stageId: "select", instanceId: "stockfish-play", exchangeOperation: "stockfish.legal_root_table@1", fallback: "none" },
  { operationId: "opponent.maia_inference", consumer: "opponent.selection", stageId: "select", instanceId: "maia-inference", exchangeOperation: "maia.policy_page@1", fallback: "none" },
  { operationId: "evidence.stockfish_analysis", consumer: "live.stockfish", stageId: "analyse", instanceId: "stockfish-analysis", exchangeOperation: "stockfish.position_evaluation@1", fallback: "none" },
  { operationId: "evidence.tablebase_probe", consumer: "live.syzygy", stageId: "probe", instanceId: "tablebase-primary", exchangeOperation: "syzygy.position@1", fallback: "none" },
  { operationId: "evidence.explorer_query", consumer: "human.explorer", stageId: "query", instanceId: "explorer-primary", exchangeOperation: "lichess_explorer.position_page@1", fallback: "none" },
  { operationId: "render.voice", consumer: "guidance.voice", stageId: "text", instanceId: "external-voice", exchangeOperation: "external_voice.render@1", fallback: "deterministic_renderer" },
  { operationId: "render.voice_compare", consumer: "guidance.voice_compare", stageId: "text", instanceId: "external-voice", exchangeOperation: "external_voice.render@1", fallback: "deterministic_renderer" },
  { operationId: "render.voice_story", consumer: "guidance.voice_story", stageId: "text", instanceId: "external-voice", exchangeOperation: "external_voice.render@1", fallback: "deterministic_renderer" },
  { operationId: "review.reasoning", consumer: "review.reasoning", stageId: "review", instanceId: "external-voice", exchangeOperation: "external_voice.reasoning_review@1", fallback: "none" },
  { operationId: "render.speech", consumer: "guidance.speech", stageId: "audio", instanceId: "external-tts", exchangeOperation: "external_tts.synthesize@1", fallback: "browser_speech_or_text" },
] as const);
