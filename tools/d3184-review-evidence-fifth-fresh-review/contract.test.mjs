import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const subjectPath = new URL("../d3109-review-evidence-fourth-author-repair/contract.test.ts", import.meta.url);
const sourceText = readFileSync(subjectPath, "utf8");
const source = ts.createSourceFile(subjectPath.pathname, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

function namedFunction(name) {
  let found;
  const visit = (node) => {
    if (ts.isFunctionDeclaration(node) && node.name?.text === name) found = node;
    ts.forEachChild(node, visit);
  };
  visit(source);
  assert.ok(found, `missing function ${name}`);
  return found.getText(source);
}

function classMethod(className, methodName) {
  let found;
  const visit = (node) => {
    if (ts.isClassDeclaration(node) && node.name?.text === className) {
      found = node.members.find((member) => ts.isMethodDeclaration(member) && member.name.getText(source) === methodName);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  assert.ok(found, `missing ${className}.${methodName}`);
  return found.getText(source);
}

test("D3184: the family fold selects one adapter and hard-codes one item", () => {
  const body = namedFunction("compileReviewEvidence");
  assert.match(body, /atNode\.find\(\(candidate\) => candidate\.family === family\)/u);
  assert.match(body, /kind: "available", itemCount: 1/u);

  const twoAvailableSiblingAdapters = [{ family: "semantic" }, { family: "semantic" }];
  const reported = twoAvailableSiblingAdapters.find((candidate) => candidate.family === "semantic") === undefined ? 0 : 1;
  assert.equal(reported, 1);
  assert.equal(twoAvailableSiblingAdapters.length, 2);
});

test("D3185: declared adapter grain does not participate in the invocation plan", () => {
  const body = namedFunction("compileReviewEvidence");
  assert.match(body, /path\.flatMap\(\(node\) => SOURCE_ADAPTERS\.map/u);
  assert.doesNotMatch(body, /adapter\.input/u);

  const root = { id: "root", incomingMove: null };
  const edgeAdapter = { id: "review.recorded-edge@1", input: "edge" };
  const currentPlan = [root].flatMap((node) => [edgeAdapter].map((adapter) => `${adapter.id}\0${node.id}`));
  assert.deepEqual(currentPlan, ["review.recorded-edge@1\0root"]);
});

test("D3186: started cancellation deletes the attempt record", () => {
  const cancel = classMethod("ReviewAttemptOutcomeStore", "acquire");
  assert.match(cancel, /const cancel = \(\) => \{[\s\S]*this\.#entries\.delete\(key\)/u);
  assert.doesNotMatch(cancel, /started/u);

  const attempts = new Map();
  for (let index = 0; index < 5; index += 1) {
    attempts.set("request", 1);
    attempts.delete("request");
  }
  assert.equal(attempts.size, 0, "the published model permits every cancelled request to reacquire as attempt one");
});

test("D3187: prefix derivation accepts gaps, omits path bytes and ignores branch membership", () => {
  const body = namedFunction("authorizeReviewRecordedPrefix");
  assert.match(body, /event\.seq > highest\.seq/u);
  assert.doesNotMatch(body, /contiguous/u);
  assert.match(body, /prefixDigest: digest\("review-prefix-events\.v1", input\.run\.events/u);
  assert.doesNotMatch(body, /prefixDigest:[^\n]*path/u);
  assert.match(body, /find\(\(event\) => event\.kind === "outcome\.reached"\)/u);

  const events = [{ seq: 0, nodeId: "main" }, { seq: 2, nodeId: "sibling", kind: "outcome.reached" }];
  assert.equal(events.reduce((highest, event) => event.seq > highest ? event.seq : highest, -1), 2);
  assert.equal(events.find((event) => event.kind === "outcome.reached")?.nodeId, "sibling");
});

test("D3188: adapter parser names are inert strings while arbitrary payload is sealed", () => {
  const declare = namedFunction("declareEvidence");
  assert.match(declare, /payload: structuredClone\(payload\)/u);
  assert.doesNotMatch(declare, /adapter\.parser/u);
  assert.match(sourceText, /parser: "parseReviewEvalPoint"/u);
});

test("D3189: every proposed Story moment re-enters its own evidence node", () => {
  const render = namedFunction("renderReviewStoryReceipt");
  assert.match(render, /entryNodeId: node\.nodeId/u);
  const consequence = { nodeId: "after-blunder", parentId: "decision-before-blunder" };
  assert.notEqual(consequence.nodeId, consequence.parentId);
});
