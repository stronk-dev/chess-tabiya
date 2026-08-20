import { createHmac } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { performance } from "node:perf_hooks";

const ROOT = process.cwd();
const OUT = "/private/tmp/tabiya-r4-knowledge";
const ENV_PATH = "/Users/stronk/frameworks/monorepo/.env";
const SKIPPER = process.env.TABIYA_SKIPPER_URL || "http://127.0.0.1:18028";
const TENANT = "a8f29b26-39ab-4f0e-9c9f-8b17e0080420";
const USER = "a13cf090-b29e-425b-985a-6bd71e2ce491";
const MIN_VECTOR = 0.3;

function parseEnv(text) {
  const out = {};
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const at = line.indexOf("=");
    if (at < 1) continue;
    let value = line.slice(at + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    out[line.slice(0, at)] = value;
  }
  return out;
}

function b64url(value) {
  return Buffer.from(value).toString("base64url");
}

function jwt(secret) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = b64url(JSON.stringify({ user_id: USER, tenant_id: TENANT, email: "tabiya-r4@invalid.example", role: "service", roles: ["service"], iat: now, exp: now + 7200 }));
  const body = `${header}.${payload}`;
  return `${body}.${createHmac("sha256", secret).update(body).digest("base64url")}`;
}

function words(value) {
  return value.toLowerCase().match(/[a-z0-9]+/g) || [];
}

function lexical(query, text) {
  const q = [...new Set(words(query).filter((w) => w.length > 2))];
  if (!q.length) return 0;
  const hay = new Set(words(text));
  return q.filter((term) => hay.has(term)).length / q.length;
}

function cosine(a, b) {
  let dot = 0;
  let aa = 0;
  let bb = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    aa += a[i] * a[i];
    bb += b[i] * b[i];
  }
  return dot / Math.sqrt(aa * bb);
}

function dedupe(items, limit = 20) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
    if (out.length >= limit) break;
  }
  return out;
}

function rankExact(query, passages) {
  const q = query.toLowerCase();
  return passages
    .map((p) => ({ id: p.id, text: p.text, score: p.keys.reduce((best, key) => key.length >= 3 && q.includes(key) ? Math.max(best, Math.min(1, key.length / 24)) : best, 0) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
}

function rankLexical(query, passages) {
  return passages.map((p) => ({ id: p.id, text: p.text, score: lexical(query, `${p.title}\n${p.text}`) })).filter((x) => x.score > 0).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
}

function rankVector(vector, docs) {
  return docs.map((doc) => ({ ...doc, score: cosine(vector, doc.vector) })).filter((x) => x.score > MIN_VECTOR).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
}

function rankHybrid(query, vector, docs, passages) {
  const exact = rankExact(query, passages);
  const exactIDs = new Set(exact.map((x) => x.id));
  const population = exactIDs.size ? docs.filter((doc) => exactIDs.has(doc.id)) : docs;
  return population.map((doc) => ({ ...doc, score: 0.7 * cosine(vector, doc.vector) + 0.3 * lexical(query, doc.text) })).filter((x) => x.score > 0.7 * MIN_VECTOR).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
}

async function mapConcurrent(values, concurrency, fn) {
  const out = new Array(values.length);
  let next = 0;
  async function worker() {
    for (;;) {
      const index = next++;
      if (index >= values.length) return;
      out[index] = await fn(values[index], index);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  return out;
}

async function postJSON(url, body, headers = {}) {
  const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body) });
  const text = await response.text();
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}: ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : {};
}

async function embed(env, inputs) {
  const baseURL = (env.EMBEDDING_API_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const endpoint = `${baseURL}/embeddings`;
  const batches = [];
  for (let i = 0; i < inputs.length; i += 80) batches.push(inputs.slice(i, i + 80));
  const vectors = [];
  for (const batch of batches) {
    const response = await postJSON(endpoint, { model: env.EMBEDDING_MODEL, input: batch }, { authorization: `Bearer ${env.EMBEDDING_API_KEY}` });
    vectors.push(...response.data.sort((a, b) => a.index - b.index).map((item) => item.embedding));
  }
  return vectors;
}

async function rerank(env, query, candidates) {
  if (!candidates.length) return [];
  const endpoint = `${env.RERANKER_API_URL.replace(/\/$/, "")}/rerank`;
  const response = await postJSON(endpoint, { model: env.RERANKER_MODEL, query, documents: candidates.map((x) => x.text) }, { authorization: `Bearer ${env.RERANKER_API_KEY}` });
  const rows = response.results?.length ? response.results : response.data || [];
  return rows.map((row) => ({ ...candidates[row.index], score: row.relevance_score ?? row.score ?? 0 })).sort((a, b) => b.score - a.score);
}

function psql(env, sql) {
  return execFileSync("docker", ["exec", "frameworks-postgres", "psql", "-U", env.POSTGRES_USER, "-d", env.POSTGRES_DB, "-At", "-c", sql], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
}

function exportContext(env) {
  const sql = `SELECT json_build_object('id', split_part(source_url, '#tabiya-r4-', 2), 'text', chunk_text, 'vector', embedding::text, 'metadata', metadata)::text FROM skipper.skipper_knowledge WHERE tenant_id='${TENANT}' ORDER BY source_url, chunk_index;`;
  return psql(env, sql).trim().split("\n").filter(Boolean).map((line) => {
    const row = JSON.parse(line);
    return { id: row.id, text: row.text, vector: JSON.parse(row.vector), metadata: row.metadata };
  });
}

function metrics(gold, rankings) {
  const answerable = gold.filter((q) => q.eligible.length);
  const negatives = gold.filter((q) => !q.eligible.length);
  let at1 = 0;
  let at5 = 0;
  let badTop = 0;
  for (const q of answerable) {
    const ids = (rankings[q.id] || []).map((x) => x.id);
    if (q.eligible.includes(ids[0])) at1 += 1;
    if (ids.slice(0, 5).some((id) => q.eligible.includes(id))) at5 += 1;
    if (ids[0] && !q.eligible.includes(ids[0])) badTop += 1;
  }
  const abstained = negatives.filter((q) => !(rankings[q.id] || []).length).length;
  return {
    recallAt1: at1 / answerable.length,
    recallAt5: at5 / answerable.length,
    ineligibleTop1: badTop / answerable.length,
    hardNegativeAbstention: abstained / negatives.length,
    answerable: answerable.length,
    negatives: negatives.length,
  };
}

const env = parseEnv(await readFile(ENV_PATH, "utf8"));
for (const key of ["JWT_SECRET", "EMBEDDING_API_KEY", "EMBEDDING_MODEL", "RERANKER_API_KEY", "RERANKER_API_URL", "RERANKER_MODEL", "POSTGRES_USER", "POSTGRES_DB"]) {
  if (!env[key]) throw new Error(`missing ${key}`);
}
const corpus = JSON.parse(await readFile(path.join(OUT, "corpus.json"), "utf8"));
const gold = JSON.parse(await readFile(path.join(OUT, "gold-queries.json"), "utf8"));
const token = jwt(env.JWT_SECRET);

const startIngest = performance.now();
const ingested = await mapConcurrent(corpus.passages, 4, async (passage) => {
  const source = passage.sourceUrl.startsWith("http") ? passage.sourceUrl : `https://github.com/example/tabiya/blob/research/${passage.sourceUrl}`;
  return postJSON(`${SKIPPER}/api/skipper/admin/pages`, {
    tenant_id: TENANT,
    url: `${source}#tabiya-r4-${passage.id}`,
    title: passage.title,
    content: passage.text,
  }, { authorization: `Bearer ${token}` });
});
const ingestMs = performance.now() - startIngest;

const contextDocs = exportContext(env);
if (!contextDocs.length) throw new Error("Skipper ingested no contextual chunks");
const rawVectors = await embed(env, corpus.passages.map((p) => p.text));
const queryVectors = await embed(env, gold.map((q) => q.query));
const rawDocs = corpus.passages.map((p, i) => ({ id: p.id, text: p.text, vector: rawVectors[i] }));

const rankings = { exact: {}, fts: {}, baseline: {}, vector: {}, hybrid: {}, reranked: {}, contextual: {} };
const latencies = Object.fromEntries(Object.keys(rankings).map((arm) => [arm, []]));
for (let i = 0; i < gold.length; i += 1) {
  const q = gold[i];
  let t = performance.now();
  rankings.exact[q.id] = rankExact(q.query, corpus.passages);
  latencies.exact.push(performance.now() - t);
  t = performance.now();
  rankings.fts[q.id] = rankLexical(q.query, corpus.passages);
  latencies.fts.push(performance.now() - t);
  t = performance.now();
  const lexicalByID = new Map(rankings.fts[q.id].map((x) => [x.id, x]));
  const exactByID = new Map(rankings.exact[q.id].map((x) => [x.id, x]));
  const baselineIDs = new Set([...lexicalByID.keys(), ...exactByID.keys()]);
  rankings.baseline[q.id] = [...baselineIDs].map((id) => {
    const lexicalRow = lexicalByID.get(id);
    const exactRow = exactByID.get(id);
    return { id, text: lexicalRow?.text || exactRow.text, score: (lexicalRow?.score || 0) + (exactRow ? 2 + exactRow.score : 0) };
  }).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  latencies.baseline.push(performance.now() - t);
  t = performance.now();
  rankings.vector[q.id] = rankVector(queryVectors[i], rawDocs);
  latencies.vector.push(performance.now() - t);
  t = performance.now();
  rankings.hybrid[q.id] = rankHybrid(q.query, queryVectors[i], rawDocs, corpus.passages);
  latencies.hybrid.push(performance.now() - t);
}

const reranked = await mapConcurrent(gold, 4, async (q, i) => {
  const t = performance.now();
  const value = await rerank(env, q.query, rankings.hybrid[q.id].slice(0, 15));
  latencies.reranked[i] = performance.now() - t;
  return value;
});
const contextual = await mapConcurrent(gold, 4, async (q, i) => {
  const t = performance.now();
  const candidates = dedupe(rankHybrid(q.query, queryVectors[i], contextDocs, corpus.passages), 15);
  const value = dedupe(await rerank(env, q.query, candidates), 20);
  latencies.contextual[i] = performance.now() - t;
  return value;
});
for (let i = 0; i < gold.length; i += 1) {
  rankings.reranked[gold[i].id] = reranked[i];
  rankings.contextual[gold[i].id] = contextual[i];
}

const hnswControl = [];
for (let i = 0; i < Math.min(12, gold.length); i += 1) {
  const vector = `[${queryVectors[i].join(",")}]`;
  const sql = `SELECT split_part(source_url, '#tabiya-r4-', 2) FROM skipper.skipper_knowledge WHERE tenant_id='${TENANT}' AND 1-(embedding <=> '${vector}'::vector) > ${MIN_VECTOR} ORDER BY embedding <=> '${vector}'::vector LIMIT 30;`;
  const approximate = [...new Set(psql(env, sql).trim().split("\n").filter(Boolean))].slice(0, 5);
  const exact = dedupe(rankVector(queryVectors[i], contextDocs), 5).map((x) => x.id);
  hnswControl.push({ query: gold[i].id, sameTop5: JSON.stringify(approximate) === JSON.stringify(exact), approximate, exact });
}

const first = corpus.passages[0];
const editMarker = "TAB-IYA-R4-SOURCE-EDIT-CONTROL";
await postJSON(`${SKIPPER}/api/skipper/admin/pages`, {
  tenant_id: TENANT,
  url: `${first.sourceUrl}#tabiya-r4-${first.id}`,
  title: first.title,
  content: `${first.text}\n\n${editMarker}: replacement source version.`,
}, { authorization: `Bearer ${token}` });
const editRows = Number(psql(env, `SELECT count(*) FROM skipper.skipper_knowledge WHERE tenant_id='${TENANT}' AND source_url LIKE '%#tabiya-r4-${first.id}' AND chunk_text LIKE '%${editMarker}%';`).trim());
const staleRows = Number(psql(env, `SELECT count(*) FROM skipper.skipper_knowledge WHERE tenant_id='${TENANT}' AND source_url LIKE '%#tabiya-r4-${first.id}' AND chunk_text NOT LIKE '%${editMarker}%';`).trim());

const metadataFields = new Set(contextDocs.flatMap((doc) => Object.keys(doc.metadata || {})));
const provenanceFields = ["licence", "revision", "source_digest", "chunk_digest", "span"];
const provenanceComplete = provenanceFields.every((field) => metadataFields.has(field));
const modelIdentityStored = ["embedding_model", "embedding_model_id", "embedding_provider"].some((field) => metadataFields.has(field));

const percentile = (values, p) => [...values].sort((a, b) => a - b)[Math.min(values.length - 1, Math.floor(values.length * p))] || 0;
const aggregate = {};
for (const arm of Object.keys(rankings)) {
  aggregate[arm] = { ...metrics(gold, rankings[arm]), latencyMedianMs: percentile(latencies[arm], 0.5), latencyP95Ms: percentile(latencies[arm], 0.95) };
}
const semanticBest = ["vector", "hybrid", "reranked", "contextual"].sort((a, b) =>
  aggregate[b].recallAt5 - aggregate[a].recallAt5 ||
  aggregate[a].ineligibleTop1 - aggregate[b].ineligibleTop1 ||
  aggregate[b].hardNegativeAbstention - aggregate[a].hardNegativeAbstention
)[0];
const checks = {
  recallGain10pp: aggregate[semanticBest].recallAt5 - aggregate.baseline.recallAt5 >= 0.1,
  ineligibleTop1AtMost2pct: aggregate[semanticBest].ineligibleTop1 <= 0.02,
  hardNegativeAbstention90pct: aggregate[semanticBest].hardNegativeAbstention >= 0.9,
  sourceEditInvalidation: editRows > 0 && staleRows === 0,
  modelChangeInvalidation: modelIdentityStored,
  provenanceReproduction: provenanceComplete,
  exactVsHnsw: hnswControl.every((row) => row.sameTop5),
};
const output = {
  schema: "tabiya.r4.knowledge-results.v1",
  corpus: { passages: corpus.passages.length, contextualChunks: contextDocs.length, queries: gold.length, ingestedChunks: ingested.reduce((n, row) => n + (row.chunks || 0), 0), ingestMs },
  providers: { embeddingModel: env.EMBEDDING_MODEL, rerankerModel: env.RERANKER_MODEL, contextualRetrieval: true },
  aggregate,
  semanticBest,
  checks,
  gateClears: Object.values(checks).every(Boolean),
  hnswControl,
  rawTopIds: Object.fromEntries(Object.entries(rankings).map(([arm, byQuery]) => [arm, Object.fromEntries(Object.entries(byQuery).map(([id, rows]) => [id, rows.slice(0, 5).map((x) => x.id)]))])),
};
await writeFile(path.join(OUT, "raw-results.json"), `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify({ corpus: output.corpus, aggregate, semanticBest, checks, gateClears: output.gateClears }, null, 2));
