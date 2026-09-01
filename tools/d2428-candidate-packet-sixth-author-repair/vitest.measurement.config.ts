import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tools/d2428-candidate-packet-sixth-author-repair/measurement.test.ts"],
    environment: "node",
  },
});
