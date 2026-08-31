// DISPOSABLE type image for the D1910-D1915 author repair. Not production code.
type Instance = "stockfish-play" | "stockfish-analysis" | "external-voice";
type Operation = "opponent.stockfish_play" | "evidence.stockfish_analysis" | "render.voice";
type Reason = "timeout" | "protocol";

type Snapshot =
  | Readonly<{ instanceId: Instance; state: "not_configured" }>
  | Readonly<{ instanceId: Instance; state: "unverified"; generation: string }>
  | Readonly<{ instanceId: Instance; state: "available"; generation: string; checkedAt: string }>
  | Readonly<{ instanceId: Instance; state: "degraded_cached_only"; generation: string; checkedAt: string; reason: Reason; validExactEntries: number }>
  | Readonly<{ instanceId: Instance; state: "unavailable"; generation: string; checkedAt: string; reason: Reason }>;

type Origin =
  | Readonly<{ operationId: "opponent.stockfish_play"; instanceId: "stockfish-play"; generation: string; source: "live" | "local_fixture" }>
  | Readonly<{ operationId: "evidence.stockfish_analysis"; instanceId: "stockfish-analysis"; generation: string; source: "live" | "local_fixture" }>
  | Readonly<{ operationId: "render.voice"; instanceId: "external-voice"; generation: string; source: "live" | "local_fixture" }>;
type Acquisition = Origin | Readonly<{ operationId: Operation; instanceId: Instance; generation: string; source: "cached_exact"; original: Origin }>;
type Failure = Readonly<{ operationId: Operation; instanceId: Instance; generation: string; source: "failed"; reason: Reason }>;
type Result<T> =
  | Readonly<{ kind: "success"; value: T; receipt: Acquisition }>
  | Readonly<{ kind: "fallback"; value: T; source: "deterministic_fallback"; providerFailure: Failure }>
  | Readonly<{ kind: "unavailable"; failure?: Failure }>
  | Readonly<{ kind: "cancelled"; reason: "caller" | "superseded" | "shutdown" }>;

const absent: Snapshot = { instanceId: "external-voice", state: "not_configured" };
void absent;
// @ts-expect-error absent configuration cannot invent a generation
const inventedAbsent: Snapshot = { instanceId: "external-voice", state: "not_configured", generation: "fake" };
void inventedAbsent;
// @ts-expect-error cache-only state requires a current inventory count
const noInventory: Snapshot = { instanceId: "external-voice", state: "degraded_cached_only", generation: "g", checkedAt: "t", reason: "timeout" };
void noInventory;

const originReceipt: Origin = { operationId: "opponent.stockfish_play", instanceId: "stockfish-play", generation: "g", source: "live" };
const cached: Result<string> = { kind: "success", value: "e2e4", receipt: { ...originReceipt, source: "cached_exact", original: originReceipt } };
void cached;
// @ts-expect-error cached success cannot carry a failure reason
const cachedFailure: Result<string> = { kind: "success", value: "e2e4", receipt: { ...originReceipt, source: "cached_exact", original: originReceipt, reason: "timeout" } };
void cachedFailure;
// @ts-expect-error analysis operation cannot claim the play instance
const crossed: Origin = { operationId: "evidence.stockfish_analysis", instanceId: "stockfish-play", generation: "g", source: "live" };
void crossed;
