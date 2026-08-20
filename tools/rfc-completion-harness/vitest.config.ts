// DISPOSABLE research harness — D637/D638. Not production code.
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { include: ["tools/rfc-completion-harness/*.test.ts"], disableConsoleIntercept: true },
});

