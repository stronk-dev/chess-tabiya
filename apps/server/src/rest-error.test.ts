import { describe, expect, it } from "vitest";
import { EvidenceBindingExecutionError, EvidenceExecutionError } from "@chess-tabiya/runtime";

import { ServerError } from "./errors.js";
import { errorResponse } from "./rest.js";

describe("REST error status mapping", () => {
  it.each([
    new EvidenceBindingExecutionError("BINDING_SOURCE_ABSENCE", "private source diagnostic"),
    new EvidenceExecutionError("EXECUTION_SOURCE_UNREGISTERED", "private source diagnostic"),
  ])("keeps execution failures generic and retryable", async error => {
    const response = errorResponse(error);
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: { code: "EVIDENCE_UNAVAILABLE", message: "Evidence execution contract is unavailable" } });
  });

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
