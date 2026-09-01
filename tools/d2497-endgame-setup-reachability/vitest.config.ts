import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tools/d2497-endgame-setup-reachability/**/*.test.ts"],
    environment: "node",
  },
});
