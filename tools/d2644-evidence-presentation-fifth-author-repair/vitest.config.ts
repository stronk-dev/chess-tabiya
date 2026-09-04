import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tools/d2644-evidence-presentation-fifth-author-repair/**/*.test.ts"],
    environment: "node",
  },
});
