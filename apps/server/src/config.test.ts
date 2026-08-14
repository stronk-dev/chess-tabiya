import { describe, expect, it } from "vitest";

import { cookieSecureFromEnv } from "./config.js";

describe("server configuration", () => {
  it.each([
    [undefined, true],
    ["true", true],
    ["0", true],
    ["FALSE", true],
    ["false", false],
  ] as const)("maps TABIYA_COOKIE_SECURE=%s to %s", (value, expected) => {
    expect(cookieSecureFromEnv(value)).toBe(expected);
  });
});
