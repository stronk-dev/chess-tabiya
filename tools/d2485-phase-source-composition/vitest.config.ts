import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { include: ["tools/d2485-phase-source-composition/compose.test.ts"] },
});
