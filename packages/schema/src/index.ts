export const DRILL_RUN_SCHEMA_VERSION = "0.2" as const;
export const DRILL_PACK_SCHEMA_VERSION = "0.2" as const;

export type DrillRunSchemaVersion = typeof DRILL_RUN_SCHEMA_VERSION;

export const schemaBuildInfo = Object.freeze({
  drillPackVersion: "0.2",
  drillRunVersion: DRILL_RUN_SCHEMA_VERSION,
});
