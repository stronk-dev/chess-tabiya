#!/usr/bin/env node
// Test-only Docker process boundary. The production Make recipe remains the subject under test.
import { appendFileSync } from "node:fs";

const args = process.argv.slice(2);
appendFileSync(process.env.TABIYA_TEST_DOCKER_LOG, `${JSON.stringify({ args, project: process.env.COMPOSE_PROJECT_NAME, volume: process.env.TABIYA_DATA_VOLUME })}\n`);
const plan = JSON.parse(process.env.TABIYA_TEST_DOCKER_PLAN);
let stage;
if (args.join(" ") === "compose ps --quiet --status running server") stage = "ps";
else if (args.join(" ") === "compose stop server") stage = "stop";
else if (args.join(" ") === "compose start server") stage = "start";
else if (args[0] === "volume" && args[1] === "inspect") {
  process.exit(1); // Fresh restore target does not exist; no real volume is inspected or created.
}
else if (args[0] === "compose" && args.includes("storage-admin")) {
  const run = args.indexOf("run");
  const operation = plan.operation ?? ["backup"];
  if (JSON.stringify(args.slice(run)) !== JSON.stringify(["run", "--rm", "storage-admin", ...operation])) {
    console.error("maintenance selected the wrong operation or arguments");
    process.exit(97);
  }
  stage = operation[0];
  const files = args.slice(1, run);
  const expected = (plan.files ?? ["compose.yaml", "compose.maintenance.yaml"]).flatMap(file => ["-f", file]);
  if (JSON.stringify(files) !== JSON.stringify(expected)) {
    console.error("maintenance selected the wrong Compose files");
    process.exit(98);
  }
}
else {
  console.error("unexpected Docker invocation in storage wrapper fixture");
  process.exit(99);
}
const status = plan[`${stage}Status`] ?? 0;
if (status !== 0) console.error(`fixture ${stage} failed (${status})`);
if (stage === "ps" && status === 0 && plan.running) console.log("fixture-server-container");
if (args.includes("storage-admin")) console.log(JSON.stringify({ operation: stage, result: status === 0 ? "succeeded" : "failed" }));
process.exit(status);
