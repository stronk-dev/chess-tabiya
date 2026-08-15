import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  DEFAULT_MAIA_IMAGE,
  MAIA3_BAND_RANGE,
  MAIA3_MODEL_ID,
  MAIA3_SOURCE_COMMIT,
  maiaDockerSpec,
  maiaNetworkSpec,
} from "./maia.js";

const dockerfile = readFileSync(
  new URL("../../../workers/maia/Dockerfile", import.meta.url),
  "utf8",
);
const policyPatch = readFileSync(
  new URL(
    "../../../workers/maia/patches/maia3-uci-policy-mass.patch",
    import.meta.url,
  ),
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
    expect(dockerfile).toContain(
      "git -C /opt/maia3 apply --check /tmp/maia3-uci-policy-mass.patch",
    );
    expect(policyPatch).toContain("policy {float(item['policy']):.12g}");
    expect(policyPatch).not.toContain("policy {cp}");
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
      bandRange: MAIA3_BAND_RANGE,
      containerDigest: digest,
    });
    expect(spec.seedOption).toBeUndefined();
    expect(spec.bandOption).toBe("Elo");
    expect(spec.bandRange).toEqual({ min: 1000, max: 2400 });
    expect(maiaNetworkSpec("maia", 7000)).toMatchObject({
      command: "nc",
      args: ["maia", "7000"],
      bandOption: "Elo",
      bandRange: { min: 1000, max: 2400 },
    });
  });
});
