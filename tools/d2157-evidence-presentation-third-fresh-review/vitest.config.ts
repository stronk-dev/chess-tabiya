import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tools/d2157-evidence-presentation-third-fresh-review/*.test.ts"],
  },
});
