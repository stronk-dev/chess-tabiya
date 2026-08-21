// DISPOSABLE acceptance audit — D644. Not production code.
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { include: ["tools/feedback-stage1-criteria-harness/*.test.ts"], disableConsoleIntercept: true },
});
