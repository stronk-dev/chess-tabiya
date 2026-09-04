import { defineConfig } from "vitest/config";
export default defineConfig({ test: { include: ["tools/d2614-safe-deployment-second-author-repair/contract.test.ts"], pool: "forks", maxWorkers: 1 } });
