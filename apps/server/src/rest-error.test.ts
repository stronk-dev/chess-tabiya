import { describe, expect, it } from "vitest";

import { ServerError } from "./errors.js";
import { errorResponse } from "./rest.js";

describe("REST error status mapping", () => {
  it("maps invalid pack documents to a typed 422 instead of an internal error", async () => {
    const response = errorResponse(new ServerError("PACK_INVALID", "Pack validation failed", {
      details: { issues: [{ path: "/requiredCapabilities", code: "CAPABILITY_UNSUPPORTED" }] },
    }));

    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({
      error: {
        code: "PACK_INVALID",
        message: "Pack validation failed",
        issues: [{ path: "/requiredCapabilities", code: "CAPABILITY_UNSUPPORTED" }],
      },
    });
  });
});
