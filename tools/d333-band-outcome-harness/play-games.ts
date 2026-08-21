// DISPOSABLE research harness — D333: does Maia's `targetElo` band move the RESULT?
// Not production code. Nothing imports it.
//
// R10 established that the band moves the POLICY VECTOR. This plays whole games,
// band against band, and counts wins/draws/losses — the claim R10 did not test.
//
// It drives the repo's own EngineSupervisor (apps/server/src/engine-supervisor.ts)
// and maiaDockerSpec (apps/server/src/maia.ts) by relative import and reproduces
// OpponentSelector#maia's command shape (opponent-selector.ts:494-520) exactly:
// the SelfElo/OppoElo handshake defaults are sent first, then `Elo` (which upstream
// sets BOTH self and oppo from — uci.py:383-385), then Temperature/TopP/MultiPV,
// then `position fen <bookFen> moves <gameMoves>` and `go`.
//
// One container serves both bands. That is sound because `cmd_position` rebuilds
// the history deque from scratch on every request (uci.py:437-451) and every option
// is re-sent on every request, so the only state that crosses requests is the
// sampler's RNG — which is the variation this experiment measures, not a confound
// in the conditioning. (R5/D58: an Elo-LESS request inherits the previous band, so
// `Elo` is sent on every single request without exception.)
//
// That RNG is SEEDED, and the first run of this harness discovered it the hard way
// — see the MAIA_SEED comment in main(). Each worker therefore gets its own seed,
// and the worker count is ODD so that worker never lines up with colour.
//
// MultiPV is set to 1: `sample_from_logits` is called before `topk` and does not
// read `self.multipv` (uci.py:322-330), so MultiPV cannot change which move is
// played — it only removes the second value-head forward pass.
import { appendFileSync, readFileSync, writeFileSync } from "node:fs";

import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { isNormal } from "chessops/types";
import { parseUci } from "chessops/util";

import { EngineSupervisor } from "../../apps/server/src/engine-supervisor.js";
import { DEFAULT_MAIA_IMAGE, maiaDockerSpec } from "../../apps/server/src/maia.js";

interface BookEntry {
  readonly bookId: string;
  readonly packId: string;
  readonly phase: string;
  readonly startFen: string;
  readonly historyUci: readonly string[];
  readonly fen: string;
  readonly pieceCount: number;
  readonly destCount: number;
}

interface Player {
  readonly label: string;
  readonly elo: number;
  readonly temperature: number;
  readonly topP: number;
}

// Production defaults (opponent-selector.ts:74-75).
const DEFAULT_TEMPERATURE = 0.8;
const DEFAULT_TOP_P = 0.92;
// Adjudication cap. Scored as a draw in the primary analysis; counted separately.
const PLY_CAP = Number(process.env.PLY_CAP ?? "300");
// Production conditioning is SYMMETRIC: `Elo` sets self AND oppo (uci.py:383-385),
// so a band-1500 mover is told its opponent is also 1500 whoever it is actually
// facing. MAIA_ASYMMETRIC=1 instead sends SelfElo=<mover> / OppoElo=<opponent> and
// no `Elo` at all — the sensitivity arm for "is a null an artefact of production's
// symmetric conditioning?".
const ASYMMETRIC = process.env.MAIA_ASYMMETRIC === "1";

function parsePlayer(spec: string): Player {
  // "<elo>[:<temperature>[:<topP>]]"
  const [eloRaw, tempRaw, topPRaw] = spec.split(":");
  return {
    label: spec,
    elo: Number(eloRaw),
    temperature: tempRaw === undefined ? DEFAULT_TEMPERATURE : Number(tempRaw),
    topP: topPRaw === undefined ? DEFAULT_TOP_P : Number(topPRaw),
  };
}

function repetitionKey(fen: string): string {
  // Board, side to move, castling rights, en-passant square — the fields that
  // define positional identity for threefold. Move counters are dropped.
  return fen.split(" ").slice(0, 4).join(" ");
}

interface GameRecord {
  readonly gameIndex: number;
  readonly round: number;
  readonly shard: number;
  readonly seed: string;
  readonly bookId: string;
  readonly packId: string;
  readonly phase: string;
  readonly pieceCount: number;
  readonly whiteLabel: string;
  readonly blackLabel: string;
  readonly conditioning: "elo" | "self-oppo";
  readonly result: "1-0" | "0-1" | "1/2-1/2" | "void";
  readonly termination: string;
  readonly plies: number;
  readonly movesUci: string;
  readonly elapsedMs: number;
}

async function playGame(
  supervisor: EngineSupervisor,
  entry: BookEntry,
  white: Player,
  black: Player,
  bandDefaults: readonly string[],
  meta: { gameIndex: number; round: number; shard: number; seed: string },
): Promise<GameRecord> {
  const started = Date.now();
  let board = Chess.fromSetup(parseFen(entry.fen).unwrap()).unwrap();
  const played: string[] = [];
  const seen = new Map<string, number>([[repetitionKey(entry.fen), 1]]);
  let result: GameRecord["result"] = "1/2-1/2";
  let termination = "ply-cap";

  for (let ply = 0; ply < PLY_CAP; ply += 1) {
    if (board.isCheckmate()) {
      result = board.turn === "white" ? "0-1" : "1-0";
      termination = "checkmate";
      break;
    }
    if (board.isStalemate()) {
      result = "1/2-1/2";
      termination = "stalemate";
      break;
    }
    if (board.isInsufficientMaterial()) {
      result = "1/2-1/2";
      termination = "insufficient-material";
      break;
    }
    if (board.halfmoves >= 100) {
      result = "1/2-1/2";
      termination = "fifty-move";
      break;
    }
    const mover = board.turn === "white" ? white : black;
    const oppo = board.turn === "white" ? black : white;
    const positionCommand = `position fen ${entry.fen}${
      played.length === 0 ? "" : ` moves ${played.join(" ")}`
    }`;
    const lines = await supervisor.execute("maia-5m", {
      commands: [
        ...(ASYMMETRIC
          ? [
              `setoption name SelfElo value ${mover.elo}`,
              `setoption name OppoElo value ${oppo.elo}`,
            ]
          : [...bandDefaults, `setoption name Elo value ${mover.elo}`]),
        `setoption name Temperature value ${mover.temperature}`,
        `setoption name TopP value ${mover.topP}`,
        "setoption name MultiPV value 1",
        positionCommand,
        "go",
      ],
      until: (line) => line.startsWith("bestmove "),
      timeoutMs: 60_000,
    });
    const uci = /^bestmove ([a-h][1-8][a-h][1-8][qrbn]?)\b/.exec(
      lines.find((line) => line.startsWith("bestmove ")) ?? "",
    )?.[1];
    const move = uci === undefined ? undefined : parseUci(uci);
    if (uci === undefined || !move || !isNormal(move) || !board.isLegal(move)) {
      return {
        ...meta,
        bookId: entry.bookId,
        packId: entry.packId,
        phase: entry.phase,
        pieceCount: entry.pieceCount,
        whiteLabel: white.label,
        blackLabel: black.label,
        conditioning: ASYMMETRIC ? "self-oppo" : "elo",
        result: "void",
        termination: `illegal-or-missing-bestmove:${uci ?? "none"}`,
        plies: played.length,
        movesUci: played.join(" "),
        elapsedMs: Date.now() - started,
      };
    }
    board = board.clone();
    board.play(move);
    played.push(uci);
    const key = repetitionKey(makeFen(board.toSetup()));
    const count = (seen.get(key) ?? 0) + 1;
    seen.set(key, count);
    if (count >= 3) {
      result = "1/2-1/2";
      termination = "threefold";
      break;
    }
  }

  return {
    ...meta,
    bookId: entry.bookId,
    packId: entry.packId,
    phase: entry.phase,
    pieceCount: entry.pieceCount,
    whiteLabel: white.label,
    blackLabel: black.label,
    conditioning: ASYMMETRIC ? "self-oppo" : "elo",
    result,
    termination,
    plies: played.length,
    movesUci: played.join(" "),
    elapsedMs: Date.now() - started,
  };
}

async function main(): Promise<void> {
  const [
    ,
    ,
    bookPath,
    outPath,
    specA = "1500",
    specB = "1600",
    roundsRaw = "1",
    shardRaw = "0",
    shardsRaw = "1",
  ] = process.argv;
  const entries = (JSON.parse(readFileSync(bookPath!, "utf8")) as { entries: BookEntry[] })
    .entries;
  const playerA = parsePlayer(specA);
  const playerB = parsePlayer(specB);
  const rounds = Number(roundsRaw);
  const shard = Number(shardRaw);
  const shards = Number(shardsRaw);

  // Deterministic game schedule. Each (round, entry) contributes exactly two games,
  // the SAME opening played with the two band assignments swapped — so colour is
  // balanced by construction and every opening's own bias cancels within the pair.
  // INVARIANT relied on by analyze.py: an EVEN gameIndex is always the A-white
  // game of its pair. A's colour must never be read off `whiteLabel`, which is
  // ambiguous whenever the two arms carry the same band.
  const schedule: { entry: BookEntry; white: Player; black: Player; round: number }[] = [];
  for (let round = 0; round < rounds; round += 1) {
    for (const entry of entries) {
      schedule.push({ entry, white: playerA, black: playerB, round });
      schedule.push({ entry, white: playerB, black: playerA, round });
    }
  }

  // Thread pinning. The 5M model is essentially single-threaded-optimal (21 moves
  // in 2.36 s at 1 thread vs 2.14 s at 14), so pinning frees the host to run many
  // workers side by side; without it, one worker saturates every core and running
  // six in parallel buys nothing. Measured before pinning: policy is BIT-IDENTICAL
  // at 1 and 2 threads and differs from the 14-thread reduction only in the ~7th
  // significant figure. Every arm is run at the SAME pin so no arm is measured
  // under different arithmetic.
  //
  // Seeding. Measured this pass, and it corrects the standing repo belief:
  // `maia3-uci` calls `seed_everything(cfg.seed)` at process start with
  // `--seed` defaulting to **42** (`maia3/uci.py:525`, `:68`; `utils.py:12-18`),
  // and the shipped ENTRYPOINT does not pass one (`workers/maia/Dockerfile`). So
  // a fresh sidecar's sampled-move stream is a deterministic function of the
  // request sequence it receives, and TWO fresh sidecars given the same requests
  // return byte-identical moves. Without a per-worker seed, two workers driven
  // with mirrored schedules replay the same games and the paired control
  // degenerates to a tautology — which is exactly what the first run showed.
  // MAIA_SEED is therefore appended as a container ARGUMENT (the ENTRYPOINT
  // takes it), and every worker gets a distinct one.
  const spec = maiaDockerSpec({ image: process.env.MAIA_IMAGE ?? DEFAULT_MAIA_IMAGE });
  const threads = process.env.MAIA_THREADS;
  const seed = process.env.MAIA_SEED;
  const image = spec.args[spec.args.length - 1]!;
  const pinnedSpec =
    threads === undefined && seed === undefined
      ? spec
      : {
          ...spec,
          args: [
            "run",
            "--rm",
            "-i",
            ...(threads === undefined
              ? []
              : ["-e", `OMP_NUM_THREADS=${threads}`, "-e", `MKL_NUM_THREADS=${threads}`]),
            image,
            ...(seed === undefined ? [] : ["--seed", seed]),
          ],
        };
  const supervisor = new EngineSupervisor([pinnedSpec]);
  await supervisor.start("maia-5m");
  const health = supervisor.health("maia-5m");
  if (shard === 0) {
    writeFileSync(
      `${outPath}.identity.json`,
      `${JSON.stringify(
        { identity: health.identity, options: health.options, bandRange: health.bandRange },
        null,
        2,
      )}\n`,
    );
  }
  // The shipped band defaults, read off the handshake exactly as #maia does.
  const bandDefaults = ["SelfElo", "OppoElo"].flatMap((name) => {
    const value = health.options?.find((item) => item.name === name)?.default;
    return value === undefined ? [] : [`setoption name ${name} value ${value}`];
  });

  writeFileSync(outPath!, "");
  const started = Date.now();
  let done = 0;
  for (let gameIndex = 0; gameIndex < schedule.length; gameIndex += 1) {
    if (gameIndex % shards !== shard) continue;
    const item = schedule[gameIndex]!;
    const record = await playGame(supervisor, item.entry, item.white, item.black, bandDefaults, {
      gameIndex,
      round: item.round,
      shard,
      seed: seed ?? "42(default)",
    });
    appendFileSync(outPath!, `${JSON.stringify(record)}\n`);
    done += 1;
    if (done % 20 === 0) {
      const rate = (Date.now() - started) / done;
      console.log(`shard=${shard} games=${done} ${(rate / 1000).toFixed(1)}s/game`);
    }
  }
  console.log(`done shard=${shard} games=${done} A=${playerA.label} B=${playerB.label}`);
  await supervisor.shutdown();
}

void main();
