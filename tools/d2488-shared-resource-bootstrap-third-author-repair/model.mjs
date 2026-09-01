const ADAPTER_KEYS = Object.freeze({
  "json_schema_id@1": ["adapter", "schemaSelector", "versionSelector"],
  "migration_sequence@1": ["adapter", "headSelector", "sequenceSelector"],
  "literal_string_tuple@1": ["adapter", "rootSelector"],
  "literal_string_union@1": ["adapter", "rootSelector"],
  "canonical_resource@1": ["adapter", "rootSelector"],
  "typescript_contract@1": ["adapter", "externalEdges", "repositoryEdges", "roots", "versionSelector"],
  "versioned_declarations@1": ["adapter", "idField", "rootSelector", "versionField"],
});

const COMPATIBILITY = Object.freeze({
  sequential: Object.freeze({
    adapters: Object.freeze([
      "canonical_resource@1",
      "json_schema_id@1",
      "migration_sequence@1",
      "typescript_contract@1",
    ]),
    claimModes: Object.freeze(["prose", "whole_projection"]),
  }),
  member_set: Object.freeze({
    adapters: Object.freeze(["literal_string_tuple@1", "literal_string_union@1"]),
    claimModes: Object.freeze(["members"]),
  }),
  lineage_set: Object.freeze({
    adapters: Object.freeze(["versioned_declarations@1"]),
    claimModes: Object.freeze(["members"]),
  }),
});

function fail(message) {
  throw new TypeError(message);
}

function exactKeys(value, expected, label) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) fail(`${label} must be an object`);
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (actual.join("\0") !== wanted.join("\0")) fail(`${label} keys differ`);
}

function assertSelector(selector, nullable = false) {
  if (nullable && selector === null) return;
  if (typeof selector !== "string" || selector.startsWith("/") || selector.includes("..") || selector.includes("*")) {
    fail("unsafe selector");
  }
  const split = selector.indexOf("#");
  if (split < 1 || split === selector.length - 1 || selector.indexOf("#", split + 1) !== -1) fail("invalid selector");
  const suffix = selector.slice(split + 1);
  if (suffix === "$id") return;
  const segments = suffix.split("/");
  for (const segment of segments) {
    if (!/^(?:export|interface|type|function|class|private-method|method|local|member|object):[$\p{ID_Start}_][$\p{ID_Continue}_]*$/u.test(segment) && segment !== "literal") {
      fail(`invalid selector segment ${segment}`);
    }
  }
}

export function selectorsFor(projection) {
  switch (projection.adapter) {
    case "json_schema_id@1": return projection.versionSelector === null
      ? [projection.schemaSelector]
      : [projection.schemaSelector, projection.versionSelector];
    case "migration_sequence@1": return [projection.sequenceSelector, projection.headSelector];
    case "typescript_contract@1": return [...projection.roots, projection.versionSelector];
    case "literal_string_tuple@1":
    case "literal_string_union@1":
    case "canonical_resource@1":
    case "versioned_declarations@1": return [projection.rootSelector];
    default: fail(`unknown adapter ${String(projection.adapter)}`);
  }
}

export function validateDescriptor(descriptor) {
  exactKeys(descriptor, ["id", "lifecycle", "projection", "claimMode", "introducedBy", "introduction"], "descriptor");
  if (!/^[a-z][a-z0-9-]*$/u.test(descriptor.id)) fail("invalid descriptor id");
  if (!/^[a-z0-9-]+\.md$/u.test(descriptor.introducedBy)) fail("invalid introducedBy");
  if (!(["existing", "absent", "adopted"]).includes(descriptor.introduction)) fail("invalid introduction");
  const keys = ADAPTER_KEYS[descriptor.projection?.adapter];
  if (keys === undefined) fail("unknown adapter");
  exactKeys(descriptor.projection, keys, "projection");
  const compatibility = COMPATIBILITY[descriptor.lifecycle];
  if (compatibility === undefined || !compatibility.adapters.includes(descriptor.projection.adapter)) fail("incompatible lifecycle adapter");
  if (!compatibility.claimModes.includes(descriptor.claimMode)) fail("incompatible claim mode");
  if (descriptor.projection.adapter === "typescript_contract@1") {
    if (!Array.isArray(descriptor.projection.roots) || descriptor.projection.roots.length === 0) fail("typescript roots required");
    if (descriptor.projection.repositoryEdges !== "transitive" || descriptor.projection.externalEdges !== "resolved_signature") fail("invalid graph policy");
  }
  if (descriptor.projection.adapter === "versioned_declarations@1" &&
      (descriptor.projection.idField !== "id" || descriptor.projection.versionField !== "version")) fail("invalid declaration fields");
  for (const selector of selectorsFor(descriptor.projection)) assertSelector(selector);
  return descriptor;
}

export function validateCatalogue(catalogue) {
  exactKeys(catalogue, ["schemaVersion", "resources"], "catalogue");
  if (catalogue.schemaVersion !== 1 || !Array.isArray(catalogue.resources)) fail("invalid catalogue envelope");
  const ids = catalogue.resources.map((descriptor) => validateDescriptor(descriptor).id);
  if (new Set(ids).size !== ids.length) fail("duplicate resource id");
  if (ids.join("\0") !== [...ids].sort().join("\0")) fail("resources are not ASCII sorted");
  const selectors = catalogue.resources.flatMap((descriptor) => selectorsFor(descriptor.projection));
  if (new Set(selectors).size !== selectors.length) fail("duplicate selector");
  return catalogue;
}

export function resolveSelectorPopulation(descriptor, resolvedSelectors, projectionResult = undefined) {
  const owned = selectorsFor(descriptor.projection);
  const resolved = owned.filter((selector) => resolvedSelectors.includes(selector));
  const missing = owned.filter((selector) => !resolvedSelectors.includes(selector));
  if (resolved.length === 0) return Object.freeze({ state: "absent", resolvedSelectors: Object.freeze([]), missingSelectors: Object.freeze(missing) });
  if (missing.length > 0) return Object.freeze({ state: "partial", resolvedSelectors: Object.freeze(resolved), missingSelectors: Object.freeze(missing) });
  if (projectionResult?.ok !== true) return Object.freeze({ state: "invalid", resolvedSelectors: Object.freeze(resolved), missingSelectors: Object.freeze([]), diagnostics: Object.freeze(projectionResult?.diagnostics ?? ["invalid projection"]) });
  return Object.freeze({ state: "landed", resolvedSelectors: Object.freeze(resolved), missingSelectors: Object.freeze([]), projection: projectionResult.value });
}
