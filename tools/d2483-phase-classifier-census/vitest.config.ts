import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tools/d2483-phase-classifier-census/measure.test.ts"],
  },
});
