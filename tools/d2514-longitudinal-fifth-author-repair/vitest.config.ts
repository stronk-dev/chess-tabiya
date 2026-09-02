import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tools/d2514-longitudinal-fifth-author-repair/**/*.test.ts"],
    environment: "node",
  },
});
