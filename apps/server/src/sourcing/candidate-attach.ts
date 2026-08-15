import { attachExplorerEvidence, ExplorerClient, fixtureAvailableExplorer, type RatingGroup, type Speed } from "./explorer.js";
import { SourcingError } from "./types.js";

function mapArgs(values: readonly string[]): Map<string, string> {
  const result = new Map<string, string>();
  for (let index = 0; index < values.length; index += 1) {
    const key = values[index];
    if (!key?.startsWith("--")) continue;
    const value = values[index + 1];
    if (!value || value.startsWith("--")) throw new SourcingError("ARGUMENT_MISSING", `${key} requires a value`);
    result.set(key.slice(2), value);
    index += 1;
  }
  return result;
}

async function main(): Promise<number> {
  const location = process.argv[2];
  const pipeline = process.argv[3];
  if (!location || pipeline !== "explorer") {
    console.error("Usage: make candidate-attach DIR=<candidate> or FILE=<pack.json> PIPELINE=explorer ARGS='...'");
    return 2;
  }
  try {
    const args = mapArgs(process.argv.slice(4));
    const since = args.get("since");
    const until = args.get("until");
    const moveSan = args.get("move");
    const target = args.get("target");
    if (!since || !until || !moveSan || !target) throw new SourcingError("ARGUMENT_MISSING", "--move, --target, --since and --until are required");
    const query = { ratings: (args.get("ratings") ?? "").split(",").filter(Boolean).map(Number) as RatingGroup[], speeds: (args.get("speeds") ?? "").split(",").filter(Boolean) as Speed[], since, until };
    const client = new ExplorerClient(process.env.LICHESS_TOKEN === undefined ? {} : { token: process.env.LICHESS_TOKEN });
    const result = await attachExplorerEvidence({ ...(process.env.ATTACH_FILE === "1" ? { file: location } : { directory: location }), ...(args.get("at-spine-node") === undefined || args.get("at-spine-node") === "root" ? {} : { spineNodeId: args.get("at-spine-node")! }), moveSan, target, query, client: { stats: process.env.OFFLINE === "1" ? fixtureAvailableExplorer : (value) => client.stats(value) } });
    console.log(`Explorer attachment ${result}: ${location}`);
    return 0;
  } catch (error) {
    if (error instanceof SourcingError) console.error(`${error.code}: ${error.message}`); else console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
}

if (process.argv[1]?.endsWith("candidate-attach.js")) process.exitCode = await main();
