import { emitOpeningCandidate } from "./openings.js";
import { SourcingError } from "./types.js";

function argumentsMap(values: readonly string[]): Map<string, string> {
  const output = new Map<string, string>();
  for (let index = 0; index < values.length; index += 1) {
    const key = values[index];
    if (!key?.startsWith("--")) continue;
    const value = values[index + 1];
    if (!value || value.startsWith("--")) throw new SourcingError("ARGUMENT_MISSING", `${key} requires a value`);
    output.set(key.slice(2), value);
    index += 1;
  }
  return output;
}

async function main(): Promise<number> {
  const pipeline = process.argv[2];
  if (pipeline !== "openings") {
    console.error(`Unknown pipeline ${JSON.stringify(pipeline)}; registered pipelines: openings`);
    return 2;
  }
  try {
    const args = argumentsMap(process.argv.slice(3));
    const side = args.get("learner-side");
    if (side !== "white" && side !== "black") throw new SourcingError("LEARNER_SIDE_REQUIRED", "--learner-side white|black is required");
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
