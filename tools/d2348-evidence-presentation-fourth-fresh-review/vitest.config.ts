import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tools/d2348-evidence-presentation-fourth-fresh-review/*.test.ts"],
  },
});
