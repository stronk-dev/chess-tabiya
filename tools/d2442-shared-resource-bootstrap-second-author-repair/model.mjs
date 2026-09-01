import crypto from "node:crypto";

const PREFIX = Buffer.from("chess-tabiya/shared-resource/v1\0", "utf8");

function assertString(value) {
  for (let index = 0; index < value.length; index += 1) {
    const unit = value.charCodeAt(index);
    if (unit >= 0xd800 && unit <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) throw new TypeError("unpaired surrogate");
      index += 1;
    } else if (unit >= 0xdc00 && unit <= 0xdfff) throw new TypeError("unpaired surrogate");
  }
}

function encode(value, seen) {
  if (value === null || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "string") {
    assertString(value);
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    if (!Number.isSafeInteger(value) || Object.is(value, -0)) throw new TypeError("number outside canonical domain");
    return JSON.stringify(value);
  }
  if (typeof value !== "object") throw new TypeError("value outside canonical domain");
  if (seen.has(value)) throw new TypeError("cycle");
  seen.add(value);
  try {
    if (Array.isArray(value)) {
      for (let index = 0; index < value.length; index += 1) {
        if (!Object.hasOwn(value, index)) throw new TypeError("sparse array");
      }
      return "[" + value.map((item) => encode(item, seen)).join(",") + "]";
    }
    if (Object.getPrototypeOf(value) !== Object.prototype) throw new TypeError("non-plain object");
    const descriptors = Object.getOwnPropertyDescriptors(value);
    const keys = Object.keys(descriptors).sort();
    for (const key of keys) {
      assertString(key);
      if (descriptors[key].get || descriptors[key].set) throw new TypeError("accessor");
      if (!descriptors[key].enumerable) throw new TypeError("non-enumerable property");
    }
    return "{" + keys.map((key) => JSON.stringify(key) + ":" + encode(descriptors[key].value, seen)).join(",") + "}";
  } finally {
    seen.delete(value);
  }
}

export function canonicalSharedResourceBytes(value) {
  return Buffer.from(encode(value, new Set()), "utf8");
}

export function sharedResourceDigest(value) {
  return "sha256:" + crypto.createHash("sha256").update(PREFIX).update(canonicalSharedResourceBytes(value)).digest("hex");
}

export function selectorState(selectors, resolvedSelectors) {
  const resolved = new Set(resolvedSelectors);
  const count = selectors.filter((selector) => resolved.has(selector)).length;
  if (count === 0) return "absent";
  if (count === selectors.length) return "landed";
  return "partial";
}

export function validateSelectorPopulation(descriptors) {
  const identities = new Set();
  for (const descriptor of descriptors) {
    for (const selector of descriptor.selectors) {
      if (selector.startsWith("/") || selector.includes("..") || selector.includes("*") || !selector.includes("#")) {
        throw new Error("unsafe selector " + selector);
      }
      if (identities.has(selector)) throw new Error("duplicate selector " + selector);
      identities.add(selector);
    }
  }
}

export function assertAdoption({ before, after }) {
  if (before.registered || after.introduction !== "adopted") throw new Error("not an adoption");
  if (before.selectorState !== "landed" || after.selectorState !== "landed") throw new Error("adoption requires complete roots");
  if (before.projectedDigest !== after.projectedDigest) throw new Error("adoption changed product projection");
  if (after.liveClaims !== 0) throw new Error("adoption cannot carry a live claim");
  if (after.landedRows.length !== 1 || after.landedRows[0] !== "adopted@" + after.head) {
    throw new Error("adoption requires one current baseline");
  }
}

export function assertCanonicalResource(id, value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new Error("resource object required");
  const keys = Object.keys(value).sort();
  if (keys.join(",") !== "digest,id,payload,version") throw new Error("partial or extra resource object");
  if (value.id !== id || !Number.isSafeInteger(value.version) || value.version < 1) throw new Error("invalid resource identity");
  const expected = sharedResourceDigest({ id: value.id, version: value.version, payload: value.payload });
  if (value.digest !== expected) throw new Error("resource digest mismatch");
  return Object.freeze({ state: "landed", identity: { version: value.version }, semantic: value.payload, digest: value.digest });
}

export function projectCanonicalResource(descriptor, value) {
  if (descriptor.adapter !== "canonical_resource@1") throw new Error("wrong adapter");
  return assertCanonicalResource(descriptor.id, value);
}
