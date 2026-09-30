// `make pack-stamp FILE=<pack.json> [FILE=…]` — the authoring writer for rfc/pack-capability-contract.md
// §4.1: rewrites a pack document's `requires` with the one derived canonical array. The stamp is never
// authored by hand; this is the command an author runs after editing a pack's content. It preserves
// the file's JSON layout convention (two-space pretty JSON) and reports whether the bytes changed.

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { PrincipleRegistry } from "../principle-registry.js";
import { ShapeRegistry } from "../shape-registry.js";
import { withDerivedRequires } from "./pack-capabilities.js";

/**
 * Two-space pretty JSON is rewritten whole. A hand-laid-out document (the schema example and its
 * fixtures keep short arrays on one line) gains the stamp as a trailing key, one requirement per line,
 * so its existing layout is untouched.
 */
function layout(before: string, parsed: Readonly<Record<string, unknown>>, stamped: Readonly<Record<string, unknown>> & { readonly requires: readonly unknown[] }): string {
  if (before === `${JSON.stringify(parsed, null, 2)}\n`) return `${JSON.stringify(stamped, null, 2)}\n`;
  const trailing = before.lastIndexOf(',\n  "requires": [\n');
  if (Object.hasOwn(parsed, "requires") && (trailing < 0 || !before.endsWith("\n  ]\n}\n"))) return `${JSON.stringify(stamped, null, 2)}\n`;
  const close = Object.hasOwn(parsed, "requires") ? trailing + 1 : before.lastIndexOf("}");
  const body = before.slice(0, close).replace(/[\s,]*$/u, "");
  const rows = stamped.requires.map((row) => `    ${JSON.stringify(row).replaceAll(":", ": ").replaceAll(",", ", ").replaceAll("{", "{ ").replaceAll("}", " }")}`).join(",\n");
  return `${body},\n  "requires": [\n${rows}\n  ]\n}\n`;
}

async function main(files: readonly string[]): Promise<number> {
  if (files.length === 0) { console.error("usage: make pack-stamp FILE=<path-to-pack.json>"); return 2; }
  const root = resolve(process.env.TABIYA_ROOT ?? process.cwd());
  const shapes = await ShapeRegistry.loadDefault(resolve(root, "content/shapes"));
  const principles = await PrincipleRegistry.loadDefault(resolve(root, "content/principles"));
  for (const file of files) {
    const path = resolve(root, file);
    const before = readFileSync(path, "utf8");
    const parsed = JSON.parse(before) as Record<string, unknown>;
    const stamped = withDerivedRequires(parsed, { shapes, principles });
    const after = layout(before, parsed, stamped);
    if (after !== before) writeFileSync(path, after);
    console.log(`pack-stamp: ${file} ${after === before ? "unchanged" : "stamped"} (${stamped.requires.length} capabilities)`);
  }
  return 0;
}

const invoked = process.argv[1] !== undefined && /pack-stamp\.js$/u.test(process.argv[1]);
if (invoked) process.exitCode = await main(process.argv.slice(2));
