export const DRILL_RUN_SCHEMA_VERSION = "0.16" as const;
export const DRILL_PACK_SCHEMA_VERSION = "0.23" as const;
export const SHAPE_ENTRY_SCHEMA_VERSION = "0.3" as const;

export type DrillRunSchemaVersion = typeof DRILL_RUN_SCHEMA_VERSION;
export type DrillPackSchemaVersion = typeof DRILL_PACK_SCHEMA_VERSION;
export type ShapeEntrySchemaVersion = typeof SHAPE_ENTRY_SCHEMA_VERSION;

export const schemaBuildInfo = Object.freeze({
  drillPackVersion: DRILL_PACK_SCHEMA_VERSION,
  drillRunVersion: DRILL_RUN_SCHEMA_VERSION,
  shapeEntryVersion: SHAPE_ENTRY_SCHEMA_VERSION,
});
