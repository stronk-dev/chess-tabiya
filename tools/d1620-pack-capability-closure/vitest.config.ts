import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tools/d1620-pack-capability-closure/**/*.test.ts"],
    maxWorkers: 1,
    minWorkers: 1,
  },
});
