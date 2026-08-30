// DISPOSABLE positive author contract — D1879-D1887. Not production code.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const rfc = readFileSync("rfc/theory-drill-current-joins.md", "utf8");

test("D1879: applicability reuses the literal implemented opening payload", () => {
  assert.match(rfc, /moves the literal `OpeningCatalogueRef`,\s+`CurrentOpeningEndpoint` and `OpeningCatalogueMembership` declarations/u);
  assert.match(rfc, /Extract<CurrentOpeningEndpoint, \{kind: "matched"\}>/u);
  assert.match(rfc, /There is no fourth applicability-only opening summary/u);
  assert.match(rfc, /implementation landed at `44637013`/u);
});

test("D1880: the law-8 seal refuses editorial authority without erasing facts", () => {
  assert.match(rfc, /no score, similarity rank, confidence, generated explanation or raw\s+route/u);
  assert.match(rfc, /opening ply\/count fields and cited names describe what the registered producer found/u);
  assert.match(rfc, /`score:number` and `route:string` fail; `observedPly:number`/u);
});

test("D1881: bare principles and anchored occurrences are representable separately", () => {
  assert.match(rfc, /kind: "principle"/u);
  assert.match(rfc, /kind: "anchored_claim"/u);
  assert.match(rfc, /kind: "authored_claim"/u);
  assert.match(rfc, /without pretending a browsed principle fired/u);
});

test("D1882 and D1884: one literal authenticated operation recomputes authority", () => {
  assert.match(rfc, /POST \/runs\/\{runId\}\/branches\/\{branchId\}\/nodes\/\{nodeId\}\/applicability-targets\/\{targetId\}\/launch/u);
  assert.match(rfc, /The client supplies no identity bytes/u);
  assert.match(rfc, /recomputes the\s+complete `context:"run_node"` applicability result/u);
  assert.match(rfc, /`APPLICABILITY_STALE` as HTTP 409/u);
  assert.match(rfc, /Crossed source, identity and target requests all\s+fail/u);
});

test("D1883: Library starts and source-bound launches are disjoint", () => {
  assert.match(rfc, /context: "run_node"/u);
  assert.match(rfc, /context: "library"/u);
  assert.match(rfc, /Library pack actions do \*\*not\*\* call this endpoint/u);
  assert.match(rfc, /create no derivation/u);
});

test("D1885: durable derivations are checked at SQL and runtime boundaries", () => {
  assert.match(rfc, /CHECK \(\s*\(kind = 'flip_sides'/u);
  assert.match(rfc, /export type RunDerivation =\s*\| \{ readonly kind: "flip_sides"/u);
  assert.match(rfc, /\| \{ readonly kind: "theory_launch"/u);
  assert.match(rfc, /fail-closed reader parses\s+the exact unions/u);
  assert.match(rfc, /malformed\/non-canonical JSON/u);
});

test("D1886: recommendations retain exact multi-branch firing anchors", () => {
  assert.match(rfc, /anchors: readonly \{runId, branchId, nodeId, ply\}\[\]/u);
  assert.match(rfc, /two branches and two firings must\s+retain all four distinguishable anchors/u);
  assert.match(rfc, /server recomputes it; array order is therefore a\s+deterministic UX default, never provenance authority/u);
});

test("D1887: progression is explicit and remains owner-blocked", () => {
  assert.match(rfc, /\*\*Recommended ruling:\*\* a completed countable attempt/u);
  assert.match(rfc, /Following a\s+recommendation does not satisfy it by itself/u);
  assert.match(rfc, /not an owner ruling/u);
  assert.match(rfc, /acceptance-blocking after \[\[D1887\]\]/u);
});

test("author status does not claim acceptance or implementation", () => {
  assert.match(rfc, /Fresh\s+independent review is required/u);
  assert.match(rfc, /no implementation is authorised/u);
  assert.doesNotMatch(rfc.split("\n").slice(0, 8).join("\n"), /\baccepted\b|\bimplementing\b/u);
});
