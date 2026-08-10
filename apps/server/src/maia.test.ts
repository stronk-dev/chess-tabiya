import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  DEFAULT_MAIA_IMAGE,
  MAIA3_MODEL_ID,
  MAIA3_SOURCE_COMMIT,
  maiaDockerSpec,
} from "./maia.js";

const dockerfile = readFileSync(
  new URL("../../../workers/maia/Dockerfile", import.meta.url),
  "utf8",
);

describe("Maia production sidecar definition", () => {
  it("pins source/model and makes history conditioning non-optional", () => {
    expect(dockerfile).toContain(`ARG MAIA3_COMMIT=${MAIA3_SOURCE_COMMIT}`);
    expect(dockerfile).toContain(MAIA3_MODEL_ID.split("@")[1]);
    expect(dockerfile).toContain(
      'ENTRYPOINT ["maia3-uci", "--model", "5m", "--use-uci-history"]',
    );
    expect(dockerfile).toContain("ENV HF_HUB_OFFLINE=1");
  });

  it("configures Docker supervision and records first-contact seed absence", () => {
    const digest = `sha256:${"a".repeat(64)}`;
    const spec = maiaDockerSpec({ containerDigest: digest });

    expect(spec).toMatchObject({
      id: "maia-5m",
      kind: "opponent",
      command: "docker",
      args: ["run", "--rm", "-i", DEFAULT_MAIA_IMAGE],
      name: "Maia3",
      version: MAIA3_SOURCE_COMMIT,
      modelId: MAIA3_MODEL_ID,
      containerDigest: digest,
    });
    expect(spec.seedOption).toBeUndefined();
  });
});
