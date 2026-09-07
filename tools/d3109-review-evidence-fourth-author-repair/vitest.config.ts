import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tools/d3109-review-evidence-fourth-author-repair/contract.test.ts"],
  },
});
