import { runtimeBuildInfo } from "@repo/runtime";
import { schemaBuildInfo } from "@repo/schema";

export const serverBuildInfo = Object.freeze({
  runtime: runtimeBuildInfo,
  schema: schemaBuildInfo,
});
