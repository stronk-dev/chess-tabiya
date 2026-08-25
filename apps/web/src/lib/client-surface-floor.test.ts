import { permittedAssistance } from "@chess-tabiya/runtime";
import { describe, expect, it } from "vitest";

describe("client surface floor", () => {
  it("keeps participant and spectator evidence permissions role-scoped", () => {
    for (const role of ["participant", "spectator"] as const) {
      const permission = permittedAssistance({
        sessionKind: "position",
        workflowContext: "position",
        deliveryOpen: true,
        role,
        seatedInContest: false,
        reviewing: false,
      });
      expect(permission.humanSplit).toBe("locked_off");
      expect(permission.corpus).toBe("locked_off");
      expect(permission.boardLighting).toBe("sight");
      expect(permission.arrows).toBe("sight");
    }
  });

  it("keeps every non-host assistance permission pointwise at or below the host ceiling", () => {
    const rank = { locked_off: 0, free: 1, sight: 1, evidence: 2 } as const;
    for (const deliveryOpen of [false, true]) {
      const host = permittedAssistance({ sessionKind: "position", workflowContext: "position", deliveryOpen, role: "host", seatedInContest: false, reviewing: false });
      const solo = permittedAssistance({ sessionKind: "position", workflowContext: "position", deliveryOpen, role: "solo", seatedInContest: false, reviewing: false });
      expect(host).toEqual(solo);
      for (const role of ["participant", "spectator"] as const) {
        const candidate = permittedAssistance({ sessionKind: "position", workflowContext: "position", deliveryOpen, role, seatedInContest: false, reviewing: false });
        for (const key of Object.keys(host) as (keyof typeof host)[]) expect(rank[candidate[key]]).toBeLessThanOrEqual(rank[host[key]]);
      }
    }
  });
});
