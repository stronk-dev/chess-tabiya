import { readFileSync } from "node:fs";

import { permittedAssistance } from "@chess-tabiya/runtime";
import { describe, expect, it } from "vitest";

const drill = readFileSync(new URL("./DrillScreen.svelte", import.meta.url), "utf8");
const timeline = readFileSync(new URL("./Timeline.svelte", import.meta.url), "utf8");

describe("client surface floor", () => {
  it("binds every compact tab to a real region", () => {
    const declaration = /let compactTab: ([^=]+)= \$state/u.exec(drill)?.[1] ?? "";
    const members = [...declaration.matchAll(/"([a-z]+)"/gu)].map((match) => match[1]);
    expect(members).toEqual(["timeline", "branches", "evidence"]);
    for (const member of members) {
      expect(drill).toContain(`class:compact-active={compactTab === "${member}"}`);
    }
    const markup = drill.slice(drill.indexOf("</script>") + "</script>".length);
    expect(markup).not.toContain("viewerRole");
    expect(drill).toContain("role: viewerRole");
  });

  it("keeps interactive timeline markers at least 24 CSS pixels", () => {
    const pivotal = /\.pivotal-marker\{([^}]+)\}/u.exec(timeline)?.[1] ?? "";
    expect(pivotal).toContain("min-width:1.5rem");
    expect(pivotal).toContain("min-height:1.5rem");
    expect(1.5 * 16).toBeGreaterThanOrEqual(24);

    const shape = /\.shape-marker\{([^}]+)\}/u.exec(timeline)?.[1] ?? "";
    const lineBox = 0.65 * 16 * 1.2;
    const verticalPadding = 0.3 * 16 * 2;
    const borders = 2;
    expect(shape).toContain("font:.65rem/1.2");
    expect(shape).toContain("padding:.3rem .45rem");
    expect(lineBox + verticalPadding + borders).toBeGreaterThanOrEqual(24);
  });

  it("keeps participant and spectator evidence permissions role-scoped", () => {
    for (const role of ["participant", "spectator"] as const) {
      const permission = permittedAssistance({
        sessionKind: "position",
        deliveryOpen: true,
        role,
      });
      expect(permission.humanSplit).toBe("locked_off");
      expect(permission.corpus).toBe("locked_off");
      expect(permission.boardLighting).toBe("sight");
      expect(permission.arrows).toBe("sight");
    }
  });
});
