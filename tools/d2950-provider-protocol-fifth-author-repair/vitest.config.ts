import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { include: ["tools/d2950-provider-protocol-fifth-author-repair/contract.test.ts"] },
});
