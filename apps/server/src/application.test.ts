import type { AddressInfo } from "node:net";

import { afterEach, describe, expect, it } from "vitest";

import { createApplication, type ChessTabiyaApplication } from "./application.js";

describe("development application mock opponent", () => {
  let application: ChessTabiyaApplication | undefined;

  afterEach(async () => {
    await application?.close();
    application = undefined;
  });

  it("plays the deterministic Pack A opponent spine from its black-to-move root", async () => {
    application = await createApplication({
      development: true,
      engineMode: "mock",
      cookieSecure: false,
    });
    await new Promise<void>((resolve, reject) => {
      application!.server.once("error", reject);
      application!.server.listen(0, "127.0.0.1", resolve);
    });
    const address = application.server.address() as AddressInfo;
    const origin = `http://127.0.0.1:${address.port}`;
    const registered = await fetch(`${origin}/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ handle: "engine_test", password: "engine-test-password" }),
    });
    expect(registered.status).toBe(201);
    const cookie = registered.headers.get("set-cookie")!.split(";", 1)[0]!;
    const packs = (await (await fetch(`${origin}/packs`)).json()) as {
      id: string;
      digest: string;
    }[];
    const pack = packs.find((candidate) => candidate.id === "anti-caro-advance-c5-race");
    expect(pack).toBeDefined();

    const choose = async (historyUci: readonly string[]) => {
      const response = await fetch(`${origin}/select-move`, {
        method: "POST",
        headers: { "content-type": "application/json", cookie },
        body: JSON.stringify({
          startFen:
            "rnbqkbnr/pp2pppp/2p5/3pP3/3P4/8/PPP2PPP/RNBQKBNR b KQkq - 0 3",
          historyUci,
          policy: {
            mode: "human_common",
            policyConfigDigest: pack!.digest,
            targetElo: 1800,
          },
          seed: 23,
        }),
      });
      const text = await response.text();
      expect(response.status, text).toBe(200);
      return JSON.parse(text) as { moveUci: string };
    };

    await expect(choose([])).resolves.toMatchObject({ moveUci: "c8f5" });
    await expect(choose(["c8f5", "g1f3"])).resolves.toMatchObject({
      moveUci: "e7e6",
    });
    await expect(
      choose(["c8f5", "g1f3", "e7e6", "f1e2"]),
    ).resolves.toMatchObject({ moveUci: "c6c5" });
  });
});
