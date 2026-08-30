import { defineConfig } from "vitest/config";
export default defineConfig({ test: { include: ["tools/d2127-intent-presets-author-contract/*.test.ts"], environment: "node" } });
