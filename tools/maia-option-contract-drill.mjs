#!/usr/bin/env node
// Disposable D3349 instrument: observe the actual pinned model's UCI advertisement.
// Never modifies model options, installs weights, starts a deployment or claims bot success.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";

const { values } = parseArgs({ options: { image: { type: "string" } } });
if (!values.image || !/^sha256:[0-9a-f]{64}$/u.test(values.image)) throw new Error("requires the actual immutable local Maia image id");
const name = `tabiya-maia-option-proof-${randomUUID()}`;
try {
  const inspected = spawnSync("docker", ["image", "inspect", values.image], { encoding: "utf8" });
  if (inspected.status !== 0) throw new Error(inspected.stderr);
  const [image] = JSON.parse(inspected.stdout);
  assert.equal(image.Id, values.image);
  assert.equal(image.Config.User, "maia");
  assert.equal(image.Config.Labels["org.chess-tabiya.maia3.commit"], "1e13597c42d4858b7cfd7cfdae01e297263364b2");
  const result = spawnSync("docker", ["run", "--rm", "--name", name, "--network", "none", "--read-only", "--tmpfs", "/tmp:rw,nosuid,noexec,size=64m", "--memory", "1536m", "--memory-swap", "1536m", "--interactive", values.image], { input: "uci\nisready\nquit\n", encoding: "utf8", timeout: 90_000 });
  if (result.error || result.status !== 0) throw new Error(result.error?.message ?? result.stderr);
  const lines = result.stdout.trim().split(/\r?\n/u);
  assert(lines.includes("uciok") && lines.includes("readyok"), "real runtime-user model readiness required");
  const options = lines.filter((line) => line.startsWith("option name "));
  for (const name of ["Temperature", "TopP"]) assert.equal(options.find((line) => line.startsWith(`option name ${name} `)), `option name ${name} type string default 1.0`);
  const proof = { question: "D3349", scope: "offline native runtime-user UCI advertisement; not a played bot or deployment proof", image: values.image, platform: `${image.Os}/${image.Architecture}`, observedAt: new Date().toISOString(), options, modelReady: true, exchangeContractCompatible: false, incompatibility: "Temperature and TopP are decimal string options without numeric spin bounds" };
  mkdirSync(".cache/deploy", { recursive: true });
  writeFileSync(".cache/deploy/maia-option-contract-proof.json", JSON.stringify(proof, null, 2) + "\n");
  console.log(JSON.stringify(proof, null, 2));
} finally {
  spawnSync("docker", ["rm", "--force", name], { stdio: "ignore" });
}
