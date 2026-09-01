import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tools/d2496-endgame-method-path/**/*.test.ts"],
    environment: "node",
  },
});
