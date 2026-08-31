import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tools/d2436-evidence-presentation-fifth-fresh-review/contract.test.ts"],
  },
});
