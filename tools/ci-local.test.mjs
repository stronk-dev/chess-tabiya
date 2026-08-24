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
  stockfishCommand: "/tmp/stockfish",
  dockerComposeAvailable: true,
};

test("the pinned CI toolchain passes parity preflight", () => {
  assert.deepEqual(preflightFailures(valid), []);
});

test("toolchain and required service drift are all refused", () => {
  assert.deepEqual(
    preflightFailures({
      ...valid,
      nodeVersion: "v26.7.0",
      pnpmVersion: "11.17.0",
      stockfishCommand: "",
      dockerComposeAvailable: false,
    }),
    [
      "Node 24 is required; found v26.7.0. Use .node-version before running CI parity.",
      "pnpm 11.18.0 is required; found 11.17.0.",
      "SF_CMD must name an executable Stockfish binary, as it does in CI",
      "Docker Compose must be available because schema verification renders every deployment profile",
    ],
  );
});
