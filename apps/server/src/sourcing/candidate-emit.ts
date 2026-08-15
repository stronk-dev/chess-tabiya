import { emitOpeningCandidate } from "./openings.js";
import { emitExplorerPriority, ExplorerClient, fixtureUnavailableExplorer, type RatingGroup, type Speed } from "./explorer.js";
import { emitSyzygyCandidates, fixtureTablebaseQuery, liveTablebaseQuery } from "./syzygy.js";
import { createPositionSeedEngineEvaluator, emitPositionSeeds } from "./position-seeds.js";
import { SourcingError } from "./types.js";

function argumentsMap(values: readonly string[]): Map<string, string> {
  const output = new Map<string, string>();
  for (let index = 0; index < values.length; index += 1) {
    const key = values[index];
    if (!key?.startsWith("--")) continue;
    const value = values[index + 1];
    if (key === "--engine-eval" && (value === undefined || value.startsWith("--"))) { output.set("engine-eval", "true"); continue; }
    if (!value || value.startsWith("--")) throw new SourcingError("ARGUMENT_MISSING", `${key} requires a value`);
    output.set(key.slice(2), value);
    index += 1;
  }
  return output;
}

async function main(): Promise<number> {
  const pipeline = process.argv[2];
  if (pipeline !== "openings" && pipeline !== "syzygy" && pipeline !== "explorer" && pipeline !== "position-seeds") {
    console.error(`Unknown pipeline ${JSON.stringify(pipeline)}; registered pipelines: openings, syzygy, explorer, position-seeds`);
    return 2;
  }
  try {
    const args = argumentsMap(process.argv.slice(3));
    if (pipeline === "position-seeds") {
      const band = /^(\d+)-(\d+)$/.exec(args.get("rating-band") ?? "");
      if (!band) throw new SourcingError("RATING_BAND_REQUIRED", "--rating-band MIN-MAX is required");
      const engineEval = args.get("engine-eval") === "true";
      const guardMateValue = args.get("guard-mate");
      if (guardMateValue !== undefined && guardMateValue !== "true" && guardMateValue !== "false") throw new SourcingError("ARGUMENT_INVALID", "--guard-mate must be true or false");
      let engine: Awaited<ReturnType<typeof createPositionSeedEngineEvaluator>> | undefined;
      try {
        if (engineEval) {
          const sfArgs = JSON.parse(process.env.SF_ARGS ?? "[]") as unknown;
          if (!Array.isArray(sfArgs) || sfArgs.some((value) => typeof value !== "string")) throw new SourcingError("SF_ARGS_INVALID", "SF_ARGS must be a JSON array of strings");
          engine = await createPositionSeedEngineEvaluator(process.env.SF_CMD?.trim() || "stockfish", sfArgs as string[]);
        }
        const outputs = await emitPositionSeeds({
          ratingBand: [Number(band[1]), Number(band[2])],
          themes: (args.get("themes") ?? "").split(",").filter(Boolean),
          count: Number(args.get("count") ?? "20"),
          ...(args.has("plies") ? { plies: Number(args.get("plies")) } : {}),
          ...(args.has("csv") ? { csv: args.get("csv")! } : {}),
          ...(args.has("output-root") ? { outputRoot: args.get("output-root")! } : {}),
          ...(args.has("guard-cp") ? { guardCp: args.get("guard-cp") === "null" ? null : Number(args.get("guard-cp")) } : {}),
          ...(guardMateValue === undefined ? {} : { guardMate: guardMateValue === "true" }),
          engineEval,
          ...(engine === undefined ? {} : { engineEvaluator: engine.evaluate }),
        });
        console.log(`Emitted ${outputs.length} position-seed candidate(s): ${outputs.join(", ")}`);
        return 0;
      } finally { await engine?.close(); }
    }
    if (pipeline === "explorer") {
      const lines = args.get("lines");
      const since = args.get("since");
      const until = args.get("until");
      if (!lines) throw new SourcingError("LINES_REQUIRED", "--lines is required");
      if (!since || !until) throw new SourcingError("WINDOW_REQUIRED", "--since and --until are required");
      const ratings = (args.get("ratings") ?? "").split(",").filter(Boolean).map(Number) as RatingGroup[];
      const speeds = (args.get("speeds") ?? "").split(",").filter(Boolean) as Speed[];
      const live = new ExplorerClient(process.env.LICHESS_TOKEN === undefined ? {} : { token: process.env.LICHESS_TOKEN });
      const output = await emitExplorerPriority({ lines, query: { ratings, speeds, since, until }, client: { stats: process.env.OFFLINE === "1" ? fixtureUnavailableExplorer : (query) => live.stats(query) }, ...(args.has("output-root") ? { outputRoot: args.get("output-root")! } : {}) });
      console.log(`Emitted explorer priority artifact: ${output}`);
      return 0;
    }
    const side = args.get("learner-side");
    if (side !== "white" && side !== "black") throw new SourcingError("LEARNER_SIDE_REQUIRED", "--learner-side white|black is required");
    if (pipeline === "syzygy") {
      const positions = args.get("positions");
      if (!positions) throw new SourcingError("POSITIONS_REQUIRED", "--positions is required");
      const opponent = args.get("opponent");
      if (opponent !== "strong_engine" && opponent !== "human_common") throw new SourcingError("OPPONENT_REQUIRED", "--opponent strong_engine|human_common is required");
      const outputs = await emitSyzygyCandidates({
        positions,
        learnerSide: side,
        opponent,
        ...(args.has("checkpoint-plies") ? { checkpointPlies: Number(args.get("checkpoint-plies")) } : {}),
        ...(args.has("target-elo") ? { targetElo: Number(args.get("target-elo")) } : {}),
        ...(args.has("output-root") ? { outputRoot: args.get("output-root")! } : {}),
        query: process.env.OFFLINE === "1" ? fixtureTablebaseQuery : liveTablebaseQuery,
      });
      console.log(`Emitted ${outputs.length} Syzygy candidate(s): ${outputs.join(", ")}`);
      return 0;
    }
    const split = Number(args.get("split-ply"));
    const eco = args.get("eco");
    if (!eco) throw new SourcingError("ECO_REQUIRED", "--eco is required");
    const name = args.get("name");
    const prefix = args.get("prefix");
    const outputRoot = args.get("output-root");
    const tsvPath = args.get("tsv");
    const output = await emitOpeningCandidate({
      eco,
      splitPly: split,
      learnerSide: side,
      ...(name === undefined ? {} : { name }),
      ...(prefix === undefined ? {} : { prefix }),
      ...(outputRoot === undefined ? {} : { outputRoot }),
      ...(tsvPath === undefined ? {} : { tsvPath }),
    });
    console.log(`Emitted opening candidate: ${output}`);
    return 0;
  } catch (error) {
    if (error instanceof SourcingError) console.error(`${error.code}: ${error.message}`);
    else console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
}

if (process.argv[1]?.endsWith("candidate-emit.js")) process.exitCode = await main();
