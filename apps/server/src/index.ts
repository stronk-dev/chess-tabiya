import { runtimeBuildInfo } from "@chess-tabiya/runtime";
import { schemaBuildInfo } from "@chess-tabiya/schema";

export const serverBuildInfo = Object.freeze({
  runtime: runtimeBuildInfo,
  schema: schemaBuildInfo,
});
