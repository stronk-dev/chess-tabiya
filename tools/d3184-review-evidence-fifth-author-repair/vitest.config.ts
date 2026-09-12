import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tools/d3184-review-evidence-fifth-author-repair/contract.test.mts"],
    environment: "node",
  },
});
