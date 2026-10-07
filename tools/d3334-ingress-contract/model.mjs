// Disposable RFC-0000 authoring model for D3334/D3335. Never imported by production.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

export const REPORT = "planning/safe-deployment-profiles/ingress-budget-repair-2026-10-07.md";
export const LIMITS = Object.freeze({ none: 0, json_256k: 256 * 1024, document_8m: 8 * 1024 * 1024, account_32m: 32 * 1024 * 1024 });
const NONE = new Set(["shared.join_accept", "repertoire.delete", "run.share_revoke", "run_action.hint_cancel"]);
const DOCUMENT = new Set(["shape_draft.create", "shape_draft.update", "shape_draft.lint", "repertoire.create", "pack_draft.create", "pack_draft.update", "pack_draft.lint", "pack_draft.playtest", "run.import", "live.leg.import_pgn"]);
const ACCOUNT = new Set(["auth.import", "auth.import_preview"]);

function expandNames(value) {
  return [...value.matchAll(/`([a-z_]+(?:\.[a-z_]+)*)(?:\.\{([^}]+)\})?`/gu)].flatMap(match =>
    match[2] === undefined ? [match[1]] : match[2].split(",").map(name => `${match[1]}.${name.trim()}`));
}
function expandPaths(value) {
  const match = /\{([^}]+)\}/u.exec(value);
  return match === null ? [value] : match[1].split(",").map(name => value.replace(match[0], name));
}
export function tableRows(text = readFileSync(REPORT, "utf8")) {
  return text.split("\n").filter(line => /^\| (?:POST|PUT|DELETE) \|/u.test(line)).map(line => {
    const cells = line.split("|").slice(1, -1).map(value => value.trim());
    assert.equal(cells.length, 6, "Malformed source-census table row");
    const paths = expandPaths(cells[1].slice(1, -1)), ids = expandNames(cells[2]);
    assert(paths.length === 1 || paths.length === ids.length, "Crossed path/operation expansion");
    return ids.map((id, index) => Object.freeze({ method: cells[0], template: paths.length === 1 ? paths[0] : paths[index], id, budget: cells[4] }));
  }).flat();
}
export function draftIds(text = readFileSync("rfc/safe-deployment-profiles.md", "utf8")) {
  const start = text.indexOf("auth.{register,login,logout,export,deletion_preview,delete");
  const end = text.indexOf("Those identities bind", start);
  assert(start >= 0 && end > start, "Missing draft's explicit operation vocabulary");
  return [...text.slice(start, end).matchAll(/([a-z_]+(?:\.[a-z_]+)*)(?:\.\{([^}]+)\})?/gu)]
    .filter(match => match[0].includes(".") || match[2]).flatMap(match => match[2] === undefined
      ? [match[1]] : match[2].split(",").map(name => `${match[1]}.${name.trim()}`));
}
const expectedBudget = id => NONE.has(id) ? "none" : DOCUMENT.has(id) ? "document_8m" : ACCOUNT.has(id) ? "account_32m" : "json_256k";
const freeze = value => {
  if (value !== null && typeof value === "object") { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
};
export class AdmissionRefusal extends Error {
  constructor(code, status, detail = undefined) { super(code); this.code = code; this.status = status; this.detail = detail; }
}
const invalid = () => { throw new AdmissionRefusal("INVALID_REQUEST", 400); };
const stop = reader => { try { void reader.cancel().catch(() => {}); } catch {} };

/** Counts native chunks before retaining/decoding. No payload bytes beyond the limit are retained. */
export async function readRaw(request, maxBytes, tooLargeCode = "BODY_TOO_LARGE") {
  assert(Number.isSafeInteger(maxBytes) && maxBytes >= 0);
  const length = request.headers.get("content-length");
  if (length !== null && !/^(?:0|[1-9][0-9]*)$/u.test(length)) {
    if (request.body !== null) stop(request.body);
    invalid();
  }
  if (length !== null && (!Number.isSafeInteger(Number(length)) || Number(length) > maxBytes)) {
    if (request.body !== null) stop(request.body);
    throw new AdmissionRefusal(tooLargeCode, 413, { maxBytes });
  }
  if (request.signal.aborted) {
    if (request.body !== null) stop(request.body);
    request.signal.throwIfAborted();
  }
  if (request.body === null) return new Uint8Array();
  const reader = request.body.getReader(), chunks = [];
  let total = 0, abort;
  const aborted = new Promise((_, reject) => {
    abort = () => { stop(reader); reject(request.signal.reason); };
    request.signal.addEventListener("abort", abort, { once: true });
  });
  try {
    for (;;) {
      const next = await Promise.race([reader.read(), aborted]);
      request.signal.throwIfAborted();
      if (next.done) break;
      if (!(next.value instanceof Uint8Array)) invalid();
      total += next.value.byteLength;
      if (total > maxBytes) { stop(reader); throw new AdmissionRefusal(tooLargeCode, 413, { maxBytes }); }
      // Retain owned bytes, not a buffer the producer can mutate after enqueue.
      chunks.push(next.value.slice());
    }
    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    return bytes;
  } catch (error) {
    stop(reader);
    throw error;
  } finally {
    request.signal.removeEventListener("abort", abort);
    try { reader.releaseLock(); } catch {}
  }
}

function selector(group, body) {
  if (group.length === 1) {
    const requiredOp = ({ "classroom.archive": "archive", "assignment.withdraw": "withdraw",
      "progress.schedule_dismiss": "dismiss", "live.session.close": "close", "live.link.revoke": "revoke" })[group[0].id];
    if (requiredOp !== undefined && body.op !== requiredOp) invalid();
    return group[0];
  }
  const template = group[0].template, prefix = group[0].id.slice(0, group[0].id.lastIndexOf(".") + 1);
  let suffix;
  if (template.endsWith("/members")) suffix = `member_${body.op}`;
  else if (template.endsWith("/submissions")) suffix = body.op === undefined ? "submit" : body.op === "withdraw" ? "submission_withdraw" : undefined;
  else if (template.endsWith("/marks")) {
    if (body.rescopeFrom !== undefined && body.rescopeFrom !== "position" && body.rescopeFrom !== "branch") invalid();
    suffix = body.rescopeFrom === undefined ? "marks_replace" : "marks_rescope";
  } else if (template.endsWith("/moves")) {
    if (body.selection !== undefined) {
      if (body.selection === null || typeof body.selection !== "object" || Array.isArray(body.selection) || body.actor !== undefined || body.uci !== undefined) invalid();
      suffix = "move_opponent";
    } else { if (body.actor === "opponent") invalid(); suffix = "move_user"; }
  } else if (template.endsWith("/standing")) suffix = ({ showRating: "show_rating", hideRating: "hide_rating", showRecord: "show_record", hideRecord: "hide_record" })[body.op] ?? body.op;
  else suffix = body.op;
  const selected = group.find(row => row.id === `${prefix}${suffix}`);
  if (selected === undefined) invalid();
  return selected;
}

// Only the aliases explicitly repaired by the draft. This is not a read-only route census.
function refusedAlias(pathname, method) {
  const session = /^\/sessions\/[^/]+\/(journal|board|match|votes|invitations|links|proposals)(?:\/([^/]+))?(?:\/(pgn))?$/u.exec(pathname);
  if (session !== null && (session[3] !== undefined ||
      (session[2] !== undefined && !["links", "proposals"].includes(session[1])))) return true;
  const repertoire = /^\/repertoires\/[^/]+(?:\/(scan|gaps|answers))?(?:\/(enter))?$/u.exec(pathname);
  return repertoire !== null && ((repertoire[2] !== undefined && repertoire[1] !== "gaps") ||
    (method === "DELETE" && (repertoire[1] !== undefined || repertoire[2] !== undefined)));
}

export function compileModel(input = tableRows()) {
  const rows = input.map(row => ({ ...row })), expected = draftIds();
  assert.equal(rows.length, 112, "Incomplete/extra unsafe population");
  assert.equal(new Set(rows.map(row => row.id)).size, 112, "Duplicate semantic identity");
  assert.deepEqual(new Set(rows.map(row => row.id)), new Set(expected), "Crossed semantic population");
  // Freeze the independent table image too: a count-preserving path/method swap must fail.
  const canonical = new Map(tableRows().map(row => [row.id, row]));
  for (const row of rows) {
    assert.deepEqual(row, canonical.get(row.id), "Crossed route/method/semantic join");
    assert.equal(row.budget, expectedBudget(row.id), "Crossed semantic budget");
    assert(Object.hasOwn(LIMITS, row.budget), "Unknown budget");
  }
  freeze(rows);
  const groups = new Map();
  for (const row of rows) {
    const key = `${row.method} ${row.template}`;
    const group = groups.get(key) ?? []; group.push(row); groups.set(key, group);
  }
  const matchers = [...groups].map(([key, group]) => {
    const segments = group[0].template.split("/");
    const regex = new RegExp(`^${segments.map(segment => segment.startsWith(":")
      ? segment === ":requestId" ? "([0-9a-f]{32})" : "([^/]+)"
      : segment.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")).join("/")}$`, "u");
    return { key, group, regex, names: segments.filter(segment => segment.startsWith(":")).map(segment => segment.slice(1)), limit: Math.max(...group.map(row => LIMITS[row.budget])) };
  });
  const permits = new WeakMap();
  return Object.freeze({
    rows,
    async admit(request) {
      try {
      const pathname = new URL(request.url).pathname;
      if (refusedAlias(pathname, request.method)) invalid();
      const candidates = matchers.filter(matcher => matcher.regex.test(pathname));
      const matcher = candidates.find(value => value.group[0].method === request.method);
      if (matcher === undefined) {
        if (request.body !== null) stop(request.body);
        throw new AdmissionRefusal(candidates.length === 0 ? "NOT_FOUND" : "METHOD_NOT_ALLOWED", candidates.length === 0 ? 404 : 405);
      }
      const captures = matcher.regex.exec(pathname).slice(1), params = {};
      for (const [index, value] of captures.entries()) {
        try { params[matcher.names[index]] = decodeURIComponent(value); if (params[matcher.names[index]].length === 0) invalid(); } catch { invalid(); }
      }
      const encoding = request.headers.get("content-encoding");
      if (encoding !== null && encoding.toLowerCase() !== "identity") invalid();
      const pgn = matcher.group[0].id === "live.leg.import_pgn";
      if (pgn && params.leg !== "1" && params.leg !== "2") invalid();
      if (matcher.limit > 0 && !(pgn ? /^text\/x-chess-pgn(?:\s*;|$)/iu : /^application\/json(?:\s*;|$)/iu).test(request.headers.get("content-type") ?? "")) invalid();
      const code = matcher.group[0].budget === "account_32m" ? "ACCOUNT_IMPORT_TOO_LARGE" : "BODY_TOO_LARGE";
      const bytes = await readRaw(request, matcher.limit, code);
      let parsed = {};
      if (matcher.limit > 0) {
        try {
          const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
          parsed = pgn ? text : JSON.parse(text);
          if (!pgn && (parsed === null || typeof parsed !== "object" || Array.isArray(parsed))) invalid();
        } catch (error) { if (error instanceof AdmissionRefusal) throw error; invalid(); }
      }
      const operation = selector(matcher.group, parsed);
      request.signal.throwIfAborted();
      const permit = freeze({ operation, params, parsed, rawBytes: bytes.length });
      permits.set(permit, { request, used: false });
      return permit;
      } catch (error) {
        if (request.body !== null && !request.body.locked) stop(request.body);
        throw error;
      }
    },
    dispatch(permit, request, execute) {
      const owned = permits.get(permit);
      if (owned === undefined || owned.request !== request || owned.used) throw new AdmissionRefusal("UNADMITTED_OPERATION", 400);
      request.signal.throwIfAborted(); owned.used = true;
      return execute(permit);
    },
  });
}
