export type JsonValue =
  | null
  | boolean
  | number
  | string
  | readonly JsonValue[]
  | { readonly [key: string]: JsonValue };

function assertUnicodeScalarString(value: string): void {
  for (let index = 0; index < value.length; index += 1) {
    const unit = value.charCodeAt(index);
    if (unit >= 0xd800 && unit <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) {
        throw new TypeError("RFC 8785 input contains a lone high surrogate");
      }
      index += 1;
    } else if (unit >= 0xdc00 && unit <= 0xdfff) {
      throw new TypeError("RFC 8785 input contains a lone low surrogate");
    }
  }
}

function canonicalize(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new TypeError("RFC 8785 input numbers must be finite");
    }
    return JSON.stringify(value);
  }
  if (typeof value === "string") {
    assertUnicodeScalarString(value);
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalize(item)).join(",")}]`;
  }
  if (typeof value === "object") {
    const object = value as Record<string, unknown>;
    const entries = Object.keys(object)
      .sort()
      .map((key) => {
        assertUnicodeScalarString(key);
        return `${JSON.stringify(key)}:${canonicalize(object[key])}`;
      });
    return `{${entries.join(",")}}`;
  }
  throw new TypeError(`RFC 8785 input contains unsupported ${typeof value}`);
}

/** RFC 8785 JSON Canonicalization Scheme serialization. */
export function canonicalizeJson(value: unknown): string {
  return canonicalize(value);
}

/** Digest of the complete pack document, including its version. */
export async function digestCanonicalJson(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(canonicalizeJson(value));
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  const hex = [...new Uint8Array(digest)]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
  return `sha256:${hex}`;
}

/** Digest of the complete pack document, including its version. */
export function digestDrillPack(pack: unknown): Promise<string> {
  return digestCanonicalJson(pack);
}
