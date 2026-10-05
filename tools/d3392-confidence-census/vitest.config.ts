import { defineConfig } from "vitest/config";
export default defineConfig({ test: { include: ["tools/d3392-confidence-census/census.test.ts"], maxWorkers: 1 } });
