// DISPOSABLE planning harness — D639. Not production code.
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { include: ["tools/research-sufficiency-harness/*.test.ts"], disableConsoleIntercept: true },
});

