import assert from "node:assert/strict";
import test from "node:test";

import {
  REQUIRED_NODE_MAJOR,
  REQUIRED_PNPM_VERSION,
  preflightFailures,
} from "./ci-local.mjs";

const valid = {
  nodeVersion: `v${REQUIRED_NODE_MAJOR}.0.0`,
  pnpmVersion: REQUIRED_PNPM_VERSION,
  status: "",
  stockfishCommand: "/tmp/stockfish",
};

test("clean pinned committed bytes pass parity preflight", () => {
  assert.deepEqual(preflightFailures(valid), []);
});

test("toolchain drift and dirty bytes are all refused", () => {
  assert.deepEqual(
    preflightFailures({
      ...valid,
      nodeVersion: "v26.7.0",
      pnpmVersion: "11.17.0",
      status: " M packages/runtime/src/index.ts",
      stockfishCommand: "",
    }),
    [
      "Node 24 is required; found v26.7.0. Use .node-version before running CI parity.",
      "pnpm 11.18.0 is required; found 11.17.0.",
      "the working tree is dirty; CI parity only validates committed bytes",
      "SF_CMD must name an executable Stockfish binary, as it does in CI",
    ],
  );
});
