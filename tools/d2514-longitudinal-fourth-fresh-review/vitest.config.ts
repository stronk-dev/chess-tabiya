import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tools/d2514-longitudinal-fourth-fresh-review/**/*.test.ts"],
    environment: "node",
  },
});
