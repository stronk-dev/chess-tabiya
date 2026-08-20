// DISPOSABLE routing audit — D641. Not the future work-register implementation.
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { include: ["tools/work-routing-harness/*.test.ts"], disableConsoleIntercept: true },
});

