import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tools/d2402-longitudinal-fourth-author-repair/**/*.test.ts"],
    environment: "node",
  },
});
