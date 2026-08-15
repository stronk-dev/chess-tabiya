// DISPOSABLE research harness — R5 (planning/campaign-research-queue.md).
// Not production code. Reproduces the Elo carry-over through the SHIPPED
// OpponentSelector rather than through a hand-written UCI command, and reads the
// honesty field the selection records for it.
//
// #maia emits `setoption name Elo` only when policy.targetElo is defined
// (opponent-selector.ts:474-480), and `eloApplied` is recorded only when it was
// sent (:264-277). A Maia-backed request with no targetElo is a valid REST body
// (rest.ts:315-336, targetElo optional) and a schema-valid pack
// (schemas/drill_pack.schema.json $defs/opponentPolicy requires only `mode`).
import { appendFileSync, readFileSync, writeFileSync } from "node:fs";

import { EngineSupervisor } from "../../apps/server/src/engine-supervisor.js";
import { DEFAULT_MAIA_IMAGE, maiaDockerSpec } from "../../apps/server/src/maia.js";
import { OpponentSelector } from "../../apps/server/src/opponent-selector.js";

interface Position {
  readonly fen: string;
  readonly legalUci: readonly string[];
  readonly startFen: string;
  readonly historyUci: readonly string[];
}

async function main(): Promise<void> {
  const positions = (
    JSON.parse(readFileSync(process.argv[2]!, "utf8")) as { positions: Position[] }
  ).positions.filter((entry) => entry.legalUci.length > 4);
  const outPath = process.argv[3]!;
  const target = positions[Math.floor(positions.length / 2)]!;
  const setter = positions.at(-1)!;

  writeFileSync(outPath, "");

  const supervisor = new EngineSupervisor([
    maiaDockerSpec({ image: process.env.MAIA_IMAGE ?? DEFAULT_MAIA_IMAGE, transcriptCapacity: 8_192 }),
  ]);
  await supervisor.start("maia-5m");

  let seed = 0;
  const ask = async (position: Position, targetElo?: number) => {
    // A fresh selector each call: the shipped selection cache must not answer.
    const selector = new OpponentSelector(supervisor);
    seed += 1;
    const selection = await selector.select({
      startFen: position.startFen,
      historyUci: [...position.historyUci],
      policy: {
        mode: "human_common",
        policyConfigDigest: `sha256:${"e".repeat(64)}`,
        ...(targetElo === undefined ? {} : { targetElo }),
      },
      seed,
    });
    return {
      masses: (selection.candidates ?? []).map((candidate) => `${candidate.moveUci}:${String(candidate.mass)}`).join(","),
      eloApplied: selection.engine.eloApplied,
      eloHonored: selection.engine.eloHonored,
      seedHonored: selection.engine.seedHonored,
    };
  };

  const record: Record<string, unknown> = {
    kind: "elo-record",
    targetFen: target.fen,
    setterFen: setter.fen,
    pristineNoElo: await ask(target),
    at1100: await ask(target, 1100),
    at1500: await ask(target, 1500),
    at1900: await ask(target, 1900),
  };
  await ask(setter, 1100);
  record.noEloAfterSetter1100 = await ask(target);
  await ask(setter, 1900);
  record.noEloAfterSetter1900 = await ask(target);

  appendFileSync(outPath, `${JSON.stringify(record)}\n`);
  await supervisor.shutdown();
}

void main();
