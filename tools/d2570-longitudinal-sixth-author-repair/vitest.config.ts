import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tools/d2570-longitudinal-sixth-author-repair/contract.test.ts"],
  },
});
