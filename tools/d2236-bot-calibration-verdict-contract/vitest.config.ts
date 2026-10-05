import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: [{ find: /^chessops\/(.+)$/u, replacement: `${fileURLToPath(new URL("../../apps/server/node_modules/chessops/dist/esm", import.meta.url))}/$1.js` }],
  },
  test: { include: ["tools/d2236-bot-calibration-verdict-contract/population.test.ts", "tools/d2236-bot-calibration-verdict-contract/evaluation.test.ts", "tools/d2236-bot-calibration-verdict-contract/profile-arm.test.ts", "tools/d2236-bot-calibration-verdict-contract/opening-capacity.test.ts", "tools/d2236-bot-calibration-verdict-contract/score-domain-audit.test.ts"], maxWorkers: 1 },
});
