// DISPOSABLE planning register — D642. This is not the graduation implementation.

export const MECHANISM_FILES = Object.freeze([
  "schemas/drill_pack.schema.json",
  "packages/schema/src/index.ts",
  "packages/schema/src/drill-pack/types.ts",
  "packages/schema/src/drill-pack.test.ts",
  "apps/server/src/pack-validation.ts",
  "apps/server/src/graduation-report.ts",
  "apps/server/src/sourcing/graduation-clear.ts",
  "apps/server/src/sourcing/graduation-templates.ts",
  "apps/server/src/sourcing/openings.ts",
  "apps/server/src/sourcing/position-seeds.ts",
  "apps/server/src/sourcing/syzygy.ts",
  "apps/server/src/distill.ts",
  "apps/server/package.json",
  "Makefile",
] as const);

export const CORPUS_ROOTS = Object.freeze([
  "content/drafts/",
  "content/candidates/",
] as const);

export const KNOWN_JUDGEMENT_RESIDUE = Object.freeze({
  draftHandTable: 17,
  candidateUnrecognised: 2,
  resolvedRemovedReferent: 1,
} as const);
