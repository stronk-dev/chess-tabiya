import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { include: ["tools/d2495-endgame-technique-applicability/geometry.test.ts"] },
});
