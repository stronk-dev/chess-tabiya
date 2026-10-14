// Opt-in D3799 observation of the unchanged permanent source factory controls.
import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    include: ["packages/runtime/src/evidence-value-authority.test.ts"],
    setupFiles: ["tools/d3792-inspector-demand/source-observer.ts"],
    maxWorkers: 1,
  },
});
