// DISPOSABLE readiness harness — D642. Not production code.
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { include: ["tools/graduation-readiness-harness/*.test.ts"], disableConsoleIntercept: true },
});
