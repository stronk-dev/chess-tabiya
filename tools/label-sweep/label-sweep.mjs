// `make label-sweep` — rfc/evidence-presentation.md §8.1 (criteria 4, 9, 10).
//
// Static arm of rule 6e. Over every `.svelte` under apps/web/src: blank <script>/<style> blocks and
// tag interiors (line numbers preserved), then flag
//   (a) every text-node mustache whose expression is a member chain ending in an id-, kind-, state-,
//       role-, reason-, mode-, status-, scope-, origin- or sign-shaped segment (`{node.objectiveState}`),
//   (b) every JSON.stringify inside a markup mustache (text or attribute) — criterion 10;
// and over every `.ts`/`.svelte` under apps/web/src outside apps/web/src/lib/labels/:
//   (c) every `replaceAll("_", " ")` / `replace(/_/g, " ")` de-underscore site — criterion 9.
// Output is `file:line: expression`, and the run fails unless it is SET-EQUAL to the allowlist
// (tools/label-sweep/allowlist.txt), which ships empty. The instrument is defeatable by a template
// literal or an intermediate variable (§6e); the registry's totality and the runtime guard are the
// other two arms.
import { readdir, readFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";

const repoRoot = resolve(import.meta.dirname, "../..");
export const DEFAULT_SCAN_ROOT = "apps/web/src";
export const LABELS_DIRECTORY = "apps/web/src/lib/labels/";
export const DEFAULT_ALLOWLIST = "tools/label-sweep/allowlist.txt";

const SHAPE_WORDS = ["id", "ids", "kind", "state", "role", "reason", "mode", "status", "scope", "origin", "sign"];
const MEMBER_CHAIN = /^[A-Za-z_$][\w$]*(?:\??\.[A-Za-z_$][\w$]*|\[[^\]]*\]|!)*$/u;

/** Index of the first top-level occurrence of any of `tokens` in `text`, skipping strings and brackets. */
function topLevelIndex(text, test) {
  let depth = 0;
  let quote = null;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quote !== null) {
      if (char === "\\") index += 1;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'" || char === "`") quote = char;
    else if ("([{".includes(char)) depth += 1;
    else if (")]}".includes(char)) depth -= 1;
    else if (depth === 0) {
      const width = test(text, index);
      if (width > 0) return { index, width };
    }
  }
  return undefined;
}

const isTernaryQuestion = (text, index) => (text[index] === "?" && text[index + 1] !== "." && text[index + 1] !== "?" && text[index - 1] !== "?" ? 1 : 0);
const isFallback = (text, index) => (text.startsWith("??", index) || text.startsWith("||", index) ? 2 : 0);

/**
 * The operands a mustache can render: ternary branches and `??`/`||` fallbacks are followed, so
 * `{consequence?.objectiveState ?? "unknown"}` renders the chain it falls back from.
 */
export function renderedOperands(expression) {
  let text = expression.trim();
  // Strip wrapping parentheses only when the first `(` closes at the last character.
  while (text.startsWith("(") && text.endsWith(")") && readMustache(text.replaceAll("(", "{").replaceAll(")", "}"), 0) === text.length) {
    text = text.slice(1, -1).trim();
  }
  const question = topLevelIndex(text, isTernaryQuestion);
  if (question !== undefined) {
    const rest = text.slice(question.index + 1);
    let nested = 0;
    const colon = topLevelIndex(rest, (value, index) => {
      if (isTernaryQuestion(value, index)) nested += 1;
      else if (value[index] === ":") {
        if (nested === 0) return 1;
        nested -= 1;
      }
      return 0;
    });
    if (colon !== undefined) return [...renderedOperands(rest.slice(0, colon.index)), ...renderedOperands(rest.slice(colon.index + 1))];
  }
  const fallback = topLevelIndex(text, isFallback);
  if (fallback !== undefined) return [...renderedOperands(text.slice(0, fallback.index)), ...renderedOperands(text.slice(fallback.index + fallback.width))];
  return [text];
}

/** True when any rendered operand of a mustache is a member chain ending in an enum/id-shaped segment. */
export function isEnumShapedExpression(expression) {
  return renderedOperands(expression).some((operand) => isEnumShapedChain(operand) || templateInterpolations(operand).some(isEnumShapedExpression));
}

/** The `${…}` interpolations of a whole-operand template literal (one level; nested braces skipped). */
function templateInterpolations(operand) {
  if (!operand.startsWith("`") || !operand.endsWith("`")) return [];
  return [...operand.matchAll(/\$\{([^{}]*)\}/gu)].map((match) => match[1]);
}

function isEnumShapedChain(expression) {
  const text = expression.trim();
  if (!MEMBER_CHAIN.test(text)) return false;
  const segments = text.replace(/\[[^\]]*\]|!/gu, "").split(/\??\./u);
  const last = segments.at(-1);
  if (SHAPE_WORDS.includes(last.toLowerCase())) return true;
  return SHAPE_WORDS.some((word) => new RegExp(`[a-z0-9]${word[0].toUpperCase()}${word.slice(1)}$`, "u").test(last) || new RegExp(`_${word}$`, "u").test(last));
}

const blank = (text) => text.replace(/[^\n]/gu, " ");

/** Blank <script>/<style> bodies (keeping newlines) so the remaining text is markup. */
export function stripBlocks(source) {
  return source.replace(/<(script|style)\b[\s\S]*?<\/\1\s*>/giu, blank);
}

/** Read a JS-ish expression from `{` at `start`; returns the index just past its closing `}`. */
function readMustache(text, start) {
  let depth = 0;
  let quote = null;
  for (let index = start; index < text.length; index += 1) {
    const char = text[index];
    if (quote !== null) {
      if (char === "\\") index += 1;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'" || char === "`") quote = char;
    else if (char === "{") depth += 1;
    else if (char === "}") {
      depth -= 1;
      if (depth === 0) return index + 1;
    }
  }
  return text.length;
}

/**
 * Split markup into text-node mustaches and attribute mustaches, with 1-based lines. Tag interiors
 * are scanned for attribute mustaches only; comments are skipped; `{#…}`/`{:…}`/`{/…}`/`{@…}` blocks
 * are control flow, not text nodes.
 */
export function markupMustaches(source) {
  const markup = stripBlocks(source);
  const found = [];
  const lineAt = (index) => markup.slice(0, index).split("\n").length;
  let index = 0;
  while (index < markup.length) {
    const char = markup[index];
    if (markup.startsWith("<!--", index)) {
      const end = markup.indexOf("-->", index);
      index = end < 0 ? markup.length : end + 3;
    } else if (char === "<" && /[A-Za-z/!]/u.test(markup[index + 1] ?? "")) {
      let cursor = index + 1;
      let quote = null;
      while (cursor < markup.length) {
        const inner = markup[cursor];
        if (quote !== null) {
          if (inner === quote) quote = null;
          cursor += 1;
        } else if (inner === '"' || inner === "'") {
          quote = inner;
          cursor += 1;
        } else if (inner === "{") {
          const end = readMustache(markup, cursor);
          const attribute = /([\w:|.-]+)\s*=\s*["']?$/u.exec(markup.slice(index, cursor))?.[1] ?? "";
          found.push({ context: "attribute", attribute, line: lineAt(cursor), expression: markup.slice(cursor + 1, end - 1) });
          cursor = end;
        } else if (inner === ">") break;
        else cursor += 1;
      }
      index = cursor + 1;
    } else if (char === "{") {
      const end = readMustache(markup, index);
      const expression = markup.slice(index + 1, end - 1);
      if (!/^\s*[#:/@]/u.test(expression)) found.push({ context: "text", line: lineAt(index), expression });
      else if (/^\s*@html\b/u.test(expression)) found.push({ context: "text", line: lineAt(index), expression: expression.replace(/^\s*@html\s+/u, "") });
      index = end;
    } else index += 1;
  }
  return found;
}

const DE_UNDERSCORE = [
  /\.replaceAll\(\s*(["'`])_\1\s*,\s*(["'`]) \2\s*\)/u,
  /\.replace\(\s*\/_\/g[a-z]*\s*,\s*(["'`]) \1\s*\)/u,
  /\.split\(\s*(["'`])_\1\s*\)\s*\.join\(\s*(["'`]) \2\s*\)/u,
];

/**
 * A mustache renders learner-visible text unless it is an event handler, a directive (`bind:`,
 * `use:`, `class:`, …) or a `data-*` attribute; spread and shorthand attributes count as visible.
 */
export function rendersText(mustache) {
  if (mustache.context === "text") return true;
  return !/^(on[a-z]+|[a-z]+:.+|data-.+)$/u.test(mustache.attribute ?? "");
}

/** Findings for one file's text, as `path:line: expression` strings. */
export function sweepSource(path, source) {
  const findings = [];
  if (path.endsWith(".svelte")) {
    for (const mustache of markupMustaches(source)) {
      const expression = mustache.expression.trim().replace(/\s+/gu, " ");
      if (mustache.context === "text" && isEnumShapedExpression(expression)) findings.push(`${path}:${mustache.line}: {${expression}}`);
      else if (/\bJSON\.stringify\b/u.test(expression) && rendersText(mustache)) findings.push(`${path}:${mustache.line}: {${expression}}`);
    }
  }
  if (!path.startsWith(LABELS_DIRECTORY)) {
    source.split("\n").forEach((line, offset) => {
      for (const pattern of DE_UNDERSCORE) {
        const match = pattern.exec(line);
        if (match !== null) findings.push(`${path}:${offset + 1}: ${match[0].slice(1)}`);
      }
    });
  }
  return findings;
}

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(path));
    else if (/\.(svelte|ts)$/u.test(entry.name)) files.push(path);
  }
  return files.sort();
}

/** Sweep every `.svelte`/`.ts` under `scanRoot` (relative to `root`). */
export async function sweep({ root = repoRoot, scanRoot = DEFAULT_SCAN_ROOT } = {}) {
  const files = await listFiles(resolve(root, scanRoot));
  const findings = [];
  const paths = [];
  for (const file of files) {
    const path = relative(root, file).split("\\").join("/");
    paths.push(path);
    findings.push(...sweepSource(path, await readFile(file, "utf8")));
  }
  return { files: files.length, paths, findings };
}

export function parseAllowlist(text) {
  return text.split("\n").map((line) => line.trim()).filter((line) => line !== "" && !line.startsWith("#"));
}

/** Set-equality of findings against the allowlist; returns the two differences. */
export function compareToAllowlist(findings, allowlist) {
  const found = new Set(findings);
  const allowed = new Set(allowlist);
  return {
    unexpected: [...found].filter((finding) => !allowed.has(finding)),
    stale: [...allowed].filter((entry) => !found.has(entry)),
  };
}

async function main() {
  const { files, findings } = await sweep();
  const allowlist = parseAllowlist(await readFile(resolve(repoRoot, DEFAULT_ALLOWLIST), "utf8"));
  const { unexpected, stale } = compareToAllowlist(findings, allowlist);
  if (process.argv.includes("--list")) for (const finding of findings) console.log(finding);
  if (unexpected.length > 0 || stale.length > 0) {
    for (const finding of unexpected) console.error(`label-sweep: not allowlisted: ${finding}`);
    for (const entry of stale) console.error(`label-sweep: allowlist entry no longer found: ${entry}`);
    console.error(`label-sweep: FAIL — ${unexpected.length} unexpected, ${stale.length} stale over ${files} files`);
    process.exitCode = 1;
    return;
  }
  console.log(`label-sweep: ok — ${files} files, ${findings.length} findings, set-equal to the allowlist (${allowlist.length} entries)`);
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
