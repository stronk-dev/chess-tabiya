import { defineConfig } from "vitest/config";
import common from "../d1713-semantic-validation-matrix/vitest.config.js";
export default defineConfig({ ...common, test: {
  include: ["tools/d4175-outcome-delivery/measure.test.ts", "tools/d4175-outcome-delivery/sampling.test.ts"],
  fileParallelism: false,
  environment: "node",
  disableConsoleIntercept: true,
} });
