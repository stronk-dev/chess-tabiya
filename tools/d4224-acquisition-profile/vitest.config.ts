import { defineConfig } from "vitest/config";
export default defineConfig({ test: { include: ["tools/d4224-acquisition-profile/profile.test.ts"], environment: "node", fileParallelism: false } });
