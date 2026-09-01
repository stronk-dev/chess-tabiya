import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tools/d2484-phase-band-census/measure.test.ts"],
  },
});
