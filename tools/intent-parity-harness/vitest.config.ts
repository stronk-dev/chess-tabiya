// DISPOSABLE intent-parity harness — D640. Not production code.
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { include: ["tools/intent-parity-harness/*.test.ts"], disableConsoleIntercept: true },
});

