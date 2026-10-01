#!/usr/bin/env node
// Disposable D3349 instrument: observe the actual pinned model's UCI advertisement.
// Optional D3352 policy capture applies explicit fixed diagnostic requests to an isolated model;
// never changes weights, starts an operator deployment or claims a played bot.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";

const { values } = parseArgs({ options: { image: { type: "string" }, policy: { type: "boolean", default: false } } });
if (!values.image || !/^sha256:[0-9a-f]{64}$/u.test(values.image)) throw new Error("requires the actual immutable local Maia image id");
const name = `tabiya-maia-option-proof-${randomUUID()}`;
try {
  const inspected = spawnSync("docker", ["image", "inspect", values.image], { encoding: "utf8" });
  if (inspected.status !== 0) throw new Error(inspected.stderr);
  const [image] = JSON.parse(inspected.stdout);
  assert.equal(image.Id, values.image);
  assert.equal(image.Config.User, "maia");
  assert.equal(image.Config.Labels["org.chess-tabiya.maia3.commit"], "1e13597c42d4858b7cfd7cfdae01e297263364b2");
  const commands = values.policy ? ["uci", "isready", "setoption name Elo value 1400", "setoption name Temperature value 1", "setoption name TopP value 1", "setoption name MultiPV value 20", "position startpos moves e2e4", "go", "position startpos moves d2d4", "go", "quit"] : ["uci", "isready", "quit"];
  const result = spawnSync("docker", ["run", "--rm", "--name", name, "--network", "none", "--read-only", "--tmpfs", "/tmp:rw,nosuid,noexec,size=64m", "--memory", "1536m", "--memory-swap", "1536m", "--interactive", values.image], { input: commands.join("\n") + "\n", encoding: "utf8", timeout: 90_000 });
  if (result.error || result.status !== 0) throw new Error(result.error?.message ?? result.stderr);
  const lines = result.stdout.trim().split(/\r?\n/u);
  assert(lines.includes("uciok") && lines.includes("readyok"), "real runtime-user model readiness required");
  const options = lines.filter((line) => line.startsWith("option name "));
  for (const name of ["Temperature", "TopP"]) assert.equal(options.find((line) => line.startsWith(`option name ${name} `)), `option name ${name} type string default 1.0`);
  const proof = { question: "D3349", scope: "offline native runtime-user UCI advertisement; not a played bot or deployment proof", image: values.image, platform: `${image.Os}/${image.Architecture}`, observedAt: new Date().toISOString(), options, modelReady: true, exchangeContractCompatible: false, incompatibility: "Temperature and TopP are decimal string options without numeric spin bounds" };
  if (values.policy) {
    const pages = []; let rows = [];
    for (const line of lines) {
      if (line.startsWith("info ")) rows.push(line);
      else if (line.startsWith("bestmove ")) { pages.push({ rows, bestmove: line, policyMass: rows.reduce((sum, row) => sum + Number(/\bpolicy ([^ ]+)/u.exec(row)?.[1] ?? NaN), 0) }); rows = []; }
    }
    assert.equal(pages.length, 2, "both actual diagnostic policy pages required");
    const capture = { question: "D3352", scope: "actual offline model responses, not sealed provider evidence or a played bot", image: values.image, platform: proof.platform, observedAt: proof.observedAt, commands, pages };
    mkdirSync(".cache/deploy", { recursive: true });
    writeFileSync(".cache/deploy/maia-policy-contract-proof.json", JSON.stringify(capture, null, 2) + "\n");
    console.log(JSON.stringify(capture, null, 2));
    // Keep the original advertisement observation immutable; this instrument does not evaluate
    // the amended profile or claim compatibility from model readiness.
    process.exitCode = 0;
  } else {
  mkdirSync(".cache/deploy", { recursive: true });
  writeFileSync(".cache/deploy/maia-option-contract-proof.json", JSON.stringify(proof, null, 2) + "\n");
  console.log(JSON.stringify(proof, null, 2));
  }
} finally {
  spawnSync("docker", ["rm", "--force", name], { stdio: "ignore" });
}
